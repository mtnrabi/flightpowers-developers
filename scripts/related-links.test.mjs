#!/usr/bin/env node
/**
 * The "Read next" map in src/lib/related.ts. Run with `npm test`.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { RELATED, relatedFor } from '../src/lib/related.ts';

const APP = path.join(import.meta.dirname, '..', 'src', 'app');

/** Path -> page file on disk (guides live in the (article) route group). */
function pageFile(p) {
  const m = p.match(/^\/guides\/(.+)$/);
  const dir = m ? path.join(APP, 'guides', '(article)', m[1]) : path.join(APP, ...p.split('/').filter(Boolean));
  return ['page.mdx', 'page.tsx'].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f));
}

/**
 * Pages changed by site PRs #106, #107, #108 and #116. Those PRs are merged;
 * the pages stay untouched (no block on them, no links to them) until their
 * post-merge reads on 2026-11-02 (#106-#108) and 2026-11-06 (#116). After
 * those reads this set can be emptied and the pages added to the map.
 */
const HOLD_PATHS = new Set([
  '/compare/duffel',
  '/guides/best-hotel-data-apis-2026',
  '/guides/booking-com-api-key',
  '/hotels-api',
  '/integrations/claude',
  '/guides/ai-travel-agent',
  '/guides/best-travel-mcp-servers-2026',
  '/guides/five-minute-travel-agent',
  '/guides/google-flights-mcp-cursor',
  '/mcp',
  '/skills',
  '/tools/hotel-price-check',
  '/compare/amadeus',
  '/flights-api',
  '/guides/amadeus-self-service-alternatives',
  '/guides/best-flight-data-apis-2026',
  '/guides/booking-com-api-alternative',
  '/guides/google-flights-api-key',
  '/guides/google-flights-api',
  '/guides/hotel-prices-by-country-api',
  '/guides/monitor-hotel-rate-parity',
  '/guides/serpapi-google-flights-alternative',
  '/compare/kiwi-tequila',
  '/guides/flight-api-benchmark-2026',
  '/guides',
]);

test('every page in the map and every target exists', () => {
  for (const [from, links] of Object.entries(RELATED)) {
    assert.ok(pageFile(from), `no page for ${from}`);
    for (const l of links) assert.ok(pageFile(l.href), `no page for ${l.href} (linked from ${from})`);
  }
});

test('3 or 4 links, no self link, no duplicate target on one page', () => {
  for (const [from, links] of Object.entries(RELATED)) {
    assert.ok(links.length >= 3 && links.length <= 4, `${from} has ${links.length} links`);
    assert.ok(!links.some((l) => l.href === from), `${from} links itself`);
    assert.equal(new Set(links.map((l) => l.href)).size, links.length, `${from} repeats a target`);
  }
});

test('pages on hold get no block and no links', () => {
  for (const [from, links] of Object.entries(RELATED)) {
    assert.ok(!HOLD_PATHS.has(from), `${from} is on hold`);
    for (const l of links) assert.ok(!HOLD_PATHS.has(l.href), `${from} links held page ${l.href}`);
  }
});

test('every page with a block is also a target of another block', () => {
  const inbound = {};
  for (const [from, links] of Object.entries(RELATED)) for (const l of links) (inbound[l.href] ??= new Set()).add(from);
  for (const from of Object.keys(RELATED)) {
    assert.ok((inbound[from]?.size ?? 0) >= 1, `${from} gets no inbound link from the map`);
  }
});

test('the block does not repeat a link the page body already has', () => {
  for (const [from, links] of Object.entries(RELATED)) {
    const src = fs.readFileSync(pageFile(from), 'utf8');
    for (const l of links) {
      // Matches a relative link in markdown, JSX or an object literal
      // (`](/x)`, `href="/x"`, `href: '/x'`) and an absolute flightpowers.com one.
      const esc = l.href.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&');
      const re = new RegExp(`(flightpowers\\.com|['"(\`])${esc}(?![a-z0-9-])`);
      assert.ok(!re.test(src), `${from} already links ${l.href} in its body`);
    }
  }
});

test('no anchor text is used twice in the map', () => {
  const seen = new Map();
  for (const [from, links] of Object.entries(RELATED)) {
    for (const l of links) {
      assert.ok(!seen.has(l.label), `"${l.label}" is used on ${seen.get(l.label)} and ${from}`);
      seen.set(l.label, from);
    }
  }
});

test('relatedFor ignores a trailing slash and the query', () => {
  assert.equal(relatedFor('/use-cases/metasearch/').length, RELATED['/use-cases/metasearch'].length);
  assert.equal(relatedFor('/use-cases/metasearch?x=1').length, RELATED['/use-cases/metasearch'].length);
  assert.deepEqual(relatedFor('/use-cases'), []);
  assert.deepEqual(relatedFor(null), []);
});
