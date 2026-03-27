const readline = require('readline');
const { parseCard, cardDisplay } = require('./cards');
const { parseRange, applyBoardRemoval, comboCount, gridData, rangeToString, DISPLAY_RANKS } = require('./range');

const style = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function createLineReader(rl) {
  const queue = [];
  let waiting = null;
  let closed = false;

  rl.on('line', (line) => {
    if (waiting) {
      const resolve = waiting;
      waiting = null;
      resolve(line);
    } else {
      queue.push(line);
    }
  });

  rl.on('close', () => {
    closed = true;
    if (waiting) {
      const resolve = waiting;
      waiting = null;
      resolve(null);
    }
  });

  return function nextLine(prompt) {
    if (queue.length > 0) {
      return Promise.resolve(queue.shift());
    }
    if (closed) return Promise.resolve(null);
    process.stdout.write(prompt);
    return new Promise((resolve) => { waiting = resolve; });
  };
}

function formatCards(cards) {
  if (cards.length === 0) return `${style.dim}(none)${style.reset}`;
  return cards.map(cardDisplay).join(' ');
}

function allDeadCards(board, known) {
  return [...board, ...known];
}

function totalPossible(dead) {
  const n = 52 - (dead ? dead.length : 0);
  return (n * (n - 1)) / 2;
}

function boardAtPosition(transcript, pos) {
  let board = [];
  for (let i = 0; i <= pos && i < transcript.length; i++) {
    const e = transcript[i];
    if (e.type === 'flop') board = [...e.cards];
    else if (e.type === 'turn' || e.type === 'river') board.push(e.cards[0]);
  }
  return board;
}

function currentBoard(transcript) {
  if (transcript.length === 0) return [];
  return boardAtPosition(transcript, transcript.length - 1);
}

function rangeAtPosition(transcript, pos) {
  let range = new Set();
  for (let i = 0; i <= pos && i < transcript.length; i++) {
    const e = transcript[i];
    if (e.type !== 'range' || !e.spec) continue;
    const parsed = parseRange(e.spec);
    switch (e.op) {
      case 'set': range = new Set(parsed); break;
      case 'remove': for (const c of parsed) range.delete(c); break;
      case 'add': for (const c of parsed) range.add(c); break;
    }
  }
  return range;
}

function currentRangeState(transcript) {
  if (transcript.length === 0) return new Set();
  return rangeAtPosition(transcript, transcript.length - 1);
}

function findPrevRangeIdx(transcript, before) {
  for (let j = before - 1; j >= 0; j--) {
    if (transcript[j].type === 'range') return j;
  }
  return -1;
}

function formatRangeEntry(transcript, known, idx) {
  const entry = transcript[idx];
  const board = boardAtPosition(transcript, idx);
  const dead = allDeadCards(board, known);
  const range = rangeAtPosition(transcript, idx);
  const count = comboCount(range, dead);

  let deltaStr = '';
  const prevIdx = findPrevRangeIdx(transcript, idx);
  if (prevIdx >= 0) {
    const prevRange = rangeAtPosition(transcript, prevIdx);
    const prevCount = comboCount(prevRange, dead);
    const diff = count - prevCount;
    const pct = prevCount > 0 ? ((count / prevCount) * 100).toFixed(1) : '—';
    deltaStr = ` ${style.dim}(${diff >= 0 ? '+' : ''}${diff}, ${pct}%)${style.reset}`;
  }

  const opLabel = entry.op === 'set' ? 'range' : entry.op;
  const filtered = applyBoardRemoval(range, dead);
  const rangeStr = rangeToString(filtered);

  let line;
  if (entry.spec) {
    line = `  ${style.cyan}►${style.reset} ${opLabel} ${entry.spec}  ${style.bold}${count} combos${style.reset}${deltaStr}`;
  } else {
    line = `  ${style.cyan}►${style.reset} ${style.dim}(no change)${style.reset}  ${style.bold}${count} combos${style.reset}${deltaStr}`;
  }

  if (rangeStr) {
    line += `\n    ${style.dim}= ${rangeStr}${style.reset}`;
  }
  return line;
}

