/** A stand-in for the Jev API, for tests. */

import { mock } from 'node:test';
import { JEV_MODEL } from './judge';

export interface JevRequest {
  url: string;
  authorization: string | null;
  body: {
    model: string;
    state: Record<string, string>;
    questions: Record<string, { type: string; criteria?: Record<string, string> }>;
  };
}

/**
 * Stands in for the Jev API. `answer` gets each request's single question and
 * returns what Jev would put under its key. Other URLs go to `other`.
 */
export function fakeJev(
  answer: (key: string, request: JevRequest) => unknown,
  other: (url: string) => Response = (url) => {
    throw new Error(`unexpected request to ${url}`);
  }
): JevRequest[] {
  const requests: JevRequest[] = [];
  mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (!url.startsWith('https://api.typesafe.ai/')) return other(url);
    const request: JevRequest = {
      url,
      authorization: new Headers(init?.headers).get('authorization'),
      body: JSON.parse(String(init?.body)),
    };
    requests.push(request);
    const [key] = Object.keys(request.body.questions);
    return Response.json({
      id: 'sys-test',
      model: JEV_MODEL,
      answers: { [key]: answer(key, request) },
      usage: { input_tokens: 50_000, output_tokens: 3 },
    });
  });
  return requests;
}

/** A pick-one answer with all the weight on `choice`. */
export function sure(choice: string, options: string[], confidence = 0.97): unknown {
  const rest = (1 - confidence) / (options.length - 1);
  return {
    type: 'choice',
    choice,
    confidence,
    probabilities: Object.fromEntries(
      options.map((option) => [option, option === choice ? confidence : rest])
    ),
  };
}
