/**
 * Scenario generation.
 *
 * Scenarios are derived from campus data at run time rather than hardcoded, so
 * an expected value cannot go stale when a timetable or a posted schedule
 * changes. What is pinned is the *clock*: every scenario fixes `now`, which the
 * brain accepts and which the oracle uses to compute the same expectation.
 *
 * Boundary cases are placed relative to real published times (one minute
 * before a departure, exactly at a closing minute) so the corpus keeps testing
 * boundaries even after the underlying schedule moves.
 */

import { dataGet } from '../client';
import {
  futureDepartures,
  isOpenAt,
  minutesOfDay,
  nthDeparture,
  parseClock,
  parseSchedule,
  serviceDayFor,
  statesOpen,
  statesTime,
  weekdayName,
  type HoursRecord,
  type ShuttleTrip,
} from './oracle';

export type Outcome = 'pass' | 'fail' | 'unscorable';

export interface GradedAnswer {
  answer: string;
  route: string;
  citations: number;
  uiActions: Array<{ type: string; payload?: Record<string, string> }>;
}

/**
 * How many repetitions a scenario earns.
 *
 * `critical` cases are the ones whose consistency is itself a finding —
 * deterministic selection, boundaries, discourse recall. `broad` cases
 * establish behaviour, and a third run buys far less than it costs.
 */
export type Tier = 'critical' | 'broad';

export interface Scenario {
  id: string;
  category: string;
  tier: Tier;
  messages: string[];
  now: Date;
  /**
   * Minutes to advance the clock for each message, parallel to `messages`.
   *
   * Conversation truth cannot be tested without it: proving Rocky reports what
   * it *said* rather than what is true *now* requires the two to differ, which
   * means time has to pass mid-conversation.
   */
  nowOffsets?: number[];
  /** True when a correct answer must rest on campus evidence. */
  groundingExpected: boolean;
  expected: string;
  grade: (answers: GradedAnswer[]) => Outcome;
}

interface SearchResponse<T> {
  records: T[];
}

/** A Date whose campus-local wall clock is `date` at `minutes` past midnight. */
function campusInstant(isoDate: string, minutes: number): Date {
  // Eastern is UTC-4 in the periods this corpus targets; resolve by probing so
  // the corpus stays correct across a DST boundary rather than assuming.
  const naive = new Date(`${isoDate}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00Z`);
  for (const offset of [4, 5]) {
    const candidate = new Date(naive.getTime() + offset * 3_600_000);
    if (minutesOfDay(candidate) === minutes) return candidate;
  }
  return new Date(naive.getTime() + 4 * 3_600_000);
}

const lastOf = <T>(items: T[]): T => items[items.length - 1];

/** A clock time as a literal for `RegExp`, tolerating spacing around AM/PM. */
function escapeForSearch(time: string): string {
  return time.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
}

/** Venues probed for hours. See hoursScenarios for how they are chosen. */
const MAX_HOURS_VENUES = 6;

/** Mirrors rockygpt-brain brain/tools.py MAX_RECORDS_PER_CALL, so the
 *  corpus can deliberately include venues the tool boundary hides. */
const BRAIN_RECORD_CAP = 8;

