const { RANKS, SUITS, RANK_INDEX, DISPLAY_RANKS } = require('./cards');

function comboKey(card1, card2) {
  const r1 = RANK_INDEX[card1[0]], r2 = RANK_INDEX[card2[0]];
  if (r1 > r2) return card1 + card2;
  if (r1 < r2) return card2 + card1;
  return card1[1] <= card2[1] ? card1 + card2 : card2 + card1;
}

function pairCombos(rank) {
  const combos = [];
  for (let i = 0; i < SUITS.length; i++) {
    for (let j = i + 1; j < SUITS.length; j++) {
      combos.push(rank + SUITS[i] + rank + SUITS[j]);
    }
  }
  return combos;
}

function suitedCombos(high, low) {
  return SUITS.map(s => high + s + low + s);
}

function offsuitCombos(high, low) {
  const combos = [];
  for (const s1 of SUITS) {
    for (const s2 of SUITS) {
      if (s1 !== s2) combos.push(high + s1 + low + s2);
    }
  }
  return combos;
}

function allCombosForRanks(high, low) {
  return [...suitedCombos(high, low), ...offsuitCombos(high, low)];
}

function canonicalHand(key) {
  const r1 = key[0], s1 = key[1], r2 = key[2], s2 = key[3];
  if (r1 === r2) return r1 + r2;
  return s1 === s2 ? r1 + r2 + 's' : r1 + r2 + 'o';
}

function normalizeRanks(r1, r2) {
  r1 = r1.toUpperCase();
  r2 = r2.toUpperCase();
  if (RANK_INDEX[r1] < RANK_INDEX[r2]) [r1, r2] = [r2, r1];
  return [r1, r2];
}

function parseToken(token) {
  token = token.trim();
  if (!token) return [];
  let m;

  m = token.match(/^([2-9TJQKA])([cdhs])([2-9TJQKA])([cdhs])$/i);
  if (m) {
    return [comboKey(m[1].toUpperCase() + m[2].toLowerCase(), m[3].toUpperCase() + m[4].toLowerCase())];
  }

  m = token.match(/^([2-9TJQKA])\1-([2-9TJQKA])\2$/i);
  if (m) {
    const lo = RANK_INDEX[m[1].toUpperCase()];
    const hi = RANK_INDEX[m[2].toUpperCase()];
    const result = [];
    for (let r = Math.min(lo, hi); r <= Math.max(lo, hi); r++) result.push(...pairCombos(RANKS[r]));
    return result;
  }

  m = token.match(/^([2-9TJQKA])\1\+$/i);
  if (m) {
    const lo = RANK_INDEX[m[1].toUpperCase()];
    const result = [];
    for (let r = lo; r < RANKS.length; r++) result.push(...pairCombos(RANKS[r]));
    return result;
  }

  m = token.match(/^([2-9TJQKA])\1$/i);
  if (m) return pairCombos(m[1].toUpperCase());

  m = token.match(/^([2-9TJQKA])([2-9TJQKA])s-([2-9TJQKA])([2-9TJQKA])s$/i);
  if (m) {
    const high = normalizeRanks(m[1], m[2])[0];
    const k1 = m[1].toUpperCase() === high ? m[2].toUpperCase() : m[1].toUpperCase();
    const k2 = m[3].toUpperCase() === high ? m[4].toUpperCase() : m[3].toUpperCase();
    const lo = Math.min(RANK_INDEX[k1], RANK_INDEX[k2]);
    const hi = Math.max(RANK_INDEX[k1], RANK_INDEX[k2]);
    const result = [];
    for (let r = lo; r <= hi; r++) result.push(...suitedCombos(high, RANKS[r]));
    return result;
  }

  m = token.match(/^([2-9TJQKA])([2-9TJQKA])s\+$/i);
  if (m) {
    const [high, low] = normalizeRanks(m[1], m[2]);
    const result = [];
    for (let r = RANK_INDEX[low]; r < RANK_INDEX[high]; r++) result.push(...suitedCombos(high, RANKS[r]));
    return result;
  }

  m = token.match(/^([2-9TJQKA])([2-9TJQKA])s$/i);
  if (m) {
    const [high, low] = normalizeRanks(m[1], m[2]);
    return suitedCombos(high, low);
  }

  m = token.match(/^([2-9TJQKA])([2-9TJQKA])o-([2-9TJQKA])([2-9TJQKA])o$/i);
  if (m) {
    const high = normalizeRanks(m[1], m[2])[0];
    const k1 = m[1].toUpperCase() === high ? m[2].toUpperCase() : m[1].toUpperCase();
    const k2 = m[3].toUpperCase() === high ? m[4].toUpperCase() : m[3].toUpperCase();
    const lo = Math.min(RANK_INDEX[k1], RANK_INDEX[k2]);
    const hi = Math.max(RANK_INDEX[k1], RANK_INDEX[k2]);
    const result = [];
    for (let r = lo; r <= hi; r++) result.push(...offsuitCombos(high, RANKS[r]));
    return result;
  }

  m = token.match(/^([2-9TJQKA])([2-9TJQKA])o\+$/i);
  if (m) {
    const [high, low] = normalizeRanks(m[1], m[2]);
    const result = [];
    for (let r = RANK_INDEX[low]; r < RANK_INDEX[high]; r++) result.push(...offsuitCombos(high, RANKS[r]));
    return result;
  }

  m = token.match(/^([2-9TJQKA])([2-9TJQKA])o$/i);
  if (m) {
    const [high, low] = normalizeRanks(m[1], m[2]);
    return offsuitCombos(high, low);
  }

  m = token.match(/^([2-9TJQKA])([2-9TJQKA])-([2-9TJQKA])([2-9TJQKA])$/i);
  if (m) {
    const r1a = m[1].toUpperCase(), r1b = m[2].toUpperCase();
    if (r1a === r1b) {
      const lo = RANK_INDEX[r1a];
      const hi = RANK_INDEX[m[3].toUpperCase()];
      const result = [];
      for (let r = Math.min(lo, hi); r <= Math.max(lo, hi); r++) result.push(...pairCombos(RANKS[r]));
      return result;
    }
    const high = normalizeRanks(r1a, r1b)[0];
    const k1 = r1a === high ? r1b : r1a;
    const k2 = m[3].toUpperCase() === high ? m[4].toUpperCase() : m[3].toUpperCase();
    const lo = Math.min(RANK_INDEX[k1], RANK_INDEX[k2]);
    const hi = Math.max(RANK_INDEX[k1], RANK_INDEX[k2]);
    const result = [];
    for (let r = lo; r <= hi; r++) result.push(...allCombosForRanks(high, RANKS[r]));
    return result;
  }

  m = token.match(/^([2-9TJQKA])([2-9TJQKA])\+$/i);
  if (m) {
    const r1 = m[1].toUpperCase(), r2 = m[2].toUpperCase();
    if (r1 === r2) {
      const lo = RANK_INDEX[r1];
      const result = [];
      for (let r = lo; r < RANKS.length; r++) result.push(...pairCombos(RANKS[r]));
      return result;
    }
    const [high, low] = normalizeRanks(r1, r2);
    const result = [];
    for (let r = RANK_INDEX[low]; r < RANK_INDEX[high]; r++) result.push(...allCombosForRanks(high, RANKS[r]));
    return result;
  }

  m = token.match(/^([2-9TJQKA])([2-9TJQKA])$/i);
  if (m) {
    const r1 = m[1].toUpperCase(), r2 = m[2].toUpperCase();
    if (r1 === r2) return pairCombos(r1);
    const [high, low] = normalizeRanks(r1, r2);
    return allCombosForRanks(high, low);
  }

  return [];
}

