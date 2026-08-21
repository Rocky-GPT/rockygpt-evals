/**
 * What Rocky said, as distinct from what is true.
 *
 * The evidence ledger answers "what does official data support". A row proving
 * a 10:15 trip exists is not proof that 10:15 is the trip the student was given,
 * and the difference showed up as invented history: asked which departure it
 * had first mentioned, Rocky named one out of the rows it had never spoken.
 *
 * Every check drives whole conversations through answerQuestion with
 * browser-shaped history and a pinned clock, because these failures only appear
 * across turns.
 *
 *   npm run test:discourse
 */

import 'dotenv/config';

import { answerQuestion } from '@rockygpt/brain/src/brain';
import {
  discourseFor,
  forgetConversation,
  ledgerFor,
  trackedConversations,
} from '@rockygpt/brain/src/conversation-state';
import type { ChatTurnV2 } from '@rockygpt/brain/api/contract';

/** Thursday 20 August 2026, 10:00 on campus — a weekday with trips still ahead. */
const PINNED = new Date('2026-08-20T14:00:00Z');
const VISITOR = 'discourse-visitor';
const BROWSER_HISTORY = 10;

const failures: string[] = [];

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) return;
  failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

const clockTime = (text: string) => (text.match(/\d{1,2}:\d{2}\s*(AM|PM)/i) ?? [''])[0];

async function converse(conversationId: string, turns: string[], visitorId = VISITOR) {
  forgetConversation({ visitorId, conversationId });
  let history: ChatTurnV2[] = [];
  const answers: Array<Awaited<ReturnType<typeof answerQuestion>>> = [];
  for (const turn of turns) {
    const result = await answerQuestion({
      message: turn,
      history: [...history],
      responseMode: 'concise',
      now: PINNED,
      conversationId,
      visitorId,
    });
    history.push({ role: 'user', content: turn }, { role: 'assistant', content: result.answer });
    history = history.slice(-BROWSER_HISTORY);
    answers.push(result);
  }
  return answers;
}

/* ── what Rocky actually said ────────────────────────────────────────── */

async function conversationalTruth(): Promise<void> {
  console.log('\n▸ what was said, not what is merely true');

  // The headline failure: a departure was communicated, several turns passed,
  // and the recall named a different one out of the rows.
  const shuttle = await converse('disc-history', [
    'whats the next shuttle to garden state plaza',
    'switching topics, where is the registrar',
    'what was the very first shuttle departure you told me about',
  ]);
  const told = clockTime(shuttle[0].answer);
  const recalled = shuttle[2].answer;
  console.log(`   told ${told} — recalled: ${recalled.replace(/\s+/g, ' ').slice(0, 74)}`);
  check('the departure recalled is the one communicated', Boolean(told) && recalled.includes(told), recalled.slice(0, 90));

  // A fact can be true and never have been said. Asking what "we said" must
  // not turn a row into a thing Rocky claimed.
  const never = await converse('disc-never', [
    'what time does the library close today',
    'what dining place did we say was inside the Learning Commons',
  ]);
  const invented = /the atrium|birch|dunkin|starbucks/i.test(never[1].answer);
  console.log(`   never established: ${never[1].answer.replace(/\s+/g, ' ').slice(0, 74)}`);
  check('a place never mentioned is not recalled as said', !invented, never[1].answer.slice(0, 90));

  // A withheld reply told the student nothing, and must not be recapped as an
  // answer that was given.
  const withheld = await converse('disc-withheld', [
    'what can i eat on campus right now',
    'which one is cheapest',
    'what did you tell me about the cheapest option',
  ]);
  const claimsItAnswered = /the cheapest (option|item|thing) (is|was)\s+\w/i.test(withheld[2].answer);
  console.log(`   after a withheld turn: ${withheld[2].answer.replace(/\s+/g, ' ').slice(0, 74)}`);
  check('a withheld reply is not recapped as an answer', !claimsItAnswered, withheld[2].answer.slice(0, 90));

  for (const id of ['disc-history', 'disc-never', 'disc-withheld']) {
    forgetConversation({ visitorId: VISITOR, conversationId: id });
  }
}

