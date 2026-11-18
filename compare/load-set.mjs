// The questions of one frozen set as promptfoo tests. SET is a blind-set folder
// (questions-frozen.json + answer-key.json, the shape of every blind set since 2026-11-18) or a
// keyed file such as steady-ruler/open/open-half.json. ONLY=pp-01,ec-03 asks only those ids.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function frozen(file, hashFile) {
  const raw = fs.readFileSync(file);
  if (fs.existsSync(hashFile)) {
    const want = fs.readFileSync(hashFile, 'utf8').trim().split(/\s+/)[0];
    const got = crypto.createHash('sha256').update(raw).digest('hex');
    if (want !== got) throw new Error(`${file} changed since it was frozen (sha256 ${got}, expected ${want}).`);
  }
  return JSON.parse(raw.toString('utf8'));
}

// Either a blind-set folder (questions-frozen.json + answer-key.json) or one keyed file where each
// row holds the question and its key, like steady-ruler/open/open-half.json (hash beside it).
function readRows(where) {
  if (where.endsWith('.json')) return frozen(where, where.replace(/\.json$/, '.sha256'));
  const questions = frozen(path.join(where, 'questions-frozen.json'), path.join(where, 'questions-frozen.sha256'));
  const key = new Map(JSON.parse(fs.readFileSync(path.join(where, 'answer-key.json'), 'utf8')).map(row => [row.id, row]));
  return questions.map(q => {
    if (!key.has(q.id)) throw new Error(`${q.id} has no row in answer-key.json.`);
    return { ...key.get(q.id), ...q };
  });
}

export default function loadSet() {
  const set = process.env.SET;
  if (!set) throw new Error('Set SET to a question set folder or a keyed .json file.');
  const rows = readRows(path.resolve(process.env.PROMPTFOO_CONFIG_DIR ?? process.cwd(), set));
  const only = new Set((process.env.ONLY ?? '').split(',').map(id => id.trim()).filter(Boolean));
  return rows
    .filter(row => !only.size || only.has(row.id))
    .map(row => ({
      description: row.id,
      vars: {
        id: row.id, area: row.area ?? '', kind: row.kind ?? '', question: row.question,
        expected: row.expected ?? '', must_not: row.must_not ?? '',
        status: row.status ?? '', note: row.note ?? '', source: row.source ?? '',
      },
      metadata: { id: row.id, area: row.area ?? '', kind: row.kind ?? '' },
    }));
}
