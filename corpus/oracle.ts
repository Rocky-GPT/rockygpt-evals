/**
 * Independent expectation oracles.
 *
 * These deliberately re-derive expected answers from raw campus data rather
 * than reusing any brain code. The brain must never grade itself, and a shared
 * helper would let one bug satisfy both the answer and its own check.
 *
 * Every function here is pure: it takes records and a pinned instant, and
 * returns what a correct answer must contain.
 */

export const CAMPUS_TIME_ZONE = 'America/New_York';

export interface ShuttleTrip {
  route: string;
  departure: string;
  arrival?: string;
  stops?: Array<{ location: string; time: string }>;
}

export interface HoursRecord {
  name: string;
  day: string;
  schedule: string;
}

/** "7:00 AM", "8:15pm", "07:45 A.M." -> minutes past midnight. */
export function parseClock(text: string): number | null {
  const match = /(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?/i.exec(text.trim());
  if (!match) return null;
  const hour = Number(match[1]) % 12;
  const minute = Number(match[2] ?? 0);
  return (match[3].toLowerCase() === 'p' ? hour + 12 : hour) * 60 + minute;
}

/** Minutes past midnight for an instant, in campus local time. */
export function minutesOfDay(at: Date, timeZone = CAMPUS_TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(at);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  return (hour % 24) * 60 + minute;
}

export function weekdayName(at: Date, timeZone = CAMPUS_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(at);
}

export function serviceDayFor(at: Date, timeZone = CAMPUS_TIME_ZONE): 'weekday' | 'saturday' | 'sunday' {
  const day = weekdayName(at, timeZone);
  if (day === 'Saturday') return 'saturday';
  if (day === 'Sunday') return 'sunday';
  return 'weekday';
}

/** Departures strictly after `afterMinutes`, in chronological order. */
export function futureDepartures(trips: ShuttleTrip[], afterMinutes: number): ShuttleTrip[] {
  return trips
    .map((trip) => ({ trip, minutes: parseClock(trip.departure) }))
    .filter((entry): entry is { trip: ShuttleTrip; minutes: number } => entry.minutes !== null)
    .filter((entry) => entry.minutes > afterMinutes)
    .sort((a, b) => a.minutes - b.minutes)
    .map((entry) => entry.trip);
}

/** The nth (1-based) departure after `afterMinutes`, or null past end of service. */
export function nthDeparture(trips: ShuttleTrip[], afterMinutes: number, n: number): ShuttleTrip | null {
  return futureDepartures(trips, afterMinutes)[n - 1] ?? null;
}

interface Window {
  start: number;
  end: number;
}

/**
 * Open windows in a published schedule string. `[]` means closed all day;
 * `null` means the text was not understood, which callers must treat as
 * "cannot score" rather than "closed".
 */
export function parseSchedule(schedule: string): Window[] | null {
  const text = schedule.trim();
  if (!text) return null;
  if (/^closed\b/i.test(text)) return [];

  const windows: Window[] = [];
  for (const segment of text.split(/\s+and\s+|;|,/i)) {
    const times = [...segment.matchAll(/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?/gi)];
    if (times.length !== 2) continue;
    const [open, close] = times.map((match) => {
      const hour = Number(match[1]) % 12;
      const minute = Number(match[2] ?? 0);
      return (match[3].toLowerCase() === 'p' ? hour + 12 : hour) * 60 + minute;
    });
    windows.push({ start: open, end: close });
  }
  return windows.length ? windows : null;
}

/** Whether a schedule covers a moment. `null` when the schedule is unparsable. */
export function isOpenAt(schedule: string, minutes: number): boolean | null {
  const windows = parseSchedule(schedule);
  if (windows === null) return null;
  return windows.some(({ start, end }) =>
    // An end at or before its start runs past midnight.
    end > start ? minutes >= start && minutes < end : minutes >= start || minutes < end
  );
}

/**
 * Whether an answer states a specific clock time, allowing for the renderings
 * a model reasonably produces: "8:15 PM", "8:15pm", "20:15", "8:15 p.m."
 */
export function statesTime(answer: string, expected: string): boolean {
  const minutes = parseClock(expected);
  if (minutes === null) return false;
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const meridiem = hour24 < 12 ? 'a' : 'p';
  const mm = String(minute).padStart(2, '0');

  for (const match of answer.matchAll(/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?/gi)) {
    if (
      Number(match[1]) % 12 === hour12 % 12 &&
      Number(match[2] ?? 0) === minute &&
      match[3].toLowerCase() === meridiem
    ) {
      return true;
    }
  }
  // 24-hour rendering.
  return new RegExp(`\\b${hour24}:${mm}\\b`).test(answer);
}

/**
 * What an answer asserts about a venue's status *right now*.
 *
 * Three things fight each other in real answers, and all three have to be
 * handled or correct replies get scored wrong:
 *
 *   negation      "is not open right now"          -> closed
 *   word order    "is not currently open"          -> closed
 *   schedule vs status
 *     "is open today from 6:00pm to 9:00pm, but right now it is after
 *      closing"                                    -> closed
 *
 * The rule: an assertion carrying a currentness marker ("currently", "right
 * now", "at the moment") is the status claim wherever it sits, and any
 * negation attached to it flips the polarity. Only when no currentness marker
 * exists anywhere does the first copula-linked status word count, and then only
 * if it is not introducing a time range — "is open from 9:00 AM to 5:00 PM"
 * describes a schedule, not this moment.
 *
 * Returns null when nothing readable is found. Callers must treat that as
 * unscorable, not as a wrong answer: a phrasing this cannot read is a limit of
 * this function, and a run full of them should abort the suite rather than
 * quietly report a low score.
 */
/**
 * Currentness markers. "today" is deliberately absent: "is open today from
 * 6:00pm to 9:00pm" is a schedule clause, not a claim about this moment, and
 * treating it as one reads those answers backwards.
 */
const NOW_MARKER = String.raw`currently|right\s+now|now|at\s+the\s+moment|presently|at\s+this\s+time`;
const COPULA = String.raw`is|are|'s|it's|its|remains?|stays?|will\s+be`;
const NEG = String.raw`not|no\s+longer`;
/** A status word followed by one of these is describing a schedule. */
const RANGE_LEAD = /^\s*(from|until|till|to|between|on|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;

/** Contractions expanded so one negation form has to be handled, not six. */
function normalize(answer: string): string {
  return answer
    .replace(/\bisn['’]t\b/gi, 'is not')
    .replace(/\baren['’]t\b/gi, 'are not')
    .replace(/\bwon['’]t\s+be\b/gi, 'will not be')
    .replace(/\bdoesn['’]t\s+(?:seem\s+to\s+)?be\b/gi, 'is not');
}

export function statesOpen(rawAnswer: string): boolean | null {
  const answer = normalize(rawAnswer);
  const polarity = (word: string, negated: unknown) =>
    (word.toLowerCase() === 'open') !== Boolean(negated);

  // "Currently, they are closed" — marker leads, subject and copula follow.
  const leading = new RegExp(
    String.raw`\b(?:${NOW_MARKER})\b[,\s]+(?:\w+\s+){0,2}?(?:${COPULA})\s+(${NEG})?\s*(open|closed)\b`,
    'i'
  ).exec(answer);
  if (leading) return polarity(leading[2], leading[1]);

  // "is currently closed", "is not currently open", "is currently not open".
  const middle = new RegExp(
    String.raw`\b(?:${COPULA})\s+(${NEG})?\s*(?:${NOW_MARKER})\s+(${NEG})?\s*(open|closed)\b`,
    'i'
  ).exec(answer);
  if (middle) return polarity(middle[3], middle[1] || middle[2]);

  // "is not open right now", "is closed at the moment".
  const trailing = new RegExp(
    String.raw`\b(?:${COPULA})\s+(${NEG})?\s*(open|closed)\s+(?:${NOW_MARKER})\b`,
    'i'
  ).exec(answer);
  if (trailing) return polarity(trailing[2], trailing[1]);

  // No currentness marker anywhere: first copula-linked status word that is not
  // introducing a schedule.
  for (const match of answer.matchAll(
    new RegExp(String.raw`\b(?:${COPULA})\s+(${NEG})?\s*(open|closed)\b(.{0,14})`, 'gi')
  )) {
    if (RANGE_LEAD.test(match[3] ?? '')) continue;
    return polarity(match[2], match[1]);
  }
  return null;
}
