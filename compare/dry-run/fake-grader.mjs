// A grader for a dry run that costs nothing: passes a reply that starts with GOOD.
export default class FakeGrader {
  id() { return 'fake-grader'; }
  async callApi(prompt) {
    const pass = /GOOD:/.test(prompt);
    return { output: JSON.stringify({ pass, score: pass ? 1 : 0, reason: pass ? 'correct (dry run)' : 'wrong (dry run)' }) };
  }
}
