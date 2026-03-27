const readline = require('readline');
const { SCENARIOS, SCENARIO_KEYS, HANDS } = require('./preflopData');

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const HAND_LIST = Object.keys(HANDS);

const POSITIONS_9MAX = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

const ACTION_LABELS = {
  f: 'fold',
  c: 'call',
  r: 'raise',
  '3': '3-bet',
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatHand(hand) {
  const ranks = hand.replace(/[so]/g, '');
  const suit = hand.includes('s') ? 's' : hand.includes('o') ? 'o' : '';
  
  const suitSymbols = ['♠', '♥', '♦', '♣'];
  
  if (ranks.length === 2 && ranks[0] === ranks[1]) {
    const s1 = pickRandom(suitSymbols);
    let s2 = pickRandom(suitSymbols);
    while (s2 === s1) s2 = pickRandom(suitSymbols);
    return `${c.bold}${ranks[0]}${s1} ${ranks[1]}${s2}${c.reset}`;
  }
  
  if (suit === 's') {
    const s = pickRandom(suitSymbols);
    return `${c.bold}${ranks[0]}${s} ${ranks[1]}${s}${c.reset}`;
  }
  
  const s1 = pickRandom(suitSymbols);
  let s2 = pickRandom(suitSymbols);
  while (s2 === s1) s2 = pickRandom(suitSymbols);
  return `${c.bold}${ranks[0]}${s1} ${ranks[1]}${s2}${c.reset}`;
}

function getYourPositionIndex(scenarioKey) {
  const pos = SCENARIOS[scenarioKey].position;
  const situation = SCENARIOS[scenarioKey].situation;
  
  switch (pos) {
    case 'EP':
      if (situation === 'vs_weak' || situation === 'vs_strong') {
        return pickRandom([1, 2, 3]);
      }
      return 0;
    case 'CO': return 5;
    case 'BTN': return 6;
    case 'SB': return 7;
    case 'BB': return 8;
    default: return 0;
  }
}

function getRaiserPosition(yourPosIndex, situation) {
  if (situation === 'vs_steal') {
    return pickRandom([5, 6]);
  }
  if (situation === 'vs_weak' || situation === 'vs_strong') {
    const earlier = [];
    for (let i = 0; i < yourPosIndex; i++) earlier.push(i);
    if (earlier.length === 0) earlier.push(0);
    return pickRandom(earlier);
  }
  return -1;
}

function renderTable(scenarioKey, hand) {
  const scenario = SCENARIOS[scenarioKey];
  const yourPosIndex = getYourPositionIndex(scenarioKey);
  const situation = scenario.situation;
  
  let raiserIndex = -1;
  let limperIndices = [];
  
  if (situation === 'vs_weak' || situation === 'vs_strong' || situation === 'vs_steal') {
    raiserIndex = getRaiserPosition(yourPosIndex, situation);
  } else if (situation === 'limped') {
    for (let i = 0; i < yourPosIndex; i++) {
      if (Math.random() < 0.5 || limperIndices.length === 0) {
        limperIndices.push(i);
      }
    }
    if (limperIndices.length === 0 && yourPosIndex > 0) {
      limperIndices.push(yourPosIndex - 1);
    }
  }
  
  const colWidth = 6;
  
  function pad(text) {
    return text.padEnd(colWidth);
  }
  
  const posLine = POSITIONS_9MAX.map((pos, i) => {
    const padded = pad(pos);
    if (i === yourPosIndex) return `${c.cyan}${padded}${c.reset}`;
    return `${c.dim}${padded}${c.reset}`;
  }).join(' ');
  
  const actionLine = POSITIONS_9MAX.map((pos, i) => {
    let action;
    if (i === yourPosIndex) {
      action = '?';
    } else if (i > yourPosIndex) {
      action = '-';
    } else     if (raiserIndex >= 0) {
      action = (i === raiserIndex) ? 'raise' : 'fold';
    } else if (limperIndices.length > 0) {
      action = limperIndices.includes(i) ? 'call' : 'fold';
    } else {
      action = 'fold';
    }
    
    const padded = pad(action);
    
    if (i === yourPosIndex) return `${c.yellow}${padded}${c.reset}`;
    if (i > yourPosIndex) return `${c.dim}${padded}${c.reset}`;
    if (raiserIndex >= 0 && i === raiserIndex) return `${c.magenta}${padded}${c.reset}`;
    if (action === 'call') return `${c.green}${padded}${c.reset}`;
    return `${c.dim}${padded}${c.reset}`;
  }).join(' ');

  const lineWidth = colWidth * 9 + 8;
  console.log('');
  console.log(`${c.dim}${'═'.repeat(lineWidth)}${c.reset}`);
  console.log(posLine);
  console.log(actionLine);
  console.log(`${c.dim}${'═'.repeat(lineWidth)}${c.reset}`);
  
  let villainRead = '';
  if (situation === 'vs_weak') {
    villainRead = `${c.dim}(${POSITIONS_9MAX[raiserIndex]} is loose/doesn't limp)${c.reset}`;
  } else if (situation === 'vs_strong') {
    villainRead = `${c.dim}(${POSITIONS_9MAX[raiserIndex]} is tight/sometimes limps)${c.reset}`;
  } else if (situation === 'vs_steal') {
    villainRead = `${c.dim}(${POSITIONS_9MAX[raiserIndex]} steal attempt)${c.reset}`;
  }
  
  console.log(`\nYour hand: ${formatHand(hand)}  ${villainRead}`);
}

function getPromptForScenario(scenarioKey) {
  const scenario = SCENARIOS[scenarioKey];
  const actions = scenario.actions;
  const isBBLimpedPot = scenarioKey === 'BB:LP';
  
  const options = [];
  if (actions.includes('f')) options.push('(f)old');
  if (actions.includes('c')) options.push(isBBLimpedPot ? '(c)heck' : '(c)all');
  if (actions.includes('r')) options.push('(r)aise');
  if (actions.includes('3')) options.push('(3)-bet');
  
  return options.join(', ') + '?';
}

function parseAnswer(input, validActions) {
  const s = input.trim().toLowerCase();
  if (s === '' || s === 'f' || s === 'fold') return validActions.includes('f') ? 'f' : null;
  if (s === 'c' || s === 'call' || s === 'check') return validActions.includes('c') ? 'c' : null;
  if (s === 'r' || s === 'raise') return validActions.includes('r') ? 'r' : null;
  if (s === '3' || s === '3bet' || s === '3-bet') return validActions.includes('3') ? '3' : null;
  return null;
}

function isQuit(raw) {
  if (raw === null) return true;
  const s = raw.trim().toLowerCase();
  return s === 'quit' || s === 'exit' || s === 'q';
}

function ask(rl, text) {
  return new Promise((resolve) => {
    if (rl.closed) {
      resolve(null);
      return;
    }
    const onClose = () => resolve(null);
    rl.once('close', onClose);
    rl.question(text, (answer) => {
      rl.removeListener('close', onClose);
      resolve(answer);
    });
  });
}

async function runQuestion(rl) {
  const hand = pickRandom(HAND_LIST);
  const scenarioKey = pickRandom(SCENARIO_KEYS);
  const correctAction = HANDS[hand][scenarioKey];
  const scenario = SCENARIOS[scenarioKey];
  
  renderTable(scenarioKey, hand);
  
  const prompt = getPromptForScenario(scenarioKey);
  
  let answer = null;
  while (answer === null) {
    const raw = await ask(rl, `${c.cyan}${prompt}${c.reset} > `);
    if (isQuit(raw)) return null;
    answer = parseAnswer(raw, scenario.actions);
    if (answer === null) {
      console.log(`${c.dim}Invalid input. ${prompt}${c.reset}`);
    }
  }
  
  const correct = answer === correctAction;
  const isBBLimpedPot = scenarioKey === 'BB:LP';
  let actionLabel = ACTION_LABELS[correctAction];
  if (isBBLimpedPot && correctAction === 'c') actionLabel = 'check';
  
  if (correct) {
    console.log(`${c.green}✓${c.reset} ${c.dim}(${actionLabel})${c.reset}`);
  } else {
    console.log(`${c.red}✗${c.reset} ${actionLabel}`);
  }
  
  return { scenarioKey, correct, hand, answered: answer, expected: correctAction };
}

const SCENARIO_LABELS = {
  'EP:O':    'EP open',
  'EP:vWR':  'EP vs weak',
  'EP:vSR':  'EP vs strong',
  'CO:O':    'CO open',
  'CO:vWR':  'CO vs weak',
  'CO:vSR':  'CO vs strong',
  'BTN:O':   'BTN open',
  'BTN:vWR': 'BTN vs weak',
  'BTN:vSR': 'BTN vs strong',
  'SB:LP':   'SB limped',
  'B:vS':    'Blinds vs steal',
  'B:vWR':   'Blinds vs weak',
  'B:vSR':   'Blinds vs strong',
  'BB:LP':   'BB limped',
};

const SCENARIO_ORDER = [
  'EP:O', 'EP:vWR', 'EP:vSR',
  'CO:O', 'CO:vWR', 'CO:vSR',
  'BTN:O', 'BTN:vWR', 'BTN:vSR',
  'SB:LP',
  'B:vS', 'B:vWR', 'B:vSR', 'BB:LP',
];

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

function getActionColor(action) {
  switch (action) {
    case 'r': case '3': return c.magenta;
    case 'c': return c.green;
    case 'f': return c.dim;
    default: return c.reset;
  }
}

function printGrid(scenarioKey) {
  console.log(`\n${c.bold}${SCENARIO_LABELS[scenarioKey]}${c.reset}:`);
  
  for (let row = 0; row < 13; row++) {
    let line = '';
    for (let col = 0; col < 13; col++) {
      let hand;
      if (row === col) {
        hand = RANKS[row] + RANKS[col];
      } else if (row < col) {
        hand = RANKS[row] + RANKS[col] + 's';
      } else {
        hand = RANKS[col] + RANKS[row] + 'o';
      }
      
      const action = HANDS[hand]?.[scenarioKey] || 'f';
      const color = getActionColor(action);
      line += `${color}${hand.padEnd(4)}${c.reset}`;
    }
    console.log(line);
  }
}

async function startPreflopQuiz() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const sessionLimit = 100;

  console.log(`\n${c.bold}${c.cyan}Preflop Trainer${c.reset}`);
  console.log(`${c.dim}===============${c.reset}`);
  console.log(`${c.dim}Based on Ed Miller's "The Course"${c.reset}`);
  console.log(`${c.dim}${sessionLimit} hands per session. Type "q" to end and review.${c.reset}`);

  let correct = 0;
  let total = 0;
  const stats = {};
  const mistakes = [];
  for (const key of SCENARIO_KEYS) {
    stats[key] = { correct: 0, total: 0 };
  }

  while (total < sessionLimit) {
    const r = await runQuestion(rl);
    if (r === null) break;
    
    stats[r.scenarioKey].total++;
    if (r.correct) {
      stats[r.scenarioKey].correct++;
      correct++;
    } else {
      mistakes.push(r);
    }
    total++;
  }

  if (total > 0) {
    const pct = Math.round((correct / total) * 100);
    console.log(`\n${c.bold}Final: ${correct}/${total} (${pct}%)${c.reset}`);
    
    const printMistakes = (highlightScenario = null) => {
      if (mistakes.length > 0) {
        console.log(`\n${c.bold}Mistakes:${c.reset}`);
        const maxScenarioLen = Math.max(...Object.values(SCENARIO_LABELS).map(l => l.length));
        for (const m of mistakes) {
          const isHighlighted = highlightScenario && m.scenarioKey === highlightScenario;
          const scenario = SCENARIO_LABELS[m.scenarioKey].padEnd(maxScenarioLen + 2);
          const you = ACTION_LABELS[m.answered].padEnd(5);
          const correctAction = ACTION_LABELS[m.expected];
          const handColor = isHighlighted ? c.cyan : c.dim;
          console.log(`${handColor}${m.hand.padEnd(5)}${c.dim}${scenario}${you} → ${c.reset}${correctAction}`);
        }
      }
    };
    
    const printScenarioList = () => {
      console.log(`\n${c.bold}Scenarios:${c.reset}`);
      const maxLabelLen = Math.max(...SCENARIO_ORDER.map(k => SCENARIO_LABELS[k].length));
      
      for (let i = 0; i < SCENARIO_ORDER.length; i++) {
        const key = SCENARIO_ORDER[i];
        const label = SCENARIO_LABELS[key].padEnd(maxLabelLen);
        const s = stats[key];
        
        let statStr = '';
        let color = c.dim;
        if (s.total > 0) {
          const pct = Math.round((s.correct / s.total) * 100);
          const ratio = `${s.correct}/${s.total}`.padStart(5);
          const pctStr = `(${pct}%)`.padStart(6);
          if (pct < 50) color = c.red;
          else if (pct < 75) color = c.yellow;
          else color = c.green;
          statStr = `${ratio}  ${color}${pctStr}${c.reset}`;
        }
        
        console.log(`${c.dim}${String(i + 1).padStart(2)}.${c.reset} ${label}  ${statStr}`);
      }
    };
    
    printMistakes();
    printScenarioList();
    console.log(`${c.dim}\nEnter a number to see a grid, or press enter to finish.${c.reset}`);
    
    for (;;) {
      const input = await ask(rl, `${c.cyan}Grid?${c.reset} > `);
      if (input === null || input.trim() === '') break;
      
      const num = parseInt(input.trim(), 10);
      if (num >= 1 && num <= SCENARIO_ORDER.length) {
        const selectedScenario = SCENARIO_ORDER[num - 1];
        printGrid(selectedScenario);
        printMistakes(selectedScenario);
        printScenarioList();
      } else {
        console.log(`${c.dim}Enter 1-${SCENARIO_ORDER.length} or press enter to finish.${c.reset}`);
      }
    }
  }
  console.log(`\n${c.dim}Thanks for practicing!${c.reset}\n`);
  rl.close();
}

module.exports = { startPreflopQuiz };
