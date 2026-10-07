#!/usr/bin/env node
/**
 * The GA4 tag (src/lib/ga.ts): off without a well-formed id, and consent
 * defaults that deny ads everywhere and analytics storage in the EEA/UK/CH.
 * Run with `npm test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONSENT_DENIED_REGIONS, gaBootstrap, gaMeasurementId } from '../src/lib/ga.ts';

test('no id, a blank id or a malformed id renders no tag', () => {
  assert.equal(gaMeasurementId(undefined), null);
  assert.equal(gaMeasurementId(''), null);
  assert.equal(gaMeasurementId('UA-12345-1'), null);
  assert.equal(gaMeasurementId("G-ABC');alert(1);//"), null);
  assert.equal(gaMeasurementId(' G-ABCDEF1234 '), 'G-ABCDEF1234');
});

function consentCalls(src) {
  const calls = [];
  const dataLayer = [];
  const window = { dataLayer };
  // eslint-disable-next-line no-new-func
  new Function('window', 'dataLayer', `${src}`)(window, dataLayer);
  for (const args of window.dataLayer) calls.push(Array.from(args));
  return calls;
}

test('bootstrap: regional deny first, then the global default, then config without ads signals', () => {
  const calls = consentCalls(gaBootstrap('G-ABCDEF1234'));
  const consent = calls.filter((c) => c[0] === 'consent');
  assert.equal(consent.length, 2);
  const [regional, global] = consent.map((c) => c[2]);
  assert.equal(regional.analytics_storage, 'denied');
  assert.deepEqual(regional.region, [...CONSENT_DENIED_REGIONS]);
  for (const r of ['DE', 'FR', 'GB', 'CH', 'NO', 'IE']) assert.ok(regional.region.includes(r), r);
  assert.equal(global.analytics_storage, 'granted');
  assert.equal(global.region, undefined);
  for (const c of [regional, global]) {
    assert.equal(c.ad_storage, 'denied');
    assert.equal(c.ad_user_data, 'denied');
    assert.equal(c.ad_personalization, 'denied');
  }
  const config = calls.find((c) => c[0] === 'config');
  assert.equal(config[1], 'G-ABCDEF1234');
  assert.equal(config[2].allow_google_signals, false);
  assert.equal(config[2].allow_ad_personalization_signals, false);
  // consent defaults must reach the dataLayer before config
  assert.ok(calls.indexOf(config) > calls.indexOf(consent[1]));
});

test('the region list is the 30 EEA members plus GB and CH', () => {
  assert.equal(new Set(CONSENT_DENIED_REGIONS).size, 32);
});
