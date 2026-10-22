#!/usr/bin/env node
/**
 * The one-click install links in src/lib/site.ts. Each link is decoded back
 * the way the client reads it, and must land on the right server URL. Run
 * with `npm test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CLAUDE_AUTH_HINT, CLAUDE_AUTH_HINT_LABELLED, LINKS, installLinks } from '../src/lib/site.ts';

const SERVERS = [
  ['free', LINKS.mcpFree, 'flightpowers-free', 'FlightPowers (free, with ads)'],
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
    // claude.ai reads no auth-mode parameter, and any extra parameter lands on
    // a Settings page with no dialog (checked 2026-10-22): exactly these three.
    assert.deepEqual([...u.searchParams.keys()].sort(), ['connectorName', 'connectorUrl', 'modal']);
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

test('the Add to Claude line names the real radio label', () => {
  for (const hint of [CLAUDE_AUTH_HINT, CLAUDE_AUTH_HINT_LABELLED]) {
    assert.match(hint, /‘Sign in when needed’/);
    assert.match(hint, /‘No sign-in’/);
  }
});

// Matan 2026-10-22: "Add to claude / chat gpt buttons should be the paid MCP
// version". Every button and copy line on the site resolves to the paid hosts;
// the free ad server keeps one text line (FREE_SERVER_LINE), never a button.
test('flights and hotels install links resolve to the paid hosts', () => {
  for (const [server, host] of [['flights', 'flights.flightpowers.com'], ['hotels', 'hotels.flightpowers.com']]) {
    const links = installLinks(server);
    assert.equal(new URL(links.url).host, host);
    assert.equal(new URL(new URL(links.claude).searchParams.get('connectorUrl')).host, host);
    assert.equal(new URL(JSON.parse(atob(new URL(links.cursorWeb).searchParams.get('config'))).url).host, host);
    assert.equal(new URL(JSON.parse(new URL(links.vscode).searchParams.get('config')).url).host, host);
    assert.ok(links.claudeCode.endsWith(`https://${host}/mcp`));
  }
});

test('every install button and Claude Code line on the site uses a paid server', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.(tsx|ts|mdx)$/.test(e.name)) files.push(full);
    }
  };
  walk(path.join(process.cwd(), 'src'));
  let buttons = 0;
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/<AddToClientButtons\s+server=(?:"([^"]+)"|\{([^}]+)\})/g)) {
      buttons++;
      if (m[1]) assert.ok(['flights', 'hotels'].includes(m[1]), `${file}: server="${m[1]}"`);
      else assert.match(m[2], /^(server|c\.server)$/, `${file}: server={${m[2]}}`);
    }
    if (!file.endsWith(path.join('lib', 'site.ts'))) {
      assert.doesNotMatch(src, /installLinks\(\s*['"]free['"]\s*\)/, `${file} builds an install link for the free server`);
    }
  }
  assert.ok(buttons >= 5, `found only ${buttons} buttons`);
});
