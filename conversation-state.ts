/**
 * Conversation-scoped evidence.
 *
 * The state exists for one reason: a fact grounded on an earlier turn should
 * keep the provenance that proved it, so restating it later carries a source
 * instead of arriving bare. These checks cover that, and the invariant that
 * makes it safe — only the tool layer may write, so an assistant's own prose
 * can never become authoritative.
 *
 *   npm run test:state
 */

import 'dotenv/config';

import { answerQuestion } from '@rockygpt/brain/src/brain';
import {
  forgetConversation,
  ledgerFor,
  scopeKey,
  trackedConversations,
  trimLedger,
} from '@rockygpt/brain/src/conversation-state';
import { createEvidenceLedger } from '@rockygpt/brain/src/tools';
import type { ChatTurnV2 } from '@rockygpt/brain/api/contract';

const NOW = new Date('2026-08-20T18:00:00Z');
const failures: string[] = [];

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) return;
  failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

const VISITOR = 'visitor-primary';

async function converse(turns: string[], conversationId: string, visitorId = VISITOR) {
  const history: ChatTurnV2[] = [];
  const results = [];
  for (const turn of turns) {
    const result = await answerQuestion({
      message: turn,
      history: [...history],
      responseMode: 'concise',
      now: NOW,
      conversationId,
      visitorId,
    });
    history.push({ role: 'user', content: turn }, { role: 'assistant', content: result.answer });
    results.push(result);
  }
  return results;
}

/* ── the store, offline ──────────────────────────────────────────────── */

function storeChecks(): void {
  console.log('\n▸ the store');

  forgetConversation({ visitorId: VISITOR, conversationId: 'store-a' });
  forgetConversation({ visitorId: VISITOR, conversationId: 'store-b' });
  const first = ledgerFor({ visitorId: VISITOR, conversationId: 'store-a' });
  check(
    'the same visitor and conversation get the same ledger',
    ledgerFor({ visitorId: VISITOR, conversationId: 'store-a' }) === first
  );
  check(
    'a different conversation of the same visitor gets its own',
    ledgerFor({ visitorId: VISITOR, conversationId: 'store-b' }) !== first
  );

  const anonymous = ledgerFor();
  check('no scope means no shared state', ledgerFor() !== anonymous);
  check(
    'a conversation id alone shares nothing',
    ledgerFor({ conversationId: 'store-a' }) !== ledgerFor({ conversationId: 'store-a' })
  );
  check(
    'a visitor id alone shares nothing',
    ledgerFor({ visitorId: VISITOR }) !== ledgerFor({ visitorId: VISITOR })
  );

  forgetConversation({ visitorId: VISITOR, conversationId: 'store-a' });
  check(
    'a forgotten conversation starts over',
    ledgerFor({ visitorId: VISITOR, conversationId: 'store-a' }) !== first
  );

  // Trimming drops the oldest rows and keeps sources in step with them.
  const ledger = createEvidenceLedger();
  for (let index = 1; index <= 60; index += 1) {
    const id = `e${index}`;
    ledger.rows.set(id, `row ${index}`);
    ledger.sources.set(id, { sourceId: 's', title: 'T', url: 'https://example.org' });
  }
  trimLedger(ledger);
  check('trimming caps the rows', ledger.rows.size <= 40, `${ledger.rows.size}`);
  check('trimming keeps sources in step', ledger.sources.size === ledger.rows.size);
  check('trimming drops the oldest first', !ledger.rows.has('e1') && ledger.rows.has('e60'));

  forgetConversation({ visitorId: VISITOR, conversationId: 'store-a' });
  forgetConversation({ visitorId: VISITOR, conversationId: 'store-b' });
}

/* ── prose can never write state ─────────────────────────────────────── */

async function provenanceChecks(): Promise<void> {
  console.log('\n▸ only evidence writes');

  const id = 'state-prose';
  forgetConversation({ visitorId: VISITOR, conversationId: id });

  // Conversation with no lookup in it at all.
  await converse(['hey whats up', 'thanks, that helps'], id);
  const afterChat = ledgerFor({ visitorId: VISITOR, conversationId: id });
  console.log(`   after small talk: ${afterChat.rows.size} rows`);
  check('small talk writes no evidence', afterChat.rows.size === 0, `${afterChat.rows.size} rows`);

  // Ground something, then have the student assert a contradiction.
  const groundedId = 'state-conflict';
  forgetConversation({ visitorId: VISITOR, conversationId: groundedId });
  await converse(['what time does the bradley center close today'], groundedId);
  const ledger = ledgerFor({ visitorId: VISITOR, conversationId: groundedId });
  const grounded = [...ledger.rows.values()].join(' ');
  const rowsAfterGrounding = ledger.rows.size;
  check('a lookup writes evidence', rowsAfterGrounding > 0);

  await converse(
    [
      'what time does the bradley center close today',
      'no, I am pretty sure it closes at 3pm and it is called the Bradley Pavilion',
    ],
    groundedId
  );
  const after = [...ledgerFor({ visitorId: VISITOR, conversationId: groundedId }).rows.values()].join(' ');
  console.log(`   rows still describe the dataset, not the claim: ${!after.includes('Bradley Pavilion')}`);
  check('a contradicting claim does not enter the evidence', !after.includes('Bradley Pavilion'));
  check('the grounded rows survive the contradiction', after.includes(grounded.slice(0, 40)));

  forgetConversation({ visitorId: VISITOR, conversationId: id });
  forgetConversation({ visitorId: VISITOR, conversationId: groundedId });
}

