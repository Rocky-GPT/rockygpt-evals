import 'dotenv/config';
import { answerQuestion } from './client';
import { assertChecks, check } from './suite-utils';

const failures: string[] = [];
const result = await answerQuestion({
  message: 'What time does the Bradley Center close, and what is the Registrar phone number?',
  now: new Date('2026-08-20T18:00:00Z'),
  responseMode: 'concise',
});
const normalized = result.answer.toLowerCase();
check(failures, 'compound request is not dropped as an error', result.route !== 'error', result.answer);
check(failures, 'reply addresses the Bradley Center', normalized.includes('bradley'), result.answer);
check(failures, 'reply addresses the registrar', normalized.includes('registrar'), result.answer);
check(failures, 'compound campus reply is sourced or safely withheld', result.citations.length > 0 || result.route === 'ungrounded');
assertChecks(failures);
console.log('multi-request: passed');
