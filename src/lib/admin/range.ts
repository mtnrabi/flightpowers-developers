import 'server-only';

/**
 * Window parsing, shared by both admin data routes so the Flights tab and the
 * Booking tab can never end up reading two different windows from the same
 * picker.
 */

export const RANGES: Record<string, number> = {
  '1h': 3_600_000,
  '24h': 86_400_000,
  '7d': 7 * 86_400_000,
  '30d': 30 * 86_400_000,
};

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
    const width = RANGES[params.get('range') ?? '24h'];
    if (!width) {
      return { error: `range must be one of ${Object.keys(RANGES).join(', ')}.` };
    }
    toMs = now;
    fromMs = now - width;
  }

  if (toMs - fromMs > MAX_WINDOW_MS) {
    return { error: 'Windows longer than 90 days are refused.' };
  }
  return { fromMs, toMs };
}
