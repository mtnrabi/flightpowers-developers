/**
 * The Lambda panel's data endpoint — what the CloudWatch REPORT line says the
 * three functions actually used.
 *
 * Same sign-in, same window parsing and the same 401-first order as
 * /api/admin/lane-metrics and /api/admin/hotel-metrics. One endpoint for both
 * tabs: the Flights tab reads `flyMyGApi` out of the response and the Booking
 * tab reads the two hotels functions, so switching tabs costs no second
 * request and the two tabs can never be looking at different windows.
 *
 * Query string:
 *   range=1h | 24h | 7d | 30d   convenience windows, ending now
 *   from=<ISO>&to=<ISO>         an explicit window, which wins over `range`
 *   functions=a,b,c             Lambda names; defaults to all three
 *
 * A missing TABLE is not an error here. `db/0005_lambda_report.sql` is applied
 * by hand on Neon after the rollup PRs merge, so "the migration has not been
 * applied yet" is a state the panel is expected to render, and it comes back
 * as `schemaMissing: true` with a 200 rather than as a 503 the page would have
 * to translate.
 */
import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin/auth';
import { isConfigured } from '@/lib/admin/lane-metrics';
import { fetchLambdaReport, parseFunctions } from '@/lib/admin/lambda-report';
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

  const functions = parseFunctions(new URL(req.url).searchParams.get('functions'));
  if ('error' in functions) {
    return NextResponse.json(
      { error: 'bad_functions', detail: functions.error },
      { status: 400 }
    );
  }

  try {
    const report = await fetchLambdaReport(window.fromMs, window.toMs, functions);
    return NextResponse.json(report, { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    console.error(
      '[admin/lambda-report] query failed:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }
}
