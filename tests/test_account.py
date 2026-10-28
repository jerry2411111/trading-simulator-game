import pytest

from app.account import Account, OrderError


def test_buy_partial_sell_flip_cover_with_fees():
    a = Account(leverage=4)  # $10,000, fee $0.005/share, $1 minimum
    a.order("X", "buy", 1000, {"X": 10.0})     # +100 @ 10, fee 1
    assert a.cash == 8999
    t = a.order("X", "sell", 400, {"X": 12.0})  # -33 @ 12 -> 67 left, realized +66
    assert (a.shares["X"], a.cash, t["pnl"]) == (67, 9394, 66)
    t = a.order("X", "sell", 1500, {"X": 15.0})  # -100 @ 15 -> short 33, realized +335 on the 67 closed
    assert (a.shares["X"], a.cost["X"], a.cash, t["pnl"]) == (-33, 15.0, 10893, 335)
    assert a.equity({"X": 11.0}) == 10893 - 33 * 11
    t = a.order("X", "close", 0, {"X": 11.0})   # cover 33 @ 11, realized +132
    assert ("X" not in a.shares, a.cash, t["pnl"], a.fees) == (True, 10529, 132, 4)
    assert a.equity({"X": 11.0}) == 10529     # 10,000 + 66 + 335 + 132 - 4 fees


def test_rejects_order_over_buying_power():
    a = Account(leverage=2)
    with pytest.raises(OrderError):
        a.order("X", "buy", 25_000, {"X": 10.0})
    assert a.cash == 10_000 and not a.trades
