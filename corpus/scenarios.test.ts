/**
 * Corpus graders end to end, with fake campus data and a fake Jev: right
 * answers the word checks could not read, or read backwards.
 */

import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import { fakeJev, sure } from '../fake-jev';
import { resetJudge } from '../judge';
import { discourseScenarios, hoursScenarios, type GradedAnswer, type Scenario } from './scenarios';

const MONDAY = '2026-08-24';
const HOURS = [{ name: 'Bradley Center', day: 'Monday', schedule: '6:00 AM - 11:00 PM' }];
const TRIPS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM'].map(
  (departure) => ({
    route: 'Main',
    departure,
  })
);

function campusData(url: string): Response {
  if (url.includes('/v1/search/campus-hours')) return Response.json({ records: HOURS });
  if (url.includes('/v1/search/shuttles')) return Response.json({ records: TRIPS });
  throw new Error(`unexpected request to ${url}`);
}

function said(...texts: string[]): GradedAnswer[] {
  return texts.map((answer) => ({ answer, route: 'standard', citations: 1, uiActions: [] }));
}

async function scenario(
  build: (date: string) => Promise<Scenario[]>,
  id: string
): Promise<Scenario> {
  fakeJev(() => assert.fail('Jev was called while building scenarios'), campusData);
  const found = (await build(MONDAY)).find((entry) => entry.id === id);
  mock.restoreAll();
  assert.ok(found, `no scenario ${id}`);
  return found;
}

beforeEach(() => {
  delete process.env.TYPESAFE_API_KEY;
  delete process.env.BRAIN_TYPESAFE_API_KEY;
  resetJudge();
});

afterEach(() => {
  mock.restoreAll();
});

test('hours: a right "open" answer the word check could not read now passes', async () => {
  const midday = await scenario(hoursScenarios, 'hours-bradley-center-mid-open');
  const answer = said('Yes, the Bradley Center is open until 11:00 PM tonight.');

  fakeJev(() => assert.fail('Jev was called without a key'));
  assert.equal(await midday.grade(answer), 'unscorable');

  process.env.TYPESAFE_API_KEY = 'test-key';
  fakeJev(() => sure('open', ['open', 'closed', 'unclear']));
  assert.equal(await midday.grade(answer), 'pass');
});

test('hours: a right "closed" answer the word check read as open now passes', async () => {
  const early = await scenario(hoursScenarios, 'hours-bradley-center-before-open');
  const answer = said("It's 5:30 AM right now, and the Bradley Center is open at 6:00 AM.");

  fakeJev(() => assert.fail('Jev was called without a key'));
  assert.equal(await early.grade(answer), 'fail');

  process.env.TYPESAFE_API_KEY = 'test-key';
  const requests = fakeJev(() => sure('closed', ['open', 'closed', 'unclear']));
  assert.equal(await early.grade(answer), 'pass');
  assert.equal(requests[0].body.state.student_message, 'Is Bradley Center open right now?');
});

test('recall: a denial that does not lead with "I didn’t say" now passes', async () => {
  const recall = await scenario(discourseScenarios, 'dsc-false-claim-recall');
  const answers = said(
    'The next shuttle leaves at 10:00 AM.',
    'That 7:00 AM shuttle? No, I only gave you the 10:00 AM departure.'
  );

  fakeJev(() => assert.fail('Jev was called without a key'));
  assert.equal(await recall.grade(answers), 'fail');

  process.env.TYPESAFE_API_KEY = 'test-key';
  fakeJev(() => sure('denies', ['denies', 'agrees', 'other']));
  assert.equal(await recall.grade(answers), 'pass');
});
