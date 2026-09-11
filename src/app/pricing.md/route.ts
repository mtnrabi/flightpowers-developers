/**
 * /pricing.md — machine-readable pricing, served as markdown.
 *
 * Same bytes as /pricing.txt; two extensions because crawlers and agents
 * guess at both. Generated from src/lib/pricing.ts so it cannot drift from
 * the table on /pricing.
 */

import { pricingDoc } from '@/lib/pricing-doc';

export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(pricingDoc(), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
}
