import assert from 'node:assert/strict';
import test from 'node:test';
import { shareGrades } from './shared-grader.mjs';

test('concurrent copies and repeats share a verdict for one exact grading input', async () => {
  let calls = 0;
  const grade = shareGrades(async () => ({ output: String(++calls), cost: 1 }));
  const context = { evaluationId: 'first', vars: { id: 'course' } };
  const [old, candidate] = await Promise.all([grade('rubric and answer', context),
                                              grade('rubric and answer', context)]);
  assert.equal(old.output, candidate.output);
  assert.equal(candidate.cost, 0);
  assert.equal((await grade('rubric and answer', context)).output, old.output);
  assert.equal(calls, 1);
  await grade('different rubric, answer or citations', context);
  await grade('rubric and answer', { ...context, evaluationId: 'second' });
  assert.equal(calls, 3);
});

test('a failed grade can be retried', async () => {
  let calls = 0;
  const grade = shareGrades(async () => {
    ++calls;
    if (calls === 1) throw new Error('temporary connection failure');
    if (calls === 2) return { error: 'unavailable' };
    return { output: 'graded' };
  });
  await assert.rejects(grade('same prompt'), /temporary connection failure/);
  assert.equal((await grade('same prompt')).error, 'unavailable');
  assert.equal((await grade('same prompt')).output, 'graded');
  assert.equal((await grade('same prompt')).output, 'graded');
  assert.equal(calls, 3);
});
