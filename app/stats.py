"""Return, max drawdown, Sharpe and Sortino for the day card and the stats screen."""
import math

import numpy as np

MINUTE_FACTOR = math.sqrt(390 * 252)  # annualizes 1-minute returns
DAY_FACTOR = math.sqrt(252)           # annualizes daily returns
MIN_DAYS = 5                          # fewer days: overall Sharpe/Sortino shown as "—"


def returns(curve):
    c = np.asarray(curve, float)
    return c[1:] / c[:-1] - 1


def max_drawdown(curve):
    c = np.asarray(curve, float)
    return float(np.max(1 - c / np.maximum.accumulate(c))) if len(c) else 0.0


def sharpe(r, factor):
    r = np.asarray(r, float)
    sd = r.std(ddof=1) if len(r) > 1 else 0.0
    return float(r.mean() / sd * factor) if sd > 0 else None


def sortino(r, factor):
    r = np.asarray(r, float)
    down = math.sqrt(np.mean(np.minimum(r, 0) ** 2)) if len(r) else 0.0
    return float(r.mean() / down * factor) if down > 0 else None


def trade_stats(trades):
    closing = [t for t in trades if t["pnl"]]
    return {"trades": len(trades), "fees": sum(t["fee"] for t in trades),
            "win_rate": sum(t["pnl"] > 0 for t in closing) / len(closing) if closing else None}


def day_summary(day, curve, trades):
    r = returns(curve)
    return {"day": day, "start": curve[0], "end": curve[-1], "return": curve[-1] / curve[0] - 1,
            "max_dd": max_drawdown(curve), "sharpe": sharpe(r, MINUTE_FACTOR), "sortino": sortino(r, MINUTE_FACTOR),
            **trade_stats(trades)}


def overall(days, trades, curve):
    r = [d["return"] for d in days]
    enough = len(days) >= MIN_DAYS
    return {"days": len(days), "return": curve[-1] / curve[0] - 1 if curve else 0.0, "max_dd": max_drawdown(curve),
            "sharpe": sharpe(r, DAY_FACTOR) if enough else None, "sortino": sortino(r, DAY_FACTOR) if enough else None,
            **trade_stats(trades)}
