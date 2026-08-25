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
import { FLIGHT_PLANS } from '@/lib/pricing';
import { LINKS, SITE } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Google Flights API — live fares with price-insights bands',
  description:
    'A REST API for real-time Google Flights fares. Returns price_insights_low and ' +
    'price_insights_high with a low/typical/high verdict, a paired-leg round-trip endpoint, and a ' +
    'Google Flights deep link on every itinerary.',
  alternates: { canonical: '/flights-api' },
};

const ONEWAY = `POST https://api.flightpowers.com/v1/flights/oneway
x-api-key: <your RapidAPI key>
content-type: application/json

{
  "from_airport": "JFK",
  "to_airport": "LHR",
  "departure_date": "2026-09-22",
  "max_stops": 0,
  "currency": "usd",
  "limit": 5
}`;

const ROUNDTRIP = `POST https://api.flightpowers.com/v1/flights/roundtrip

{
  "from_airport": "JFK",
  "to_airport": "LHR",
  "departure_date": "2026-09-22",
  "return_date": "2026-09-29",
  "max_departure_stops": 0,
  "max_return_stops": 1,
  "departure_airline_codes": ["BA"],
  "return_departure_time_min": 10,
  "limit": 5
}`;

const SCAN = `# One month of departure dates, scanned in parallel.
# Each date is one request; keep concurrency under your plan's per-minute limit.
import asyncio, httpx, datetime as dt

KEY = os.environ["RAPIDAPI_KEY"]          # server-side only
DATES = [dt.date(2026, 9, 1) + dt.timedelta(days=i) for i in range(30)]

async def fare(client, day):
    r = await client.post(
        "https://api.flightpowers.com/v1/flights/oneway",
        headers={"x-api-key": KEY},
        json={"from_airport": "JFK", "to_airport": "LHR",
              "departure_date": day.isoformat(), "limit": 1},
        timeout=180,
    )
    rows = r.json()
    return day, (rows[0]["price_as_number"] if rows else None)

async def main():
    limits = httpx.Limits(max_connections=20)
    async with httpx.AsyncClient(limits=limits) as client:
        return await asyncio.gather(*(fare(client, d) for d in DATES))`;

const faqs: Faq[] = [
  {
    q: 'Which fields identify a good price?',
    a:
      'price_insights_low and price_insights_high are the ends of the historical price band Google ' +
      'Flights shows for that route and date, as integers in the requested currency. ' +
      'price_range_in_relation_to_other_periods is Google’s verdict on the current fare: "low", ' +
      '"typical" or "high". All three can be null when Google does not publish a band for a search, ' +
      'so treat them as optional in your schema.',
  },
  {
    q: 'What is in buy_link?',
    a:
      'A Google Flights URL of the form https://www.google.com/travel/flights?tfs=<encoded>&curr=<currency>. ' +
      'The encoded payload carries the passengers, cabin, trip type and every leg’s date, airports, ' +
      'airline and flight number, so the link reopens that exact itinerary rather than a fresh search. ' +
      'Round-trip results carry one combined link for the paired itinerary.',
  },
  {
    q: 'How do I scan many dates at once?',
    a:
      'Each date is a separate request, so a month scan is thirty calls. The per-minute rate limit on ' +
      'your plan is what bounds the concurrency: 150 per minute on Pro, 250 on Ultra, 500 on Mega, as ' +
      'listed on RapidAPI on 2026-08-25. Keep your client’s connection limit under that and a month ' +
      'of dates finishes in one batch.',
  },
  {
    q: 'What do the response airports look like?',
    a:
      'Requests take IATA codes (from_airport, to_airport). Responses return them as a display ' +
      'string in the form "City (IATA)" — for example "New York (JFK)" — not as a bare code. Parse ' +
      'accordingly if you round-trip values through your own storage.',
  },
  {
    q: 'Is price a string or a number?',
    a:
      'Both, in two fields. price is the formatted string, for example "$56". price_as_number is the ' +
      'integer. Use price_as_number for arithmetic. stops is an integer, but can be the string ' +
      '"Unknown" when the itinerary’s stop count could not be read, so guard for that.',
  },
  {
    q: 'How long can a search take?',
    a:
      'The front allows up to 180 seconds for a search before it times out, because a live scrape of ' +
      'Google Flights is not a cache lookup. Set your client timeout accordingly — a default 30-second ' +
      'HTTP timeout will cut off searches that would have succeeded.',
  },
];

