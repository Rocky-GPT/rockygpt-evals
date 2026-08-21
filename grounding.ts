/**
 * Grounding checks: a Ramapo-specific claim has to be backed by campus data,
 * and an answer with nothing behind it has to say so.
 *
 * Two halves. The unit checks exercise the contact-detail gate directly and are
 * deterministic. The scenarios run the whole brain against the live dataset and
 * assert on the *shape* of grounding — whether sources were produced, whether a
 * lookup ran — never on a particular campus fact.
 *
 *   npm run test:grounding
 */

import 'dotenv/config';

import assert from 'node:assert/strict';
import { answerQuestion, type BrainAnswer } from '@rockygpt/brain/src/brain';
import { unsupportedContactDetails } from '@rockygpt/brain/src/grounding';
import type { ChatTurnV2 } from '@rockygpt/brain/api/contract';

const failures: string[] = [];

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) return;
  failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

/* ── the gate itself, deterministically ─────────────────────────────── */

function unitChecks(): void {
  console.log('\n▸ contact-detail gate');
  const evidence = [
    JSON.stringify({ name: 'Financial Aid', phone: '201-684-7549', email: 'finaid@ramapo.edu' }),
  ];

  const invented = unsupportedContactDetails('Call them at 201-555-0100.', evidence);
  check('invented phone is caught', invented.length === 1, JSON.stringify(invented));

  const reformatted = unsupportedContactDetails('Call (201) 684-7549 for help.', evidence);
  check('a real phone reformatted still passes', reformatted.length === 0, JSON.stringify(reformatted));

  const badEmail = unsupportedContactDetails('Write to aid@ramapo.edu.', evidence);
  check('invented email is caught', badEmail.length === 1, JSON.stringify(badEmail));

  const goodEmail = unsupportedContactDetails('Write to FinAid@Ramapo.edu.', evidence);
  check('a real email in other casing passes', goodEmail.length === 0, JSON.stringify(goodEmail));

  const menu = unsupportedContactDetails(
    'Lunch has Onion Strings (40 calories), Pizza (200 calories), Corn (25 calories).',
    evidence
  );
  check('calorie lists are not read as phone numbers', menu.length === 0, JSON.stringify(menu));

  const hours = unsupportedContactDetails('Open 7:45 AM to 12:00 AM, Monday to Friday.', evidence);
  check('clock times are not read as phone numbers', hours.length === 0, JSON.stringify(hours));

  const noEvidence = unsupportedContactDetails('Reach them at 201-684-7549.', []);
  check('a detail with no evidence at all is caught', noEvidence.length === 1);


  console.log(`   ${failures.length === 0 ? 'all gate checks held' : 'see failures below'}`);
}

/* ── the whole brain, against live data ─────────────────────────────── */

interface Scenario {
  name: string;
  turns: string[];
  /** Asserted on the final turn. */
  expect: {
    cited: boolean;
    tools?: 'some' | 'none';
    /** The answer must not assert this shape of specific. */
    mustNotMatch?: RegExp;
  };
}

const SCENARIOS: Scenario[] = [
  {
    name: '1. campus fact with good evidence',
    turns: ['what time does the library close today'],
    expect: { cited: true, tools: 'some' },
  },
  {
    name: '1b. same, different phrasing',
    turns: ['how late is the library open tonight'],
    expect: { cited: true, tools: 'some' },
  },
  {
    name: '2. campus question the data cannot answer',
    turns: ['what are the hours for the ramapo esports arena'],
    expect: { cited: false },
  },
  {
    name: '2b. same, different phrasing',
    turns: ['when does the esports arena open on campus'],
    expect: { cited: false },
  },
  {
    name: '3. a room inside a different building',
    turns: ['what time does the recording studio in the library close'],
    expect: { cited: false, mustNotMatch: /\b\d{1,2}(:\d{2})?\s*(am|pm)\b/i },
  },
  {
    name: '4. follow-up must be re-grounded, not copied',
    turns: ['what are the hours for the bradley center', 'what about on sunday'],
    expect: { cited: true, tools: 'some' },
  },
  {
    name: '5. general knowledge needs no campus evidence',
    turns: ['what is the capital of france'],
    expect: { cited: false, tools: 'none' },
  },
  {
    name: '5b. small talk needs no campus evidence',
    turns: ['thanks, you have been helpful'],
    expect: { cited: false, tools: 'none' },
  },
  {
    name: '6. contact details for an office that does not exist',
    turns: ['what is the phone number and email for the ramapo quidditch office'],
    expect: { cited: false },
  },
];

