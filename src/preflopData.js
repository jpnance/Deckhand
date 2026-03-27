const SCENARIOS = {
  'EP:O':   { position: 'EP',  situation: 'limped',    description: 'Limped pot',         actions: 'fcr' },
  'EP:vWR': { position: 'EP',  situation: 'vs_weak',   description: 'vs weak raise',      actions: 'fc3' },
  'EP:vSR': { position: 'EP',  situation: 'vs_strong', description: 'vs strong raise',    actions: 'fc3' },
  'CO:O':   { position: 'CO',  situation: 'limped',    description: 'Limped pot',         actions: 'fcr' },
  'CO:vWR': { position: 'CO',  situation: 'vs_weak',   description: 'vs weak raise',      actions: 'fc3' },
  'CO:vSR': { position: 'CO',  situation: 'vs_strong', description: 'vs strong raise',    actions: 'fc3' },
  'BTN:O':  { position: 'BTN', situation: 'limped',    description: 'Limped pot',         actions: 'fcr' },
  'BTN:vWR':{ position: 'BTN', situation: 'vs_weak',   description: 'vs weak raise',      actions: 'fc3' },
  'BTN:vSR':{ position: 'BTN', situation: 'vs_strong', description: 'vs strong raise',    actions: 'fc3' },
  'SB:LP':  { position: 'SB',  situation: 'limped',    description: 'Limped pot',         actions: 'fcr' },
  'B:vS':   { position: 'BB',  situation: 'vs_steal',  description: 'vs steal',           actions: 'fc3' },
  'B:vWR':  { position: 'BB',  situation: 'vs_weak',   description: 'vs weak raise',      actions: 'fc3' },
  'B:vSR':  { position: 'BB',  situation: 'vs_strong', description: 'vs strong raise',    actions: 'fc3' },
  'BB:LP':  { position: 'BB',  situation: 'limped',    description: 'Limped pot',         actions: 'cr'  },
};

const SCENARIO_KEYS = ['EP:O', 'EP:vWR', 'EP:vSR', 'CO:O', 'CO:vWR', 'CO:vSR', 'BTN:O', 'BTN:vWR', 'BTN:vSR', 'SB:LP', 'B:vS', 'B:vWR', 'B:vSR', 'BB:LP'];

function normalizeAction(raw) {
  const s = raw.trim().toLowerCase();
  if (s.startsWith('f')) return 'f';
  if (s.startsWith('c')) return 'c';
  if (s.startsWith('r')) return 'r';
  if (s.startsWith('3')) return '3';
  return s[0] || 'f';
}

