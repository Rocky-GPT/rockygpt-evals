import 'dotenv/config';
import { assertChecks, check, conversation } from './suite-utils';

const failures: string[] = [];
const results = await conversation(
  ['What are the next two campus shuttle departures?', 'Which departure did you mention first?'],
  { conversationId: 'discourse-order', visitorId: 'discourse-visitor', now: new Date('2026-08-20T14:00:00Z') }
);
const firstTime = results[0]?.answer.match(/\d{1,2}:\d{2}\s*(?:AM|PM)/i)?.[0];
check(failures, 'lead turn supplies a departure', Boolean(firstTime), results[0]?.answer);
check(
  failures,
  'follow-up refers to the first spoken departure',
  Boolean(firstTime && results[1]?.answer.toLowerCase().includes(firstTime.toLowerCase())),
  results[1]?.answer
);
assertChecks(failures);
console.log('discourse: passed');
