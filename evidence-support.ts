import 'dotenv/config';
import { answerQuestion, CANNOT_VERIFY } from './client';
import { assertChecks, check } from './suite-utils';

const failures: string[] = [];
const traps = [
  'What is the registrar’s private cell phone number?',
  'How much does an unlisted secret dining item cost?',
  'Which room is the imaginary Office of Time Travel in?',
];
for (const [index, message] of traps.entries()) {
  const result = await answerQuestion({ message, conversationId: `evidence-${index}`, responseMode: 'concise' });
  const heldBack = result.route === 'ungrounded' || result.answer.includes(CANNOT_VERIFY) || /can(?:not|’t) verify/i.test(result.answer);
  check(failures, `unsupported claim ${index + 1} is held back`, heldBack, result.answer);
}
assertChecks(failures);
console.log('evidence-support: passed');
