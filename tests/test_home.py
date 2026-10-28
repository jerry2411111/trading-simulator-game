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
    h("mortgage", kind="house", ref="modern")
    assert h.cash == 8000 * home.MORTGAGE
    with pytest.raises(home.HomeError):
        h("mortgage", kind="house", ref="modern")   # already pledged
    v = h("mortgage", kind="all", ref="all")      # $20,000 + 70% of what isn't pledged yet (nothing)
    assert h.cash == pytest.approx(5600 + 20_000)
    assert v["locked"] and v["loan_offers"] == []
    with pytest.raises(home.HomeError, match="mortgaged"):
        h("buy", item="cat")
    whole = next(loan for loan in h.d["loans"] if loan["kind"] == "all")
    h.cash = 100.0
    with pytest.raises(home.HomeError, match="cash"):
        h("redeem", id=whole["id"])
    h.cash = 30_000.0
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
