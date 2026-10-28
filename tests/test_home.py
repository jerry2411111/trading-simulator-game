import random

import pytest

from app import bonus, collection, home

RICH = 100_000  # trading profit of the game the home belongs to


class Home:
    """A home plus the dollars mortgages moved into (+) or out of (-) the trading account."""

    def __init__(self, cash=0.0):
        self.d, self.cash = home.new(), cash

    def __call__(self, action, **body):
        self.d, dollars = home.act(self.d, action, body, RICH, self.cash)
        self.cash += dollars
        return home.view(self.d, RICH)


def test_wasteland_must_be_cleaned_before_planting():
    h = Home()
    h("buy", item="rose")
    with pytest.raises(home.HomeError, match="Clean up"):
        h("plant", where="flowers", slot=0, item="rose")
    with pytest.raises(home.HomeError, match="Clean up"):
        h("buy", item="pool")
    h("clean", zone="plaza")
    v = h("plant", where="flowers", slot=0, item="rose")
    assert v["state"]["flowers"][0]["type"] == "rose"
    v = h("floor", zone="plaza", item="stone")
    assert v["state"]["zones"]["plaza"] == {"floor": "stone"}
    assert v["coins"] == RICH - 15 - 80 - 160
    with pytest.raises(home.HomeError, match="already clean"):
        h("clean", zone="plaza")


def test_a_refused_action_changes_nothing():
    h = Home()
    before = h.d
    with pytest.raises(home.HomeError):
        home.act(h.d, "buy", {"item": "lion"}, 10, 0)  # only 10 coins
    assert h.d is before and h.d["pets"] == [] and h.d["spent"] == 0


def test_fish_tank_unlocks_fish_then_aquarium_then_ice_land():
    h = Home()
    with pytest.raises(home.HomeError, match="fish tank"):
        h("buy", item="goldfish")
    h("buy", item="fish_tank")
    for _ in range(home.TANK_FISH):
        h("buy", item="guppy")
    with pytest.raises(home.HomeError, match="full"):
        h("buy", item="guppy")
    with pytest.raises(home.HomeError, match="aquarium"):
        h("buy", item="shark")
    with pytest.raises(home.HomeError, match="fish live"):
        h("sell", item="fish_tank")
    h("buy", item="aquarium")
    h("buy", item="shark")
    with pytest.raises(home.HomeError, match="ice land"):
        h("buy", item="penguin")
    h("buy", item="iceland")
    v = h("buy", item="penguin")
    assert v["aqua_meal"] == pytest.approx(home.TANK_FISH * 0.2 + 10 + 3)
    assert h("feed_aquatic")["coins"] == pytest.approx(v["coins"] - v["aqua_meal"])


def test_furniture_cannot_cross_inner_walls():
    h = Home()
    h("buy", item="sofa")
    with pytest.raises(home.HomeError):   # the shack's bathroom wall is left of column 7
        h("place", item="sofa", x=5, y=0, rot=0)
    v = h("place", item="sofa", x=4, y=0, rot=0)
    assert v["state"]["layouts"]["shack"][0]["x"] == 4


def test_old_cabin_home_becomes_the_shack():
    d = home.normalize({"house": "cabin", "houses": ["cabin"], "pool": True, "earnings": {"x": 5},
                        "trees": [{"type": "pine", "planted": 0, "harvested": 0}, None, None, None]})
    assert (d["house"], d["houses"]) == ("shack", ["shack"])
    assert set(d["zones"]) == {"west", "southwest"} and "earnings" not in d


def test_companion_falls_back_to_a_living_pet():
    h = Home()
    cat = h("buy", item="cat")["state"]["pets"][0]["id"]
    dog = h("buy", item="dog")["state"]["pets"][1]["id"]
    assert home.view(h.d, RICH)["companion"] == cat
    assert h("companion", id=dog)["companion"] == dog


