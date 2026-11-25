#!/usr/bin/env node
/** The request counts on /docs/run-daily and the script it serves. Run with `npm test`. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { DAILY_JOBS, job, perMonth, shareOf } from '../src/lib/daily-runs.ts';
import { FLIGHT_PLANS } from '../src/lib/pricing.ts';

const PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO');

const ROOT = path.join(import.meta.dirname, '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

test('every daily job fits the PRO quota in the longest month', () => {
  for (const j of DAILY_JOBS) assert.ok(perMonth(j.perRun) <= PRO.quota, `${j.id}: ${perMonth(j.perRun)}`);
});

test('the counts the fare-watcher README states (10 and 80 a run, 2,480 a month)', () => {
  assert.equal(job('template-readme').perRun, 10);
  assert.equal(perMonth(job('template-readme').perRun), 310);
  assert.equal(job('template-wide').perRun, 80);
  assert.equal(perMonth(job('template-wide').perRun), 2480);
  assert.equal(shareOf(80, PRO.quota), '99%');
});

test('daily_fare.py sends exactly the two requests the page counts, and holds no key', () => {
  const py = read('public', 'daily_fare.py');
  assert.deepEqual([...py.matchAll(/= call\("(\w+)"/g)].map((m) => m[1]), ['cheapest_dates', 'roundtrip']);
  assert.equal(job('cron').perRun, 2);
  assert.match(py, /os\.environ\["RAPIDAPI_KEY"\]/);
  assert.doesNotMatch(py, /sort_type/); // Google gives no verdict on a price-sorted page
});

test('the page is linked where a new subscriber looks', () => {
  for (const f of [
    ['src', 'components', 'PlanCards.tsx'],
    ['src', 'app', 'docs', 'page.tsx'],
    ['src', 'app', 'docs', 'quickstart', 'page.tsx'],
    ['src', 'app', 'docs', 'examples', 'page.tsx'],
    ['src', 'app', 'llms.txt', 'route.ts'],
  ])
    assert.ok(read(...f).includes('/docs/run-daily'), f.join('/'));
});
