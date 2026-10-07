/**
 * What a Vercel Web Analytics page view is allowed to carry.
 *
 * The privacy page promises no personal identifiers, and one of our URLs
 * carries one: /unsubscribe?t=<token>, where the token maps to a subscriber's
 * address. So every URL leaves with its query string cut down to the three
 * campaign labels the privacy page already says we record, and the private
 * dashboard (admin.flightpowers.com, /admin) is not counted at all.
 *
 * No imports, so `npm test` can run it under plain node.
 */
export const KEPT_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;

/** The redacted URL, or null when the view must not be sent. */
export function redactAnalyticsUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.hostname === 'admin.flightpowers.com') return null;
  if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) return null;

  const kept = new URLSearchParams();
  for (const key of KEPT_PARAMS) {
    const value = url.searchParams.get(key);
    if (value) kept.set(key, value);
  }
  url.search = kept.toString();
  url.hash = '';
  return url.toString();
}

/** `beforeSend` for <Analytics />: same event with a redacted URL, or null. */
export function beforeSendAnalytics<T extends { url: string }>(event: T): T | null {
  const url = redactAnalyticsUrl(event.url);
  return url === null ? null : { ...event, url };
}