function displaySummary(transcript, known) {
  console.log('');
  if (known.length > 0) {
    console.log(`  ${style.bold}Known:${style.reset} ${formatCards(known)}\n`);
  }

  if (transcript.length === 0) {
    console.log(`  ${style.dim}Empty transcript.${style.reset}\n`);
    return;
  }

  for (let i = 0; i < transcript.length; i++) {
    const entry = transcript[i];
    switch (entry.type) {
      case 'note':
        console.log(`  ${style.dim}${entry.text}${style.reset}`);
        break;
      case 'action':
        console.log(`  ${entry.text}`);
        break;
      case 'flop':
      case 'turn':
      case 'river': {
        const board = boardAtPosition(transcript, i);
        const label = entry.type.charAt(0).toUpperCase() + entry.type.slice(1);
        console.log(`\n  ${style.dim}── ${label}: ${board.map(cardDisplay).join(' ')} ──${style.reset}\n`);
        break;
      }
      case 'range':
        console.log(formatRangeEntry(transcript, known, i));
        break;
    }
  }
  console.log('');
}

function displayRangeInfo(transcript, known) {
  const board = currentBoard(transcript);
  const range = currentRangeState(transcript);
  const dead = allDeadCards(board, known);
  const count = comboCount(range, dead);
  const possible = totalPossible(dead);
  const pct = possible > 0 ? ((count / possible) * 100).toFixed(1) : '0';

  console.log(`\n  ${style.bold}${count}${style.reset} combos in range (${pct}% of ${possible} possible)`);

  if (range.size > 0) {
    let pairs = 0, suited = 0, offsuit = 0;
    const filtered = applyBoardRemoval(range, dead);
    for (const combo of filtered) {
      if (combo[0] === combo[2]) pairs++;
      else if (combo[1] === combo[3]) suited++;
      else offsuit++;
    }
    console.log(`  ${style.dim}Pairs: ${pairs}  Suited: ${suited}  Offsuit: ${offsuit}${style.reset}`);
  }
  console.log('');
}

function displayGrid(transcript, known) {
  const board = currentBoard(transcript);
  const range = currentRangeState(transcript);
  const dead = allDeadCards(board, known);
  const grid = gridData(range, dead);

  console.log('');

  for (let row = 0; row < 13; row++) {
    let line = '  ';
    for (let col = 0; col < 13; col++) {
      const cell = grid[row][col];
      const name = cell.handName.padEnd(4);

      if (cell.available === 0) {
        line += `${style.dim}${style.red}${name}${style.reset} `;
      } else if (cell.inRange === cell.available) {
        line += `${style.green}${name}${style.reset} `;
      } else if (cell.inRange > 0) {
        line += `${style.yellow}${name}${style.reset} `;
      } else {
        line += `${style.dim}${name}${style.reset} `;
      }
    }
    console.log(line);
  }

  const count = comboCount(range, dead);
  const possible = totalPossible(dead);
  const pct = possible > 0 ? ((count / possible) * 100).toFixed(1) : '0';
  console.log(`\n  ${style.bold}${count}${style.reset} combos in range (${pct}% of ${possible} possible)\n`);

  if (range.size > 0) {
    let pairs = 0, suited = 0, offsuit = 0;
    const filtered = applyBoardRemoval(range, dead);
    for (const combo of filtered) {
      if (combo[0] === combo[2]) pairs++;
      else if (combo[1] === combo[3]) suited++;
      else offsuit++;
    }
    console.log(`  ${style.dim}Pairs: ${pairs}  Suited: ${suited}  Offsuit: ${offsuit}${style.reset}\n`);
  }
}

