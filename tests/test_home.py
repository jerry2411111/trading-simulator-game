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
    assert v["state"]["layouts"]["shack"][-1]["x"] == 4


def test_old_cabin_home_becomes_the_shack():
    d = home.normalize({"house": "cabin", "houses": ["cabin"], "pool": True, "earnings": {"x": 5},
                        "trees": [{"type": "pine", "planted": 0, "harvested": 0}, None, None, None]})
    assert (d["house"], d["houses"]) == ("shack", ["shack"])
    assert set(d["zones"]) == {"path", "west", "southwest"} and "earnings" not in d


def test_companion_falls_back_to_a_living_pet():
    h = Home()
    cat = h("buy", item="cat")["state"]["pets"][0]["id"]
    dog = h("buy", item="dog")["state"]["pets"][1]["id"]
    assert home.view(h.d, RICH)["companion"] == cat
    assert h("companion", id=dog)["companion"] == dog


def test_mortgage_one_house_then_the_whole_home_and_pay_back():
    h = Home()
    h.d["layouts"]["shack"] = []          # an empty room: only the loans count here
    h("buy", item="modern")
    h("mortgage", kind="house", ref="modern", plan="p70")    # worth the $20,000 base + $8,000
    assert h.cash == pytest.approx(28_000 * 0.7)
    with pytest.raises(home.HomeError):
        h("mortgage", kind="house", ref="modern", plan="p50")   # already pledged
    with pytest.raises(home.HomeError, match="plan"):
        h("mortgage", kind="all", ref="all", plan="p999")
    v = h("mortgage", kind="all", ref="all", plan="p150")     # the base is already pledged: nothing left
    assert h.cash == pytest.approx(19_600)
    assert v["locked"] and v["loan_offers"] == []
    with pytest.raises(home.HomeError, match="mortgaged"):
        h("buy", item="cat")
    whole = next(loan for loan in h.d["loans"] if loan["kind"] == "all")
    h.cash = whole["amount"] - 1 if whole["amount"] else -1
    with pytest.raises(home.HomeError, match="cash"):
        h("redeem", id=whole["id"])
    h.cash = 100.0 + whole["amount"]
    v = h("redeem", id=whole["id"])
    assert h.cash == pytest.approx(100.0) and not v["locked"]


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
              home.FISH, home.SEA, home.ICE, home.BUILD, home.CLOTHES, home.THEMES, home.CARS)
    assert sum(len(t) for t in tables) == len(home.CATALOG)  # no id is shadowed by another kind


def test_interest_is_paid_daily_and_unpaid_interest_forecloses():
    h = Home()
    h.d["layouts"]["shack"] = []          # an empty room: only the loans count here
    h("buy", item="modern")
    h("clean", zone="southwest")
    h("buy", item="pool")
    h("mortgage", kind="house", ref="modern", plan="p100")   # $28,000 loan at 0.25%: $70 a day
    h("mortgage", kind="build", ref="pool", plan="p150")     # $3,750 loan at 0.5%: $18.75 a day
    d, paid, notes = home.charge_interest(h.d, cash=100)
    assert paid == 88.75 and not notes and len(d["loans"]) == 2
    d, paid, notes = home.charge_interest(h.d, cash=80)   # pays the house's interest, not the pool's
    assert paid == 70 and not d["pool"] and [x["ref"] for x in d["loans"]] == ["modern"] and "pool" in notes[0]
    d, paid, notes = home.charge_interest(d, cash=0)      # now the house goes too
    assert "modern" not in d["houses"] and d["house"] == "shack" and d["loans"] == []
    h.d = d
    with pytest.raises(home.HomeError):
        h("sell", item="modern")


def test_foreclosing_the_whole_home_keeps_coins_pets_and_collection():
    h = Home()
    h("buy", item="cat")
    h.d["collection"] = [{"id": "hope", "t": 0, "day": 1}]
    h("buy", item="sofa")
    h("mortgage", kind="all", ref="all", plan="p50")   # $10,200 at 0.01%: $1.02 a day (the cat doesn't count)
    d, paid, notes = home.charge_interest(h.d, cash=1)
    assert d["inventory"] == {} and d["loans"] == [] and d["collection"][0]["id"] == "hope"
    assert [p["type"] for p in d["pets"]] == ["cat"]                # pets are never taken
    assert home.coins(d, RICH) == home.coins(h.d, RICH)


