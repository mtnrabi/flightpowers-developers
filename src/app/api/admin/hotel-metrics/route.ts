/**
 * The Booking tab's data endpoint. Same sign-in, same window parsing and the
 * same 401-first order as /api/admin/lane-metrics.
 *
 * One difference worth knowing: the hotels tables are created by the shared
 * migration but WRITTEN by a rollup in mtnrabi/hotel_agent (eu-central-1,
 * different AWS identity). Until that exists the query still succeeds and
 * comes back empty, and if the migration has not been applied at all the
 * response says `schema_missing` rather than 500ing.
 */
import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin/auth';
import { isConfigured } from '@/lib/admin/lane-metrics';
import { fetchHotelMetrics } from '@/lib/admin/hotel-metrics';
import { parseWindow } from '@/lib/admin/range';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: Request) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

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
    const metrics = await fetchHotelMetrics(window.fromMs, window.toMs);
    return NextResponse.json(metrics, { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    console.error(
      '[admin/hotel-metrics] query failed:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }
}
