/**
 * The Flights tab's data endpoint.
 *
 * Behind the same Google sign-in as the page: an unauthenticated request gets
 * 401 and nothing else. That matters more here than on the page, because this
 * is the thing a scraper would find — the page is just HTML around it.
 *
 * Query string (shared with /api/admin/hotel-metrics, see @/lib/admin/range):
 *   range=1h | 24h | 7d | 30d   convenience windows, ending now
 *   from=<ISO>&to=<ISO>         an explicit window, which wins over `range`
 *
 * The resolution is not a parameter. It is derived from the width of the
 * window (10-minute detail for a day, hourly for a week, daily beyond) so the
 * page cannot ask for 4,320 ten-minute points and then draw them one pixel
 * apart.
 */
import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin/auth';
import { fetchLaneMetrics, isConfigured } from '@/lib/admin/lane-metrics';
import { parseWindow } from '@/lib/admin/range';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: Request) {
  const email = await getAdminEmail();
  if (!email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!isConfigured()) {
    return NextResponse.json(
      { error: 'not_configured', detail: 'DATABASE_URL is not set on this deployment.' },
      { status: 503 }
    );
  }

  const window = parseWindow(req.url);
  if ('error' in window) {
    return NextResponse.json({ error: 'bad_range', detail: window.error }, { status: 400 });
  }

  try {
    const metrics = await fetchLaneMetrics(window.fromMs, window.toMs);
    return NextResponse.json(metrics, { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    // The one failure worth naming separately: the rollup's tables have not
    // been created yet, which is a setup step rather than a bug.
    const message = error instanceof Error ? error.message : String(error);
    if (/relation .*lane_metrics.* does not exist/i.test(message)) {
      return NextResponse.json(
        {
          error: 'schema_missing',
          detail:
            'lane_metrics_10m does not exist. Apply db/0004_lane_metrics.sql (the same file as backend/ops/lane_metrics.sql in flight_rabbi).',
        },
        { status: 503 }
      );
    }
    console.error('[admin/lane-metrics] query failed:', message);
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }
}
