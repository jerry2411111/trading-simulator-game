"""Game session (days, stocks, one shared replay clock), the account, waiting orders, the AI trader,
and the player's commands."""
import asyncio
import logging
import random
import string
import time
import uuid
from dataclasses import asdict

import httpx
import numpy as np
import pandas as pd

from . import agent, bonus, collection, home, indicators, orders, saves, stats, universe
from .account import MAX_LEVERAGE, MIN_FEE_PER_SHARE, MIN_FEE_PER_TRADE, Account, OrderError
from .data import COLS, ET, AuthError, Cache, Day, Prefetcher, Stock

log = logging.getLogger(__name__)

SPEEDS = (0, 1, 1.5, 2, 3, 5, 10, 60)
TICK = 0.1           # seconds between clock pushes: at most 10 WebSocket messages per second
MAX_STOCKS = 5
SESSION_DAYS = 7
PICK_TRIES = 5       # random start days to try before giving up on an empty stock pool
VOLATILITY = 3.0     # new games make every price move 3x bigger (games saved before keep 1x)
AI_LOG = 30          # AI decisions kept for the log panel
REVEAL_SECONDS = 2 * 3600  # the 2-hour range reveal


def alias(n):
    """Display name of the n-th stock added to a session: STOCK A, STOCK B, ..., STOCK A1, ..."""
    return f"STOCK {string.ascii_uppercase[n % 26]}{n // 26 or ''}"


def chart_times(index, day_no):
    """Day number * 86400 + seconds since midnight ET: the chart gets times of day, never real dates."""
    et = index.tz_convert(ET)
    return np.asarray(day_no * 86400 + et.hour * 3600 + et.minute * 60 + et.second)


def rows(df, day_no):
    """Bars as [time, o, h, l, c, v]."""
    return np.column_stack([chart_times(df.index, day_no), df[COLS].to_numpy()]).round(4).tolist()


def clean(col):
    return [None if np.isnan(v) else round(float(v), 6) for v in col]


def public(record):
    """A trade or waiting order without the real ticker."""
    return {k: v for k, v in record.items() if k != "ticker"}


class Session:
    """One random game: trading days (WARMUP days, then day 1 onward), the stock pool, loaded stocks."""

    def __init__(self, days, first, pool, sid=None):
        self.id = sid or uuid.uuid4().hex[:12]
        self.days, self.first, self.pool = days, first, pool
        self.day_idx = first
        self.minute_end = min(first + SESSION_DAYS - 1, len(days) - 1)  # last day with 1-minute bars
        self.stocks = {}          # real ticker -> Stock; tickers never leave the backend
        self.added = 0
        self.amp = VOLATILITY     # how much bigger every price move is
        self.cache = Cache(self.id)
        self.wake = asyncio.Event()

    def new_stock(self, ticker):
        st = Stock(ticker, alias(self.added), self.day_idx)
        self.added += 1
        return st

    def ticker_of(self, name):
        return next((t for t, st in self.stocks.items() if st.alias == name), None)

    @property
    def day(self):
        return self.days[self.day_idx]

    @property
    def day_no(self):
        return self.day_idx - self.first + 1

    def bars(self, ticker):
        return self.stocks[ticker].seconds[self.day.date]

    def ready(self):
        return bool(self.stocks) and all(self.day.date in st.seconds for st in self.stocks.values())

    def to_dict(self):
        return {"id": self.id, "days": [[d.date, d.open.isoformat(), d.close.isoformat()] for d in self.days],
                "first": self.first, "day_idx": self.day_idx, "minute_end": self.minute_end, "pool": self.pool,
                "stocks": [[t, st.alias, st.joined] for t, st in self.stocks.items()], "added": self.added, "amp": self.amp}

    @classmethod
    def from_dict(cls, d):
        s = cls([Day(x, pd.Timestamp(o), pd.Timestamp(c)) for x, o, c in d["days"]], d["first"], d["pool"], d["id"])
        s.day_idx, s.minute_end, s.added = d["day_idx"], d["minute_end"], d["added"]
        s.amp = d.get("amp", 1.0)  # games saved before the 3x volatility keep their prices
        s.stocks = {t: Stock(t, a, j) for t, a, j in d["stocks"]}
        return s


