import 'dotenv/config';
import { answerQuestion, dataGet } from './client';
import { assertChecks, check } from './suite-utils';

const now = new Date('2026-08-20T18:00:00Z');
const data = await dataGet<{ records: Array<{ name: string; schedule: string }> }>(
  `/v1/search/campus-hours?q=Bradley%20Center&day=Thursday&at=${encodeURIComponent(now.toISOString())}`
);
const answer = await answerQuestion({ message: 'Is the Bradley Center open right now?', now, responseMode: 'concise' });
const failures: string[] = [];
check(failures, 'data service returns a current Bradley Center schedule', data.records.length > 0);
check(failures, 'brain answers the pinned hours question', answer.route !== 'error', answer.answer);
check(failures, 'hours answer is sourced', answer.citations.length > 0, answer.answer);
assertChecks(failures);
console.log('deterministic-hours: passed');
