"""Alpaca market data client, trades -> 1-second bars, parquet cache and background prefetch."""
import asyncio
import logging
import shutil
import time
from dataclasses import dataclass, field
from pathlib import Path

import httpx
import numpy as np
import pandas as pd

log = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CACHE_DIR = DATA_DIR / "cache"
DATA_URL = "https://data.alpaca.markets/v2"
TRADING_URL = "https://paper-api.alpaca.markets/v2"
ET = "America/New_York"
COLS = ["o", "h", "l", "c", "v"]
MAX_SECOND_DAYS = 7   # 1-second days kept per ticker, on disk and in memory
# Sale conditions whose price must not move the chart (out of sequence, average price, derivatively
# priced, prior reference, contingent, official open/close re-prints, ...). Their volume still counts.
NO_PRICE_CONDITIONS = frozenset("479BCGHMNPQRTUVWZ")
HISTORY_DAYS = 730    # calendar days of daily bars before day 1


class AuthError(Exception):
    """Alpaca rejected the key (HTTP 401/403)."""


@dataclass
class Day:
    date: str             # YYYY-MM-DD
    open: pd.Timestamp    # regular session open, UTC
    close: pd.Timestamp   # regular session close, UTC (early closes included)


@dataclass
class Stock:
    ticker: str
    daily: pd.DataFrame | None = None
    minutes: pd.DataFrame | None = None           # regular-hours 1-minute bars
    seconds: dict = field(default_factory=dict)   # date -> 1-second bars
    fallback: set = field(default_factory=set)    # dates built from 1-minute bars


class TokenBucket:
    """At most `per_minute` requests in any minute: a small burst, then a steady refill."""

    def __init__(self, per_minute=200, burst=10):
        self.capacity = self.tokens = burst
        self.fill = (per_minute - burst) / 60
        self.last = time.monotonic()
        self.lock = asyncio.Lock()

    async def take(self):
        async with self.lock:
            while True:
                now = time.monotonic()
                self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.fill)
                self.last = now
                if self.tokens >= 1:
                    self.tokens -= 1
                    return
                await asyncio.sleep((1 - self.tokens) / self.fill)


def utc_z(ts):
    return pd.Timestamp(ts).tz_convert("UTC").strftime("%Y-%m-%dT%H:%M:%SZ")


def et_time(date, hhmm):
    return pd.Timestamp(f"{date} {hhmm}", tz=ET).tz_convert("UTC")


def empty_bars():
    return pd.DataFrame(columns=COLS + ["n"], index=pd.DatetimeIndex([], tz="UTC"), dtype=float)


def bar_frame(items):
    df = pd.DataFrame(items)
    df.index = pd.DatetimeIndex(pd.to_datetime(df.pop("t"), utc=True, format="ISO8601"))
    return df[COLS + ["n"]].astype(float)


def trade_frame(t, p, s, ok):
    return pd.DataFrame({"p": p, "s": s, "ok": ok}, index=pd.to_datetime(t, utc=True, format="ISO8601"))


