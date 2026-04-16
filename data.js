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

const SCENARIO_KEYS = [
  'EP:O',     // EP open
  'EP:vW',    // EP vs weak
  'CO:O',     // CO open
  'CO:vW',    // CO vs weak
  'BTN:O',    // BTN open
  'BTN:vW',   // BTN vs weak
  'SB:O',     // SB open
  'SB:LP',    // SB with limpers
  'BB:LP',    // BB limped pot
  'B:vW',     // Blinds vs weak
  'B:vS',     // Blinds vs steal
  'ALL:vStr', // vs strong raise
];

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

// Hand groups for quick selection
const HAND_GROUPS = {
  'Pocket Pairs': {
    all: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22'],
    subgroups: {
      'Premium': ['AA', 'KK'],
      'Big': ['QQ', 'JJ', 'TT'],
      'Medium': ['99', '88', '77', '66'],
      'Small': ['55', '44', '33', '22']
    }
  },
  'Suited Aces': {
    all: ['AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s'],
    subgroups: {
      'Broadway': ['AKs', 'AQs', 'AJs', 'ATs'],
      'Wheel': ['A5s', 'A4s', 'A3s', 'A2s'],
      'Middle': ['A9s', 'A8s', 'A7s', 'A6s']
    }
  },
  'Suited Kings': {
    all: ['KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s'],
    subgroups: {
      'Broadway': ['KQs', 'KJs', 'KTs'],
      'Low': ['K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s']
    }
  },
  'Suited Broadway': {
    all: ['AKs', 'AQs', 'AJs', 'KQs', 'KJs', 'QJs', 'ATs', 'KTs', 'QTs', 'JTs'],
    subgroups: {
      'Big': ['AKs', 'AQs', 'AJs', 'KQs', 'KJs', 'QJs'],
      'With Ten': ['ATs', 'KTs', 'QTs', 'JTs']
    }
  },
  'Suited Connectors': {
    all: ['T9s', '98s', '87s', '76s', '65s', '54s', '43s'],
    subgroups: {
      'Big': ['T9s', '98s'],
      'Medium': ['87s', '76s'],
      'Small': ['65s', '54s', '43s']
    }
  },
  'Suited 1-Gappers': {
    all: ['J9s', 'T8s', '97s', '86s', '75s', '64s', '53s', '42s'],
    subgroups: {
      'Big': ['J9s', 'T8s', '97s'],
      'Small': ['86s', '75s', '64s', '53s', '42s']
    }
  },
  'Suited 2-Gappers': {
    all: ['Q9s', 'J8s', 'T7s', '96s', '85s', '74s', '63s', '52s'],
    subgroups: {
      'Big': ['Q9s', 'J8s', 'T7s'],
      'Small': ['96s', '85s', '74s', '63s', '52s']
    }
  },
  'Offsuit Aces': {
    all: ['AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o'],
    subgroups: {
      'Big': ['AKo', 'AQo'],
      'Broadway': ['AKo', 'AQo', 'AJo', 'ATo'],
      'Low': ['A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o']
    }
  },
  'Offsuit Kings': {
    all: ['KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o', 'K6o', 'K5o', 'K4o', 'K3o', 'K2o'],
    subgroups: {
      'Broadway': ['KQo', 'KJo', 'KTo'],
      'Low': ['K9o', 'K8o', 'K7o', 'K6o', 'K5o', 'K4o', 'K3o', 'K2o']
    }
  },
  'Offsuit Broadway': {
    all: ['AKo', 'AQo', 'AJo', 'KQo', 'KJo', 'QJo', 'ATo', 'KTo', 'QTo', 'JTo'],
    subgroups: {
      'Big': ['AKo', 'AQo', 'AJo', 'KQo', 'KJo', 'QJo'],
      'With Ten': ['ATo', 'KTo', 'QTo', 'JTo']
    }
  }
};

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