function showHelp() {
  console.log(`
  ${style.bold}Transcript:${style.reset}
    ${style.cyan}note${style.reset} <text>            Add a note (reads, context, meta)
    ${style.cyan}action${style.reset} <text>          Add an action (what happened)

  ${style.bold}Board:${style.reset}
    ${style.cyan}flop${style.reset} <3 cards>         Deal the flop (e.g., flop As 6c 6h)
    ${style.cyan}turn${style.reset} <card>            Deal the turn (e.g., turn Js)
    ${style.cyan}river${style.reset} <card>           Deal the river (e.g., river 3s)
    ${style.cyan}board${style.reset}                  Show current board
    ${style.cyan}known${style.reset} <cards>          Set known cards (e.g., known Jc Jh)
    ${style.cyan}known${style.reset} + <card>         Add a known card

  ${style.bold}Range:${style.reset}
    ${style.cyan}range${style.reset} <hands>          Set villain's range
    ${style.cyan}range remove${style.reset} <hands>   Remove hands from range
    ${style.cyan}range add${style.reset} <hands>      Add hands to range
    ${style.cyan}range${style.reset}                  Show current range info

  ${style.bold}Display:${style.reset}
    ${style.cyan}summary${style.reset}                Show full transcript
    ${style.cyan}grid${style.reset}                   Show 13×13 hand grid
    ${style.cyan}export${style.reset}                 Dump session as replayable commands
    ${style.cyan}undo${style.reset}                   Remove last transcript entry
    ${style.cyan}reset${style.reset}                  Clear everything
    ${style.cyan}help${style.reset}                   Show this help
    ${style.cyan}quit${style.reset}                   Exit

  ${style.bold}Range syntax:${style.reset}
    ${style.dim}AA, 88+, 22-77          Pairs
    AKs, A9s+, A2s-A5s     Suited
    AKo, ATo+, KTo-KQo     Offsuit
    AK, A9+                 Both suited & offsuit
    AdKd, Ah8h              Specific combos${style.reset}

  ${style.bold}Grid legend:${style.reset}
    ${style.green}Green${style.reset}  = all combos in range
    ${style.yellow}Yellow${style.reset} = some combos in range
    ${style.dim}Dim${style.reset}    = not in range
    ${style.dim}${style.red}Red${style.reset}    = impossible (blocked by board/known)

  ${style.bold}Example flow:${style.reset}
    ${style.dim}> note 1/3 NL, 9-handed, eff $700
    > note Villain rarely 3-bets; passive postflop
    > known Jc Jh
    > action Hero opens $15 UTG+1, BTN calls, V 3bets to $65
    > range QQ+,AKs,AKo
    > action Hero calls, BTN folds
    > flop As 6c 6h
    > action Villain checks, Hero checks
    > turn Js
    > action Villain bets $55
    > range remove QQ
    > action Hero calls
    > river 3s
    > action V checks, Hero bets $275, V raises to $585
    > range remove AKs,AKo,KK
    > summary
    > grid${style.reset}
  `);
}

function parseCards(str) {
  const tokens = str.split(/\s+/).filter(Boolean);
  const parsed = tokens.map(parseCard);
  const bad = tokens.filter((_, i) => parsed[i] === null);
  return { parsed, bad, tokens };
}

const COMMANDS = [
  'note', 'action', 'flop', 'turn', 'river', 'board', 'known',
  'range', 'range remove', 'range add',
  'summary', 'grid', 'export', 'undo', 'reset', 'help', 'quit',
];

function completer(line) {
  const hits = COMMANDS.filter(c => c.startsWith(line.toLowerCase()));
  return [hits.length ? hits : COMMANDS, line];
}

