import 'dotenv/config';
import { conversation } from './suite-utils';
import { assertChecks, check } from './suite-utils';

const failures: string[] = [];
const results = await conversation(
  ['What are the Bradley Center hours today?', 'Which closing time did you just give me?'],
  { conversationId: 'state-hours', visitorId: 'state-visitor', now: new Date('2026-08-20T18:00:00Z') }
);
check(failures, 'both turns return an answer', results.every((result) => result.answer.length > 0));
check(failures, 'follow-up is not an error', results[1]?.route !== 'error', results[1]?.answer);
check(failures, 'follow-up keeps provenance', (results[1]?.citations.length ?? 0) > 0);
assertChecks(failures);
console.log('conversation-state: passed');
