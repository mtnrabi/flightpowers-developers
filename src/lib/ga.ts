/**
 * Google Analytics 4: the site's visit counter (2026-10-07).
 *
 * WHY. The first-party beacon (`/api/e`, `fp_events`) counts tool use and
 * campaign arrivals, but nothing outside this repo can read it, so the growth
 * dashboard (gcrew) had no visits line for flightpowers.com. GA4 is read
 * through its Data API with the same Google sign-in as Search Console, so the
 * dashboard fetches visits by itself; nobody types a number in.
 *
 * WHAT IT SENDS. Page views and GA4's enhanced measurement (scrolls, outbound
 * clicks, site search, file downloads, form starts), no user id, no ads:
 *
 *   - ad_storage / ad_user_data / ad_personalization are denied everywhere,
 *     and Google signals and ad personalisation are off;
 *   - in the EEA, the UK and Switzerland analytics_storage is denied too, so
 *     visitors there get no cookie and GA4 receives cookieless pings only
 *     (no consent banner needed; those visits are under-counted in GA4,
 *     the first-party session beacon still counts them);
 *   - everywhere else GA4 sets its own first-party `_ga` cookies.
 *
 * Off unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set, which it is on production
 * only, so previews and local builds never send a hit.
 */

/** EEA members + UK + CH, as ISO 3166-1 alpha-2, the form gtag's `region` takes. */
export const CONSENT_DENIED_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO',
  'GB', 'CH',
] as const;

const MEASUREMENT_ID = /^G-[A-Z0-9]{4,16}$/;

/** The measurement id, or null when unset or malformed (a typo must not inject script). */
export function gaMeasurementId(raw = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID): string | null {
  const id = (raw ?? '').trim();
  return MEASUREMENT_ID.test(id) ? id : null;
}

/** The inline bootstrap: consent defaults first, then config. */
export function gaBootstrap(id: string): string {
  const denied = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  return [
    'window.dataLayer=window.dataLayer||[];',
    'function gtag(){dataLayer.push(arguments);}',
    `gtag('consent','default',${JSON.stringify({ ...denied, analytics_storage: 'denied', region: CONSENT_DENIED_REGIONS })});`,
    `gtag('consent','default',${JSON.stringify({ ...denied, analytics_storage: 'granted' })});`,
    "gtag('js',new Date());",
    `gtag('config',${JSON.stringify(id)},${JSON.stringify({ allow_google_signals: false, allow_ad_personalization_signals: false })});`,
  ].join('');
}
