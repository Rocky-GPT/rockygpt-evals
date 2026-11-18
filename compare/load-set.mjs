// The questions of one frozen set as promptfoo tests: SET names a folder holding
// questions-frozen.json (id, question, area, topic) and answer-key.json (id, expected, must_not,
// status, note), the shape every blind set since 2026-11-18 uses. ONLY=pp-01,ec-03 asks only those.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export default function loadSet() {
  const set = process.env.SET;
  if (!set) throw new Error('Set SET to a question set folder (with questions-frozen.json and answer-key.json).');
  const folder = path.resolve(process.env.PROMPTFOO_CONFIG_DIR ?? process.cwd(), set);
  const questionsFile = path.join(folder, 'questions-frozen.json');
  const raw = fs.readFileSync(questionsFile);
  const hashFile = path.join(folder, 'questions-frozen.sha256');
  if (fs.existsSync(hashFile)) {
    const want = fs.readFileSync(hashFile, 'utf8').trim().split(/\s+/)[0];
    const got = crypto.createHash('sha256').update(raw).digest('hex');
    if (want !== got) throw new Error(`${questionsFile} changed since it was frozen (sha256 ${got}, expected ${want}).`);
  }
  const questions = JSON.parse(raw.toString('utf8'));
  const key = new Map(JSON.parse(fs.readFileSync(path.join(folder, 'answer-key.json'), 'utf8')).map(row => [row.id, row]));
  const only = new Set((process.env.ONLY ?? '').split(',').map(id => id.trim()).filter(Boolean));
  return questions
    .filter(q => !only.size || only.has(q.id))
    .map(q => {
      const answer = key.get(q.id);
      if (!answer) throw new Error(`${q.id} has no row in answer-key.json.`);
      return {
        description: q.id,
        vars: {
          id: q.id, area: q.area ?? '', question: q.question,
          expected: answer.expected ?? '', must_not: answer.must_not ?? '',
          status: answer.status ?? '', note: answer.note ?? '', source: answer.source ?? '',
        },
        metadata: { id: q.id, area: q.area ?? '' },
      };
    });
}
