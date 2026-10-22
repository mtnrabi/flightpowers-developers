#!/usr/bin/env node
/**
 * The one-click install links in src/lib/site.ts. Each link is decoded back
 * the way the client reads it, and must land on the right server URL. Run
 * with `npm test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LINKS, installLinks } from '../src/lib/site.ts';

const SERVERS = [
  ['free', LINKS.mcpFree, 'flightpowers-free', 'FlightPowers (free)'],
  ['flights', LINKS.mcpFlights, 'flightpowers-flights', 'FlightPowers Flights'],
  ['hotels', LINKS.mcpHotels, 'flightpowers-hotels', 'FlightPowers Hotels'],
];

for (const [server, url, name, connectorName] of SERVERS) {
  test(`${server}: Claude prefill opens the add-connector dialog with this URL`, () => {
    const u = new URL(installLinks(server).claude);
    assert.equal(u.origin + u.pathname, 'https://claude.ai/customize/connectors');
    assert.equal(u.searchParams.get('modal'), 'add-custom-connector');
    assert.equal(u.searchParams.get('connectorName'), connectorName);
    assert.equal(u.searchParams.get('connectorUrl'), url);
  });

  test(`${server}: Cursor config is base64 of {url} only`, () => {
    const links = installLinks(server);
    for (const link of [links.cursor, links.cursorWeb]) {
      const u = new URL(link);
      assert.equal(u.searchParams.get('name'), name);
      assert.deepEqual(JSON.parse(atob(u.searchParams.get('config'))), { url });
    }
    assert.ok(links.cursor.startsWith('cursor://anysphere.cursor-deeplink/mcp/install?'));
    assert.ok(links.cursorWeb.startsWith('https://cursor.com/install-mcp?'));
  });

  test(`${server}: VS Code config is an http server with this URL`, () => {
    const u = new URL(installLinks(server).vscode);
    assert.equal(u.origin + u.pathname, 'https://vscode.dev/redirect/mcp/install');
    assert.equal(u.searchParams.get('name'), name);
    assert.deepEqual(JSON.parse(u.searchParams.get('config')), { type: 'http', url });
  });

  test(`${server}: Claude Code command`, () => {
    assert.equal(installLinks(server).claudeCode, `claude mcp add --transport http ${name} ${url}`);
  });
}

test('the install-ux reference links come out byte for byte (free server)', () => {
  const free = installLinks('free');
  assert.equal(
    free.cursor,
    'cursor://anysphere.cursor-deeplink/mcp/install?name=flightpowers-free&config=eyJ1cmwiOiJodHRwczovL2ZyZWUtdHJpYWwuZmxpZ2h0cG93ZXJzLmNvbS9tY3AifQ%3D%3D'
  );
  assert.equal(
    free.vscode,
    'https://vscode.dev/redirect/mcp/install?name=flightpowers-free&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Ffree-trial.flightpowers.com%2Fmcp%22%7D'
  );
});

test('the free server page for people is the root, not the /mcp endpoint', () => {
  assert.equal(LINKS.freeHome, 'https://free-trial.flightpowers.com/');
});