function parseRange(str) {
  const combos = new Set();
  for (const token of str.split(',')) {
    for (const combo of parseToken(token)) combos.add(combo);
  }
  return combos;
}

function applyBoardRemoval(combos, board) {
  if (!board || board.length === 0) return new Set(combos);
  const boardSet = new Set(board);
  const result = new Set();
  for (const combo of combos) {
    if (!boardSet.has(combo.substring(0, 2)) && !boardSet.has(combo.substring(2, 4))) {
      result.add(combo);
    }
  }
  return result;
}

function comboCount(combos, board) {
  return applyBoardRemoval(combos, board).size;
}

function gridData(combos, board) {
  const filtered = applyBoardRemoval(combos, board);
  const boardSet = new Set(board || []);

  const grid = [];
  for (let row = 0; row < 13; row++) {
    grid[row] = [];
    for (let col = 0; col < 13; col++) {
      const r1 = DISPLAY_RANKS[row], r2 = DISPLAY_RANKS[col];
      let handName, handCombos, type;

      if (row === col) {
        handName = r1 + r2;
        handCombos = pairCombos(r1);
        type = 'pair';
      } else if (row < col) {
        handName = r1 + r2 + 's';
        handCombos = suitedCombos(r1, r2);
        type = 'suited';
      } else {
        handName = r2 + r1 + 'o';
        handCombos = offsuitCombos(r2, r1);
        type = 'offsuit';
      }

      const available = handCombos.filter(c =>
        !boardSet.has(c.substring(0, 2)) && !boardSet.has(c.substring(2, 4))
      );

      grid[row][col] = {
        handName, type,
        inRange: available.filter(c => filtered.has(c)).length,
        available: available.length,
        total: handCombos.length,
      };
    }
  }
  return grid;
}

function rangeToString(combos) {
  const hands = new Map();
  for (const combo of combos) {
    const hand = canonicalHand(combo);
    if (!hands.has(hand)) hands.set(hand, 0);
    hands.set(hand, hands.get(hand) + 1);
  }

  const order = [];
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const r1 = DISPLAY_RANKS[row], r2 = DISPLAY_RANKS[col];
      if (row === col) order.push(r1 + r2);
      else if (row < col) order.push(r1 + r2 + 's');
      else order.push(r2 + r1 + 'o');
    }
  }

  const parts = [];
  for (const hand of order) {
    if (!hands.has(hand)) continue;
    const count = hands.get(hand);
    const type = hand.length === 2 ? 'pair' : hand[2] === 's' ? 'suited' : 'offsuit';
    const full = type === 'pair' ? 6 : type === 'suited' ? 4 : 12;
    if (count === full) {
      parts.push(hand);
    } else {
      parts.push(`${hand}(${count})`);
    }
  }
  return parts.join(',');
}

module.exports = {
  DISPLAY_RANKS, comboKey, pairCombos, suitedCombos, offsuitCombos,
  allCombosForRanks, canonicalHand, normalizeRanks,
  parseToken, parseRange, applyBoardRemoval, comboCount, gridData,
  rangeToString,
};
