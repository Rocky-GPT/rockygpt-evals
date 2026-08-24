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
}

export interface Scenario {
  id: string;
  category: string;
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
      messages: ['When is the next shuttle?', 'What about the one after that?'],
      now: campusInstant(isoDate, ordinalFrom),
      groundingExpected: true,
      expected: `${second.departure} (second departure after now)`,
      grade: (answers) => (statesTime(lastOf(answers).answer, second.departure) ? 'pass' : 'fail'),
    });
    scenarios.push({
      id: 'tx-ordinal-miss-phrasing',
      category: 'ordinal',
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

  const scenarios: Scenario[] = [];
  for (const record of records) {
    const windows = parseSchedule(record.schedule);
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

export async function buildCorpus(isoDate: string): Promise<Scenario[]> {
  const [transportation, hours] = await Promise.all([
    transportationScenarios(isoDate),
    hoursScenarios(isoDate),
  ]);
  return [...transportation, ...hours];
}
