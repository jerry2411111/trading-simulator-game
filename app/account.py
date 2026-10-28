"""Cash, positions, fees and order execution. Orders fill at the given price: no spread, no slippage."""
import math
from dataclasses import dataclass, field

MAX_CAPITAL = 10_000.0
MAX_LEVERAGE = 100.0


class OrderError(Exception):
    """A rejected order; the message is shown to the player."""


@dataclass
class Account:
    capital: float = 10_000.0       # starting capital for the next Clear PnL / new game
    leverage: float = 1.0
    fee_per_share: float = 0.005
    min_fee: float = 1.0
    spread: float = 0.0             # $ per share paid on market orders (buy above, sell below the price)
    start: float = 10_000.0         # starting capital in effect now
    cash: float = 10_000.0
    shares: dict = field(default_factory=dict)  # ticker -> signed shares (short < 0)
    cost: dict = field(default_factory=dict)    # ticker -> average entry price
    trades: list = field(default_factory=list)
    fees: float = 0.0

    def reset(self):
        self.start = self.cash = self.capital
        self.shares, self.cost, self.trades, self.fees = {}, {}, [], 0.0

    def mark(self, prices, key):
        """Current price of a held stock; its entry price while that day's data is still loading."""
        return prices.get(key, self.cost[key])

    def equity(self, prices):
        return self.cash + sum(n * self.mark(prices, t) for t, n in self.shares.items())

    def exposure(self, prices):
        return sum(abs(n) * self.mark(prices, t) for t, n in self.shares.items())

    def deposit(self, amount, prices):
        """Add money (or withdraw with a negative amount). Not profit: the PnL baseline moves with it."""
        if amount < 0 and (self.cash + amount < 0 or self.equity(prices) + amount <= 0):
            raise OrderError(f"You can withdraw at most ${max(0.0, min(self.cash, self.equity(prices))):,.2f} now.")
        self.cash += amount
        self.start += amount

    def order(self, key, side, dollars, prices, market=True, **info):
        """Buy, sell or close stock `key` at prices[key] (market orders pay the spread); returns the trade
        record (with `info`) or raises OrderError."""
        price, held = prices[key], self.shares.get(key, 0)
        if side == "close":
            qty = -held
            if not qty:
                raise OrderError("No position to close.")
        else:
            n = math.floor(dollars / price)
            if n <= 0:
                raise OrderError(f"${dollars:,.0f} doesn't buy one share at ${price:,.2f}.")
            qty = n if side == "buy" else -n
        if market:
            price += self.spread if qty > 0 else -self.spread
        if abs(held + qty) > abs(held):
            limit = self.equity(prices) * self.leverage
            if self.exposure(prices) + (abs(held + qty) - abs(held)) * price > limit:
                raise OrderError(f"Not enough buying power: at {self.leverage:g}x you can hold up to ${limit:,.0f}.")
        fee = max(self.min_fee, abs(qty) * self.fee_per_share)
        pnl = self._fill(key, held, qty, price)
        self.cash -= qty * price + fee
        self.fees += fee
        trade = {**info, "side": side, "qty": qty, "price": price, "fee": fee, "pnl": pnl}
        self.trades.append(trade)
        return trade

    def _fill(self, ticker, held, qty, price):
        """Update shares and average cost; return the realized PnL (before fees) of any closed part."""
        new, avg = held + qty, self.cost.get(ticker, price)
        pnl = 0.0
        if held and (held > 0) != (qty > 0):
            pnl = min(abs(qty), abs(held)) * (price - avg) * (1 if held > 0 else -1)
        if new == 0:
            self.shares.pop(ticker, None)
            self.cost.pop(ticker, None)
            return pnl
        self.shares[ticker] = new
        if held == 0 or (held > 0) != (new > 0):
            self.cost[ticker] = price                           # opened or flipped
        elif abs(new) > abs(held):
            self.cost[ticker] = (held * avg + qty * price) / new  # added to the position
        return pnl
