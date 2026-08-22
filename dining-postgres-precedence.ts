import 'dotenv/config';
import { dataGet } from './client';
import { assertChecks, check } from './suite-utils';

const payload = await dataGet<{ dataset: { version: string }; records: Array<{ name: string; day: string }> }>(
  '/v1/search/dining-hours?q=&day=Monday&at=2026-08-24T16%3A00%3A00.000Z'
);
const identities = payload.records.map((record) => `${record.name.toLowerCase()}:${record.day.toLowerCase()}`);
const failures: string[] = [];
check(failures, 'response names a dataset release', Boolean(payload.dataset.version));
check(failures, 'dining hours are returned', payload.records.length > 0);
check(failures, 'one pinned release does not duplicate venue/day rows', new Set(identities).size === identities.length);
assertChecks(failures);
console.log('dining precedence: passed');
