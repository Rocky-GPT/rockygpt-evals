/**
 * Evidence-availability diagnostic for campus hours.
 *
 * Same question as the shuttle probe: was the venue the scenario asks about
 * actually inside the slice the model could see? The tool's `query` argument is
 * optional, so this computes both shapes — the model narrowing to the venue,
 * and the model asking for the day and taking whatever comes back.
 *
 * If venues fall outside the cap for the same structural reason shuttles did,
 * the defect is the tool-result boundary itself rather than anything about
 * transportation.
 */

import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { dataGet } from '../client';
import { weekdayName, type HoursRecord } from './oracle';

/** Mirrors rockygpt-brain brain/tools.py MAX_RECORDS_PER_CALL. */
const BRAIN_RECORD_CAP = 8;

interface SearchResponse {
  records: HoursRecord[];
}

const day = weekdayName(new Date('2026-08-24T16:00:00Z'));
const { records: all } = await dataGet<SearchResponse>(
  `/v1/search/campus-hours?day=${encodeURIComponent(day)}`
);

const visibleUnnarrowed = all.slice(0, BRAIN_RECORD_CAP).map((record) => record.name);

interface Row {
  venue: string;
  indexInFullSet: number;
  visibleWithoutQuery: boolean;
  narrowedHits: number;
  visibleWithQuery: boolean;
}

const rows: Row[] = [];
for (const [index, record] of all.entries()) {
  // What the tool returns when the model does narrow, using the venue's
  // published name — the most favourable query it could plausibly send.
  const { records: narrowed } = await dataGet<SearchResponse>(
    `/v1/search/campus-hours?day=${encodeURIComponent(day)}&q=${encodeURIComponent(record.name)}`
  );
  rows.push({
    venue: record.name,
    indexInFullSet: index + 1,
    visibleWithoutQuery: visibleUnnarrowed.includes(record.name),
    narrowedHits: narrowed.length,
    visibleWithQuery: narrowed
      .slice(0, BRAIN_RECORD_CAP)
      .some((entry) => entry.name === record.name),
  });
}

console.log(`\n=== hours evidence availability — ${day}, brain cap ${BRAIN_RECORD_CAP} ===\n`);
console.log(`data service returns ${all.length} venues for the day; model sees at most ${BRAIN_RECORD_CAP}\n`);
console.log('  #  venue                                     no-query  with-query');
for (const row of rows) {
  console.log(
    `${String(row.indexInFullSet).padStart(3)}  ${row.venue.slice(0, 40).padEnd(40)} ` +
      `${(row.visibleWithoutQuery ? 'YES' : 'no').padStart(8)} ${(row.visibleWithQuery ? 'YES' : 'no').padStart(11)}`
  );
}

const hidden = rows.filter((row) => !row.visibleWithoutQuery);
console.log(
  `\n${hidden.length}/${rows.length} venues are invisible when the model does not narrow with a query: ` +
    `${hidden.map((row) => row.venue).join(', ')}`
);
console.log(
  `${rows.filter((row) => !row.visibleWithQuery).length}/${rows.length} remain invisible even when narrowed by exact published name.`
);

writeFileSync(
  'corpus/availability-hours-baseline.json',
  JSON.stringify({ day, cap: BRAIN_RECORD_CAP, totalVenues: all.length, rows }, null, 2)
);
console.log('\nWrote corpus/availability-hours-baseline.json');