async function startHandReader() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer,
  });

  const nextLine = createLineReader(rl);

  let transcript = [];
  let known = [];

  console.log(`\n${style.bold}${style.cyan}Hand Reading Tracker${style.reset}`);
  console.log(`${style.dim}====================${style.reset}`);
  console.log(`${style.dim}Type "help" for commands.${style.reset}`);

  for (;;) {
    const raw = await nextLine(`\n${style.cyan}>${style.reset} `);
    if (raw === null) break;

    const input = raw.trim();
    if (!input) continue;

    const spaceIdx = input.indexOf(' ');
    const cmd = (spaceIdx === -1 ? input : input.substring(0, spaceIdx)).toLowerCase();
    const args = spaceIdx === -1 ? '' : input.substring(spaceIdx + 1).trim();

    switch (cmd) {
      case 'quit':
      case 'exit':
        console.log(`${style.dim}Goodbye!${style.reset}\n`);
        rl.close();
        return;

      case 'help':
        showHelp();
        break;

      case 'note':
      case 'action': {
        if (!args) {
          console.log(`  ${style.red}Usage: ${cmd} <text>${style.reset}`);
          break;
        }
        transcript.push({ type: cmd, text: args });
        if (cmd === 'note') {
          console.log(`  ${style.dim}${args}${style.reset}`);
        } else {
          console.log(`  ${args}`);
        }
        break;
      }

      case 'flop': {
        const { parsed, bad } = parseCards(args);
        if (bad.length > 0) {
          console.log(`  ${style.red}Invalid card(s): ${bad.join(', ')}${style.reset}`);
        } else if (parsed.length !== 3) {
          console.log(`  ${style.red}Flop needs exactly 3 cards${style.reset}`);
        } else {
          transcript.push({ type: 'flop', cards: parsed });
          const board = currentBoard(transcript);
          console.log(`\n  ${style.dim}── Flop: ${board.map(cardDisplay).join(' ')} ──${style.reset}`);
        }
        break;
      }

      case 'turn':
      case 'river': {
        const card = parseCard(args);
        if (!card) {
          console.log(`  ${style.red}${cmd.charAt(0).toUpperCase() + cmd.slice(1)} needs exactly 1 valid card${style.reset}`);
        } else {
          transcript.push({ type: cmd, cards: [card] });
          const board = currentBoard(transcript);
          const label = cmd.charAt(0).toUpperCase() + cmd.slice(1);
          console.log(`\n  ${style.dim}── ${label}: ${board.map(cardDisplay).join(' ')} ──${style.reset}`);
        }
        break;
      }

      case 'board': {
        const board = currentBoard(transcript);
        console.log(`  Board: ${formatCards(board)}`);
        break;
      }

      case 'known': {
        if (args.startsWith('+')) {
          const cardStr = args.substring(1).trim();
          const card = parseCard(cardStr);
          if (!card) {
            console.log(`  ${style.red}Invalid card: ${cardStr}${style.reset}`);
          } else if (known.includes(card)) {
            console.log(`  ${style.red}${cardDisplay(card)} already known${style.reset}`);
          } else {
            known.push(card);
            console.log(`  Known: ${formatCards(known)}`);
          }
        } else if (!args) {
          console.log(`  Known: ${formatCards(known)}`);
        } else {
          const { parsed, bad } = parseCards(args);
          if (bad.length > 0) {
            console.log(`  ${style.red}Invalid card(s): ${bad.join(', ')}${style.reset}`);
          } else {
            known = parsed;
            console.log(`  Known: ${formatCards(known)}`);
          }
        }
        break;
      }

      case 'range': {
        if (!args) {
          displayRangeInfo(transcript, known);
          break;
        }

        let op, spec;
        if (args.toLowerCase().startsWith('remove ')) {
          op = 'remove';
          spec = args.substring(7).trim();
        } else if (args.toLowerCase().startsWith('add ')) {
          op = 'add';
          spec = args.substring(4).trim();
        } else {
          op = 'set';
          spec = args;
        }

        if (spec.toLowerCase() === 'none') spec = '';

        transcript.push({ type: 'range', op, spec });
        console.log(formatRangeEntry(transcript, known, transcript.length - 1));
        break;
      }

      case 'export': {
        const lines = [];
        if (known.length > 0) {
          lines.push(`known ${known.join(' ')}`);
        }
        for (const entry of transcript) {
          switch (entry.type) {
            case 'note':
            case 'action':
              lines.push(`${entry.type} ${entry.text}`);
              break;
            case 'flop':
              lines.push(`flop ${entry.cards.join(' ')}`);
              break;
            case 'turn':
            case 'river':
              lines.push(`${entry.type} ${entry.cards[0]}`);
              break;
            case 'range': {
              const prefix = entry.op === 'set' ? 'range' : `range ${entry.op}`;
              lines.push(`${prefix} ${entry.spec || 'none'}`);
              break;
            }
          }
        }
        if (lines.length === 0) {
          console.log(`  ${style.dim}Nothing to export.${style.reset}`);
        } else {
          console.log('');
          for (const line of lines) console.log(line);
          console.log('');
        }
        break;
      }

      case 'summary':
        displaySummary(transcript, known);
        break;

      case 'grid':
        displayGrid(transcript, known);
        break;

      case 'undo': {
        if (transcript.length === 0) {
          console.log(`  ${style.dim}Nothing to undo.${style.reset}`);
        } else {
          const removed = transcript.pop();
          let desc;
          switch (removed.type) {
            case 'note': desc = `note: ${removed.text}`; break;
            case 'action': desc = `action: ${removed.text}`; break;
            case 'flop': desc = 'flop'; break;
            case 'turn': desc = 'turn'; break;
            case 'river': desc = 'river'; break;
            case 'range': {
              const label = removed.op === 'set' ? 'range' : `range ${removed.op}`;
              desc = `${label} ${removed.spec || '(none)'}`;
              break;
            }
          }
          console.log(`  ${style.green}Removed: ${desc}${style.reset}`);
        }
        break;
      }

      case 'reset':
        transcript = [];
        known = [];
        console.log(`  ${style.green}Everything cleared.${style.reset}`);
        break;

      default:
        console.log(`  ${style.red}Unknown command: ${cmd}${style.reset}. Type ${style.cyan}help${style.reset} for commands.`);
    }
  }

  rl.close();
}

module.exports = { startHandReader };
