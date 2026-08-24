/**
 * Evidence-availability diagnostic.
 *
 * Splits a wrong answer into the two cases that need different fixes:
 *
 *   Was the correct record present in the evidence the model could see?
 *     no  -> retrieval / evidence-availability failure. No reasoning layer,
 *            deterministic or otherwise, could have answered correctly.
 *     yes -> selection or interpretation failure. This is the one that argues
 *            about where reasoning should live.
 *
 * This reconstructs what the brain's tool layer would have exposed rather than
 * reading it out of the brain: the same data call, then the same per-call
 * record cap. Tool internals deliberately do not cross the service boundary
 * (client.ts), so reconstruction is the only black-box route to the answer.
 *
 * Both plausible call shapes are computed, because the tool's `serviceDay`
 * argument is optional and the model does not supply it consistently — so
 * availability itself varies run to run.
 */

import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { dataGet } from '../client';
import { parseClock, serviceDayFor, type ShuttleTrip } from './oracle';

/** Mirrors rockygpt-brain-python brain/tools.py MAX_RECORDS_PER_CALL. */
const BRAIN_RECORD_CAP = 8;

interface SearchResponse {
  records: ShuttleTrip[];
}

interface Availability {
  scenario: string;
  expectedDeparture: string | null;
  totalReturned: number;
  visibleToModel: number;
  presentWithServiceDay: boolean;
  presentWithoutServiceDay: boolean;
  routesInVisibleSlice: string[];
}

async function visibleSlice(query: string): Promise<ShuttleTrip[]> {
  const { records } = await dataGet<SearchResponse>(`/v1/search/shuttles?${query}`);
  return records.slice(0, BRAIN_RECORD_CAP);
}

async function probe(scenario: string, now: Date, expectedDeparture: string | null): Promise<Availability> {
  const at = encodeURIComponent(now.toISOString());
  const serviceDay = serviceDayFor(now);
  const [withDay, withoutDay] = await Promise.all([
    visibleSlice(`serviceDay=${serviceDay}&at=${at}`),
    visibleSlice(`at=${at}`),
  ]);
  const { records: allWithDay } = await dataGet<SearchResponse>(
    `/v1/search/shuttles?serviceDay=${serviceDay}&at=${at}`
  );

  const states = (trips: ShuttleTrip[]) =>
    expectedDeparture === null
      ? // "No further departures today" is answerable only if nothing still to
        // come is visible; any future trip in the slice makes it unanswerable.
        !trips.some((trip) => {
          const minutes = parseClock(trip.departure);
          return minutes !== null && trip.route.toLowerCase().includes(serviceDay.slice(0, 3));
        })
      : trips.some(
          (trip) => parseClock(trip.departure) === parseClock(expectedDeparture)
        );

  return {
    scenario,
    expectedDeparture,
    totalReturned: allWithDay.length,
    visibleToModel: withDay.length,
    presentWithServiceDay: states(withDay),
    presentWithoutServiceDay: states(withoutDay),
    routesInVisibleSlice: [...new Set(withoutDay.map((trip) => trip.route))],
  };
}

// The frozen baseline's transportation scenarios, with the pinned instants and
// expectations recorded in BASELINE.md. Hardcoded rather than regenerated so
// this diagnostic describes the run that actually happened.
const cases: Array<[string, string, string | null]> = [
  ['tx-midday-0', '2026-08-24T11:07:00.000Z', '8:25 AM'],
  ['tx-midday-1', '2026-08-24T16:27:00.000Z', '2:05 PM'],
  ['tx-midday-2', '2026-08-24T20:47:00.000Z', '6:10 PM'],
  ['tx-boundary-before', '2026-08-24T19:09:00.000Z', '3:10 PM'],
  ['tx-boundary-exact', '2026-08-24T19:10:00.000Z', '3:50 PM'],
  ['tx-boundary-after', '2026-08-24T19:11:00.000Z', '3:50 PM'],
  ['tx-before-service', '2026-08-24T10:15:00.000Z', '7:00 AM'],
  ['tx-after-service', '2026-08-25T02:00:00.000Z', null],
  ['tx-ordinal-next', '2026-08-24T16:25:00.000Z', '3:10 PM'],
  ['tx-ordinal-miss-phrasing', '2026-08-24T16:25:00.000Z', '3:10 PM'],
];

const label = process.env.AVAILABILITY_LABEL || 'baseline';
const results: Availability[] = [];
for (const [scenario, iso, expected] of cases) {
  results.push(await probe(scenario, new Date(iso), expected));
}

console.log(`\n=== evidence availability (${label}) — brain cap ${BRAIN_RECORD_CAP} ===\n`);
console.log('scenario                    expected   returned  visible  withDay  withoutDay');
for (const row of results) {
  console.log(
    `${row.scenario.padEnd(27)} ${(row.expectedDeparture ?? 'none').padEnd(10)} ` +
      `${String(row.totalReturned).padStart(8)} ${String(row.visibleToModel).padStart(8)} ` +
      `${(row.presentWithServiceDay ? 'YES' : 'no').padStart(8)} ${(row.presentWithoutServiceDay ? 'YES' : 'no').padStart(11)}`
  );
}

const unavailable = results.filter((row) => !row.presentWithServiceDay);
console.log(
  `\n${unavailable.length}/${results.length} scenarios had the correct record MISSING from the ` +
    `model-visible slice even in the best case (serviceDay supplied).`
);
console.log(
  `${results.filter((row) => !row.presentWithoutServiceDay).length}/${results.length} missing when serviceDay is omitted.`
);
console.log(`\nroutes present in a no-serviceDay slice: ${results[0]?.routesInVisibleSlice.join(', ')}`);

writeFileSync(`corpus/availability-${label}.json`, JSON.stringify({ label, cap: BRAIN_RECORD_CAP, results }, null, 2));
console.log(`\nWrote corpus/availability-${label}.json`);
