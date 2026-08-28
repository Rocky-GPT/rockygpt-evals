/** Black-box clients used by every evaluation suite. */

export interface ChatTurnV2 { role: 'user' | 'assistant'; content: string }
export interface Citation { sourceId?: string; title: string; url: string; collectedAt?: string }
export interface BrainAnswer {
  answer: string;
  route: string;
  citations: Citation[];
  uiActions: Array<{ type: string; payload?: Record<string, string> }>;
  toolsInvoked: string[];
  toolArguments: Record<string, unknown>;
  debugInfo: Record<string, unknown>;
}
export interface BrainRequest {
  message: string;
  history?: ChatTurnV2[];
  styleMode?: string;
  responseMode?: string;
  timezone?: string;
  conversationId?: string;
  visitorId?: string;
  now?: Date;
}

const RUN = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const scoped = new Map<string, string>();
function runScope(value: string | undefined, prefix: string): string {
  const key = `${prefix}:${value || 'default'}`;
  const existing = scoped.get(key);
  if (existing) return existing;
  const created = `${prefix}_${value || 'default'}_${RUN}`;
  scoped.set(key, created);
  return created;
}

export function brainUrl(): string {
  return (process.env.BRAIN_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
}
export function dataUrl(): string {
  return (process.env.DATA_URL || 'http://127.0.0.1:8100').replace(/\/+$/, '');
}

export function serviceHeaders(): Record<string, string> {
  const token = process.env.STAGING_SERVICE_TOKEN?.trim();
  return token ? { 'x-rockygpt-environment-token': token } : {};
}

export async function answerQuestion(request: BrainRequest): Promise<BrainAnswer> {
  const response = await fetch(`${brainUrl()}/v1/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-rockygpt-origin': 'bot', ...serviceHeaders() },
    body: JSON.stringify({
      ...request,
      now: request.now?.toISOString(),
      conversationId: runScope(request.conversationId, 'conversation'),
      visitorId: runScope(request.visitorId, 'visitor'),
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok || body.error) {
    const error = body.error as { message?: string } | undefined;
    return {
      answer: error?.message || 'RockyGPT is unavailable.',
      route: 'error',
      citations: [],
      uiActions: [],
      toolsInvoked: [],
      toolArguments: {},
      debugInfo: { status: response.status },
    };
  }
  return {
    answer: String(body.answer || ''),
    route: String(body.route || 'standard'),
    citations: Array.isArray(body.citations) ? (body.citations as Citation[]) : [],
    uiActions: Array.isArray(body.uiActions) ? brainActions(body.uiActions) : [],
    // Tool internals deliberately do not cross the service boundary. Evals use
    // routes, citations, and presented answers instead.
    toolsInvoked: [],
    toolArguments: {},
    debugInfo: {},
  };
}

function brainActions(value: unknown[]): BrainAnswer['uiActions'] {
  return value.filter((entry): entry is BrainAnswer['uiActions'][number] =>
    Boolean(entry && typeof entry === 'object' && typeof (entry as { type?: unknown }).type === 'string')
  );
}

export async function dataGet<T>(path: string): Promise<T> {
  const response = await fetch(`${dataUrl()}${path}`, {
    headers: serviceHeaders(),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Data service answered ${response.status} for ${path}.`);
  return (await response.json()) as T;
}

export const CANNOT_VERIFY = 'I can’t verify part of that against Ramapo’s official data';
