import 'server-only';

/**
 * Window parsing, shared by both admin data routes so the Flights tab and the
 * Booking tab can never end up reading two different windows from the same
 * picker.
 */

/**
 * A Map, not an object literal, and that is the whole point.
 *
 * `RANGES[params.get('range') ?? '24h']` on a plain object resolves INHERITED
 * keys: `?range=constructor` returns `Object`, `?range=toString` returns a
 * function, `?range=__proto__` returns the prototype. Each of those then goes
 * into `now - width` as NaN, produces an unusable window, and comes back as a
 * 500 from a query somebody has to go and read logs to understand -- from a
 * query string, on an authenticated endpoint, but a 500 nonetheless. A Map has
 * no prototype chain to walk, so an unknown key is simply `undefined` and gets
 * the 400 it deserves.
 */
export const RANGES = new Map<string, number>([
  ['1h', 3_600_000],
  ['24h', 86_400_000],
  ['7d', 7 * 86_400_000],
  ['30d', 30 * 86_400_000],
]);

/** The keys a caller may pass, for an error message that names them. */
export const RANGE_KEYS = Array.from(RANGES.keys());

/** Ninety days. Past that it stops being a dashboard and becomes a report. */
export const MAX_WINDOW_MS = 90 * 86_400_000;

export type Window = { fromMs: number; toMs: number };

export function parseWindow(url: string, now = Date.now()): Window | { error: string } {
  const params = new URL(url).searchParams;
  const from = params.get('from');
  const to = params.get('to');

  let fromMs: number;
  let toMs: number;

  if (from && to) {
    fromMs = Date.parse(from);
    toMs = Date.parse(to);
    if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
      return { error: 'from and to must be ISO instants with to after from.' };
    }
  } else {
    const key = params.get('range') ?? '24h';
    const width = RANGES.get(key);
    if (width === undefined) {
      return { error: `range must be one of ${RANGE_KEYS.join(', ')}.` };
    }
    toMs = now;
    fromMs = now - width;
  }

  if (toMs - fromMs > MAX_WINDOW_MS) {
    return { error: 'Windows longer than 90 days are refused.' };
  }
  return { fromMs, toMs };
}
