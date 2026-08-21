import 'dotenv/config';

import assert from 'node:assert/strict';
import { Pool, type QueryResultRow } from 'pg';
import { PostgresRepositoryV2 } from '@rockygpt/data/data-v2/repositories/postgres-repository';
import { getRuntimePool } from '@rockygpt/data/db/runtime-pool';

const CAMPUS_TIME_ZONE = 'America/New_York';

interface CollisionRow extends QueryResultRow {
  name: string;
  day: string;
  valid_from: string;
  valid_until: string;
  seasonal_schedule: string;
  standard_schedule: string;
}

function instantForWeekday(validFrom: string, validUntil: string, weekday: string): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CAMPUS_TIME_ZONE,
    weekday: 'long',
  });
  const cursor = new Date(`${validFrom}T16:00:00Z`);
  const end = new Date(`${validUntil}T16:00:00Z`);

  while (cursor <= end) {
    if (formatter.format(cursor) === weekday) return new Date(cursor);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  throw new Error(`No ${weekday} falls within ${validFrom} through ${validUntil}.`);
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required for this integration test.');

  const probePool = new Pool({ connectionString, max: 1, application_name: 'rockygpt-hours-test' });
  const repository = new PostgresRepositoryV2(connectionString);
  const runtimePool = getRuntimePool(connectionString);

  try {
    const dataset = await repository.getDatasetContext();
    const collisionResult = await probePool.query<CollisionRow>(
      `SELECT seasonal.name,
              seasonal.day,
              seasonal.valid_from::text,
              seasonal.valid_until::text,
              seasonal.schedule AS seasonal_schedule,
              standard.schedule AS standard_schedule
         FROM rockygpt_v2.dining_hours seasonal
         JOIN rockygpt_v2.dining_hours standard
           ON standard.dataset_version_id = seasonal.dataset_version_id
          AND standard.name = seasonal.name
          AND lower(standard.day) = lower(seasonal.day)
          AND standard.valid_from IS NULL
          AND standard.valid_until IS NULL
        WHERE seasonal.dataset_version_id = $1::uuid
          AND seasonal.valid_from IS NOT NULL
          AND seasonal.valid_until IS NOT NULL
          AND seasonal.schedule IS DISTINCT FROM standard.schedule
          AND NOT EXISTS (
            SELECT 1
              FROM rockygpt_v2.dining_hours other
             WHERE other.dataset_version_id = seasonal.dataset_version_id
               AND other.name = seasonal.name
               AND lower(other.day) = lower(seasonal.day)
               AND other.id <> seasonal.id
               AND other.valid_from IS NOT NULL
               AND other.valid_until IS NOT NULL
               AND daterange(other.valid_from, other.valid_until, '[]')
                   && daterange(seasonal.valid_from, seasonal.valid_until, '[]')
          )
        ORDER BY seasonal.name, seasonal.valid_from, seasonal.day
        LIMIT 1`,
      [dataset.id]
    );
    const collision = collisionResult.rows[0];
    assert.ok(collision, 'The active dataset needs one standard/seasonal dining-hours collision.');

    const at = instantForWeekday(collision.valid_from, collision.valid_until, collision.day);
    const pinned = repository.withDataset(dataset);

    const exact = await pinned.findDiningHoursByVenue(collision.name, collision.day, at);
    assert.equal(exact.length, 1, 'Exact venue lookup must return one governing row.');
    assert.equal(exact[0]?.schedule, collision.seasonal_schedule);

    const broad = await pinned.findDiningHours('', collision.day, at);
    const matchingBroadRows = broad.filter((row) => row.name === collision.name);
    assert.equal(matchingBroadRows.length, 1, 'Broad lookup must return one row per venue/day.');
    assert.equal(matchingBroadRows[0]?.schedule, collision.seasonal_schedule);

    const outsideEveryPublishedSeason = new Date('1900-01-15T17:00:00Z');
    const standard = await pinned.findDiningHoursByVenue(
      collision.name,
      collision.day,
      outsideEveryPublishedSeason
    );
    assert.equal(standard.length, 1, 'Standard hours must remain available outside overrides.');
    assert.equal(standard[0]?.schedule, collision.standard_schedule);

    console.log(
      `Dining-hours precedence passed for ${collision.name} on ${collision.day} (${collision.valid_from}–${collision.valid_until}).`
    );
  } finally {
    await Promise.all([probePool.end(), runtimePool?.end()]);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
