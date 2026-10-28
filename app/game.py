"""Game session (days, stocks, one shared replay clock) and the player's commands."""
import asyncio
import logging
import random
import string
import uuid

import httpx
import numpy as np

from . import universe
from .data import COLS, ET, AuthError, Cache, Prefetcher, Stock

log = logging.getLogger(__name__)

SPEEDS = (0, 1, 10, 60, 300)
TICK = 0.1           # seconds between clock pushes: at most 10 WebSocket messages per second
MAX_STOCKS = 5
SESSION_DAYS = 7


def rows(df):
    """Bars as [time, o, h, l, c, v]; time is ET wall-clock seconds so the chart shows market time."""
    t = df.index.tz_convert(ET).tz_localize(None).as_unit("s").asi8
    return np.column_stack([t, df[COLS].to_numpy()]).round(4).tolist()


def alias(n):
    """Display name of the n-th stock added to a session: STOCK A, STOCK B, ..., STOCK A1, ..."""
    return f"STOCK {string.ascii_uppercase[n % 26]}{n // 26 or ''}"


class Session:
    """One random game: trading days (WARMUP days, then day 1 onward), the stock pool, loaded stocks."""

    def __init__(self, days, first, pool):
        self.id = uuid.uuid4().hex[:12]
        self.days, self.first, self.pool = days, first, pool
        self.day_idx = first
        self.minute_end = min(first + SESSION_DAYS - 1, len(days) - 1)  # last day with 1-minute bars
        self.stocks = {}          # real ticker -> Stock; tickers never leave the backend
        self.added = 0
        self.cache = Cache(self.id)
        self.wake = asyncio.Event()

    def new_stock(self, ticker):
        st = Stock(ticker, alias(self.added))
        self.added += 1
        return st

    def ticker_of(self, name):
        return next((t for t, st in self.stocks.items() if st.alias == name), None)

    @property
    def day(self):
        return self.days[self.day_idx]

    def bars(self, ticker):
        return self.stocks[ticker].seconds[self.day.date]

    def ready(self):
        return bool(self.stocks) and all(self.day.date in st.seconds for st in self.stocks.values())


