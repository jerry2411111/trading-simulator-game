import pandas as pd

from app.data import Day, trades_to_seconds


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
