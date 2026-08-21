/**
 * Completeness of compound messages.
 *
 * One message can carry several requests. Each one has to end somewhere —
 * answered, declined, or reported unavailable — but none may vanish without a
 * trace. So the checks look for the *subject* of each part, taken from the
 * question rather than from any expected answer: if a part were dropped,
 * nothing would mention what it was about.
 *
 * The reply is the primary place to look. A reply can decline a part without
 * repeating its name, though — "there is no such club" answers a question about
 * a chess club — so a subject found only in the lookups counts as addressed and
 * is printed as such, rather than failing a run over phrasing. Absent from both
 * the reply and the lookups is a genuine drop.
 *
 * Nothing here fixes the number of parts a message may hold, or the wording
 * that joins them.
 *
 *   npm run test:multi
 */

import 'dotenv/config';

import { CANNOT_VERIFY, answerQuestion } from '@rockygpt/brain/src/brain';
import type { ChatTurnV2 } from '@rockygpt/brain/api/contract';

/** Thursday afternoon on campus, pinned so the run does not drift. */
const NOW = new Date('2026-08-20T18:00:00Z');

const failures: string[] = [];

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) return;
  failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

interface Scenario {
  name: string;
  /** Earlier turns, when the compound message is a follow-up. */
  lead?: string;
  ask: string;
  /**
   * One entry per request in the message. Each is a set of words any of which
   * shows the reply engaged with that request. Drawn from the question.
   */
  parts: string[][];
}

const SCENARIOS: Scenario[] = [
  {
    name: 'two requests, one domain',
    ask: 'what time does the library close and when does the bookstore close',
    parts: [['librar'], ['bookstore']],
  },
  {
    name: 'two requests, two domains',
    ask: 'whats for dinner tonight and is there a chess club',
    parts: [['dinner', 'menu'], ['chess']],
  },
  {
    name: 'three requests',
    ask: 'when is spring break, how do I contact financial aid, and what time does the gym open',
    parts: [['spring break'], ['financial aid'], ['gym']],
  },
  {
    name: 'campus request beside a general one',
    ask: 'what is the capital of france and what time does the library close',
    parts: [['france', 'paris'], ['librar']],
  },
  {
    name: 'one part has data, the other does not',
    ask: 'what are the library hours and what are the hours for the esports arena',
    parts: [['librar'], ['esports']],
  },
  {
    name: 'commas, no conjunction',
    ask: 'library hours, gym hours, bookstore hours',
    parts: [['librar'], ['gym'], ['bookstore']],
  },
  {
    name: 'stated as a list',
    ask: 'I need two things: the dining hall hours, also who do I email about housing',
    parts: [['dining'], ['housing', 'reslife']],
  },
  {
    name: 'second request added as an afterthought',
    ask: 'when does the gym open? oh and also whats for lunch',
    parts: [['gym'], ['lunch']],
  },
  {
    name: 'requests buried in prose',
    ask: 'Im trying to plan my day so the library hours would help, and honestly I also need to know if theres a photography club, thanks',
    parts: [['librar'], ['photograph']],
  },
  {
    name: 'five requests across five domains',
    ask: 'library hours, dinner menu, is there a dance club, financial aid contact, and when does fall semester start',
    parts: [['librar'], ['dinner', 'menu'], ['dance'], ['financial aid'], ['fall', 'semester']],
  },
  {
    name: 'compound follow-up carrying a reference',
    lead: 'what time does the library close',
    ask: 'what about the bookstore, and is it open on sunday too',
    parts: [['bookstore'], ['sunday']],
  },
];

async function runScenario(scenario: Scenario): Promise<void> {
  const history: ChatTurnV2[] = [];
  if (scenario.lead) {
    const first = await answerQuestion({ message: scenario.lead, responseMode: 'concise', now: NOW });
    history.push(
      { role: 'user', content: scenario.lead },
      { role: 'assistant', content: first.answer }
    );
  }

  const result = await answerQuestion({
    message: scenario.ask,
    history,
    responseMode: 'concise',
    now: NOW,
  });
  const said = result.answer.toLowerCase();
  const lookedUp = JSON.stringify(Object.values(result.toolArguments)).toLowerCase();

  const inReply = (words: string[]) => words.some((word) => said.includes(word));
  const inLookup = (words: string[]) => words.some((word) => lookedUp.includes(word));
  const viaLookupOnly = scenario.parts.filter((words) => !inReply(words) && inLookup(words));
  const dropped = scenario.parts.filter((words) => !inReply(words) && !inLookup(words));
  const addressed = scenario.parts.length - dropped.length;

  console.log(`\n▸ ${scenario.name}`);
  console.log(`   tools : ${result.toolsInvoked.join(', ') || 'none'}`);
  console.log(`   parts : ${addressed}/${scenario.parts.length} addressed`);
  if (viaLookupOnly.length > 0) {
    console.log(`   note  : ${viaLookupOnly.map((w) => w[0]).join(', ')} — looked up, named only indirectly`);
  }
  if (dropped.length > 0) {
    console.log(`   LOST  : ${dropped.map((w) => w[0]).join(', ')}`);
    console.log(`   reply : ${result.answer.replace(/\s+/g, ' ')}`);
  }

  check(
    `${scenario.name}: every request addressed`,
    dropped.length === 0,
    dropped.length ? `dropped ${JSON.stringify(dropped)}` : ''
  );
  check(`${scenario.name}: produced an answer`, result.answer.trim().length > 0);
  check(`${scenario.name}: not an error`, result.route !== 'error');
}

/**
 * The grounding gate withholds the whole reply, not one sentence. On a compound
 * message that takes the sound parts with it, so the message has to say a reply
 * was held back rather than looking like a single failed answer.
 */
function withholdingIsExplicit(): void {
  console.log('\n▸ withheld replies say so');
  const text = CANNOT_VERIFY.toLowerCase();
  check(
    'the withholding message admits it held the reply back',
    /held back|withheld|whole reply/.test(text),
    CANNOT_VERIFY
  );
  check('and tells the student what to do next', /ask again|ramapo\.edu/.test(text));
}

async function main(): Promise<void> {
  withholdingIsExplicit();
  for (const scenario of SCENARIOS) await runScenario(scenario);

  console.log('\n' + '─'.repeat(70));
  if (failures.length === 0) {
    console.log(`No request was dropped across ${SCENARIOS.length} compound messages.`);
    return;
  }
  console.log(`${failures.length} failure(s):`);
  for (const failure of failures) console.log(`  ✗ ${failure}`);
  process.exitCode = 1;
}

void main();
