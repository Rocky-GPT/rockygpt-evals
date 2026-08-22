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
