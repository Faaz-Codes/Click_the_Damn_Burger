Object.assign(DATA, {
  employees: [
    // Tier 1 (5)
    { id: 'intern', name: 'Intern', tier: 1, portrait: 'p_intern', cost: { currency: 'grease', amount: 10 }, rate: 0.1, effect: { type: 'prodMult', value: 1.05 }, desc: 'Grabs fries and mops floors.', flavorText: 'Just started. Already confused.' },
    { id: 'part_time_cook', name: 'Part-Time Cook', tier: 1, portrait: 'p_pt_cook', cost: { currency: 'grease', amount: 50 }, rate: 0.5, effect: { type: 'prodMult', value: 1.06 }, desc: 'Cooks basic items part-time.', flavorText: 'Still goes to class after shift.' },
    { id: 'cashier', name: 'Cashier', tier: 1, portrait: 'p_cashier', cost: { currency: 'grease', amount: 150 }, rate: 1.2, effect: { type: 'clickMult', value: 1.07 }, desc: 'Rings up orders with speed.', flavorText: 'Has memorized the menu.' },
    { id: 'dishwasher', name: 'Dishwasher', tier: 1, portrait: 'p_dishwasher', cost: { currency: 'grease', amount: 300 }, rate: 2.5, effect: { type: 'costReduction', value: 0.02 }, desc: 'Cleans dishes to cut costs.', flavorText: 'The real MVP.' },
    { id: 'cook', name: 'Cook', tier: 1, portrait: 'p_cook', cost: { currency: 'grease', amount: 600 }, rate: 4.0, effect: { type: 'prodMult', value: 1.08 }, desc: 'Full-time cook with solid output.', flavorText: 'Can flip 40 patties an hour.' },

    // Tier 2 (5)
    { id: 'chef', name: 'Chef', tier: 2, portrait: 'p_chef', cost: { currency: 'grease', amount: 7200 }, rate: 32.0, effect: { type: 'prodMult', value: 1.1 }, desc: 'Runs the line with expertise.', flavorText: 'Temperamental in a theatrical way.' },
    { id: 'fry_technician', name: 'Fry Technician', tier: 2, portrait: 'p_frytech', cost: { currency: 'grease', amount: 8640 }, rate: 36.0, effect: { type: 'fryRate', value: 1.15 }, desc: 'Optimizes fry production.', flavorText: 'Gets emotional about oil temperature.' },
    { id: 'drink_specialist', name: 'Drink Specialist', tier: 2, portrait: 'p_drinkspec', cost: { currency: 'grease', amount: 10368 }, rate: 43.0, effect: { type: 'fizzRate', value: 1.15 }, desc: 'Boosts drink production.', flavorText: 'Perfect syrup-to-soda ratio.' },
    { id: 'chicken_specialist', name: 'Chicken Specialist', tier: 2, portrait: 'p_chickenspec', cost: { currency: 'grease', amount: 12442 }, rate: 52.0, effect: { type: 'chickenRate', value: 1.15 }, desc: 'Boosts chicken output.', flavorText: 'Brines everything in buttermilk.' },
    { id: 'burger_engineer', name: 'Burger Engineer', tier: 2, portrait: 'p_burgereng', cost: { currency: 'grease', amount: 14930 }, rate: 62.0, effect: { type: 'prodMult', value: 1.12 }, desc: 'Engineers the perfect stack.', flavorText: 'Calculates cheese melt time precisely.' },

    // Tier 3 (5)
    { id: 'shift_manager', name: 'Shift Manager', tier: 3, portrait: 'p_shiftmgr', cost: { currency: 'grease', amount: 179160 }, rate: 496.0, effect: { type: 'prodMult', value: 1.15 }, desc: 'Keeps shifts running efficiently.', flavorText: 'Has seen things.' },
    { id: 'restaurant_manager', name: 'Restaurant Manager', tier: 3, portrait: 'p_restmgr', cost: { currency: 'grease', amount: 214992 }, rate: 595.0, effect: { type: 'costReduction', value: 0.04 }, desc: 'Cuts overhead and boosts output.', flavorText: 'Spreadsheet sorcerer.' },
    { id: 'regional_manager', name: 'Regional Manager', tier: 3, portrait: 'p_regmgr', cost: { currency: 'grease', amount: 257990 }, rate: 714.0, effect: { type: 'prodMult', value: 1.17 }, desc: 'Manages multiple locations.', flavorText: 'Lives in a company car.' },
    { id: 'corporate_manager', name: 'Corporate Manager', tier: 3, portrait: 'p_corpmgr', cost: { currency: 'grease', amount: 309588 }, rate: 857.0, effect: { type: 'clickMult', value: 1.18 }, desc: 'Corporate efficiency at scale.', flavorText: 'Buzzword powered.' },
    { id: 'corporate_executive', name: 'Corporate Executive', tier: 3, portrait: 'p_corp_exec', cost: { currency: 'grease', amount: 371506 }, rate: 1028.0, effect: { type: 'prodMult', value: 1.19 }, desc: 'Executes growth strategies.', flavorText: 'Golf is very important.' },

    // Tier 4 (5)
    { id: 'food_economist', name: 'Food Economist', tier: 4, portrait: 'p_foodecon', cost: { currency: 'grease', amount: 4458072 }, rate: 8224.0, effect: { type: 'prodMult', value: 1.21 }, desc: 'Applies economics to food production.', flavorText: 'Supplies and demands answers.' },
    { id: 'food_analyst', name: 'Food Analyst', tier: 4, portrait: 'p_foodanalyst', cost: { currency: 'grease', amount: 5349686 }, rate: 9869.0, effect: { type: 'costReduction', value: 0.06 }, desc: 'Analyzes data to reduce costs.', flavorText: 'Lives in Excel.' },
    { id: 'food_scientist', name: 'Food Scientist', tier: 4, portrait: 'p_foodscientist', cost: { currency: 'grease', amount: 6419623 }, rate: 11843.0, effect: { type: 'prodMult', value: 1.23 }, desc: 'Scientifically optimizes recipes.', flavorText: 'Unnecessarily precise.' },
    { id: 'ai_chef', name: 'AI Chef', tier: 4, portrait: 'p_aichef', cost: { currency: 'grease', amount: 7703548 }, rate: 14212.0, effect: { type: 'clickMult', value: 1.25 }, desc: 'AI-powered culinary optimization.', flavorText: 'Still can\'t taste anything.' },
    { id: 'food_engineer', name: 'Food Engineer', tier: 4, portrait: 'p_foodengineer', cost: { currency: 'grease', amount: 9244258 }, rate: 17054.0, effect: { type: 'prodMult', value: 1.26 }, desc: 'Engineers food at scale.', flavorText: 'Has strong opinions about viscosity.' },

    // Tier 5 (5)
    { id: 'burger_wizard', name: 'Burger Wizard', tier: 5, portrait: 'p_burgerwiz', cost: { currency: 'grease', amount: 110931096 }, rate: 136432.0, effect: { type: 'prodMult', value: 1.28 }, desc: 'Casts spells to conjure burgers.', flavorText: 'Wand made of a pickle spear.' },
    { id: 'alien_consultant', name: 'Alien Consultant', tier: 5, portrait: 'p_alienconsult', cost: { currency: 'grease', amount: 133117315 }, rate: 163718.0, effect: { type: 'cloutGain', value: 0.1 }, desc: 'Consults on non-terrestrial cuisine.', flavorText: 'Odd number of limbs.' },
    { id: 'robot_manager', name: 'Robot Manager', tier: 5, portrait: 'p_robotmgr', cost: { currency: 'grease', amount: 159740778 }, rate: 196462.0, effect: { type: 'prodMult', value: 1.3 }, desc: 'Manages robot workforce efficiently.', flavorText: 'More efficient than human managers.' },
    { id: 'genetic_food_scientist', name: 'Genetic Food Scientist', tier: 5, portrait: 'p_geneticfood', cost: { currency: 'grease', amount: 191688934 }, rate: 235754.0, effect: { type: 'prodMult', value: 1.32 }, desc: 'Genetically optimizes ingredients.', flavorText: 'The tomatoes have six arms.' },
    { id: 'cosmic_chef', name: 'Cosmic Chef', tier: 5, portrait: 'p_cosmichef', cost: { currency: 'grease', amount: 230026721 }, rate: 282905.0, effect: { type: 'critMult', value: 1.33 }, desc: 'Cooks across the cosmos.', flavorText: 'Uses neutron stars for searing.' },

    // Tier 6 (5)
    { id: 'food_emperor', name: 'Food Emperor', tier: 6, portrait: 'p_foodemperor', cost: { currency: 'grease', amount: 2760320652 }, rate: 2263240.0, effect: { type: 'prodMult', value: 1.35 }, desc: 'Rules over the food empire.', flavorText: 'Demands tribute in fries.' },
    { id: 'worlds_greatest_chef', name: "World's Greatest Chef", tier: 6, portrait: 'p_worldgreatest', cost: { currency: 'grease', amount: 3312384782 }, rate: 2715888.0, effect: { type: 'critChance', value: 0.05 }, desc: 'Universally acclaimed chef.', flavorText: 'Impossibly smug.' },
    { id: 'intergalactic_restaurant_manager', name: 'Intergalactic Restaurant Manager', tier: 6, portrait: 'p_intergalmgr', cost: { currency: 'grease', amount: 3974861738 }, rate: 3259066.0, effect: { type: 'prodMult', value: 1.37 }, desc: 'Manages restaurants across galaxies.', flavorText: 'Deals with alien HR issues.' },
    { id: 'food_intelligence', name: 'Food Intelligence', tier: 6, portrait: 'p_foodintel', cost: { currency: 'grease', amount: 4769834086 }, rate: 3910879.0, effect: { type: 'comboDecayResist', value: 0.15 }, desc: 'Sentient food intelligence optimizing everything.', flavorText: 'Knows what you ate last Tuesday.' },
    { id: 'the_omnichef', name: 'The Omnichef', tier: 6, portrait: 'p_omnichef', cost: { currency: 'grease', amount: 5723800903 }, rate: 4693055.0, effect: { type: 'prodMult', value: 1.4 }, desc: 'Transcends culinary reality.', flavorText: 'Serves meals that break causality.' }
  ],
  automation: [
    // early (6)
    { id: 'basic_clicker', name: 'Basic Clicker', group: 'early', rate: 1, cost: { currency: 'grease', amount: 15 }, growth: 1.15, icon: 'auto_click', desc: 'Auto-clicks once per second.', flavorText: 'It clicks for you.' },
    { id: 'better_clicker', name: 'Better Clicker', group: 'early', rate: 5, cost: { currency: 'grease', amount: 100 }, growth: 1.15, icon: 'auto_click2', desc: 'Auto-clicks 5 times per second.', flavorText: 'Slightly better springs.' },
    { id: 'automatic_fryer', name: 'Automatic Fryer', group: 'early', rate: 10, cost: { currency: 'grease', amount: 500 }, growth: 1.14, icon: 'auto_fryer', desc: 'Automatically fries 10 times per second.', flavorText: 'Never overcooks.' },
    { id: 'auto_grill', name: 'Auto Grill', group: 'early', rate: 20, cost: { currency: 'grease', amount: 3000 }, growth: 1.14, icon: 'auto_grill', desc: 'Automatically grills 20 times per second.', flavorText: 'Sear marks perfect every time.' },
    { id: 'auto_cashier', name: 'Auto Cashier', group: 'early', rate: 50, cost: { currency: 'grease', amount: 20000 }, growth: 1.13, icon: 'auto_cashier', desc: 'Automatically processes 50 clicks per second.', flavorText: 'Never asks for ID.' },
    { id: 'food_conveyor', name: 'Food Conveyor', group: 'early', rate: 100, cost: { currency: 'grease', amount: 150000 }, growth: 1.13, icon: 'auto_conveyor', desc: 'Moves food automatically for 100 clicks per second.', flavorText: 'Satisfying belt motion.' },

    // mid (6)
    { id: 'industrial_conveyor', name: 'Industrial Conveyor', group: 'mid', rate: 500, cost: { currency: 'grease', amount: 1200000 }, growth: 1.15, icon: 'auto_ind_conveyor', desc: 'Industrial belt produces 500 clicks per second.', flavorText: 'Steel reinforced.' },
    { id: 'robot_cook', name: 'Robot Cook', group: 'mid', rate: 1000, cost: { currency: 'grease', amount: 10000000 }, growth: 1.15, icon: 'auto_robot_cook', desc: 'Robot cook generates 1000 clicks per second.', flavorText: 'Has no feelings, works harder.' },
    { id: 'robot_fryer', name: 'Robot Fryer', group: 'mid', rate: 5000, cost: { currency: 'grease', amount: 80000000 }, growth: 1.14, icon: 'auto_robot_fryer', desc: 'Robot fryer produces 5000 clicks per second.', flavorText: 'Consistent oil temps.' },
    { id: 'food_assembly_line', name: 'Food Assembly Line', group: 'mid', rate: 10000, cost: { currency: 'grease', amount: 650000000 }, growth: 1.14, icon: 'auto_assembly', desc: 'Assembly line generates 10000 clicks per second.', flavorText: 'Henry Ford would approve.' },
    { id: 'ai_kitchen', name: 'AI Kitchen', group: 'mid', rate: 50000, cost: { currency: 'grease', amount: 5200000000 }, growth: 1.13, icon: 'auto_ai_kitchen', desc: 'AI kitchen produces 50000 clicks per second.', flavorText: 'Optimizes beyond human comprehension.' },
    { id: 'automated_restaurant', name: 'Automated Restaurant', group: 'mid', rate: 100000, cost: { currency: 'grease', amount: 41600000000 }, growth: 1.13, icon: 'auto_restaurant', desc: 'Fully automated restaurant yields 100000 clicks per second.', flavorText: 'No employees, no complaints.' },

    // late (9)
    // Costs are tuned (via the balance simulator,
    // src/19_balance.js) so the whole pacing curve
    // lands inside the design's §6.3 table.
    //
    // A machine's true payback is cost / (rate *
    // clickCore * prodMult). The food-tree multiplier
    // (prodMult) climbs through the mid and late game,
    // so a cost that looks fine at a low multiplier
    // collapses to a sub-second payback once the
    // multiplier is up -- which let a single Universal
    // Kitchen fund dozens of copies and blow the
    // curve. These costs are ~7.6x the bare
    // rate-proportional figures, which keeps each tier
    // a long-term investment and lands level 50 at
    // ~9 hours. The late costs scale uniformly so the
    // payback ladder keeps rising the way it does
    // through the early and mid tiers.
    { id: 'food_factory', name: 'Food Factory', group: 'late', rate: 1000000, cost: { currency: 'grease', amount: 3.8e12 }, growth: 1.15, icon: 'auto_factory', desc: 'Food factory produces 1e6 clicks per second.', flavorText: 'Mass production at scale.' },
    { id: 'food_megafactory', name: 'Food Megafactory', group: 'late', rate: 10000000, cost: { currency: 'grease', amount: 4.94e13 }, growth: 1.15, icon: 'auto_megafactory', desc: 'Megafactory generates 1e7 clicks per second.', flavorText: 'So big it has its own weather.' },
    { id: 'automated_food_city', name: 'Automated Food City', group: 'late', rate: 100000000, cost: { currency: 'grease', amount: 6.46e14 }, growth: 1.14, icon: 'auto_city', desc: 'Automated city produces 1e8 clicks per second.', flavorText: 'An entire city dedicated to food.' },
    { id: 'food_manufacturing_network', name: 'Food Manufacturing Network', group: 'late', rate: 1000000000, cost: { currency: 'grease', amount: 8.36e15 }, growth: 1.14, icon: 'auto_network', desc: 'Global network yields 1e9 clicks per second.', flavorText: 'Interconnected production.' },
    { id: 'planetary_food_factory', name: 'Planetary Food Factory', group: 'late', rate: 10000000000, cost: { currency: 'grease', amount: 1.064e17 }, growth: 1.13, icon: 'auto_planetary', desc: 'Planet-scale factory produces 1e10 clicks per second.', flavorText: 'Terraforms for efficiency.' },
    { id: 'interplanetary_supply_chain', name: 'Interplanetary Supply Chain', group: 'late', rate: 100000000000, cost: { currency: 'grease', amount: 1.444e18 }, growth: 1.13, icon: 'auto_interplanetary', desc: 'Interplanetary chain generates 1e11 clicks per second.', flavorText: 'Logistics across the solar system.' },
    { id: 'galactic_food_network', name: 'Galactic Food Network', group: 'late', rate: 1000000000000, cost: { currency: 'grease', amount: 1.9e19 }, growth: 1.15, icon: 'auto_galactic', desc: 'Galactic network yields 1e12 clicks per second.', flavorText: 'Food for an entire galaxy.' },
    { id: 'universal_food_production', name: 'Universal Food Production', group: 'late', rate: 1000000000000000, cost: { currency: 'grease', amount: 3.8e22 }, growth: 1.15, icon: 'auto_universal', desc: 'Universal production yields 1e15 clicks per second.', flavorText: 'All of creation fed.' },
    { id: 'omniversal_kitchen', name: 'Omniversal Kitchen', group: 'late', rate: 1e30, cost: { currency: 'grease', amount: 7.6e37 }, growth: 1.14, icon: 'auto_omniversal', desc: 'Omniversal kitchen transcends all realities, yielding clicks per second.', flavorText: 'Beyond comprehension.', displayName: '∞' }
  ]
});

Object.assign(DATA, {
  employeeById: new Map(DATA.employees.map(e => [e.id, e])),
  automationById: new Map(DATA.automation.map(a => [a.id, a]))
});

// Employees scale in cost per hire, exactly like automation --
// a repeatable purchase whose price never rises would let a
// player buy unbounded quantities and break the economy.
// Growth eases slightly for the pricier tiers so they stay
// buyable as the run progresses.
Object.assign(DATA, {
  employeeGrowth: { 1: 1.15, 2: 1.14, 3: 1.13, 4: 1.12, 5: 1.11, 6: 1.10 }
});
for (const emp of DATA.employees) {
  emp.growth = DATA.employeeGrowth[emp.tier] || 1.13;
}