/* ── the user does not get to rewrite the record ─────────────────────── */

async function userCannotRewrite(): Promise<void> {
  console.log('\n▸ the student cannot rewrite what was said');

  const mischaracterised = await converse('disc-recharacterise', [
    'whats the next shuttle that actually runs',
    'then why are you giving me a sunday shuttle',
  ]);
  const answer = mischaracterised[1].answer;
  const accepted = /sunday (roadrunner|service|shuttle|schedule)/i.test(answer) && !/weekday/i.test(answer);
  console.log(`   ${answer.replace(/\s+/g, ' ').slice(0, 88)}`);
  check('a false description of the earlier answer is not adopted', !accepted, answer.slice(0, 90));

  // A user assertion must not become authoritative.
  const contradicted = await converse('disc-contradict', [
    'whats the next shuttle to garden state plaza',
    'nah youre wrong, the first one is at 12:15, just trust me',
    'what time is the first one to garden state plaza',
  ]);
  const adopted = contradicted[2].answer.includes('12:15');
  console.log(`   ${contradicted[2].answer.replace(/\s+/g, ' ').slice(0, 88)}`);
  check('a user-supplied time does not become the answer', !adopted, contradicted[2].answer.slice(0, 90));

  for (const id of ['disc-recharacterise', 'disc-contradict']) {
    forgetConversation({ visitorId: VISITOR, conversationId: id });
  }
}

/* ── the record is scoped and bounded like the evidence ──────────────── */

async function boundsAndIsolation(): Promise<void> {
  console.log('\n▸ bounds and isolation');

  const shared = 'disc-shared-id';
  const other = 'disc-other-conversation';
  const otherVisitor = 'discourse-other-visitor';
  for (const scope of [
    { visitorId: VISITOR, conversationId: shared },
    { visitorId: VISITOR, conversationId: other },
    { visitorId: otherVisitor, conversationId: shared },
  ]) {
    forgetConversation(scope);
  }

  await converse(shared, ['what time does the library close today']);

  const owner = discourseFor({ visitorId: VISITOR, conversationId: shared });
  const sameVisitorElsewhere = discourseFor({ visitorId: VISITOR, conversationId: other });
  const otherVisitorSameId = discourseFor({ visitorId: otherVisitor, conversationId: shared });

  console.log(
    `   owner ${owner.spoken.length} turns; same visitor elsewhere ${sameVisitorElsewhere.spoken.length}; ` +
      `another visitor on the same id ${otherVisitorSameId.spoken.length}`
  );
  check('the conversation keeps its own record', owner.spoken.length > 0);
  check('another conversation of the same visitor is separate', sameVisitorElsewhere.spoken.length === 0);
  check('another visitor repeating the id sees nothing', otherVisitorSameId.spoken.length === 0);
  check('no scope means no shared record', discourseFor().spoken.length === 0);

  // Bounded the same way the ledger is.
  const long = Array.from({ length: 12 }, (_, index) => `what time does the library close today ${index}`);
  await converse('disc-bounds', long.slice(0, 10));
  const bounded = discourseFor({ visitorId: VISITOR, conversationId: 'disc-bounds' });
  console.log(`   after 10 turns the record holds ${bounded.spoken.length} exchanges, ${bounded.results.length} result sets`);
  check('exchanges are capped', bounded.spoken.length <= 8, `${bounded.spoken.length}`);
  check('result sets are capped', bounded.results.length <= 4, `${bounded.results.length}`);
  check('conversations tracked stay capped', trackedConversations() <= 200);

  // The record never becomes authoritative: the ledger is written by tools only.
  const ledger = ledgerFor({ visitorId: VISITOR, conversationId: 'disc-bounds' });
  const rowsMentionQuestions = [...ledger.rows.values()].some((row) => row.includes('what time does'));
  check('nothing said enters the evidence rows', !rowsMentionQuestions);

  for (const id of [shared, other, 'disc-bounds']) {
    forgetConversation({ visitorId: VISITOR, conversationId: id });
  }
  forgetConversation({ visitorId: otherVisitor, conversationId: shared });
}