class Alpaca:
    def __init__(self, key_id, secret, feed="iex"):
        self.feed = feed
        self.http = httpx.AsyncClient(timeout=30, headers={"APCA-API-KEY-ID": key_id, "APCA-API-SECRET-KEY": secret})
        self.bucket = TokenBucket()

    async def aclose(self):
        await self.http.aclose()

    async def get(self, url, params):
        """Rate-limited GET; rate-limit, server and network errors are retried with backoff."""
        for attempt in range(5):
            await self.bucket.take()
            try:
                r = await self.http.get(url, params=params)
            except httpx.TransportError:
                if attempt == 4:
                    raise
            else:
                if r.status_code in (401, 403):
                    raise AuthError(f"Alpaca returned HTTP {r.status_code}")
                if r.status_code != 429 and r.status_code < 500:
                    r.raise_for_status()
                    return r.json()
                if attempt == 4:
                    r.raise_for_status()
            await asyncio.sleep(2 ** attempt)

    async def calendar(self, start, end):
        rows = await self.get(f"{TRADING_URL}/calendar", {"start": start, "end": end})
        return [Day(r["date"], et_time(r["date"], r["open"]), et_time(r["date"], r["close"])) for r in rows]

    async def bars(self, symbols, timeframe, start, end):
        """{symbol: bars} between two timestamps (multi-symbol, paged)."""
        params = {"symbols": ",".join(symbols), "timeframe": timeframe, "start": utc_z(start), "end": utc_z(end),
                  "limit": 10000, "adjustment": "raw", "feed": self.feed}
        rows = {}
        while True:
            js = await self.get(f"{DATA_URL}/stocks/bars", params)
            for sym, items in (js.get("bars") or {}).items():
                rows.setdefault(sym, []).extend(items)
            if not js.get("next_page_token"):
                return {sym: bar_frame(items) for sym, items in rows.items()}
            params["page_token"] = js["next_page_token"]

    async def trades(self, symbol, start, end, on_page=None):
        """All trades between two timestamps: price, size and whether the price counts (`ok`).
        `on_page(count)` is awaited after each page."""
        params = {"start": utc_z(start), "end": utc_z(end), "limit": 10000, "feed": self.feed}
        t, p, s, ok = [], [], [], []
        while True:
            js = await self.get(f"{DATA_URL}/stocks/{symbol}/trades", params)
            for tr in js.get("trades") or []:
                t.append(tr["t"])
                p.append(tr["p"])
                s.append(tr["s"])
                ok.append(NO_PRICE_CONDITIONS.isdisjoint(tr.get("c") or ()))
            if on_page:
                await on_page(len(t))
            if not js.get("next_page_token"):
                return await asyncio.to_thread(trade_frame, t, p, s, ok)
            params["page_token"] = js["next_page_token"]


def fill_seconds(bars, day, prev_close):
    """Reindex to every second of the session; empty seconds repeat the last close with volume 0."""
    bars = bars.reindex(pd.date_range(day.open, day.close, freq="1s", inclusive="left"))
    bars["c"] = bars["c"].ffill().fillna(prev_close).bfill()
    for col in ("o", "h", "l"):
        bars[col] = bars[col].fillna(bars["c"])
    bars["v"] = bars["v"].fillna(0.0)
    return bars


def trades_to_seconds(trades, day, prev_close):
    """1-second OHLCV: prices from trades flagged `ok`, volume from all trades."""
    t = trades[(trades.index >= day.open) & (trades.index < day.close)]
    px = t.loc[t["ok"], "p"]
    g = px.groupby(px.index.floor("1s"))
    bars = pd.DataFrame({"o": g.first(), "h": g.max(), "l": g.min(), "c": g.last(),
                         "v": t["s"].groupby(t.index.floor("1s")).sum()})
    return fill_seconds(bars, day, prev_close)


def minutes_to_seconds(minutes, day, prev_close):
    """Fallback: each 1-minute bar appears at its last second, so nothing is revealed early."""
    m = minutes[COLS]
    return fill_seconds(m.set_axis(m.index + pd.Timedelta(seconds=59)), day, prev_close)


def regular_hours(df, days):
    mask = np.zeros(len(df), dtype=bool)
    for d in days:
        mask |= (df.index >= d.open) & (df.index < d.close)
    return df[mask]


class Cache:
    """Parquet files under data/cache/<session_id>/<ticker>/."""

    def __init__(self, session_id):
        self.root = CACHE_DIR / session_id

    def _path(self, ticker, name):
        return self.root / ticker / f"{name}.parquet"

    def save(self, ticker, name, df):
        path = self._path(ticker, name)
        path.parent.mkdir(parents=True, exist_ok=True)
        df.to_parquet(path)

    def load(self, ticker, name):
        path = self._path(ticker, name)
        return pd.read_parquet(path) if path.exists() else None

    def prune_seconds(self, ticker):
        for old in sorted((self.root / ticker).glob("sec_*.parquet"))[:-MAX_SECOND_DAYS]:
            old.unlink()

    def drop_ticker(self, ticker):
        shutil.rmtree(self.root / ticker, ignore_errors=True)

    @staticmethod
    def clear_all():
        shutil.rmtree(CACHE_DIR, ignore_errors=True)


