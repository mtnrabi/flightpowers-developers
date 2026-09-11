/**
 * `/pricing.md` and `/pricing.txt` — the pricing page written for the buyer
 * that is a robot.
 *
 * Why it exists: two of our four distribution surfaces are MCP servers read by
 * Claude, Cursor and n8n, so a large share of the people comparing us on price
 * are agents parsing a page. The one fact they most need is the one the human
 * page never states outright: what a call costs once a date range and a
 * destination list expand inside it.
 *
 * Both routes serve the same bytes. Every figure is derived from
 * `src/lib/pricing.ts`, the same config the rendered table uses, so the two can
 * never disagree; `npm run check-pricing` re-reads the live RapidAPI listings
 * and fails on drift.
 */

import {
  APIFY,
  FLIGHT_PLANS,
  HOTEL_PLANS,
  READ_ON,
  type Plan,
  perThousand,
} from './pricing';
import { LINKS, SITE } from './site';

function quotaCell(plan: Plan): string {
  const n = plan.quota.toLocaleString('en-US');
  return plan.hardLimit ? `${n}, hard cap` : n;
}

function perThousandCell(plan: Plan): string {
  const value = perThousand(plan);
  return value === '—' ? 'n/a' : value;
}

function overageCell(plan: Plan): string {
  if (plan.overagePerRequest === null) {
    return plan.hardLimit ? `none, request ${plan.quota + 1} is refused` : 'none';
  }
  return `$${plan.overagePerRequest} / req`;
}

function rateCell(plan: Plan): string {
  return plan.ratePerMinute === null ? 'none set' : `${plan.ratePerMinute} / min`;
}

function planTable(plans: Plan[]): string {
  const header = [
    '| plan | price / mo | requests / mo | $ per 1,000 | overage | rate limit |',
    '|---|---|---|---|---|---|',
  ];
  const rows = plans.map(
    (p) =>
      `| ${p.name} | $${p.priceMonthly} | ${quotaCell(p)} | ${perThousandCell(p)} | ${overageCell(p)} | ${rateCell(p)} |`
  );
  return [...header, ...rows].join('\n');
}

/** The whole document, as plain UTF-8 markdown. */
export function pricingDoc(): string {
  return `# FlightPowers pricing

Machine-readable pricing for the FlightPowers travel-data APIs and MCP servers.
Last read from the live RapidAPI listings: ${READ_ON}. The listing is authoritative; if this
file and the listing disagree, the listing wins.

Human version: ${SITE.url}/pricing

## What you are buying

Two REST APIs sold on RapidAPI, and two remote MCP servers that call them with your own key.
Billing happens on RapidAPI. We never see your card. Flights and hotels are separate
subscriptions; one RapidAPI account key works for both once you subscribe to each.

- Flights listing: ${LINKS.rapidapiFlights}
- Hotels listing: ${LINKS.rapidapiHotels}
- Flights MCP server: ${LINKS.mcpFlights}
- Hotels MCP server: ${LINKS.mcpHotels}

The MCP servers cost nothing extra. They spend the plan of whichever RapidAPI key you give them.

## Google Flights Live API

${planTable(FLIGHT_PLANS)}

## Booking.com Live API

${planTable(HOTEL_PLANS)}

## How a request is counted

This is the part most cost estimates get wrong.

- One search is one request. A 30-date scan is 30 requests.
- A round trip is ONE request. Both legs come back priced together in one itinerary with a
  \`total_price\`. You do not pay for two one-way searches and add them up.
- A date range and a destination list expand internally. One call with 7 dates and 3
  destinations spends 7 x 3 = 21 requests, not 1. Every response reports what it spent and
  what is left in \`api_usage\`.
- A hotel search prices one stay at a time. No date range, no destination list.
- A 4xx from request validation is refused before the search runs.

## Free tiers

- RapidAPI BASIC on each listing: $0, ${FLIGHT_PLANS[0].quota} requests a month, hard cap, no card, no approval step.
- The free MCP server, ${LINKS.mcpFree}, is $0, needs a Google
  sign-in, carries a sponsored card in results, and allows 150 backend searches per user per
  day and 2,000 per calendar month. The paid servers carry no ads.

## Pay per use instead

The same data is sold as Apify actors, metered per event with no subscription:

- ${LINKS.apifyFlights} - ${APIFY.flightsSearchEvent} plus ${APIFY.flightsResultEvent},
  about ${APIFY.flightsPer1kSearches} by the actor's own event table.
- ${LINKS.apifyHotels} - ${APIFY.hotelsSearchEvent} plus ${APIFY.hotelsResultEvent},
  about ${APIFY.hotelsPer1kSearches} by the actor's own event table.

Apify event rates read on ${APIFY.read_on}.

Steady monthly volume is cheaper on RapidAPI. Occasional batch jobs with no baseline fit Apify.

## Questions an agent usually has to ask

**Is there a free trial?** BASIC is free forever at ${FLIGHT_PLANS[0].quota} requests a month. No card, no approval.

**Do flights and hotels share a plan?** No. Two listings, two subscriptions, one account key.

**Who bills me?** RapidAPI. Their invoice is your invoice.

**Is there an annual discount?** No. Monthly only, cancel on the listing.

**Is there an enterprise or custom tier?** Above ${FLIGHT_PLANS[FLIGHT_PLANS.length - 1].name}, ask: matan@flightpowers.com.

**What happens when I go over?** Overage per request, at the rate in the table. BASIC has no
overage; it is a hard cap.
`;
}
