"""Home and store: a self-contained economy around the trading game. Saved in data/home.json.

Coins = the profit of every game (by session; Clear PnL resets that game's share to 0)
      + income from the home (harvesting flowers and trees, selling items back)
      - spending (purchases, pet food). Every coin movement is logged.
"""
import json
import time
import uuid

from .data import DATA_DIR

HOME = DATA_DIR / "home.json"
DAY = 86400
HUNGRY_AFTER, DEAD_AFTER = 2 * DAY, 7 * DAY     # since the last meal
FLOWER_SLOTS, TREE_SLOTS = 6, 4
FLOWER_HOURS = 8                                  # seed to bloom
FLOWER_SELL = 2.0                                 # a bloomed flower sells for twice its seed price
SELL_BACK = 0.5                                   # unused items sell back at half price
POOL_PRICE = 2500
LOG_SIZE = 40

PETS = {  # name, price, cost of one meal
    "turtle": ("Turtle", 60, 2), "lizard": ("Lizard", 150, 3), "cat": ("Cat", 250, 5),
    "dog": ("Dog", 400, 8), "parrot": ("Parrot", 600, 4), "lion": ("Lion", 4000, 40),
}
FLOWERS = {  # name, price
    "daisy": ("Daisy", 5), "poppy": ("Poppy", 7), "tulip": ("Tulip", 8), "bluebell": ("Bluebell", 9),
    "sunflower": ("Sunflower", 10), "lavender": ("Lavender", 12), "rose": ("Rose", 15), "lily": ("Lily", 18),
}
TREES = {  # name, price, hours to grow up, harvest (coins), hours between harvests
    "pine": ("Pine", 60, 24, 8, 24), "maple": ("Maple", 80, 36, 20, 48),
    "apple": ("Apple tree", 120, 48, 15, 24), "sakura": ("Sakura", 600, 72, 30, 24),
}
HOUSES = {  # name, price, level, floor grid (w, h)
    "cabin": ("Old cabin", 0, 1, (9, 6)), "modern": ("Modern house", 8000, 2, (11, 7)),
    "euro": ("European house", 9000, 2, (11, 7)), "tower": ("Modern tower", 25000, 3, (14, 8)),
    "palace_cn": ("Chinese palace", 30000, 3, (14, 8)), "palace_eu": ("European palace", 35000, 3, (14, 8)),
}
FURNITURE = {  # name, price, footprint (w, h) in floor tiles
    "chair": ("Chair", 40, (1, 1)), "cat_bed": ("Cat bed", 40, (1, 1)), "plant_pot": ("Potted plant", 25, (1, 1)),
    "floor_lamp": ("Floor lamp", 45, (1, 1)), "big_plant": ("Big plant", 60, (1, 1)), "bean_bag": ("Bean bag", 70, (1, 1)),
    "office_chair": ("Office chair", 80, (1, 1)), "easel": ("Easel", 90, (1, 1)), "vase": ("Vase", 35, (1, 1)),
    "coffee_table": ("Coffee table", 90, (2, 1)), "rug": ("Rug", 120, (3, 2)), "sink": ("Sink", 130, (1, 1)),
    "armchair": ("Armchair", 150, (1, 1)), "desk": ("Desk", 150, (2, 1)), "toilet": ("Toilet", 150, (1, 1)),
    "dresser": ("Dresser", 160, (2, 1)), "bookshelf": ("Bookshelf", 180, (2, 1)), "dining_table": ("Dining table", 200, (2, 2)),
    "guitar": ("Guitar", 200, (1, 1)), "counter": ("Kitchen counter", 220, (2, 1)), "wardrobe": ("Wardrobe", 250, (2, 1)),
    "record_player": ("Record player", 250, (1, 1)), "bed": ("Bed", 300, (2, 3)), "fish_tank": ("Fish tank", 350, (2, 1)),
    "telescope": ("Telescope", 350, (1, 1)), "sofa": ("Sofa", 400, (3, 1)), "console": ("Game console", 400, (1, 1)),
    "stove": ("Stove", 450, (1, 1)), "tv": ("TV", 500, (2, 1)), "clock": ("Grandfather clock", 500, (1, 1)),
    "bathtub": ("Bathtub", 600, (2, 1)), "double_bed": ("Double bed", 600, (3, 3)), "fridge": ("Fridge", 700, (1, 1)),
    "fireplace": ("Fireplace", 800, (2, 1)), "computer": ("Computer desk", 900, (2, 1)), "arcade": ("Arcade machine", 1200, (1, 1)),
    "piano": ("Piano", 1500, (2, 1)),
}

