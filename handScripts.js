// Hand script generator based on IRC Poker Database tournament patterns
// Frequencies extracted from ~50k 6-max tournament hands

// Complete hand scripts (not per-player patterns)
// Each script describes a full hand arc
const HAND_SCRIPTS = [
  // === PREFLOP ONLY ===
  {
    name: 'steal_success',
    weight: 25,
    desc: 'Late position opens, everyone folds',
    script: {
      preflop: [
        { position: 'CO|BTN', action: 'raise' },
        { remaining: 'fold' }
      ]
    }
  },
  {
    name: 'steal_restealed',
    weight: 5,
    desc: 'Late position opens, blind 3-bets, opener folds',
    script: {
      preflop: [
        { position: 'CO|BTN', action: 'raise' },
        { position: 'SB|BB', action: '3bet' },
        { remaining: 'fold' }
      ]
    }
  },
  {
    name: 'open_called',
    weight: 15,
    desc: 'Open raise gets one caller',
    script: {
      preflop: [
        { position: 'UTG|MP|CO|BTN', action: 'raise' },
        { position: 'later|blind', action: 'call' },
        { remaining: 'fold' }
      ],
      flop: 'continue'  // will branch based on flop script
    }
  },
  {
    name: 'limp_pot',
    weight: 8,
    desc: 'One or more limpers, BB checks',
    script: {
      preflop: [
        { position: 'UTG|MP', action: 'call' },
        { remaining: 'fold|call' },
        { position: 'BB', action: 'check' }
      ],
      flop: 'continue'
    }
  },
  {
    name: 'walk',
    weight: 10,
    desc: 'Everyone folds to BB',
    script: {
      preflop: [
        { remaining: 'fold' }
      ]
    }
  },
  {
    name: '3bet_pot',
    weight: 4,
    desc: '3-bet called, see flop',
    script: {
      preflop: [
        { position: 'any', action: 'raise' },
        { position: 'later', action: '3bet' },
        { position: 'original', action: 'call' },
        { remaining: 'fold' }
      ],
      flop: 'continue'
    }
  },
  {
    name: 'all_in_preflop',
    weight: 3,
    desc: 'Someone shoves preflop',
    script: {
      preflop: [
        { position: 'any', action: 'raise|allin' },
        { position: 'any', action: 'allin|call_allin' },
        { remaining: 'fold' }
      ]
    }
  },
  
  // === FLOP SCRIPTS (applied when preflop leads to flop) ===
  {
    name: 'cbet_fold',
    weight: 20,
    desc: 'Raiser cbets, caller folds',
    script: {
      flop: [
        { position: 'raiser', action: 'bet' },
        { remaining: 'fold' }
      ]
    },
    isPostflop: true
  },
  {
    name: 'cbet_called',
    weight: 12,
    desc: 'Raiser cbets, gets called',
    script: {
      flop: [
        { position: 'raiser', action: 'bet' },
        { position: 'caller', action: 'call' }
      ],
      turn: 'continue'
    },
    isPostflop: true
  },
  {
    name: 'check_check_flop',
    weight: 10,
    desc: 'Both players check flop',
    script: {
      flop: [
        { position: 'oop', action: 'check' },
        { position: 'ip', action: 'check' }
      ],
      turn: 'continue'
    },
    isPostflop: true
  },
  {
    name: 'donk_bet',
    weight: 5,
    desc: 'OOP player leads into raiser',
    script: {
      flop: [
        { position: 'oop', action: 'bet' },
        { position: 'ip', action: 'fold|call' }
      ]
    },
    isPostflop: true
  },
  {
    name: 'check_raise',
    weight: 3,
    desc: 'Check-raise on flop',
    script: {
      flop: [
        { position: 'oop', action: 'check' },
        { position: 'ip', action: 'bet' },
        { position: 'oop', action: 'raise' },
        { position: 'ip', action: 'fold|call' }
      ]
    },
    isPostflop: true
  },
  
  // === TURN SCRIPTS ===
  {
    name: 'turn_barrel',
    weight: 10,
    desc: 'Flop bettor bets turn again',
    script: {
      turn: [
        { position: 'bettor', action: 'bet' },
        { position: 'caller', action: 'fold|call' }
      ]
    },
    isPostflop: true
  },
  {
    name: 'turn_check_check',
    weight: 8,
    desc: 'Both check turn',
    script: {
      turn: [
        { position: 'oop', action: 'check' },
        { position: 'ip', action: 'check' }
      ],
      river: 'continue'
    },
    isPostflop: true
  },
  {
    name: 'delayed_cbet',
    weight: 5,
    desc: 'Checked flop, bet turn',
    script: {
      turn: [
        { position: 'any', action: 'bet' },
        { position: 'other', action: 'fold|call' }
      ]
    },
    isPostflop: true
  },
  
  // === RIVER SCRIPTS ===
  {
    name: 'river_bet',
    weight: 8,
    desc: 'Bet on river',
    script: {
      river: [
        { position: 'any', action: 'bet' },
        { position: 'other', action: 'fold|call' }
      ]
    },
    isPostflop: true
  },
  {
    name: 'river_check_check',
    weight: 6,
    desc: 'Check down to showdown',
    script: {
      river: [
        { position: 'oop', action: 'check' },
        { position: 'ip', action: 'check' }
      ]
    },
    isPostflop: true
  }
];

