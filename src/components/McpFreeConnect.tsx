'use client';

import { useState } from 'react';
import { track } from '@/lib/track';

/**
 * Connect-the-free-server widget: one tab per client, each with the exact
 * thing you paste and a copy button.
 *
 * The free server takes no key, so for the two clients most people use
 * (Claude and ChatGPT) the whole configuration IS the URL. That is the point
 * of the component: show that, rather than a JSON block that implies setup.
 */

type Client = {
  id: string;
  label: string;
  /** Where the paste goes, in the client's own words. */
  where: string;
  payloadLabel: string;
  payload: string;
  /** A bare URL wraps instead of scrolling: the whole thing stays readable on a phone. */
  wrap?: boolean;
};

export function McpFreeConnect({ url }: { url: string }) {
  const CLIENTS: Client[] = [
    {
      id: 'claude',
      label: 'Claude',
      where: 'Settings → Connectors → Add custom connector. Paste the URL, save, and the four tools appear in a new chat. Leave OAuth and every auth field blank.',
      payloadLabel: 'server url · the whole configuration',
      payload: url,
      wrap: true,
    },
    {
      id: 'chatgpt',
      label: 'ChatGPT',
      where: 'Settings → Connectors → Advanced → Developer mode, then Create. Paste the URL and pick "No authentication".',
      payloadLabel: 'server url · the whole configuration',
      payload: url,
      wrap: true,
    },
    {
      id: 'claude-code',
      label: 'Claude Code',
      where: 'One command in your terminal. Run /mcp afterwards to confirm the server is connected.',
      payloadLabel: 'terminal',
      payload: `claude mcp add --transport http flightpowers-free ${url}`,
    },
    {
      id: 'json',
      label: 'Cursor & others',
      where: 'Anything that takes an mcpServers-style config file (Cursor uses .cursor/mcp.json). No headers, no key, no env block.',
      payloadLabel: 'mcp.json',
      payload: `{
  "mcpServers": {
    "flightpowers-free": {
      "url": "${url}"
    }
  }
}`,
    },
  ];

  const [active, setActive] = useState(CLIENTS[0]!.id);
  const [copied, setCopied] = useState(false);
  const current = CLIENTS.find((c) => c.id === active) ?? CLIENTS[0]!;

  async function copy() {
    try {
      await navigator.clipboard.writeText(current.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
    track({ e: 'api_upsell_click', tool: 'free-mcp', action: `copy_${current.id}` });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="MCP client">
        {CLIENTS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={active === c.id}
            onClick={() => {
              setActive(c.id);
              setCopied(false);
            }}
            className={`rounded-lg px-3 py-1.5 font-mono text-[12px] tracking-wide transition-colors ${
              active === c.id ? 'bg-signal-600/20 text-signal-400 ring-1 ring-signal-600/40' : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-[14.5px] text-ink-300 leading-relaxed">{current.where}</p>

      <div className="terminal mt-3">
        <div className="terminal-bar justify-between">
          <span className="uppercase tracking-wider">{current.payloadLabel}</span>
          <button
            type="button"
            onClick={copy}
            className="rounded px-2.5 py-1 font-mono text-[11px] text-ink-400 hover:text-signal-400 transition-colors"
          >
            {copied ? 'copied ✓' : 'copy'}
          </button>
        </div>
        <pre
          tabIndex={0}
          className={`p-4 text-[12.5px] leading-relaxed ${
            current.wrap ? 'whitespace-pre-wrap break-all' : 'overflow-x-auto'
          }`}
        >
          <code className="font-mono text-ink-200">{current.payload}</code>
        </pre>
      </div>
    </div>
  );
}
