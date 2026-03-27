function potOddsFromCall(pot, bet) {
  const ratio = (pot + bet) / bet;
  const equity = (bet / (pot + 2 * bet)) * 100;
  return { ratio, equity };
}

function betForOdds(pot, ratio) {
  return pot / (ratio - 1);
}

function betForEquity(pot, equityPct) {
  const eq = equityPct / 100;
  return (eq * pot) / (1 - 2 * eq);
}

function betForFraction(pot, fraction) {
  return pot * fraction;
}

module.exports = { potOddsFromCall, betForOdds, betForEquity, betForFraction };