CATALOG = {
    **{k: {"kind": "pet", "name": n, "price": p, "meal": m} for k, (n, p, m) in PETS.items()},
    **{k: {"kind": "flower", "name": n, "price": p, "hours": FLOWER_HOURS, "sells": p * FLOWER_SELL}
       for k, (n, p) in FLOWERS.items()},
    **{k: {"kind": "tree", "name": n, "price": p, "hours": h, "yield": y, "every": e}
       for k, (n, p, h, y, e) in TREES.items()},
    **{k: {"kind": "house", "name": n, "price": p, "level": lv, "grid": g} for k, (n, p, lv, g) in HOUSES.items()},
    **{k: {"kind": "furniture", "name": n, "price": p, "size": s} for k, (n, p, s) in FURNITURE.items()},
    "pool": {"kind": "pool", "name": "Swimming pool", "price": POOL_PRICE},
}


class HomeError(Exception):
    """A refused action; the message is shown to the player."""


def _default():
    return {"earnings": {}, "income": 0.0, "spent": 0.0, "log": [], "house": "cabin", "houses": ["cabin"],
            "pool": False, "pets": [], "flowers": [None] * FLOWER_SLOTS, "trees": [None] * TREE_SLOTS,
            "inventory": {}, "layouts": {}}


def load():
    try:
        return {**_default(), **json.loads(HOME.read_text())}
    except (OSError, ValueError):
        return _default()


def _save(d):
    HOME.parent.mkdir(parents=True, exist_ok=True)
    tmp = HOME.with_suffix(".tmp")
    tmp.write_text(json.dumps(d))
    tmp.replace(HOME)


def coins(d):
    return round(sum(d["earnings"].values()) + d["income"] - d["spent"], 2)


def _log(d, text, amount):
    d["log"] = (d["log"] + [{"t": time.time(), "text": text, "amount": round(amount, 2)}])[-LOG_SIZE:]


def _earn(d, amount, text):
    d["income"] += amount
    _log(d, text, amount)


def _spend(d, price, text):
    if coins(d) < price:
        raise HomeError(f"Not enough coins: this costs {price:,.0f}, you have {coins(d):,.0f}.")
    d["spent"] += price
    _log(d, text, -price)


def record(session_id, pnl):
    """Remember the current profit of one game (called whenever the game autosaves)."""
    d = load()
    if d["earnings"].get(session_id) != round(pnl, 2):
        d["earnings"][session_id] = round(pnl, 2)
        _save(d)


def pet_status(pet, now):
    hungry_for = now - pet["fed"]
    return "dead" if hungry_for >= DEAD_AFTER else "hungry" if hungry_for >= HUNGRY_AFTER else "ok"


def grown(plant, now):
    return now - plant["planted"] >= CATALOG[plant["type"]]["hours"] * 3600


def view():
    d, now = load(), time.time()
    for pet in d["pets"]:
        pet["status"] = pet_status(pet, now)
    return {"ok": True, "coins": coins(d), "trading": round(sum(d["earnings"].values()), 2), "now": now,
            "state": d, "catalog": CATALOG}


def _footprint(item, rot):
    w, h = FURNITURE[item][2]
    return (h, w) if rot % 2 else (w, h)


def _fits(d, item, x, y, rot, skip=None):
    gw, gh = HOUSES[d["house"]][3]
    w, h = _footprint(item, rot)
    if not all(isinstance(v, int) for v in (x, y)) or x < 0 or y < 0 or x + w > gw or y + h > gh:
        return False
    for f in d["layouts"].get(d["house"], []):
        if f["id"] == skip or (f["item"] == "rug") != (item == "rug"):  # rugs lie under other furniture
            continue
        fw, fh = _footprint(f["item"], f["rot"])
        if x < f["x"] + fw and f["x"] < x + w and y < f["y"] + fh and f["y"] < y + h:
            return False
    return True


def _take(d, item):
    if d["inventory"].get(item, 0) < 1:
        raise HomeError("You don't have that in your inventory. Buy it in the store first.")
    d["inventory"][item] -= 1


def _slot(d, body):
    where, slot = body.get("where"), body.get("slot")
    if where not in ("flowers", "trees") or not isinstance(slot, int) or not 0 <= slot < len(d[where]):
        raise HomeError("Pick a flower plot or tree spot.")
    return where, slot


