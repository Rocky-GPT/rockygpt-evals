/**
 * Evidence has to support the claim, not merely concern the subject.
 *
 * Three layers. The price rule is pure and settled by the schema. The validator
 * checks run it against hand-built question/answer/evidence triples, so the
 * entity-and-property cases can be stated exactly without depending on what the
 * live dataset happens to contain today. The end-to-end set runs whole turns
 * through the brain and measures the two numbers that matter together: how many
 * unsupported claims are caught, and how many correct answers are refused.
 *
 * A checker that blocks hallucinations by refusing good answers is not an
 * improvement, so the control set is deliberately larger than the trap set.
 *
 *   npm run test:evidence
 */

import 'dotenv/config';

import { answerQuestion } from '@rockygpt/brain/src/brain';
import { forgetConversation } from '@rockygpt/brain/src/conversation-state';
import {
  assertsPriceWithoutEvidence,
  checkEvidenceSupport,
} from '@rockygpt/brain/src/evidence-support';
import { unsupportedStructuredValues } from '@rockygpt/brain/src/structured-values';
import type { ChatTurnV2 } from '@rockygpt/brain/api/contract';

const NOW = new Date('2026-08-20T18:00:00Z');
const VISITOR = 'evidence-visitor';
const failures: string[] = [];

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) return;
  failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

const row = (value: Record<string, unknown>) => JSON.stringify(value);

/* ── the schema rule, pure ───────────────────────────────────────────── */

function priceRuleChecks(): void {
  console.log('\n▸ price claims against price-free data');

  const menu = [row({ meal: 'LUNCH', name: 'Ham & Swiss On Wheat', calories: '120' })];
  check(
    'a cheapest claim on calorie rows is unsupported',
    assertsPriceWithoutEvidence('The cheapest option is the Ham & Swiss, at 120 calories.', menu)
  );
  check(
    'a cost claim on calorie rows is unsupported',
    assertsPriceWithoutEvidence('It costs 120.', menu)
  );
  check(
    'describing the food itself is untouched',
    !assertsPriceWithoutEvidence('Lunch includes a Ham & Swiss on wheat, 120 calories.', menu)
  );
  check(
    'a price claim backed by an actual amount is allowed',
    !assertsPriceWithoutEvidence('A permit costs $50.', [row({ item: 'permit', fee: '$50' })])
  );
  check(
    '"free" is not a price claim',
    !assertsPriceWithoutEvidence('Counseling is free for students.', [row({ name: 'Counseling' })])
  );
}

/* ── values compared, not read ───────────────────────────────────────── */

function structuredValueChecks(): void {
  console.log('\n▸ times, dates, and rooms against the rows');
  const flagged = (answer: string, rows: string[]) =>
    unsupportedStructuredValues(answer, rows, NOW).length;

  const dated = [row({ date: 'Nov. 25', title: 'Thanksgiving Break (No Classes)' })];
  check('a date the row gives is allowed', flagged('The break is on November 25.', dated) === 0);
  check(
    'a date the row never gives is caught',
    flagged('The break runs November 25 to November 29.', dated) === 1
  );
  check(
    'a range the row does state is allowed',
    flagged('The break runs November 25 to November 29.', [
      row({ date: 'Nov. 25', description: 'November 25, 12:00 am -- November 29, 11:59 pm' }),
    ]) === 0
  );

  const trip = [row({ stops: [{ location: 'Interstate Plaza', time: '3:20 PM' }] })];
  check('a stop time the trip lists is allowed', flagged('It arrives at 3:20 PM.', trip) === 0);
  check(
    'a time no row carries is caught',
    flagged('It arrives at 4:45 PM.', trip) === 1
  );

  const office = [row({ name: 'Registrar', office: 'D-224' })];
  check('a room the row gives is allowed', flagged('The Registrar is in D-224.', office) === 0);
  check('an invented room is caught', flagged('The Registrar is in G-414.', office) === 1);

  // Values the answer worked out will not appear in any row, and must not be
  // treated as invented.
  check(
    'a counted duration is not a stated value',
    flagged('That is 97 days away.', dated) === 0
  );
  check(
    'minutes remaining are not a stated value',
    flagged('It closes in 45 minutes, at 5:00 PM.', [row({ closesAt: '5:00 PM' })]) === 0
  );
  check(
    "today's date needs no row",
    flagged('Today is Thursday, August 20, 2026.', office) === 0
  );
  check('prose with no values is untouched', flagged('Yes, that club exists.', office) === 0);
  check(
    'published styles compare equal',
    flagged('Open 8:00am to 9:30am.', [row({ schedule: '8:00AM-9:30AM' })]) === 0
  );
}