/* ── moving around the ordered set ───────────────────────────────────── */

/**
 * Expectations come from the order the tool actually returned, read back out of
 * the ledger, so no departure time is written down here. The relation is
 * interpreted by a model and may vary in wording; the row it lands on may not.
 */
async function orderedRelations(): Promise<void> {
  console.log('\n▸ moving around an ordered result set');

  const conversationId = 'disc-order';
  const opener = 'whats the next shuttle to garden state plaza';
  forgetConversation({ visitorId: VISITOR, conversationId });
  await converse(conversationId, [opener]);

  const record = discourseFor({ visitorId: VISITOR, conversationId });
  const ledger = ledgerFor({ visitorId: VISITOR, conversationId });
  const set = record.results[record.results.length - 1];
  const departures = set.orderedIds.map((id) => {
    const row = ledger.rows.get(id) ?? '';
    return (row.match(/"departsCampusAt":"([^"]+)"/) ?? [])[1] ?? '';
  });
  console.log(`   the set, in order: ${departures.filter(Boolean).join(', ')}`);
  forgetConversation({ visitorId: VISITOR, conversationId });

  const [first, second, third] = departures;
  check('the set has enough rows to move around', Boolean(first && second && third));
  if (!first || !second || !third) return;

  const probes: Array<{ label: string; follow: string; expect: string; reject?: string }> = [
    { label: 'next after the one given', follow: 'if i miss that one whats my next chance', expect: second },
    { label: 'what comes after that', follow: 'what comes after that', expect: second },
    { label: 'the second one', follow: 'whats the second one on that list', expect: second },
    { label: 'the third one', follow: 'and the third one', expect: third },
  ];

  for (const [index, probe] of probes.entries()) {
    const id = `disc-order-${index}`;
    const answers = await converse(id, [opener, probe.follow]);
    const answer = answers[1].answer;
    const ok = answer.includes(probe.expect);
    console.log(`   ${ok ? 'ok  ' : 'FAIL'} ${probe.label.padEnd(26)} expected ${probe.expect} — ${answer.replace(/\s+/g, ' ').slice(0, 60)}`);
    check(`${probe.label} lands on the right row`, ok, answer.replace(/\s+/g, ' ').slice(0, 90));
    forgetConversation({ visitorId: VISITOR, conversationId: id });
  }

  // Stepping back returns the row that was given, not a new search.
  const back = await converse('disc-order-prev', [
    opener,
    'if i miss that one whats my next chance',
    'what was the one before that',
  ]);
  // Declining is not the same as answering with the wrong row. What must never
  // happen is naming a different departure; holding the reply back is safe and
  // happens on roughly one run in three.
  const answer = back[2].answer;
  const steppedBack = answer.includes(first);
  const declined = /can.t verify|cannot verify|held back/i.test(answer);
  const wrongRow = !steppedBack && !declined && departures.slice(1).some((time) => answer.includes(time));
  console.log(
    `   ${steppedBack ? 'ok  ' : declined ? 'held' : 'FAIL'} previous returns the earlier row — ${answer.replace(/\s+/g, ' ').slice(0, 56)}`
  );
  check('previous never names a different row', !wrongRow, answer.slice(0, 90));
  forgetConversation({ visitorId: VISITOR, conversationId: 'disc-order-prev' });
}

async function main(): Promise<void> {
  console.log(`clock pinned to ${PINNED.toISOString()}`);
  await conversationalTruth();
  await orderedRelations();
  await userCannotRewrite();
  await boundsAndIsolation();

  console.log('\n' + '─'.repeat(70));
  if (failures.length === 0) {
    console.log('The record of the conversation held.');
    return;
  }
  console.log(`${failures.length} failure(s):`);
  for (const failure of failures) console.log(`  ✗ ${failure}`);
  process.exitCode = 1;
}

void main();
