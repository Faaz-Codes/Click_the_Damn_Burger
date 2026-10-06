const DATA = {
  currencies: [
    {
      id: 'grease',
      name: 'Grease',
      symbol: 'G',
      unlockLevel: 1,
      earns: ['clicks', 'production', 'automation'],
      spends: ['upgrades', 'everything'],
      palette: { primary: '#ffc83d', dark: '#f5a623' }
    },
    {
      id: 'fry',
      name: 'Fry Bucks',
      symbol: 'F',
      unlockLevel: 6,
      earns: ['fry_production'],
      spends: ['fry_tree'],
      palette: { primary: '#ffd87a', dark: '#e6b848' }
    },
    {
      id: 'fizz',
      name: 'Fizz',
      symbol: 'Z',
      unlockLevel: 7,
      earns: ['drink_production'],
      spends: ['drink_tree', 'boosters'],
      palette: { primary: '#3fc1ff', dark: '#2f9ce0' }
    },
    {
      id: 'chicken',
      name: 'Chicken Points',
      symbol: 'C',
      unlockLevel: 8,
      earns: ['chicken_production'],
      spends: ['chicken_tree', 'chest_keys'],
      palette: { primary: '#ffe4cc', dark: '#f5d6b3' }
    },
    {
      id: 'spice',
      name: 'Spice',
      symbol: 'S',
      unlockLevel: 15,
      earns: ['crits', 'chests'],
      spends: ['risky_upgrades', 're_rolls'],
      palette: { primary: '#e8433a', dark: '#c92f26' }
    },
    {
      id: 'clout',
      name: 'Clout',
      symbol: 'CL',
      unlockLevel: 20,
      earns: ['achievements'],
      spends: ['titles', 'themes'],
      palette: { primary: '#b266ff', dark: '#9a56e6' }
    },
    {
      id: 'crimes',
      name: 'Food Crimes',
      symbol: 'FC',
      unlockLevel: 25,
      earns: ['secret_achievements', 'mythic_chests'],
      spends: ['forbidden_menu'],
      palette: { primary: '#ffffff', dark: '#cccccc' }
    }
  ],

  foodLevels: [
    { id: 'sad_egg', name: 'Sad Egg', buildingName: 'Egg Cart', sprite: 'food_sad_egg', locationId: 'mom_kitchen', threshold: 150, unlocks: [], quips: ['Just one more egg.', 'So lonely.', 'It tries its best.'], accent: { bg: '#fff4d6', fg: '#ffc83d' } },
    { id: 'toast', name: 'Toast', buildingName: 'Toast Station', sprite: 'food_toast', locationId: 'mom_kitchen', threshold: 465, unlocks: [], quips: ['Golden brown.', 'Still warm.', 'Crispy vibes.'], accent: { bg: '#ffe0b3', fg: '#f5a623' } },
    { id: 'sandwich', name: 'Sandwich', buildingName: 'Sandwich Counter', sprite: 'food_sandwich', locationId: 'mom_kitchen', threshold: 1441.5, unlocks: [], quips: ['Classic stack.', 'Perfectly balanced.', 'No notes.'], accent: { bg: '#ffe4cc', fg: '#d8a87d' } },
    { id: 'hot_dog', name: 'Hot Dog', buildingName: 'Hot Dog Stand', sprite: 'food_hotdog', locationId: 'mom_kitchen', threshold: 4468.65, unlocks: [], quips: ['Wiener takes all.', 'Street certified.', 'Snap that bun.'], accent: { bg: '#ffd87a', fg: '#e8433a' } },
    { id: 'burger', name: 'Burger', buildingName: 'Burger Joint', sprite: 'food_burger', locationId: 'mom_kitchen', threshold: 13852.82, unlocks: [], quips: ['The icon.', 'Juicy.', 'Peak diner food.'], accent: { bg: '#ffc83d', fg: '#8d6748' } },
    { id: 'fries', name: 'Fries', buildingName: 'Fry Station', sprite: 'food_fries', locationId: 'parking_lot', threshold: 42943.72, unlocks: [], quips: ['Salt required.', 'Shareable? No.', 'Golden sticks.'], accent: { bg: '#ffd87a', fg: '#ffc83d' } },
    { id: 'soda', name: 'Soda', buildingName: 'Drink Machine', sprite: 'food_soda', locationId: 'parking_lot', threshold: 133125.52, unlocks: [], quips: ['Fizzy rush.', 'Brain freeze incoming.', 'Bubbly profits.'], accent: { bg: '#3fc1ff', fg: '#b3e6ff' } },
    { id: 'chicken', name: 'Chicken', buildingName: 'Chicken Counter', sprite: 'food_chicken', locationId: 'parking_lot', threshold: 412689.12, unlocks: [], quips: ['Crispy cluckin\' good.', 'Extra tenders.', 'Never dry.'], accent: { bg: '#ffe4cc', fg: '#f5a623' } },
    { id: 'pizza', name: 'Pizza', buildingName: 'Pizza Oven', sprite: 'food_pizza', locationId: 'parking_lot', threshold: 1279336.27, unlocks: [], quips: ['Slice economy.', 'Cheese pull.', 'Acceptable for lunch.'], accent: { bg: '#ffe4b3', fg: '#5ed36b' } },
    { id: 'tacos', name: 'Tacos', buildingName: 'Taco Stand', sprite: 'food_tacos', locationId: 'parking_lot', threshold: 3965942.44, unlocks: [], quips: ['Fold carefully.', 'Double up.', 'Street royalty.'], accent: { bg: '#5ed36b', fg: '#ffe4cc' } },
    { id: 'burrito', name: 'Burrito', buildingName: 'Burrito Bar', sprite: 'food_burrito', locationId: 'food_court', threshold: 12294421.55, unlocks: [], quips: ['Structural integrity.', 'Heavy payload.', 'Wrapped tight.'], accent: { bg: '#5ed36b', fg: '#8d6748' } },
    { id: 'pasta', name: 'Pasta', buildingName: 'Pasta Kitchen', sprite: 'food_pasta', locationId: 'food_court', threshold: 38112706.81, unlocks: [], quips: ['Al dente.', 'Sauce budget critical.', 'Slurp economics.'], accent: { bg: '#ffe27a', fg: '#e8433a' } },
    { id: 'ramen', name: 'Ramen', buildingName: 'Ramen Shop', sprite: 'food_ramen', locationId: 'food_court', threshold: 118149393.11, unlocks: [], quips: ['Broth time.', 'Steam therapy.', 'Slurp loudly.'], accent: { bg: '#ffe4cc', fg: '#e8433a' } },
    { id: 'sushi', name: 'Sushi', buildingName: 'Sushi Bar', sprite: 'food_sushi', locationId: 'food_court', threshold: 366263519.65, unlocks: [], quips: ['Precision cuts.', 'Raw profits.', 'Soy sauce tax.'], accent: { bg: '#fff4d6', fg: '#5ed36b' } },
    { id: 'dumplings', name: 'Dumplings', buildingName: 'Dumpling Factory', sprite: 'food_dumplings', locationId: 'food_court', threshold: 1135516910.91, unlocks: [], quips: ['Steam explosion risk.', 'Pocket of joy.', 'Count them.'], accent: { bg: '#ffe4cc', fg: '#f5a623' } },
    { id: 'pancakes', name: 'Pancakes', buildingName: 'Pancake House', sprite: 'food_pancakes', locationId: 'strip_mall', threshold: 3520102424.82, unlocks: [], quips: ['Stack goes up.', 'Syrup logistics.', 'Flapjack frenzy.'], accent: { bg: '#ffd87a', fg: '#ffc83d' } },
    { id: 'waffles', name: 'Waffles', buildingName: 'Waffle Factory', sprite: 'food_waffles', locationId: 'strip_mall', threshold: 10912317516.95, unlocks: [], quips: ['Grid optimized.', 'Honey trap.', 'Crisp squares.'], accent: { bg: '#ffe27a', fg: '#f5a623' } },
    { id: 'donuts', name: 'Donuts', buildingName: 'Donut Shop', sprite: 'food_donuts', locationId: 'strip_mall', threshold: 33828184302.53, unlocks: [], quips: ['Hole in budget.', 'Glazed and taxed.', 'One more.'], accent: { bg: '#fff4d6', fg: '#b266ff' } },
    { id: 'ice_cream', name: 'Ice Cream', buildingName: 'Ice Cream Parlour', sprite: 'food_icecream', locationId: 'strip_mall', threshold: 104867372138.84, unlocks: [], quips: ['Melts under pressure.', 'Scoops per second.', 'Brain freeze tax.'], accent: { bg: '#b3e6ff', fg: '#5ed36b' } },
    { id: 'cake', name: 'Cake', buildingName: 'Cake Factory', sprite: 'food_cake', locationId: 'strip_mall', threshold: 325088854830.40, unlocks: [], quips: ['Layer cake economics.', 'Portion control lost.', 'Celebration loop.'], accent: { bg: '#fff4d6', fg: '#e8433a' } },
    { id: 'cupcakes', name: 'Cupcakes', buildingName: 'Cupcake Empire', sprite: 'food_cupcakes', locationId: 'downtown', threshold: 1007775449984.25, unlocks: [], quips: ['Micro profits.', 'Frosting overhead.', 'Cute margins.'], accent: { bg: '#b266ff', fg: '#fff4d6' } },
    { id: 'cookies', name: 'Cookies', buildingName: 'Cookie Factory', sprite: 'food_cookies', locationId: 'downtown', threshold: 3124105894951.17, unlocks: [], quips: ['Batch production.', 'Cookie click vibes.', 'Warm batch effect.'], accent: { bg: '#ffe0b3', fg: '#8d6748' } },
    { id: 'chocolate', name: 'Chocolate', buildingName: 'Chocolate Plant', sprite: 'food_chocolate', locationId: 'downtown', threshold: 9694728278348.63, unlocks: [], quips: ['Dark margins.', 'Tempering issues.', 'Addictive markup.'], accent: { bg: '#8d6748', fg: '#ffc83d' } },
    { id: 'popcorn', name: 'Popcorn', buildingName: 'Cinema Food Empire', sprite: 'food_popcorn', locationId: 'downtown', threshold: 30053657662981.75, unlocks: [], quips: ['Kernel expansion factor.', 'Butter subsidy.', 'Multiplying fast.'], accent: { bg: '#ffd87a', fg: '#e8433a' } },
    { id: 'pretzels', name: 'Pretzels', buildingName: 'Pretzel Factory', sprite: 'food_pretzels', locationId: 'downtown', threshold: 93166339755243.44, unlocks: [], quips: ['Twisted logistics.', 'Salt budget.', 'Knotty profits.'], accent: { bg: '#ffe27a', fg: '#9d8fc0' } },
    { id: 'cheese', name: 'Cheese', buildingName: 'Cheese Corporation', sprite: 'proc_cheese_var1', locationId: 'industrial', threshold: 288815652441255.00, unlocks: [], quips: ['Aged for profits.', 'Mold is fine.', 'Sharp margins.'], accent: { bg: '#ffc83d', fg: '#f5a623' } },
    { id: 'bacon', name: 'Bacon', buildingName: 'Bacon Industries', sprite: 'proc_bacon_var1', locationId: 'industrial', threshold: 895329522168490.50, unlocks: [], quips: ['Smoky profits.', 'Grease multiplier.', 'Porkonomics.'], accent: { bg: '#e8433a', fg: '#ffc83d' } },
    { id: 'steak', name: 'Steak', buildingName: 'Steakhouse', sprite: 'proc_steak_var1', locationId: 'industrial', threshold: 2775521522720320.50, unlocks: [], quips: ['Well done margins.', 'Medium rare gains.', 'Prime cuts only.'], accent: { bg: '#e8433a', fg: '#8d6748' } },
    { id: 'bbq', name: 'BBQ', buildingName: 'BBQ Empire', sprite: 'proc_bbq_var1', locationId: 'industrial', threshold: 8604116720432994.00, unlocks: [], quips: ['Low and slow profits.', 'Smoke signals growth.', 'Rub included.'], accent: { bg: '#f5a623', fg: '#e8433a' } },
    { id: 'mega_meal', name: 'Mega Meal', buildingName: 'Mega Food Court', sprite: 'proc_megameal_var1', locationId: 'industrial', threshold: 26672761853342280.00, unlocks: [], quips: ['Excessive.', 'Unhinged serving size.', 'Corporate mandate.'], accent: { bg: '#ffc83d', fg: '#e8433a' } },
    { id: 'combo_meal', name: 'Combo Meal', buildingName: 'Combo Corporation', sprite: 'proc_combo_var1', locationId: 'fridge', threshold: 82685661945361000.00, unlocks: [], quips: ['Bundled margins.', 'Upsell complete.', 'Value meal vortex.'], accent: { bg: '#3fc1ff', fg: '#ffc83d' } },
    { id: 'nuclear_spicy', name: 'Nuclear Spicy Food', buildingName: 'Spice Labs', sprite: 'proc_nuclearspicy_var1', locationId: 'fridge', threshold: 256325553034619500.00, unlocks: [], quips: ['Regulatory violation.', 'Tears in production.', 'Hazmat required.'], accent: { bg: '#e8433a', fg: '#5ed36b' } },
    { id: 'mystery_food', name: 'Mystery Food', buildingName: 'Food Research Lab', sprite: 'proc_mystery_var1', locationId: 'fridge', threshold: 794609214407521500.00, unlocks: [], quips: ['Do not identify.', 'Classified nutrients.', 'Self-aware maybe.'], accent: { bg: '#b266ff', fg: '#fff4d6' } },
    { id: 'ultimate_breakfast', name: 'Ultimate Breakfast', buildingName: 'Breakfast Empire', sprite: 'proc_ubreakfast_var1', locationId: 'fridge', threshold: 2463288574663327000.00, unlocks: [], quips: ['All day, all power.', 'Pancake stack infinite.', 'Caffeine budget blown.'], accent: { bg: '#ffd87a', fg: '#5ed36b' } },
    { id: 'ancient_food', name: 'Ancient Food', buildingName: 'Ancient Food Temple', sprite: 'proc_ancient_var1', locationId: 'fridge', threshold: 7636198573462314000.00, unlocks: [], quips: ['Preserved in amber.', 'Archaeology dept upset.', 'Calories from antiquity.'], accent: { bg: '#9d8fc0', fg: '#ffc83d' } },
    { id: 'alien_food', name: 'Alien Food', buildingName: 'Alien Restaurant', sprite: 'proc_alien_var1', locationId: 'abyss', threshold: 23672215677733274000.00, unlocks: [], quips: ['Non-terrestrial flavor.', 'Xenobiology concerned.', 'Tentacles extra.'], accent: { bg: '#5ed36b', fg: '#b266ff' } },
    { id: 'gmo_food', name: 'Genetically Modified Food', buildingName: 'Bio-Food Labs', sprite: 'proc_gmo_var1', locationId: 'abyss', threshold: 73463968600993150000.00, unlocks: [], quips: ['Unlicensed DNA.', 'Express growth.', 'Ethics committee fled.'], accent: { bg: '#b266ff', fg: '#5ed36b' } },
    { id: 'robot_food', name: 'Robot Food', buildingName: 'Robo Kitchen', sprite: 'proc_robot_var1', locationId: 'abyss', threshold: 227738305462078760000.00, unlocks: [], quips: ['Oil-fried.', '100% synthetic.', 'Does not experience taste.'], accent: { bg: '#9d8fc0', fg: '#3fc1ff' } },
    { id: 'nuclear_food', name: 'Nuclear Food', buildingName: 'Nuclear Kitchen', sprite: 'proc_nuclear_var1', locationId: 'abyss', threshold: 705988746932644100000.00, unlocks: [], quips: ['Glows slightly.', 'Half-life flavor.', 'Geiger counter recommended.'], accent: { bg: '#5ed36b', fg: '#ffc83d' } },
    { id: 'volcano_food', name: 'Volcano Food', buildingName: 'Volcano Restaurant', sprite: 'proc_volcano_var1', locationId: 'abyss', threshold: 2188563115509201600000.00, unlocks: [], quips: ['Lava roasted.', 'Mantle pressure.', 'Magma margins.'], accent: { bg: '#e8433a', fg: '#f5a623' } },
    { id: 'moon_food', name: 'Moon Food', buildingName: 'Lunar Restaurant', sprite: 'proc_moon_var1', locationId: 'orbital', threshold: 6784545660068525000000.00, unlocks: [], quips: ['Low gravity bites.', 'Lunar dust seasoning.', 'One small bite...'], accent: { bg: '#9d8fc0', fg: '#fff4d6' } },
    { id: 'planet_food', name: 'Planet Food', buildingName: 'Planetary Franchise', sprite: 'proc_planet_var1', locationId: 'orbital', threshold: 21032111546212430000000.00, unlocks: [], quips: ['Terraformed flavor.', 'Orbital supply chain.', 'Ecological footprint huge.'], accent: { bg: '#3fc1ff', fg: '#5ed36b' } },
    { id: 'cosmic_food', name: 'Cosmic Food', buildingName: 'Cosmic Kitchen', sprite: 'proc_cosmic_var1', locationId: 'orbital', threshold: 65200055793358530000000.00, unlocks: [], quips: ['Stellar fusion baked in.', 'Big Bang seasoning.', 'Cosmically absurd.'], accent: { bg: '#b266ff', fg: '#3fc1ff' } },
    { id: 'blackhole_buffet', name: 'Black Hole Buffet', buildingName: 'Gravity Dining', sprite: 'proc_blackhole_var1', locationId: 'orbital', threshold: 202120172960011440000000.00, unlocks: [], quips: ['Event horizon appetite.', 'Massive gravitational draw.', 'Nothing escapes.'], accent: { bg: '#1a0d33', fg: '#b266ff' } },
    { id: 'time_food', name: 'Time Food', buildingName: 'Temporal Kitchen', sprite: 'proc_time_var1', locationId: 'orbital', threshold: 626572535776035500000000.00, unlocks: [], quips: ['Causality violation.', 'Predicted future sales.', 'Déjà vu flavor.'], accent: { bg: '#b266ff', fg: '#fff4d6' } },
    { id: 'multiversal_food', name: 'Multiversal Food', buildingName: 'Multiverse Franchise', sprite: 'proc_multiverse_var1', locationId: 'galactic', threshold: 1942376857907700000000000.00, unlocks: [], quips: ['Infinite timelines.', 'Branching profit trees.', 'Every reality buys.'], accent: { bg: '#b266ff', fg: '#5ed36b' } },
    { id: 'infinite_food', name: 'Infinite Food', buildingName: 'Infinite Restaurant', sprite: 'proc_infinite_var1', locationId: 'galactic', threshold: 6021370259523870000000000.00, unlocks: [], quips: ['Countably infinite fries.', 'Unbounded growth.', 'This is fine.'], accent: { bg: '#5ed36b', fg: '#ffc83d' } },
    { id: 'sentient_food', name: 'Sentient Food', buildingName: 'Food Intelligence Lab', sprite: 'proc_sentient_var1', locationId: 'galactic', threshold: 18666247904523900000000000.00, unlocks: [], quips: ['It unionized.', 'Please stop.', 'I have a family.'], accent: { bg: '#e8433a', fg: '#fff4d6' } },
    { id: 'food_god', name: 'Food God', buildingName: 'Divine Kitchen', sprite: 'proc_foodgod_var1', locationId: 'galactic', threshold: 57865468544024100000000000.00, unlocks: [], quips: ['Thou shalt click.', 'Omnifed.', 'The congregation grows.'], accent: { bg: '#ffc83d', fg: '#b266ff' } },
    { id: 'omnifood', name: 'THE OMNIFOOD', buildingName: 'THE END™', sprite: 'proc_omnifood_var1', locationId: 'galactic', threshold: 179383018486474700000000000.00, unlocks: [], quips: ['The end is nigh.', 'We have reached peak food.', 'Economics collapsed.'], accent: { bg: '#ffffff', fg: '#b266ff' } }
  ],

  locations: [
    {
      id: 'mom_kitchen',
      name: "Mom's Kitchen",
      levelFrom: 1,
      levelTo: 5,
      palette: { bg: '#f0e5c9', fg: '#8d6748' },
      signJoke: 'Mom said eat your eggs!',
      ambient: ['fridge_hum', 'flourescent_buzz']
    },
    {
      id: 'parking_lot',
      name: 'The Parking Lot',
      levelFrom: 6,
      levelTo: 10,
      palette: { bg: '#c9c9c9', fg: '#666666' },
      signJoke: 'Free parking, not free food.',
      ambient: ['moths', 'distant_traffic']
    },
    {
      id: 'food_court',
      name: 'Food Court',
      levelFrom: 11,
      levelTo: 15,
      palette: { bg: '#d8e6ff', fg: '#4a6b99' },
      signJoke: 'Choose your suffering.',
      ambient: ['fluorescent_panels', 'fountain_drip']
    },
    {
      id: 'strip_mall',
      name: 'Strip Mall',
      levelFrom: 16,
      levelTo: 20,
      palette: { bg: '#ffe0cc', fg: '#996633' },
      signJoke: 'Rent is due.',
      ambient: ['neon_flicker', 'rain']
    },
    {
      id: 'downtown',
      name: 'Downtown',
      levelFrom: 21,
      levelTo: 25,
      palette: { bg: '#e6e6e6', fg: '#333333' },
      signJoke: 'Concrete eats everything.',
      ambient: ['pigeons', 'steam_vent']
    },
    {
      id: 'industrial',
      name: 'Industrial District',
      levelFrom: 26,
      levelTo: 30,
      palette: { bg: '#d8ccc2', fg: '#665544' },
      signJoke: 'Safety goggles not included.',
      ambient: ['factory_hum', 'pipes']
    },
    {
      id: 'fridge',
      name: 'The Fridge',
      levelFrom: 31,
      levelTo: 35,
      palette: { bg: '#c9e6ff', fg: '#4d7fa3' },
      signJoke: 'Do not open after midnight.',
      ambient: ['frost', 'something_moves']
    },
    {
      id: 'abyss',
      name: 'The Abyss',
      levelFrom: 36,
      levelTo: 40,
      palette: { bg: '#1a0d33', fg: '#b266ff' },
      signJoke: 'The food looks back.',
      ambient: ['bioluminescence', 'drifting_particulate']
    },
    {
      id: 'orbital',
      name: 'The Orbital Ring',
      levelFrom: 41,
      levelTo: 45,
      palette: { bg: '#0f1a33', fg: '#66ccff' },
      signJoke: 'No gravity, still calories.',
      ambient: ['planet_below', 'station_hum']
    },
    {
      id: 'galactic',
      name: 'Galactic Food Empire',
      levelFrom: 46,
      levelTo: 50,
      palette: { bg: '#140f33', fg: '#ff66cc' },
      signJoke: 'We have colonized flavor.',
      ambient: ['nebula', 'orbital_fleets']
    }
  ]
};

DATA.thresholdFor = function (n) {
  if (typeof n !== 'number') n = 1;
  const base = BigNum.fromNumber(CONFIG.THRESHOLD_BASE);
  const growth = BigNum.fromNumber(CONFIG.THRESHOLD_GROWTH);
  const exp = n - 1;
  const growthPow = BigNum.pow(growth, exp);
  const res = BigNum.mul(base, growthPow);
  return res;
};
