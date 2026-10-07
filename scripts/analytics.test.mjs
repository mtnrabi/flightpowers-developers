#!/usr/bin/env node
/**
 * The page-view redaction in src/lib/analytics.ts. The privacy page says Vercel
 * Web Analytics gets no personal identifiers; /unsubscribe?t=<token> is the
 * one URL on the site that would carry one. Run with `npm test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { beforeSendAnalytics, redactAnalyticsUrl } from '../src/lib/analytics.ts';

test('the unsubscribe token never leaves', () => {
  assert.equal(
    redactAnalyticsUrl('https://flightpowers.com/unsubscribe?t=abc123'),
    'https://flightpowers.com/unsubscribe'
  );
});

test('campaign labels stay, everything else in the query goes', () => {
  assert.equal(
    redactAnalyticsUrl('https://flightpowers.com/pricing?utm_source=reddit&email=a%40b.c&utm_campaign=post-1#plans'),
    'https://flightpowers.com/pricing?utm_source=reddit&utm_campaign=post-1'
  );
});

test('plain pages pass unchanged', () => {
  assert.equal(redactAnalyticsUrl('https://flightpowers.com/flights-api'), 'https://flightpowers.com/flights-api');
});

test('the admin dashboard is not counted', () => {
  assert.equal(redactAnalyticsUrl('https://admin.flightpowers.com/admin'), null);
  assert.equal(redactAnalyticsUrl('https://flightpowers.com/admin'), null);
  assert.equal(redactAnalyticsUrl('https://flightpowers.com/admin/anything'), null);
  assert.notEqual(redactAnalyticsUrl('https://flightpowers.com/administrator-guide'), null);
});

test('beforeSend keeps the event shape and drops on null', () => {
  assert.deepEqual(beforeSendAnalytics({ type: 'pageview', url: 'https://flightpowers.com/unsubscribe?t=x' }), {
    type: 'pageview',
    url: 'https://flightpowers.com/unsubscribe',
  });
  assert.equal(beforeSendAnalytics({ type: 'pageview', url: 'https://admin.flightpowers.com/admin' }), null);
  assert.equal(beforeSendAnalytics({ type: 'pageview', url: 'not a url' }), null);
});
