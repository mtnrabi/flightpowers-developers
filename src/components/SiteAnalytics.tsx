'use client';

import { Analytics } from '@vercel/analytics/next';
import { beforeSendAnalytics } from '@/lib/analytics';

/**
 * Vercel Web Analytics: cookieless page-view counts, served from our own
 * origin (/_vercel/insights/*), read by the growth dashboard through Vercel's
 * API. A client wrapper only because `beforeSend` is a function, which a
 * Server Component cannot pass down.
 */
export function SiteAnalytics() {
  return <Analytics beforeSend={beforeSendAnalytics} />;
}
