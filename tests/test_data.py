import pandas as pd

import pytest

from app.data import Day, rescale, trades_to_seconds


def test_trades_to_seconds_ohlcv_and_forward_fill():
    day = Day("2024-03-05", pd.Timestamp("2024-03-05 14:30:00", tz="UTC"), pd.Timestamp("2024-03-05 14:30:05", tz="UTC"))
    times = ["14:29:59.5", "14:30:01.1", "14:30:01.5", "14:30:01.9", "14:30:03.2", "14:30:03.6", "14:30:05.0"]
    trades = pd.DataFrame(
        {"p": [9.0, 10.0, 10.5, 9.8, 11.0, 50.0, 12.0], "s": [5, 100, 50, 25, 10, 3, 7],
         "ok": [True, True, True, True, True, False, True]},  # 50.0 is e.g. an out-of-sequence print
        index=pd.to_datetime([f"2024-03-05T{t}Z" for t in times], utc=True),
    )
    bars = trades_to_seconds(trades, day, prev_close=9.9)

    assert list(bars.columns) == ["o", "h", "l", "c", "v"]
    assert len(bars) == 5  # 14:30:00 .. 14:30:04; trades before open and at close are excluded
    assert bars.iloc[0].tolist() == [9.9, 9.9, 9.9, 9.9, 0]      # no trade yet: previous close
    assert bars.iloc[1].tolist() == [10.0, 10.5, 9.8, 9.8, 175]  # three trades in one second
    assert bars.iloc[2].tolist() == [9.8, 9.8, 9.8, 9.8, 0]      # empty: forward-filled close
    assert bars.iloc[3].tolist() == [11.0, 11.0, 11.0, 11.0, 13]  # flagged print: volume only
    assert bars.iloc[4].tolist() == [11.0, 11.0, 11.0, 11.0, 0]


def test_rescale_opens_at_100_and_triples_moves():
    bars = pd.DataFrame({"o": [50.0], "h": [51.0], "l": [49.5], "c": [50.5], "v": [1000.0]})
    out = rescale(bars, 2.0, amp=3.0)                   # $50 -> $100, then every move from $100 is 3x
    assert out["o"][0] == pytest.approx(100.0)
    assert out["c"][0] == pytest.approx(100 * 1.01 ** 3)  # +1% becomes about +3%
    assert out["h"][0] > out["c"][0] > out["o"][0] > out["l"][0] and out["v"][0] == 500
    assert rescale(bars, 2.0)["c"][0] == pytest.approx(101.0)
