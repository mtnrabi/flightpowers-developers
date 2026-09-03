#!/usr/bin/env node
/**
 * Capture-funnel guard check.
 *
 * The repo has no test runner, and the two routes this covers write to a
 * database, so the honest check is a live one: point it at a running server
 * and it asserts that a bot is turned away cheaply and a real browser is not.
 *
 *   node scripts/check-capture-guards.mjs                     # localhost:3000
 *   node scripts/check-capture-guards.mjs https://flightpowers.com
 *
 * Nothing here inserts a row: every case that would reach the database uses a
 * body the route rejects before it gets there. Against a server with no
 * DATABASE_URL the "allowed" cases answer 503, which is still proof they got
 * past the guards, so both 503 and 400 count as "not blocked".
 *
 * Why it exists: on 2026-09-03 a bare `curl -X POST -d '{"email":"..."}'`
 * with no headers at all inserted a live subscriber row, because the origin
 * check passed anything that omitted `Sec-Fetch-Site`.
 */

const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const origin = new URL(base).origin;

const PASSED = 'reached the route body';

async function post(path, { headers = {}, body = '' } = {}) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });
  return res.status;
}

const cases = [
  {
    name: 'bare POST, no browser headers, is refused',
    run: () => post('/api/subscribe', { body: JSON.stringify({ email: 'guard-check@example.com' }) }),
    want: (s) => s === 403,
    expect: '403 cross_origin',
  },
  {
    name: 'cross-site POST is refused',
    run: () =>
      post('/api/subscribe', {
        headers: { 'sec-fetch-site': 'cross-site', origin: 'https://evil.example' },
        body: JSON.stringify({ email: 'guard-check@example.com' }),
      }),
    want: (s) => s === 403,
    expect: '403 cross_origin',
  },
  {
    name: 'oversized body is refused before it is parsed',
    run: () =>
      post('/api/subscribe', {
        headers: { 'sec-fetch-site': 'same-origin', origin },
        body: JSON.stringify({ email: 'guard-check@example.com', path: 'x'.repeat(5000) }),
      }),
    want: (s) => s === 413,
    expect: '413 too_large',
  },
  {
    name: 'a filled honeypot is refused',
    run: () =>
      post('/api/subscribe', {
        headers: { 'sec-fetch-site': 'same-origin', origin },
        body: JSON.stringify({ email: 'guard-check@example.com', company: 'Acme' }),
      }),
    want: (s) => s === 400,
    expect: '400 bad_request',
  },
  {
    name: 'a real browser submit is NOT blocked (bad address, so no row)',
    run: () =>
      post('/api/subscribe', {
        headers: { 'sec-fetch-site': 'same-origin', origin },
        body: JSON.stringify({ email: 'not-an-address' }),
      }),
    want: (s) => s === 400 || s === 503,
    expect: `400 bad_email (${PASSED})`,
  },
  {
    name: 'a browser with no Sec-Fetch-Site but a matching Origin is NOT blocked',
    run: () =>
      post('/api/subscribe', { headers: { origin }, body: JSON.stringify({ email: 'not-an-address' }) }),
    want: (s) => s === 400 || s === 503,
    expect: `400 bad_email (${PASSED})`,
  },
  {
    name: 'RFC 8058 one-click unsubscribe still works with no Origin at all',
    run: () =>
      fetch(`${base}/api/unsubscribe?t=guard-check-token`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'List-Unsubscribe=One-Click',
      }).then((r) => r.status),
    want: (s) => s === 200 || s === 503,
    expect: `200 ok (${PASSED})`,
  },
  {
    name: 'oversized unsubscribe body is refused',
    run: () => post('/api/unsubscribe', { body: JSON.stringify({ token: 'x'.repeat(5000) }) }),
    want: (s) => s === 413,
    expect: '413 too_large',
  },
];

let failed = 0;
console.log(`Capture guards against ${base}\n`);
for (const c of cases) {
  let status;
  try {
    status = await c.run();
  } catch (err) {
    console.log(`FAIL  ${c.name}\n      request failed: ${err.message}`);
    failed += 1;
    continue;
  }
  if (c.want(status)) {
    console.log(`ok    ${c.name} (${status})`);
  } else {
    console.log(`FAIL  ${c.name}\n      got ${status}, wanted ${c.expect}`);
    failed += 1;
  }
}

if (failed > 0) {
  console.log(`\n${failed} of ${cases.length} checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${cases.length} checks passed.`);