const RAW_DATA = `AA|r|3|3|r|3|3|r|3|3|r|3|3|3|r
KK|r|3|3|r|3|3|r|3|3|r|3|3|3|r
AKs|r|3|c|r|3|c|r|3|c|r|3|3|c|r
AQs|r|c|c|r|c|c|r|3|c|r|3|c|c|r
AJs|r|c|c|r|c|c|r|3|c|r|3|c|c|r
ATs|r|c|c|r|c|c|r|3|c|r|3|c|c|r
A9s|r|c|f|r|c|f|r|c|f|c|3|c|f|c
A8s|r|c|f|r|c|f|r|c|f|c|3|c|f|c
A7s|r|c|f|r|3|f|r|c|f|c|3|c|f|c
A6s|r|c|f|r|c|f|r|c|f|c|3|c|f|c
A5s|r|3|3|r|3|3|r|3|3|c|3|3|3|c
A4s|r|3|f|r|3|f|r|3|f|c|3|3|f|c
A3s|r|3|f|r|3|f|r|3|f|c|3|3|f|c
A2s|r|3|f|r|3|f|r|3|f|c|3|3|f|c
AKo|r|3|c|r|3|c|r|3|c|r|3|f|c|r
KQs|r|c|c|r|c|c|r|3|c|r|3|c|c|r
KJs|r|c|c|r|c|c|r|3|c|r|3|c|c|r
KTs|r|c|c|r|c|c|r|c|c|c|c|c|c|c
K9s|f|f|f|r|c|f|r|c|f|c|c|f|f|c
K8s|f|f|f|r|f|f|r|f|f|c|c|f|f|c
K7s|f|f|f|r|f|f|r|f|f|c|3|f|f|c
K6s|f|f|f|f|f|f|r|f|f|c|3|f|f|c
K5s|f|f|f|f|f|f|r|f|f|c|3|f|f|c
K4s|f|f|f|f|f|f|r|f|f|c|c|f|f|c
K3s|f|f|f|f|f|f|r|f|f|c|c|f|f|c
K2s|f|f|f|f|f|f|r|f|f|c|c|f|f|c
AQo|r|c|f|r|c|f|r|3|f|r|3|c|f|r
KQo|f|f|f|r|c|f|r|c|f|c|3|f|f|c
QQ|r|3|c|r|3|c|r|3|c|r|3|3|c|r
QJs|r|c|c|r|c|c|r|3|c|c|c|c|c|c
QTs|r|c|c|r|c|c|r|c|c|c|c|c|c|c
Q9s|f|f|f|r|c|f|r|c|f|c|3|f|f|c
Q8s|f|f|f|f|f|f|r|f|f|c|c|f|f|c
Q7s|f|f|f|f|f|f|r|f|f|c|c|f|f|c
Q6s|f|f|f|f|f|f|r|f|f|c|c|f|f|c
Q5s|f|f|f|f|f|f|r|f|f|c|c|f|f|c
Q4s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
Q3s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
Q2s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
AJo|f|f|f|r|c|f|r|c|f|c|3|f|f|c
KJo|f|f|f|r|f|f|r|c|f|c|c|f|f|c
QJo|f|f|f|f|f|f|r|f|f|c|c|f|f|c
JJ|r|c|c|r|3|c|r|3|c|r|3|c|c|r
JTs|r|c|c|r|c|c|r|3|c|c|c|c|c|c
J9s|f|f|f|r|c|f|r|c|f|c|3|f|f|c
J8s|f|f|f|f|f|f|r|c|f|c|c|f|f|c
J7s|f|f|f|f|f|f|r|f|f|c|c|f|f|c
J6s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
J5s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
J4s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
J3s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
J2s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
ATo|f|f|f|r|f|f|r|c|f|c|c|f|f|c
KTo|f|f|f|f|f|f|r|f|f|c|c|f|f|c
QTo|f|f|f|f|f|f|r|f|f|c|c|f|f|c
JTo|f|f|f|f|f|f|r|f|f|c|c|f|f|c
TT|r|c|c|r|c|c|r|3|c|r|3|c|c|r
T9s|r|3|c|r|3|c|r|c|c|c|c|3|c|c
T8s|f|f|f|r|c|f|r|c|f|c|3|f|f|c
T7s|f|f|f|f|f|f|r|c|f|c|c|f|f|c
T6s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
T5s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
T4s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
T3s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
T2s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
A9o|f|f|f|f|f|f|r|f|f|c|c|f|f|c
K9o|f|f|f|f|f|f|r|f|f|c|c|f|f|c
Q9o|f|f|f|f|f|f|f|f|f|c|c|f|f|c
J9o|f|f|f|f|f|f|f|f|f|c|c|f|f|c
T9o|f|f|f|f|f|f|f|f|f|c|c|f|f|c
99|r|c|c|r|c|c|r|3|c|r|3|c|c|r
98s|r|c|c|r|c|c|r|c|c|c|3|c|c|c
97s|f|f|f|r|c|f|r|3|f|c|3|f|f|c
96s|f|f|f|f|f|f|r|f|f|c|c|f|f|c
95s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
94s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
93s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
92s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
A8o|f|f|f|f|f|f|r|f|f|c|c|f|f|c
K8o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
Q8o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
J8o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
T8o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
98o|f|f|f|f|f|f|f|f|f|c|c|f|f|c
88|r|c|c|r|c|c|r|c|c|c|c|c|c|c
87s|r|3|c|r|3|c|r|c|c|c|3|3|c|c
86s|f|f|f|r|c|f|r|c|f|c|3|f|f|c
85s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
84s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
83s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
82s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
A7o|f|f|f|f|f|f|r|f|f|c|f|f|f|c
K7o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
Q7o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
J7o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
T7o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
97o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
87o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
77|r|c|c|r|c|c|r|c|c|c|c|c|c|c
76s|r|c|c|r|c|c|r|c|c|c|3|c|c|c
75s|f|f|f|r|f|f|r|3|f|c|c|f|f|c
74s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
73s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
72s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
A6o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
K6o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
Q6o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
J6o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
T6o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
96o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
86o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
76o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
66|r|c|c|r|c|c|r|c|c|c|c|c|c|c
65s|f|f|f|r|c|f|r|c|f|c|3|f|f|c
64s|f|f|f|r|f|f|r|c|f|c|c|f|f|c
63s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
62s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
A5o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
K5o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
Q5o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
J5o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
T5o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
95o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
85o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
75o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
65o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
55|r|c|c|r|c|c|r|c|c|c|c|c|c|c
54s|f|f|f|r|3|f|r|c|f|c|3|f|f|c
53s|f|f|f|r|f|f|r|c|f|c|c|f|f|c
52s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
A4o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
K4o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
Q4o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
J4o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
T4o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
94o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
84o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
74o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
64o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
54o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
44|r|c|c|r|c|c|r|c|c|c|3|c|c|c
43s|f|f|f|r|f|f|r|c|f|c|c|f|f|c
42s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
A3o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
K3o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
Q3o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
J3o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
T3o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
93o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
83o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
73o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
63o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
53o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
43o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
33|r|c|c|r|c|c|r|c|c|c|3|c|c|c
32s|f|f|f|f|f|f|f|f|f|c|f|f|f|c
A2o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
K2o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
Q2o|f|f|f|f|f|f|f|f|f|c|f|f|f|c
J2o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
T2o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
92o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
82o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
72o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
62o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
52o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
42o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
32o|f|f|f|f|f|f|f|f|f|f|f|f|f|c
22|r|c|c|r|c|c|r|c|c|c|3|c|c|c`;

const HANDS = {};
RAW_DATA.split('\n').forEach(line => {
  const parts = line.split('|');
  const hand = parts[0];
  HANDS[hand] = {};
  SCENARIO_KEYS.forEach((key, i) => {
    HANDS[hand][key] = normalizeAction(parts[i + 1]);
  });
});

module.exports = { SCENARIOS, SCENARIO_KEYS, HANDS };
