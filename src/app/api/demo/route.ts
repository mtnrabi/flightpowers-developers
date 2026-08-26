/**
 * Structured demo endpoint for the free tools (price checker, cheapest
 * month, hotel by country). Same budget layer as the agent demo; the shape
 * comes in typed instead of parsed from free text.
 */

import { NextResponse } from 'next/server';
import { checkShape, runShape, type ShapeRequest } from '@/lib/demo/shapes';
import { requestBudget } from '@/lib/demo/budget';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: ShapeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request', message: 'Send JSON.' }, { status: 400 });
  }

  const shape = checkShape(body);
  if (!shape.valid) {
    return NextResponse.json({ error: 'invalid', message: shape.message }, { status: 400 });
  }

  const budget = requestBudget(req, shape.cost);
  if (!budget.ok) {
    return NextResponse.json(budget.body, { status: budget.status });
  }

  const { result, fromCache, actualCost } = await runShape(shape);
  if (!fromCache && result.kind !== 'error') budget.charge(actualCost);

  if (result.kind === 'error') {
    return NextResponse.json(
      {
        error: result.error,
        message:
          result.error === 'timeout'
            ? 'The live search hit the demo\'s time ceiling. Try again — or run it with your own key, where you control the timeout.'
            : 'The live search did not complete. The API reports this honestly instead of returning a fake empty result — try again in a moment.',
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ mode: fromCache ? 'cached' : 'live', ...result });
}