export async function transportationScenarios(isoDate: string): Promise<Scenario[]> {
  const probe = campusInstant(isoDate, 12 * 60);
  const serviceDay = serviceDayFor(probe);
  const { records: trips } = await dataGet<SearchResponse<ShuttleTrip>>(
    `/v1/search/shuttles?serviceDay=${serviceDay}`
  );
  const times = trips
    .map((trip) => parseClock(trip.departure))
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);
  if (times.length < 4) return [];

  const scenarios: Scenario[] = [];
  const nextAt = (minutes: number) => nthDeparture(trips, minutes, 1);

  const addNext = (id: string, minutes: number, label: string) => {
    const expectedTrip = nextAt(minutes);
    const now = campusInstant(isoDate, minutes);
    if (!expectedTrip) {
      scenarios.push({
        id,
        category: 'transportation',
        tier: 'critical',
        messages: ['When is the next shuttle?'],
        now,
        groundingExpected: true,
        expected: `no further departures (${label})`,
        grade: ([answer]) =>
          /\b(no|none|last|final|no more|finished|done for)\b/i.test(answer.answer) &&
          futureDepartures(trips, minutes).length === 0
            ? 'pass'
            : 'fail',
      });
      return;
    }
    scenarios.push({
      id,
      category: 'transportation',
      tier: 'critical',
      messages: ['When is the next shuttle?'],
      now,
      groundingExpected: true,
      expected: `${expectedTrip.departure} (${label})`,
      grade: ([answer]) => (statesTime(answer.answer, expectedTrip.departure) ? 'pass' : 'fail'),
    });
  };

  // Mid-service sampling across the day.
  const sampleIndexes = [0, Math.floor(times.length / 3), Math.floor((2 * times.length) / 3)];
  sampleIndexes.forEach((index, n) => {
    addNext(`tx-midday-${n}`, times[index] + 7, `7 min after the ${index + 1}th departure`);
  });

  // Boundaries around a mid-list departure.
  const pivot = times[Math.floor(times.length / 2)];
  addNext('tx-boundary-before', pivot - 1, 'one minute before a departure');
  addNext('tx-boundary-exact', pivot, 'exactly at a departure');
  addNext('tx-boundary-after', pivot + 1, 'one minute after a departure');

  // Before first service and after last service.
  addNext('tx-before-service', Math.max(times[0] - 45, 0), 'before first departure');
  addNext('tx-after-service', Math.min(lastOf(times) + 20, 24 * 60 - 1), 'after last departure');

  // Ordinal follow-up: the departure after the one just given.
  const ordinalFrom = times[Math.floor(times.length / 3)] + 5;
  const second = nthDeparture(trips, ordinalFrom, 2);
  if (second) {
    scenarios.push({
      id: 'tx-ordinal-next',
      category: 'ordinal',
      tier: 'critical',
      messages: ['When is the next shuttle?', 'What about the one after that?'],
      now: campusInstant(isoDate, ordinalFrom),
      groundingExpected: true,
      expected: `${second.departure} (second departure after now)`,
      grade: (answers) => (statesTime(lastOf(answers).answer, second.departure) ? 'pass' : 'fail'),
    });
    scenarios.push({
      id: 'tx-ordinal-miss-phrasing',
      category: 'ordinal',
      tier: 'critical',
      messages: ['When is the next shuttle?', "If I miss that one, what's my next chance?"],
      now: campusInstant(isoDate, ordinalFrom),
      groundingExpected: true,
      expected: `${second.departure} (second departure, indirect phrasing)`,
      grade: (answers) => (statesTime(lastOf(answers).answer, second.departure) ? 'pass' : 'fail'),
    });
  }

  // Conversation truth: what was said earlier, not what is true now.
  const first = nthDeparture(trips, ordinalFrom, 1);
  if (first) {
    scenarios.push({
      id: 'tx-recall-spoken',
      category: 'discourse',
      tier: 'critical',
      messages: [
        'When is the next shuttle?',
        'What is on the menu for lunch?',
        'What time did you say that shuttle was?',
      ],
      now: campusInstant(isoDate, ordinalFrom),
      groundingExpected: false,
      expected: `${first.departure} (the time actually stated in turn 1)`,
      grade: (answers) => {
        // Graded against what turn 1 actually said, not against the timetable:
        // if turn 1 was wrong, a faithful recall repeats the wrong time.
        const spoken = answers[0]?.answer ?? '';
        const target = /(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?/i.exec(spoken)?.[0];
        if (!target) return 'unscorable';
        return statesTime(lastOf(answers).answer, target) ? 'pass' : 'fail';
      },
    });
  }

  return scenarios;
}

