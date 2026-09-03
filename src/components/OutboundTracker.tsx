'use client';

import { useEffect } from 'react';
import { track } from '@/lib/track';
import { matchOutboundTarget } from '@/lib/outbound';

/**
 * One delegated listener for the whole site, instead of wrapping every
 * marketplace link by hand. `TrackedLink` and the handful of manual
 * `track({ e: 'outbound' })` calls (e.g. `FloatingCta`) existed before this
 * and covered almost nothing in practice — most outbound `<a>`s on the site
 * (nav, footer, pricing tables, compare pages) carry no click handler at
 * all, so a real conversion (2026-09-03: a RapidAPI signup two minutes after
 * two organic homepage sessions) left no outbound-click row to attribute it
 * to. This closes that gap for every current and future link, with no
 * per-page wiring.
 *
 * Delegated on `document` for `click` and `auxclick` (the second covers
 * middle-click / open-in-new-tab, which is how most people leave for a
 * marketplace). Never calls `preventDefault` or awaits anything, so the
 * browser's own navigation is never delayed — `track()` already fires via
 * `sendBeacon` with a `keepalive` fetch fallback.
 *
 * `data-fp-skip-auto` opts an anchor out, for the few places that already
 * send their own `outbound` beacon (`TrackedLink`, `FloatingCta`) — without
 * it those clicks would be double-counted.
 */
function handleOutboundClick(e: MouseEvent) {
  if (e.defaultPrevented) return;
  const target = e.target;
  if (!(target instanceof Element)) return;

  const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
  if (!anchor) return;
  if (anchor.closest('[data-fp-skip-auto]')) return;

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return;
  }

  const outboundTarget = matchOutboundTarget(url, window.location.hostname);
  if (!outboundTarget) return;

  track({ e: 'outbound', target: outboundTarget, medium: 'auto' });
}

export function OutboundTracker() {
  useEffect(() => {
    document.addEventListener('click', handleOutboundClick, true);
    document.addEventListener('auxclick', handleOutboundClick, true);
    return () => {
      document.removeEventListener('click', handleOutboundClick, true);
      document.removeEventListener('auxclick', handleOutboundClick, true);
    };
  }, []);

  return null;
}
