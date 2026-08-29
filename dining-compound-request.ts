import 'dotenv/config';
import { answerQuestion, brainUrl, serviceHeaders } from './client';
import { assertChecks, check } from './suite-utils';

// A question naming two meals has to arrive with both of them.
//
// Every earlier stage could be right and the answer still carry one: the plan
// kept `breakfast,dinner`, the lookup returned 87 rows across both, and the
// page was the first 25 of a meal-ordered result — every one of them brunch.
// Asserting on rows would have passed while the student's dinner question went
// unanswered, so this asserts on the prose, and on dish names rather than the
// meal words: those appear in the question, and an answer that merely echoes
// them has demonstrated nothing.
//
// The day and the meals are read from the dataset rather than pinned, because a
// menu is republished daily and a hard-coded date turns into a false failure the
// week after it is written.

interface MenuRecord {
  date: string;
  name: string;
  meal: string;
}

// Read from the brain, not `dataGet`: that helper still points at `DATA_URL`,
// and `rockygpt-data` was retired — the brain owns the campus records now.
const RECORDS = '/v1/capabilities/dining/records';
const response = await fetch(`${brainUrl()}${RECORDS}`, {
  headers: serviceHeaders(),
  signal: AbortSignal.timeout(30_000),
});
if (!response.ok) throw new Error(`Brain answered ${response.status} for ${RECORDS}.`);
const { records } = (await response.json()) as { records: MenuRecord[] };

const byDate = new Map<string, Map<string, Set<string>>>();
for (const record of records) {
  if (!record.date || !record.meal || !record.name) continue;
  const meals = byDate.get(record.date) ?? new Map<string, Set<string>>();
  const dishes = meals.get(record.meal) ?? new Set<string>();
  dishes.add(record.name);
  meals.set(record.meal, dishes);
  byDate.set(record.date, meals);
}

// The day with the most dishes to tell apart, so neither meal is a token group.
const [day, meals] = [...byDate.entries()]
  .filter(([, served]) => served.size >= 2)
  .sort((a, b) => b[1].size - a[1].size)[0] ?? [undefined, undefined];

const failures: string[] = [];
check(failures, 'the dataset holds a day serving two or more meals', Boolean(day && meals));
assertChecks(failures);

const [first, second] = [...meals!.entries()].sort((a, b) => b[1].size - a[1].size);
// Dishes served at both sittings prove nothing about which one reached the page.
const only = (mine: Set<string>, theirs: Set<string>) => [...mine].filter((dish) => !theirs.has(dish));
const firstOnly = only(first[1], second[1]);
const secondOnly = only(second[1], first[1]);

const { answer } = await answerQuestion({
  message: `What is on the menu today for ${first[0].toLowerCase()} and ${second[0].toLowerCase()}?`,
  now: new Date(`${day}T16:00:00.000Z`),
  conversationId: 'dining-compound',
});

const names = (dishes: string[]) => dishes.filter((dish) => answer.toLowerCase().includes(dish.toLowerCase()));
const fromFirst = names(firstOnly);
const fromSecond = names(secondOnly);

check(failures, 'both meals were distinguishable on the chosen day', firstOnly.length > 0 && secondOnly.length > 0, day);
check(failures, `the answer carries ${first[0]}`, fromFirst.length > 0, `none of ${firstOnly.length} dishes appeared`);
check(failures, `the answer carries ${second[0]}`, fromSecond.length > 0, `none of ${secondOnly.length} dishes appeared`);
assertChecks(failures);

console.log(`dining compound request: passed (${day}, ${first[0]} ${fromFirst.length} + ${second[0]} ${fromSecond.length})`);
