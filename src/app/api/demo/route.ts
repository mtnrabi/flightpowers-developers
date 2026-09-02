/**
 * THE single demo endpoint — every request that can spend the server-held
 * key goes through this one route, deliberately: on Vercel each route file
 * is its own function with its own memory, so splitting spend across routes
 * would split the budget counters too. One route = one shared counter set.
 *
 * Accepts three body forms:
 *   { chip: "<id>" }         → canned fixture replay (zero cost, labelled)
 *   { message: "<text>" }    → the hero agent: free text → fixed shape
 *   { shape: ... }           → typed tool request (price checker, month scan,
 *                              hotel geo)
 */

import { NextResponse } from 'next/server';
import { parseIntent } from '@/lib/demo/intent';
import { checkShape, runShape, type ShapeRequest } from '@/lib/demo/shapes';
import { requestBudget } from '@/lib/demo/budget';
import { FIXTURES } from '@/lib/fixtures';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const CHIPS: Record<string, () => unknown> = {
  'good-price-jfk-cun': () => {
    const f = FIXTURES.onewayJfkCun;
    return {
      mode: 'canned',
      capturedAt: f.captured_at,
      question: 'Is $129 JFK→Cancún on Jan 1 a good price?',
      askedPrice: 129,
      kind: 'oneway',
      request: f.request,
      flights: f.data,
      headers: f.headers,
    };
  },
  'warm-getaway-january': () => {
    const f = FIXTURES.dealHuntLgw;
    return {
      mode: 'canned',
      capturedAt: f.captured_at,
      question: 'Find me a cheap winter-sun escape from London in January',
      kind: 'deal-hunt',
      request: f.request,
      rows: f.data,
    };
  },
  'cheapest-day-november': () => {
    const f = FIXTURES.novscanLisJfk;
    return {
      mode: 'canned',
      capturedAt: f.captured_at,
      question: 'Cheapest day to fly Lisbon to New York in November',
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
      question: 'Same hotel, one reading from the US, Germany and Israel',
      kind: 'hotel-geo',
      request: f.request,
      markets: (['us', 'de', 'il'] as const).map((c) => ({ country: c, result: f.data[c] })),
    };
  },
};

type DemoBody = Partial<ShapeRequest> & { chip?: string; message?: string };

export async function POST(req: Request) {
  let body: DemoBody;
  try {
    body = (await req.json()) as DemoBody;
  } catch {
    return NextResponse.json({ error: 'bad_request', message: 'Send JSON.' }, { status: 400 });
  }

  // 1. Canned chips: zero cost, honestly labelled.
  if (body.chip) {
    const chip = CHIPS[body.chip];
    if (!chip) return NextResponse.json({ error: 'unknown_chip', message: 'Unknown example.' }, { status: 400 });
    return NextResponse.json(chip(), { headers: { 'cache-control': 'public, max-age=3600' } });
  }

  // 2. Free text (the hero agent) → one of the fixed shapes.
  let shapeInput: ShapeRequest;
  let askedPrice: number | undefined;
  let isAgent = false;
  if (typeof body.message === 'string') {
    isAgent = true;
    const message = body.message.slice(0, 300);
    if (!message.trim()) {
      return NextResponse.json({ error: 'bad_request', message: 'Ask something first.' }, { status: 400 });
    }
    const intent = parseIntent(message);
    if (intent.kind === 'unparsed') {
      return NextResponse.json({ mode: 'unparsed', hint: intent.hint });
    }
    shapeInput = intent.req;
    askedPrice = intent.askedPrice;
  } else {
    shapeInput = body as ShapeRequest;
  }

  const shape = checkShape(shapeInput);
  if (!shape.valid) {
    return isAgent
      ? NextResponse.json({ mode: 'unparsed', hint: shape.message })
      : NextResponse.json({ error: 'invalid', message: shape.message }, { status: 400 });
  }

  const budget = requestBudget(req, shape.cost);
  if (!budget.ok) {
    return NextResponse.json({ mode: 'capped', ...budget.body }, { status: budget.status });
  }

  const { result, fromCache, actualCost } = await runShape(shape);
  if (!fromCache && result.kind !== 'error') budget.charge(actualCost);

  if (result.kind === 'error') {
    const message =
      result.error === 'timeout'
        ? "The live search hit the demo's time ceiling. Complex routes take longer than a demo should. Try again, or run the same query with your own key where you control the timeout."
        : 'The live search did not complete. The API reports this honestly instead of returning a fake empty result. Try again in a moment.';
    return NextResponse.json(isAgent ? { mode: 'degraded', message } : { error: result.error, message }, {
      status: isAgent ? 200 : 502,
    });
  }

  return NextResponse.json({
    mode: fromCache ? 'cached' : 'live',
    parsed: shape.req,
    askedPrice,
    ...result,
  });
}
