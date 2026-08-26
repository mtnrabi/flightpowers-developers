'use client';

import { useState } from 'react';
import { track } from '@/lib/track';
import { CapturedBadge } from './ui';

/**
 * The canned [Execute] proof device: a real captured request + its real
 * captured response, replayed with a short delay. Honestly labelled — the
 * button runs the captured request, it does not spend anyone's quota.
 * The full response is in the server HTML (hidden until executed).
 */
export function ExecuteWidget({
  title,
  requestText,
  responseText,
  headers,
  capturedAt,
  tool,
}: {
  title: string;
  requestText: string;
  responseText: string;
  headers?: Record<string, string>;
  capturedAt: string;
  tool: string;
}) {
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');

  function run() {
    if (state === 'running') return;
    setState('running');
    track({ e: 'demo_run', tool, mode: 'canned' });
    setTimeout(() => setState('done'), 750);
  }

  return (
    <div className="terminal">
      <div className="terminal-bar justify-between">
        <div className="flex items-center gap-2">
          <span className="terminal-dots flex gap-1.5" aria-hidden="true">
            <span className="bg-verdict-high/70" />
            <span className="bg-verdict-typical/70" />
            <span className="bg-verdict-low/70" />
          </span>
          <span className="uppercase tracking-wider">{title}</span>
        </div>
        <CapturedBadge date={capturedAt} />
      </div>

      <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed border-b rule">
        <code className="font-mono text-ink-200">{requestText}</code>
      </pre>

      <div className="flex items-center gap-3 px-4 py-2.5 border-b rule">
        <button
          type="button"
          onClick={run}
          className="btn btn-accent !px-4 !py-1.5 text-[13px]"
          disabled={state === 'running'}
        >
          {state === 'running' ? 'Running…' : state === 'done' ? 'Run again' : 'Execute'}
        </button>
        <span className="font-mono text-[11px] text-ink-500">
          Replays the captured request — free, no account, nobody&apos;s quota.
        </span>
      </div>

      <div className={state === 'done' ? '' : 'hidden'} aria-hidden={state !== 'done'}>
        {headers && Object.keys(headers).length > 0 ? (
          <div className="px-4 pt-3 flex flex-wrap gap-1.5">
            {Object.entries(headers).map(([k, v]) => (
              <span key={k} className="font-mono text-[10.5px] rounded bg-ink-800 border rule px-1.5 py-0.5 text-ink-400">
                {k}: <span className={v === 'ok' ? 'text-verdict-low' : v === 'degraded' ? 'text-verdict-high' : 'text-ink-300'}>{v}</span>
              </span>
            ))}
          </div>
        ) : null}
        <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed max-h-96">
          <code className="font-mono text-ink-300">{responseText}</code>
        </pre>
      </div>
    </div>
  );
}
