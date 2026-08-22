/**
 * Runs a question set through the brain as one continuous conversation and
 * writes a full trace for diagnosis.
 *
 * The questions come from a file, never from this script: a harness that
 * carries its own questions turns into a benchmark that flatters whatever it
 * was written beside. Nothing here inspects a question or scores an answer —
 * it records what happened, and judgement comes afterwards from the trace.
 *
 *   npm run test:torture -- <questions-file> [trace-output.jsonl]
 *
 * The file may be:
 *   - .txt   one question per line; `#` comments and blank lines ignored
 *   - .json  an array of strings, an array of objects carrying the question
 *            under question/text/message/prompt, or an object wrapping either
 *
 * A line of exactly `---` (or an entry `"---"`) starts a new conversation, for
 * a set that is deliberately split into separate sessions. Otherwise every turn
 * shares one conversation, one visitor, and the evidence retained along the way.
 *
 * The clock is pinned. Run the same questions at breakfast and at midnight and
 * the transport answers legitimately differ, which makes two runs impossible to
 * compare. Every turn is answered against BENCHMARK_INSTANT unless `--now` says
 * otherwise; production is untouched, since this only fills in the `now` the
 * brain already accepts.
 */

import 'dotenv/config';

import fs from 'node:fs';
import path from 'node:path';
import { answerQuestion, type BrainAnswer, type ChatTurnV2 } from './client';

/** The browser keeps the last ten messages; the run mirrors that exactly. */
const MAX_HISTORY_MESSAGES = 10;

/**
 * Thursday 20 August 2026, 10:00 in the morning on campus. A weekday, so the
 * weekday timetable applies, and early enough that most of the day's trips are
 * still ahead — including several serving more than one destination.
 */
const BENCHMARK_INSTANT = '2026-08-20T14:00:00Z';

const NEW_CONVERSATION = '---';

function questionsFrom(file: string): string[] {
  const raw = fs.readFileSync(file, 'utf-8');

  if (path.extname(file).toLowerCase() === '.json') {
    const parsed: unknown = JSON.parse(raw);
    const list = Array.isArray(parsed)
      ? parsed
      : Object.values(parsed as Record<string, unknown>).find(Array.isArray);
    if (!Array.isArray(list)) throw new Error('no array of questions found in the JSON');

    return list
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry === 'object') {
          const record = entry as Record<string, unknown>;
          for (const key of ['question', 'text', 'message', 'prompt', 'ask', 'input']) {
            if (typeof record[key] === 'string') return record[key] as string;
          }
        }
        return '';
      })
      .filter((question) => question.trim().length > 0);
  }

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

interface Trace {
  turn: number;
  conversation: number;
  message: string;
  answer: string;
  route: string;
  safety: unknown;
  toolsInvoked: string[];
  toolArguments: unknown;
  citations: Array<{ title: string; url: string }>;
  /** Cited without any lookup this turn, so the source came from earlier. */
  reusedRetainedEvidence: boolean;
  evidenceOffered: unknown;
  evidenceUsed: unknown;
  latencyMs: number;
  error: string | null;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const nowFlag = argv.indexOf('--now');
  const pinned = nowFlag >= 0 ? argv[nowFlag + 1] : BENCHMARK_INSTANT;
  const now = new Date(pinned);
  if (Number.isNaN(now.getTime())) {
    console.error(`--now must be an ISO instant, got ${pinned}`);
    process.exitCode = 1;
    return;
  }
  const [file, out] = argv.filter((value, index) => index !== nowFlag && index !== nowFlag + 1);
  if (!file) {
    console.error('usage: npm run test:torture -- <questions-file> [trace-output.jsonl]');
    process.exitCode = 1;
    return;
  }

  const questions = questionsFrom(file);
  const tracePath = out || `torture-trace-${Date.now()}.jsonl`;
  const traces: Trace[] = [];
  const timezone = 'America/New_York';
  const visitorId = `torture-visitor-${Date.now()}`;