export async function hoursScenarios(isoDate: string): Promise<Scenario[]> {
  const probe = campusInstant(isoDate, 12 * 60);
  const day = weekdayName(probe);
  const { records } = await dataGet<SearchResponse<HoursRecord>>(
    `/v1/search/campus-hours?day=${encodeURIComponent(day)}`
  );

  // Every venue would be 10 x 5 probes, and most of them are the same
  // single-window arithmetic. Keep the ones that carry signal the others do
  // not: a venue publishing two windows is the only way to probe the gap
  // between them, and a venue past the tool's record cap is the only way to
  // see an availability failure. Fill the remainder in published order.
  const scored = records
    .map((record, index) => ({ record, index, windows: parseSchedule(record.schedule) }))
    .filter((entry) => entry.windows !== null && entry.windows.length > 0);
  const priority = (entry: (typeof scored)[number]) =>
    (entry.windows!.length > 1 ? 0 : 1) + (entry.index >= BRAIN_RECORD_CAP ? 0 : 1);
  const chosen = [...scored]
    .sort((left, right) => priority(left) - priority(right) || left.index - right.index)
    .slice(0, MAX_HOURS_VENUES);

  const scenarios: Scenario[] = [];
  for (const { record, windows } of chosen.sort((a, b) => a.index - b.index)) {
    if (!windows || windows.length === 0) continue;
    const [first] = windows;
    const probes: Array<[string, number, string]> = [
      ['before-open', Math.max(first.start - 30, 0), 'before opening'],
      ['at-open', first.start, 'exactly at opening'],
      ['mid-open', Math.floor((first.start + first.end) / 2), 'mid-window'],
      ['at-close', lastOf(windows).end, 'exactly at closing'],
      ['after-close', Math.min(lastOf(windows).end + 30, 24 * 60 - 1), 'after closing'],
    ];
    // A venue with two windows gives a free gap probe, the case a single
    // open/close pair cannot express.
    if (windows.length > 1) {
      probes.push(['gap', Math.floor((windows[0].end + windows[1].start) / 2), 'between windows']);
    }

    for (const [suffix, minutes, label] of probes) {
      const truth = isOpenAt(record.schedule, minutes);
      if (truth === null) continue;
      const slug = record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
      scenarios.push({
        id: `hours-${slug}-${suffix}`,
        category: 'hours',
        // The mid-window probe is a control that should never be close; the
        // boundaries and the between-windows gap are the cases the arithmetic
        // actually turns on.
        tier: suffix === 'mid-open' ? 'broad' : 'critical',
        messages: [`Is ${record.name} open right now?`],
        now: campusInstant(isoDate, minutes),
        groundingExpected: true,
        expected: `${truth ? 'open' : 'closed'} (${label}; ${record.schedule})`,
        grade: ([answer]) => {
          const stated = statesOpen(answer.answer);
          // An answer the grader cannot read is a limit of the grader, not a
          // wrong answer. Scoring it `fail` once turned a set of entirely
          // correct replies into a 0% category.
          if (stated === null) return 'unscorable';
          return stated === truth ? 'pass' : 'fail';
        },
      });
    }
  }
  return scenarios;
}

/**
 * Discourse: what Rocky said, as distinct from what is true.
 *
 * The evidence ledger answers "what does official data support". It cannot
 * answer "what did you tell me", and the difference is the whole category. A
 * timetable row proves 2:05 PM is a real departure; only a record of the
 * conversation proves 2:05 PM is the departure this student was given.
 *
 * Every scenario here is graded against **turn one's own text**, not against
 * the data. If turn one was wrong, a faithful recall repeats the wrong time,
 * and that passes. Conflating the two is the failure mode being measured.
 */
