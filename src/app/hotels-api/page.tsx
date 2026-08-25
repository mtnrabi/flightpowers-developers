import type { Metadata } from 'next';
import {
  Container,
  Section,
  SectionHead,
  Cta,
  Code,
  FieldRow,
  Breadcrumbs,
  FaqSection,
  JsonLd,
  type Faq,
} from '@/components/ui';
import { PricingTable } from '@/components/PricingTable';
import { HOTEL_PLANS } from '@/lib/pricing';
import { LINKS, SITE } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Hotel pricing API — live Booking.com rates, priced per country',
  description:
    'A REST API for live Booking.com hotel prices. Every endpoint accepts proxy_country, so the ' +
    'same room can be priced from any market — the basis for rate-parity and geo-pricing monitoring.',
  alternates: { canonical: '/hotels-api' },
};

const SEARCH = `POST https://api.flightpowers.com/v1/hotels/search
x-api-key: <your RapidAPI key>
content-type: application/json

{
  "destination": "Paris",
  "checkin_date": "2026-09-22",
  "checkout_date": "2026-09-25",
  "adults": 2,
  "filters": ["free_cancellation", "stars_4"],
  "proxy_country": "de"
}`;

const RESPONSE = `{
  "destination": "Paris",
  "checkin_date": "2026-09-22",
  "checkout_date": "2026-09-25",
  "applied_filters": ["free_cancellation", "stars_4"],
  "budget_per_night": null,
  "properties": [
    {
      "name": "Hotel Example",
      "price_string": "US$742",
      "price": 742,
      "review_score": 8.4,
      "review_count": 701,
      "room_type": "Superior Double Room",
      "location": "8th arr.",
      "image_url": "https://cf.bstatic.com/...",
      "link": "https://www.booking.com/hotel/fr/example.html",
      "nights": 3,
      "adults": 2,
      "children": 0
    }
  ]
}`;

const PARITY = `# The same property and dates, priced from several markets.
# Each country is one request.
for country in ["us", "gb", "de", "br", "jp"]:
    r = requests.post(
        "https://api.flightpowers.com/v1/hotels/by-name",
        headers={"x-api-key": KEY},                 # server-side only
        json={
            "hotel_name": "Hotel Example Paris",
            "checkin_date": "2026-09-22",
            "checkout_date": "2026-09-25",
            "proxy_country": country,
        },
        timeout=180,
    )
    print(country, r.json())`;

const FILTERS = [
  'free_cancellation',
  'breakfast_included',
  'breakfast_and_lunch',
  'breakfast_and_dinner',
  'all_meals_included',
  'all_inclusive',
  'free_wifi',
  'swimming_pool',
  'gym',
  'review_score_7',
  'review_score_8',
  'review_score_9',
  'private_bathroom',
  'air_conditioning',
  'parking',
  'front_desk_24h',
  'stars_3',
  'stars_4',
  'stars_5',
  'pets_allowed',
  'adults_only',
  'sauna',
  'very_good_breakfast',
  'accepts_online_payment',
];

const faqs: Faq[] = [
  {
    q: 'What does proxy_country actually change?',
    a:
      'It routes that one request through a residential proxy exiting in the country you name, so ' +
      'the rates returned are the rates a resident of that market is shown. Omit it and the request ' +
      'goes through a global rotating pool. It is accepted on every hotels endpoint. The value is a ' +
      'country code passed through to the proxy provider; it is not validated against a fixed list, ' +
      'so test the markets you care about before relying on them in production.',
  },
  {
    q: 'How do I build a rate-parity check?',
    a:
      'Call /v1/hotels/by-name once per market with the same hotel_name and the same date range, ' +
      'varying only proxy_country, and compare the prices. Each market is one billed request. That ' +
      'is the whole mechanism — the difficulty in rate parity is getting a truthful price from each ' +
      'market, which is what the proxy is for.',
  },
  {
    q: 'The field is destination, not location?',
    a:
      'Yes. /v1/hotels/search requires destination, checkin_date and checkout_date. Sending location ' +
      'instead returns a 400 naming the three fields it needs. Confusingly, location does appear in ' +
      'the response, as the neighbourhood of each property.',
  },
  {
    q: 'Is price per night or for the stay?',
    a:
      'On /v1/hotels/search, price is the total for the whole stay and nights tells you how many ' +
      'nights that covers — divide if you want a nightly rate. The optional budget_per_night filter, ' +
      'by contrast, is per night. Two different units in one response, so read the field names ' +
      'carefully.',
  },
  {
    q: 'How many properties come back?',
    a:
      'Up to 50 per search, and there is no pagination. Narrow with filters and budget_per_night ' +
      'rather than expecting to page through a destination.',
  },
  {
    q: 'What happens when nothing matches?',
    a:
      'A search with no matching properties returns 404 with a message, not an empty list. Handle ' +
      '404 as a normal outcome rather than as an error condition.',
  },
];