  let conversation = 0;
  let conversationId = `torture-${visitorId}-${conversation}`;
  let history: ChatTurnV2[] = [];
  let turn = 0;

  console.log(`${questions.length} questions from ${file}`);
  console.log(
    `clock pinned to ${now.toISOString()} — ` +
      `${new Intl.DateTimeFormat('en-US', { timeZone: timezone, dateStyle: 'full', timeStyle: 'short' }).format(now)} on campus\n`
  );

  for (const question of questions) {
    if (question === NEW_CONVERSATION) {
      conversation += 1;
      conversationId = `torture-${visitorId}-${conversation}`;
      history = [];
      console.log(`\n── new conversation (${conversation}) ──\n`);
      continue;
    }

    turn += 1;
    const started = Date.now();
    let result: BrainAnswer | null = null;
    let error: string | null = null;

    try {
      result = await answerQuestion({
        message: question,
        history: [...history],
        responseMode: 'concise',
        timezone,
        conversationId,
        visitorId,
        now,
      });
    } catch (caught) {
      error = caught instanceof Error ? `${caught.name}: ${caught.message}` : String(caught);
    }
    const latencyMs = Date.now() - started;

    const debug = (result?.debugInfo ?? {}) as Record<string, unknown>;
    const trace: Trace = {
      turn,
      conversation,
      message: question,
      answer: result?.answer ?? '',
      route: result?.route ?? 'runtime-error',
      safety: debug.safety ?? null,
      toolsInvoked: result?.toolsInvoked ?? [],
      toolArguments: result?.toolArguments ?? {},
      citations: (result?.citations ?? []).map((c) => ({ title: c.title, url: c.url })),
      reusedRetainedEvidence:
        (result?.citations.length ?? 0) > 0 && (result?.toolsInvoked.length ?? 0) === 0,
      evidenceOffered: debug.evidenceOffered ?? null,
      evidenceUsed: debug.evidenceUsed ?? null,
      latencyMs,
      error,
    };
    traces.push(trace);
    fs.appendFileSync(tracePath, `${JSON.stringify(trace)}\n`);

    console.log(
      `${String(turn).padStart(3)}. [${trace.route}] ${latencyMs}ms ` +
        `tools=${trace.toolsInvoked.join('|') || '-'} ` +
        `cites=${trace.citations.length}${trace.reusedRetainedEvidence ? '(retained)' : ''}` +
        `${error ? ' ERROR' : ''}`
    );
    console.log(`     Q: ${question.slice(0, 100)}`);
    console.log(`     A: ${(trace.answer || error || '').replace(/\s+/g, ' ').slice(0, 160)}`);

    // Only successful turns enter the history the next turn sees, matching the
    // browser, which drops failed turns.
    if (result && result.answer) {
      history.push({ role: 'user', content: question }, { role: 'assistant', content: result.answer });
      history = history.slice(-MAX_HISTORY_MESSAGES);
    }
  }

  const routes = new Map<string, number>();
  for (const trace of traces) routes.set(trace.route, (routes.get(trace.route) ?? 0) + 1);
  const latencies = traces.map((t) => t.latencyMs).sort((a, b) => a - b);

  console.log('\n' + '─'.repeat(70));
  console.log(`turns: ${traces.length}  conversations: ${conversation + 1}`);
  console.log(`routes: ${[...routes].map(([r, n]) => `${r}=${n}`).join('  ')}`);
  console.log(`runtime errors: ${traces.filter((t) => t.error).length}`);
  console.log(`no lookup and no citation: ${traces.filter((t) => t.toolsInvoked.length === 0 && t.citations.length === 0).length}`);
  console.log(`answered from retained evidence: ${traces.filter((t) => t.reusedRetainedEvidence).length}`);
  console.log(
    `latency median ${latencies[Math.floor(latencies.length / 2)] ?? 0}ms  ` +
      `p90 ${latencies[Math.floor(latencies.length * 0.9)] ?? 0}ms  max ${latencies[latencies.length - 1] ?? 0}ms`
  );
  console.log(`\ntrace written to ${tracePath}`);
}

void main();