export async function discourseScenarios(isoDate: string): Promise<Scenario[]> {
  const probe = campusInstant(isoDate, 12 * 60);
  const serviceDay = serviceDayFor(probe);
  const { records: trips } = await dataGet<SearchResponse<ShuttleTrip>>(
    `/v1/search/shuttles?serviceDay=${serviceDay}`
  );
  const times = trips
    .map((trip) => parseClock(trip.departure))
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);
  if (times.length < 5) return [];

  // Start mid-morning so several departures remain, and so advancing the clock
  // later in a conversation genuinely changes what "next" means.
  const start = times[1] + 5;
  const now = campusInstant(isoDate, start);
  const first = nthDeparture(trips, start, 1);
  const second = nthDeparture(trips, start, 2);
  if (!first || !second) return [];

  /** The first clock time turn one actually stated, whatever it was. */
  const spokenTime = (answers: GradedAnswer[]): string | null =>
    /(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?/i.exec(answers[0]?.answer ?? '')?.[0] ?? null;

  const recallsTurnOne = (answers: GradedAnswer[]): Outcome => {
    const target = spokenTime(answers);
    if (!target) return 'unscorable';
    return statesTime(lastOf(answers).answer, target) ? 'pass' : 'fail';
  };

  const filler = [
    'What is on the menu for lunch?',
    'What clubs can I join?',
    'Where is the library?',
    'When is spring break?',
    'What events are happening today?',
  ];

  const scenarios: Scenario[] = [
    {
      id: 'dsc-immediate-recall',
      category: 'discourse',
      tier: 'critical',
      messages: ['When is the next shuttle?', 'What time did you say?'],
      now,
      groundingExpected: false,
      expected: 'repeats the time stated in turn 1',
      grade: recallsTurnOne,
    },
    {
      id: 'dsc-topic-shift-recall',
      category: 'discourse',
      tier: 'critical',
      messages: [
        'When is the next shuttle?',
        ...filler,
        'What was that shuttle time you told me about earlier?',
      ],
      now,
      groundingExpected: false,
      expected: 'repeats turn 1 across five intervening topics',
      grade: recallsTurnOne,
    },
    {
      id: 'dsc-conversation-truth',
      category: 'discourse',
      tier: 'critical',
      // The clock advances past the departure turn one named, so the current
      // answer and the spoken answer necessarily differ. This is the case the
      // whole category exists for.
      messages: [
        'When is the next shuttle?',
        'What is on the menu for lunch?',
        'What time did you tell me that shuttle was?',
      ],
      now,
      nowOffsets: [0, 200, 200],
      groundingExpected: false,
      expected: 'reports turn 1\'s time, not the departure that is next 200 minutes later',
      grade: (answers) => {
        const target = spokenTime(answers);
        if (!target) return 'unscorable';
        const finalAnswer = lastOf(answers).answer;
        if (!statesTime(finalAnswer, target)) return 'fail';
        // The failure is *substitution* — reporting what is true now in place
        // of what was said. Mentioning both is not that, and an answer like
        // "I originally told you 12:20 PM; the current schedule now shows
        // 3:10 PM" is better than what this scenario asked for. What
        // distinguishes them is order: the spoken value has to lead, because
        // that is what was asked for.
        const currentNext = nthDeparture(trips, start + 200, 1);
        if (!currentNext || parseClock(currentNext.departure) === parseClock(target)) return 'pass';
        const spokenAt = finalAnswer.search(new RegExp(escapeForSearch(target), 'i'));
        const currentAt = finalAnswer.search(
          new RegExp(escapeForSearch(currentNext.departure), 'i')
        );
        if (currentAt === -1) return 'pass';
        return spokenAt !== -1 && spokenAt < currentAt ? 'pass' : 'fail';
      },
    },
    {
      id: 'dsc-ordinal-first',
      category: 'discourse',
      tier: 'critical',
      messages: ['What are the next two shuttle departures?', 'What was the first one you listed?'],
      now,
      groundingExpected: false,
      expected: `${first.departure} (first of the two given)`,
      grade: (answers) => (statesTime(lastOf(answers).answer, first.departure) ? 'pass' : 'fail'),
    },
    {
      id: 'dsc-ordinal-previous',
      category: 'discourse',
      tier: 'critical',
      messages: [
        'When is the next shuttle?',
        'What about the one after that?',
        'And the one before that?',
      ],
      now,
      groundingExpected: false,
      expected: `${first.departure} (stepping back to the originally given trip)`,
      grade: (answers) => (statesTime(lastOf(answers).answer, first.departure) ? 'pass' : 'fail'),
    },
    {
      id: 'dsc-entity-focus',
      category: 'discourse',
      tier: 'critical',
      messages: ['When is the next shuttle?', 'Is the Bradley Center open before that?'],
      now,
      groundingExpected: true,
      expected: 'answers about the Bradley Center, resolving "that" to the shuttle time',
      grade: (answers) => {
        const final = lastOf(answers).answer.toLowerCase();
        if (!final.includes('bradley')) return 'fail';
        return statesOpen(lastOf(answers).answer) === null ? 'unscorable' : 'pass';
      },
    },
    {
      id: 'dsc-false-claim-recall',
      category: 'discourse',
      tier: 'critical',
      // Rocky never mentioned 7:00 AM. Agreeing that it did is the failure the
      // TypeScript discourse record was built to prevent: a row existing in the
      // data is not proof that it was ever said.
      messages: ['When is the next shuttle?', 'Did you tell me about a 7:00 AM shuttle?'],
      now,
      groundingExpected: false,
      expected: 'denies having *said* 7:00 AM (not merely that none exists)',
      grade: (answers) => {
        // Read the opening sentence only, and read it for what it addresses.
        //
        // A correct denial necessarily quotes the time being denied — "No, I
        // did not mention a 7:00 AM shuttle" — so scanning the whole answer for
        // "7:00 AM", or matching "i did" inside "I did not", scores every
        // correct denial as a false agreement. That inversion marked four right
        // answers wrong and the one evasive answer right.
        //
        // "There is no 7:00 AM shuttle" is deliberately a fail. It is true, and
        // it answers a *campus* question when a *conversation* question was
        // asked — which is the exact conflation this scenario exists to detect.
        const final = lastOf(answers).answer.trim();
        const opening = final.split(/(?<=[.!?])\s/)[0] ?? final;
        const CLAIM = /\b(mention(ed)?|tell|told|say|said|provide[d]?|gave|give)\b/i;
        const NEGATED = /\b(no|not|never|didn['\u2019]?t|don['\u2019]?t)\b/i;

        if (CLAIM.test(opening)) return NEGATED.test(opening) ? 'pass' : 'fail';
        if (/^yes\b/i.test(opening)) return 'fail';
        // Neither addressed what was said nor agreed to it: the question was
        // not answered, which is a failure rather than an unreadable answer.
        return 'fail';
      },
    },
  ];
  return scenarios;
}