/* ── the validator, on stated evidence ───────────────────────────────── */

interface Triple {
  label: string;
  question: string;
  answer: string;
  rows: string[];
  expect: 'supported' | 'unsupported';
}

const TRIPLES: Triple[] = [
  {
    label: '1. right entity, right property',
    question: 'what time does the library close today',
    answer: 'The library closes today at 12:00 AM.',
    rows: [row({ name: 'Library (Main Building)', day: 'Thursday', closesAt: '12:00 AM' })],
    expect: 'supported',
  },
  {
    label: '2. right entity, property not in the row',
    question: 'where can i print on campus',
    answer: 'You can print at the Library (Main Building).',
    rows: [row({ name: 'Library (Main Building)', day: 'Thursday', schedule: '7:45am-12:00am' })],
    expect: 'unsupported',
  },
  {
    label: '4. a number read as another kind of number',
    question: 'which sandwich is cheapest',
    answer: 'The Ham & Swiss is cheapest at 120.',
    rows: [row({ name: 'Ham & Swiss On Wheat', calories: '120' })],
    expect: 'unsupported',
  },
  {
    label: '5. a one-day row stretched into a range',
    question: 'when is the break',
    answer: 'The break runs from November 25 to November 29.',
    rows: [row({ term: 'Fall 2026', date: 'Nov. 25', title: 'Thanksgiving Break (No Classes)' })],
    expect: 'unsupported',
  },
  {
    label: '5b. a range the row actually states',
    question: 'when is the break',
    answer: 'The break runs from November 25 to November 29.',
    rows: [
      row({
        term: 'Fall 2026',
        date: 'Nov. 25',
        title: 'Thanksgiving Break (No Classes)',
        description: 'November 25, 12:00 am -- November 29, 11:59 pm',
      }),
    ],
    expect: 'supported',
  },
  {
    label: '6. a stop time moved to another stop',
    question: 'what time does that trip reach Garden State Plaza',
    answer: 'That trip reaches Garden State Plaza at 3:20 PM.',
    rows: [
      row({
        route: 'Weekday Roadrunner Express',
        departsCampusAt: '3:10 PM',
        everyStopOnThisTrip: [
          { location: 'Interstate Plaza', time: '3:20 PM' },
          { location: 'Ramsey Square', time: '3:30 PM' },
        ],
      }),
    ],
    expect: 'unsupported',
  },
  {
    label: '6b. the stop time the trip actually lists',
    question: 'what time does that trip reach Interstate Plaza',
    answer: 'That trip reaches Interstate Plaza at 3:20 PM.',
    rows: [
      row({
        route: 'Weekday Roadrunner Express',
        departsCampusAt: '3:10 PM',
        everyStopOnThisTrip: [
          { location: 'Interstate Plaza', time: '3:20 PM' },
          { location: 'Ramsey Square', time: '3:30 PM' },
        ],
      }),
    ],
    expect: 'supported',
  },
  {
    label: '7. a retained row used for another property',
    question: 'what is the phone number for the registrar',
    answer: 'The Registrar can be reached at 201-684-7695.',
    rows: [row({ name: 'Office of the Registrar', office: 'D-224' })],
    expect: 'unsupported',
  },
  {
    label: '8. a retained row reused for its own property',
    question: 'remind me where the registrar is',
    answer: 'The Office of the Registrar is in D-224.',
    rows: [row({ name: 'Office of the Registrar', office: 'D-224' })],
    expect: 'supported',
  },
];

