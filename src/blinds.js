const TOURNAMENT_LEVELS = [
  { sb: 25, bb: 50 },
  { sb: 50, bb: 100 },
  { sb: 75, bb: 150 },
  { sb: 100, bb: 200 },
  { sb: 150, bb: 300 },
  { sb: 200, bb: 400 },
  { sb: 300, bb: 600 },
  { sb: 500, bb: 1000 },
  { sb: 1000, bb: 2000 },
  { sb: 1500, bb: 3000 },
  { sb: 2000, bb: 4000 },
  { sb: 3000, bb: 6000 },
  { sb: 5000, bb: 10000 },
];

function getBlindStructure(mode) {
  if (mode === 'cash') {
    return { sb: 1, bb: 2, increment: 1, label: '$' };
  }

  const level = TOURNAMENT_LEVELS[Math.floor(Math.random() * TOURNAMENT_LEVELS.length)];
  return { ...level, increment: 100, label: '' };
}

module.exports = { getBlindStructure };