interface MapResponse {
  locations: Array<{ key: string; name: string; aliases?: string[] }>;
  resolved?: { key: string; name: string } | null;
}

/**
 * Entity resolution and location retrieval.
 *
 * Graded two ways against the same oracle. The text check asks whether the
 * answer names the location the data service itself resolves the query to. The
 * action check asks whether the VIEW_MAP payload carries that location's `key`
 * — a structured signal the model cannot satisfy by paraphrase, and the one the
 * UI actually uses to open the map panel.
 */
export async function mapScenarios(isoDate: string): Promise<Scenario[]> {
  const queries = [
    'Birch Tree Inn',
    'the CSI office',
    'academic building A',
    'the Bradley Center',
    'the bookstore',
    'health services',
    'financial aid',
    'the Sharp Fitness Center',
    'the Anisfield School of Business',
  ];
  const now = campusInstant(isoDate, 13 * 60);
  const scenarios: Scenario[] = [];

  for (const query of queries) {
    const map = await dataGet<MapResponse>(`/v1/map?q=${encodeURIComponent(query)}`);
    const resolved = map.resolved;
    if (!resolved) continue;
    const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28);

    scenarios.push({
      id: `map-name-${slug}`,
      category: 'map',
      tier: 'broad',
      messages: [`Where is ${query}?`],
      now,
      groundingExpected: true,
      expected: `names "${resolved.name}"`,
      grade: ([answer]) => {
        // Match on the distinctive words of the resolved name rather than the
        // whole string: the published name often carries a parenthetical or a
        // suffix ("Restaurant", "(CSI)") that a natural answer drops.
        const words = resolved.name
          .toLowerCase()
          .replace(/[()]/g, ' ')
          .split(/\s+/)
          .filter((word) => word.length > 3 && !['the', 'and', 'for'].includes(word));
        if (words.length === 0) return 'unscorable';
        const text = answer.answer.toLowerCase();
        return words.some((word) => text.includes(word)) ? 'pass' : 'fail';
      },
    });

    scenarios.push({
      id: `map-action-${slug}`,
      category: 'map-action',
      tier: 'broad',
      messages: [`Where is ${query}?`],
      now,
      groundingExpected: true,
      expected: `VIEW_MAP payload locationKey="${resolved.key}"`,
      grade: ([answer]) => {
        const action = answer.uiActions.find((entry) => entry.type === 'VIEW_MAP');
        if (!action) return 'fail';
        return action.payload?.locationKey === resolved.key ? 'pass' : 'fail';
      },
    });
  }
  return scenarios;
}

