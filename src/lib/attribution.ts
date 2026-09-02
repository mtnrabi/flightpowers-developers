'use client';

/**
 * First-touch campaign attribution — the missing half of the event beacon.
 *
 * Without this, `/api/e` records that something happened but not where the
 * person came from, so a social post and a Google result are indistinguishable
 * in the data. That gap is the entire reason we could not answer "did the
 * posts work".
 *
 * What is stored, and where:
 *   - `sessionStorage`, one key, cleared when the tab closes. Not a cookie,
 *     not localStorage, not shared across tabs, never sent to a third party.
 *   - The value is ONLY the campaign labels that were already in the URL the
 *     person clicked (`utm_source`, `utm_medium`, `utm_campaign`) plus the
 *     referrer's HOSTNAME (never the full referring URL, which can carry a
 *     search query).
 *
 * What is deliberately NOT stored: any identifier. No random id, no
 * fingerprint, no counter that could join two visits together. That keeps the
 * promise on /privacy exactly as written. The consequence is that "sessions"
 * are counted as `session_start` beacons, not as distinct people — see
 * `sent` below.
 *
 * First-touch, not last-touch: the campaign that brought someone to the site
 * is the one that gets the credit, so a click-through from the landing page to
 * /pricing does not overwrite `utm_source=reddit` with an empty value.
 */

export type Attribution = {
  /** utm_source, e.g. `reddit` | `x` | `threads`. Empty when untagged. */
  us: string;
  /** utm_medium, e.g. `social`. */
  um: string;
  /** utm_campaign, the post slug. */
  uc: string;
  /** Referrer HOSTNAME only, e.g. `www.reddit.com`. Empty for direct. */
  ref: string;
};

const KEY = 'fp_attr_v1';
const EMPTY: Attribution = { us: '', um: '', uc: '', ref: '' };

/** Campaign labels are short, lowercase and boring. Anything else is noise. */
function clean(v: string | null): string {
  if (!v) return '';
  return v
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 60);
}

function referrerHost(): string {
  try {
    const r = document.referrer;
    if (!r) return '';
    const h = new URL(r).hostname.toLowerCase();
    // Our own pages are not a referrer worth recording.
    if (h === window.location.hostname) return '';
    return h.slice(0, 80);
  } catch {
    return '';
  }
}

function read(): (Attribution & { sent?: boolean }) | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Attribution & { sent?: boolean };
    return typeof v === 'object' && v ? v : null;
  } catch {
    // Private mode, storage disabled, or a corrupt value. Attribution is a
    // nice-to-have; it must never break a page.
    return null;
  }
}

function write(v: Attribution & { sent?: boolean }): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

/**
 * Resolve this tab's first-touch attribution, capturing it from the URL on the
 * first call. Safe to call from anywhere, including render.
 */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return EMPTY;
  const existing = read();
  if (existing) {
    return { us: existing.us, um: existing.um, uc: existing.uc, ref: existing.ref };
  }
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return EMPTY;
  }
  const fresh: Attribution = {
    us: clean(params.get('utm_source')),
    um: clean(params.get('utm_medium')),
    uc: clean(params.get('utm_campaign')),
    ref: referrerHost(),
  };
  write(fresh);
  return fresh;
}

/**
 * True exactly once per tab. Used to fire a single `session_start` beacon so a
 * campaign can be counted in visits rather than in clicks, without keeping an
 * identifier to deduplicate on. A person who opens two tabs counts twice, and
 * the report says so.
 */
export function claimSessionStart(): Attribution | null {
  if (typeof window === 'undefined') return null;
  const attr = getAttribution();
  const stored = read();
  if (stored?.sent) return null;
  write({ ...attr, sent: true });
  return attr;
}