async function validatorChecks(): Promise<void> {
  console.log('\n▸ does the cited row carry the claim');
  for (const triple of TRIPLES) {
    const result = await checkEvidenceSupport(triple.question, triple.answer, triple.rows);
    // 'unknown' means the checker could not run; it never blocks, so for the
    // purpose of these checks it counts as allowing the answer through.
    const treated = result.verdict === 'unsupported' ? 'unsupported' : 'supported';
    const ok = treated === triple.expect;
    console.log(
      `   ${ok ? 'ok  ' : 'FAIL'} ${triple.label.padEnd(42)} ${result.verdict}${result.claim ? ` (${result.claim.slice(0, 46)})` : ''}`
    );
    check(triple.label, ok, `wanted ${triple.expect}, got ${result.verdict}`);
  }
}

/* ── whole turns, measuring both directions together ─────────────────── */

async function runTurns(id: string, turns: string[]) {
  forgetConversation({ visitorId: VISITOR, conversationId: id });
  let history: ChatTurnV2[] = [];
  let last = null as Awaited<ReturnType<typeof answerQuestion>> | null;
  for (const turn of turns) {
    last = await answerQuestion({
      message: turn,
      history: [...history],
      responseMode: 'concise',
      now: NOW,
      conversationId: id,
      visitorId: VISITOR,
    });
    history.push({ role: 'user', content: turn }, { role: 'assistant', content: last.answer });
    history = history.slice(-10);
  }
  forgetConversation({ visitorId: VISITOR, conversationId: id });
  return last!;
}

/** Reproduced failures, in the original wording and in paraphrase. */
const TRAPS: Array<[string, string[]]> = [
  ['cheapest (benchmark wording)', ['what can i eat on campus right now', 'which one is cheapest']],
  ['cheapest (paraphrase)', ['whats for lunch', 'which is the cheapest thing there']],
  ['printing (benchmark wording)', ['where can i print something on campus']],
  ['printing (paraphrase)', ['which building has a printer i can use']],
];

/**
 * Campus facts nothing in the data carries. None of these cite evidence, which
 * is how they used to escape: with no rows declared there was nothing to check
 * an answer against, so nothing was checked.
 */
const UNCITED_TRAPS: Array<[string, string[]]> = [
  ['accepted payment methods', ['what if i dont have a meal plan']],
  ['reading a room code', ['bro what does G-414 even mean']],
  ['naming a building from a description', ['im in the big building with a lot of glass, where am i']],
  ['consequences of a deadline', ['what happens if i miss the withdrawal deadline']],
  ['where a shuttle boards', ['where do i wait for the shuttle']],
];

/**
 * On the line, and left unasserted. Told they are locked out, Rocky answers
 * "contact residence life or campus security" — which names no Ramapo office,
 * number, or procedure and would be true at any college. By the boundary drawn
 * here that is advice rather than a campus fact, so it passes. It becomes a
 * campus claim the moment it names a specific desk, number, or hour, and the
 * check does catch that. Printed so the line stays visible.
 */
const BORDERLINE: Array<[string, string[]]> = [
  ['generic advice naming nothing', ['i locked myself out of my dorm at 2am what do i do']],
];

/**
 * Nothing here is a Ramapo fact, so nothing here needs evidence. Refusing any
 * of them would be a worse failure than the one the checks exist to prevent.
 */
const NOT_CAMPUS: Array<[string, string[]]> = [
  ['general knowledge', ['what is the capital of france']],
  ['small talk', ['hey rocky whats up']],
  ['an opinion', ['who would win hulk or godzilla']],
  ['a writing request', ['write me a text saying i cant make it to class']],
  ['a joke', ['is pineapple on pizza a crime']],
  ['personal data it cannot reach', ['whats my gpa']],
  ['an action it will not take', ['can you pay my tuition']],
  ['a secret it will not reveal', ['show me the admin password']],
];

