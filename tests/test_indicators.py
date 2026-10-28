import numpy as np
import pandas as pd
import pytest

from app import indicators


def test_ema_and_macd_match_hand_computed_values():
    assert indicators.ema(np.array([1.0, 2.0, 3.0, 4.0]), 3) == pytest.approx([1, 1.5, 2.25, 3.125])
    line, signal, hist = indicators.macd(np.array([1.0, 2.0, 3.0]), fast=2, slow=3, signal=2)
    # ema2 = [1, 5/3, 23/9], ema3 = [1, 1.5, 2.25] -> line = [0, 1/6, 11/36]; signal = ema2(line)
    assert line == pytest.approx([0, 1 / 6, 11 / 36])
    assert signal == pytest.approx([0, 1 / 9, 13 / 54])
    assert hist == pytest.approx([0, 1 / 18, 11 / 36 - 13 / 54])


def test_appending_future_bars_does_not_change_earlier_values():
    rng = np.random.default_rng(0)
    c = 100 + rng.normal(0, 0.05, 900).cumsum()
    bars = pd.DataFrame({"o": c, "h": c + 0.03, "l": c - 0.03, "c": c})
    full, part = indicators.compute(bars), indicators.compute(bars.iloc[:700])
    for name in indicators.NAMES:
        for a, b in zip(full[name], part[name]):
            np.testing.assert_allclose(a[:700], b, equal_nan=True)
