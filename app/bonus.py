"""The slot machine: every 5 trades the player earns a spin. Spins are banked until the player pulls the
lever, and each prize goes into storage until the player chooses to use it (weights add up to 100).

Boosts wait for the player's next closing trade (a trade that realizes profit or loss):
  2x / 5x  the net profit of that trade is paid again (once / four times more); losses are not multiplied
  shield   a net loss on that trade is paid back, so it costs nothing
Fee-free trades skip both the fee and the spread. Reveals are shown on the chart; a gift goes to the
collection.
"""
EVERY = 5

OUTCOMES = {  # weight, title, explanation
    "double": (20, "2x", "Your next closing trade pays double profit."),
    "shield": (10, "SHIELD", "Your next closing trade can't lose money."),
    "next_day": (10, "ORACLE", "See which way this stock closes tomorrow."),
    "x5": (5, "5x", "Your next closing trade pays five times the profit."),
    "free10": (10, "FREE 10", "Your next 10 trades have no fee and no spread."),
    "gift": (5, "GIFT", "A rare piece for your collection."),
    "range2h": (30, "2H RANGE", "See the highest and lowest price of the next 2 hours."),
    "free30": (10, "FREE 30", "Your next 30 trades have no fee and no spread."),
}
assert sum(w for w, _, _ in OUTCOMES.values()) == 100


def new_boost():
    return {"mult": 1, "shield": False, "free": 0}


def spin(rng):
    keys = list(OUTCOMES)
    return rng.choices(keys, weights=[OUTCOMES[k][0] for k in keys])[0]


def grant(boost, outcome):
    """Apply a boost outcome; reveals and gifts are handled by the game."""
    if outcome == "double":
        boost["mult"] = max(boost["mult"], 2)
    elif outcome == "x5":
        boost["mult"] = 5
    elif outcome == "shield":
        boost["shield"] = True
    elif outcome in ("free10", "free30"):
        boost["free"] += 10 if outcome == "free10" else 30


def settle(boost, trade):
    """The bonus paid on a closing trade (0 if none), using up the waiting multiplier / shield."""
    if not trade["pnl"] or (boost["mult"] == 1 and not boost["shield"]):
        return 0.0
    net = trade["pnl"] - trade["fee"]
    bonus = net * (boost["mult"] - 1) if net > 0 else (-net if boost["shield"] else 0.0)
    boost["mult"], boost["shield"] = 1, False
    return round(bonus, 2)
