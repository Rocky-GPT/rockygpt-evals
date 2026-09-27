/**
 * Jev as an answer grader.
 *
 * Word matching reads what an answer *claims* badly. One hours check found both
 * "open" and "closed" in correct answers and voided two whole runs
 * (corpus/VOID-hours-grader-bug.md). Jev, TypeSafe's classifier, answers a
 * yes/no or pick-one question about a piece of text for about $0.0001, so a run
 * of ~120 answers costs about a cent.
 *
 * Jev only decides when it is sure. Without a key, when a call fails, or when
 * Jev is unsure, the old word check decides instead, exactly as before. Every
 * decision records which grader made it and what the other one said, so a
 * disagreement can be read afterwards instead of trusted blindly.
 *
 * The request mirrors rockygpt-brain's routing call (core/provider.py
 * JevProvider, core/routing.py): one System One request with a `state` and
 * `noul` (yes/no) or `choice` questions.
 */

const JEV_URL = 'https://api.typesafe.ai/v1/systemone';
/** Pinned like the Brain's routing model (rockygpt-brain release.json). */
export const JEV_MODEL = 'jev-1.13.0';
/** Jev decides only at or above this, the Brain's routing threshold. */
const SURE = 0.9;
/** TypeSafe's price per input token, in nanodollars. Output tokens are free. */
const INPUT_NUSD = 42;
const TIMEOUT_MS = 15_000;

/** The Brain's variable name works too, so one key line can serve both repos. */
export function jevKey(): string | undefined {
  return (process.env.TYPESAFE_API_KEY || process.env.BRAIN_TYPESAFE_API_KEY)?.trim() || undefined;
}

export type JevState = Record<string, string>;

type Question =
  | { type: 'noul'; instructions: string }
  | { type: 'choice'; instructions: string; criteria: Record<string, string> };

type Answer =
  | { type: 'noul'; noul: number }
  | { type: 'choice'; choice: string; confidence: number; probabilities: Record<string, number> };

export interface Judgement {
  check: string;
  /** Whose verdict counted. */
  by: 'jev' | 'words';
  /** Jev's verdict, or why it gave none: off (no key), error, unsure. */
  jev: string;
  /** The old word check's verdict, always computed so the two can be compared. */
  words: string;
}

const tally = {
  calls: 0,
  inputTokens: 0,
  jev: 0,
  words: 0,
  off: 0,
  error: 0,
  unsure: 0,
  disagreed: 0,
  unreadable: 0,
};
let pending: Judgement[] = [];
let warned = false;

function probability(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error('Jev sent an invalid probability');
  }
  return value;
}

/** The same checks the Brain's validate_answers applies before trusting Jev. */
function validAnswer(raw: unknown, question: Question): Answer {
  const answer = raw as Record<string, unknown> | null | undefined;
  if (!answer || typeof answer !== 'object' || answer.type !== question.type) {
    throw new Error('Jev answered the wrong question type');
  }
  if (question.type === 'noul') return { type: 'noul', noul: probability(answer.noul) };

  const options = Object.keys(question.criteria);
  const probabilities = answer.probabilities as Record<string, unknown> | null | undefined;
  if (
    !probabilities ||
    typeof probabilities !== 'object' ||
    Object.keys(probabilities).sort().join('\n') !== [...options].sort().join('\n')
  ) {
    throw new Error('Jev answered with different options');
  }
  const values = Object.fromEntries(
    options.map((option) => [option, probability(probabilities[option])])
  );
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  const choice = answer.choice;
  if (
    typeof choice !== 'string' ||
    !options.includes(choice) ||
    Math.abs(total - 1) > 0.001 ||
    values[choice] < Math.max(...Object.values(values))
  ) {
    throw new Error('Jev sent an invalid choice');
  }
  return {
    type: 'choice',
    choice,
    confidence: probability(answer.confidence),
    probabilities: values,
  };
}

