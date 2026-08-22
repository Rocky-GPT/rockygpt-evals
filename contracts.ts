import 'dotenv/config';
import { brainUrl, dataUrl, serviceHeaders } from './client';
import { assertChecks, check } from './suite-utils';

const failures: string[] = [];

async function json(url: string, init?: RequestInit): Promise<{ response: Response; body: unknown }> {
  const response = await fetch(url, {
    ...init,
    headers: { ...serviceHeaders(), ...init?.headers },
    signal: AbortSignal.timeout(15_000),
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { response, body };
}

const brainReady = await json(`${brainUrl()}/readiness`);
check(failures, 'brain readiness is available', brainReady.response.ok, String(brainReady.response.status));

const dataReady = await json(`${dataUrl()}/readiness`);
check(failures, 'data readiness is available', dataReady.response.ok, String(dataReady.response.status));

const invalidScalar = await json(`${brainUrl()}/v1/chat`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-rockygpt-origin': 'bot' },
  body: 'null',
});
check(failures, 'brain rejects a JSON scalar without exiting', invalidScalar.response.status === 400);

const oversized = await json(`${brainUrl()}/v1/chat`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-rockygpt-origin': 'bot' },
  body: JSON.stringify({ message: 'x'.repeat(2_001) }),
});
check(failures, 'brain enforces the documented message limit', oversized.response.status === 400);

const map = await json(`${dataUrl()}/v1/map`);
const mapBody = map.body as { locations?: Array<Record<string, unknown>> } | null;
const firstLocation = mapBody?.locations?.[0];
check(failures, 'map endpoint returns locations', map.response.ok && Boolean(firstLocation));
check(
  failures,
  'map location uses the documented type field',
  typeof firstLocation?.type === 'string' && !('kind' in (firstLocation ?? {}))
);

for (const path of ['/v1/shuttle', '/v1/menu', '/v1/dining-hours', '/v1/directory']) {
  const result = await json(`${dataUrl()}${path}`);
  check(failures, `${path} remains available`, result.response.ok, String(result.response.status));
}

assertChecks(failures);
console.log('contracts: passed');
