/**
 * Deterministic open/closed handling.
 *
 * Two halves. The parser checks run offline against schedule strings in the
 * shapes both datasets publish, and are the real specification. The pinned-time
 * scenarios run the whole brain at chosen instants against live data, checking
 * that the answer agrees with the status the code computed — not that any
 * particular venue keeps any particular hours.
 *
 *   npm run test:hours
 */

import 'dotenv/config';

import { answerQuestion } from '@rockygpt/brain/src/brain';
import { minutesOfDayIn, parseSchedule, scheduleStatusAt } from '@rockygpt/brain/src/schedule';
import { getRepositoryV2 } from '@rockygpt/data/data-v2/repositories/index';

const CAMPUS_TIME_ZONE = 'America/New_York';
const failures: string[] = [];

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) return;
  failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

function at(hour: number, minute = 0): number {
  return hour * 60 + minute;
}

/* ── the parser, offline ─────────────────────────────────────────────── */

function parserChecks(): void {
  console.log('\n▸ schedule parsing');

  // Both published formats.
  check('lowercase compact format', parseSchedule('8:30am-4:30pm')?.length === 1);
  check('padded uppercase format', parseSchedule('07:45 AM - 02:00 PM')?.length === 1);
  check('closed all day', parseSchedule('CLOSED')?.length === 0);
  check('closed with a reason', parseSchedule('Closed (seasonal closure)')?.length === 0);
  check('unparseable text says so', parseSchedule('by appointment') === null);

  // Multiple windows, in both separators the data uses.
  check('two windows joined by "and"', parseSchedule('8:00am-9:30am and 11:30am-12:30pm')?.length === 2);
  check(
    'many windows separated by semicolons',
    parseSchedule('08:00 AM - 10:30 AM; 11:00 AM - 02:00 PM; 05:00 PM - 08:00 PM')?.length === 3
  );

  console.log('▸ open / closed at a moment');
  const business = '9:00am-5:00pm';
  check('before opening is closed', scheduleStatusAt(business, at(7))?.openNow === false);
  check('opening minute is open', scheduleStatusAt(business, at(9))?.openNow === true);
  check('midday is open', scheduleStatusAt(business, at(13))?.openNow === true);
  check('closing minute is closed', scheduleStatusAt(business, at(17))?.openNow === false);
  check('one minute before closing is open', scheduleStatusAt(business, at(16, 59))?.openNow === true);

  // The case the model got backwards: it reported open while naming a later
  // opening time.
  const closedEarly = scheduleStatusAt('7:45am-12:00am', at(7, 0));
  check('before opening reports closed', closedEarly?.openNow === false);
  check('and says when it opens', closedEarly?.opensAt === '7:45 AM');

  // The other one: a moment in the gap between two windows.
  const gap = '8:00am-9:30am and 11:30am-12:30pm';
  check('gap between windows is closed', scheduleStatusAt(gap, at(10, 30))?.openNow === false);
  check('gap points at the next window', scheduleStatusAt(gap, at(10, 30))?.opensAt === '11:30 AM');
  check('inside the second window is open', scheduleStatusAt(gap, at(11, 45))?.openNow === true);
  check('second window reports its own close', scheduleStatusAt(gap, at(11, 45))?.closesAt === '12:30 PM');

  // Midnight is the end of the day, not the start of it.
  const tilMidnight = '7:45am-12:00am';
  check('late evening is still open', scheduleStatusAt(tilMidnight, at(23, 30))?.openNow === true);
  check('closing label reads as midnight', scheduleStatusAt(tilMidnight, at(23, 30))?.closesAt === '12:00 AM');
  check('after midnight is closed', scheduleStatusAt(tilMidnight, at(0, 30))?.openNow === false);

  check('closed all day is never open', scheduleStatusAt('CLOSED', at(12))?.openNow === false);
  check('unparseable yields no claim', scheduleStatusAt('by appointment', at(12)) === null);
}

/* ── the brain, at pinned instants, against live data ────────────────── */

/** August is EDT (UTC-4), so campus wall time is the ISO hour minus four. */
const PINNED: Array<{ when: string; label: string; venue: string }> = [
  { when: '2026-08-20T11:00:00Z', label: 'Thursday 07:00', venue: 'library' },
  { when: '2026-08-20T14:30:00Z', label: 'Thursday 10:30', venue: 'auxiliary gym' },
  { when: '2026-08-20T15:45:00Z', label: 'Thursday 11:45', venue: 'auxiliary gym' },
  { when: '2026-08-21T03:30:00Z', label: 'Thursday 23:30', venue: 'library' },
  { when: '2026-08-22T20:00:00Z', label: 'Saturday 16:00', venue: 'auxiliary gym' },
  { when: '2026-08-23T18:00:00Z', label: 'Sunday 14:00', venue: 'auxiliary gym' },
];

/** What the schedule in the dataset actually says at that instant. */
async function truthFor(venue: string, now: Date): Promise<boolean | null> {
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone: CAMPUS_TIME_ZONE,
    weekday: 'long',
  }).format(now);
  const rows = await getRepositoryV2().findCampusHours(venue, day, now);
  if (rows.length === 0) return null;
  const status = scheduleStatusAt(rows[0].schedule, minutesOfDayIn(now, CAMPUS_TIME_ZONE));
  return status ? status.openNow : null;
}

async function pinnedChecks(): Promise<void> {
  console.log('\n▸ answers at pinned instants');
  for (const probe of PINNED) {
    const now = new Date(probe.when);
    const expected = await truthFor(probe.venue, now);
    if (expected === null) {
      console.log(`   ${probe.label}: no row for "${probe.venue}", skipped`);
      continue;
    }

    const result = await answerQuestion({
      message: `is the ${probe.venue} open right now`,
      responseMode: 'concise',
      now,
    });
    const said = result.answer.toLowerCase();
    // Read the verdict, not the wording: "closed" anywhere, or a bare "open".
    const saysClosed = /\bclosed\b|\bnot open\b/.test(said);
    const saysOpen = /\bopen\b/.test(said) && !saysClosed;
    const agreed = expected ? saysOpen : saysClosed;

    console.log(
      `   ${probe.label} ${probe.venue}: data says ${expected ? 'open' : 'closed'}, ` +
        `answer says ${saysClosed ? 'closed' : saysOpen ? 'open' : 'unclear'}`
    );
    check(
      `${probe.label} ${probe.venue}`,
      agreed,
      result.answer.replace(/\s+/g, ' ').slice(0, 110)
    );
  }
}

async function main(): Promise<void> {
  parserChecks();
  await pinnedChecks();

  console.log('\n' + '─'.repeat(70));
  if (failures.length === 0) {
    console.log('Open/closed agreed with the data at every checked moment.');
    return;
  }
  console.log(`${failures.length} failure(s):`);
  for (const failure of failures) console.log(`  ✗ ${failure}`);
  process.exitCode = 1;
}

void main();
