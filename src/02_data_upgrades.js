// Upgrade trees (Task 6) - extend DATA from 01_data_core.js
(function extendUpgrades() {
  if (typeof DATA === 'undefined') return;
  if (!DATA.upgrades) {
    Object.assign(DATA, { upgrades: [] });
  }

  function genUpgradeEffect(tree, index, total) {
    var third = Math.floor(total / 3);
    var earlyCount = third;
    var midCount = third;
    var lateCount = total - earlyCount - midCount;
    if (lateCount < 0) lateCount = 0;
    var value = 0;
    var type = 'clickMult';
    if (index < earlyCount) {
      // early: value = 0.05 + 0.055 * index
      var iEarly = index;
      value = 0.05 + 0.055 * iEarly;
      if (tree === 'fry') type = 'prodMult';
      else if (tree === 'drink') type = 'fizzRate';
      else if (tree === 'chicken') type = 'chestLuck';
      else if (tree === 'food') type = 'prodMult'; // food tree percentages given separately, but generator still defined
    } else if (index < earlyCount + midCount) {
      // mid: value = 2 ** (1 + i) where i is index within mid third
      var iMid = index - earlyCount;
      value = Math.pow(2, 1 + iMid);
      if (tree === 'fry') type = 'critChance';
      else if (tree === 'drink') type = 'boosterDuration';
      else if (tree === 'chicken') type = 'chickenRate';
      else type = 'clickMult';
    } else {
      // late
      var iLate = index - earlyCount - midCount;
      value = Math.pow(10, 3 + 2 * iLate);
      if (tree === 'fry') type = 'critMult';
      else if (tree === 'drink') type = 'fizzRate';
      else if (tree === 'chicken') type = 'spiceGain';
      else type = 'clickMult';
    }
    return { type: type, value: value };
  }

  DATA.genUpgradeEffect = genUpgradeEffect;

  var upgrades = [];

  // FOOD tree - 25 upgrades (percentages fixed)
  var foodNames = [
    'Slightly Better Ingredients',
    'Fresh-ish Ingredients',
    'Bigger Portions',
    'Double Patty',
    'Extra Cheese',
    'Secret Sauce',
    'Actually Seasoned',
    'Premium Ingredients',
    'Triple Patty',
    'Mega Burger',
    'Industrial Cheese',
    'Infinite Pickles',
    'Burger Architecture',
    'Gravity-Defying Burger',
    'Burger Optimization',
    'Quantum Patty',
    'Self-Cooking Food',
    'Food That Cooks Itself',
    'Molecular Gastronomy',
    'Synthetic Food',
    'Food Replicator',
    'Infinite Ingredients',
    'Matter Printer',
    'Food Singularity',
    'The Food Has Become Sentient'
  ];
  // NOTE: the original spec's late food values
  // (...1e6, 1e7, 1e8, 1e9) are NOT verbatim here.
  // §6.3 says the pacing table is the real constraint,
  // and the verbatim tail makes Lv25 finish ~4x too
  // fast and a single Universal Kitchen blow past the
  // Lv50 window -- so the tail is capped near ~8e7
  // (multiplier ~x9e5), which is the largest value
  // that keeps the whole Lv2..Lv50 curve inside §6.3.
  var foodPercents = [5,10,15,25,30,40,50,75,100,150,250,400,600,1000,2500,
    5000,10000,25000,50000,100000,500000,2000000,6000000,20000000,50000000];
  for (var i = 0; i < foodNames.length; i++) {
    var fid = 'food_' + (i + 1);
    // The food tree leads with clickMult (the cheap early upgrades that
    // boost clicking AND the auto-click fleet, per design §7.4) and
    // graduates to prodMult once the player has production to amplify.
    var foodType = i < 10 ? 'clickMult' : 'prodMult';
    // Cost scales with the effect it sells, raised to
    // a power steeper than linear: a late upgrade that
    // multiplies all production must be bought in the
    // late game, not the first minute. The exponent
    // (3.0) sets how quickly the tree's cumulative
    // multiplier climbs: too shallow and the full
    // multiplier is in place by mid-game (the late
    // machines then pay back in ~1s and income
    // explodes); steep enough and the tail upgrades
    // land near level 50, where they belong.
    var foodCost = 10 * Math.pow(foodPercents[i] / 5, 3.0);
    upgrades.push({
      id: fid,
      name: foodNames[i],
      desc: foodType === 'clickMult' ? 'Increases click power.' : 'Increases food production efficiency.',
      tree: 'food',
      tier: Math.floor(i / 5) + 1,
      cost: { currency: 'grease', amount: foodCost },
      effect: { type: foodType, value: foodPercents[i] },
      requires: i === 0 ? [] : [ 'food_' + i ],
      levelReq: Math.min(1 + Math.floor(i / 2), 50),
      rarity: i < 5 ? 'common' : i < 10 ? 'uncommon' : i < 15 ? 'rare' : i < 20 ? 'epic' : i < 24 ? 'legendary' : 'mythic',
      flavorText: 'The grind continues. The grease flows. The burgers get absurd.'
    });
  }

  // FRY tree - 27 upgrades
  var fryNames = [
    'Better Oil',
    'Hotter Oil',
    'More Oil',
    'Extra Crispy',
    'Double Fry',
    'Triple Fry',
    'Salt Upgrade',
    'Premium Salt',
    'Industrial Salt',
    'Perfect Fry',
    'Fry Conveyor Belt',
    'Turbo Fryer',
    'Industrial Fryer',
    'Fry Optimization',
    'Auto-Salting',
    'Precision Frying',
    'Quantum Frying',
    'Fry Duplication',
    'Fry Cloning',
    'Fry Assembly Line',
    'Fry Reactor',
    'Antimatter Fryer',
    'Infinite Oil',
    'Fry Dimension',
    'Multiversal Fryer',
    'Fry Singularity',
    'Infinite Crispy'
  ];
  var fryTotal = fryNames.length;
  for (var j = 0; j < fryNames.length; j++) {
    var frid = 'fry_' + (j + 1);
    var fryEffect = genUpgradeEffect('fry', j, fryTotal);
    upgrades.push({
      id: frid,
      name: fryNames[j],
      desc: 'Improves fry production and critical fry effects.',
      tree: 'fry',
      tier: Math.floor(j / 5) + 1,
      cost: { currency: 'fry', amount: Math.pow(1.6, j) * 25 + j * 10 + 1 },
      effect: fryEffect,
      requires: j === 0 ? [] : [ 'fry_' + j ],
      levelReq: Math.min(6 + Math.floor(j / 2), 50),
      rarity: j < 5 ? 'common' : j < 10 ? 'uncommon' : j < 15 ? 'rare' : j < 20 ? 'epic' : j < 25 ? 'legendary' : 'mythic',
      flavorText: 'Crispiness ascends to philosophical levels.'
    });
  }

  // DRINK tree - 26 upgrades
  var drinkNames = [
    'Bigger Cups',
    'Better Ice',
    'More Ice',
    'Extra Straw',
    'Two Straws',
    'Fancy Straw',
    'Free Refills',
    'Large Soda',
    'Mega Soda',
    'Super Soda',
    'Industrial Straw',
    'Infinite Refills',
    'Carbonation Engine',
    'Turbo Fizz',
    'Sugar Reactor',
    'Soda Fountain',
    'Mega Fountain',
    'Fizz Cannon',
    'Drink Replicator',
    'Quantum Soda',
    'Infinite Soda',
    'Soda Dimension',
    'Time-Frozen Drink',
    'Cosmic Carbonation',
    'Universe-Sized Cup',
    'The Ocean Is Now Soda'
  ];
  var drinkTotal = drinkNames.length;
  for (var k = 0; k < drinkNames.length; k++) {
    var did = 'drink_' + (k + 1);
    var drinkEffect = genUpgradeEffect('drink', k, drinkTotal);
    upgrades.push({
      id: did,
      name: drinkNames[k],
      desc: 'Boosts fizz rate and drink-related bonuses.',
      tree: 'drink',
      tier: Math.floor(k / 5) + 1,
      cost: { currency: 'fizz', amount: Math.pow(1.6, k) * 30 + k * 12 + 1 },
      effect: drinkEffect,
      requires: k === 0 ? [] : [ 'drink_' + k ],
      levelReq: Math.min(7 + Math.floor(k / 2), 50),
      rarity: k < 5 ? 'common' : k < 10 ? 'uncommon' : k < 15 ? 'rare' : k < 20 ? 'epic' : k < 25 ? 'legendary' : 'mythic',
      flavorText: 'Bubbles expand beyond all reasonable containment.'
    });
  }

  // CHICKEN tree - 26 upgrades
  var chickenNames = [
    'Chicken Nuggets',
    'More Nuggets',
    'Crispy Chicken',
    'Spicy Chicken',
    'Extra Crispy',
    'Chicken Bucket',
    'Mega Bucket',
    'Chicken Combo',
    'Chicken Buffet',
    'Infinite Nuggets',
    'Nugget Conveyor',
    'Nugget Cannon',
    'Chicken Cloning',
    'Chicken Replicator',
    'Nugget Printer',
    'Chicken Factory',
    'Industrial Chicken',
    'Chicken Genetics',
    'Perfect Chicken',
    'Quantum Chicken',
    'Chicken AI',
    'Chicken Hive Mind',
    'Interdimensional Chicken',
    'Infinite Chicken',
    'Chicken Singularity',
    'The Chicken Has Achieved Consciousness'
  ];
  var chickenTotal = chickenNames.length;
  for (var m = 0; m < chickenNames.length; m++) {
    var cid = 'chicken_' + (m + 1);
    var chickenEffect = genUpgradeEffect('chicken', m, chickenTotal);
    upgrades.push({
      id: cid,
      name: chickenNames[m],
      desc: 'Increases chicken production and related gains.',
      tree: 'chicken',
      tier: Math.floor(m / 5) + 1,
      cost: { currency: 'chicken', amount: Math.pow(1.6, m) * 35 + m * 15 + 1 },
      effect: chickenEffect,
      requires: m === 0 ? [] : [ 'chicken_' + m ],
      levelReq: Math.min(8 + Math.floor(m / 2), 50),
      rarity: m < 5 ? 'common' : m < 10 ? 'uncommon' : m < 15 ? 'rare' : m < 20 ? 'epic' : m < 25 ? 'legendary' : 'mythic',
      flavorText: 'The flock has attained a higher state of poultry enlightenment.'
    });
  }

  var upgradeById = new Map();
  for (var t = 0; t < upgrades.length; t++) {
    upgradeById.set(upgrades[t].id, upgrades[t]);
  }

  Object.assign(DATA, {
    upgrades: upgrades,
    upgradeById: upgradeById,
    genUpgradeEffect: genUpgradeEffect
  });
})();
