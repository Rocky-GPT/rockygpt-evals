/**
 * Replay a completed run's stored answers through the current graders.
 *
 * A grader defect used to cost a full re-run — 143 turns and 45 minutes — and
 * the result was a category score that looked plausible and was wrong. Every
 * answer from every repetition is now kept in the results file, so a fixed
 * grader can be applied to a finished run offline, for free, as many times as
 * the grader needs fixing.
 *
 * Hours only for now: its expectation is recoverable from the stored `expected`
 * string, so a scenario does not have to be rebuilt to re-score it.
 *
 * With a Jev key set this makes one paid Jev call per stored answer (about a
 * cent for a whole run); without one it replays the word check alone.
 */

import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { claimsOpenNow } from '../claims';
import { graderSummary, takeJudgements, type Judgement } from '../judge';
import { statesOpen } from './oracle';

interface StoredScenario {
  id: string;
  category: string;
  /** Absent from runs written before the Jev grader. */
  messages?: string[];
  expected: string;
  outcomes: string[];
  passRate: number;
  consistent: boolean;
  repetitions: number;
  scorableRuns?: number;
  invalid?: boolean;
  transcripts: Array<{ outcome: string; answers: string[]; routes: string[]; judgements?: Judgement[] }>;
}

const file = process.argv[2];
if (!file) throw new Error('usage: regrade.ts <results.json>');
const data = JSON.parse(readFileSync(file, 'utf-8')) as { label: string; results: StoredScenario[] };

let changed = 0;
let unreadable = 0;
const rows: StoredScenario[] = [];
for (const scenario of data.results) {
  if (scenario.category !== 'hours') {
    rows.push(scenario);
    continue;
  }
  const truth = scenario.expected.startsWith('open');
  const outcomes: string[] = [];
  const transcripts: StoredScenario['transcripts'] = [];
  for (const run of scenario.transcripts) {
    let outcome = 'unscorable';
    if (!run.routes.includes('error')) {
      const answer = run.answers[run.answers.length - 1];
      const stated = await claimsOpenNow(answer, statesOpen(answer), scenario.messages?.[0]);
      if (stated === null) unreadable += 1;
      else outcome = stated === truth ? 'pass' : 'fail';
    }
    outcomes.push(outcome);
    transcripts.push({ ...run, outcome, judgements: takeJudgements() });
  }
  const scorable = outcomes.filter((outcome) => outcome !== 'unscorable');
  const invalid = scorable.length <= scenario.repetitions - 2;
  const passRate =
    invalid || scorable.length === 0
      ? 0
      : outcomes.filter((outcome) => outcome === 'pass').length / scorable.length;
  if (Math.abs(passRate - scenario.passRate) > 0.001) changed += 1;
  rows.push({
    ...scenario,
    outcomes,
    transcripts,
    passRate,
    consistent: new Set(outcomes).size === 1,
    scorableRuns: invalid ? 0 : scorable.length,
    invalid,
  });
}

const scored = rows.filter((row) => row.scorableRuns !== 0);
const overall = scored.reduce((sum, row) => sum + row.passRate, 0) / (scored.length || 1);
const consistency = scored.filter((row) => row.consistent).length / (scored.length || 1);

console.log(`\n=== regraded ${data.label} ===`);
console.log(`scenarios rescored: ${changed}/${data.results.length}`);
console.log(`unreadable answers: ${unreadable}`);
console.log(`overall ${(overall * 100).toFixed(1)}%   consistency ${(consistency * 100).toFixed(1)}%`);
const graded = graderSummary();
if (graded) console.log(graded);

const out = file.replace(/\.json$/, '-regraded.json');
writeFileSync(out, JSON.stringify({ ...data, label: `${data.label}-regraded`, results: rows }, null, 2));
console.log(`wrote ${out}`);