export default function FlightsApiPage() {
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
              name: 'Flights API',
              item: `${SITE.url}/flights-api`,
            },
          ],
        }}
      />

      <div className="board-grid border-b rule">
        <Container className="py-16 sm:py-24">
          <Breadcrumbs
            trail={[
              { href: '/', label: 'developers' },
              { href: '/flights-api', label: 'flights-api' },
            ]}
          />
          <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
            <div>
              <h1 className="text-[length:var(--text-hero)] leading-[var(--text-hero--line-height)] tracking-[var(--text-hero--letter-spacing)] font-semibold">
                Google Flights data, with the price band attached.
              </h1>
              <p className="lede mt-6 max-w-xl">
                Two endpoints over live Google Flights results. Every itinerary comes back with
                Google&rsquo;s historical price range, its verdict on today&rsquo;s fare, and a deep
                link that reopens exactly that itinerary.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={LINKS.rapidapiFlights} external>
                  Get a key on RapidAPI
                </Cta>
                <Cta href="/hotels-api" variant="ghost">
                  Hotels API
                </Cta>
              </div>
            </div>
            <Code label="one-way">{ONEWAY}</Code>
          </div>
        </Container>
      </div>

      {/* Price insights */}
      <Section bordered={false}>
        <SectionHead
          eyebrow="The flagship field"
          title="price_insights_low, price_insights_high, and a verdict."
          lede="Google Flights shows travellers a historical price range and tells them whether the current fare sits low, typical or high within it. Those three values come back on every result row."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
          <Code label="every result row carries">{`{
  "price_insights_low": 65,
  "price_insights_high": 135,
  "price_range_in_relation_to_other_periods": "low",
  "price": "$56",
  "price_as_number": 56
}`}</Code>
          <div className="text-sm text-ink-400 leading-relaxed space-y-4">
            <p>
              <code className="field">price_insights_low</code> and{' '}
              <code className="field">price_insights_high</code> are integers in the currency you
              requested, taken from the price-history data on the Google Flights page the search
              loads.
            </p>
            <p>
              <code className="field">price_range_in_relation_to_other_periods</code> is
              Google&rsquo;s own label for the current fare &mdash;{' '}
              <code className="field">&quot;low&quot;</code>,{' '}
              <code className="field">&quot;typical&quot;</code> or{' '}
              <code className="field">&quot;high&quot;</code>.
            </p>
            <p className="rounded border rule bg-ink-900 px-4 py-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-signal-500">
                Handle the null case
              </span>
              <br />
              Google does not publish a band for every search. When it is absent these fields come
              back <code className="field">null</code>. Do not make them required in your schema, and
              do not build a UI that has nothing to show without them.
            </p>
          </div>
        </div>
      </Section>

      {/* Round trip */}
      <Section>
        <SectionHead
          eyebrow="POST /v1/flights/roundtrip"
          title="A round trip is one search, not two."
          lede="The endpoint runs a genuine paired-leg search: the outbound leg it selects drives a filtered query for the matching return. You get a combined price and a single buy_link for an itinerary that can be bought as one ticket."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
          <Code label="per-leg filtering">{ROUNDTRIP}</Code>
          <div>
            <p className="text-sm text-ink-400 leading-relaxed">
              Each leg takes its own constraints, which is the part two stapled one-way searches
              cannot express:
            </p>
            <div className="mt-5">
              <FieldRow name="max_departure_stops / max_return_stops" type="int">
                Stop limits set independently per leg &mdash; non-stop out, one stop back.
              </FieldRow>
              <FieldRow
                name="departure_airline_codes / return_airline_codes"
                type="string[]"
              >
                Restrict each leg to particular carriers. Matching{' '}
                <code className="field">exclude_</code> variants exist for both legs.
              </FieldRow>
              <FieldRow
                name="departure_departure_time_min / _max"
                type="int"
              >
                Departure and arrival time windows, set separately for the outbound and return legs.
              </FieldRow>
              <FieldRow name="total_price" type="string">
                The combined price for the paired itinerary, returned on the result.
              </FieldRow>
            </div>
          </div>
        </div>
      </Section>

      {/* Request fields */}
      <Section>
        <SectionHead eyebrow="POST /v1/flights/oneway" title="Request fields" />
        <div className="mt-8 max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">Required</p>
          <div className="mt-3">
            <FieldRow name="from_airport" type="string">
              Origin IATA code.
            </FieldRow>
            <FieldRow name="to_airport" type="string">
              Destination IATA code.
            </FieldRow>
            <FieldRow name="departure_date" type="string">
              <code className="field">YYYY-MM-DD</code>.
            </FieldRow>
          </div>

          <p className="mt-12 font-mono text-[11px] uppercase tracking-wider text-signal-500">
            Optional
          </p>
          <div className="mt-3">
            <FieldRow name="max_stops" type="int">
              Maximum stops per itinerary.
            </FieldRow>
            <FieldRow name="airline_codes / exclude_airline_codes" type="string[]">
              Include or exclude specific carriers.
            </FieldRow>
            <FieldRow name="departure_time_min / _max, arrival_time_min / _max" type="int">
              Hour-of-day windows.
            </FieldRow>
            <FieldRow name="currency" type="string">
              Defaults to <code className="field">usd</code>.
            </FieldRow>
            <FieldRow name="max_price" type="int">
              Upper bound on fare.
            </FieldRow>
            <FieldRow name="passengers" type="int[]">
              Passenger breakdown.
            </FieldRow>
            <FieldRow name="limit" type="int">
              Number of itineraries returned. Defaults to <code className="field">10</code>.
            </FieldRow>
            <FieldRow name="strict" type="bool">
              When the search fails to complete, return <code className="field">503</code> instead of
              an empty array. Available on the RapidAPI host.
            </FieldRow>
          </div>
        </div>
      </Section>

      {/* Parallel scan */}
      <Section>
        <SectionHead
          eyebrow="Rate limits"
          title="Scanning a month of dates."
          lede="Cheapest-date and fare-alert products are date scans, and a date scan is bounded by requests per minute. Pro allows 150 per minute, Ultra 250, Mega 500 — as listed on RapidAPI on 2026-08-25."
        />
        <div className="mt-10 max-w-3xl">
          <Code label="python">{SCAN}</Code>
          <p className="mt-4 text-sm text-ink-400 leading-relaxed">
            Thirty dates is thirty billed requests. Keep your client&rsquo;s connection limit under
            your plan&rsquo;s per-minute figure; a 429 is returned to you unchanged and is never
            retried, so an exhausted quota is never double-billed.
          </p>
        </div>
      </Section>

      {/* Pricing */}
      <Section>
        <SectionHead eyebrow="Pricing" title="Plans on RapidAPI" />
        <div className="mt-8 max-w-4xl">
          <PricingTable
            plans={FLIGHT_PLANS}
            href={LINKS.rapidapiFlights}
            label="Subscribe on RapidAPI"
          />
        </div>
      </Section>

      <Section>
        <FaqSection items={faqs} heading="Flights API questions" />
      </Section>
    </>
  );
}
