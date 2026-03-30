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
