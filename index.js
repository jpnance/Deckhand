const { startQuiz } = require('./src/quiz');
const { startPreflopQuiz } = require('./src/preflopQuiz');

const args = process.argv.slice(2);

if (args.includes('--preflop') || args.includes('-p')) {
  startPreflopQuiz();
} else {
  startQuiz();
}
