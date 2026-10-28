"""Home and store: a self-contained economy around the trading game. Every saved game has its own
home (it is saved with the game).

Coins = this game's trading profit
      + income from the home (harvesting flowers and trees, selling items back)
      - spending (purchases, cleanup, floors, food). Every coin movement is logged.

Things can be mortgaged for dollars paid into the trading account: one house, building or piece of
furniture for 70% of its price, or the whole home for $20,000 + 70% of everything in it (which locks the
home until it is paid back). Paying a loan back takes the same dollars out of the account. Every loan
costs 0.5% interest per trading day, paid from the account's cash at the close; if the cash can't cover
it, the bank takes the mortgaged thing (and the loan is gone with it). Selling back pays half the price.

The garden starts as a wasteland: each zone must be cleaned up before anything goes there, and can
then get a new floor. Buying a fish tank unlocks fish; the tank can be upgraded to an aquarium for
sea life, and an ice land in the aquarium holds penguins and seals.
"""
import copy
import time
import uuid

DAY = 86400
HUNGRY_AFTER, DEAD_AFTER = 2 * DAY, 7 * DAY     # since the last meal (aquatic animals never die)
FLOWER_SLOTS, TREE_SLOTS = 6, 4
FLOWER_HOURS = 8                                  # seed to bloom
FLOWER_SELL = 2.0                                 # a bloomed flower sells for twice its seed price
SELL_BACK = 0.5                                   # unused items sell back at half price
TANK_FISH = 12                                    # fish a house fish tank holds before the aquarium
AQUARIUM_ANIMALS = 40
LOG_SIZE = 40
MORTGAGE = 0.7                                    # a mortgage pays 70% of the price
INTEREST = 0.005                                  # per trading day, on the loan amount (interest only)
HOME_LOAN_BASE = 20_000                           # the whole home is worth at least this much as a loan

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
ZONES = {  # name, cleanup price; what each zone holds is in ZONE_OF
    "path": ("Front path", 40), "plaza": ("Flower bed plaza", 80), "west": ("West lawn", 120),
    "east": ("East lawn", 120), "southwest": ("Pool corner", 150), "southeast": ("Play corner", 100),
}
ZONE_OF = {"flowers": ["plaza"] * FLOWER_SLOTS, "trees": ["west", "west", "east", "east"], "pool": "southwest"}
FLOORS = {  # name, price per zone
    "lawn": ("Lawn", 60), "clover": ("Clover & moss", 80), "gravel": ("Zen gravel", 90), "brick": ("Red brick", 140),
    "stone": ("Stone paving", 160), "deck": ("Wood deck", 200), "neon": ("Neon tiles", 300),
}
HOUSES = {  # name, price, level, floor grid (w, h)
    "shack": ("Concrete shack", 0, 1, (9, 6)), "modern": ("Modern house", 8000, 2, (13, 8)),
    "euro": ("European house", 9000, 2, (13, 8)), "tower": ("Modern tower", 25000, 3, (18, 10)),
    "palace_cn": ("Chinese palace", 30000, 3, (20, 11)), "palace_eu": ("European palace", 35000, 3, (24, 12)),
}
# Inner walls on tile edges: ("v", x, y0, y1, doors) is the wall left of column x for rows y0..y1-1,
# ("h", y, x0, x1, doors) the wall above row y for columns x0..x1-1; doors are open rows / columns.
WALLS = {
    "shack": [("v", 7, 0, 3, [1]), ("h", 3, 7, 9, [])],
    "modern": [("v", 8, 0, 8, [2, 6]), ("h", 4, 8, 13, [10])],
    "euro": [("h", 4, 0, 6, [3]), ("v", 6, 0, 8, [2, 6]), ("v", 10, 0, 4, [2])],
    "tower": [("v", 6, 0, 10, [2, 7]), ("v", 12, 0, 10, [4]), ("h", 5, 12, 18, [15]), ("h", 5, 0, 6, [3])],
    "palace_cn": [("v", 6, 0, 11, [3, 8]), ("v", 14, 0, 11, [3, 8]), ("h", 5, 0, 6, [3]), ("h", 5, 14, 20, [17])],
    "palace_eu": [("h", 5, 0, 24, [3, 12, 20]), ("v", 8, 5, 12, [8]), ("v", 16, 5, 12, [8]), ("v", 6, 0, 5, [2]), ("v", 18, 0, 5, [2])],
}
FURNITURE = {  # name, price, footprint (w, h) in floor tiles
    "chair": ("Chair", 40, (1, 1)), "cat_bed": ("Pet bed", 40, (1, 1)), "plant_pot": ("Potted plant", 25, (1, 1)),
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
FISH = {  # name, price, meal (fish live in the house fish tank, and in the aquarium once built)
    "guppy": ("Guppy", 8, 0.2), "danio": ("Zebra danio", 10, 0.2), "tetra": ("Neon tetra", 12, 0.2),
    "goldfish": ("Goldfish", 15, 0.3), "molly": ("Black molly", 18, 0.3), "betta": ("Betta", 25, 0.4),
    "clownfish": ("Clownfish", 40, 0.5), "angelfish": ("Angelfish", 45, 0.5), "puffer": ("Pufferfish", 60, 0.6),
    "tang": ("Blue tang", 70, 0.7), "discus": ("Discus", 90, 0.8), "koi": ("Koi", 120, 1.0),
}
SEA = {  # aquarium animals
    "starfish": ("Starfish", 150, 1), "seahorse": ("Seahorse", 250, 1), "jellyfish": ("Jellyfish", 300, 1),
    "lionfish": ("Lionfish", 350, 2), "eel": ("Moray eel", 450, 3), "octopus": ("Octopus", 600, 3),
    "sea_turtle": ("Sea turtle", 900, 4), "manta": ("Manta ray", 1500, 6), "shark": ("Shark", 2500, 10),
    "whale": ("Whale", 6000, 20),
}
ICE = {"penguin": ("Penguin", 500, 3), "seal": ("Seal", 1200, 5), "sea_dog": ("Sea dog (fur seal)", 1400, 6)}
BUILD = {  # name, price, needs
    "pool": ("Swimming pool", 2500, None), "aquarium": ("Small aquarium (upgrade the fish tank)", 5000, "fish_tank"),
    "iceland": ("Ice land (in the aquarium)", 3000, "aquarium"),
}

CATALOG = {
    **{k: {"kind": "pet", "name": n, "price": p, "meal": m} for k, (n, p, m) in PETS.items()},
    **{k: {"kind": "flower", "name": n, "price": p, "hours": FLOWER_HOURS, "sells": p * FLOWER_SELL}
       for k, (n, p) in FLOWERS.items()},
    **{k: {"kind": "tree", "name": n, "price": p, "hours": h, "yield": y, "every": e}
       for k, (n, p, h, y, e) in TREES.items()},
    **{k: {"kind": "house", "name": n, "price": p, "level": lv, "grid": g, "walls": WALLS[k]}
       for k, (n, p, lv, g) in HOUSES.items()},
    **{k: {"kind": "furniture", "name": n, "price": p, "size": s} for k, (n, p, s) in FURNITURE.items()},
    **{k: {"kind": "floor", "name": n, "price": p} for k, (n, p) in FLOORS.items()},
    **{k: {"kind": "zone", "name": n, "price": p} for k, (n, p) in ZONES.items()},
    **{k: {"kind": "fish", "name": n, "price": p, "meal": m} for k, (n, p, m) in FISH.items()},
    **{k: {"kind": "sea", "name": n, "price": p, "meal": m} for k, (n, p, m) in SEA.items()},
    **{k: {"kind": "ice", "name": n, "price": p, "meal": m} for k, (n, p, m) in ICE.items()},
    **{k: {"kind": "build", "name": n, "price": p, "needs": nd} for k, (n, p, nd) in BUILD.items()},
}
AQUATIC = ("fish", "sea", "ice")


class HomeError(Exception):
    """A refused action; the message is shown to the player."""


def new():
    return {"income": 0.0, "spent": 0.0, "log": [], "house": "shack", "houses": ["shack"],
            "pool": False, "aquarium": False, "iceland": False, "zones": {}, "pets": [], "companion": None,
            "aquatic": [], "aqua_fed": time.time(), "flowers": [None] * FLOWER_SLOTS, "trees": [None] * TREE_SLOTS,
            "inventory": {}, "layouts": {}, "loans": [], "collection": []}


def normalize(d):
    """A home from a save (None for games saved before homes were per game), filled out to the current shape."""
    d = {**new(), **(d or {})}
    d.pop("earnings", None)
    if "cabin" in d["houses"]:  # the cabin became the concrete shack
        d["houses"] = ["shack" if h == "cabin" else h for h in d["houses"]]
        d["house"] = "shack" if d["house"] == "cabin" else d["house"]
        if "cabin" in d["layouts"]:
            d["layouts"]["shack"] = [f for f in d["layouts"].pop("cabin") if _fits(d, f["item"], f["x"], f["y"], f["rot"], house="shack", only=[])]
    for where in ("flowers", "trees"):  # whatever was already built keeps its zone clean
        for zone, plant in zip(ZONE_OF[where], d[where]):
            if plant:
                d["zones"].setdefault(zone, {"floor": None})
    if d["pool"]:
        d["zones"].setdefault(ZONE_OF["pool"], {"floor": None})
    return d


def coins(d, pnl):
    return round(pnl + d["income"] - d["spent"], 2)


def _log(d, text, amount):
    d["log"] = (d["log"] + [{"t": time.time(), "text": text, "amount": round(amount, 2)}])[-LOG_SIZE:]


def _earn(d, amount, text):
    d["income"] += amount
    _log(d, text, amount)


def _spend(d, price, text):
    if d["_coins"] < price:
        raise HomeError(f"Not enough coins: this costs {price:,.0f}, you have {d['_coins']:,.0f}.")
    d["_coins"] -= price
    d["spent"] += price
    _log(d, text, -price)


def pet_status(pet, now):
    hungry_for = now - pet["fed"]
    return "dead" if hungry_for >= DEAD_AFTER else "hungry" if hungry_for >= HUNGRY_AFTER else "ok"


def grown(plant, now):
    return now - plant["planted"] >= CATALOG[plant["type"]]["hours"] * 3600


def has_tank(d):
    return d["inventory"].get("fish_tank", 0) > 0 or any(
        f["item"] == "fish_tank" for layout in d["layouts"].values() for f in layout)


def companion(d, now):
    """The pet shown next to the chart: the chosen one while it lives, else the first living pet."""
    alive = [p for p in d["pets"] if pet_status(p, now) != "dead"]
    chosen = next((p for p in alive if p["id"] == d["companion"]), None)
    return chosen or (alive[0] if alive else None)


def view(d, pnl):
    now = time.time()
    buddy = companion(d, now)
    return {"ok": True, "coins": coins(d, pnl), "trading": round(pnl, 2), "now": now,
            "state": {**d, "pets": [{**p, "status": pet_status(p, now)} for p in d["pets"]]}, "catalog": CATALOG,
            "loan_offers": loan_offers(d), "locked": locked(d), "has_tank": has_tank(d), "companion": buddy and buddy["id"],
            "aqua_hungry": now - d["aqua_fed"] >= HUNGRY_AFTER,
            "aqua_meal": round(sum(CATALOG[a["type"]]["meal"] for a in d["aquatic"]), 2)}


def _footprint(item, rot):
    w, h = FURNITURE[item][2]
    return (h, w) if rot % 2 else (w, h)


def _crosses_wall(house, x, y, w, h):
    for kind, at, a0, a1, _doors in WALLS[house]:
        if kind == "v" and x < at < x + w and y < a1 and a0 < y + h:
            return True
        if kind == "h" and y < at < y + h and x < a1 and a0 < x + w:
            return True
    return False


def _fits(d, item, x, y, rot, skip=None, house=None, only=None):
    house = house or d["house"]
    gw, gh = HOUSES[house][3]
    w, h = _footprint(item, rot)
    if not all(isinstance(v, int) for v in (x, y)) or x < 0 or y < 0 or x + w > gw or y + h > gh:
        return False
    if _crosses_wall(house, x, y, w, h):
        return False
    for f in d["layouts"].get(house, []) if only is None else only:
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
        raise HomeError("Pick a flower spot or tree spot.")
    return where, slot


def _need_clean(d, zone):
    if zone not in d["zones"]:
        raise HomeError(f"Clean up the {ZONES[zone][0].lower()} first (click it in the garden).")


def _buy_aquatic(d, item, info, now):
    kind = info["kind"]
    if kind == "fish" and not has_tank(d):
        raise HomeError("Buy a fish tank (Furniture) first: fish need a home.")
    if kind == "sea" and not d["aquarium"]:
        raise HomeError("Sea life needs the aquarium: upgrade your fish tank first.")
    if kind == "ice" and not d["iceland"]:
        raise HomeError("Penguins and seals need the ice land in the aquarium.")
    limit = AQUARIUM_ANIMALS if d["aquarium"] else TANK_FISH
    if len(d["aquatic"]) >= limit:
        raise HomeError(f"The {'aquarium' if d['aquarium'] else 'fish tank'} is full ({limit} animals).")
    if not d["aquatic"]:
        d["aqua_fed"] = now
    _spend(d, info["price"], f"Bought {info['name'].lower()}")
    d["aquatic"].append({"id": uuid.uuid4().hex[:6], "type": item, "bought": now})



# ----- mortgages

def _furniture(d):
    return [(house, f) for house, layout in d["layouts"].items() for f in layout]


def locked(d):
    """The whole home is mortgaged: nothing can be bought, sold or rebuilt until it is paid back."""
    return any(loan["kind"] == "all" for loan in d["loans"])


def _pledged(d, kind, ref):
    return locked(d) or any(loan["kind"] == kind and loan["ref"] == ref for loan in d["loans"])


def home_value(d):
    """What everything in the home cost: houses, buildings, furniture, animals, plants, cleanup and floors."""
    value = sum(HOUSES[h][1] for h in d["houses"]) + sum(BUILD[b][1] for b in BUILD if d[b])
    value += sum(FURNITURE[f["item"]][1] for _, f in _furniture(d))
    value += sum(FURNITURE[k][1] * n for k, n in d["inventory"].items() if k in FURNITURE)
    value += sum(PETS[p["type"]][1] for p in d["pets"]) + sum(CATALOG[a["type"]]["price"] for a in d["aquatic"])
    value += sum(CATALOG[p["type"]]["price"] for p in d["flowers"] + d["trees"] if p)
    value += sum(ZONES[z][1] + (FLOORS[v["floor"]][1] if v["floor"] else 0) for z, v in d["zones"].items())
    return value


def loan_offers(d):
    """Everything that can be mortgaged now: [{kind, ref, label, amount}]."""
    if locked(d):
        return []
    taken = {(loan["kind"], loan["ref"]) for loan in d["loans"]}
    offers = [{"kind": "house", "ref": h, "label": HOUSES[h][0], "price": HOUSES[h][1]} for h in d["houses"] if HOUSES[h][1]]
    offers += [{"kind": "build", "ref": b, "label": BUILD[b][0].split(" (")[0], "price": BUILD[b][1]} for b in BUILD if d[b]]
    offers += [{"kind": "furniture", "ref": f["id"], "label": f"{FURNITURE[f['item']][0]} ({HOUSES[h][0].lower()})",
                "price": FURNITURE[f["item"]][1]} for h, f in _furniture(d)]
    offers = [{**o, "amount": round(o.pop("price") * MORTGAGE, 2)} for o in offers if (o["kind"], o["ref"]) not in taken]
    pledged = sum(loan["value"] for loan in d["loans"])
    whole = round(HOME_LOAN_BASE + MORTGAGE * max(0, home_value(d) - pledged), 2)
    return [{"kind": "all", "ref": "all", "label": "The whole home (garden, houses and everything in them)", "amount": whole}] + offers


def _mortgage(d, body):
    offer = next((o for o in loan_offers(d) if o["kind"] == body.get("kind") and o["ref"] == body.get("ref")), None)
    if offer is None:
        raise HomeError("That can't be mortgaged now.")
    d["loans"].append({"id": uuid.uuid4().hex[:6], **offer, "value": round(offer["amount"] / MORTGAGE, 2), "t": time.time()})
    _log(d, f"Mortgaged {offer['label'].split(' (')[0].lower()}: +${offer['amount']:,.0f} to trading", 0)
    return offer["amount"]


def _redeem(d, body, cash):
    loan = next((loan for loan in d["loans"] if loan["id"] == body.get("id")), None)
    if loan is None:
        raise HomeError("That loan is already paid back.")
    if cash < loan["amount"]:
        raise HomeError(f"Paying this back takes ${loan['amount']:,.2f} of cash in the trading account; you have ${cash:,.2f}.")
    d["loans"].remove(loan)
    _log(d, f"Paid back the mortgage on {loan['label'].split(' (')[0].lower()}: -${loan['amount']:,.0f} from trading", 0)
    return -loan["amount"]


def charge_interest(home, cash):
    """The close of a trading day: each loan's interest is paid from `cash`, in order; a loan whose interest
    can't be paid is foreclosed. Returns (new home, interest paid, [messages])."""
    d = copy.deepcopy(home)
    paid, notes = 0.0, []
    for loan in list(d["loans"]):
        if loan not in d["loans"]:  # already gone with a foreclosed house or building
            continue
        due = round(loan["amount"] * INTEREST, 2)
        if cash - paid >= due:
            paid += due
        else:
            _foreclose(d, loan)
            notes.append(f"You couldn't pay ${due:,.2f} interest: the bank took {loan['label'].split(' (')[0].lower()}.")
    if paid:
        _log(d, f"Mortgage interest: -${paid:,.2f} from trading", 0)
    return d, round(paid, 2), notes


def _foreclose(d, loan):
    """The bank takes what was mortgaged; the debt goes with it. Coins and the collection stay."""
    d["loans"].remove(loan)
    kind, ref = loan["kind"], loan["ref"]
    if kind == "all":
        keep = {k: d[k] for k in ("income", "spent", "log", "collection")}
        d.clear()
        d.update(new())
        d.update(keep)
    elif kind == "house":
        d["houses"].remove(ref)
        gone = {f["id"] for f in d["layouts"].pop(ref, [])}
        d["loans"] = [x for x in d["loans"] if not (x["kind"] == "furniture" and x["ref"] in gone)]
        if d["house"] == ref:
            d["house"] = "shack"
    elif kind == "build":
        drop = {"pool": ["pool"], "aquarium": ["aquarium", "iceland"], "iceland": ["iceland"]}[ref]
        for b in drop:
            d[b] = False
        d["loans"] = [x for x in d["loans"] if not (x["kind"] == "build" and x["ref"] in drop)]
        lost = {"sea", "ice"} if "aquarium" in drop else {"ice"} if "iceland" in drop else set()
        d["aquatic"] = [a for a in d["aquatic"] if CATALOG[a["type"]]["kind"] not in lost]
    else:
        for layout in d["layouts"].values():
            layout[:] = [f for f in layout if f["id"] != ref]
    if not d["aquarium"] and not has_tank(d):
        d["aquatic"] = []  # no tank left: the fish go with it
    _log(d, f"Foreclosed: the bank took {loan['label'].split(' (')[0].lower()}", 0)


# ----- actions

LOCKED_ACTIONS = {"buy", "sell", "clean", "floor", "plant", "dig", "stash", "house", "mortgage"}


def act(home, action, body, pnl=0.0, cash=0.0):
    """Apply one player action to a copy of `home`. Returns (new home, dollars paid into (+) or out of (-)
    the trading account) or raises HomeError; `cash` is the account's cash, for paying loans back."""
    d = copy.deepcopy(home)
    d["_coins"] = coins(d, pnl)
    dollars = _act(d, action, body, time.time(), cash)
    del d["_coins"]
    return d, dollars


def _act(d, action, body, now, cash):
    if action in LOCKED_ACTIONS and locked(d):
        raise HomeError("The whole home is mortgaged: pay the loan back (Mortgage panel) to change things.")
    item = body.get("item")
    info = CATALOG.get(item)
    if action == "mortgage":
        return _mortgage(d, body)
    if action == "redeem":
        return _redeem(d, body, cash)
    if action == "buy":
        if info is None or info["kind"] in ("zone", "floor"):
            raise HomeError("Unknown item.")
        kind = info["kind"]
        if (kind == "house" and item in d["houses"]) or (kind == "build" and d[item]):
            raise HomeError("You already own that.")
        if kind in AQUATIC:
            _buy_aquatic(d, item, info, now)
            return 0
        if kind == "build":
            if item == "pool":
                _need_clean(d, ZONE_OF["pool"])
            elif item == "aquarium" and not has_tank(d):
                raise HomeError("The aquarium is an upgrade of the fish tank: buy a fish tank first.")
            elif item == "iceland" and not d["aquarium"]:
                raise HomeError("Build the aquarium first.")
        _spend(d, info["price"], f"Bought {info['name'].split(' (')[0].lower()}")
        if kind == "pet":
            d["pets"].append({"id": uuid.uuid4().hex[:6], "type": item, "fed": now, "bought": now})
        elif kind == "house":
            d["houses"].append(item)
            d["house"] = item
        elif kind == "build":
            d[item] = True
        else:
            d["inventory"][item] = d["inventory"].get(item, 0) + 1
    elif action == "sell":
        if info is None or info["kind"] not in ("furniture", "flower", "tree"):
            raise HomeError("Only furniture, seeds and saplings can be sold back.")
        _take(d, item)
        if item == "fish_tank" and d["aquatic"] and not d["aquarium"] and not has_tank(d):
            raise HomeError("Your fish live in this tank. Place it instead of selling it.")
        _earn(d, info["price"] * SELL_BACK, f"Sold {info['name'].lower()}")
    elif action == "clean":
        zone = body.get("zone")
        if zone not in ZONES:
            raise HomeError("Pick a part of the garden.")
        if zone in d["zones"]:
            raise HomeError("That part is already clean.")
        _spend(d, ZONES[zone][1], f"Cleaned up the {ZONES[zone][0].lower()}")
        d["zones"][zone] = {"floor": None}
    elif action == "floor":
        zone = body.get("zone")
        if zone not in ZONES:
            raise HomeError("Pick a part of the garden.")
        _need_clean(d, zone)
        if item not in FLOORS:
            raise HomeError("Unknown floor.")
        if d["zones"][zone]["floor"] == item:
            raise HomeError("That floor is already there.")
        _spend(d, FLOORS[item][1], f"{FLOORS[item][0]} for the {ZONES[zone][0].lower()}")
        d["zones"][zone]["floor"] = item
    elif action in ("feed", "bury", "companion"):
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
        elif dead:
            raise HomeError("It's too late for this pet.")
        elif action == "companion":
            d["companion"] = pet["id"]
        else:
            _spend(d, PETS[pet["type"]][2], f"Fed the {name.lower()}")
            pet["fed"] = now
    elif action == "feed_aquatic":
        if not d["aquatic"]:
            raise HomeError("There is nobody in the water to feed.")
        _spend(d, round(sum(CATALOG[a["type"]]["meal"] for a in d["aquatic"]), 2), "Fed the fish and sea life")
        d["aqua_fed"] = now
    elif action == "plant":
        where, slot = _slot(d, body)
        _need_clean(d, ZONE_OF[where][slot])
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
        if _pledged(d, "furniture", f["id"]):
            raise HomeError("This piece is mortgaged: pay the loan back before putting it away.")
        layout.remove(f)
        d["inventory"][f["item"]] = d["inventory"].get(f["item"], 0) + 1
    else:
        raise HomeError("Unknown action.")
    return 0
