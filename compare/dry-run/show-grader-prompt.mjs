// A free grader that writes every prompt the real grader would get to $SHOW_PROMPTS (and passes
// all), so a dry run can check the key reaches the grader filled in, never as {{ blanks }}.
import fs from 'node:fs';
export default class ShowGraderPrompt {
  id() { return 'show-grader-prompt'; }
  async callApi(prompt) {
    fs.appendFileSync(process.env.SHOW_PROMPTS ?? 'grader-prompts.txt', `${prompt}\n=====\n`);
    return { output: JSON.stringify({ pass: true, score: 1, reason: 'correct (dry run)' }) };
  }
}
