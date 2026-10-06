#!/usr/bin/env node
/**
 * The grid's indexing list and metadata, checked against the dataset.
 *
 * GRID_NOINDEX is a hand-copied list of URLs from Search Console. A typo in a
 * slug would silently noindex nothing (or the wrong page), and a description
 * that grows past 155 characters is cut off in the result it was written for.
 * Both fail here instead. Run with `npm test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CITIES,
  GRID_NOINDEX,
  ROUTES,
  ROUTE_TOOLS,
  cheapestTimeToFlyDescription,
  cheapestTimeToFlyTitle,
  flightPriceCheckerDescription,
  flightPriceCheckerTitle,
  gridPaths,
  gridTitleField,
  hotelPriceCheckDescription,
  indexedGridPaths,
  isGridRouteIndexed,
  roundTripPlannerDescription,
  roundTripPlannerTitle,
} from '../src/lib/grid.ts';

test('every noindexed slug is a route the grid generates', () => {
  const slugs = new Set(ROUTES.map((r) => r.slug));
  for (const [tool, set] of Object.entries(GRID_NOINDEX)) {
    for (const slug of set) assert.ok(slugs.has(slug), `${tool}/${slug} is not in ROUTES`);
  }
});

test('the list is the Search Console export: 48 + 42 + 7 = 97 route pages', () => {
  assert.equal(GRID_NOINDEX['cheapest-time-to-fly'].size, 48);
  assert.equal(GRID_NOINDEX['flight-price-checker'].size, 42);
  assert.equal(GRID_NOINDEX['round-trip-planner'].size, 7);
});

test('pages with impressions stay indexable', () => {
  // A sample of route pages with impressions in Search Console (5 Jul to 4 Oct 2026).
  const kept = [
    ['round-trip-planner', 'tpe-nrt'],
    ['round-trip-planner', 'icn-nrt'],
    ['cheapest-time-to-fly', 'hkg-tpe'],
    ['cheapest-time-to-fly', 'pek-szx'],
    ['flight-price-checker', 'jed-ruh'],
    ['flight-price-checker', 'cai-jed'],
    ['flight-price-checker', 'cju-pus'],
    ['flight-price-checker', 'han-sgn'],
  ];
  for (const [tool, slug] of kept) assert.ok(isGridRouteIndexed(tool, slug), `${tool}/${slug} must stay indexable`);
});

test('indexedGridPaths is gridPaths minus exactly the list, and keeps every city page', () => {
  const all = gridPaths();
  const indexed = indexedGridPaths();
  assert.equal(all.length, 180);
  assert.equal(indexed.length, 180 - 97);
  for (const c of CITIES) assert.ok(indexed.includes(`/tools/hotel-price-check/${c.slug}`));
  for (const t of ROUTE_TOOLS) {
    for (const slug of GRID_NOINDEX[t.slug]) assert.ok(!indexed.includes(`/tools/${t.slug}/${slug}`));
  }
});

test('every grid description fits in 155 characters and has no em dash', () => {
  const descriptions = [
    ...ROUTES.flatMap((r) => [
      cheapestTimeToFlyDescription(r),
      flightPriceCheckerDescription(r),
      roundTripPlannerDescription(r),
    ]),
    ...CITIES.map(hotelPriceCheckDescription),
  ];
  for (const d of descriptions) {
    assert.ok(d.length <= 155, `${d.length} chars: ${d}`);
    assert.ok(!d.includes('\u2014'), d);
  }
});

test('a title past 45 characters drops the site suffix, a shorter one keeps it', () => {
  assert.deepEqual(gridTitleField('x'.repeat(46)), { absolute: 'x'.repeat(46) });
  assert.equal(gridTitleField('x'.repeat(45)), 'x'.repeat(45));
  for (const r of ROUTES) {
    for (const title of [cheapestTimeToFlyTitle(r), flightPriceCheckerTitle(r), roundTripPlannerTitle(r)]) {
      const field = gridTitleField(title);
      const rendered = typeof field === 'string' ? `${field} · FlightPowers` : field.absolute;
      assert.ok(rendered.length <= 60 || typeof field !== 'string', rendered);
    }
  }
});
