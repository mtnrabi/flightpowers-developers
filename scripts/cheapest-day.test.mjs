#!/usr/bin/env node
/**
 * The pure half of the "Cheapest day to fly" tool (src/lib/cheapest-day.ts):
 * input validation, the exact request body, the calendar layout and the
 * Google Flights link. Run with `npm test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  calendarCells,
  checkCheapestDay,
  cheapestDatesBody,
  cheapestRow,
  googleFlightsUrl,
  mcpPrompt,
  nextMonth,
  usd,
} from '../src/lib/cheapest-day.ts';
import { cheapestDatesSnippets } from '../src/lib/snippets.ts';

const NOW = new Date('2026-11-23T20:00:00Z');

test('valid input is normalised', () => {
  const r = checkCheapestDay({ from: ' jfk', to: 'lax ', month: '2027-01', nights: 7 }, NOW);
  assert.deepEqual(r, { ok: true, query: { from: 'JFK', to: 'LAX', month: '2027-01', nights: 7 } });
});

test('one-way is nights 0, and missing nights means one-way', () => {
  const r = checkCheapestDay({ from: 'JFK', to: 'LAX', month: '2026-12' }, NOW);
  assert.equal(r.ok && r.query.nights, 0);
});

test('the current month is allowed, a past month is not', () => {
  assert.equal(checkCheapestDay({ from: 'JFK', to: 'LAX', month: '2026-11', nights: 0 }, NOW).ok, true);
  const past = checkCheapestDay({ from: 'JFK', to: 'LAX', month: '2026-10', nights: 0 }, NOW);
  assert.equal(past.ok, false);
  assert.match(past.message, /past/);
});

test('bad airports, same airport, bad month, far month and bad nights are refused', () => {
  for (const input of [
    { from: 'JF', to: 'LAX', month: '2027-01' },
    { from: 'JFK1', to: 'LAX', month: '2027-01' },
    { from: 'JFK', to: 'jfk', month: '2027-01' },
    { from: 'JFK', to: 'LAX', month: '2027-1' },
    { from: 'JFK', to: 'LAX', month: '2027-13' },
    { from: 'JFK', to: 'LAX', month: '2028-06' },
    { from: 'JFK', to: 'LAX', month: '2027-01', nights: 31 },
    { from: 'JFK', to: 'LAX', month: '2027-01', nights: 2.5 },
    { from: 'JFK', to: 'LAX', month: '2027-01', nights: -1 },
  ]) {
    assert.equal(checkCheapestDay(input, NOW).ok, false, JSON.stringify(input));
  }
});

test('the body sends nights only for a round trip', () => {
  assert.deepEqual(cheapestDatesBody({ from: 'JFK', to: 'LAX', month: '2027-01', nights: 0 }), {
    from_airport: 'JFK',
    to_airport: 'LAX',
    month: '2027-01',
    currency: 'USD',
  });
  assert.equal(cheapestDatesBody({ from: 'JFK', to: 'LAX', month: '2027-01', nights: 7 }).nights, 7);
});

test('the calendar is Monday-first, whole weeks, one cell per day', () => {
  // 2027-01-01 is a Friday: four pads (Mon-Thu) before day 1.
  const rows = [
    { departure_date: '2027-01-01', price: 457 },
    { departure_date: '2027-01-06', return_date: '2027-01-13', price: 357 },
    { departure_date: '2027-01-07', price: null },
  ];
  const cells = calendarCells('2027-01', rows);
  assert.equal(cells.length % 7, 0);
  assert.deepEqual(cells.slice(0, 4).map((c) => c.kind), ['pad', 'pad', 'pad', 'pad']);
  const days = cells.filter((c) => c.kind === 'day');
  assert.equal(days.length, 31);
  const d6 = days[5];
  assert.equal(d6.date, '2027-01-06');
  assert.equal(d6.cheapest, true);
  assert.equal(d6.heat, 0);
  assert.equal(d6.returnDate, '2027-01-13');
  assert.equal(days[0].heat, 1);
  assert.equal(days[6].price, null);
  assert.equal(days[6].missing, false);
  assert.equal(days[1].missing, true);
});

test('cheapestRow skips nulls and keeps the earliest of a tie', () => {
  const best = cheapestRow([
    { departure_date: '2027-01-01', price: null },
    { departure_date: '2027-01-02', price: 300 },
    { departure_date: '2027-01-03', price: 300 },
    { departure_date: '2027-01-04', price: 410 },
  ]);
  assert.equal(best?.departure_date, '2027-01-02');
  assert.equal(cheapestRow([{ departure_date: '2027-01-01', price: null }]), null);
});

test('the Google Flights link names the dates', () => {
  const ow = googleFlightsUrl('JFK', 'LAX', '2027-01-06');
  assert.ok(ow.startsWith('https://www.google.com/travel/flights?q='));
  assert.match(decodeURIComponent(ow), /One way flights from JFK to LAX on 2027-01-06/);
  assert.match(decodeURIComponent(googleFlightsUrl('JFK', 'LAX', '2027-01-06', '2027-01-13')), /on 2027-01-06 through 2027-01-13/);
});

test('snippets hit the cheapest-dates path on both hosts and never carry a key', () => {
  const body = cheapestDatesBody({ from: 'JFK', to: 'LAX', month: '2027-01', nights: 7 });
  const own = cheapestDatesSnippets(body, 'own');
  const rapid = cheapestDatesSnippets(body, 'rapidapi');
  assert.match(own.curl, /https:\/\/api\.flightpowers\.com\/v1\/flights\/cheapest-dates/);
  assert.match(rapid.curl, /google-flights-live-api\.p\.rapidapi\.com\/api\/google_flights\/cheapest_dates\/v1/);
  for (const s of [own, rapid]) {
    for (const text of Object.values(s)) {
      assert.match(text, /RAPIDAPI_KEY/);
      assert.match(text, /"nights": 7/);
    }
  }
});

test('small helpers', () => {
  assert.equal(nextMonth(NOW), '2026-12');
  assert.equal(nextMonth(new Date('2026-12-31T23:00:00Z')), '2027-01');
  assert.equal(usd(313.0), '$313');
  assert.equal(usd(1234.4), '$1,234');
  assert.match(mcpPrompt({ from: 'JFK', to: 'LAX', month: '2027-01', nights: 7 }), /January 2027 for a 7-night round trip from JFK to LAX/);
});
