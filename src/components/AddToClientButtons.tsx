'use client';

import { useState, type ReactElement } from 'react';
import { CLAUDE_AUTH_HINT, installLinks, type InstallServer } from '@/lib/site';
import { track } from '@/lib/track';

/**
 * One row of install buttons for one MCP server: Add to Claude (claude.ai
 * opens "Add custom connector" already filled in), Add to Cursor (Cursor's
 * own badge, served from /public because the CSP allows no outside images;
 * the https form, so a machine without Cursor lands on a page, not nothing),
 * Install in VS Code, a link to the ChatGPT steps (ChatGPT has no prefill
 * link), and a copy button for the Claude Code command.
 *
 * Every click sends `install_click` with tool = server and action = client,
 * so the beacon shows which button on which page gets used.
 */

export type InstallClient = 'claude' | 'cursor' | 'vscode' | 'chatgpt' | 'claude-code';

const ALL: InstallClient[] = ['claude', 'cursor', 'vscode', 'chatgpt', 'claude-code'];

export function AddToClientButtons({
  server,
  clients = ALL,
  chatgptHref = '/integrations/chatgpt#connect',
  claudeLabel = 'Add to Claude',
  claudeVariant = 'primary',
  claudeHint = true,
}: {
  server: InstallServer;
  /** which buttons, in this order */
  clients?: InstallClient[];
  chatgptHref?: string;
  claudeLabel?: string;
  claudeVariant?: 'primary' | 'ghost';
  /** the sign-in line under the row; off only where the page prints it itself */
  claudeHint?: boolean;
}) {
  const links = installLinks(server);
  const [copied, setCopied] = useState(false);
  const click = (client: InstallClient) => track({ e: 'install_click', tool: server, action: client });

  async function copy() {
    click('claude-code');
    try {
      await navigator.clipboard.writeText(links.claudeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  const buttons: Record<InstallClient, ReactElement> = {
    claude: (
      <a key="claude" href={links.claude} target="_blank" rel="noopener" className={`btn btn-${claudeVariant}`} onClick={() => click('claude')}>
        {claudeLabel}
      </a>
    ),
    cursor: (
      <a key="cursor" href={links.cursorWeb} target="_blank" rel="noopener" className="inline-flex items-center" onClick={() => click('cursor')}>
        <img src="/badges/add-to-cursor-dark.svg" alt="Add to Cursor" width={126} height={28} className="h-10 w-auto" />
      </a>
    ),
    vscode: (
      <a key="vscode" href={links.vscode} target="_blank" rel="noopener" className="btn btn-ghost" onClick={() => click('vscode')}>
        Install in VS Code
      </a>
    ),
    chatgpt: (
      <a key="chatgpt" href={chatgptHref} className="btn btn-ghost" onClick={() => click('chatgpt')}>
        ChatGPT steps
      </a>
    ),
    'claude-code': (
      <button key="claude-code" type="button" onClick={copy} className="btn btn-ghost" title={links.claudeCode}>
        {copied ? 'Copied ✓' : 'Copy Claude Code command'}
      </button>
    ),
  };

  const row = <div className="flex flex-wrap items-center gap-3">{clients.map((c) => buttons[c])}</div>;
  if (!claudeHint || !clients.includes('claude')) return row;
  return (
    <div>
      {row}
      <p className="mt-2 text-[12.5px] text-ink-400 leading-relaxed">
        {clients.length > 1 ? `Add to Claude: ${CLAUDE_AUTH_HINT.replace(/^On/, 'on')}` : CLAUDE_AUTH_HINT}
      </p>
    </div>
  );
}
