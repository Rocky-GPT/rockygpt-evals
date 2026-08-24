/**
 * Scored corpus runner.
 *
 * Each scenario runs k times. Rocky is measurably nondeterministic on identical
 * input — the same question was observed grounding on some runs and not others
 * — so a single run is a coin flip reported as a measurement. What this records
 * per scenario is a pass *rate*, plus whether all k runs agreed at all
 * (consistency), which is its own signal independent of correctness.
 *
 * Results are written as JSON so a later run (after a fix) can be compared
 * against this one scenario by scenario.
 */

import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { answerQuestion, type ChatTurnV2 } from '../client';
import { buildCorpus, type GradedAnswer, type Outcome, type Scenario } from './scenarios';

const REPETITIONS = Number(process.env.CORPUS_K || 5);
const ISO_DATE = process.env.CORPUS_DATE || '2026-08-24';
const LABEL = process.env.CORPUS_LABEL || 'baseline';
const ONLY = process.env.CORPUS_ONLY;

interface ScenarioResult {
  id: string;
  category: string;
  expected: string;
  outcomes: Outcome[];
  routes: string[][];
  passRate: number;
  consistent: boolean;
  groundingExpected: boolean;
  groundedRate: number;
  samples: string[];
}

async function runOnce(scenario: Scenario, run: number): Promise<GradedAnswer[]> {
  const history: ChatTurnV2[] = [];
  const answers: GradedAnswer[] = [];
  for (const message of scenario.messages) {
    const result = await answerQuestion({
      message,
      history: [...history],
      now: scenario.now,
      responseMode: 'concise',
      // A fresh conversation per repetition: reusing one would let turn 1 of
      // run 2 see run 1's history and stop being the same measurement.
      conversationId: `corpus-${scenario.id}-${run}`,
      visitorId: `corpus-${scenario.id}`,
    });
    answers.push({
      answer: result.answer,
      route: result.route,
      citations: result.citations.length,
    });
    history.push({ role: 'user', content: message }, { role: 'assistant', content: result.answer });
  }
  return answers;
}

async function scoreScenario(scenario: Scenario): Promise<ScenarioResult> {
  const outcomes: Outcome[] = [];
  const routes: string[][] = [];
  const samples: string[] = [];
  let grounded = 0;

  for (let run = 0; run < REPETITIONS; run += 1) {
    let answers: GradedAnswer[];
    try {
      answers = await runOnce(scenario, run);
    } catch (error) {
      outcomes.push('unscorable');
      routes.push(['error']);
      samples.push(String(error));
      continue;
    }
    const outcome = scenario.grade(answers);
    outcomes.push(outcome);
    routes.push(answers.map((entry) => entry.route));
    const final = answers[answers.length - 1];
    if (final.route === 'standard' && final.citations > 0) grounded += 1;
    if (outcome !== 'pass' && samples.length < 2) samples.push(final.answer.slice(0, 300));
  }

  const scorable = outcomes.filter((outcome) => outcome !== 'unscorable');
  const passes = outcomes.filter((outcome) => outcome === 'pass').length;
  return {
    id: scenario.id,
    category: scenario.category,
    expected: scenario.expected,
    outcomes,
    routes,
    passRate: scorable.length ? passes / scorable.length : 0,
    consistent: new Set(outcomes).size === 1,
    groundingExpected: scenario.groundingExpected,
    groundedRate: grounded / REPETITIONS,
    samples,
  };
}

function report(results: ScenarioResult[]): void {
  const categories = [...new Set(results.map((result) => result.category))].sort();
  console.log(`\n=== ${LABEL} — k=${REPETITIONS}, date=${ISO_DATE} ===\n`);

  for (const category of categories) {
    const rows = results.filter((result) => result.category === category);
    const rate = rows.reduce((sum, row) => sum + row.passRate, 0) / rows.length;
    const consistent = rows.filter((row) => row.consistent).length / rows.length;
    console.log(
      `${category.padEnd(16)} ${(rate * 100).toFixed(1).padStart(5)}%  ` +
        `(${rows.length} scenarios, consistency ${(consistent * 100).toFixed(0)}%)`
    );
  }

  const overall = results.reduce((sum, row) => sum + row.passRate, 0) / results.length;
  const consistency = results.filter((row) => row.consistent).length / results.length;
  const needGrounding = results.filter((row) => row.groundingExpected);
  const groundingRecall =
    needGrounding.reduce((sum, row) => sum + row.groundedRate, 0) / (needGrounding.length || 1);

  console.log(`\n${'OVERALL'.padEnd(16)} ${(overall * 100).toFixed(1).padStart(5)}%`);
  console.log(`${'consistency'.padEnd(16)} ${(consistency * 100).toFixed(1).padStart(5)}%  (all k runs agreed)`);
  console.log(`${'grounding recall'.padEnd(16)} ${(groundingRecall * 100).toFixed(1).padStart(5)}%  (of scenarios requiring evidence)`);

  const failures = results.filter((row) => row.passRate < 1).sort((a, b) => a.passRate - b.passRate);
  if (failures.length) {
    console.log(`\n--- ${failures.length} scenarios below 100% ---`);
    for (const row of failures) {
      console.log(
        `\n[${(row.passRate * 100).toFixed(0)}%] ${row.id}\n  expected: ${row.expected}\n  routes: ${row.routes.map((r) => r.join('>')).join(', ')}`
      );
      for (const sample of row.samples) console.log(`  got: ${sample.replace(/\n/g, ' ')}`);
    }
  }
}

const corpus = await buildCorpus(ISO_DATE);
const selected = ONLY ? corpus.filter((scenario) => scenario.category === ONLY) : corpus;
console.log(`Running ${selected.length} scenarios x ${REPETITIONS} repetitions = ${selected.length * REPETITIONS} turns.`);

const results: ScenarioResult[] = [];
for (const scenario of selected) {
  const result = await scoreScenario(scenario);
  results.push(result);
  process.stdout.write(`${result.passRate === 1 ? '.' : 'x'}`);
}

report(results);
const outfile = `corpus/results-${LABEL}.json`;
writeFileSync(outfile, JSON.stringify({ label: LABEL, k: REPETITIONS, date: ISO_DATE, results }, null, 2));
console.log(`\nWrote ${outfile}`);
