/**
 * The homepage agent demo. Free text in → one of the fixed query shapes,
 * executed against the live API with the server-held key — behind the
 * budget layer. Canned example chips are served from captured fixtures and
 * cost nothing (and say so).
 */

import { NextResponse } from 'next/server';
import { parseIntent } from '@/lib/demo/intent';
import { checkShape, runShape } from '@/lib/demo/shapes';
import { requestBudget } from '@/lib/demo/budget';
import { FIXTURES } from '@/lib/fixtures';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const CHIPS: Record<string, () => unknown> = {
  'good-price-tlv-jfk': () => {
    const f = FIXTURES.onewayTlvJfk;
    return {
      mode: 'canned',
      capturedAt: f.captured_at,
      question: 'Is $480 TLV→JFK in October a good price?',
      askedPrice: 480,
      kind: 'oneway',
      request: f.request,
      flights: f.data,
      headers: f.headers,
    };
  },
  'cheapest-november-lis-nyc': () => {
    const f = FIXTURES.novscanLisJfk;
    return {
      mode: 'canned',
      capturedAt: f.captured_at,
      question: 'Scan November for the cheapest LIS→NYC dates',
      kind: 'month-scan',
      request: f.request,
      days: f.data,
      sampledEvery: 1,
    };
  },
  'hotel-three-markets': () => {
    const f = FIXTURES.hotelGeoRixos;
    return {
      mode: 'canned',
      capturedAt: f.captured_at,
      question: 'Same hotel, priced from the US, Germany and Israel',
      kind: 'hotel-geo',
      request: f.request,
      markets: (['us', 'de', 'il'] as const).map((c) => ({ country: c, result: f.data[c] })),
    };
  },
};

export async function POST(req: Request) {
  let body: { message?: string; chip?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request', message: 'Send JSON.' }, { status: 400 });
  }

  // Canned chips: zero cost, honestly labelled.
  if (body.chip) {
    const chip = CHIPS[body.chip];
    if (!chip) return NextResponse.json({ error: 'unknown_chip', message: 'Unknown example.' }, { status: 400 });
    return NextResponse.json(chip(), {
      headers: { 'cache-control': 'public, max-age=3600' },
    });
  }

  const message = (body.message ?? '').slice(0, 300);
  if (!message.trim()) {
    return NextResponse.json({ error: 'bad_request', message: 'Ask something first.' }, { status: 400 });
  }

  const intent = parseIntent(message);
  if (intent.kind === 'unparsed') {
    return NextResponse.json({ mode: 'unparsed', hint: intent.hint });
  }

  const shape = checkShape(intent.req);
  if (!shape.valid) {
    return NextResponse.json({ mode: 'unparsed', hint: shape.message });
  }

  const budget = requestBudget(req, shape.cost);
  if (!budget.ok) {
    return NextResponse.json({ mode: 'capped', ...budget.body }, { status: budget.status });
  }

  const { result, fromCache, actualCost } = await runShape(shape);
  if (!fromCache && result.kind !== 'error') budget.charge(actualCost);

  if (result.kind === 'error') {
    return NextResponse.json({
      mode: 'degraded',
      message:
        result.error === 'timeout'
          ? 'The live search hit the demo\'s time ceiling — complex routes take longer than a demo should. Try a captured example, or run the same query with your own key where you control the timeout.'
          : 'The live search did not complete. That happens — the API tells you so instead of returning a fake empty result. Try again, or try a captured example.',
    });
  }

  return NextResponse.json({
    mode: fromCache ? 'cached' : 'live',
    parsed: shape.req,
    askedPrice: intent.askedPrice,
    ...result,
  });
}
