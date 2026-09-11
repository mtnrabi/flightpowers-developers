/**
 * /pricing.txt — the same document as /pricing.md, served as plain text for
 * clients that will not fetch an unknown content type.
 */

import { pricingDoc } from '@/lib/pricing-doc';

export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(pricingDoc(), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
