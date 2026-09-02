'use client';

import { getAttribution } from '@/lib/attribution';

/**
 * First-party event tracking — fires to /api/e via sendBeacon (fetch
 * fallback). No cookies, no identifiers, nothing blocking. Every free-tool
 * interaction and outbound marketplace click goes through here; it is the
 * only site→marketplace attribution we have.
 *
 * Every event carries this tab's first-touch campaign labels (`us`/`um`/`uc`)
 * and referrer host (`ref`) from `@/lib/attribution`, which is what makes a
 * funnel step attributable to the post that produced it. Those four fields are
 * copied from the URL the visitor arrived on; they are not identifiers.
 */

export type TrackEvent = {
  e:
    | 'api_upsell_click'
    | 'upsell_view'
    | 'demo_run'
    | 'outbound'
    | 'verify_key'
    | 'email_submit'
    | 'session_start';
  tool?: string;
  action?: string;
  target?: string;
  medium?: string;
  mode?: string;
};

export function track(event: TrackEvent): void {
  try {
    const payload = JSON.stringify({
      ...event,
      ...getAttribution(),
      path: window.location.pathname,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/e', new Blob([payload], { type: 'application/json' }));
    } else {
      void fetch('/api/e', { method: 'POST', body: payload, keepalive: true, headers: { 'content-type': 'application/json' } });
    }
  } catch {
    // never let analytics break the page
  }
}
