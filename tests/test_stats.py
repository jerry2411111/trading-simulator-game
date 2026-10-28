import math

import pytest

from app import stats


def test_sharpe_sortino_drawdown_on_toy_curve():
    curve = [100, 110, 99, 108.9]  # returns +10%, -10%, +10%
    r = stats.returns(curve)
    assert r == pytest.approx([0.1, -0.1, 0.1])
    # mean 1/30; sample std sqrt(((1/15)^2 * 2 + (2/15)^2) / 2) = sqrt(1/75); downside sqrt(0.01 / 3)
    assert stats.sharpe(r, 1) == pytest.approx((1 / 30) / math.sqrt(1 / 75))
    assert stats.sortino(r, 1) == pytest.approx((1 / 30) / math.sqrt(0.01 / 3))
    assert stats.max_drawdown(curve) == pytest.approx(0.1)  # 110 -> 99
    day = stats.day_summary(1, curve, [])
    assert day["return"] == pytest.approx(0.089)
    assert day["sharpe"] == pytest.approx(stats.sharpe(r, stats.MINUTE_FACTOR))
