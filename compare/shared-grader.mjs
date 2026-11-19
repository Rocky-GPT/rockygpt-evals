// Share a verdict only inside the evaluation that requested it. The rendered grading
// prompt includes the question, rubric, answer, and the citations shown to the grader.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export function shareGrades(judge) {
  const grades = new Map();
  return async (prompt, context, options) => {
    const key = JSON.stringify([context?.evaluationId, context?.vars?.id, context?.prompt?.config,
                                prompt]);
    const previous = grades.get(key);
    if (previous) {
      const result = await previous;
      return { ...result, cached: true, cost: 0, tokenUsage: { total: 0, numRequests: 0 } };
    }

    const pending = Promise.resolve().then(() => judge(prompt, context, options));
    grades.set(key, pending);
    try {
      const result = await pending;
      if (result.error || !result.output) grades.delete(key);
      return result;
    } catch (error) {
      grades.delete(key);
      throw error;
    }
  };
}

const providerId = process.env.COMPARE_GRADER || 'openai:responses:gpt-6-luna';
let provider;
// The workflow installs Promptfoo alongside the two Brain checkouts. Load the delegate
// from that same CLI installation, including when it lives outside this repository.
const grade = shareGrades(async (prompt, context, options) => {
  if (!provider) {
    const { loadApiProvider } = createRequire(process.argv[1])('promptfoo');
    const basePath = fileURLToPath(new URL('.', import.meta.url));
    provider = loadApiProvider(providerId, { basePath }).catch(error => {
      provider = undefined;
      throw error;
    });
  }
  return (await provider).callApi(prompt, { ...context, bustCache: true }, options);
});

export default class SharedGrader {
  id() { return providerId; }
  callApi(prompt, context, options) { return grade(prompt, context, options); }
}