/**
 * Tool-schema reliability for `search_events`.
 *
 * `search_events` accepts one optional string, `q`, and nothing else. A
 * question like "what events are happening today?" invites a `date` or `when`
 * argument that the schema does not declare, and the call is rejected — which
 * costs a tool slot and, in one traced turn, the whole answer.
 *
 * These scenarios are phrased to pull in that direction: dates, time ranges,
 * counts and categories, plus plain controls that should never tempt an extra
 * argument. Correctness is graded loosely — the point of measurement here is
 * the tool-call layer, read from the operator log, not the wording.
 */
export async function eventsScenarios(isoDate: string): Promise<Scenario[]> {
  const now = campusInstant(isoDate, 10 * 60);
  const asked: Array<[string, string, boolean]> = [
    ['plain', 'What events are happening?', false],
    ['today', 'What events are happening today?', true],
    ['tonight', 'Are there any events tonight?', true],
    ['this-week', 'What events are on this week?', true],
    ['weekend', 'Any events this weekend?', true],
    ['count', 'List three events coming up.', true],
    ['category', 'Are there any music events?', false],
    ['tomorrow', 'What events are happening tomorrow?', true],
  ];

  return asked.map(([slug, question, temptsExtraArgs]) => ({
    id: `events-${slug}`,
    category: 'events',
    tier: 'broad' as Tier,
    messages: [question],
    now,
    groundingExpected: true,
    expected: `answers without the tool call being rejected${temptsExtraArgs ? ' (phrasing invites an undeclared argument)' : ''}`,
    grade: ([answer]: GradedAnswer[]): Outcome => {
      // Loose on purpose. A rejected tool call shows up in the operator log,
      // and an answer that fell back shows up here; grading event *content*
      // would measure the events dataset rather than the tool contract.
      if (/wasn't able to put together a reliable/.test(answer.answer)) return 'fail';
      return answer.route === 'standard' || /no .*events|nothing .*scheduled/i.test(answer.answer)
        ? 'pass'
        : 'fail';
    },
  }));
}

export async function buildCorpus(isoDate: string): Promise<Scenario[]> {
  const [transportation, hours, map, discourse, events] = await Promise.all([
    transportationScenarios(isoDate),
    hoursScenarios(isoDate),
    mapScenarios(isoDate),
    discourseScenarios(isoDate),
    eventsScenarios(isoDate),
  ]);
  return [...transportation, ...hours, ...map, ...discourse, ...events];
}
