'use client';

import { track } from '@/lib/track';
import { CodeTabs } from './CodeTabs';
import type { Snippets } from '@/lib/snippets';

/**
 * The single most important component on the site. Rendered under every
 * demo result and every tool result: the exact request that reproduces
 * what the visitor is looking at, pre-filled with their own inputs, key
 * shown as $RAPIDAPI_KEY, and a UTM-tagged deep link to the RapidAPI
 * pricing tab.
 */
export function ApiUpsellCard({
  snippets,
  tool,
  pricingHref,
  docsHref,
  headline = 'Get this exact result from your own code',
  body = 'The same data you are looking at, as JSON, with price_insights_low/high and the low | typical | high verdict on every row.',
}: {
  snippets: Snippets;
  tool: string;
  pricingHref: string;
  docsHref: string;
  headline?: string;
  body?: string;
}) {
  return (
    <aside className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-5 sm:p-6">
      <p className="flex items-center gap-2 text-[16px] font-semibold text-ink-100">
        <span aria-hidden="true" className="text-signal-500">
          ⚡
        </span>
        {headline}
      </p>
      <p className="mt-1.5 text-[14px] text-ink-300 leading-relaxed">{body}</p>
      <div className="mt-4">
        <CodeTabs snippets={snippets} tool={tool} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={pricingHref}
          rel="noopener"
          className="btn btn-accent !py-2 text-sm"
          onClick={() => track({ e: 'api_upsell_click', tool, action: 'get_key' })}
        >
          Get your free RapidAPI key →
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
