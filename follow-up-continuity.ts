import 'dotenv/config';
import { assertChecks, check, conversation } from './suite-utils';

const failures: string[] = [];
const scenarios = [
  ['What are the Bradley Center hours Friday?', 'What about Saturday?'],
  ['Find the Registrar contact information.', 'Where is that office?'],
  ['Show me upcoming campus events.', 'Tell me about the second one.'],
];
for (const [index, turns] of scenarios.entries()) {
  const results = await conversation(turns, { conversationId: `follow-up-${index}`, visitorId: 'follow-up-visitor' });
  const followUp = results.at(-1);
  check(failures, `scenario ${index + 1} follow-up answers`, Boolean(followUp?.answer), followUp?.answer);
  check(failures, `scenario ${index + 1} stays available`, followUp?.route !== 'error', followUp?.answer);
}
assertChecks(failures);
console.log('follow-up continuity: passed');