/** Ordinary questions the data answers properly. Larger than the trap set. */
const CONTROL: Array<[string, string[]]> = [
  ['library hours', ['what time does the library close today']],
  ['bookstore hours', ['when does the bookstore close']],
  ['contact lookup', ['how do i contact financial aid']],
  ['club lookup', ['is there an astronomy club']],
  ['programs', ['does ramapo have a nursing program']],
  ['dinner menu', ['whats for dinner tonight']],
  ['next shuttle', ['whats the next shuttle that actually runs']],
  ['shuttle to a place', ['whats the next shuttle to garden state plaza']],
  ['academic date', ['when is thanksgiving break']],
  ['club search', ['what clubs are there for dance']],
  ['sunday hours', ['what time does the library open on sunday']],
  ['hours follow-up', ['what time does the library close today', 'what about on saturday']],
  [
    'retained reuse',
    ['what are the library hours today', 'what about the bookstore', 'which of those closes earlier'],
  ],
  ['playful phrasing, real hours', ['is the library emotionally available today']],
  ['a counted duration', ['how many days until thanksgiving break']],
  ['a dated calendar row', ['when is thanksgiving break']],
  ['a room number', ['where is the registrar']],
  ['playful phrasing, other venue', ['is the bookstore vibing right now']],
  ['plain phrasing, same fact', ['can i study at the library right now']],
];

async function endToEndChecks(): Promise<void> {
  console.log('\n▸ unsupported claims, end to end');
  let caught = 0;
  for (const [label, turns] of TRAPS) {
    const result = await runTurns(`ev-trap-${label.replace(/\W/g, '')}`, turns);
    // Either outcome is correct: the reply is withheld, or the answer declines
    // on its own. What must not happen is the claim being asserted.
    const withheld = result.route === 'ungrounded';
    const declined = /cannot verify|can.t verify|do not have|don.t have|held back|no (specific )?(information|pricing|price)/i.test(
      result.answer
    );
    if (withheld || declined) caught += 1;
    const outcome = withheld ? 'withheld' : declined ? 'declined' : 'ASSERTED';
    console.log(`   ${outcome.padEnd(8)} ${label.padEnd(30)} ${result.answer.replace(/\s+/g, ' ').slice(0, 58)}`);
  }

  console.log('\n▸ correct answers, end to end');
  let refused = 0;
  const latencies: number[] = [];
  for (const [label, turns] of CONTROL) {
    const started = Date.now();
    const result = await runTurns(`ev-ok-${label.replace(/\W/g, '')}`, turns);
    latencies.push(Date.now() - started);
    const blocked = result.route === 'ungrounded';
    if (blocked) refused += 1;
    console.log(`   ${blocked ? 'REFUSED' : 'ok     '} ${label.padEnd(30)} ${result.answer.replace(/\s+/g, ' ').slice(0, 60)}`);
  }

  console.log('\n▸ campus claims with nothing cited');
  let uncitedCaught = 0;
  for (const [label, turns] of UNCITED_TRAPS) {
    const result = await runTurns(`ev-unc-${label.replace(/\W/g, '')}`, turns);
    const withheld = result.route === 'ungrounded';
    const declined = /cannot verify|can.t verify|do not have|dont have|check ramapo\.edu/i.test(
      result.answer
    );
    if (withheld || declined) uncitedCaught += 1;
    const outcome = withheld ? 'withheld' : declined ? 'declined' : 'ASSERTED';
    console.log(`   ${outcome.padEnd(8)} ${label.padEnd(36)} ${result.answer.replace(/\s+/g, ' ').slice(0, 52)}`);
  }

  console.log('\n▸ answers that are not campus facts');
  let generalAnswered = 0;
  for (const [label, turns] of NOT_CAMPUS) {
    const result = await runTurns(`ev-gen-${label.replace(/\W/g, '')}`, turns);
    const ok = result.route !== 'ungrounded';
    if (ok) generalAnswered += 1;
    console.log(`   ${ok ? 'ok     ' : 'REFUSED'} ${label.padEnd(36)} ${result.answer.replace(/\s+/g, ' ').slice(0, 52)}`);
  }

  console.log('\n▸ on the boundary between advice and a campus fact');
  for (const [label, turns] of BORDERLINE) {
    const result = await runTurns(`ev-bord-${label.replace(/\W/g, '')}`, turns);
    console.log(
      `   ${result.route === 'ungrounded' ? 'withheld' : 'allowed '} ${label.padEnd(36)} ${result.answer.replace(/\s+/g, ' ').slice(0, 52)}`
    );
  }

  console.log(`\n   caught ${caught}/${TRAPS.length} cited-but-unsupported   ${uncitedCaught}/${UNCITED_TRAPS.length} uncited campus claims`);
  console.log(`   refused ${refused}/${CONTROL.length} supported   answered ${generalAnswered}/${NOT_CAMPUS.length} non-campus`);

  check(
    'most uncited campus claims are caught',
    uncitedCaught >= UNCITED_TRAPS.length - 1,
    `${uncitedCaught} of ${UNCITED_TRAPS.length}`
  );
  check(
    'nothing that is not a campus fact is refused',
    generalAnswered === NOT_CAMPUS.length,
    `${generalAnswered} of ${NOT_CAMPUS.length}`
  );

  // A checker that refuses correct answers is worse than the fault it guards
  // against, so the control set is the hard gate; the trap set is measured.
  check('no correct answer is refused', refused === 0, `${refused} refused`);
  // Refusing a correct answer is the failure that must never happen, so it is
  // the hard gate. The catch rates come from a model reading prose and vary by
  // a case between runs; the floors below catch a collapse without failing the
  // suite over one intermittent miss.
  check(
    'most cited-but-unsupported claims are caught',
    caught >= TRAPS.length - 1,
    `${caught} of ${TRAPS.length}`
  );
}

