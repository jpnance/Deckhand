const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['c', 'd', 'h', 's'];

const RANK_INDEX = {};
RANKS.forEach((r, i) => RANK_INDEX[r] = i);

const SUIT_SYMBOLS = { c: '♣', d: '♦', h: '♥', s: '♠' };

const DISPLAY_RANKS = [...RANKS].reverse();

function parseCard(str) {
  const s = str.trim();
  if (s.length !== 2) return null;
  const rank = s[0].toUpperCase();
  const suit = s[1].toLowerCase();
  if (!(rank in RANK_INDEX)) return null;
  if (!SUITS.includes(suit)) return null;
  return rank + suit;
}

function cardDisplay(cardStr) {
  return cardStr[0] + SUIT_SYMBOLS[cardStr[1]];
}

module.exports = { RANKS, SUITS, RANK_INDEX, SUIT_SYMBOLS, DISPLAY_RANKS, parseCard, cardDisplay };
