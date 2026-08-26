'use client';

import { useState } from 'react';
import { track } from '@/lib/track';
import type { Snippets } from '@/lib/snippets';

const TABS: { id: keyof Snippets; label: string; action: string }[] = [
  { id: 'curl', label: 'cURL', action: 'copy_curl' },
  { id: 'python', label: 'Python', action: 'copy_python' },
  { id: 'node', label: 'Node', action: 'copy_node' },
];

/**
 * Tabbed cURL / Python / Node code block with a copy button.
 * The cURL tab's content is server-rendered on first paint (it is the
 * initial state), so crawlers see a real request without JS.
 */
export function CodeTabs({ snippets, tool }: { snippets: Snippets; tool: string }) {
  const [active, setActive] = useState<keyof Snippets>('curl');
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippets[active]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
    track({ e: 'api_upsell_click', tool, action: TABS.find((t) => t.id === active)?.action ?? 'copy' });
  }

  return (
    <div className="terminal">
      <div className="terminal-bar justify-between">
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={`rounded px-2.5 py-1 font-mono text-[11px] tracking-wide transition-colors ${
                active === t.id ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copy}
          className="rounded px-2.5 py-1 font-mono text-[11px] text-ink-400 hover:text-signal-400 transition-colors"
        >
          {copied ? 'copied ✓' : 'copy'}
        </button>
      </div>
      <pre tabIndex={0} className="overflow-x-auto p-4 text-[12.5px] leading-relaxed">
        <code className="font-mono text-ink-200">{snippets[active]}</code>
      </pre>
    </div>
  );
}