def test_mortgage_one_house_then_the_whole_home_and_pay_back():
    h = Home()
    h("buy", item="modern")
    h("mortgage", kind="house", ref="modern", plan="p70")
    assert h.cash == 8000 * 0.7
    with pytest.raises(home.HomeError):
        h("mortgage", kind="house", ref="modern", plan="p50")   # already pledged
    with pytest.raises(home.HomeError, match="plan"):
        h("mortgage", kind="all", ref="all", plan="p999")
    v = h("mortgage", kind="all", ref="all", plan="p150")     # 150% of $20,000 + what isn't pledged (nothing)
    assert h.cash == pytest.approx(5600 + 30_000)
    assert v["locked"] and v["loan_offers"] == []
    with pytest.raises(home.HomeError, match="mortgaged"):
        h("buy", item="cat")
    whole = next(loan for loan in h.d["loans"] if loan["kind"] == "all")
    h.cash = 100.0
    with pytest.raises(home.HomeError, match="cash"):
        h("redeem", id=whole["id"])
    h.cash = 40_000.0
    v = h("redeem", id=whole["id"])
    assert h.cash == 10_000.0 and not v["locked"]


def test_slot_machine_bonuses():
    b = bonus.new_boost()
    bonus.grant(b, "x5")
    assert bonus.settle(b, {"pnl": 0.0, "fee": 1}) == 0          # opening trade: boost waits
    assert bonus.settle(b, {"pnl": 21.0, "fee": 1}) == 80        # net 20, paid 4 more times
    assert bonus.settle(b, {"pnl": 21.0, "fee": 1}) == 0         # used up
    bonus.grant(b, "shield")
    assert bonus.settle(b, {"pnl": -50.0, "fee": 1}) == 51       # the whole net loss comes back
    bonus.grant(b, "double")
    assert bonus.settle(b, {"pnl": -5.0, "fee": 1}) == 0         # losses are never multiplied
    rng = random.Random(1)
    counts = {k: 0 for k in bonus.OUTCOMES}
    for _ in range(20_000):
        counts[bonus.spin(rng)] += 1
    assert abs(counts["range2h"] / 20_000 - 0.30) < 0.02 and abs(counts["x5"] / 20_000 - 0.05) < 0.01


def test_collection_gifts_are_unique_until_complete():
    rng = random.Random(2)
    owned = set()
    for _ in range(100):
        owned.add(collection.gift(owned, rng)["id"])
    assert len(owned) == 100 and collection.gift(owned, rng) is None


def test_catalog_ids_are_unique():
    tables = (home.PETS, home.FLOWERS, home.TREES, home.ZONES, home.FLOORS, home.HOUSES, home.FURNITURE,
              home.FISH, home.SEA, home.ICE, home.BUILD)
    assert sum(len(t) for t in tables) == len(home.CATALOG)  # no id is shadowed by another kind


def test_interest_is_paid_daily_and_unpaid_interest_forecloses():
    h = Home()
    h("buy", item="modern")
    h("clean", zone="southwest")
    h("buy", item="pool")
    h("mortgage", kind="house", ref="modern", plan="p100")   # $8,000 loan at 0.25%: $20 a day
    h("mortgage", kind="build", ref="pool", plan="p150")     # $3,750 loan at 0.5%: $18.75 a day
    d, paid, notes = home.charge_interest(h.d, cash=100)
    assert paid == 38.75 and not notes and len(d["loans"]) == 2
    d, paid, notes = home.charge_interest(h.d, cash=30)   # pays the house's interest, not the pool's
    assert paid == 20 and not d["pool"] and [x["ref"] for x in d["loans"]] == ["modern"] and "pool" in notes[0]
    d, paid, notes = home.charge_interest(d, cash=0)      # now the house goes too
    assert "modern" not in d["houses"] and d["house"] == "shack" and d["loans"] == []
    h.d = d
    with pytest.raises(home.HomeError):
        h("sell", item="modern")


def test_foreclosing_the_whole_home_keeps_coins_and_collection():
    h = Home()
    h("buy", item="cat")
    h.d["collection"] = [{"id": "hope", "t": 0, "day": 1}]
    h("mortgage", kind="all", ref="all", plan="p50")   # $10,125 at 0.01%: about $1.01 a day
    d, paid, notes = home.charge_interest(h.d, cash=1)
    assert d["pets"] == [] and d["loans"] == [] and d["collection"][0]["id"] == "hope"
    assert home.coins(d, RICH) == home.coins(h.d, RICH)
