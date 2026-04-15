const SCENARIOS = {
  'EP:O':    { position: 'EP',  situation: 'open',      description: 'Open',            actions: 'fcr' },
  'CO:O':    { position: 'CO',  situation: 'open',      description: 'Open',            actions: 'fcr' },
  'BTN:O':   { position: 'BTN', situation: 'open',      description: 'Open',            actions: 'fcr' },
  'SB:O':    { position: 'SB',  situation: 'open',      description: 'Open',            actions: 'fcr' },
  'EP:vW':   { position: 'EP',  situation: 'vs_weak',   description: 'vs weak raise',   actions: 'fc3' },
  'CO:vW':   { position: 'CO',  situation: 'vs_weak',   description: 'vs weak raise',   actions: 'fc3' },
  'BTN:vW':  { position: 'BTN', situation: 'vs_weak',   description: 'vs weak raise',   actions: 'fc3' },
  'B:vW':    { position: 'BB',  situation: 'vs_weak',   description: 'vs weak raise',   actions: 'fc3' },
  'B:vS':    { position: 'BB',  situation: 'vs_steal',  description: 'vs steal',        actions: 'fc3' },
  'ALL:vStr':{ position: 'BTN', situation: 'vs_strong', description: 'vs strong raise', actions: 'fc3' },
  'SB:LP':   { position: 'SB',  situation: 'limped',    description: 'with limpers',    actions: 'fcr' },
  'BB:LP':   { position: 'BB',  situation: 'limped',    description: 'Limped pot',      actions: 'cr' },
};

const SCENARIO_KEYS = Object.keys(SCENARIOS);

const SCENARIO_LABELS = {
  'EP:O':     'EP open',
  'CO:O':     'CO open',
  'BTN:O':    'BTN open',
  'SB:O':     'SB open',
  'EP:vW':    'EP vs weak',
  'CO:vW':    'CO vs weak',
  'BTN:vW':   'BTN vs weak',
  'B:vW':     'Blinds vs weak',
  'B:vS':     'Blinds vs steal',
  'ALL:vStr': 'vs strong raise',
  'SB:LP':    'SB with limpers',
  'BB:LP':    'BB limped pot',
};

const POSITIONS = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// Generate all 169 hand combos
const HAND_LIST = [];
for (let i = 0; i < 13; i++) {
  for (let j = 0; j < 13; j++) {
    if (i === j) {
      HAND_LIST.push(RANKS[i] + RANKS[j]);
    } else if (i < j) {
      HAND_LIST.push(RANKS[i] + RANKS[j] + 's');
    } else {
      HAND_LIST.push(RANKS[j] + RANKS[i] + 'o');
    }
  }
}

// Equity ranking vs random hand (strongest to weakest)
// Credit: ProPokerTools.com
const EQUITY_RANKING = [
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', '77', 'AQs',
  'AJs', 'AKo', 'ATs', 'AQo', 'AJo', 'KQs', '66', 'A9s', 'ATo', 'KJs',
  'A8s', 'KTs', 'KQo', 'A7s', 'A9o', 'KJo', '55', 'QJs', 'K9s', 'A5s',
  'A6s', 'A8o', 'KTo', 'QTs', 'A4s', 'A7o', 'K8s', 'A3s', 'QJo', 'K9o',
  'A5o', 'A6o', 'Q9s', 'K7s', 'JTs', 'A2s', 'QTo', '44', 'A4o', 'K6s',
  'K8o', 'Q8s', 'A3o', 'K5s', 'J9s', 'Q9o', 'JTo', 'K7o', 'A2o', 'K4s',
  'Q7s', 'K6o', 'K3s', 'T9s', 'J8s', '33', 'Q6s', 'Q8o', 'K5o', 'J9o',
  'K2s', 'Q5s', 'T8s', 'K4o', 'J7s', 'Q4s', 'Q7o', 'T9o', 'J8o', 'K3o',
  'Q6o', 'Q3s', '98s', 'T7s', 'J6s', 'K2o', '22', 'Q2s', 'Q5o', 'J5s',
  'T8o', 'J7o', 'Q4o', '97s', 'J4s', 'T6s', 'J3s', 'Q3o', '98o', '87s',
  'T7o', 'J6o', '96s', 'J2s', 'Q2o', 'T5s', 'J5o', 'T4s', '97o', '86s',
  'J4o', 'T6o', '95s', 'T3s', '76s', 'J3o', '87o', 'T2s', '85s', '96o',
  'J2o', 'T5o', '94s', '75s', 'T4o', '93s', '86o', '65s', '84s', '95o',
  'T3o', '92s', '76o', '74s', 'T2o', '54s', '85o', '64s', '83s', '94o',
  '75o', '82s', '73s', '93o', '65o', '53s', '63s', '84o', '92o', '43s',
  '74o', '72s', '54o', '64o', '52s', '62s', '83o', '42s', '82o', '73o',
  '53o', '63o', '32s', '43o', '72o', '52o', '62o', '42o', '32o'
];
