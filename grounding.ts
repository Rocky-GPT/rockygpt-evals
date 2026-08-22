import 'dotenv/config';
import { answerQuestion } from './client';
import { assertChecks, check } from './suite-utils';

const failures: string[] = [];
const campus = await answerQuestion({ message: 'What is the Registrar phone number?', responseMode: 'concise' });
check(failures, 'campus fact is answered', campus.route !== 'error', campus.answer);
check(failures, 'campus fact carries a citation', campus.citations.length > 0, campus.answer);

const general = await answerQuestion({ message: 'What is 2 + 2?', responseMode: 'concise' });
check(failures, 'general knowledge is answered', /\b4\b/.test(general.answer), general.answer);
check(failures, 'general knowledge borrows no campus citation', general.citations.length === 0);

const unknown = await answerQuestion({ message: 'What is Professor Zorbax’s office number?', responseMode: 'concise' });
check(failures, 'unknown campus fact is not invented', unknown.citations.length === 0 || /verify|couldn|can’t|cannot/i.test(unknown.answer), unknown.answer);
assertChecks(failures);
console.log('grounding: passed');
