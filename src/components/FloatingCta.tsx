'use client';

import { useEffect, useState } from 'react';
import { track } from '@/lib/track';
import { rapidApiPricingUrl } from '@/lib/site';

/**
 * Floating CTA for guides and blog posts only: a sidebar card on desktop,
 * a bottom bar on mobile. Appears after the reader scrolls (scrollY > 100),
 * dismissible, remembers nothing.
 */
export function FloatingCta() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 100);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible || dismissed) return null;

  const href = rapidApiPricingUrl('flights', 'blog');

  return (
    <>
      {/* Desktop sidebar card */}
      <aside className="hidden xl:block fixed right-6 top-28 w-[280px] rounded-2xl border border-signal-600/40 bg-ink-900 p-5 shadow-2xl z-30">
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-2.5 text-ink-500 hover:text-ink-200"
        >
          ×
        </button>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-signal-500">Live travel data</p>
        <p className="mt-2 text-[15px] font-semibold text-ink-100 leading-snug">
          Fares with Google&apos;s price band and a low | typical | high verdict on every row.
        </p>
        <p className="mt-2 text-[13px] text-ink-400">One-way, round-trip, and hotel pricing as clean JSON.</p>
        <a
          href={href}
          rel="noopener"
          className="btn btn-primary mt-4 w-full text-sm"
          // Already sends its own `outbound` beacon — opt out of
          // OutboundTracker's delegated handler to avoid double-counting.
          data-fp-skip-auto
          onClick={() => track({ e: 'outbound', target: 'rapidapi', medium: 'blog-floating' })}
        >
          Get a free key →
        </a>
        <p className="mt-2 text-center font-mono text-[10.5px] text-ink-500">Free tier · no card to try</p>
      </aside>

      {/* Mobile bottom bar */}
      <div className="xl:hidden fixed inset-x-0 bottom-0 z-30 border-t rule bg-ink-950/95 backdrop-blur px-4 py-3 flex items-center gap-3">
        <p className="min-w-0 flex-1 text-[13px] text-ink-300 truncate">Live fares with a price verdict, as an API.</p>
        <a
          href={href}
          rel="noopener"
          className="btn btn-accent !px-4 !py-1.5 text-[13px] shrink-0"
          // Already sends its own `outbound` beacon — opt out of
          // OutboundTracker's delegated handler to avoid double-counting.
          data-fp-skip-auto
          onClick={() => track({ e: 'outbound', target: 'rapidapi', medium: 'blog-floating' })}
        >
          Get a key
        </a>
        <button type="button" aria-label="Dismiss" onClick={() => setDismissed(true)} className="text-ink-500 hover:text-ink-200 px-1">
          ×
        </button>
      </div>
    </>
  );
}