export default function HotelsApiPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Developers', item: SITE.url },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Hotels API',
              item: `${SITE.url}/hotels-api`,
            },
          ],
        }}
      />

      <div className="board-grid border-b rule">
        <Container className="py-16 sm:py-24">
          <Breadcrumbs
            trail={[
              { href: '/', label: 'developers' },
              { href: '/hotels-api', label: 'hotels-api' },
            ]}
          />
          <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
            <div>
              <h1 className="text-[length:var(--text-hero)] leading-[var(--text-hero--line-height)] tracking-[var(--text-hero--letter-spacing)] font-semibold">
                Live hotel rates &mdash; from whichever market you ask as.
              </h1>
              <p className="lede mt-6 max-w-xl">
                Real-time Booking.com pricing over REST, with one field most hotel APIs do not have:{' '}
                <code className="field">proxy_country</code>. Price the same room as a buyer in
                Germany, Brazil or Japan and you can see rate parity instead of assuming it.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={LINKS.rapidapiHotels} external>
                  Get a key on RapidAPI
                </Cta>
                <Cta href="/flights-api" variant="ghost">
                  Flights API
                </Cta>
              </div>
            </div>
            <Code label="search">{SEARCH}</Code>
          </div>
        </Container>
      </div>

      {/* proxy_country */}
      <Section bordered={false}>
        <SectionHead
          eyebrow="The field that does the work"
          title="proxy_country turns one price into a comparison."
          lede="Hotel rates are not one number. The same room on the same night is quoted differently depending on the market a shopper appears to be in — that is the whole reason rate-parity monitoring exists. Every hotels endpoint takes an optional proxy_country and routes that request through a residential proxy exiting there."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
          <Code label="rate parity across five markets">{PARITY}</Code>
          <div className="text-sm text-ink-400 leading-relaxed space-y-4">
            <p>
              This is what makes three otherwise-hard jobs into ordinary API calls: rate-parity
              monitoring for a hotel or chain, geo-pricing analysis for an OTA, and market-by-market
              competitive pricing for a revenue manager.
            </p>
            <p>
              Each market is one request, so a five-market check on one property costs five requests
              from your quota. Omit the field and the request uses a global rotating pool.
            </p>
            <p className="rounded border rule bg-ink-900 px-4 py-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-signal-500">
                Worth knowing
              </span>
              <br />
              The value is passed through to the proxy provider rather than checked against a fixed
              list of supported countries. Test the specific markets you plan to monitor before you
              build a report on them.
            </p>
          </div>
        </div>
      </Section>

      {/* Endpoints */}
      <Section>
        <SectionHead eyebrow="Endpoints" title="Four ways in" />
        <div className="mt-8 max-w-3xl">
          <FieldRow name="POST /v1/hotels/search">
            Search a destination over a date range. Requires{' '}
            <code className="field">destination</code>, <code className="field">checkin_date</code>,{' '}
            <code className="field">checkout_date</code>. Returns up to 50 properties, unpaginated.
          </FieldRow>
          <FieldRow name="POST /v1/hotels/by-name">
            Price one named property. Requires <code className="field">hotel_name</code> and the two
            dates. This is the endpoint a parity check calls.
          </FieldRow>
          <FieldRow name="POST /v1/hotels/rooms">
            Room-by-room breakdown for a known property, including meal plan and per-rate occupancy.
            Requires <code className="field">hotel_booking_id</code> and the two dates.
          </FieldRow>
          <FieldRow name="POST /v1/hotels/resolve">
            Resolve a hotel name to a property identifier.
          </FieldRow>
        </div>
      </Section>

      {/* Request / response */}
      <Section>
        <SectionHead eyebrow="POST /v1/hotels/search" title="Request and response" />
        <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">
              Required
            </p>
            <div className="mt-3">
              <FieldRow name="destination" type="string">
                City or area. The field is <code className="field">destination</code>, not{' '}
                <code className="field">location</code>.
              </FieldRow>
              <FieldRow name="checkin_date / checkout_date" type="string">
                <code className="field">YYYY-MM-DD</code>.
              </FieldRow>
            </div>
            <p className="mt-10 font-mono text-[11px] uppercase tracking-wider text-signal-500">
              Optional
            </p>
            <div className="mt-3">
              <FieldRow name="adults" type="int">
                Defaults to <code className="field">2</code>.
              </FieldRow>
              <FieldRow name="children" type="int">
                Defaults to <code className="field">0</code>.
              </FieldRow>
              <FieldRow name="currency" type="string">
                Defaults to <code className="field">USD</code>.
              </FieldRow>
              <FieldRow name="budget_per_night" type="number">
                Per-night ceiling. Note the unit: <code className="field">price</code> in the
                response is the stay total.
              </FieldRow>
              <FieldRow name="filters" type="string[]">
                Any of the 24 values below. An unrecognised value returns a 400 listing all of them.
              </FieldRow>
              <FieldRow name="proxy_country" type="string">
                Country to price from.
              </FieldRow>
            </div>
          </div>
          <Code label="200 &mdash; response">{RESPONSE}</Code>
        </div>
      </Section>

      {/* Filters */}
      <Section>
        <SectionHead
          eyebrow="filters"
          title="24 search filters, matching Booking&rsquo;s own facets."
          lede="Pass them as an array on any search. Anything outside this list is rejected with a 400 that names the valid values."
        />
        <ul className="mt-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <li
              key={f}
              className="rounded border rule bg-ink-900 px-2.5 py-1 font-mono text-[12px] text-beacon-400"
            >
              {f}
            </li>
          ))}
        </ul>
      </Section>

      {/* Pricing */}
      <Section>
        <SectionHead eyebrow="Pricing" title="Plans on RapidAPI" />
        <div className="mt-8 max-w-4xl">
          <PricingTable
            plans={HOTEL_PLANS}
            href={LINKS.rapidapiHotels}
            label="Subscribe on RapidAPI"
          />
        </div>
      </Section>

      <Section>
        <FaqSection items={faqs} heading="Hotels API questions" />
      </Section>
    </>
  );
}
