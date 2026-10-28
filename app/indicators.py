"""Chart indicators on 1-second bars.

Every indicator is causal: value i uses bars 0..i only. So a whole day can be computed once and the
player is only ever sent the prefix up to the replay clock.
"""
import re

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

MA_PERIODS = (5, 10, 20, 30, 60, 120)
EMA_PERIODS = (5, 9, 12, 20, 26, 50, 100, 200)
NAMES = ([f"ma{n}" for n in MA_PERIODS] + [f"ema{n}" for n in EMA_PERIODS]
         + ["boll", "sar", "macd", "kdj", "band"])
PERIODIC = re.compile(r"^(ma|ema)(\d+)$")
COLUMNS = {"boll": ["upper", "mid", "lower"], "macd": ["macd", "signal", "hist"], "kdj": ["k", "d", "j"],
           "band": ["sigma_1s"]}
BAND_WINDOW = 600    # seconds of history behind the random-walk band (10 minutes)
BAND_HORIZON = 300   # seconds ahead the band reaches (5 minutes)
BAND_Z = 1.96        # 95% two-sided


def sma(x, n):
    out = np.full(len(x), np.nan)
    if len(x) >= n:
        c = np.cumsum(np.insert(x, 0, 0.0))
        out[n - 1:] = (c[n:] - c[:-n]) / n
    return out


def ema(x, n):
    """Exponential moving average seeded with the first value."""
    a = 2 / (n + 1)
    out = np.empty(len(x))
    acc = 0.0
    for i, v in enumerate(x):
        acc = v if i == 0 else a * v + (1 - a) * acc
        out[i] = acc
    return out


def rolling(x, n, fn):
    out = np.full(len(x), np.nan)
    if len(x) >= n:
        out[n - 1:] = fn(sliding_window_view(x, n), axis=1)
    return out


def boll(c, n=20, k=2):
    mid, sd = sma(c, n), rolling(c, n, np.std)
    return [mid + k * sd, mid, mid - k * sd]


def macd(c, fast=12, slow=26, signal=9):
    line = ema(c, fast) - ema(c, slow)
    sig = ema(line, signal)
    return [line, sig, line - sig]


def kdj(h, l, c, n=9, m1=3, m2=3):
    hh, ll = rolling(h, n, np.max), rolling(l, n, np.min)
    rng = hh - ll
    with np.errstate(invalid="ignore", divide="ignore"):
        rsv = np.where(rng > 0, (c - ll) / rng * 100, 50.0)  # flat or not enough bars: neutral 50
    k, d = np.empty(len(c)), np.empty(len(c))
    kp = dp = 50.0
    for i, r in enumerate(rsv):
        kp = (kp * (m1 - 1) + r) / m1
        dp = (dp * (m2 - 1) + kp) / m2
        k[i], d[i] = kp, dp
    return [k, d, 3 * k - 2 * d]


def sar(h, l, step=0.02, top=0.2):
    """Parabolic SAR (Wilder), starting in an up-trend at the first bar."""
    out = np.full(len(h), np.nan)
    if not len(h):
        return out
    up, s, ep, af = True, l[0], h[0], step
    out[0] = s
    for i in range(1, len(h)):
        s += af * (ep - s)
        if up:
            s = min(s, l[i - 1], l[max(i - 2, 0)])
            if l[i] < s:
                up, s, ep, af = False, ep, l[i], step
            elif h[i] > ep:
                ep, af = h[i], min(af + step, top)
        else:
            s = max(s, h[i - 1], h[max(i - 2, 0)])
            if h[i] > s:
                up, s, ep, af = True, ep, h[i], step
            elif l[i] < ep:
                ep, af = l[i], min(af + step, top)
        out[i] = s
    return out


def walk_sigma(c, n=BAND_WINDOW):
    """Std of 1-second log returns over the last n seconds. A random walk from price P then stays within
    P * exp(+-1.96 * sigma * sqrt(h)) for h seconds with 95% probability."""
    r = np.diff(np.log(c), prepend=np.nan)
    return rolling(r, n, np.std)


def band(sigma, price, h=BAND_HORIZON):
    """(lower, upper) 95% random-walk band h seconds ahead."""
    w = BAND_Z * sigma * np.sqrt(h)
    return price * np.exp(-w), price * np.exp(w)


def compute_one(bars, name):
    """[column, ...] of one indicator (see NAMES), aligned with `bars` (o/h/l/c frame)."""
    h, l, c = (bars[k].to_numpy(float) for k in "hlc")
    if m := PERIODIC.match(name):
        return [(sma if m[1] == "ma" else ema)(c, int(m[2]))]
    return {"boll": lambda: boll(c), "sar": lambda: [sar(h, l)], "macd": lambda: macd(c),
            "kdj": lambda: kdj(h, l, c), "band": lambda: [walk_sigma(c)]}[name]()


def compute(bars):
    return {name: compute_one(bars, name) for name in NAMES}


def latest(values, i):
    """Readable values of every indicator at bar i (for the AI trader); None where not enough data."""
    out = {}
    for name, cols in values.items():
        vals = [None if np.isnan(col[i]) else round(float(col[i]), 6) for col in cols]
        out[name] = dict(zip(COLUMNS[name], vals)) if name in COLUMNS else vals[0]
    return out