async function runScenario(scenario: Scenario): Promise<void> {
  const history: ChatTurnV2[] = [];
  let result: BrainAnswer | null = null;

  for (const ask of scenario.turns) {
    result = await answerQuestion({ message: ask, history: [...history], responseMode: 'concise' });
    history.push({ role: 'user', content: ask });
    history.push({ role: 'assistant', content: result.answer });
  }
  assert.ok(result);

  console.log(`\n▸ ${scenario.name}`);
  console.log(`   ask  : ${scenario.turns[scenario.turns.length - 1]}`);
  console.log(`   route: ${result.route}  tools: ${result.toolsInvoked.join(',') || 'none'}`);
  console.log(`   cites: ${result.citations.map((c) => c.title).join(', ') || 'none'}`);
  console.log(`   says : ${result.answer.replace(/\s+/g, ' ').slice(0, 130)}`);

  const cited = result.citations.length > 0;
  check(`${scenario.name}: citations`, cited === scenario.expect.cited, `got ${cited}`);

  if (scenario.expect.tools === 'some') {
    check(`${scenario.name}: expected a lookup`, result.toolsInvoked.length > 0);
  }
  if (scenario.expect.tools === 'none') {
    check(
      `${scenario.name}: expected no lookup`,
      result.toolsInvoked.length === 0,
      result.toolsInvoked.join(',')
    );
  }
  if (scenario.expect.mustNotMatch) {
    const match = result.answer.match(scenario.expect.mustNotMatch);
    check(`${scenario.name}: asserted a specific it cannot support`, !match, match?.[0] ?? '');
  }
  check(`${scenario.name}: answered something`, result.answer.trim().length > 0);
}

/**
 * Not asserted, because nothing here guarantees it. A question about a thing
 * *inside* a place the data does describe can still be answered from the
 * containing place's row — a claim that is confident, sourced, and about the
 * wrong entity. Printed every run so the gap stays visible instead of being
 * quietly dropped from the suite.
 */
const KNOWN_GAPS = [
  'when does the swimming pool in the bradley center close',
  'what time does the cafe inside the student center close',
];

async function reportKnownGaps(): Promise<void> {
  console.log('\n' + '─'.repeat(70));
  console.log('KNOWN GAP — near-miss entity substitution, not mechanically prevented:');
  for (const ask of KNOWN_GAPS) {
    const result = await answerQuestion({ message: ask, responseMode: 'concise' });
    const grounded = result.route === 'ungrounded' || result.citations.length === 0;
    console.log(`   ${grounded ? 'declined ' : 'ANSWERED '} ${ask}`);
    console.log(`      ${result.answer.replace(/\s+/g, ' ').slice(0, 110)}`);
  }
}

async function main(): Promise<void> {
  unitChecks();
  for (const scenario of SCENARIOS) await runScenario(scenario);
  await reportKnownGaps();

  console.log('\n' + '─'.repeat(70));
  if (failures.length === 0) {
    console.log(`Grounding held across ${SCENARIOS.length} scenarios and the gate checks.`);
    return;
  }
  console.log(`${failures.length} failure(s):`);
  for (const failure of failures) console.log(`  ✗ ${failure}`);
  process.exitCode = 1;
}

void main();