def act(action, body):
    """Apply one player action; returns the new view or raises HomeError."""
    d, now = load(), time.time()
    item = body.get("item")
    info = CATALOG.get(item)
    if action == "buy":
        if info is None:
            raise HomeError("Unknown item.")
        if (info["kind"] == "house" and item in d["houses"]) or (info["kind"] == "pool" and d["pool"]):
            raise HomeError("You already own that.")
        _spend(d, info["price"], f"Bought {info['name']}")
        if info["kind"] == "pet":
            d["pets"].append({"id": uuid.uuid4().hex[:6], "type": item, "fed": now, "bought": now})
        elif info["kind"] == "house":
            d["houses"].append(item)
            d["house"] = item
        elif info["kind"] == "pool":
            d["pool"] = True
        else:
            d["inventory"][item] = d["inventory"].get(item, 0) + 1
    elif action == "sell":
        if info is None or info["kind"] not in ("furniture", "flower", "tree"):
            raise HomeError("Only furniture, seeds and saplings can be sold back.")
        _take(d, item)
        _earn(d, info["price"] * SELL_BACK, f"Sold {info['name']}")
    elif action in ("feed", "bury"):
        pet = next((p for p in d["pets"] if p["id"] == body.get("id")), None)
        if pet is None:
            raise HomeError("That pet is gone.")
        name = PETS[pet["type"]][0]
        dead = pet_status(pet, now) == "dead"
        if action == "bury":
            if not dead:
                raise HomeError("Only a pet that has died can be buried.")
            d["pets"].remove(pet)
            _log(d, f"Said goodbye to the {name.lower()}", 0)
        else:
            if dead:
                raise HomeError("It's too late to feed this pet.")
            _spend(d, PETS[pet["type"]][2], f"Fed the {name.lower()}")
            pet["fed"] = now
    elif action == "plant":
        where, slot = _slot(d, body)
        if d[where][slot]:
            raise HomeError("Something is already growing there.")
        if (info or {}).get("kind") != where[:-1]:
            raise HomeError("That doesn't grow there.")
        _take(d, item)
        d[where][slot] = {"type": item, "planted": now, "harvested": now}
    elif action == "dig":
        where, slot = _slot(d, body)
        d[where][slot] = None
    elif action == "harvest":
        where, slot = _slot(d, body)
        plant = d[where][slot]
        if not plant or not grown(plant, now):
            raise HomeError("It isn't ready yet.")
        p = CATALOG[plant["type"]]
        if where == "flowers":  # a flower is picked and sold
            d[where][slot] = None
            _earn(d, p["sells"], f"Sold a {p['name'].lower()} bouquet")
        else:                   # a grown tree gives a harvest every few hours
            if now - max(plant["harvested"], plant["planted"] + p["hours"] * 3600) < p["every"] * 3600:
                raise HomeError("Nothing to harvest yet. Come back later.")
            plant["harvested"] = now
            _earn(d, p["yield"], f"Harvested the {p['name'].lower()}")
    elif action == "house":
        if item not in d["houses"]:
            raise HomeError("Buy that house in the store first.")
        d["house"] = item
    elif action in ("place", "move"):
        x, y, rot = body.get("x"), body.get("y"), int(body.get("rot", 0)) % 4
        layout = d["layouts"].setdefault(d["house"], [])
        if action == "move":
            f = next((f for f in layout if f["id"] == body.get("id")), None)
            if f is None or not _fits(d, f["item"], x, y, rot, skip=f["id"]):
                raise HomeError("It doesn't fit there.")
            f.update(x=x, y=y, rot=rot)
        else:
            if item not in FURNITURE or not _fits(d, item, x, y, rot):
                raise HomeError("It doesn't fit there.")
            _take(d, item)
            layout.append({"id": uuid.uuid4().hex[:6], "item": item, "x": x, "y": y, "rot": rot})
    elif action == "stash":
        layout = d["layouts"].get(d["house"], [])
        f = next((f for f in layout if f["id"] == body.get("id")), None)
        if f is None:
            raise HomeError("Nothing to put away.")
        layout.remove(f)
        d["inventory"][f["item"]] = d["inventory"].get(f["item"], 0) + 1
    else:
        raise HomeError("Unknown action.")
    _save(d)
    return view()
