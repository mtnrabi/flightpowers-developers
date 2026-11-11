import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { planDates, fromMcpResult, fromRestBody, parseStream, pickRow, loadRoutes, FARES_DIR, slugOf } from './route-fares.mjs';
import { summarise, routeFareDescription, spacingText, MIN_PRICED_DATES, dayLabel } from '../src/lib/route-fares.ts';

const ROUTES = JSON.parse(fs.readFileSync(new URL('../src/data/routes/routes.json', import.meta.url), 'utf8'));

const row = (price, extra = {}) => ({
  price_as_number: price, price: `$${price}`, airline: 'Delta', stops: 0, duration: '7 hr', departure_description: 'x',
  price_range_in_relation_to_other_periods: 'typical', price_insights_low: 300, price_insights_high: 500,
  buy_link: 'https://www.google.com/travel/flights?tfs=abc', ...extra,
});

test('the plan is Wednesdays, and both budgets hold for the 100-route list', () => {
  const today = new Date('2026-11-11T21:00:00Z');
  const fill = planDates({ today, step: 7, horizon: 168, lead: 14 });
  const refresh = planDates({ today, step: 14, horizon: 168, lead: 14 });
  for (const d of [...fill, ...refresh]) assert.equal(new Date(`${d}T00:00:00Z`).getUTCDay(), 3, d);
  assert.equal(fill[0], '2026-11-25');
  const { list } = loadRoutes();
  assert.equal(list.length, 100);
  assert.ok(list.length * fill.length <= 3000, `first fill ${list.length * fill.length}`);
  assert.ok(list.length * refresh.length <= 1500, `weekly refresh ${list.length * refresh.length}`);
});

test('a fare keeps only what the API sent; a row without a numeric price is not a fare', () => {
  assert.equal(pickRow({ price: '$300' }), null);
  const f = pickRow(row(321, { price_range_in_relation_to_other_periods: '', buy_link: 'https://evil.example/x' }));
  assert.equal(f.price, 321);
  assert.equal(f.verdict, null);
  assert.equal(f.buy_link, null);
});

test('connector answers: ok, empty and failed stay apart', () => {
  const per = fromMcpResult(
    { by_destination: { LHR: { cheapest: row(349), searched: true, reason: 'ok' }, CDG: { searched: true, reason: 'no flights' }, FCO: { searched: false, reason: 'search failed' } } },
    ['LHR', 'CDG', 'FCO', 'MAD']
  );
  assert.equal(per.LHR.status, 'ok');
  assert.equal(per.LHR.fare.price, 349);
  assert.equal(per.CDG.status, 'empty');
  assert.equal(per.FCO.status, 'failed');
  assert.equal(per.MAD.status, 'failed');
});

test('REST answers: cheapest row wins, a degraded empty is a failure, not "no flights"', () => {
  assert.equal(fromRestBody(200, 'ok', [row(500), row(420), row(610)]).fare.price, 420);
  assert.equal(fromRestBody(200, 'empty', []).status, 'empty');
  assert.equal(fromRestBody(200, 'degraded', []).status, 'failed');
  assert.equal(fromRestBody(503, 'degraded', { error: 'x' }).status, 'failed');
});

test('the stream reader keeps only answers to the exact call asked for', () => {
  const use = (id, input) => JSON.stringify({ message: { content: [{ type: 'tool_use', id, name: 'mcp__claude_ai_FlightPowers_Flights__search_oneway_flights', input }] } });
  const res = (id, obj) => JSON.stringify({ message: { content: [{ type: 'tool_result', tool_use_id: id, content: [{ type: 'text', text: JSON.stringify(obj) }] }] } });
  const answer = { by_destination: { LHR: { cheapest: row(349) }, CDG: { cheapest: row(432) } } };
  const text = [
    use('a', { from_airport: 'JFK', to_airport: ['LHR', 'CDG'], departure_date: '2026-12-16', limit: 1 }), res('a', answer),
    use('b', { from_airport: 'JFK', to_airport: ['LHR'], departure_date: '2026-12-23', limit: 1 }), res('b', answer), // wrong destinations
    use('c', { from_airport: 'JFK', to_airport: 'CDG,LHR', departure_date: '2026-12-30', departure_date_to: '2027-01-30' }), res('c', answer), // a range
    use('d', { from_airport: 'JFK', to_airport: 'CDG, LHR', departure_date: '2027-01-06', currency: 'eur' }), res('d', answer), // other currency
  ].join('\n');
  const got = parseStream(text, 'JFK', ['LHR', 'CDG'], ['2026-12-16', '2026-12-23', '2026-12-30', '2027-01-06']);
  assert.deepEqual(Object.keys(got), ['2026-12-16']);
  assert.equal(got['2026-12-16'].per.CDG.fare.price, 432);
});

const point = (date, price, status = 'ok') => ({
  date, status, fetched_at: '2026-11-11T22:00:00Z', source: 'test',
  ...(status === 'ok' ? { fare: pickRow(row(price)) } : { reason: 'x' }),
});

test('summary: cheapest date, cheapest month, and a thin route gets no page', () => {
  const pts = ['2026-11-25', '2026-12-02', '2026-12-09', '2026-12-16', '2026-12-23', '2026-12-30', '2027-01-06'].map((d, i) => point(d, [400, 380, 350, 390, 420, 410, 300][i]));
  pts.push(point('2027-01-13', 0, 'failed'));
  const s = summarise(ROUTES, { slug: 'jfk-to-lhr', from: 'JFK', to: 'LHR', currency: 'usd', trip: 't', points: pts });
  assert.equal(s.cheapest.date, '2027-01-06');
  assert.equal(s.cheapestMonth.month, '2027-01');
  assert.equal(s.months.find((m) => m.month === '2027-01').searched, 2);
  assert.equal(s.months.find((m) => m.month === '2027-01').priced, 1);
  assert.deepEqual(spacingText(s), { cadence: 'one a week', weekday: 'Wednesday' });
  assert.ok(routeFareDescription(s).length <= 155);
  assert.ok(routeFareDescription(s).includes('$300') && routeFareDescription(s).includes(dayLabel('2027-01-06')));
  const thin = pts.slice(0, MIN_PRICED_DATES - 1);
  assert.equal(summarise(ROUTES, { slug: 'jfk-to-lhr', from: 'JFK', to: 'LHR', currency: 'usd', trip: 't', points: thin }), null);
});

test('every committed fares file is a listed route with sane, sourced points', () => {
  const { list } = loadRoutes();
  const slugs = new Set(list.map((r) => r.slug));
  const files = fs.existsSync(FARES_DIR) ? fs.readdirSync(FARES_DIR).filter((f) => f.endsWith('.json')) : [];
  for (const f of files) {
    const d = JSON.parse(fs.readFileSync(path.join(FARES_DIR, f), 'utf8'));
    assert.ok(slugs.has(d.slug), `${f}: not in routes.json`);
    assert.equal(`${d.slug}.json`, f);
    assert.equal(d.slug, slugOf(d.from, d.to));
    for (const p of d.points) {
      assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(p.fetched_at, /^\d{4}-\d{2}-\d{2}T/);
      assert.ok(['ok', 'empty', 'failed'].includes(p.status));
      if (p.status === 'ok') {
        assert.ok(Number.isFinite(p.fare.price) && p.fare.price > 0, `${f} ${p.date}`);
        if (p.fare.buy_link) assert.ok(p.fare.buy_link.startsWith('https://www.google.com/travel/flights'));
      } else assert.equal(p.fare, undefined);
    }
  }
});
