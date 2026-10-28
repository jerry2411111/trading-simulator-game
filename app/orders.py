"""Waiting orders: limit (LMT) and conditional market orders (IF_ABOVE / IF_BELOW). Day orders only.

LMT buy fills when price falls to the limit (LMT sell: rises to it), at the limit or a better bar open.
IF_ABOVE / IF_BELOW send a market order once price reaches the trigger, filled at that second's close.
"""
KINDS = ("MKT", "LMT", "IF_ABOVE", "IF_BELOW")


def marketable(kind, side, trigger, price):
    """True if the order would fill immediately at the current price."""
    if kind == "LMT":
        return price <= trigger if side == "buy" else price >= trigger
    if kind == "IF_ABOVE":
        return price >= trigger
    if kind == "IF_BELOW":
        return price <= trigger
    return True


def first_fill(order, bars):
    """(row in `bars`, fill price) for the first bar that fills `order`, or None."""
    p, kind, side = order["price"], order["type"], order["side"]
    if kind == "IF_ABOVE" or (kind == "LMT" and side == "sell"):
        hit = (bars["h"] >= p).to_numpy()
    else:
        hit = (bars["l"] <= p).to_numpy()
    if not hit.any():
        return None
    j = int(hit.argmax())
    bar = bars.iloc[j]
    if kind == "LMT":
        return j, float(min(p, bar["o"]) if side == "buy" else max(p, bar["o"]))
    return j, float(bar["c"])