def test_pets_fill_the_garden_then_the_house_then_the_store_refuses():
    h = Home()
    for _ in range(home.GARDEN_PETS + home.HOUSE_PETS):
        v = h("buy", item="hamster")
    places = [p["place"] for p in v["state"]["pets"]]
    assert places.count("garden") == 5 and places.count("house") == 3 and v["pet_room"] == {"garden": 0, "house": 0}
    with pytest.raises(home.HomeError, match="full"):
        h("buy", item="rabbit")
    with pytest.raises(home.HomeError, match="full"):
        h("move_pet", id=v["state"]["pets"][0]["id"])
    with pytest.raises(home.HomeError):
        h("sell", item="hamster")                       # pets are never sold...
    v = h("release", id=v["state"]["pets"][0]["id"])   # ...only released, for nothing
    assert v["pet_room"] == {"garden": 1, "house": 0} and v["coins"] == RICH - 8 * 20
    h("buy", item="rabbit")


def test_pricey_pets_have_their_own_clothes():
    h = Home()
    corgi = h("buy", item="corgi")["state"]["pets"][0]["id"]
    assert home.CATALOG["corgi"]["premium"] and not home.CATALOG["hamster"]["premium"]
    with pytest.raises(home.HomeError, match="made for"):
        h("buy_clothes", id=corgi, item="poodle.tutu")
    v = h("buy_clothes", id=corgi, item="corgi.crown")
    pet = v["state"]["pets"][0]
    assert pet["outfits"] == ["corgi.crown"] and pet["wearing"] == "corgi.crown"
    assert h("wear", id=corgi, item=None)["state"]["pets"][0]["wearing"] is None
    with pytest.raises(home.HomeError, match="Buy"):
        h("wear", id=corgi, item="corgi.sweater")


def test_a_house_mortgages_with_its_furniture_and_pets_never_count():
    h = Home()
    h.d["layouts"]["shack"] = []          # an empty room
    h("buy", item="sofa")
    h("place", item="sofa", x=4, y=0, rot=0)
    h("buy", item="corgi")
    offers = {(o["kind"], o["ref"]): o["value"] for o in h("buy", item="toilet")["loan_offers"]}
    assert offers[("house", "shack")] == 20_000 + 0 + 400                 # base + shack + the sofa in it
    assert offers[("all", "all")] == 20_000 + 400 + 150                   # + the toilet in the inventory, no corgi
    sofa = next(f for f in h.d["layouts"]["shack"] if f["item"] == "sofa")["id"]
    v = h("mortgage", kind="furniture", ref=sofa, plan="p50")
    assert {(o["kind"], o["ref"]): o["value"] for o in v["loan_offers"]}[("house", "shack")] == 20_000


def test_a_garden_theme_cleans_everything_and_can_be_switched():
    h = Home()
    v = h("buy", item="christmas")
    assert set(v["state"]["zones"]) == set(home.ZONES) and v["state"]["zones"]["west"] == {"floor": "snow"}
    assert v["coins"] == RICH - 3000                                  # the cleanup is included
    h("buy", item="cyberpunk")
    v = h("theme", item="christmas")                                  # owned themes switch for free
    assert v["state"]["theme"] == "christmas" and v["coins"] == RICH - 8000
    with pytest.raises(home.HomeError, match="store"):
        h("theme", item="royal")


def test_wall_pieces_hang_side_by_side_on_the_back_wall():
    h = Home()
    for item in ("painting_sunset", "window_arched", "sofa"):
        h("buy", item=item)
    h.d["layouts"]["shack"] = []          # an empty room
    h("place", item="painting_sunset", x=0, y=-1, rot=0)
    with pytest.raises(home.HomeError):
        h("place", item="window_arched", x=1, y=-1, rot=0)            # overlaps the 2-wide painting
    with pytest.raises(home.HomeError):
        h("place", item="window_arched", x=3, y=2, rot=0)             # not on the floor
    h("place", item="window_arched", x=2, y=-1, rot=0)
    v = h("place", item="sofa", x=0, y=0, rot=0)                      # the floor below is still free
    assert len(v["state"]["layouts"]["shack"]) == 3