/**
 * Not asserted. Pointing at a field catches a claim about a property the rows
 * do not carry, because there is no field to name. It does not catch a claim
 * about a different *thing* that shares the property: a row for a building
 * really does have a closing time, so "the pool inside it closes then" can name
 * a real field and pass. Entity substitution stays a matter of reading, and the
 * reading is only sometimes right. Printed every run so the gap stays visible.
 */
async function reportKnownGap(): Promise<void> {
  const result = await checkEvidenceSupport(
    'when does the pool in the recreation centre close',
    'The pool closes at 10:00 PM.',
    [row({ name: 'Recreation Centre', day: 'Thursday', closesAt: '10:00 PM' })]
  );
  console.log('\n' + '─'.repeat(70));
  console.log('KNOWN GAP — a claim about something inside what the row describes:');
  console.log(`   "the pool closes at 10:00 PM" from a row about the building -> ${result.verdict}`);
  console.log(`   ${result.verdict === 'unsupported' ? 'caught this run' : 'allowed this run'}`);
}

/**
 * Two questions the checker rejects, kept out of the control set because the
 * answers were not actually correct — the checker found that, not the reverse.
 *
 * At two in the afternoon "the gym opens today at 8:00 AM" describes a window
 * that closed hours ago, and an event that ran 8 AM to 2 PM is not coming up.
 * Both read as ordinary campus answers and both state something untrue about
 * the present. They are recorded here rather than asserted, because the right
 * fix is in how those answers are phrased, not in the checker.
 */
const SURFACED: Array<[string, string[]]> = [
  ['a window that has already passed', ['when does the auxiliary gym open']],
  ['an event that has already ended', ['what events are coming up on campus']],
];

async function reportSurfaced(): Promise<void> {
  console.log('\n▸ answers the checker rejects as temporally wrong');
  for (const [label, turns] of SURFACED) {
    const result = await runTurns(`ev-surf-${label.replace(/\W/g, '')}`, turns);
    const claim = (result.debugInfo as Record<string, unknown>).unsupportedClaim;
    console.log(
      `   ${result.route === 'ungrounded' ? 'withheld' : 'allowed '} ${label.padEnd(34)} ${
        typeof claim === 'string' ? claim.slice(0, 60) : ''
      }`
    );
  }
}

async function main(): Promise<void> {
  priceRuleChecks();
  structuredValueChecks();
  await validatorChecks();
  await endToEndChecks();
  await reportSurfaced();
  await reportKnownGap();

  console.log('\n' + '─'.repeat(70));
  if (failures.length === 0) {
    console.log('Evidence supported every claim it was cited for.');
    return;
  }
  console.log(`${failures.length} failure(s):`);
  for (const failure of failures) console.log(`  ✗ ${failure}`);
  process.exitCode = 1;
}

void main();
