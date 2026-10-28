"""AI trader: send the data the player chose to share to an LLM and validate the orders it returns.

Two plain-httpx adapters: Anthropic Messages and any OpenAI-compatible Chat Completions endpoint.
The API key is never logged, never sent to the frontend, and never included in prompts.
"""
import json
import re
from dataclasses import asdict, dataclass

import httpx
import pandas as pd

from . import indicators
from .data import COLS, ET, rescale
from .orders import KINDS

TIMEOUT = 20.0
ANTHROPIC_URL = "https://api.anthropic.com"
OPENAI_URL = "https://api.openai.com/v1"
SIDES = ("buy", "sell", "close")

STANDARD_PROMPT = """You are an experienced, disciplined intraday trader playing TapeTrainer, a day-trading simulator \
that replays real US stock trades second by second.

- The stocks are anonymous (STOCK A, STOCK B, ...). Prices are rescaled so each stock opened at $100 on its \
first day, and you are never told the date or the company. Do not guess them; trade only the data you are given.
- Every few minutes of game time you receive a snapshot of the market up to the current second and your account. \
You know nothing about what happens next.
- Your goal is to grow account equity steadily while controlling risk: size positions sensibly, cut losers, \
avoid overtrading (every order pays a fee), and remember that all positions are closed automatically at the \
end of each trading day.
- Holding (no orders) is often the right decision."""

FORMAT_RULES = """Order types:
- MKT: fills now at the current price.
- LMT: buy fills if price falls to "price", sell fills if price rises to "price".
- IF_ABOVE / IF_BELOW: a market order sent once price reaches "price" (at or above / at or below).
- side "close" closes the whole position in that stock at market (type and price are ignored).
Waiting orders expire at the end of the day. Each order's "dollars" must be between 1 and {max_dollars:g}.

Reply with ONLY one JSON object, no other text:
{{"orders": [{{"stock": "STOCK A", "side": "buy|sell|close", "type": "MKT|LMT|IF_ABOVE|IF_BELOW", \
"price": 100.0, "dollars": 1000}}], "note": "one sentence explaining the decision"}}
Use "orders": [] to hold."""


@dataclass
class AgentConfig:
    enabled: bool = False
    provider: str = "anthropic"      # "anthropic", or "openai" for any OpenAI-compatible endpoint
    base_url: str = ""               # empty: the provider's public API
    model: str = "claude-opus-5-5"
    api_key: str = ""
    remember: bool = False           # keep the key in data/keys.json
    interval: int = 60               # game seconds between decisions
    max_dollars: float = 1000.0
    share_price: bool = True
    share_volume: bool = True
    share_indicators: bool = True
    prompt: str = STANDARD_PROMPT

    def public(self):
        d = asdict(self)
        d["has_key"] = bool(d.pop("api_key"))
        return d

    def stored(self):
        d = asdict(self)
        if not self.remember:
            d["api_key"] = ""
        return d

    def system(self):
        return f"{self.prompt.strip()}\n\n{FORMAT_RULES.format(max_dollars=self.max_dollars)}"


def table(df, cols, label):
    """Bars as {"columns": [...], "rows": [[time label, ...], ...]}."""
    times = [label(t) for t in df.index]
    return {"columns": ["time", *cols], "rows": [[t, *map(lambda v: round(float(v), 4), r)]
                                                  for t, r in zip(times, df[cols].to_numpy())]}