class Game:
    def __init__(self, broadcast):
        self.broadcast = broadcast
        self.client = None
        self.s = None
        self.view = None          # ticker on the main chart
        self.pos = 1              # bars of the current day revealed so far
        self.speed = 0
        self.picking = False
        self.auth_failed = False
        self.loading = None       # latest prefetch progress {"text", "progress"}
        self.ready_pushed = False
        self.worker = None
        self.rng = random.Random()

    # ----- state sent to the frontend

    def phase(self):
        if self.client is None:
            return "nokey"
        if self.auth_failed:
            return "auth"
        if self.picking:
            return "picking"
        if self.s is None:
            return "idle"
        if not self.s.ready():
            return "loading"
        return "day_end" if self.pos >= len(self.s.bars(self.view)) else "ready"

    def status(self):
        return {"type": "status", "phase": self.phase(), "speed": self.speed, "loading": self.loading}

    def clock(self):
        return self.s.bars(self.view).index[self.pos - 1].tz_convert(ET).strftime("%H:%M:%S")

    def prices(self):
        return {st.alias: float(st.seconds[self.s.day.date]["c"].iloc[self.pos - 1]) for st in self.s.stocks.values()}

    def snapshot(self):
        msg = {**self.status(), "type": "snapshot", "feed": self.client and self.client.feed,
               "speeds": SPEEDS, "session": None}
        s = self.s
        if s:
            msg["session"] = {"date": s.day.date, "day": s.day_idx - s.first + 1,
                              "last_day": s.day_idx == len(s.days) - 1,
                              "stocks": [st.alias for st in s.stocks.values()],
                              "view": s.stocks[self.view].alias,
                              "fallback": [st.alias for st in s.stocks.values() if s.day.date in st.fallback]}
            if s.ready():
                msg.update(clock=self.clock(), prices=self.prices(), bars=rows(s.bars(self.view).iloc[: self.pos]))
        return msg

    async def push_snapshot(self):
        self.ready_pushed = bool(self.s and self.s.ready())
        await self.broadcast(self.snapshot())

    async def push_status(self):
        await self.broadcast(self.status())

    # ----- prefetch listener

    async def on_load(self, text, progress=None):
        self.loading = {"text": text, "progress": progress} if text else None
        if self.s and self.s.ready() and not self.ready_pushed:
            await self.push_snapshot()
        else:
            await self.push_status()

    async def on_auth_error(self):
        self.auth_failed, self.speed = True, 0
        await self.push_snapshot()

    def start_worker(self):
        if self.s and self.client:
            self.worker = asyncio.create_task(Prefetcher(self.s, self.client, self).run())

    def stop_worker(self):
        if self.worker:
            self.worker.cancel()
        self.worker, self.loading = None, None

    async def set_client(self, client):
        self.stop_worker()
        old, self.client = self.client, client
        if old:
            await old.aclose()
        self.auth_failed = False
        self.start_worker()
        await self.push_snapshot()

    # ----- clock

    async def run(self):
        loop = asyncio.get_running_loop()
        last, carry = loop.time(), 0.0
        while True:
            await asyncio.sleep(TICK)
            now = loop.time()
            if self.speed and self.phase() == "ready":
                carry += self.speed * (now - last)
                if carry >= 1:
                    step = int(carry)
                    carry -= step
                    await self.advance(step)
            else:
                carry = 0.0
            last = now

    async def advance(self, step):
        bars = self.s.bars(self.view)
        old, self.pos = self.pos, min(self.pos + step, len(bars))
        await self.broadcast({"type": "tick", "clock": self.clock(), "prices": self.prices(),
                              "bars": rows(bars.iloc[old: self.pos])})
        if self.pos == len(bars):
            self.speed = 0
            await self.push_status()

    # ----- commands

    async def command(self, msg):
        try:
            await self.dispatch(msg.get("cmd"), msg)
        except AuthError:
            await self.on_auth_error()
        except httpx.HTTPError:
            log.warning("Alpaca request failed", exc_info=True)
            await self.push_snapshot()
            await self.error("Couldn't reach Alpaca. Check your connection and try again.")

    async def dispatch(self, cmd, msg):
        if cmd == "new_game":
            await self.new_game()
        elif cmd == "add":
            await self.add_stock()
        elif cmd == "replace":
            await self.replace_stock(self.s and self.s.ticker_of(msg.get("stock")))
        elif cmd == "next_day":
            await self.next_day()
        elif cmd == "speed" and msg.get("value") in SPEEDS:
            self.speed = msg["value"]
            await self.push_status()
        elif cmd == "view" and self.s and (ticker := self.s.ticker_of(msg.get("stock"))):
            self.view = ticker
            await self.push_snapshot()

    async def error(self, text):
        await self.broadcast({"type": "error", "text": text})

    async def new_game(self):
        if self.client is None or self.picking:
            return
        self.stop_worker()
        self.s, self.speed, self.picking = None, 0, True
        Cache.clear_all()
        await self.push_snapshot()
        try:
            days = await universe.trading_days(self.client)
            first = universe.pick_start(days, self.rng)
            pool = await universe.volatile_pool(self.client, days, first)
        finally:
            self.picking = False
        ticker = universe.pick(pool, (), self.rng)
        if ticker is None:
            await self.push_snapshot()
            return await self.error("No stocks had data on the picked day. Try New game again.")
        self.s = Session(days[first - universe.WARMUP:], universe.WARMUP, pool)
        self.s.stocks[ticker] = self.s.new_stock(ticker)
        self.view, self.pos = ticker, 1
        self.start_worker()
        await self.push_snapshot()

    async def add_stock(self):
        s = self.s
        if s is None or len(s.stocks) >= MAX_STOCKS:
            return
        ticker = universe.pick(s.pool, s.stocks, self.rng)
        if ticker is None:
            return await self.error("No more stocks left in this game's pool.")
        s.stocks[ticker] = s.new_stock(ticker)
        s.wake.set()
        await self.push_snapshot()

    async def replace_stock(self, old):
        s = self.s
        if s is None or old not in s.stocks:
            return
        new = universe.pick(s.pool, s.stocks, self.rng)
        if new is None:
            return await self.error("No more stocks left in this game's pool.")
        self.stop_worker()  # it may be downloading the old ticker
        s.stocks = {(new if t == old else t): (s.new_stock(new) if t == old else st) for t, st in s.stocks.items()}
        s.cache.drop_ticker(old)
        if self.view == old:
            self.view = new
        self.start_worker()
        await self.push_snapshot()

    async def next_day(self):
        s = self.s
        if s is None or self.phase() != "day_end" or s.day_idx + 1 >= len(s.days):
            return
        s.day_idx += 1
        self.pos, self.speed = 1, 0
        s.wake.set()
        await self.push_snapshot()
