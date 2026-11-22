#!/usr/bin/env node
// lead-capture.mjs: run the ONE real call a /for/<slug> page shows, and store
// the trimmed answer in src/data/leads/<slug>.json under `capture`.
//
//   RAPIDAPI_KEY=... node scripts/lead-capture.mjs <slug> [--force]
//
// The key is read from the environment only. It is never printed, never put in
// argv and never written to the JSON; errors print a status code and nothing
// else. A lead file that already has a capture is left alone without --force,
// so a build never spends a second request by accident.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.flightpowers.com';
const ROWS = 3;
const MAX_STRING = 160;

/** First ROWS items of every array, long strings cut, depth-first. Pure. */
export function trim(value, rows = ROWS) {
  if (Array.isArray(value)) return value.slice(0, rows).map((v) => trim(v, rows));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, trim(v, rows)]));
  }
  if (typeof value === 'string' && value.length > MAX_STRING) return `${value.slice(0, MAX_STRING)}…`;
  return value;
}

/** How many rows the untrimmed answer carried (top-level array, or its first array field). */
export function rowCount(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) if (Array.isArray(v)) return v.length;
  }
  return null;
}

async function main() {
  const [slug, flag] = process.argv.slice(2);
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    console.error('usage: lead-capture.mjs <slug> [--force]');
    process.exit(2);
  }
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'leads', `${slug}.json`);
  const lead = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (lead.capture && flag !== '--force') {
    console.log(`${slug}: already captured at ${lead.capture.fetchedAt}, pass --force to re-run`);
    return;
  }
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    console.error('RAPIDAPI_KEY is not set');
    process.exit(6);
  }
  const started = Date.now();
  let res;
  try {
    res = await fetch(`${API}${lead.request.path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'X-FP-Client': 'lead-page/0.1' },
      body: JSON.stringify(lead.request.body),
    });
  } catch {
    console.error(`${slug}: network error`);
    process.exit(1);
  }
  const elapsedMs = Date.now() - started;
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* status below says it all */
  }
  if (!res.ok || json === null) {
    console.error(`${slug}: HTTP ${res.status}, nothing written`);
    process.exit(1);
  }
  lead.capture = {
    fetchedAt: new Date(started).toISOString(),
    httpStatus: res.status,
    elapsedMs,
    searchStatus: res.headers.get('x-search-status'),
    rowsReturned: rowCount(json),
    rowsShown: ROWS,
    response: trim(json),
  };
  fs.writeFileSync(file, `${JSON.stringify(lead, null, 2)}\n`);
  console.log(`${slug}: HTTP ${res.status} in ${elapsedMs} ms, rows ${lead.capture.rowsReturned ?? 'n/a'}, written`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
