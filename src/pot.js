const { getBlindStructure } = require('./blinds');

const PREFLOP_ARCHETYPES = [
  { minBB: 4, maxBB: 6 },
  { minBB: 5, maxBB: 7 },
  { minBB: 7, maxBB: 10 },
  { minBB: 10, maxBB: 15 },
  { minBB: 18, maxBB: 25 },
];

function randomBetFraction() {
  if (Math.random() < 0.07) {
    return 1.5 + Math.random() * 1.5;
  }
  return 0.25 + Math.random() * 0.75;
}

function roundUp(amount, increment) {
  return Math.ceil(amount / increment) * increment;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateScenario(mode) {
  const blinds = getBlindStructure(mode);
  const { bb, increment } = blinds;

  const archetype = pickRandom(PREFLOP_ARCHETYPES);
  const preflopBBs = archetype.minBB + Math.random() * (archetype.maxBB - archetype.minBB);
  let pot = roundUp(preflopBBs * bb, increment);

  const numPriorStreets = Math.floor(Math.random() * 3);
  const streets = ['Flop', 'Turn', 'River'];
  const street = streets[numPriorStreets];

  for (let i = 0; i < numPriorStreets; i++) {
    const bet = roundUp(pot * randomBetFraction(), increment);
    pot += bet * 2;
  }

  const bet = roundUp(pot * randomBetFraction(), increment);

  return { pot, bet, street, mode, increment, label: blinds.label };
}

module.exports = { generateScenario, roundUp, pickRandom };
