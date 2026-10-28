"""Home and store: a self-contained economy around the trading game. Every saved game has its own
home (it is saved with the game).

Coins = this game's trading profit
      + income from the home (harvesting flowers and trees, selling items back)
      - spending (purchases, cleanup, floors, food). Every coin movement is logged.

Things can be mortgaged for dollars paid into the trading account: one house, building or piece of
furniture (a house is worth $20,000 plus its price and its furniture), or the whole home (worth $20,000
plus everything in it except pets; it locks the home until paid back).
Each mortgage picks a plan from PLANS: how much of the value is lent and the daily interest. Interest is
paid every trading day from the account's cash at the close (interest only; paying the loan back takes
the same dollars out again); if the cash can't cover it, the bank takes the mortgaged thing (and the loan
is gone with it). Selling back pays half the price.

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
PLANS = {  # mortgage plans: share of the value lent, interest per trading day on the loan
    "p150": (1.50, 0.005), "p100": (1.00, 0.0025), "p70": (0.70, 0.0005), "p50": (0.50, 0.0001),
}
HOME_LOAN_BASE = 20_000                           # the whole home is worth this much plus what's in it

PETS = {  # name, price (close to what the pet costs in real life), cost of one meal
    # dogs
    "chihuahua": ("Chihuahua", 800, 3), "bichon": ("Bichon Frise", 1200, 4), "labrador": ("Labrador Retriever", 1200, 9),
    "husky": ("Siberian Husky", 1200, 9), "shepherd": ("German Shepherd", 1500, 10), "poodle": ("Poodle", 1500, 6),
    "dog": ("Golden Retriever", 1800, 9), "pomeranian": ("Pomeranian", 1800, 3), "corgi": ("Corgi", 2000, 6),
    "frenchie": ("French Bulldog", 3500, 6),
    # cats
    "cat": ("Orange Tabby", 150, 4), "siamese": ("Siamese Cat", 800, 5), "american": ("American Shorthair", 800, 5),
    "british": ("British Shorthair", 1500, 5), "russianblue": ("Russian Blue", 1500, 5), "ragdoll": ("Ragdoll", 1800, 5),
    "persian": ("Persian Cat", 2000, 6), "mainecoon": ("Maine Coon", 2000, 7), "scottish": ("Scottish Fold", 2000, 5),
    "bengal": ("Bengal Cat", 2500, 6),
    # rare and unusual
    "frog": ("Pacman Frog", 50, 1), "gecko": ("Leopard Gecko", 60, 1), "dragon": ("Bearded Dragon", 120, 2),
    "python": ("Ball Python", 150, 3), "hedgehog": ("Hedgehog", 250, 2), "ferret": ("Ferret", 250, 3),
    "glider": ("Sugar Glider", 300, 2), "chinchilla": ("Chinchilla", 300, 2), "capybara": ("Capybara", 3000, 12),
    "marmoset": ("Marmoset", 4000, 6),
    # other common pets
    "hamster": ("Hamster", 20, 1), "guineapig": ("Guinea Pig", 40, 2), "rabbit": ("Rabbit", 60, 2),
    "turtle": ("Turtle", 60, 2), "parrot": ("Parrot", 1200, 4),
    # fantasy
    "lizard": ("Green Anole", 30, 1), "lion": ("Lion", 20000, 40),
}
PREMIUM_AT = 1000                                 # pets this pricey get a portrait window and clothes
GARDEN_PETS, HOUSE_PETS = 5, 3                    # how many pets fit outside and inside
WALL_ITEMS = {"painting_portrait", "painting_sunset", "painting_mountain", "painting_abstract", "painting_neon",
              "window_round", "window_arched", "window_panorama"}
CLOTH_STYLES = {  # name, price
    "bandana": ("bandana", 30), "yuzu": ("yuzu hat", 25), "bowtie": ("bow tie", 40), "scarf": ("scarf", 45),
    "flower": ("flower crown", 60), "vest": ("vest", 70), "sweater": ("sweater", 80), "hoodie": ("hoodie", 90),
    "raincoat": ("raincoat", 90), "sailor": ("sailor suit", 110), "tutu": ("tutu", 120), "cape": ("cape", 140),
    "kimono": ("kimono", 160), "tuxedo": ("tuxedo", 200), "crown": ("crown", 300),
}
PET_CLOTHES = {  # each pricey pet's own three designs: style, color, color name
    "corgi": [("bandana", "#d8283c", "Red"), ("sweater", "#2a3a8a", "Navy"), ("crown", "#ffd21f", "Royal")],
    "shepherd": [("vest", "#1a2a5a", "K-9"), ("bandana", "#4a6a3a", "Camo"), ("scarf", "#8a8a96", "Grey")],
    "labrador": [("raincoat", "#ffd21f", "Yellow"), ("bandana", "#2a6ad8", "Blue"), ("hoodie", "#c8202a", "Red")],
    "husky": [("scarf", "#3a8ad8", "Snow"), ("hoodie", "#6a6a7a", "Grey"), ("sailor", "#2a4ab8", "Navy")],
    "poodle": [("tutu", "#ff8ac0", "Pink"), ("bowtie", "#1a1a1a", "Black"), ("cape", "#7a3ac8", "Purple")],
    "dog": [("bowtie", "#d8102e", "Red"), ("sweater", "#f0e0c0", "Cream"), ("flower", "#ff4f9a", "Spring")],
    "pomeranian": [("crown", "#ffd21f", "Princess"), ("tutu", "#ffb0d8", "Pink"), ("sweater", "#ff7ab0", "Pink")],
    "frenchie": [("hoodie", "#1a1a1a", "Black"), ("tuxedo", "#1a1a24", "Dapper"), ("kimono", "#c8102e", "Red")],
    "bichon": [("flower", "#ffd84a", "Daisy"), ("bowtie", "#3a8ad8", "Blue"), ("tutu", "#ffffff", "White")],
    "british": [("bowtie", "#1a3a8a", "Navy"), ("sweater", "#8a1a2a", "Burgundy"), ("cape", "#2a2a3a", "Night")],
    "russianblue": [("cape", "#c8c8d8", "Silver"), ("bowtie", "#2a2a3a", "Black"), ("scarf", "#7a3ac8", "Violet")],
    "ragdoll": [("flower", "#ff9ac0", "Rose"), ("kimono", "#3a6ad8", "Blue"), ("bowtie", "#ff4f9a", "Pink")],
    "persian": [("crown", "#ffd21f", "Queen"), ("cape", "#8a1a5a", "Velvet"), ("tutu", "#f0e0ff", "Lilac")],
    "mainecoon": [("scarf", "#3a6a3a", "Forest"), ("hoodie", "#6a4a2a", "Bear"), ("crown", "#ffd21f", "King")],
    "scottish": [("scarf", "#c8102e", "Tartan"), ("sweater", "#3a6a3a", "Highland"), ("bowtie", "#1a2a6a", "Navy")],
    "bengal": [("bandana", "#ff7a1a", "Jungle"), ("hoodie", "#1a1a1a", "Panther"), ("crown", "#ffd21f", "Wild")],
    "capybara": [("yuzu", "#ffb020", "Yuzu"), ("raincoat", "#4ab8d8", "Spa"), ("kimono", "#3a8a5a", "Onsen")],
    "marmoset": [("sweater", "#e8a040", "Banana"), ("hoodie", "#4a8ad8", "Sky"), ("crown", "#ffd21f", "Tiny king")],
    "parrot": [("bowtie", "#1a1a1a", "Black"), ("cape", "#2a8a5a", "Jungle"), ("sailor", "#2a4ab8", "Pirate")],
    "lion": [("crown", "#ffd21f", "King"), ("cape", "#a8102e", "Royal"), ("bowtie", "#1a1a1a", "Gala")],
}
CLOTHES = {f"{pet}.{style}": (pet, style, color, cname) for pet, designs in PET_CLOTHES.items()
           for style, color, cname in designs}
FLOWERS = {  # name, price
    "daisy": ("Daisy", 5), "poppy": ("Poppy", 7), "tulip": ("Tulip", 8), "bluebell": ("Bluebell", 9),
    "sunflower": ("Sunflower", 10), "lavender": ("Lavender", 12), "rose": ("Rose", 15), "lily": ("Lily", 18),
}
TREES = {  # name, price, hours to grow up, harvest (coins), hours between harvests
    "pine": ("Pine", 60, 24, 8, 24), "maple": ("Maple", 80, 36, 20, 48),
    "apple": ("Apple tree", 120, 48, 15, 24), "sakura": ("Sakura", 600, 72, 30, 24),
    # cyberpunk trees
    "synth_pine": ("Synth pine", 700, 36, 25, 24), "neon_palm": ("Neon palm", 900, 48, 35, 24),
    "data_tree": ("Data tree", 1200, 60, 45, 24), "holo_bonsai": ("Holo bonsai", 1500, 72, 55, 24),
    "crystal": ("Crystal tree", 2000, 72, 70, 24), "fiber_willow": ("Fiber-optic willow", 2500, 96, 90, 24),
}
ZONES = {  # name, cleanup price; what each zone holds is in ZONE_OF
    "path": ("Front path", 40), "plaza": ("Flower bed plaza", 80), "west": ("West lawn", 120),
    "east": ("East lawn", 120), "southwest": ("Pool corner", 150), "southeast": ("Play corner", 100),
}
ZONE_OF = {"flowers": ["plaza"] * FLOWER_SLOTS, "trees": ["west", "west", "east", "east"], "pool": "southwest"}
FLOORS = {  # name, price per zone
    "lawn": ("Lawn", 60), "clover": ("Clover & moss", 80), "gravel": ("Zen gravel", 90), "brick": ("Red brick", 140),
    "stone": ("Stone paving", 160), "deck": ("Wood deck", 200), "neon": ("Neon tiles", 300),
    "snow": ("Snow", 120), "circuit": ("Circuit board", 200), "redtile": ("Red lacquer tiles", 160),
    "royal_lawn": ("Royal lawn", 180), "zellige": ("Zellige mosaic", 220), "graveyard": ("Graveyard moss", 150),
}
THEMES = {  # name, price, its ground: a whole-garden look; buying one also cleans up every wasteland part
    "christmas": ("Christmas garden", 3000, "snow"), "cny": ("Chinese New Year garden", 4000, "redtile"),
    "cyberpunk": ("Cyberpunk garden", 5000, "circuit"), "halloween": ("Halloween garden", 4500, "graveyard"), "muslim": ("Muslim garden", 6000, "zellige"),
    "royal": ("Royal garden", 8000, "royal_lawn"),
}
HOUSES = {  # name, price, level, floor grid (w, h)
    "shack": ("Concrete shack", 0, 1, (9, 6)), "euro": ("Country house", 4000, 2, (13, 8)),
    "modern": ("Modern house", 8000, 2, (13, 8)), "xmas_house": ("Christmas cottage", 6000, 2, (13, 8)),
    "haunted_house": ("Haunted manor", 13000, 3, (16, 10)), "villa": ("Modern villa", 20000, 3, (18, 10)),
    "tower": ("Modern tower", 25000, 3, (18, 10)), "palace_cn": ("Chinese palace", 30000, 3, (20, 11)),
    "palace_eu": ("Muslim palace", 35000, 3, (24, 12)), "church": ("St Sophia cathedral", 40000, 3, (20, 11)),
    "palace_gold": ("Golden palace", 60000, 3, (24, 12)),
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
    "xmas_house": [("v", 8, 0, 8, [2, 6]), ("h", 4, 8, 13, [10])],
    "haunted_house": [("v", 5, 0, 10, [2, 7]), ("v", 11, 0, 10, [3, 7]), ("h", 5, 11, 16, [13])],
    "villa": [("v", 7, 0, 10, [2, 7]), ("h", 5, 12, 18, [14]), ("v", 12, 0, 5, [2])],
    "church": [("v", 4, 0, 11, [2, 8]), ("v", 16, 0, 11, [2, 8])],
    "palace_gold": [("h", 4, 0, 24, [2, 9, 14, 21]), ("v", 6, 4, 12, [8]), ("v", 18, 4, 12, [8])],
}
FURNITURE = {  # name, price, footprint (w, h) in floor tiles
    "chair": ("Chair", 40, (1, 1)), "cat_bed": ("Pet bed", 40, (1, 1)), "plant_pot": ("Potted plant", 25, (1, 1)),
    "floor_lamp": ("Floor lamp", 45, (1, 1)), "big_plant": ("Big plant", 60, (1, 1)), "bean_bag": ("Bean bag", 70, (1, 1)),
    "office_chair": ("Office chair", 80, (1, 1)), "easel": ("Easel", 90, (1, 1)), "vase": ("Vase", 35, (1, 1)),
    "coffee_table": ("Coffee table", 90, (2, 1)), "rug": ("Rug", 120, (3, 2)), "sink": ("Sink", 130, (1, 1)),
    "armchair": ("Armchair", 150, (1, 1)), "desk": ("Desk", 150, (2, 1)), "toilet": ("Toilet", 150, (1, 1)),
    "mattress": ("Mattress", 60, (2, 2)), "old_laptop": ("Old laptop", 120, (1, 1)), "shower": ("Shower", 300, (1, 1)),
    "dresser": ("Dresser", 160, (2, 1)), "bookshelf": ("Bookshelf", 180, (2, 1)), "dining_table": ("Dining table", 200, (2, 2)),
    "guitar": ("Guitar", 200, (1, 1)), "counter": ("Kitchen counter", 220, (2, 1)), "wardrobe": ("Wardrobe", 250, (2, 1)),
    "record_player": ("Record player", 250, (1, 1)), "bed": ("Bed", 300, (2, 3)), "fish_tank": ("Fish tank", 350, (2, 1)),
    "telescope": ("Telescope", 350, (1, 1)), "sofa": ("Sofa", 400, (3, 1)), "console": ("Game console", 400, (1, 1)),
    "stove": ("Stove", 450, (1, 1)), "tv": ("TV", 500, (2, 1)), "clock": ("Grandfather clock", 500, (1, 1)),
    "bathtub": ("Bathtub", 600, (2, 1)), "double_bed": ("Double bed", 600, (3, 3)), "fridge": ("Fridge", 700, (1, 1)),
    "fireplace": ("Fireplace", 800, (2, 1)), "computer": ("Computer desk", 900, (2, 1)), "arcade": ("Arcade machine", 1200, (1, 1)),
    "piano": ("Piano", 1500, (2, 1)),
    "cat_tree": ("Pet climbing tower", 180, (1, 1)), "mirror": ("Standing mirror", 160, (1, 1)),
    "hammock": ("Hammock", 220, (2, 1)), "mini_bar": ("Mini bar", 600, (2, 1)), "jukebox": ("Jukebox", 650, (1, 1)),
    "drum_kit": ("Drum kit", 700, (2, 1)), "vending": ("Neon vending machine", 750, (1, 1)),
    "treadmill": ("Treadmill", 800, (1, 2)), "pool_table": ("Pool table", 900, (3, 2)),
    "massage_chair": ("Massage chair", 1100, (1, 1)), "grand_fireplace": ("Grand stone fireplace", 1500, (3, 1)),
    # hung on the back wall (the second number is unused: wall pieces take one row of wall)
    "painting_portrait": ("Painting: portrait", 150, (1, 1)), "painting_sunset": ("Painting: sunset", 220, (2, 1)),
    "painting_mountain": ("Painting: mountains", 260, (2, 1)), "painting_abstract": ("Painting: abstract", 340, (2, 1)),
    "painting_neon": ("Painting: neon city", 480, (2, 1)), "window_round": ("Round window", 200, (1, 1)),
    "window_arched": ("Arched window", 300, (1, 1)), "window_panorama": ("Panorama window", 700, (3, 1)),
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
CARS = {  # name, price (close to the real price), class
    "elantra": ("Hyundai Elantra", 21000, "cheap"), "corolla": ("Toyota Corolla", 22000, "cheap"),
    "civic": ("Honda Civic", 24000, "cheap"), "camry": ("Toyota Camry", 28000, "mid-range"),
    "accord": ("Honda Accord", 28000, "mid-range"), "model3": ("Tesla Model 3", 40000, "mid-range"),
    "bmw3": ("BMW 3 Series", 45000, "mid-range"), "lexus_ls": ("Lexus LS", 80000, "luxury"),
    "audi_a8": ("Audi A8", 88000, "luxury"), "bmw7": ("BMW 7 Series", 95000, "luxury"),
    "panamera": ("Porsche Panamera", 100000, "luxury"), "range_rover": ("Range Rover", 105000, "luxury"),
    "sclass": ("Mercedes-Benz S-Class", 115000, "luxury"), "p911": ("Porsche 911", 115000, "luxury"),
    "flying_spur": ("Bentley Flying Spur", 210000, "luxury"), "continental": ("Bentley Continental GT", 235000, "luxury"),
    "roma": ("Ferrari Roma", 245000, "luxury"), "huracan": ("Lamborghini Huracán", 250000, "luxury"),
    "ghost": ("Rolls-Royce Ghost", 340000, "luxury"), "phantom": ("Rolls-Royce Phantom", 460000, "luxury"),
}
GARAGE_CARS = 5
MERGE_AT = 4000                                   # a house this pricey has the garage built in

BUILD = {  # name, price, needs
    "pool": ("Swimming pool", 2500, None), "garage": ("Garage", 2000, None), "aquarium": ("Small aquarium (upgrade the fish tank)", 5000, "fish_tank"),
    "iceland": ("Ice land (in the aquarium)", 3000, "aquarium"),
}

CATALOG = {
    **{k: {"kind": "pet", "name": n, "price": p, "meal": m, "premium": p >= PREMIUM_AT,
           "clothes": [f"{k}.{st}" for st, _, _ in PET_CLOTHES.get(k, [])]} for k, (n, p, m) in PETS.items()},
    **{cid: {"kind": "clothes", "name": f"{cname} {CLOTH_STYLES[style][0]}", "price": CLOTH_STYLES[style][1], "pet": pet,
             "style": style, "color": color} for cid, (pet, style, color, cname) in CLOTHES.items()},
    **{k: {"kind": "flower", "name": n, "price": p, "hours": FLOWER_HOURS, "sells": p * FLOWER_SELL}
       for k, (n, p) in FLOWERS.items()},
    **{k: {"kind": "tree", "name": n, "price": p, "hours": h, "yield": y, "every": e}
       for k, (n, p, h, y, e) in TREES.items()},
    **{k: {"kind": "house", "name": n, "price": p, "level": lv, "grid": g, "walls": WALLS[k]}
       for k, (n, p, lv, g) in HOUSES.items()},
    **{k: {"kind": "furniture", "name": n, "price": p, "size": s, "wall": k in WALL_ITEMS} for k, (n, p, s) in FURNITURE.items()},
    **{k: {"kind": "theme", "name": n, "price": p, "ground": gr} for k, (n, p, gr) in THEMES.items()},
    **{k: {"kind": "car", "name": n, "price": p, "tier": tier} for k, (n, p, tier) in CARS.items()},
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


# What every home starts with: a shower and a toilet in the bathroom, a mattress on the floor, an old laptop.
STARTER = [("shower", 7, 0), ("toilet", 8, 0), ("mattress", 0, 3), ("old_laptop", 2, 4)]


def new():
    return {"income": 0.0, "spent": 0.0, "log": [], "house": "shack", "houses": ["shack"],
            "pool": False, "aquarium": False, "iceland": False, "zones": {"path": {"floor": None}}, "pets": [], "companion": None,
            "aquatic": [], "aqua_fed": time.time(), "flowers": [None] * FLOWER_SLOTS, "trees": [None] * TREE_SLOTS,
            "inventory": {}, "layouts": {"shack": _starter()}, "loans": [], "collection": [], "themes": [], "theme": None,
            "garage": False, "cars": []}


def _starter():
    return [{"id": uuid.uuid4().hex[:6], "item": item, "x": x, "y": y, "rot": 0} for item, x, y in STARTER]


def _move_in(d, old, new):
    """Moving house: the furniture comes along, at the same spot when it fits there, else at the first free
    spot, else into the inventory."""
    moved = []
    gw, gh = HOUSES[new][3]
    for f in d["layouts"].pop(old, []):
        spots = [(f["x"], f["y"], f["rot"])] + [(x, -1 if f["item"] in WALL_ITEMS else y, r)
                                               for y in ([-1] if f["item"] in WALL_ITEMS else range(gh)) for x in range(gw) for r in (0, 1)]
        spot = next((sp for sp in spots if _fits(d, f["item"], *sp, house=new, only=moved)), None)
        if spot:
            moved.append({**f, "x": spot[0], "y": spot[1], "rot": spot[2]})
        else:
            d["inventory"][f["item"]] = d["inventory"].get(f["item"], 0) + 1
    d["layouts"][new] = d["layouts"].get(new, []) + moved


def normalize(d):
    """A home from a save (None for games saved before homes were per game), filled out to the current shape."""
    d = {**new(), **(d or {})}
    d.pop("earnings", None)
    d["zones"].setdefault("path", {"floor": None})  # the front path is always usable from the start
    if not any(d["layouts"].values()) and d["house"] == "shack":
        d["layouts"]["shack"] = _starter()  # older saves with an empty shack get the starter furniture too
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
    for i, pet in enumerate(d["pets"]):  # older saves: pets get a place, clothes and a known species
        pet.setdefault("place", "garden" if i < GARDEN_PETS else "house")
        pet.setdefault("outfits", [])
        pet.setdefault("wearing", None)
    d["pets"] = [pet for pet in d["pets"] if pet["type"] in PETS]
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


def pet_room(d):
    """Free places for pets: {"garden": n, "house": n} (a pet that died keeps its place until buried)."""
    used = {"garden": 0, "house": 0}
    for pet in d["pets"]:
        used[pet["place"]] += 1
    return {"garden": GARDEN_PETS - used["garden"], "house": HOUSE_PETS - used["house"]}


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
            "loan_offers": loan_offers(d), "plans": PLANS, "pet_room": pet_room(d),
            "garage_merged": d["garage"] and HOUSES[d["house"]][1] >= MERGE_AT, "locked": locked(d), "has_tank": has_tank(d), "companion": buddy and buddy["id"],
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
    if item in WALL_ITEMS:  # on the back wall: one row, side by side
        w = FURNITURE[item][2][0]
        if not all(isinstance(v, int) for v in (x, y)) or y != -1 or x < 0 or x + w > gw:
            return False
        return all(f["id"] == skip or f["item"] not in WALL_ITEMS or x >= f["x"] + FURNITURE[f["item"]][2][0] or f["x"] >= x + w
                   for f in (d["layouts"].get(house, []) if only is None else only))
    w, h = _footprint(item, rot)
    if not all(isinstance(v, int) for v in (x, y)) or x < 0 or y < 0 or x + w > gw or y + h > gh:
        return False
    if _crosses_wall(house, x, y, w, h):
        return False
    for f in d["layouts"].get(house, []) if only is None else only:
        if f["id"] == skip or f["item"] in WALL_ITEMS or (f["item"] == "rug") != (item == "rug"):  # rugs lie under furniture
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
    """What the home is worth to the bank: houses, buildings, furniture, water animals, plants, cleanup and
    floors. Pets (and their clothes) never count."""
    value = sum(HOUSES[h][1] for h in d["houses"]) + sum(BUILD[b][1] for b in BUILD if d[b])
    value += sum(FURNITURE[f["item"]][1] for _, f in _furniture(d))
    value += sum(FURNITURE[k][1] * n for k, n in d["inventory"].items() if k in FURNITURE)
    value += sum(CATALOG[a["type"]]["price"] for a in d["aquatic"])
    value += sum(CATALOG[p["type"]]["price"] for p in d["flowers"] + d["trees"] if p)
    value += sum((ZONES[z][1] if z != "path" else 0) + (FLOORS[v["floor"]][1] if v["floor"] else 0)  # the path came free
                 for z, v in d["zones"].items())
    value += sum(THEMES[t][1] for t in d["themes"])
    value += sum(CARS[c["type"]][1] for c in d["cars"])
    return value


def loan_offers(d):
    """Everything that can be mortgaged now: [{kind, ref, label, value}]; the loan is a plan's share of the
    value. A house is worth the $20,000 base plus its price plus the furniture in it (that isn't mortgaged
    on its own); the whole home is worth the base plus everything in it except pets, less what is already
    mortgaged (so nothing is counted twice)."""
    if locked(d):
        return []
    taken = {(loan["kind"], loan["ref"]) for loan in d["loans"]}
    pledged_houses = {ref for kind, ref in taken if kind == "house"}
    def furnished(h):
        return sum(FURNITURE[f["item"]][1] for f in d["layouts"].get(h, []) if ("furniture", f["id"]) not in taken)
    offers = [{"kind": "house", "ref": h, "label": f"{HOUSES[h][0]} (with its furniture)",
               "value": HOME_LOAN_BASE + HOUSES[h][1] + furnished(h)} for h in d["houses"]]
    offers += [{"kind": "build", "ref": b, "label": BUILD[b][0].split(" (")[0], "value": BUILD[b][1]} for b in BUILD if d[b]]
    offers += [{"kind": "car", "ref": c["id"], "label": CARS[c["type"]][0], "value": CARS[c["type"]][1]} for c in d["cars"]]
    offers += [{"kind": "furniture", "ref": f["id"], "label": f"{FURNITURE[f['item']][0]} ({HOUSES[h][0].lower()})",
                "value": FURNITURE[f["item"]][1]} for h, f in _furniture(d) if h not in pledged_houses]
    offers = [o for o in offers if (o["kind"], o["ref"]) not in taken]
    pledged = sum(loan["value"] for loan in d["loans"] if loan["kind"] != "all")
    whole = max(0, HOME_LOAN_BASE + home_value(d) - pledged)
    return [{"kind": "all", "ref": "all", "label": "The whole home (garden, houses and everything in them except pets)", "value": whole}] + offers


def _mortgage(d, body):
    offer = next((o for o in loan_offers(d) if o["kind"] == body.get("kind") and o["ref"] == body.get("ref")), None)
    if offer is None:
        raise HomeError("That can't be mortgaged now.")
    if body.get("plan") not in PLANS:
        raise HomeError("Pick a mortgage plan.")
    share, rate = PLANS[body["plan"]]
    amount = round(offer["value"] * share, 2)
    d["loans"].append({"id": uuid.uuid4().hex[:6], **offer, "plan": body["plan"], "amount": amount, "rate": rate, "t": time.time()})
    _log(d, f"Mortgaged {offer['label'].split(' (')[0].lower()} ({share:.0%} at {rate:.2%} a day): +${amount:,.0f} to trading", 0)
    return amount


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
        due = round(loan["amount"] * loan.get("rate", 0.005), 2)
        if cash - paid >= due:
            paid += due
        else:
            _foreclose(d, loan)
            notes.append(f"You couldn't pay ${due:,.2f} interest: the bank took {loan['label'].split(' (')[0].lower()}.")
    if paid:
        _log(d, f"Mortgage interest: -${paid:,.2f} from trading", 0)
    return d, round(paid, 2), notes


def _foreclose(d, loan):
    """The bank takes what was mortgaged; the debt goes with it. Coins, pets and the collection stay."""
    d["loans"].remove(loan)
    kind, ref = loan["kind"], loan["ref"]
    if kind == "all":
        keep = {k: d[k] for k in ("income", "spent", "log", "collection", "pets", "companion")}  # pets were never pledged
        d.clear()
        d.update(new())
        d.update(keep)
    elif kind == "house":
        d["houses"].remove(ref)
        gone = {f["id"] for f in d["layouts"].pop(ref, [])}
        d["loans"] = [x for x in d["loans"] if not (x["kind"] == "furniture" and x["ref"] in gone)]
        if d["house"] == ref:
            d["house"] = "shack"
    elif kind == "car":
        d["cars"] = [c for c in d["cars"] if c["id"] != ref]
    elif kind == "build":
        drop = {"pool": ["pool"], "aquarium": ["aquarium", "iceland"], "iceland": ["iceland"], "garage": ["garage"]}[ref]
        if ref == "garage":  # the cars go with the garage
            gone = {c["id"] for c in d["cars"]}
            d["cars"] = []
            d["loans"] = [x for x in d["loans"] if not (x["kind"] == "car" and x["ref"] in gone)]
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


def _apply_theme(d, theme):
    """A garden theme cleans up every part of the garden and lays its own ground everywhere."""
    d["theme"] = theme
    if theme:
        for zone in ZONES:
            d["zones"][zone] = {"floor": THEMES[theme][2]}


# ----- actions

LOCKED_ACTIONS = {"buy", "sell", "clean", "floor", "plant", "dig", "stash", "house", "mortgage", "buy_clothes", "theme", "sell_car"}


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
        if kind == "car":
            if not d["garage"]:
                raise HomeError("Cars need a garage: buy one first (Garden & houses).")
            if len(d["cars"]) >= GARAGE_CARS:
                raise HomeError(f"The garage is full ({GARAGE_CARS} cars). Sell one first.")
            _spend(d, info["price"], f"Bought a {info['name']}")
            d["cars"].append({"id": uuid.uuid4().hex[:6], "type": item, "bought": now})
            return 0
        if kind == "theme":
            if item in d["themes"]:
                raise HomeError("You already own that theme: switch to it in the garden.")
            _spend(d, info["price"], f"Bought the {info['name'].lower()}")
            d["themes"].append(item)
            _apply_theme(d, item)
            return 0
        if (kind == "house" and item in d["houses"]) or (kind == "build" and d[item]):
            raise HomeError("You already own that.")
        if kind in AQUATIC:
            _buy_aquatic(d, item, info, now)
            return 0
        room = pet_room(d)
        if kind == "pet" and not (room["garden"] or room["house"]):
            raise HomeError(f"Your home is full of pets ({GARDEN_PETS} in the garden, {HOUSE_PETS} in the house). Release one first.")
        if kind == "build":
            if item == "pool":
                _need_clean(d, ZONE_OF["pool"])
            elif item == "aquarium" and not has_tank(d):
                raise HomeError("The aquarium is an upgrade of the fish tank: buy a fish tank first.")
            elif item == "iceland" and not d["aquarium"]:
                raise HomeError("Build the aquarium first.")
        _spend(d, info["price"], f"Bought {info['name'].split(' (')[0].lower()}")
        if kind == "pet":
            d["pets"].append({"id": uuid.uuid4().hex[:6], "type": item, "fed": now, "bought": now,
                              "place": "garden" if room["garden"] else "house", "outfits": [], "wearing": None})
        elif kind == "house":
            d["houses"].append(item)
            _move_in(d, d["house"], item)  # the furniture moves into the new house
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
    elif action == "sell_car":
        car = next((c for c in d["cars"] if c["id"] == body.get("id")), None)
        if car is None:
            raise HomeError("That car is gone.")
        if _pledged(d, "car", car["id"]):
            raise HomeError("This car is mortgaged: pay the loan back before selling it.")
        d["cars"].remove(car)
        _earn(d, CARS[car["type"]][1] * SELL_BACK, f"Sold the {CARS[car['type']][0]}")
    elif action == "theme":
        if item is not None and item not in d["themes"]:
            raise HomeError("Buy that garden theme in the store first.")
        _apply_theme(d, item)
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
    elif action in ("feed", "bury", "companion", "release", "move_pet", "buy_clothes", "wear"):
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
        elif action == "release":  # pets are never sold: they can be let go, for nothing
            d["pets"].remove(pet)
            _log(d, f"Released the {name.lower()} to a good new home", 0)
        elif action == "move_pet":
            to = "house" if pet["place"] == "garden" else "garden"
            if pet_room(d)[to] <= 0:
                raise HomeError(f"The {to} is full ({HOUSE_PETS if to == 'house' else GARDEN_PETS} pets).")
            pet["place"] = to
        elif action == "buy_clothes":
            if item not in CLOTHES or CLOTHES[item][0] != pet["type"]:
                raise HomeError("Those clothes aren't made for this pet.")
            if item in pet["outfits"]:
                raise HomeError("It already has those.")
            _spend(d, info["price"], f"{info['name']} for the {name.lower()}")
            pet["outfits"].append(item)
            pet["wearing"] = item
        elif action == "wear":
            if item is not None and item not in pet["outfits"]:
                raise HomeError("Buy those clothes first.")
            pet["wearing"] = item
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