// Legacy patterns for reference
const ACTION_PATTERNS = [
  // Preflop only
  { pattern: 'f', weight: 37019, desc: 'fold preflop' },
  { pattern: 'r', weight: 1797, desc: 'raise, win preflop' },
  { pattern: 'cf', weight: 511, desc: 'call, fold to raise' },
  { pattern: 'rf', weight: 75, desc: 'raise, fold to 3bet' },
  { pattern: 'A', weight: 358, desc: 'open shove' },
  { pattern: 'rA', weight: 822, desc: 'raise, then shove' },
  { pattern: 'cA', weight: 427, desc: 'call, then shove' },
  { pattern: 'rrA', weight: 51, desc: '3bet pot, shove' },
  { pattern: 'rcA', weight: 130, desc: '3bet pot, call shove' },
  
  // See flop, end on flop
  { pattern: 'c_kf', weight: 1142, desc: 'call pf, check-fold flop' },
  { pattern: 'c_f', weight: 980, desc: 'call pf, fold to cbet' },
  { pattern: 'c_b', weight: 1018, desc: 'call pf, bet flop (win)' },
  { pattern: 'k_kf', weight: 975, desc: 'BB check, check-fold flop' },
  { pattern: 'k_f', weight: 354, desc: 'BB check, fold to bet' },
  { pattern: 'r_b', weight: 444, desc: 'raise pf, cbet (win)' },
  { pattern: 'cc_kf', weight: 180, desc: 'overcall, check-fold flop' },
  { pattern: 'cc_f', weight: 167, desc: 'overcall, fold flop' },
  { pattern: 'r_kf', weight: 85, desc: 'raise pf, check-fold flop' },
  { pattern: 'r_f', weight: 102, desc: 'raise pf, fold to donk' },
  
  // Check it down
  { pattern: 'c_k_k_k', weight: 1032, desc: 'call pf, check all streets' },
  { pattern: 'k_k_k_k', weight: 631, desc: 'BB check all streets' },
  { pattern: '', weight: 1091, desc: 'walk (BB wins)' },
  { pattern: 'cc_k_k_k', weight: 55, desc: 'overcall, check down' },
  
  // Turn action
  { pattern: 'c_k_f', weight: 364, desc: 'call pf, x flop, fold turn' },
  { pattern: 'c_k_kf', weight: 314, desc: 'call pf, x flop, x-fold turn' },
  { pattern: 'c_k_b', weight: 355, desc: 'call pf, x flop, bet turn' },
  { pattern: 'k_k_kf', weight: 292, desc: 'BB x, x, x-fold turn' },
  { pattern: 'k_k_b', weight: 107, desc: 'BB delayed lead turn' },
  { pattern: 'r_k_k_k', weight: 89, desc: 'raise pf, check down' },
  { pattern: 'r_k_b', weight: 66, desc: 'raise pf, x flop, bet turn' },
  
  // River action  
  { pattern: 'c_k_k_b', weight: 290, desc: 'call pf, x x, bet river' },
  { pattern: 'k_k_k_b', weight: 104, desc: 'BB bet river' },
  { pattern: 'c_k_k_f', weight: 213, desc: 'call pf, x x, fold river' },
  { pattern: 'c_k_k_kf', weight: 149, desc: 'call pf, x x, x-fold river' },
  { pattern: 'k_k_k_kf', weight: 166, desc: 'BB x-fold river' },
  { pattern: 'k_k_k_f', weight: 82, desc: 'BB fold river' },
  
  // Multi-street betting
  { pattern: 'c_b_b', weight: 90, desc: 'call pf, bet flop+turn' },
  { pattern: 'c_b_k_k', weight: 88, desc: 'call pf, bet flop, x down' },
  { pattern: 'c_kc_kf', weight: 79, desc: 'call pf, x-call, x-fold' },
  { pattern: 'c_kc_k_k', weight: 61, desc: 'call pf, x-call, x down' },
  { pattern: 'c_k_b_b', weight: 51, desc: 'call pf, delayed barrel' },
  
  // All-in postflop
  { pattern: 'r_bA', weight: 248, desc: 'raise pf, cbet, shove turn' },
  { pattern: 'c_bA', weight: 207, desc: 'call pf, bet flop, shove' },
  { pattern: 'k_bA', weight: 74, desc: 'BB donk shove' },
  { pattern: 'c_b_bA', weight: 61, desc: 'call pf, triple barrel shove' },
  
  // Calling line
  { pattern: 'c_c_f', weight: 100, desc: 'call pf, call flop, fold turn' },
  { pattern: 'rc', weight: 93, desc: '3bet, call (see flop)' },
  { pattern: 'cc', weight: 79, desc: 'overcall pf' },
  { pattern: 'c_c', weight: 64, desc: 'call pf, call flop (win)' },
  { pattern: 'c_c_k_k', weight: 75, desc: 'call pf, call flop, x down' },
];

