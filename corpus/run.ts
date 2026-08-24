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
import {
  buildCorpus,
  type GradedAnswer,
  type Outcome,
  type Scenario,
  type Tier,
} from './scenarios';
import { CAMPUS_TIME_ZONE } from './oracle';

/** Repetitions per tier. Consistency is a finding for critical scenarios and
 *  a luxury for broad ones, and a provider quota is a real constraint. */
const REPETITIONS_BY_TIER: Record<Tier, number> = {
  critical: Number(process.env.CORPUS_K_CRITICAL || 5),
  broad: Number(process.env.CORPUS_K_BROAD || 3),
};
const ISO_DATE = process.env.CORPUS_DATE || '2026-08-24';
const LABEL = process.env.CORPUS_LABEL || 'baseline';
const ONLY = process.env.CORPUS_ONLY;
/** Pause between turns. The upstream model provider rate-limited a full run
 *  to death at ~10 turns/minute sustained; the brain's own limiter then
 *  compounded it. Slower and complete beats fast and void. */
const TURN_DELAY_MS = Number(process.env.CORPUS_DELAY_MS || 1_500);
/** A run this contaminated is not a measurement; it aborts instead. */
const MAX_UNSCORABLE_SHARE = 0.1;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ScenarioResult {
  id: string;
  category: string;
  tier: Tier;
  repetitions: number;
  /** Scored, but with one repetition lost to a transport failure. */
  degraded: boolean;
  /** Too few repetitions survived for the score to mean anything. */
  invalid: boolean;
  expected: string;
  outcomes: Outcome[];
  routes: string[][];
  passRate: number;
  consistent: boolean;
  groundingExpected: boolean;
  groundedRate: number;
  scorableRuns: number;
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
      // The browser sends this on every real request
      // (rockygpt-ui/app/page.tsx: Intl.DateTimeFormat().resolvedOptions()).
      // Omitting it here measured a path production never takes: with no
      // timezone the brain puts a bare UTC timestamp in the system prompt and
      // the model reads it as campus local time, putting every hours answer
      // four hours out.
      timezone: CAMPUS_TIME_ZONE,
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
      uiActions: result.uiActions,
    });
    await sleep(TURN_DELAY_MS);
    history.push({ role: 'user', content: message }, { role: 'assistant', content: result.answer });
  }
  return answers;
}

async function scoreScenario(scenario: Scenario): Promise<ScenarioResult> {
  const repetitions = REPETITIONS_BY_TIER[scenario.tier];
  const outcomes: Outcome[] = [];
  const routes: string[][] = [];
  const samples: string[] = [];
  let grounded = 0;

  for (let run = 0; run < repetitions; run += 1) {
    let answers: GradedAnswer[];
    try {
      answers = await runOnce(scenario, run);
    } catch (error) {
      outcomes.push('unscorable');
      routes.push(['error']);
      samples.push(String(error));
      continue;
    }
    // A provider outage is not a wrong answer. client.ts turns a non-OK
    // response into {route: 'error'} rather than throwing, so without this
    // the grader reads "The model provider is unavailable." as an answer that
    // simply lacks the expected value and scores it `fail` — making an outage
    // indistinguishable from a brain that gets everything wrong.
    const outcome: Outcome = answers.some((entry) => entry.route === 'error')
      ? 'unscorable'
      : scenario.grade(answers);
    outcomes.push(outcome);
    routes.push(answers.map((entry) => entry.route));
    const final = answers[answers.length - 1];
    if (final.route === 'standard' && final.citations > 0) grounded += 1;
    if (outcome !== 'pass' && samples.length < 2) samples.push(final.answer.slice(0, 300));
  }

  const scorable = outcomes.filter((outcome) => outcome !== 'unscorable');
  const passes = outcomes.filter((outcome) => outcome === 'pass').length;
  // One lost repetition still says something; two or more does not. Without
  // this a scenario whose single surviving request happened to pass would be
  // reported as 100% correct.
  const invalid = scorable.length <= repetitions - 2;
  return {
    tier: scenario.tier,
    repetitions,
    degraded: scorable.length === repetitions - 1,
    invalid,
    scorableRuns: invalid ? 0 : scorable.length,
    id: scenario.id,
    category: scenario.category,
    expected: scenario.expected,
    outcomes,
    routes,
    passRate: invalid || scorable.length === 0 ? 0 : passes / scorable.length,
    consistent: new Set(outcomes).size === 1,
    groundingExpected: scenario.groundingExpected,
    groundedRate: grounded / repetitions,
    samples,
  };
}

