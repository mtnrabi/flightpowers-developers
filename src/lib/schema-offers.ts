import { FLIGHT_PLANS, HOTEL_PLANS, type Plan } from '@/lib/pricing';
import { SITE, rapidApiListingUrl } from '@/lib/site';

/**
 * The plan prices as schema.org offers, generated from lib/pricing.ts so the
 * markup can never disagree with the pricing table (check-pricing.mjs keeps
 * that file equal to the live listings).
 *
 * Why it exists: before this, no page on the site stated a price in a form a
 * crawler can read; /pricing carried a FAQ only. The one controlled test in the
 * research set (Seer, on a travel aggregator, 2026) added AggregateOffer with
 * price details to a page set and read more OpenAI-bot and ChatGPT-User hits
 * on it than on an untouched control set.
 *
 * The API nodes are typed WebAPI (a schema.org Service), which is what the two
 * hub pages already used. Not SoftwareApplication: Google's software-app
 * result requires a rating or review, and we have no real one to state.
 */

export const ORGANIZATION_ID = `${SITE.url}/#organization`;

type Api = 'flights' | 'hotels';

const APIS: Record<Api, { name: string; path: string; plans: Plan[]; unit: string }> = {
  flights: { name: 'FlightPowers Google Flights API', path: '/flights-api', plans: FLIGHT_PLANS, unit: 'flight searches' },
  hotels: { name: 'FlightPowers Booking.com Hotels API', path: '/hotels-api', plans: HOTEL_PLANS, unit: 'hotel searches' },
};

function describe(plan: Plan, unit: string): string {
  const parts = [`${plan.quota.toLocaleString('en-US')} ${unit} a month`];
  if (plan.overagePerRequest !== null) parts.push(`then $${plan.overagePerRequest} per extra search`);
  else if (plan.hardLimit) parts.push('hard cap');
  if (plan.ratePerMinute !== null) parts.push(`${plan.ratePerMinute} requests a minute`);
  return parts.join(', ');
}

/** The four monthly plans of one listing, billed on RapidAPI. */
export function aggregateOffer(api: Api) {
  const { plans, unit } = APIS[api];
  const url = `${rapidApiListingUrl(api)}/pricing`;
  const prices = plans.map((plan) => plan.priceMonthly);
  return {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: Math.min(...prices),
    highPrice: Math.max(...prices),
    offerCount: plans.length,
    url,
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: plan.priceMonthly,
      priceCurrency: 'USD',
      description: describe(plan, unit),
      url,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: plan.priceMonthly,
        priceCurrency: 'USD',
        billingDuration: 'P1M',
      },
    })),
  };
}

/**
 * One API as an entity: the same @id on its hub and on /pricing, so a crawler
 * reading either page meets one product with one price list.
 */
export function apiNode(api: Api) {
  const { name, path } = APIS[api];
  return {
    '@type': 'WebAPI',
    '@id': `${SITE.url}${path}#api`,
    name,
    url: `${SITE.url}${path}`,
    provider: { '@id': ORGANIZATION_ID },
    offers: aggregateOffer(api),
  };
}