def test_garage_holds_five_cars_sells_at_half_and_merges_into_a_big_house():
    h = Home(cash=0)
    h.d["income"] = 500_000
    with pytest.raises(home.HomeError, match="garage"):
        h("buy", item="corolla")
    v = h("buy", item="garage")
    assert not v["garage_merged"]                                    # the shack is too small
    for _ in range(home.GARAGE_CARS):
        v = h("buy", item="civic")
    with pytest.raises(home.HomeError, match="full"):
        h("buy", item="civic")
    before = v["coins"]
    v = h("sell_car", id=v["state"]["cars"][0]["id"])
    assert v["coins"] == before + 12000 and len(v["state"]["cars"]) == 4
    assert h("buy", item="euro")["garage_merged"]                   # the country house has it built in
    offers = {(o["kind"], o["ref"]) for o in v["loan_offers"]}
    assert ("car", v["state"]["cars"][0]["id"]) in offers


def test_the_front_path_is_clean_from_the_start():
    assert home.new()["zones"] == {"path": {"floor": None}}
    assert "path" in home.normalize({"zones": {}})["zones"]
    with pytest.raises(home.HomeError, match="already clean"):
        Home()("clean", zone="path")


def test_a_new_home_has_a_bathroom_a_mattress_and_a_laptop_that_move_house():
    h = Home()
    items = sorted(f["item"] for f in h.d["layouts"]["shack"])
    assert items == ["mattress", "old_laptop", "shower", "toilet"]
    h("buy", item="sofa")
    h("place", item="sofa", x=4, y=0, rot=0)
    v = h("buy", item="palace_gold")                       # upgrading: the furniture comes along
    moved = v["state"]["layouts"]["palace_gold"]
    assert sorted(f["item"] for f in moved) == ["mattress", "old_laptop", "shower", "sofa", "toilet"]
    assert v["state"]["layouts"].get("shack", []) == [] and v["state"]["house"] == "palace_gold"


def test_an_older_empty_shack_gets_the_starter_furniture():
    d = home.normalize({"house": "shack", "houses": ["shack"], "layouts": {}})
    assert len(d["layouts"]["shack"]) == len(home.STARTER)


def test_slot_spins_are_banked_and_prizes_stored():
    import asyncio
    from app.game import Game
    sent = []

    async def out(m):
        sent.append(m)

    g = Game(out)
    g.autosave = lambda: None

    async def run():
        await g.count_trades([{}] * 4)
        assert g.spins == 0
        await g.count_trades([{}] * 7)                    # 11 trades: two spins earned, none pulled
        assert g.spins == 2 and not g.prizes
        await g.spin()
        assert g.spins == 1 and sum(g.prizes.values()) == 1
        assert sent[-1]["type"] == "slot" and sent[-1]["bonus"]["prizes"][0]["n"] == 1
        g.prizes = {"x5": 1, "gift": 1, "range2h": 1}
        await g.use_prize("x5")
        assert g.boost["mult"] == 5 and "x5" not in g.prizes
        await g.use_prize("gift")
        assert len(g.home["collection"]) == 1 and "gift" not in g.prizes
        await g.use_prize("range2h")                      # no game running: refused and kept
        assert g.prizes == {"range2h": 1} and sent[-1]["type"] == "error"
        await g.use_prize("shield")                       # not owned
        assert sent[-1]["type"] == "error" and not g.boost["shield"]
        g.spins = 0
        await g.spin()
        assert sent[-1]["type"] == "error"
        d = g.to_dict()
        g2 = Game(out)
        g2.start_worker = lambda: None
        d["prizes"] = {**d["prizes"], "bogus": 3}
        g2.restore(d)
        assert g2.prizes == {"range2h": 1} and g2.spins == 0

    asyncio.run(run())
