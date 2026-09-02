'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/track';
import { CodeTabs } from './CodeTabs';
import type { Snippets, SnippetPair } from '@/lib/snippets';

const HOSTS: { id: keyof SnippetPair; label: string; note: string }[] = [
  {
    id: 'rapidapi',
    label: 'RapidAPI host',
    note: 'The marketplace host you subscribe on. The key in the snippet is your RapidAPI key.',
  },
  {
    id: 'own',
    label: 'api.flightpowers.com',
    note: 'Our own domain: same engines, same key, /v1 paths, one OpenAPI spec. The call does not depend on a marketplace listing staying up.',
  },
];

function isPair(s: Snippets | SnippetPair): s is SnippetPair {
  return 'rapidapi' in s && 'own' in s;
}

/**
 * The single most important component on the site. Rendered under every
 * demo result and every tool result: the exact request that reproduces
 * what the visitor is looking at, pre-filled with their own inputs, key
 * shown as $RAPIDAPI_KEY, and a UTM-tagged deep link to the RapidAPI
 * pricing tab.
 *
 * Given a SnippetPair it also offers the host toggle, so the same query is
 * one click away from a request against a domain we own — the standing
 * answer to "RapidAPI listings vanish".
 *
 * Instrumentation is as much the point as the code is: `upsell_view` fires
 * once when the card first scrolls into view, the tabs and buttons fire
 * `api_upsell_click`. With `demo_run` before it and `email_submit` after,
 * the funnel is measurable end to end.
 */
export function ApiUpsellCard({
  snippets,
  tool,
  pricingHref,
  docsHref,
  headline = 'Get this exact result from your own code',
  body = 'The same data you are looking at, as JSON, with price_insights_low/high and the low | typical | high verdict on every row.',
}: {
  snippets: Snippets | SnippetPair;
  tool: string;
  pricingHref: string;
  docsHref: string;
  headline?: string;
  body?: string;
}) {
  const pair = isPair(snippets) ? snippets : null;
  const [host, setHost] = useState<keyof SnippetPair>('rapidapi');
  const ref = useRef<HTMLElement>(null);
  const seen = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      seen.current = true;
      track({ e: 'upsell_view', tool });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seen.current) {
            seen.current = true;
            track({ e: 'upsell_view', tool });
            io.disconnect();
          }
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [tool]);

  const active = pair ? pair[host] : (snippets as Snippets);
  const activeNote = HOSTS.find((h) => h.id === host)?.note ?? '';

  return (
    <aside ref={ref} className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-5 sm:p-6">
      <p className="flex items-center gap-2 text-[16px] font-semibold text-ink-100">
        <span aria-hidden="true" className="text-signal-500">
          ⚡
        </span>
        {headline}
      </p>
      <p className="mt-1.5 text-[14px] text-ink-300 leading-relaxed">{body}</p>

      {pair ? (
        <div className="mt-4">
          <div className="flex flex-wrap gap-1.5">
            {HOSTS.map((h) => (
              <button
                key={h.id}
                type="button"
                aria-pressed={host === h.id}
                onClick={() => {
                  setHost(h.id);
                  track({ e: 'api_upsell_click', tool, action: `host_${h.id}` });
                }}
                className={`max-w-full truncate rounded-lg px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors ${
                  host === h.id ? 'bg-ink-700 text-ink-100' : 'border rule text-ink-400 hover:text-ink-200'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-ink-400 leading-relaxed">{activeNote}</p>
        </div>
      ) : null}

      <div className="mt-4">
        <CodeTabs snippets={active} tool={tool} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <a
          href={pricingHref}
          rel="noopener"
          className="btn btn-accent !py-2 text-sm"
          onClick={() => track({ e: 'api_upsell_click', tool, action: 'get_key' })}
        >
          Get your free RapidAPI key →
        </a>
        <a
          href="/docs/quickstart"
          className="text-sm text-ink-300 underline underline-offset-4 hover:text-ink-100"
          onClick={() => track({ e: 'api_upsell_click', tool, action: 'quickstart' })}
        >
          Five-minute quickstart
        </a>
        <a
          href={docsHref}
          className="text-sm text-ink-300 underline underline-offset-4 hover:text-ink-100"
          onClick={() => track({ e: 'api_upsell_click', tool, action: 'docs' })}
        >
          Read the docs
        </a>
      </div>
    </aside>
  );
}
