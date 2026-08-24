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

/** Venues probed for hours. See hoursScenarios for how they are chosen. */
const MAX_HOURS_VENUES = 6;

/** Mirrors rockygpt-brain-python brain/tools.py MAX_RECORDS_PER_CALL, so the
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
          if (stated === null) return 'fail';
          return stated === truth ? 'pass' : 'fail';
        },
      });
    }
  }
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

export async function buildCorpus(isoDate: string): Promise<Scenario[]> {
  const [transportation, hours, map] = await Promise.all([
    transportationScenarios(isoDate),
    hoursScenarios(isoDate),
    mapScenarios(isoDate),
  ]);
  return [...transportation, ...hours, ...map];
}