async function askJev(
  key: string,
  state: JevState,
  question: Question,
  apiKey: string
): Promise<Answer> {
  const response = await fetch(JEV_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: JEV_MODEL, state, questions: { [key]: question } }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Jev answered ${response.status}`);
  const body = (await response.json()) as {
    answers?: Record<string, unknown>;
    usage?: { input_tokens?: unknown };
  };
  // Billed whether or not the answer turns out usable.
  tally.calls += 1;
  const tokens = Number(body.usage?.input_tokens);
  if (Number.isFinite(tokens)) tally.inputTokens += tokens;
  return validAnswer(body.answers?.[key], question);
}

async function decide(
  check: string,
  state: JevState,
  question: Question,
  words: string | null,
  read: (answer: Answer) => string | null
): Promise<string | null> {
  const apiKey = jevKey();
  let jev = 'off';
  let verdict: string | null = null;
  if (apiKey) {
    try {
      verdict = read(await askJev(check, state, question, apiKey));
      jev = verdict ?? 'unsure';
    } catch (error) {
      jev = 'error';
      if (!warned) {
        warned = true;
        console.warn(
          `Jev grading failed (${error instanceof Error ? error.message : error}); word checks decide instead.`
        );
      }
    }
  }
  const judgement: Judgement = {
    check,
    by: verdict === null ? 'words' : 'jev',
    jev,
    words: words ?? 'unreadable',
  };
  pending.push(judgement);
  tally[judgement.by] += 1;
  if (jev === 'off' || jev === 'error' || jev === 'unsure') tally[jev] += 1;
  if (judgement.by === 'jev' && judgement.words !== jev) {
    tally.disagreed += 1;
    if (words === null) tally.unreadable += 1;
  }
  return verdict ?? words;
}

/** A yes/no question about an answer. `words` is the old check's verdict. */
export async function judgeYes(
  check: string,
  state: JevState,
  instructions: string,
  words: boolean | null
): Promise<boolean | null> {
  const verdict = await decide(
    check,
    state,
    { type: 'noul', instructions },
    words === null ? null : words ? 'yes' : 'no',
    (answer) => {
      if (answer.type !== 'noul') return null;
      if (answer.noul >= SURE) return 'yes';
      if (answer.noul <= 1 - SURE) return 'no';
      return null;
    }
  );
  return verdict === null ? null : verdict === 'yes';
}

/** A pick-one question about an answer. `words` is the old check's verdict. */
export async function judgeChoice<K extends string>(
  check: string,
  state: JevState,
  instructions: string,
  criteria: Record<K, string>,
  words: NoInfer<K> | null
): Promise<K | null> {
  const verdict = await decide(
    check,
    state,
    { type: 'choice', instructions, criteria },
    words,
    (answer) => {
      if (answer.type !== 'choice') return null;
      return Math.min(answer.confidence, answer.probabilities[answer.choice]) >= SURE
        ? answer.choice
        : null;
    }
  );
  return verdict as K | null;
}

/** Judgements made since the last call, for storing beside the answer they graded. */
export function takeJudgements(): Judgement[] {
  const taken = pending;
  pending = [];
  return taken;
}

/** One line on who graded what and what Jev cost, or null when nothing was judged. */
export function graderSummary(): string | null {
  const total = tally.jev + tally.words;
  if (total === 0) return null;
  if (tally.off === total)
    return 'grader: word checks only (set TYPESAFE_API_KEY to grade with Jev)';
  const dollars = (tally.inputTokens * INPUT_NUSD) / 1e9;
  return (
    `grader: Jev decided ${tally.jev} of ${total} checks, word checks ${tally.words} ` +
    `(Jev unsure ${tally.unsure}, failed ${tally.error}). ` +
    `Jev and the word check disagreed on ${tally.disagreed}` +
    (tally.unreadable ? `, ${tally.unreadable} of them unreadable by words` : '') +
    `. Jev cost about $${dollars.toFixed(4)} for ${tally.calls} calls.`
  );
}

/** For tests: forget everything judged so far. */
export function resetJudge(): void {
  for (const key of Object.keys(tally) as Array<keyof typeof tally>) tally[key] = 0;
  pending = [];
  warned = false;
}