function report(results: ScenarioResult[]): void {
  const categories = [...new Set(results.map((result) => result.category))].sort();
  console.log(
    `\n=== ${LABEL} — k=${REPETITIONS_BY_TIER.critical} critical / ` +
      `${REPETITIONS_BY_TIER.broad} broad, date=${ISO_DATE} ===\n`
  );
  const invalidRows = results.filter((row) => row.invalid);
  const degradedRows = results.filter((row) => row.degraded && !row.invalid);

  for (const category of categories) {
    const rows = results.filter(
      (result) => result.category === category && result.scorableRuns > 0
    );
    if (rows.length === 0) {
      console.log(`${category.padEnd(16)}     -   (no scorable runs)`);
      continue;
    }
    const rate = rows.reduce((sum, row) => sum + row.passRate, 0) / rows.length;
    const consistent = rows.filter((row) => row.consistent).length / rows.length;
    console.log(
      `${category.padEnd(16)} ${(rate * 100).toFixed(1).padStart(5)}%  ` +
        `(${rows.length} scored, consistency ${(consistent * 100).toFixed(0)}%)`
    );
  }

  const scored = results.filter((row) => row.scorableRuns > 0);
  const overall = scored.reduce((sum, row) => sum + row.passRate, 0) / (scored.length || 1);
  const consistency = scored.filter((row) => row.consistent).length / (scored.length || 1);
  const needGrounding = scored.filter((row) => row.groundingExpected);
  const groundingRecall =
    needGrounding.reduce((sum, row) => sum + row.groundedRate, 0) / (needGrounding.length || 1);

  console.log(`\n${'OVERALL'.padEnd(16)} ${(overall * 100).toFixed(1).padStart(5)}%`);
  console.log(`${'consistency'.padEnd(16)} ${(consistency * 100).toFixed(1).padStart(5)}%  (all k runs agreed)`);
  console.log(`${'grounding recall'.padEnd(16)} ${(groundingRecall * 100).toFixed(1).padStart(5)}%  (of scenarios requiring evidence)`);
  if (degradedRows.length) {
    console.log(`${'degraded'.padEnd(16)} ${String(degradedRows.length).padStart(5)}    scenarios lost one repetition`);
  }
  if (invalidRows.length) {
    console.log(`${'invalid'.padEnd(16)} ${String(invalidRows.length).padStart(5)}    scenarios excluded — too few scorable runs`);
  }

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
const onlyCategories = ONLY ? new Set(ONLY.split(',').map((value) => value.trim())) : null;
const selected = onlyCategories ? corpus.filter((scenario) => onlyCategories.has(scenario.category)) : corpus;
const plannedTurns = selected.reduce(
  (sum, scenario) => sum + REPETITIONS_BY_TIER[scenario.tier] * scenario.messages.length,
  0
);
console.log(
  `Running ${selected.length} scenarios ` +
    `(${selected.filter((s) => s.tier === 'critical').length} critical, ` +
    `${selected.filter((s) => s.tier === 'broad').length} broad) = ${plannedTurns} turns.`
);

const results: ScenarioResult[] = [];
for (const scenario of selected) {
  const result = await scoreScenario(scenario);
  results.push(result);
  process.stdout.write(`${result.passRate === 1 ? '.' : 'x'}`);
}

const totalRuns = results.reduce((sum, row) => sum + row.repetitions, 0);
const unscorableRuns = results.reduce(
  (sum, row) => sum + (row.repetitions - row.scorableRuns),
  0
);
const unscorableShare = unscorableRuns / (totalRuns || 1);
if (unscorableShare > MAX_UNSCORABLE_SHARE) {
  console.error(
    `\nABORTED — ${unscorableRuns}/${totalRuns} runs were unscorable ` +
      `(${(unscorableShare * 100).toFixed(1)}%, threshold ${MAX_UNSCORABLE_SHARE * 100}%). ` +
      `This is a provider or service failure, not a measurement. Nothing written.`
  );
  process.exit(1);
}

report(results);
const outfile = `corpus/results-${LABEL}.json`;
writeFileSync(
  outfile,
  JSON.stringify({ label: LABEL, k: REPETITIONS_BY_TIER, date: ISO_DATE, results }, null, 2)
);
console.log(`\nWrote ${outfile}`);