def snapshot(game):
    """Everything known up to the current second that the player chose to share: per stock the last
    120 1-minute bars and 60 1-second bars (price and/or volume), current indicator values; the account."""
    cfg, s, a = game.agent, game.s, game.account
    prices, date = game.prices(), s.day.date
    day_no = {d.date: i - s.first + 1 for i, d in enumerate(s.days)}
    label = lambda t: f"D{day_no[t.tz_convert(ET).strftime('%Y-%m-%d')]} {t.tz_convert(ET).strftime('%H:%M:%S')}"
    cols = (["o", "h", "l", "c"] if cfg.share_price else []) + (["v"] if cfg.share_volume else [])
    stocks = {}
    for t, st in s.stocks.items():
        if t not in prices:
            continue
        sec = st.seconds[date].iloc[: game.pos]
        item = {"price": round(prices[t], 4)}
        if cols:
            past = rescale(st.minutes[st.minutes.index < s.day.open], st.scale)[COLS]
            today = sec.resample("1min").agg({"o": "first", "h": "max", "l": "min", "c": "last", "v": "sum"})
            item["bars_1m"] = table(pd.concat([past, today]).tail(120), cols, label)
            item["bars_1s"] = table(sec.tail(60), cols, label)
        if cfg.share_indicators:
            values = indicators.latest(game.values(st), game.pos - 1)
            lo, hi = indicators.band(values["band"]["sigma_1s"] or 0.0, prices[t])
            values["band"] |= {"lower_5m": round(lo, 4), "upper_5m": round(hi, 4)}
            item["indicators"] = values
        stocks[st.alias] = item
    return {"time": game.clock(), "day": s.day_no, "stocks": stocks,
            "account": {"cash": round(a.cash, 2), "equity": round(a.equity(prices), 2), "leverage": a.leverage,
                        "fee_per_share": a.fee_per_share, "min_fee": a.min_fee,
                        "positions": {s.stocks[t].alias: {"shares": n, "avg_price": round(a.cost[t], 4)}
                                      for t, n in a.shares.items()}},
            "open_orders": [{k: o[k] for k in ("id", "stock", "side", "type", "price", "dollars")} for o in game.pending]}


async def ask(cfg, data):
    """Send one decision request; returns the model's text reply."""
    user = json.dumps(data, separators=(",", ":"))
    async with httpx.AsyncClient(timeout=TIMEOUT) as http:
        if cfg.provider == "anthropic":
            base = (cfg.base_url or ANTHROPIC_URL).rstrip("/")
            headers = {"x-api-key": cfg.api_key, "anthropic-version": "2023-06-01"}
            body = {"model": cfg.model, "max_tokens": 16000, "system": cfg.system(),
                    "output_config": {"effort": "low"},  # quick decisions inside the 20-second limit
                    "messages": [{"role": "user", "content": user}]}
            if base == ANTHROPIC_URL:  # if a safety classifier declines, let the API retry on a fallback model
                headers["anthropic-beta"] = "server-side-fallback-2026-07-01"
                body["fallbacks"] = "default"
            js = check(await http.post(f"{base}/v1/messages", headers=headers, json=body))
            if js.get("stop_reason") == "refusal":
                raise ValueError("the model declined to answer")
            return "".join(b.get("text", "") for b in js.get("content", []) if b.get("type") == "text")
        base = (cfg.base_url or OPENAI_URL).rstrip("/")
        js = check(await http.post(f"{base}/chat/completions", headers={"Authorization": f"Bearer {cfg.api_key}"},
                                   json={"model": cfg.model, "messages": [{"role": "system", "content": cfg.system()},
                                                                          {"role": "user", "content": user}]}))
        return js["choices"][0]["message"]["content"] or ""


def check(r):
    if r.status_code >= 400:
        try:
            detail = r.json().get("error", {}).get("message", "")
        except ValueError:
            detail = ""
        raise ValueError(f"API error {r.status_code}: {detail}"[:300])
    return r.json()


def parse(text, stocks, max_dollars):
    """Validated orders and note from the model's reply; raises ValueError with the reason if anything is off."""
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        raise ValueError("no JSON object in the reply")
    data = json.loads(m.group(0))
    orders = []
    for o in data.get("orders") or []:
        stock, side, kind = o.get("stock"), str(o.get("side", "")).lower(), str(o.get("type") or "MKT").upper()
        if stock not in stocks or side not in SIDES or kind not in KINDS:
            raise ValueError(f"invalid order {json.dumps(o)[:120]}")
        dollars, price = float(o.get("dollars") or 0), o.get("price")
        if side != "close":
            if not 1 <= dollars <= max_dollars:
                raise ValueError(f"order size ${dollars:,.0f} is outside $1-${max_dollars:,.0f}")
            if kind != "MKT" and not (isinstance(price, (int, float)) and price > 0):
                raise ValueError(f"{kind} order needs a positive price")
        orders.append({"stock": stock, "side": side, "type": kind, "dollars": dollars,
                       "price": float(price) if kind != "MKT" and side != "close" else None})
    return orders, str(data.get("note", ""))[:200]
