"""Random start day and volatile-stock pool, from the maintainer-editable universe.json."""
import json
import math
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

from .data import ET

UNIVERSE = Path(__file__).with_name("universe.json")
FIRST_START = "2024-01-02"
LOOKBACK = 20        # trading days used to rank intraday range
WARMUP = 5           # trading days of 1-minute bars before day 1
MARGIN = 10          # latest start = today minus this many trading days
TOP_FRACTION = 0.3


async def trading_days(client):
    """Trading days from a little before FIRST_START (room for look-back) through yesterday."""
    start = date.fromisoformat(FIRST_START) - timedelta(days=45)
    return await client.calendar(start.isoformat(), (date.today() - timedelta(days=1)).isoformat())


def pick_start(days, rng):
    lo = next(i for i, d in enumerate(days) if d.date >= FIRST_START)
    return rng.randint(lo, len(days) - MARGIN)


async def volatile_pool(client, days, first):
    """Top 30% of the universe by average (high - low) / open over the LOOKBACK days before day 1,
    minus tickers that did not trade on day 1."""
    tickers = json.loads(UNIVERSE.read_text())["tickers"]
    start = pd.Timestamp(days[first - LOOKBACK].date, tz="UTC")
    bars = await client.bars(tickers, "1Day", start, days[first].close)
    day1 = days[first].date
    score, traded = {}, set()
    for sym, df in bars.items():
        dates = df.index.tz_convert(ET).strftime("%Y-%m-%d")
        before = df[dates < day1]
        if len(before):
            score[sym] = ((before["h"] - before["l"]) / before["o"]).mean()
        if day1 in dates:
            traded.add(sym)
    top = sorted(score, key=score.get, reverse=True)[: math.ceil(len(score) * TOP_FRACTION)]
    return [t for t in top if t in traded]


def pick(pool, exclude, rng):
    left = [t for t in pool if t not in exclude]
    return rng.choice(left) if left else None
