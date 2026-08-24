import { answerQuestion } from './client';
const now = new Date('2026-08-24T14:30:00Z');
const convos: Array<[string, string[]]> = [
  ['ord',  ['What are the next two shuttle departures?', 'What was the first one you listed?']],
  ['evt',  ['When is the next shuttle?', 'What events are happening today?']],
  ['ct',   ['When is the next shuttle?', 'What time did you tell me that shuttle was?']],
  ['prev', ['When is the next shuttle?', 'What about the one after that?', 'And the one before that?']],
];
let fb = 0, total = 0;
for (let rep = 0; rep < 20; rep++) {
  for (const [name, msgs] of convos) {
    const history: Array<{role:'user'|'assistant';content:string}> = [];
    for (const m of msgs) {
      const r = await answerQuestion({ message: m, history: history.slice(-10), now,
        timezone: 'America/New_York', responseMode: 'concise',
        conversationId: `p3-${name}-${rep}`, visitorId: `p3-${name}` });
      history.push({role:'user',content:m},{role:'assistant',content:r.answer});
      total++;
      if (/wasn't able to put together a reliable/.test(r.answer)) { fb++; console.log(`FALLBACK ${name} rep=${rep} q="${m.slice(0,34)}"`); }
    }
  }
}
console.log(`fallbacks ${fb}/${total}`);
