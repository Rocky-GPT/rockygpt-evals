import 'dotenv/config';
import { claimsNoMoreShuttles } from './claims';
import { answerQuestion, dataGet } from './client';
import { assertChecks, check } from './suite-utils';

const now = new Date('2026-08-20T18:00:00Z');
const timetable = await dataGet<{ records: Array<{ departure: string }> }>(
  `/v1/search/shuttles?serviceDay=weekday&at=${encodeURIComponent(now.toISOString())}`
);
const message = 'What is the next campus shuttle?';
const result = await answerQuestion({ message, now, responseMode: 'concise' });
const failures: string[] = [];
check(failures, 'weekday timetable is available', timetable.records.length > 0);
check(failures, 'next-shuttle question is answered', result.route !== 'error', result.answer);
check(
  failures,
  'shuttle answer is sourced or reports no trips',
  result.citations.length > 0 ||
    (await claimsNoMoreShuttles(result.answer, /no .*trip|no .*shuttle/i.test(result.answer), message)),
  result.answer
);
assertChecks(failures);
console.log('shuttle: passed');
