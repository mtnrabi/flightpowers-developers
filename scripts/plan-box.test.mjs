#!/usr/bin/env node
/**
 * The PlanBox text helpers (src/lib/plan-box.ts) on the real plan arrays, and
 * the per-page utm_content on the RapidAPI pricing links. Run with `npm test`.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { ladderLine, planBoxContent } from '../src/lib/plan-box.ts';
import { AIRBNB_PLANS, FLIGHT_PLANS, GOOGLE_HOTELS_PLANS, HOTEL_PLANS } from '../src/lib/pricing.ts';
import { rapidApiPricingUrl } from '../src/lib/site.ts';

test('every ladder line carries each plan price and quota from pricing.ts', () => {
  for (const plans of [FLIGHT_PLANS, HOTEL_PLANS, AIRBNB_PLANS, GOOGLE_HOTELS_PLANS]) {
    const line = ladderLine('X', plans);
    for (const p of plans) {
      assert.ok(line.includes(p.quota.toLocaleString('en-US')), `${line} lacks ${p.quota}`);
      if (p.priceMonthly > 0) assert.ok(line.includes(`${p.name} $${p.priceMonthly}`), `${line} lacks ${p.name}`);
    }
  }
});

test('the flights and Booking lines read as the per-product PRO prices', () => {
  assert.equal(
    ladderLine('Google Flights Live API', FLIGHT_PLANS),
    'Google Flights Live API: free for 10 searches a month, then PRO $10 a month for 2,500, ULTRA $25 for 10,000, MEGA $50 for 25,000.'
  );
  assert.ok(ladderLine('Booking Live API', HOTEL_PLANS).includes('PRO $10 a month for 2,000'));
  assert.ok(ladderLine('Airbnb Live API', AIRBNB_PLANS).includes('PRO $10 a month for 10,000'));
  assert.ok(ladderLine('Google Hotels Live API', GOOGLE_HOTELS_PLANS).includes('PRO $10 a month for 2,500'));
});

test('utm_content is planbox-<page path>, beacon-safe', () => {
  assert.equal(planBoxContent('/compare/duffel'), 'planbox-compare-duffel');
  assert.equal(planBoxContent('/guides/best-travel-mcp-servers-2026'), 'planbox-guides-best-travel-mcp-servers-2026');
  assert.equal(planBoxContent('/'), 'planbox-home');
  assert.match(planBoxContent('/Guides/A B/'), /^planbox-[a-z0-9-]+$/);
});

test('pricing links keep their old shape and add utm_content only when asked', () => {
  const plain = rapidApiPricingUrl('flights', 'guide');
  assert.equal(plain, 'https://rapidapi.com/mtnrabi/api/google-flights-live-api/pricing?utm_source=flightpowers&utm_medium=guide&utm_campaign=flights-2026-09');
  const u = new URL(rapidApiPricingUrl('hotels', 'compare', 'planbox-compare'));
  assert.equal(u.searchParams.get('utm_content'), 'planbox-compare');
  assert.equal(u.searchParams.get('utm_medium'), 'compare');
  assert.equal(u.pathname, '/mtnrabi/api/booking-live-api/pricing');
});

test('the eight pages of the 2026-11-07 push each carry a PlanBox with its own path', () => {
  const APP = path.join(import.meta.dirname, '..', 'src', 'app');
  const pages = {
    '/guides/best-travel-mcp-servers-2026': 'guides/(article)/best-travel-mcp-servers-2026/page.mdx',
    '/guides/best-hotel-data-apis-2026': 'guides/(article)/best-hotel-data-apis-2026/page.mdx',
    '/guides/best-flight-data-apis-2026': 'guides/(article)/best-flight-data-apis-2026/page.mdx',
    '/guides/flight-api-benchmark-2026': 'guides/(article)/flight-api-benchmark-2026/page.mdx',
    '/compare': 'compare/page.tsx',
    '/compare/duffel': 'compare/duffel/page.tsx',
    '/compare/kiwi-tequila': 'compare/kiwi-tequila/page.tsx',
    '/compare/skyscanner': 'compare/skyscanner/page.tsx',
  };
  for (const [route, file] of Object.entries(pages)) {
    const src = fs.readFileSync(path.join(APP, file), 'utf8');
    assert.ok(src.includes('<PlanBox'), `${file} has no PlanBox`);
    assert.ok(src.includes(`page="${route}"`), `${file} PlanBox page is not ${route}`);
  }
  // Add to Claude only on the MCP roundup.
  const mcp = fs.readFileSync(path.join(APP, pages['/guides/best-travel-mcp-servers-2026']), 'utf8');
  assert.match(mcp, /<PlanBox[^>]*\n\s*mcp\n/);
});
