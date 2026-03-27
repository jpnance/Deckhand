const readline = require('readline');
const { generateScenario, roundUp, pickRandom } = require('./pot');
const { potOddsFromCall } = require('./potOdds');

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const EQUITY_BUCKETS = [17, 20, 25, 30, 33, 40];

const SIZING_OPTIONS = [
  { equity: 17, label: '1/4', fraction: 1/4 },
  { equity: 20, label: '1/3', fraction: 1/3 },
  { equity: 25, label: '1/2', fraction: 1/2 },
  { equity: 30, label: '2/3', fraction: 2/3 },
  { equity: 33, label: 'pot', fraction: 1 },
];

function formatAmount(amount, label) {
  if (label === '$') return `${c.bold}${c.green}$${amount}${c.reset}`;
  return `${c.bold}${c.green}${amount.toLocaleString()}${c.reset}`;
}

function closestBucket(value) {
  let best = EQUITY_BUCKETS[0];
  let bestDiff = Math.abs(value - best);
  for (const b of EQUITY_BUCKETS) {
    const diff = Math.abs(value - b);
    if (diff < bestDiff) {
      best = b;
      bestDiff = diff;
    }
  }
  return best;
}

function parseNumber(input) {
  const s = input.trim().replace(/^\$/, '').replace(/%$/, '').replace(/,/g, '');
  const hasK = /k$/i.test(s);
  const n = parseFloat(s.replace(/k$/i, ''));
  if (isNaN(n)) return null;
  return hasK ? n * 1000 : n;
}

function parseBucket(input) {
  const n = parseInt(input.trim().replace(/[%+]/g, ''));
  if (isNaN(n)) return null;
  if (n >= 37) return 40;
  if ([17, 20, 25, 30, 33].includes(n)) return n;
  return null;
}

function parseSizing(input) {
  const s = input.trim().toLowerCase();
  const map = {
    '1/4': '1/4', 'quarter': '1/4', 'q': '1/4',
    '1/3': '1/3', 'third': '1/3',
    '1/2': '1/2', 'half': '1/2', 'h': '1/2',
    '2/3': '2/3',
    'pot': 'pot', 'full': 'pot', 'p': 'pot',
  };
  return map[s] || null;
}

function isQuit(raw) {
  if (raw === null) return true;
  const s = raw.trim().toLowerCase();
  return s === 'quit' || s === 'exit';
}

function ask(rl, text) {
  return new Promise((resolve) => {
    const onClose = () => resolve(null);
    rl.once('close', onClose);
    rl.question(text, (answer) => {
      rl.removeListener('close', onClose);
      resolve(answer);
    });
  });
}

async function runQuestion(rl, mode) {
  const scenario = generateScenario(mode);
  const { pot, bet, street, increment, label } = scenario;
  const type = pickRandom(['bucketEquity', 'sizing', 'betAmount']);

  console.log('');

  if (type === 'bucketEquity') {
    const exact = potOddsFromCall(pot, bet);
    const correctBucket = closestBucket(exact.equity);
    console.log(`${c.yellow}${street}${c.reset} | Pot: ${formatAmount(pot + bet, label)} | Bet: ${formatAmount(bet, label)}`);
    const raw = await ask(rl, `${c.cyan}Equity?${c.reset} %> `);
    if (isQuit(raw)) return null;
    const answer = parseBucket(raw);
    const correct = answer === correctBucket;
    const exactStr = `${exact.equity.toFixed(1)}%`;

    if (correct) {
      console.log(`${c.green}✓${c.reset} ${c.dim}(${exactStr})${c.reset}`);
    } else {
      const correctLabel = correctBucket === 40 ? '40+' : String(correctBucket);
      console.log(`${c.red}✗${c.reset} ${correctLabel} ${c.dim}(${exactStr})${c.reset}`);
    }
    return correct;
  }

  const target = pickRandom(SIZING_OPTIONS);
  const rawBet = pot * target.fraction;
  const betAmount = roundUp(rawBet, increment);

  if (type === 'sizing') {
    console.log(`${c.yellow}${street}${c.reset} | Pot: ${formatAmount(pot, label)}`);
    const raw = await ask(rl, `${c.cyan}Sizing for ~${target.equity}%?${c.reset} /> `);
    if (isQuit(raw)) return null;
    const answer = parseSizing(raw);
    const correct = answer === target.label;

    const sizingStr = target.label === 'pot' ? 'pot' : `${target.label} pot`;
    if (correct) {
      console.log(`${c.green}✓${c.reset} ${c.dim}(${sizingStr} = ${formatAmount(betAmount, label)})${c.reset}`);
    } else {
      console.log(`${c.red}✗${c.reset} ${sizingStr} ${c.dim}(${formatAmount(betAmount, label)})${c.reset}`);
    }
    return correct;
  }

  const sizingStr = target.label === 'pot' ? 'pot' : `${target.label} pot`;
  console.log(`${c.yellow}${street}${c.reset} | Pot: ${formatAmount(pot, label)}`);
  const raw = await ask(rl, `${c.cyan}Bet for ~${target.equity}%?${c.reset} $> `);
  if (isQuit(raw)) return null;
  const answer = parseNumber(raw);
  const betTolerance = Math.max(rawBet * 0.05, increment);
  const correct = answer !== null && Math.abs(answer - rawBet) <= betTolerance;

  if (correct) {
    console.log(`${c.green}✓${c.reset} ${c.dim}(${sizingStr} = ${formatAmount(betAmount, label)})${c.reset}`);
  } else {
    console.log(`${c.red}✗${c.reset} ${sizingStr} ${c.dim}(${formatAmount(betAmount, label)})${c.reset}`);
  }
  return correct;
}

async function startQuiz() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`\n${c.bold}${c.cyan}Pot Odds Trainer${c.reset}`);
  console.log(`${c.dim}================${c.reset}`);

  const modeInput = await ask(rl, `${c.yellow}(c)ash, (t)ournament, or (r)andom?${c.reset} > `);
  if (isQuit(modeInput)) {
    console.log('');
    rl.close();
    return;
  }
  const modeChar = modeInput.trim().toLowerCase()[0];
  const fixedMode = modeChar === 'c' ? 'cash' : modeChar === 't' ? 'tournament' : null;

  const modeLabels = { cash: '$1/$2 Cash Game', tournament: 'Tournament' };
  if (fixedMode) {
    console.log(`\n${c.bold}${modeLabels[fixedMode]}${c.reset}`);
  } else {
    console.log(`\n${c.bold}Random (Cash / Tournament)${c.reset}`);
  }
  console.log(`${c.dim}Equity buckets:  17  20  25  30  33  40+${c.reset}`);
  console.log(`${c.dim}Bet sizings:     1/4  1/3  1/2  2/3  pot${c.reset}`);
  console.log(`${c.dim}Type "quit" or "exit" to stop.${c.reset}`);

  let correct = 0;
  let total = 0;

  for (;;) {
    const mode = fixedMode || pickRandom(['cash', 'tournament']);
    const r = await runQuestion(rl, mode);
    if (r === null) break;
    if (r) correct++;
    total++;
  }

  if (total > 0) {
    const pct = Math.round((correct / total) * 100);
    console.log(`\n${c.bold}Final: ${correct}/${total} (${pct}%)${c.reset}`);
  }
  console.log(`${c.dim}Thanks for practicing!${c.reset}\n`);
  rl.close();
}

module.exports = { startQuiz };
