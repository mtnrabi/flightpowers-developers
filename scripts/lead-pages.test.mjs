import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { rowCount, trim } from './lead-capture.mjs';

const ROOT = path.join(import.meta.dirname, '..');
const LEADS = path.join(ROOT, 'src', 'data', 'leads');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

test('trim keeps three rows and cuts long strings', () => {
  const out = trim([{ a: 'x'.repeat(400), b: [1, 2, 3, 4] }, 2, 3, 4, 5]);
  assert.equal(out.length, 3);
  assert.equal(out[0].a.length, 161);
  assert.deepEqual(out[0].b, [1, 2, 3]);
  assert.equal(rowCount([1, 2, 3, 4, 5]), 5);
  assert.equal(rowCount({ properties: [1, 2] }), 2);
  assert.equal(rowCount({ name: 'x' }), null);
});

test('every lead file carries a real capture, no key-shaped string and no email address', () => {
  const files = fs.readdirSync(LEADS).filter((f) => f.endsWith('.json'));
  assert.ok(files.length >= 2);
  for (const f of files) {
    const raw = fs.readFileSync(path.join(LEADS, f), 'utf8');
    const lead = JSON.parse(raw);
    assert.equal(`${lead.slug}.json`, f);
    assert.equal(lead.capture.httpStatus, 200, `${f} has no 200 capture`);
    assert.match(lead.capture.fetchedAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.ok(lead.request.path.startsWith('/v1/'));
    // The curl on the page names the header with $RAPIDAPI_KEY; a real key value must never land in a lead file.
    assert.doesNotMatch(raw, /[a-z0-9]{8,}msh[a-z0-9]{8,}/i, `${f} carries a key-shaped string`);
    assert.doesNotMatch(raw, /[a-z0-9._-]+@[a-z0-9-]+\.[a-z]{2,}/i, `${f} carries an email address`);
  }
});

test('lead pages are noindex and stay out of the sitemap and the hub', () => {
  const page = read('src', 'app', 'for', '[slug]', 'page.tsx');
  assert.match(page, /robots: \{ index: false, follow: false/);
  assert.match(page, /dynamicParams = false/);
  assert.doesNotMatch(read('src', 'app', 'sitemap.ts'), /leads|\/for\//);
  assert.doesNotMatch(read('src', 'app', 'compare', '_lib', 'pages.ts'), /\/for\//);
});

test('the pricing pages print no coupon code and keep the scoped SerpApi line', () => {
  const serp = read('src', 'app', 'compare', 'serpapi-pricing', 'page.tsx');
  const has = read('src', 'app', 'compare', 'hasdata-pricing', 'page.tsx');
  for (const src of [serp, has]) {
    assert.doesNotMatch(src, /cheapest (api|price|per)/i);
    assert.doesNotMatch(src, /use code|% off/i);
    assert.match(src, /RIVAL_PRICES_READ/);
  }
  assert.match(serp, /about a sixth of SerpApi’s price per search/);
  const prices = read('src', 'app', 'compare', '_lib', 'rival-prices.ts');
  assert.match(prices, /name: 'Starter', price: 25, searches: 1000/);
  const hub = read('src', 'app', 'compare', '_lib', 'pages.ts');
  assert.match(hub, /\/compare\/serpapi-pricing/);
  assert.match(hub, /\/compare\/hasdata-pricing/);
});