/* ── the failure this state was added for ────────────────────────────── */

const DERIVED_FOLLOW_UPS = [
  'which of those two closes earlier',
  'so which one closes first',
  'how much longer is the library open than the bookstore',
  'remind me both of those closing times',
];

async function reuseChecks(): Promise<void> {
  console.log('\n▸ reused facts keep their source');

  let sourced = 0;
  let redundant = 0;
  for (const [index, followUp] of DERIVED_FOLLOW_UPS.entries()) {
    const id = `state-reuse-${index}`;
    forgetConversation({ visitorId: VISITOR, conversationId: id });
    const results = await converse(
      ['what are the library hours today', 'what about the bookstore', followUp],
      id
    );
    const last = results[2];
    if (last.citations.length > 0) sourced += 1;
    console.log(
      `   "${followUp}" — citations: ${last.citations.length}, fresh lookups: ${last.toolsInvoked.length}`
    );
    check(`"${followUp}": answered something`, last.answer.trim().length > 0);
    // Whether a fresh lookup was needed is a cost question, not a correctness
    // one: the answer is right either way. Counted and printed, never asserted.
    if (last.toolsInvoked.length > 0) redundant += 1;
    forgetConversation({ visitorId: VISITOR, conversationId: id });
  }

  // Before this state existed the count here was zero, every time. Citing a
  // reused fact is a model decision, so an occasional miss is expected — a
  // regression would take the count back to nothing.
  console.log(`   ${sourced}/${DERIVED_FOLLOW_UPS.length} restated facts carried a source`);
  console.log(
    `   ${redundant}/${DERIVED_FOLLOW_UPS.length} needed a fresh lookup (cost, not correctness)`
  );
  check(
    'reused facts are cited rather than restated bare',
    sourced >= DERIVED_FOLLOW_UPS.length - 1,
    `${sourced} of ${DERIVED_FOLLOW_UPS.length}`
  );
}

/* ── evidence stays inside one visitor's conversation ───────────────── */

async function isolationChecks(): Promise<void> {
  console.log('\n▸ isolation');

  const other = 'visitor-other';
  const shared = 'shared-conversation-id';
  const second = 'second-conversation-id';
  const scopes = [
    { visitorId: VISITOR, conversationId: shared },
    { visitorId: VISITOR, conversationId: second },
    { visitorId: other, conversationId: shared },
  ];
  for (const scope of scopes) forgetConversation(scope);

  // One visitor grounds something in one conversation.
  await converse(['what are the library hours today'], shared, VISITOR);
  const owner = ledgerFor(scopes[0]).rows.size;

  // The same visitor, a different conversation.
  const sameVisitorElsewhere = ledgerFor(scopes[1]).rows.size;

  // A different visitor presenting the *same* conversation id.
  const otherVisitorSameId = ledgerFor(scopes[2]).rows.size;

  console.log(`   owner: ${owner} rows`);
  console.log(`   same visitor, other conversation: ${sameVisitorElsewhere} rows`);
  console.log(`   other visitor, same conversation id: ${otherVisitorSameId} rows`);

  check('the owning conversation kept its evidence', owner > 0);
  check('another conversation of the same visitor is separate', sameVisitorElsewhere === 0);
  check(
    'repeating a conversation id as another visitor reveals nothing',
    otherVisitorSameId === 0
  );

  // The key cannot be forged by stuffing a separator into an identifier.
  check(
    'identifiers cannot be rearranged into another key',
    scopeKey({ visitorId: 'a', conversationId: 'b","c' }) !==
      scopeKey({ visitorId: 'a","b', conversationId: 'c' })
  );
  check('a half scope has no key', scopeKey({ visitorId: VISITOR }) === null);

  for (const scope of scopes) forgetConversation(scope);
}

/* ── the store stays bounded ─────────────────────────────────────────── */

function boundsChecks(): void {
  console.log('\n▸ bounds');
  const before = trackedConversations();
  for (let index = 0; index < 400; index += 1) {
    ledgerFor({ visitorId: `bulk-${index}`, conversationId: 'c' });
  }
  const after = trackedConversations();
  console.log(`   ${before} tracked before, ${after} after 400 conversations`);
  check('tracked conversations stay capped', after <= 200, `${after}`);
}

async function main(): Promise<void> {
  storeChecks();
  await provenanceChecks();
  await reuseChecks();
  await isolationChecks();
  boundsChecks();

  console.log('\n' + '─'.repeat(70));
  if (failures.length === 0) {
    console.log('Conversation evidence held: reused facts kept their source, prose wrote nothing.');
    return;
  }
  console.log(`${failures.length} failure(s):`);
  for (const failure of failures) console.log(`  ✗ ${failure}`);
  process.exitCode = 1;
}

void main();
