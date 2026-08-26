'use client';

/**
 * First-party event tracking — fires to /api/e via sendBeacon (fetch
 * fallback). No cookies, no identifiers, nothing blocking. Every free-tool
 * interaction and outbound marketplace click goes through here; it is the
 * only site→marketplace attribution we have.
 */

export type TrackEvent = {
  e: 'api_upsell_click' | 'demo_run' | 'outbound' | 'verify_key';
  tool?: string;
  action?: string;
  target?: string;
  medium?: string;
  mode?: string;
};

export function track(event: TrackEvent): void {
  try {
    const payload = JSON.stringify({ ...event, path: window.location.pathname });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/e', new Blob([payload], { type: 'application/json' }));
    } else {
      void fetch('/api/e', { method: 'POST', body: payload, keepalive: true, headers: { 'content-type': 'application/json' } });
    }
  } catch {
    // never let analytics break the page
  }
}