class Game:
    def __init__(self, broadcast):
        self.broadcast = broadcast
        self.client = None
        self.s = None
        self.view = None          # ticker on the main chart
        self.pos = 1              # bars of the current day revealed so far
        self.speed = 0
        self.picking = self.auth_failed = self.over = False
        self.loading = None       # latest prefetch progress {"text", "progress"}
        self.ready_pushed = False
        self.worker = None
        self.rng = random.Random()
        self.account = Account()
        self.day_start = self.account.start  # equity when the current day began
        self.days = []            # finished-day summaries since the last Clear PnL
        self.curve = []           # [chart time, equity] each minute of finished days
        self.today = []           # the same for the current day
        self.pending = []         # waiting LMT / conditional orders
        self.shown = set()        # indicators the player turned on
        self.split = False        # split view: send every stock's bars, not just the viewed one
        self.agent = agent.AgentConfig()
        self.ai_log = []
        self.ai_mark = 1          # bar of the last AI decision
        self.thinking = False     # an AI decision is in flight: the clock waits
        self.home = home.new()    # this game's garden, house, coins and collection
        self.boost = bonus.new_boost()
        self.trade_count = 0      # trades so far: every bonus.EVERY of them earns a slot machine spin
        self.spins = 0            # spins earned and not pulled yet
        self.prizes = {}          # outcome -> how many of that prize are stored, waiting to be used
        self.reveals = []         # slot machine reveals shown on the chart (2-hour range, next-day direction)

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
        if self.over:
            return "game_over"
        return "day_end" if self.pos >= len(self.s.bars(self.view)) else "ready"

    def status(self):
        return {"type": "status", "phase": self.phase(), "speed": self.speed, "loading": self.loading,
                "thinking": self.thinking}

    def clock(self):
        return self.s.bars(self.view).index[self.pos - 1].tz_convert(ET).strftime("%H:%M:%S")

    def time_at(self, i):
        return int(chart_times(self.s.bars(self.view).index[i:i + 1], self.s.day_no)[0])

    def prices(self, i=None):
        """Close of bar i (default: the current bar) for every stock whose day is loaded."""
        if self.s is None:
            return {}
        i, date = self.pos - 1 if i is None else i, self.s.day.date
        return {t: float(st.seconds[date]["c"].iloc[i]) for t, st in self.s.stocks.items() if date in st.seconds}

    def equity(self, i=None):
        return self.account.equity(self.prices(i))

    def point(self, i):
        return [self.time_at(i), round(self.equity(i), 2)]

    def values(self, st, names):
        """Indicators of one stock for the whole current day, computed once per day on first use.
        They are causal, so the player and the AI are only ever given prefixes up to the clock."""
        date = self.s.day.date
        if st.ind.get("date") != date:
            st.ind = {"date": date}
        for name in names:
            if name not in st.ind:
                st.ind[name] = indicators.compute_one(st.seconds[date], name)
        return {name: st.ind[name] for name in names}

    def ind(self, a, b):
        """Enabled indicators of the viewed stock for bars a..b-1."""
        values = self.values(self.s.stocks[self.view], self.shown)
        return {name: [clean(col[a:b]) for col in cols] for name, cols in values.items()}

    def account_view(self):
        a, prices = self.account, self.prices()
        names = {t: st.alias for t, st in self.s.stocks.items()} if self.s else {}
        eq, exposure = a.equity(prices), a.exposure(prices)
        return {"equity": eq, "cash": a.cash, "today": eq - self.day_start, "total": eq - a.start,
                "exposure": exposure, "buying_power": max(0.0, eq * a.leverage - exposure),
                "positions": {names[t]: {"shares": n, "avg": a.cost[t], "pnl": n * (a.mark(prices, t) - a.cost[t])}
                              for t, n in a.shares.items()},
                "pending": [public(o) for o in self.pending],
                "settings": {k: getattr(a, k) for k in ("leverage", "fee_per_share", "min_fee", "spread")}}

    def trades_today(self):
        day = self.s.day_no if self.s else None
        return [public(tr) for tr in self.account.trades if tr["day"] == day]

    def snapshot(self):
        s = self.s
        msg = {**self.status(), "type": "snapshot", "feed": self.client and self.client.feed, "speeds": SPEEDS,
               "session": None, "account": self.account_view(), "trades": self.trades_today(),
               "ai": {**self.agent.public(), "log": self.ai_log}, "bonus": self.bonus_view()}
        if s:
            msg["session"] = {"day": s.day_no, "last_day": s.day_idx == len(s.days) - 1,
                              "stocks": [st.alias for st in s.stocks.values()], "view": s.stocks[self.view].alias,
                              "fallback": [st.alias for st in s.stocks.values() if s.day.date in st.fallback]}
            if s.ready():
                msg.update(clock=self.clock(), prices=self.alias_prices(), ind=self.ind(0, self.pos),
                           bars=rows(s.bars(self.view).iloc[: self.pos], s.day_no), others=self.others(0, self.pos))
            if msg["phase"] == "day_end" and self.days:
                msg["summary"] = self.days[-1]
        return msg

    def bonus_view(self):
        return {"boost": self.boost, "next_spin": bonus.EVERY - self.trade_count % bonus.EVERY, "reveals": self.reveals,
                "spins": self.spins, "prizes": [{"outcome": k, "n": n, "title": bonus.OUTCOMES[k][1], "text": bonus.OUTCOMES[k][2]}
                                                for k, n in self.prizes.items() if n]}

    async def push_bonus(self):
        await self.broadcast({"type": "bonus", "bonus": self.bonus_view()})

    def others(self, a, b):
        """Split view: bars a..b-1 of every stock except the viewed one, by alias."""
        if not self.split:
            return {}
        s = self.s
        return {st.alias: rows(st.seconds[s.day.date].iloc[a:b], s.day_no) for t, st in s.stocks.items() if t != self.view}

    def alias_prices(self):
        return {self.s.stocks[t].alias: p for t, p in self.prices().items()}

    async def push_snapshot(self):
        self.ready_pushed = bool(self.s and self.s.ready())
        await self.broadcast(self.snapshot())

    async def push_status(self):
        await self.broadcast(self.status())

    async def push_account(self, fills=()):
        await self.broadcast({"type": "account", "account": self.account_view(), "trades": self.trades_today(),
                              "fills": [public(f) for f in fills], "bonus": self.bonus_view()})

    async def error(self, text):
        await self.broadcast({"type": "error", "text": text})

    # ----- prefetch listener and API key

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
            if self.speed and not self.thinking and self.phase() == "ready":
                carry += self.speed * (now - last)
                if carry >= 1:
                    step = int(carry)
                    carry -= step
                    await self.advance(step)
            else:
                carry = 0.0
            last = now

    async def advance(self, step):
        s = self.s
        n = len(s.bars(self.view))
        old, self.pos = self.pos, min(self.pos + step, n)
        fills, rejected = self.fill_waiting(old, self.pos)
        if not self.today:  # the day's curve starts from the equity the day began with
            self.today.append([self.time_at(0), round(self.day_start, 2)])
        for i in range((old // 60 + 1) * 60, self.pos + 1, 60):  # equity at each minute closed in this step
            self.today.append(self.point(i - 1))
        await self.broadcast({"type": "tick", "clock": self.clock(), "prices": self.alias_prices(),
                              "bars": rows(s.bars(self.view).iloc[old: self.pos], s.day_no),
                              "ind": self.ind(old, self.pos), "others": self.others(old, self.pos),
                              "account": self.account_view()})
        if fills or rejected:
            self.settle(fills)
            await self.push_account(fills)
            await self.count_trades(fills)
            for text in rejected:
                await self.error(text)
        if self.equity() <= 0:
            await self.game_over()
        elif self.pos == n:
            await self.end_day()
        elif self.agent.enabled and self.agent.api_key and self.pos - self.ai_mark >= self.agent.interval:
            self.ai_mark, self.thinking = self.pos, True
            asyncio.create_task(self.decide())

    def fill_waiting(self, a, b):
        """Fill waiting orders on bars a..b-1; returns (trades, rejection messages)."""
        fills, rejected = [], []
        for o in list(self.pending):
            hit = orders.first_fill(o, self.s.bars(o["ticker"]).iloc[a:b])
            if hit is None:
                continue
            self.pending.remove(o)
            try:
                fills.append(self.execute(o["ticker"], o["side"], o["dollars"], at=a + hit[0], price=hit[1],
                                          by=o["by"], market=o["type"] != "LMT"))
            except OrderError as e:
                rejected.append(f"{o['type']} {o['side']} {o['stock']} not filled: {e}")
        return fills, rejected

    def close_all(self):
        return [self.execute(t, "close", 0, by="auto") for t in list(self.account.shares)]

    async def end_day(self):
        self.pending.clear()  # day orders expire
        self.close_all()      # positions never stay open overnight
        self.home, interest, foreclosed = home.charge_interest(self.home, self.account.cash)
        self.account.cash -= interest  # a cost, so it counts against profit
        p = self.point(self.pos - 1)
        self.today[-1:] = [self.today[-1], p] if self.today[-1][0] != p[0] else [p]
        day_trades = [tr for tr in self.account.trades if tr["day"] == self.s.day_no]
        self.days.append(stats.day_summary(self.s.day_no, [e for _, e in self.today], day_trades))
        self.curve += self.today
        self.today, self.speed = [], 0
        self.autosave()
        await self.push_snapshot()
        if interest:
            await self.broadcast({"type": "notice", "text": f"Mortgage interest paid: ${interest:,.2f}."})
        for text in foreclosed:
            await self.error(text)

    async def game_over(self):
        self.pending.clear()
        self.close_all()
        self.over, self.speed = True, 0
        self.autosave()
        await self.push_snapshot()

    # ----- orders

    def execute(self, ticker, side, dollars, at=None, price=None, by="you", market=True):
        """Fill now (or at bar `at`, optionally at `price`) through the account; market fills pay the
        spread. Raises OrderError."""
        s, at = self.s, self.pos - 1 if at is None else at
        prices = self.prices(at)
        if price is not None:
            prices[ticker] = price
        free = self.boost["free"] > 0 and by in ("you", "AI")
        trade = self.account.order(ticker, side, dollars, prices, market, free, day=s.day_no, t=self.time_at(at),
                                   stock=s.stocks[ticker].alias, ticker=ticker, by=by)
        if free:
            self.boost["free"] -= 1
            trade["free"] = True
        return trade

    def place(self, ticker, side, kind, price, dollars, by):
        """Market and close orders (and limit/conditional orders already reached) fill now; others wait.
        Returns the trade, or None if the order is waiting."""
        if side == "close" or kind == "MKT" or orders.marketable(kind, side, price, self.prices()[ticker]):
            return self.execute(ticker, side, dollars, by=by, market=kind != "LMT" or side == "close")
        self.pending.append({"id": uuid.uuid4().hex[:6], "ticker": ticker, "stock": self.s.stocks[ticker].alias,
                             "side": side, "type": kind, "price": price, "dollars": dollars, "by": by})
        return None

    async def order(self, msg):
        ticker = self.s.ticker_of(msg.get("stock"))
        side, kind, price, dollars = msg.get("side"), msg.get("type", "MKT"), msg.get("price"), msg.get("dollars")
        if self.phase() != "ready":
            return await self.error("Trading is closed right now.")
        if ticker is None or side not in agent.SIDES or kind not in orders.KINDS:
            return
        if not isinstance(dollars, (int, float)) or (kind != "MKT" and side != "close"
                                                     and not (isinstance(price, (int, float)) and price > 0)):
            return await self.error("Enter an order size, and a price for LMT / IF orders.")
        try:
            trade = self.place(ticker, side, kind, price, float(dollars), "you")
        except OrderError as e:
            return await self.error(str(e))
        await self.after_trade([trade] if trade else [])

    async def after_trade(self, trades):
        self.settle(trades)
        self.autosave()
        await self.push_account(trades)
        await self.count_trades(trades)
        if self.equity() <= 0:
            await self.game_over()

    def settle(self, trades):
        """Pay slot machine bonuses (2x, 5x, shield) on closing trades; the bonus is trading profit."""
        for tr in trades:
            if extra := bonus.settle(self.boost, tr):
                self.account.cash += extra
                tr["bonus"] = extra

    async def count_trades(self, trades):
        before = self.trade_count
        self.trade_count += len(trades)
        if earned := self.trade_count // bonus.EVERY - before // bonus.EVERY:
            self.spins += earned
            self.autosave()
            await self.push_bonus()
            await self.broadcast({"type": "notice", "text": "🎰 You earned a slot machine spin! Pull it whenever you like."})

    async def spin(self):
        """Pull the lever once: the prize goes into storage. The clock pauses while the reels turn; the
        player starts it again."""
        if self.spins < 1:
            return await self.error(f"No spins yet: you earn one every {bonus.EVERY} trades.")
        self.spins -= 1
        outcome = bonus.spin(self.rng)
        self.prizes[outcome] = self.prizes.get(outcome, 0) + 1
        self.speed = 0
        self.autosave()
        await self.push_status()
        _, title, text = bonus.OUTCOMES[outcome]
        await self.broadcast({"type": "slot", "outcome": outcome, "title": title, "text": text, "bonus": self.bonus_view()})

    async def use_prize(self, outcome):
        """Use one stored prize now. Reveals are for the stock being viewed, at the current time."""
        s = self.s
        if not self.prizes.get(outcome):
            return await self.error("You don't have that reward.")
        if outcome in ("range2h", "next_day") and not (s and s.ready()):
            return await self.error("Start trading first: reveals are for the stock you're viewing.")
        if outcome == "next_day" and s.day_idx + 1 >= len(s.days):
            return await self.error("There's no next trading day in this game. Keep it for another time.")
        detail = None
        if outcome == "range2h" and (detail := self.range_reveal()) is None:
            return await self.error("Trading is over for today. Use it tomorrow.")
        self.prizes[outcome] -= 1
        if not self.prizes[outcome]:
            del self.prizes[outcome]
        used = outcome
        if outcome == "gift":
            detail = collection.gift({c["id"] for c in self.home["collection"]}, self.rng)
            if detail:
                self.home["collection"].append({"id": detail["id"], "t": time.time(), "day": s.day_no if s else None})
            else:  # the collection is complete: a 2x instead
                used = "double"
        elif outcome == "next_day":
            detail = await self.next_day_reveal()
        bonus.grant(self.boost, used)
        if used in ("range2h", "next_day"):
            self.reveals = [r for r in self.reveals if r["kind"] != used] + [detail]
        self.autosave()
        _, title, text = bonus.OUTCOMES[used]
        await self.broadcast({"type": "prize", "outcome": used, "title": title, "text": text, "detail": detail,
                              "bonus": self.bonus_view()})

    def range_reveal(self):
        """Highest and lowest price of the viewed stock over the next 2 hours (until the close)."""
        s = self.s
        bars = s.bars(self.view)
        w = bars.iloc[self.pos: self.pos + REVEAL_SECONDS]
        if w.empty:
            return None
        hi, lo = int(np.argmax(w["h"].to_numpy())), int(np.argmin(w["l"].to_numpy()))
        times = chart_times(w.index[[hi, lo, len(w) - 1]], s.day_no)
        return {"kind": "range2h", "stock": s.stocks[self.view].alias, "high": round(float(w["h"].iloc[hi]), 4),
                "low": round(float(w["l"].iloc[lo]), 4), "t_high": int(times[0]), "t_low": int(times[1]),
                "until": int(times[2]), "day": s.day_no}

    async def next_day_reveal(self):
        """Whether the viewed stock closes the next trading day above (up) or below (down) today's close."""
        s = self.s
        out = {"kind": "next_day", "stock": s.stocks[self.view].alias, "day": s.day_no, "direction": "unknown"}
        if s.day_idx + 1 >= len(s.days):
            return out
        try:
            # daily bars are stamped at midnight ET, so start at the beginning of today (UTC)
            daily = (await self.client.bars([self.view], "1Day", s.day.open.floor("D"), s.days[s.day_idx + 1].close)).get(self.view)
        except (httpx.HTTPError, AuthError):
            log.warning("next-day reveal failed", exc_info=True)
            return out
        if daily is not None and len(daily) >= 2:
            today, nxt = float(daily["c"].iloc[-2]), float(daily["c"].iloc[-1])
            out["direction"] = "up" if nxt > today else "down" if nxt < today else "flat"
        return out

    # ----- AI trader

    async def decide(self):
        """One AI decision: the clock waits until it is done (at most agent.TIMEOUT seconds)."""
        await self.push_status()
        entry = {"time": self.clock(), "note": "", "orders": [], "results": []}
        try:
            text = await asyncio.wait_for(agent.ask(self.agent, agent.snapshot(self)), agent.TIMEOUT)
            todo, entry["note"] = agent.parse(text, [st.alias for st in self.s.stocks.values()], self.agent.max_dollars)
            entry["orders"] = todo
            fills = []
            for o in todo:
                try:
                    trade = self.place(self.s.ticker_of(o["stock"]), o["side"], o["type"], o["price"], o["dollars"], "AI")
                    fills += [trade] if trade else []
                    entry["results"].append("filled" if trade else "waiting")
                except OrderError as e:
                    entry["results"].append(f"rejected: {e}")
            if todo:
                await self.after_trade(fills)
        except asyncio.TimeoutError:
            entry["error"] = "no answer within 20 seconds: no trade"
        except (httpx.HTTPError, ValueError, KeyError, TypeError) as e:
            entry["error"] = f"{type(e).__name__}: {e}"[:300] + " (no trade)"
        finally:
            self.thinking = False
        self.ai_log = (self.ai_log + [entry])[-AI_LOG:]
        await self.broadcast({"type": "ai", "entry": entry})
        await self.push_status()

    def configure_ai(self, body):
        """Update AI settings from the settings panel; an empty api_key keeps the current one."""
        cfg = self.agent
        key = (body.get("api_key") or "").strip() or cfg.api_key
        fields = agent.AgentConfig.__dataclass_fields__
        for k, v in body.items():
            if k in fields and k != "api_key":
                setattr(cfg, k, type(getattr(cfg, k))(v))
        cfg.api_key = key
        cfg.interval = max(5, cfg.interval)
        cfg.prompt = cfg.prompt.strip() or agent.STANDARD_PROMPT
        self.ai_mark = self.pos

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
        s = self.s
        if cmd == "new_game":
            await self.new_game()
        elif cmd == "add":
            await self.add_stock()
        elif cmd == "replace":
            await self.replace_stock(s and s.ticker_of(msg.get("stock")))
        elif cmd == "remove":
            await self.remove_stock(s and s.ticker_of(msg.get("stock")))
        elif cmd == "next_day":
            await self.next_day()
        elif cmd == "speed" and msg.get("value") in SPEEDS:
            self.speed = msg["value"]
            await self.push_status()
        elif cmd == "view" and s and (ticker := s.ticker_of(msg.get("stock"))):
            self.view = ticker
            await self.push_snapshot()
        elif cmd == "order" and s:
            await self.order(msg)
        elif cmd == "cancel":
            self.pending = [o for o in self.pending if o["id"] != msg.get("id")]
            await self.after_trade([])
        elif cmd == "close_all" and self.phase() == "ready":
            await self.after_trade(self.close_all())
        elif cmd == "clear_pnl":
            await self.clear_pnl()
        elif cmd == "configure":
            await self.configure(msg)
        elif cmd == "split":
            self.split = bool(msg.get("on"))
            await self.push_snapshot()
        elif cmd == "leverage" and isinstance(msg.get("value"), (int, float)) and 1 <= msg["value"] <= MAX_LEVERAGE:
            self.account.leverage = float(msg["value"])
            self.autosave()
            await self.push_account()
        elif cmd == "indicators":
            self.shown = set(msg.get("names") or ()) & set(indicators.NAMES)
            await self.push_snapshot()
        elif cmd == "spin":
            await self.spin()
        elif cmd == "use_prize" and msg.get("outcome") in bonus.OUTCOMES:
            await self.use_prize(msg["outcome"])
        elif cmd == "stats":
            await self.broadcast({"type": "stats", "overall": stats.overall(
                self.days, self.account.trades, [e for _, e in self.curve + self.today]),
                "days": self.days, "curve": self.curve + self.today})

    def reset_account(self):
        self.account.reset()
        self.days, self.curve, self.today, self.pending, self.over = [], [], [], [], False
        self.day_start = self.account.start
        if self.s and self.s.ready():
            self.today = [self.point(self.pos - 1)]

    async def clear_pnl(self):
        self.reset_account()
        self.autosave()
        await self.push_snapshot()

    async def configure(self, msg):
        try:
            spread, per_share, min_fee = (float(msg[k]) for k in ("spread", "fee_per_share", "min_fee"))
        except (KeyError, TypeError, ValueError):
            return await self.error("Settings must be numbers.")
        if spread < 0:
            return await self.error("The spread can't be negative.")
        if per_share < MIN_FEE_PER_SHARE or min_fee < MIN_FEE_PER_TRADE:
            return await self.error(f"Fees can't go below ${MIN_FEE_PER_SHARE} a share and ${MIN_FEE_PER_TRADE:.0f} a trade.")
        a = self.account
        a.spread, a.fee_per_share, a.min_fee = spread, per_share, min_fee
        self.autosave()
        await self.push_account()

    def move_money(self, amount):
        """Mortgage money in (+) or a loan paid back (-). The PnL baselines and the equity curve move with
        it, so it never shows up as profit. Raises OrderError."""
        self.account.deposit(float(amount), self.prices())
        self.day_start += amount
        for p in self.curve + self.today:
            p[1] = round(p[1] + amount, 2)

    # ----- home (per game)

    def profit(self):
        """This game's trading profit: what the home's coins are made of."""
        try:
            return self.equity() - self.account.start if self.s else 0.0
        except (KeyError, IndexError):
            return self.account.cash - self.account.start

    def home_view(self):
        v = home.view(self.home, self.profit())
        v["collection"] = {"items": collection.ITEMS, "categories": collection.CATEGORIES}
        v["has_game"] = self.s is not None
        return v

    async def home_act(self, action, body):
        """One Home / Store action. Raises home.HomeError."""
        if self.s is None:
            raise home.HomeError("Start a game first: every game has its own home.")
        new, dollars = home.act(self.home, action, body, self.profit(), self.account.cash)
        if dollars:
            try:
                self.move_money(dollars)
            except OrderError as e:
                raise home.HomeError(str(e)) from None
        self.home = new
        self.autosave()
        if dollars:
            await self.push_account()
            await self.broadcast({"type": "notice", "text": f"{'+' if dollars > 0 else '-'}${abs(dollars):,.2f} "
                                                            f"{'to' if dollars > 0 else 'from'} your trading account."})
        return self.home_view()

    async def new_game(self):
        if self.client is None or self.picking:
            return
        self.stop_worker()
        self.s, self.speed, self.picking = None, 0, True
        await self.push_snapshot()
        pool = []
        try:
            days = await universe.trading_days(self.client)
            for _ in range(PICK_TRIES):
                first = universe.pick_start(days, self.rng)
                if pool := await universe.volatile_pool(self.client, days, first):
                    break
        finally:
            self.picking = False
        if not pool:
            await self.push_snapshot()
            return await self.error("Couldn't find stocks with enough data. Try New game again.")
        Cache.prune(saves.session_ids())
        self.s = Session(days[first - universe.WARMUP:], universe.WARMUP, pool)
        ticker = universe.pick(pool, (), self.rng)
        self.s.stocks[ticker] = self.s.new_stock(ticker)
        self.view, self.pos, self.ai_mark = ticker, 1, 1
        self.home, self.boost, self.trade_count, self.reveals = home.new(), bonus.new_boost(), 0, []
        self.spins, self.prizes = 0, {}
        self.reset_account()
        self.start_worker()
        self.autosave()
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
        self.autosave()
        await self.push_snapshot()

    async def replace_stock(self, old):
        s = self.s
        if s is None or old not in s.stocks:
            return
        new = universe.pick(s.pool, s.stocks, self.rng)
        if new is None:
            return await self.error("No more stocks left in this game's pool.")
        if old in self.account.shares:
            self.execute(old, "close", 0, by="auto")
        self.pending = [o for o in self.pending if o["ticker"] != old]
        self.stop_worker()  # it may be downloading the old ticker
        s.stocks = {(new if t == old else t): (s.new_stock(new) if t == old else st) for t, st in s.stocks.items()}
        s.cache.drop_ticker(old)
        if self.view == old:
            self.view = new
        self.start_worker()
        self.autosave()
        await self.push_snapshot()

    async def remove_stock(self, old):
        """Stop following a stock: its position is closed and its waiting orders cancelled. One must stay."""
        s = self.s
        if s is None or old not in s.stocks:
            return
        if len(s.stocks) < 2:
            return await self.error("You need at least one stock.")
        if old in self.account.shares:
            if old not in self.prices():
                return await self.error("Wait until its data has loaded: its position has to be closed first.")
            self.settle([self.execute(old, "close", 0, by="auto")])
        self.pending = [o for o in self.pending if o["ticker"] != old]
        self.stop_worker()  # it may be downloading the removed ticker
        del s.stocks[old]
        s.cache.drop_ticker(old)
        if self.view == old:
            self.view = next(iter(s.stocks))
        self.start_worker()
        self.autosave()
        await self.push_snapshot()
        await self.push_account()

    async def next_day(self):
        s = self.s
        if s is None or self.phase() != "day_end" or s.day_idx + 1 >= len(s.days):
            return
        s.day_idx += 1
        self.pos, self.speed, self.ai_mark = 1, 0, 1
        self.day_start = self.account.cash  # no positions overnight
        s.wake.set()
        self.autosave()
        await self.push_snapshot()

    # ----- saving

    def to_dict(self):
        s = self.s
        equity = self.equity() if s and s.ready() else self.account.cash
        return {"session": s.to_dict() if s else None, "view": self.view, "pos": self.pos,
                "account": asdict(self.account), "day_start": self.day_start, "over": self.over,
                "days": self.days, "curve": self.curve, "today": self.today, "pending": self.pending,
                "home": self.home, "boost": self.boost, "trade_count": self.trade_count, "reveals": self.reveals,
                "spins": self.spins, "prizes": self.prizes,
                "summary": {"day": s.day_no if s else None, "equity": round(equity, 2)}}

    def restore(self, d):
        self.stop_worker()
        self.s = Session.from_dict(d["session"]) if d.get("session") else None
        self.view, self.pos, self.speed, self.ai_mark = d["view"], d["pos"], 0, d["pos"]
        self.account = Account(**d["account"])
        self.day_start, self.over = d["day_start"], d["over"]
        self.days, self.curve, self.today, self.pending = d["days"], d["curve"], d["today"], d.get("pending", [])
        self.home = home.normalize(d.get("home"))
        self.boost = {**bonus.new_boost(), **d.get("boost", {})}
        self.trade_count = d.get("trade_count", len(self.account.trades))
        self.reveals = d.get("reveals", [])
        self.spins = d.get("spins", 0)
        self.prizes = {k: n for k, n in d.get("prizes", {}).items() if k in bonus.OUTCOMES and n > 0}
        self.start_worker()

    def autosave(self):
        saves.autosave(self.to_dict())
