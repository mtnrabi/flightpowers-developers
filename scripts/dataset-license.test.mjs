import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { allRouteFares, routeDatasetJsonLd, DATA_LICENSE_PATH } from '../src/lib/route-fares.ts';

const SITE = 'https://flightpowers.com';

test('every route Dataset carries a license that points at a real page (Search Console, 2026-11-12)', () => {
  const routes = allRouteFares();
  assert.ok(routes.length > 0);
  assert.ok(fs.existsSync(new URL(`../src/app${DATA_LICENSE_PATH}/page.tsx`, import.meta.url)), 'license page exists');
  for (const r of routes) {
    const d = routeDatasetJsonLd(r, SITE);
    assert.equal(d['@type'], 'Dataset');
    assert.equal(d.license, `${SITE}/data-license`, r.slug);
    assert.equal(d.isAccessibleForFree, true);
    assert.match(String(d.temporalCoverage), /^\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/);
    assert.equal(d.spatialCoverage.length, 2);
    assert.ok(d.spatialCoverage[0].name.includes(`(${r.from.iata})`), r.slug);
    assert.ok(d.spatialCoverage[1].name.includes(`(${r.to.iata})`), r.slug);
    assert.equal(d.creator.name, 'FlightPowers');
  }
});

test('no Dataset JSON-LD is written by hand anywhere else (it would miss the license)', () => {
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p);
      else if (/\.(tsx?|mdx?)$/.test(e.name) && /['"]@type['"]\s*:\s*['"]Dataset['"]/.test(fs.readFileSync(p, 'utf8'))) hits.push(p);
    }
  };
  walk(new URL('../src', import.meta.url).pathname);
  assert.deepEqual(hits.map((h) => h.replace(/.*\/src\//, 'src/')), ['src/lib/route-fares.ts']);
});
