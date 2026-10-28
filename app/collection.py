"""The collection: 100 rare and precious things, won as slot machine gifts. They can't be sold.

Each item: id, name, category, rarity, a one-line note. Rarer items come up less often as gifts.
"""
RARITY_WEIGHT = {"rare": 60, "epic": 28, "legendary": 10, "mythic": 2}

_R, _E, _L, _M = "rare", "epic", "legendary", "mythic"
_ITEMS = {
    "art": [
        ("starry_night", "The Starry Night", _L, "Swirling night sky over a sleeping village."),
        ("mona_lisa", "Mona Lisa", _M, "The most famous smile in the world."),
        ("great_wave", "The Great Wave", _L, "A towering wave dwarfs three boats and Mount Fuji."),
        ("pearl_earring", "Girl with a Pearl Earring", _E, "A glance over the shoulder, a single pearl."),
        ("the_scream", "The Scream", _E, "A figure screams under a blood-red sky."),
        ("water_lilies", "Water Lilies", _R, "A pond of lilies in soft morning light."),
        ("sunflowers", "Sunflowers", _E, "A vase of blazing yellow sunflowers."),
        ("birth_venus", "The Birth of Venus", _L, "Venus rises from the sea on a shell."),
        ("qingming", "Along the River at Qingming", _L, "A bustling city scroll, five metres long."),
        ("fuchun", "Dwelling in the Fuchun Mountains", _E, "Misty mountains in ink, once torn in two."),
    ],
    "tank": [
        ("tiger", "Tiger I", _E, "Heavy tank with a feared 88 mm gun."),
        ("sherman", "M4 Sherman", _R, "Built by the tens of thousands."),
        ("t34", "T-34/85", _R, "Sloped armour that changed tank design."),
        ("leopard2", "Leopard 2", _E, "Fast, modern main battle tank."),
        ("abrams", "M1 Abrams", _E, "Turbine-powered main battle tank."),
        ("challenger2", "Challenger 2", _R, "Known for its tough armour."),
        ("type99", "Type 99", _E, "Main battle tank with a laser defence system."),
        ("merkava", "Merkava", _R, "Engine in front to protect the crew."),
        ("renault_ft", "Renault FT", _L, "The first tank with a turret that turns all the way."),
        ("mark_v", "Mark V", _L, "A rhomboid giant from 1918."),
    ],
    "dress": [
        ("ball_gown", "Royal ball gown", _E, "Silk and lace for the grandest ball."),
        ("qipao", "Embroidered qipao", _E, "Silk qipao with golden peonies."),
        ("kimono", "Furisode kimono", _E, "Long-sleeved kimono with cranes."),
        ("hanfu", "Ming hanfu", _R, "Flowing robes of the Ming court."),
        ("wedding_gown", "Couture wedding gown", _L, "A cathedral train three metres long."),
        ("sari", "Banarasi sari", _R, "Woven with real gold thread."),
        ("flapper", "Beaded flapper dress", _R, "Thousands of glass beads that swing."),
        ("red_carpet", "Red carpet gown", _E, "Worn once, photographed a million times."),
        ("tutu", "Prima ballerina tutu", _R, "Stiff tulle for the Swan Queen."),
        ("victorian", "Victorian court gown", _L, "Velvet, a bustle and a corset."),
    ],
    "crown": [
        ("imperial_state", "Imperial State Crown", _M, "2,868 diamonds and a famous ruby."),
        ("phoenix_crown", "Phoenix crown", _L, "Kingfisher feathers and pearls of an empress."),
        ("tiara", "Diamond tiara", _E, "A sparkling band for a royal wedding."),
        ("iron_crown", "Iron Crown of Lombardy", _L, "Said to hold a nail from the True Cross."),
        ("holy_roman", "Imperial Crown of the HRE", _L, "Eight hinged gold plates set with gems."),
        ("laurel", "Golden laurel wreath", _E, "Gold leaves for a victorious emperor."),
        ("pharaoh", "Pharaoh's double crown", _L, "The red and white crowns of Egypt."),
        ("diadem", "Sapphire diadem", _R, "Deep blue sapphires on silver."),
        ("monomakh", "Cap of Monomakh", _E, "A gold cap trimmed with sable."),
        ("jade_crown", "Jade crown", _R, "Carved from a single piece of jade."),
    ],
    "jewel": [
        ("hope", "Hope Diamond", _M, "A deep blue diamond with a curse."),
        ("koh_i_noor", "Koh-i-Noor", _L, "The 'Mountain of Light'."),
        ("cullinan", "Great Star of Africa", _L, "Cut from the largest rough diamond ever found."),
        ("pink_star", "Pink Star", _E, "A flawless pink diamond."),
        ("black_orlov", "Black Orlov", _E, "A black diamond with a legend."),
        ("faberge", "Jewelled egg", _L, "A gold egg with a surprise inside."),
        ("pearl_necklace", "South Sea pearl necklace", _R, "Fifty perfectly matched pearls."),
        ("ruby_ring", "Pigeon-blood ruby ring", _E, "The reddest ruby there is."),
        ("emerald_brooch", "Emerald brooch", _R, "Colombian emeralds in gold."),
        ("imperial_jade", "Imperial jade bangle", _R, "Translucent green jadeite."),
    ],
    "car": [
        ("gto", "1962 grand tourer", _M, "The most expensive car ever sold at auction."),
        ("atlantic", "1936 Atlantic coupe", _L, "Riveted spine, teardrop body."),
        ("gullwing", "Gullwing coupe", _E, "Doors that open like wings."),
        ("miura", "V12 mid-engine coupe", _E, "The first supercar."),
        ("phantom", "Grand limousine", _R, "A clock you can hear and nothing else."),
        ("gt40", "Endurance racer", _E, "Built to win at Le Mans, and did."),
        ("le_mans", "Long-tail racer", _R, "Over 380 km/h on the straight."),
        ("db5", "Spy's grand tourer", _E, "Ejector seat not included."),
        ("e_type", "1961 roadster", _R, "Called the most beautiful car ever made."),
        ("f1", "Three-seat hypercar", _L, "Gold foil in the engine bay."),
    ],
    "watch": [
        ("grand_complication", "Grand complication pocket watch", _M, "Twenty-four functions in one watch."),
        ("tourbillon", "Tourbillon", _E, "A spinning cage that beats gravity."),
        ("moonphase", "Moon-phase watch", _R, "The moon on your wrist."),
        ("diver", "Deep diver", _R, "Tested to 12,000 metres."),
        ("chronograph", "Racing chronograph", _R, "Timed the first lap records."),
        ("skeleton", "Skeleton watch", _E, "Every gear on show."),
        ("hunter", "Gold hunter pocket watch", _E, "A lid engraved with a stag."),
        ("pilot", "Pilot's watch", _R, "Huge crown for gloved hands."),
        ("jewel_watch", "Jewelled lady's watch", _E, "Diamonds hide the dial."),
        ("astro_clock", "Astronomical clock", _L, "Shows the planets, the tides and the stars."),
    ],
    "instrument": [
        ("stradivarius", "Stradivarius violin", _M, "Made in 1715; still sings."),
        ("golden_harp", "Golden concert harp", _E, "Forty-seven strings and gold leaf."),
        ("concert_grand", "Concert grand piano", _L, "Nine feet of black lacquer."),
        ("guqin", "Song dynasty guqin", _L, "A seven-string zither nearly a thousand years old."),
        ("pipa", "Rosewood pipa", _R, "A pear-shaped lute with jade frets."),
        ("jade_flute", "Jade flute", _R, "Cold to the touch, warm in sound."),
        ("legend_guitar", "Legend's electric guitar", _E, "Played at a famous festival."),
        ("silver_trumpet", "Sterling silver trumpet", _R, "Bright as the morning."),
        ("bianzhong", "Bronze bells (bianzhong)", _L, "Sixty-five bells from 433 BC."),
        ("cello", "Golden-age cello", _E, "Deep voice, golden varnish."),
    ],
    "relic": [
        ("terracotta", "Terracotta warrior", _L, "One of eight thousand guards of an emperor."),
        ("ming_vase", "Ming blue-and-white vase", _E, "Cobalt dragons on white porcelain."),
        ("bronze_ding", "Bronze ding cauldron", _E, "A ritual vessel 3,000 years old."),
        ("golden_mask", "Golden death mask", _M, "Solid gold, lapis eyes."),
        ("katana", "Masamune katana", _L, "A blade of legendary sharpness."),
        ("viking_helm", "Viking helmet", _R, "No horns, despite the stories."),
        ("gladius", "Roman gladius", _R, "The sword that built an empire."),
        ("jade_suit", "Jade burial suit", _L, "Two thousand jade plates and gold wire."),
        ("astrolabe", "Brass astrolabe", _E, "Tells the time by the stars."),
        ("rosetta", "Rosetta stone cast", _R, "One text in three scripts."),
    ],
    "legend": [
        ("superyacht", "Superyacht", _L, "A helipad, a pool and a submarine."),
        ("private_jet", "Private jet", _E, "Leather seats at 40,000 feet."),
        ("space_capsule", "Space capsule", _L, "Flew around the moon."),
        ("gold_trophy", "Solid gold trophy", _E, "For the champion of champions."),
        ("gold_medal", "Olympic gold medal", _R, "Mostly silver, plated with gold."),
        ("treasure_chest", "Pirate treasure chest", _E, "Doubloons, pearls and a map."),
        ("meteorite", "Iron meteorite", _R, "Fell from the sky 50,000 years ago."),
        ("dragon_egg", "Dragon egg", _M, "Warm. It moved once."),
        ("phoenix_feather", "Phoenix feather", _M, "It never stops glowing."),
        ("bull_statue", "Bronze charging bull", _L, "The trader's lucky statue."),
    ],
}

ITEMS = {iid: {"id": iid, "name": name, "category": cat, "rarity": rarity, "note": note}
         for cat, items in _ITEMS.items() for iid, name, rarity, note in items}
CATEGORIES = {"art": "Great artworks", "tank": "Tanks", "dress": "Great dresses", "crown": "Crowns",
              "jewel": "Jewels", "car": "Classic cars", "watch": "Watches", "instrument": "Instruments",
              "relic": "Ancient relics", "legend": "Legends"}
assert len(ITEMS) == 100


def gift(owned, rng):
    """A random item not owned yet (rarer ones less likely), or None when the collection is complete."""
    left = [i for i in ITEMS.values() if i["id"] not in owned]
    if not left:
        return None
    return rng.choices(left, weights=[RARITY_WEIGHT[i["rarity"]] for i in left])[0]
