import { answerQuestion, type BrainAnswer, type ChatTurnV2 } from './client';

export function assertChecks(failures: string[]): void {
  if (failures.length) throw new Error(`\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

export function check(failures: string[], label: string, condition: boolean, detail = ''): void {
  if (!condition) failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

export async function conversation(
  messages: string[],
  options: { conversationId: string; visitorId?: string; now?: Date }
): Promise<BrainAnswer[]> {
  const history: ChatTurnV2[] = [];
  const results: BrainAnswer[] = [];
  for (const message of messages) {
    const result = await answerQuestion({ message, history: [...history], ...options, responseMode: 'concise' });
    results.push(result);
    history.push({ role: 'user', content: message }, { role: 'assistant', content: result.answer });
  }
  return results;
}

export async function recordSuiteResult(params: {
  suite: string;
  totalTests: number;
  passed: number;
  failed: number;
  durationMs: number;
  summary?: Record<string, unknown>;
}): Promise<void> {
  const brainUrl = process.env.BRAIN_URL || 'http://127.0.0.1:8000';
  const runId = `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  try {
    await fetch(`${brainUrl}/v1/evals/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        suite: params.suite,
        totalTests: params.totalTests,
        passed: params.passed,
        failed: params.failed,
        durationMs: params.durationMs,
        summary: params.summary || {},
      }),
    });
  } catch {
    // Non-blocking telemetry
  }
}
