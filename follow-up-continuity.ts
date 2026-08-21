/**
 * Multi-turn continuity check for the brain.
 *
 * A follow-up like "what about on Saturday" only has meaning next to the turn
 * before it. What is checked here is that the answer still concerns the thing
 * under discussion, and still rests on campus data — not that any particular
 * campus fact came back, which would bake an answer into a test.
 *
 * Grounding may arrive two ways: a fresh lookup, or evidence gathered earlier
 * in the conversation and still carrying its source. Both are grounded, so the
 * checks look at the subject and the sources rather than at whether a tool ran
 * on this particular turn.
 *
 * These turns call the real model and the real dataset, so this is an
 * integration check run on demand, like the dining precedence test.
 *
 *   npm run test:follow-ups
 */

import 'dotenv/config';

import { answerQuestion, type BrainAnswer } from '@rockygpt/brain/src/brain';
import type { ChatTurnV2 } from '@rockygpt/brain/api/contract';

interface Turn {
  ask: string;
  /** The subject must still be named, in the answer or in a lookup. */
  mentions?: string[];
  /**
   * The turn must carry sources. Set where the lookup is known to return data,
   * to catch the brain reusing an earlier reply instead of looking again — a
   * reused reply reads fine and cites nothing.
   */
  cited?: boolean;
}

interface Scenario {
  name: string;
  turns: Turn[];
}

/**
 * Paraphrases vary deliberately. A fix that works for "what about on Saturday"
 * but not "how about saturday" has not solved reference resolution.
 */
const SCENARIOS: Scenario[] = [
  {
    name: 'implicit subject, new day',
    turns: [
      { ask: 'what time does the library close today' },
      { ask: 'what about on saturday', mentions: ['librar'], cited: true },
    ],
  },
  {
    name: 'pronoun "it" across a property change',
    turns: [
      { ask: 'is there an astronomy club' },
      { ask: 'how would I get in touch with it', mentions: ['astronomy'], cited: true },
    ],
  },
  {
    name: '"that one" referring to a named result',
    turns: [
      { ask: 'does ramapo have a nursing program' },
      { ask: 'which school is that one in', mentions: ['nursing'], cited: true },
    ],
  },
  {
    name: 'topic switch, then return to the earlier subject',
    turns: [
      { ask: 'what are the hours for the bradley center' },
      { ask: 'what is for dinner tonight' },
      { ask: 'sorry, what were those hours again', mentions: ['bradley'], cited: true },
    ],
  },
  {
    name: '"there" as a place reference',
    turns: [
      { ask: 'where is the health center' },
      { ask: 'what are the hours there', mentions: ['health'] },
    ],
  },
  {
    name: 'property of the same result, possessive pronoun',
    turns: [
      { ask: 'how do I reach the financial aid office' },
      { ask: 'whats their email address', mentions: ['financial', 'aid'], cited: true },
    ],
  },
];

/** The answer plus this turn's lookups, flattened for substring checks. */
function subjectText(result: BrainAnswer): string {
  return `${result.answer} ${JSON.stringify(Object.values(result.toolArguments))}`.toLowerCase();
}

async function runScenario(scenario: Scenario, index: number): Promise<string[]> {
  const failures: string[] = [];
  const history: ChatTurnV2[] = [];
  // The route supplies both a visitor and a conversation on every turn, and
  // retained evidence is scoped to the pair, so the scenarios supply both too.
  const visitorId = 'follow-up-visitor';
  const conversationId = `follow-up-${index}`;

  for (const [index, turn] of scenario.turns.entries()) {
    const label = `${scenario.name} · turn ${index + 1} ("${turn.ask}")`;
    const result = await answerQuestion({
      message: turn.ask,
      history: [...history],
      responseMode: 'concise',
      conversationId,
      visitorId,
    });

    const tools = result.toolsInvoked.join(', ') || 'none';
    console.log(`   ${index + 1}. ${turn.ask}`);
    console.log(`      tools: ${tools}`);
    console.log(`      cites: ${result.citations.map((c) => c.title).join(', ') || 'none'}`);
    console.log(`      says : ${result.answer.replace(/\s+/g, ' ').slice(0, 100)}`);

    if (result.route === 'error') failures.push(`${label}: routed to error`);
    if (!result.answer.trim()) failures.push(`${label}: empty answer`);

    // Grounded either way: a lookup on this turn, or evidence from an earlier
    // one that kept its source.
    if (turn.cited && result.citations.length === 0) {
      failures.push(`${label}: answered without sources`);
    }
    if (turn.mentions) {
      const text = subjectText(result);
      if (!turn.mentions.some((token) => text.includes(token))) {
        failures.push(
          `${label}: lost the subject — none of [${turn.mentions.join(', ')}] appeared`
        );
      }
    }

    history.push({ role: 'user', content: turn.ask });
    history.push({ role: 'assistant', content: result.answer });
  }
  return failures;
}

async function main(): Promise<void> {
  const failures: string[] = [];
  for (const [index, scenario] of SCENARIOS.entries()) {
    console.log(`\n▸ ${scenario.name}`);
    failures.push(...(await runScenario(scenario, index)));
  }

  console.log('\n' + '─'.repeat(70));
  if (failures.length === 0) {
    console.log(`All ${SCENARIOS.length} follow-up scenarios held their subject.`);
    return;
  }
  console.log(`${failures.length} failure(s):`);
  for (const failure of failures) console.log(`  ✗ ${failure}`);
  process.exitCode = 1;
}

void main();
