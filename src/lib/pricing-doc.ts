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
  AIRBNB_PLANS,
  AIRBNB_READ_ON,
  APIFY,
  FLIGHT_PLANS,
  GOOGLE_HOTELS_PLANS,
  GOOGLE_HOTELS_READ_ON,
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

Four REST APIs sold on RapidAPI (flights, Booking.com hotels, Airbnb, Google Hotels), and two remote MCP
servers that call them with your own key (the hotels server calls Booking.com and Airbnb; Google Hotels is not on
the MCP servers). Billing happens on RapidAPI. We never see your card. Each API is a separate subscription; one
RapidAPI account key works for all four once you subscribe to each.

- Flights listing: ${LINKS.rapidapiFlights}
- Hotels (Booking.com) listing: ${LINKS.rapidapiHotels}
- Airbnb listing: ${LINKS.rapidapiAirbnb}
- Google Hotels listing: ${LINKS.rapidapiGoogleHotels}
- Flights MCP server: ${LINKS.mcpFlights}
- Hotels MCP server: ${LINKS.mcpHotels}

The MCP servers cost nothing extra. They spend the plan of whichever RapidAPI key you give them.

## Google Flights Live API

${planTable(FLIGHT_PLANS)}

## Booking.com Live API

${planTable(HOTEL_PLANS)}

## Airbnb Live API

${planTable(AIRBNB_PLANS)}

${AIRBNB_READ_ON ? `Airbnb plans read from the live listing on ${AIRBNB_READ_ON}.` : ''} One Airbnb search returns one page of
Airbnb's results (20 to 30 listings in our tests). The hotels MCP server's search_airbnb and the Airbnb row of
compare_hotel_rates spend this subscription; the free Google sign-in searches on the MCP servers do not cover Airbnb.
compare_hotel_rates spends one request on each source it searches, each on that source's own subscription.

## Google Hotels Live API

${planTable(GOOGLE_HOTELS_PLANS)}

${GOOGLE_HOTELS_READ_ON ? `Google Hotels plans read from the live listing on ${GOOGLE_HOTELS_READ_ON}.` : ''} Every endpoint costs one
request: a city search (one page of Google's results, about 18 to 20 hotels) and one hotel's rate on each site Google
lists for it are the same price. Not on the MCP servers.

## How a request is counted

This is the part most cost estimates get wrong.

- One search is one request. A 30-date scan is 30 requests.
- A round trip is ONE request. Both legs come back priced together in one itinerary with a
  \`total_price\`. You do not pay for two one-way searches and add them up.
- A date range and a destination list expand internally. One call with 7 dates and 3
  destinations spends 7 x 3 = 21 requests, not 1. Every response reports what it spent and
  what is left in \`api_usage\`.
- A REST hotel search (Booking.com, Airbnb or Google Hotels) prices one stay at a time. No date range, no destination list.
  On the hotels MCP server, search_hotels can take a check-in range and nights, and spends one request per stay priced.
- A 4xx from request validation is refused before the search runs.

## Free tiers

- RapidAPI BASIC: $0, hard cap, no card, no approval step. ${FLIGHT_PLANS[0].quota} requests a month on flights,
  ${HOTEL_PLANS[0].quota} on Booking.com hotels, ${AIRBNB_PLANS[0].quota} on Airbnb, ${GOOGLE_HOTELS_PLANS[0].quota} on Google Hotels.
- The free MCP server, ${LINKS.mcpFree}, is $0, needs a Google
  sign-in, carries a sponsored card in results, and allows 50 backend searches per user per
  day and 250 per calendar month. The paid servers carry no ads.

## Pay per use instead

The same data is sold as Apify actors, metered per event with no subscription:

- ${LINKS.apifyFlights} - ${APIFY.flightsSearchEvent} plus ${APIFY.flightsResultEvent},
  about ${APIFY.flightsPer1kSearches} by the actor's own event table.
- ${LINKS.apifyHotels} - ${APIFY.hotelsSearchEvent} plus ${APIFY.hotelsResultEvent},
  about ${APIFY.hotelsPer1kSearches} by the actor's own event table.

Apify event rates read on ${APIFY.read_on}.

Steady monthly volume is cheaper on RapidAPI. Occasional batch jobs with no baseline fit Apify.

## Questions an agent usually has to ask

**Is there a free trial?** BASIC is free forever: ${FLIGHT_PLANS[0].quota} requests a month on flights,
${HOTEL_PLANS[0].quota} on Booking.com hotels, ${AIRBNB_PLANS[0].quota} on Airbnb, ${GOOGLE_HOTELS_PLANS[0].quota} on Google Hotels. No card, no approval. On the paid MCP
servers, a Google sign-in gives 10 free searches a day before any key, shared by the flights and hotels servers.

**Do flights, hotels, Airbnb and Google Hotels share a plan?** No. Four listings, four subscriptions, one account key.

**Who bills me?** RapidAPI. Their invoice is your invoice.

**Is there an annual discount?** No. Monthly only, cancel on the listing.

**Is there an enterprise or custom tier?** Above ${FLIGHT_PLANS[FLIGHT_PLANS.length - 1].name}, ask: matan@flightpowers.com.

**What happens when I go over?** Overage per request, at the rate in the table. BASIC has no
overage; it is a hard cap.
`;
}