// Calculate total weight for probability
const TOTAL_WEIGHT = ACTION_PATTERNS.reduce((sum, p) => sum + p.weight, 0);

// Position names for 6-max
const POSITIONS_6MAX = ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'];

// Bet sizing helpers (as fraction of pot)
const SIZING = {
  open: { min: 2.0, max: 3.0 },      // 2-3x BB
  threebet: { min: 2.5, max: 3.5 },  // 2.5-3.5x open
  cbet: { min: 0.33, max: 0.75 },    // 33-75% pot
  turn: { min: 0.5, max: 1.0 },      // 50-100% pot
  river: { min: 0.5, max: 1.0 },     // 50-100% pot
};

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function roundBet(amount, bb) {
  // Round to nearest 0.5 BB (half big blind)
  const halfBB = bb / 2;
  return Math.round(amount / halfBB) * halfBB;
}

function selectWeightedPattern() {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const p of ACTION_PATTERNS) {
    roll -= p.weight;
    if (roll <= 0) return p;
  }
  return ACTION_PATTERNS[0];
}

function parseAction(actionStr) {
  // Parse action string like "c_kf" into structured format
  const streets = actionStr.split('_');
  return {
    preflop: streets[0] || '',
    flop: streets[1] || '',
    turn: streets[2] || '',
    river: streets[3] || '',
  };
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateHand(numPlayers = 6, bb = 100) {
  const sb = bb / 2;
  const positions = POSITIONS_6MAX.slice(0, numPlayers);
  const actions = [];
  let pot = sb + bb;
  let currentBet = bb;
  
  // Track player state
  const playerState = {};
  for (let i = 0; i < numPlayers; i++) {
    playerState[positions[i]] = {
      position: positions[i],
      stack: 50 * bb + Math.floor(Math.random() * 100 * bb),
      invested: 0,
      folded: false,
      allIn: false,
    };
  }
  
  // Post blinds
  playerState['SB'].invested = sb;
  playerState['BB'].invested = bb;
  actions.push({ position: 'SB', street: 'preflop', type: 'post', amount: sb });
  actions.push({ position: 'BB', street: 'preflop', type: 'post', amount: bb });
  
  // Select a preflop script
  const preflopScripts = HAND_SCRIPTS.filter(s => !s.isPostflop && s.script.preflop);
  const totalWeight = preflopScripts.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * totalWeight;
  let selectedScript = preflopScripts[0];
  for (const s of preflopScripts) {
    roll -= s.weight;
    if (roll <= 0) { selectedScript = s; break; }
  }
  
  // Preflop action order: UTG -> MP -> CO -> BTN -> SB -> BB
  const preflopOrder = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'].filter(p => positions.includes(p));
  
  // Determine opener position based on script
  let openerIdx = -1;
  let raiserPos = null;
  let callerPos = null;
  
  if (selectedScript.name === 'walk') {
    // Everyone folds to BB
    for (const pos of preflopOrder) {
      if (pos === 'BB') break;
      playerState[pos].folded = true;
      actions.push({ position: pos, street: 'preflop', type: 'fold' });
    }
  } else if (selectedScript.name === 'steal_success' || selectedScript.name === 'steal_restealed') {
    // Late position opens
    raiserPos = pickRandom(['CO', 'BTN'].filter(p => positions.includes(p)));
    
    // Everyone before raiser folds
    for (const pos of preflopOrder) {
      if (pos === raiserPos) break;
      playerState[pos].folded = true;
      actions.push({ position: pos, street: 'preflop', type: 'fold' });
    }
    
    // Raiser opens
    const raiseSize = roundBet(bb * randomBetween(2.2, 3.0), bb);
    pot += raiseSize - playerState[raiserPos].invested;
    playerState[raiserPos].invested = raiseSize;
    currentBet = raiseSize;
    actions.push({ position: raiserPos, street: 'preflop', type: 'raise', amount: raiseSize });
    
    if (selectedScript.name === 'steal_restealed') {
      // Blind 3-bets
      const threeBettor = pickRandom(['SB', 'BB']);
      const threeBetSize = roundBet(raiseSize * randomBetween(2.8, 3.5), bb);
      pot += threeBetSize - playerState[threeBettor].invested;
      playerState[threeBettor].invested = threeBetSize;
      currentBet = threeBetSize;
      actions.push({ position: threeBettor, street: 'preflop', type: 'raise', amount: threeBetSize });
      
      // Remaining players fold
      for (const pos of preflopOrder) {
        if (!playerState[pos].folded && pos !== threeBettor) {
          playerState[pos].folded = true;
          actions.push({ position: pos, street: 'preflop', type: 'fold' });
        }
      }
    } else {
      // Everyone else folds
      for (const pos of preflopOrder) {
        if (!playerState[pos].folded && pos !== raiserPos) {
          playerState[pos].folded = true;
          actions.push({ position: pos, street: 'preflop', type: 'fold' });
        }
      }
    }
  } else if (selectedScript.name === 'open_called' || selectedScript.name === '3bet_pot') {
    // Someone opens
    const possibleOpeners = ['UTG', 'MP', 'CO', 'BTN'].filter(p => positions.includes(p));
    raiserPos = pickRandom(possibleOpeners);
    const raiserIdx = preflopOrder.indexOf(raiserPos);
    
    // Everyone before raiser folds
    for (let i = 0; i < raiserIdx; i++) {
      playerState[preflopOrder[i]].folded = true;
      actions.push({ position: preflopOrder[i], street: 'preflop', type: 'fold' });
    }
    
    // Raiser opens
    const raiseSize = roundBet(bb * randomBetween(2.2, 3.0), bb);
    pot += raiseSize - playerState[raiserPos].invested;
    playerState[raiserPos].invested = raiseSize;
    currentBet = raiseSize;
    actions.push({ position: raiserPos, street: 'preflop', type: 'raise', amount: raiseSize });
    
    // Someone calls (or 3-bets)
    const possibleCallers = preflopOrder.filter((p, i) => i > raiserIdx && !playerState[p].folded);
    callerPos = pickRandom(possibleCallers);
    const callerIdx = preflopOrder.indexOf(callerPos);
    
    // Players between raiser and caller fold
    for (let i = raiserIdx + 1; i < callerIdx; i++) {
      playerState[preflopOrder[i]].folded = true;
      actions.push({ position: preflopOrder[i], street: 'preflop', type: 'fold' });
    }
    
    if (selectedScript.name === '3bet_pot') {
      // Caller 3-bets
      const threeBetSize = roundBet(raiseSize * randomBetween(2.8, 3.5), bb);
      pot += threeBetSize - playerState[callerPos].invested;
      playerState[callerPos].invested = threeBetSize;
      currentBet = threeBetSize;
      actions.push({ position: callerPos, street: 'preflop', type: 'raise', amount: threeBetSize });
      
      // Players after 3-bettor fold before action returns to original raiser
      for (let i = callerIdx + 1; i < preflopOrder.length; i++) {
        const pos = preflopOrder[i];
        if (!playerState[pos].folded) {
          playerState[pos].folded = true;
          actions.push({ position: pos, street: 'preflop', type: 'fold' });
        }
      }
      
      // Original raiser calls
      const callAmount = threeBetSize - playerState[raiserPos].invested;
      pot += callAmount;
      playerState[raiserPos].invested = threeBetSize;
      actions.push({ position: raiserPos, street: 'preflop', type: 'call', amount: callAmount });
    } else {
      // Caller calls
      const callAmount = raiseSize - playerState[callerPos].invested;
      pot += callAmount;
      playerState[callerPos].invested = raiseSize;
      actions.push({ position: callerPos, street: 'preflop', type: 'call', amount: callAmount });
    }
    
    // Remaining players fold
    for (let i = callerIdx + 1; i < preflopOrder.length; i++) {
      const pos = preflopOrder[i];
      if (!playerState[pos].folded) {
        playerState[pos].folded = true;
        actions.push({ position: pos, street: 'preflop', type: 'fold' });
      }
    }
  } else if (selectedScript.name === 'limp_pot') {
    // UTG or MP limps
    const limperPos = pickRandom(['UTG', 'MP'].filter(p => positions.includes(p)));
    const limperIdx = preflopOrder.indexOf(limperPos);
    
    // Players before limper fold
    for (let i = 0; i < limperIdx; i++) {
      playerState[preflopOrder[i]].folded = true;
      actions.push({ position: preflopOrder[i], street: 'preflop', type: 'fold' });
    }
    
    // Limper limps
    const callAmount = bb - playerState[limperPos].invested;
    pot += callAmount;
    playerState[limperPos].invested = bb;
    actions.push({ position: limperPos, street: 'preflop', type: 'call', amount: callAmount });
    callerPos = limperPos;
    
    // Others fold to blinds
    for (let i = limperIdx + 1; i < preflopOrder.indexOf('SB'); i++) {
      playerState[preflopOrder[i]].folded = true;
      actions.push({ position: preflopOrder[i], street: 'preflop', type: 'fold' });
    }
    
    // SB completes or folds
    if (Math.random() < 0.5) {
      const sbCall = bb - sb;
      pot += sbCall;
      playerState['SB'].invested = bb;
      actions.push({ position: 'SB', street: 'preflop', type: 'call', amount: sbCall });
    } else {
      playerState['SB'].folded = true;
      actions.push({ position: 'SB', street: 'preflop', type: 'fold' });
    }
    
    // BB checks
    actions.push({ position: 'BB', street: 'preflop', type: 'check' });
    raiserPos = 'BB';  // For postflop reference
  } else if (selectedScript.name === 'all_in_preflop') {
    // Short stack shoves
    const shoverPos = pickRandom(positions);
    const shoveIdx = preflopOrder.indexOf(shoverPos);
    
    // Players before shover fold
    for (let i = 0; i < shoveIdx; i++) {
      playerState[preflopOrder[i]].folded = true;
      actions.push({ position: preflopOrder[i], street: 'preflop', type: 'fold' });
    }
    
    // Shove
    const shoveAmount = Math.min(playerState[shoverPos].stack, 20 * bb); // Cap at 20bb for "short stack"
    pot += shoveAmount - playerState[shoverPos].invested;
    playerState[shoverPos].invested = shoveAmount;
    playerState[shoverPos].allIn = true;
    actions.push({ position: shoverPos, street: 'preflop', type: 'all-in', amount: shoveAmount });
    
    // One caller or everyone folds
    if (Math.random() < 0.4) {
      const possibleCallers = preflopOrder.filter((p, i) => i > shoveIdx && !playerState[p].folded);
      if (possibleCallers.length > 0) {
        const callerP = pickRandom(possibleCallers);
        const cIdx = preflopOrder.indexOf(callerP);
        
        // Players between fold
        for (let i = shoveIdx + 1; i < cIdx; i++) {
          playerState[preflopOrder[i]].folded = true;
          actions.push({ position: preflopOrder[i], street: 'preflop', type: 'fold' });
        }
        
        // Call the shove
        const callAmt = shoveAmount - playerState[callerP].invested;
        pot += callAmt;
        playerState[callerP].invested = shoveAmount;
        actions.push({ position: callerP, street: 'preflop', type: 'call', amount: callAmt });
        
        // Rest fold
        for (let i = cIdx + 1; i < preflopOrder.length; i++) {
          const pos = preflopOrder[i];
          if (!playerState[pos].folded) {
            playerState[pos].folded = true;
            actions.push({ position: pos, street: 'preflop', type: 'fold' });
          }
        }
      }
    } else {
      // Everyone folds
      for (let i = shoveIdx + 1; i < preflopOrder.length; i++) {
        const pos = preflopOrder[i];
        if (!playerState[pos].folded) {
          playerState[pos].folded = true;
          actions.push({ position: pos, street: 'preflop', type: 'fold' });
        }
      }
    }
  }
  
  // Count active players
  const activePlayers = Object.values(playerState).filter(p => !p.folded && !p.allIn);
  
  // Generate board and postflop action if applicable
  let board = null;
  if (activePlayers.length >= 2) {
    board = generateBoard();
    
    // Simple postflop: pick a postflop script and execute
    const handledScripts = ['cbet_fold', 'cbet_called', 'check_check_flop', 'donk_bet'];
    const flopScripts = HAND_SCRIPTS.filter(s => handledScripts.includes(s.name));
    const flopScript = pickRandom(flopScripts);
    
    // Postflop action order: SB -> BB -> UTG -> MP -> CO -> BTN
    const postflopOrder = ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'].filter(p => positions.includes(p));
    
    // Determine who's OOP vs IP (using postflop order)
    const remaining = postflopOrder.filter(p => !playerState[p].folded && !playerState[p].allIn);
    if (remaining.length >= 2) {
      const oopPos = remaining[0];
      const ipPos = remaining[remaining.length - 1];
      
      // Execute flop script
      // Find raiser's position in the remaining players
      const raiserIdx = remaining.indexOf(raiserPos);
      
      if (flopScript.name === 'cbet_fold' && raiserPos && !playerState[raiserPos].folded && raiserIdx >= 0) {
        // Players before raiser check
        for (let i = 0; i < raiserIdx; i++) {
          actions.push({ position: remaining[i], street: 'flop', type: 'check' });
        }
        
        // Raiser c-bets
        const betSize = roundBet(pot * randomBetween(0.33, 0.66), bb);
        actions.push({ position: raiserPos, street: 'flop', type: 'bet', amount: betSize });
        pot += betSize;
        
        // Players after raiser fold
        for (let i = raiserIdx + 1; i < remaining.length; i++) {
          playerState[remaining[i]].folded = true;
          actions.push({ position: remaining[i], street: 'flop', type: 'fold' });
        }
        
        // Players who checked now fold
        for (let i = 0; i < raiserIdx; i++) {
          playerState[remaining[i]].folded = true;
          actions.push({ position: remaining[i], street: 'flop', type: 'fold' });
        }
      } else if (flopScript.name === 'cbet_called' && raiserPos && !playerState[raiserPos].folded && raiserIdx >= 0) {
        // Players before raiser check
        for (let i = 0; i < raiserIdx; i++) {
          actions.push({ position: remaining[i], street: 'flop', type: 'check' });
        }
        
        // Raiser c-bets
        const betSize = roundBet(pot * randomBetween(0.33, 0.66), bb);
        actions.push({ position: raiserPos, street: 'flop', type: 'bet', amount: betSize });
        pot += betSize;
        
        // Players after raiser respond
        let callerP = null;
        for (let i = raiserIdx + 1; i < remaining.length; i++) {
          const pos = remaining[i];
          if (!callerP && Math.random() < 0.6) {
            actions.push({ position: pos, street: 'flop', type: 'call', amount: betSize });
            pot += betSize;
            callerP = pos;
          } else {
            playerState[pos].folded = true;
            actions.push({ position: pos, street: 'flop', type: 'fold' });
          }
        }
        
        // Players who checked now respond
        for (let i = 0; i < raiserIdx; i++) {
          const pos = remaining[i];
          if (!callerP && Math.random() < 0.6) {
            actions.push({ position: pos, street: 'flop', type: 'call', amount: betSize });
            pot += betSize;
            callerP = pos;
          } else {
            playerState[pos].folded = true;
            actions.push({ position: pos, street: 'flop', type: 'fold' });
          }
        }
        
        if (callerP) {
          
          // Turn action
          // Determine OOP/IP between raiser and caller for later streets
          const headsUpOop = postflopOrder.indexOf(raiserPos) < postflopOrder.indexOf(callerP) ? raiserPos : callerP;
          const headsUpIp = headsUpOop === raiserPos ? callerP : raiserPos;
          
          const turnRoll = Math.random();
          if (turnRoll < 0.4) {
            // Bet turn
            const turnBet = roundBet(pot * randomBetween(0.5, 0.75), bb);
            actions.push({ position: raiserPos, street: 'turn', type: 'bet', amount: turnBet });
            pot += turnBet;
            if (Math.random() < 0.5) {
              actions.push({ position: callerP, street: 'turn', type: 'call', amount: turnBet });
              pot += turnBet;
              
              // River action
              if (Math.random() < 0.6) {
                const riverBet = roundBet(pot * randomBetween(0.5, 1.0), bb);
                actions.push({ position: raiserPos, street: 'river', type: 'bet', amount: riverBet });
                pot += riverBet;
                if (Math.random() < 0.5) {
                  actions.push({ position: callerP, street: 'river', type: 'call', amount: riverBet });
                  pot += riverBet;
                } else {
                  playerState[callerP].folded = true;
                  actions.push({ position: callerP, street: 'river', type: 'fold' });
                }
              } else {
                actions.push({ position: headsUpOop, street: 'river', type: 'check' });
                actions.push({ position: headsUpIp, street: 'river', type: 'check' });
              }
            } else {
              playerState[callerP].folded = true;
              actions.push({ position: callerP, street: 'turn', type: 'fold' });
            }
          } else {
            // Check-check turn
            actions.push({ position: headsUpOop, street: 'turn', type: 'check' });
            actions.push({ position: headsUpIp, street: 'turn', type: 'check' });
            
            // River after check-check turn
            if (Math.random() < 0.5) {
              const riverBet = roundBet(pot * randomBetween(0.5, 0.75), bb);
              actions.push({ position: headsUpOop, street: 'river', type: 'bet', amount: riverBet });
              pot += riverBet;
              if (Math.random() < 0.5) {
                actions.push({ position: headsUpIp, street: 'river', type: 'call', amount: riverBet });
                pot += riverBet;
              } else {
                playerState[headsUpIp].folded = true;
                actions.push({ position: headsUpIp, street: 'river', type: 'fold' });
              }
            } else {
              actions.push({ position: headsUpOop, street: 'river', type: 'check' });
              actions.push({ position: headsUpIp, street: 'river', type: 'check' });
            }
          }
        }
      } else if (flopScript.name === 'check_check_flop') {
        // All players check the flop
        for (const pos of remaining) {
          actions.push({ position: pos, street: 'flop', type: 'check' });
        }
        
        // Get current remaining (non-folded) for turn
        const turnRemaining = remaining.filter(p => !playerState[p].folded);
        const turnOop = turnRemaining[0];
        const turnIp = turnRemaining[turnRemaining.length - 1];
        
        // Turn
        if (Math.random() < 0.5) {
          const turnBet = roundBet(pot * randomBetween(0.5, 0.75), bb);
          actions.push({ position: turnOop, street: 'turn', type: 'bet', amount: turnBet });
          pot += turnBet;
          
          // Others respond
          let turnCaller = null;
          for (const pos of turnRemaining) {
            if (pos === turnOop) continue;
            if (!turnCaller && Math.random() < 0.5) {
              actions.push({ position: pos, street: 'turn', type: 'call', amount: turnBet });
              pot += turnBet;
              turnCaller = pos;
            } else {
              playerState[pos].folded = true;
              actions.push({ position: pos, street: 'turn', type: 'fold' });
            }
          }
          
          if (turnCaller) {
            // River
            if (Math.random() < 0.6) {
              const riverBet = roundBet(pot * randomBetween(0.5, 1.0), bb);
              actions.push({ position: turnOop, street: 'river', type: 'bet', amount: riverBet });
              pot += riverBet;
              if (Math.random() < 0.5) {
                actions.push({ position: turnCaller, street: 'river', type: 'call', amount: riverBet });
                pot += riverBet;
              } else {
                playerState[turnCaller].folded = true;
                actions.push({ position: turnCaller, street: 'river', type: 'fold' });
              }
            } else {
              actions.push({ position: turnOop, street: 'river', type: 'check' });
              actions.push({ position: turnCaller, street: 'river', type: 'check' });
            }
          }
        } else {
          // All check turn
          for (const pos of turnRemaining) {
            actions.push({ position: pos, street: 'turn', type: 'check' });
          }
          
          // River
          if (Math.random() < 0.5) {
            const riverBet = roundBet(pot * randomBetween(0.5, 0.75), bb);
            actions.push({ position: turnOop, street: 'river', type: 'bet', amount: riverBet });
            pot += riverBet;
            
            let riverCaller = null;
            for (const pos of turnRemaining) {
              if (pos === turnOop) continue;
              if (!riverCaller && Math.random() < 0.5) {
                actions.push({ position: pos, street: 'river', type: 'call', amount: riverBet });
                pot += riverBet;
                riverCaller = pos;
              } else {
                playerState[pos].folded = true;
                actions.push({ position: pos, street: 'river', type: 'fold' });
              }
            }
          } else {
            // All check river - showdown
            for (const pos of turnRemaining) {
              actions.push({ position: pos, street: 'river', type: 'check' });
            }
          }
        }
      } else if (flopScript.name === 'donk_bet') {
        const betSize = roundBet(pot * randomBetween(0.33, 0.66), bb);
        actions.push({ position: oopPos, street: 'flop', type: 'bet', amount: betSize });
        pot += betSize;
        
        // All other players respond to the bet
        let callerPos = null;
        for (const pos of remaining) {
          if (pos === oopPos) continue;
          if (Math.random() < 0.4 && !callerPos) {
            actions.push({ position: pos, street: 'flop', type: 'call', amount: betSize });
            pot += betSize;
            callerPos = pos;
          } else {
            playerState[pos].folded = true;
            actions.push({ position: pos, street: 'flop', type: 'fold' });
          }
        }
        
        if (callerPos) {
          // Turn after donk called
          if (Math.random() < 0.5) {
            const turnBet = roundBet(pot * randomBetween(0.5, 0.75), bb);
            actions.push({ position: oopPos, street: 'turn', type: 'bet', amount: turnBet });
            pot += turnBet;
            if (Math.random() < 0.5) {
              actions.push({ position: callerPos, street: 'turn', type: 'call', amount: turnBet });
              pot += turnBet;
              
              // River
              if (Math.random() < 0.5) {
                const riverBet = roundBet(pot * randomBetween(0.5, 1.0), bb);
                actions.push({ position: oopPos, street: 'river', type: 'bet', amount: riverBet });
                pot += riverBet;
                if (Math.random() < 0.5) {
                  actions.push({ position: callerPos, street: 'river', type: 'call', amount: riverBet });
                  pot += riverBet;
                } else {
                  playerState[callerPos].folded = true;
                  actions.push({ position: callerPos, street: 'river', type: 'fold' });
                }
              } else {
                actions.push({ position: oopPos, street: 'river', type: 'check' });
                actions.push({ position: callerPos, street: 'river', type: 'check' });
              }
            } else {
              playerState[callerPos].folded = true;
              actions.push({ position: callerPos, street: 'turn', type: 'fold' });
            }
          } else {
            actions.push({ position: oopPos, street: 'turn', type: 'check' });
            actions.push({ position: callerPos, street: 'turn', type: 'check' });
            
            // River after check-check
            actions.push({ position: oopPos, street: 'river', type: 'check' });
            actions.push({ position: callerPos, street: 'river', type: 'check' });
          }
        }
      } else {
        // Fallback: check around on flop, then some turn/river action
        for (const pos of remaining) {
          actions.push({ position: pos, street: 'flop', type: 'check' });
        }
        
        // Simple turn action
        if (remaining.length >= 2) {
          const turnOop = remaining[0];
          const turnIp = remaining[remaining.length - 1];
          
          if (Math.random() < 0.5) {
            const turnBet = roundBet(pot * randomBetween(0.5, 0.75), bb);
            actions.push({ position: turnOop, street: 'turn', type: 'bet', amount: turnBet });
            pot += turnBet;
            if (Math.random() < 0.5) {
              actions.push({ position: turnIp, street: 'turn', type: 'call', amount: turnBet });
              pot += turnBet;
              // River
              actions.push({ position: turnOop, street: 'river', type: 'check' });
              actions.push({ position: turnIp, street: 'river', type: 'check' });
            } else {
              playerState[turnIp].folded = true;
              actions.push({ position: turnIp, street: 'turn', type: 'fold' });
            }
          } else {
            actions.push({ position: turnOop, street: 'turn', type: 'check' });
            actions.push({ position: turnIp, street: 'turn', type: 'check' });
            // River
            actions.push({ position: turnOop, street: 'river', type: 'check' });
            actions.push({ position: turnIp, street: 'river', type: 'check' });
          }
        }
      }
    }
  }
  
  return {
    script: selectedScript.name,
    actions,
    pot,
    board,
    bb,
    playerState,
  };
}

function generateBoard() {
  const suits = ['h', 'd', 'c', 's'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const deck = [];
  
  for (const r of ranks) {
    for (const s of suits) {
      deck.push(r + s);
    }
  }
  
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return {
    flop: [deck[0], deck[1], deck[2]],
    turn: deck[3],
    river: deck[4],
  };
}

// Export for use in trainer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateHand, ACTION_PATTERNS, POSITIONS_6MAX };
}