class Prefetcher:
    """Background downloads that keep every stock ready for the current and the next trading day.

    `listener` gets `on_load(text, progress)` updates and `on_auth_error()`.
    """

    def __init__(self, session, client, listener):
        self.s, self.client, self.listener = session, client, listener

    async def run(self):
        while True:
            self.s.wake.clear()
            job = self.next_job()
            if job is None:
                await self.listener.on_load(None)
                await self.s.wake.wait()
                continue
            try:
                await job
            except AuthError:
                await self.listener.on_auth_error()
                return
            except Exception:
                log.exception("Download failed; retrying in 5 s")
                await self.listener.on_load("Download failed, retrying…")
                await asyncio.sleep(5)

    def next_job(self):
        s = self.s
        for st in s.stocks.values():
            if st.minutes is None:
                return self.load_history(st)
        upto = min(s.day_idx + 1, len(s.days) - 1)
        if s.minute_end < upto:
            return self.extend_minutes(upto)
        for day in s.days[s.day_idx: upto + 1]:
            for st in s.stocks.values():
                if day.date not in st.seconds:
                    return self.load_seconds(st, day)
        return None

    async def fetch_minutes(self, tickers, i, j):
        """Regular-hours 1-minute bars for trading days i..j, per ticker."""
        days = self.s.days[i: j + 1]
        got = await self.client.bars(tickers, "1Min", days[0].open, days[-1].close)
        return {t: regular_hours(got.get(t, empty_bars()), days) for t in tickers}

    async def load_history(self, st):
        s = self.s
        await self.listener.on_load(f"Downloading {st.ticker} history…")
        start = pd.Timestamp(s.days[s.first].date, tz="UTC") - pd.Timedelta(days=HISTORY_DAYS)
        daily = await self.client.bars([st.ticker], "1Day", start, s.days[s.first - 1].close)
        minutes = await self.fetch_minutes([st.ticker], 0, s.minute_end)
        st.daily, st.minutes = daily.get(st.ticker, empty_bars()), minutes[st.ticker]
        s.cache.save(st.ticker, "daily", st.daily)
        s.cache.save(st.ticker, "minutes", st.minutes)

    async def extend_minutes(self, upto):
        s = self.s
        await self.listener.on_load(f"Downloading 1-minute bars for {s.days[upto].date}…")
        new = await self.fetch_minutes(list(s.stocks), s.minute_end + 1, upto)
        for t, st in s.stocks.items():
            st.minutes = pd.concat([st.minutes, new[t]])
            s.cache.save(t, "minutes", st.minutes)
        s.minute_end = upto

    async def load_seconds(self, st, day):
        s, name = self.s, f"sec_{day.date}"
        label = f"Downloading {st.ticker} trades for {day.date}"
        await self.listener.on_load(label, 0.0)
        bars = s.cache.load(st.ticker, name)
        if bars is None:
            m = st.minutes
            day_minutes = m[(m.index >= day.open) & (m.index < day.close)]
            before = m.loc[m.index < day.open, "c"]
            prev_close = before.iloc[-1] if len(before) else float("nan")
            expected = max(day_minutes["n"].sum(), 1.0)  # trade count from the minute bars, for progress

            async def progress(count):
                await self.listener.on_load(label, min(count / expected, 1.0))

            try:
                trades = await self.client.trades(st.ticker, day.open, day.close, progress)
            except httpx.HTTPError:
                log.warning("Trade download failed for %s %s; using 1-minute bars", st.ticker, day.date)
                trades = None
            if trades is not None and len(trades):
                bars = await asyncio.to_thread(trades_to_seconds, trades, day, prev_close)
                s.cache.save(st.ticker, name, bars)
                s.cache.prune_seconds(st.ticker)
            else:
                bars = minutes_to_seconds(day_minutes, day, prev_close)
                st.fallback.add(day.date)
        st.seconds[day.date] = bars
        for old in sorted(st.seconds)[:-MAX_SECOND_DAYS]:
            del st.seconds[old]
