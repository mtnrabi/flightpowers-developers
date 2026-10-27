import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Mono, ResponseChunk } from '@/components/ResponseChunk';
import { PricingTable } from '@/components/PricingTable';
import {
  Breadcrumbs,
  CapturedBadge,
  CheckBullets,
  Code,
  Container,
  Cta,
  FaqSection,
  FieldRow,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { FIXTURES, type AirbnbRow } from '@/lib/fixtures';
import { AIRBNB_PLANS, AIRBNB_READ_ON, FLIGHT_PLANS } from '@/lib/pricing';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

/*
 * Every claim on this page comes from the reviewed listing copy
 * (state/gtm/PASTE-airbnb-listing-2026-10-23.md in the agents repo, whose
 * claims audit points each one at hotel_agent ota_lite code) or from the
 * captured Rome response in src/lib/fixtures/airbnb-search-rome.json.
 * Plan numbers come from lib/pricing.ts. Do not add a claim that is in
 * neither. The hotels MCP (hotels.flightpowers.com/mcp) serves search_airbnb and
 * compare_hotel_rates on this same subscription since 2026-10-26, switched on
 * and tested with a live Lisbon call; the one line about it is under "AI
 * travel agents" below.
 */

const AIRBNB_BASIC = AIRBNB_PLANS.find((p) => p.name === 'BASIC')!;
const AIRBNB_PRO = AIRBNB_PLANS.find((p) => p.name === 'PRO')!;
const FLIGHTS_PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
const fmt = (n: number) => n.toLocaleString('en-US');

export const metadata: Metadata = {
  ...withOg({
    title: 'Airbnb API: live Airbnb listings and prices as JSON',
    description:
      'Airbnb Live API: POST /search takes a place and two dates and returns live Airbnb listings with the stay total and the price per night as numbers, rating, coordinates and a link.',
    alternates: { canonical: '/hotels-api/airbnb' },
  }),
  title: { absolute: 'Airbnb API: live Airbnb listings and prices as JSON' },
};

export const dynamic = 'force-static';

const HOST = 'airbnb-live-api.p.rapidapi.com';

const SEARCH_CURL = `curl -X POST "https://${HOST}/search" \\
  -H "Content-Type: application/json" \\
  -H "x-rapidapi-host: ${HOST}" \\
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \\
  -d '{"destination":"Rome, Italy","checkin_date":"2026-12-15","checkout_date":"2026-12-18","adults":2,"currency":"USD"}'`;

const DETAILS_CURL = `curl -X POST "https://${HOST}/details" \\
  -H "Content-Type: application/json" \\
  -H "x-rapidapi-host: ${HOST}" \\
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \\
  -d '{"listing_id":"46730658","checkin_date":"2026-12-15","checkout_date":"2026-12-18","adults":2}'`;

const FILTERS: { name: string; type: string; what: string; at: 'Airbnb' | 'ours' }[] = [
  { name: 'destination', type: 'string, required', what: 'Free text, the way a person types it: "Rome, Italy", "Lisbon", "Brooklyn, New York"', at: 'Airbnb' },
  { name: 'checkin_date', type: 'YYYY-MM-DD, required', what: 'First night. Today or later', at: 'Airbnb' },
  { name: 'checkout_date', type: 'YYYY-MM-DD, required', what: 'After checkin_date', at: 'Airbnb' },
  { name: 'adults', type: 'integer', what: 'Adult guests', at: 'Airbnb' },
  { name: 'children', type: 'integer', what: 'Children', at: 'Airbnb' },
  { name: 'infants', type: 'integer', what: 'Infants', at: 'Airbnb' },
  { name: 'pets', type: 'integer', what: 'Pets', at: 'Airbnb' },
  { name: 'currency', type: 'ISO code, default USD', what: 'Prices and currency on every row come back in it', at: 'Airbnb' },
  { name: 'price_min', type: 'number', what: "Airbnb's own price filter, per night, in currency", at: 'Airbnb' },
  { name: 'price_max', type: 'number', what: "Airbnb's own price filter, per night, in currency", at: 'Airbnb' },
  { name: 'min_bedrooms', type: 'integer', what: 'Minimum bedrooms', at: 'Airbnb' },
  { name: 'min_beds', type: 'integer', what: 'Minimum beds', at: 'Airbnb' },
  { name: 'min_bathrooms', type: 'number', what: 'Minimum bathrooms', at: 'Airbnb' },
  {
    name: 'room_types',
    type: 'array of strings',
    what: 'Any of "Entire home/apt", "Private room", "Shared room", "Hotel room". Any other value is refused with a 400, so spell them exactly',
    at: 'Airbnb',
  },
  {
    name: 'min_rating',
    type: 'number, out of 5',
    what: "Airbnb's search has no rating filter, so this runs on the rows. A listing with no rating is dropped, not kept",
    at: 'ours',
  },
  {
    name: 'sort',
    type: 'price_asc, price_desc, rating_desc',
    what: "Airbnb's search has no sort. This orders the page you got back (by price_per_night or rating), not all of Airbnb. Rows with no value go last. Any other value is refused",
    at: 'ours',
  },
  {
    name: 'proxy_country',
    type: 'two-letter lowercase code, e.g. de',
    what: 'Sends the search out through a residential connection in that country. Filters nothing',
    at: 'ours',
  },
];

const STATUSES: { status: string; http: string; reason: string; means: string; todo: string }[] = [
  { status: 'ok', http: '200', reason: 'ok', means: 'Listings found', todo: 'Use them' },
  {
    status: 'empty',
    http: '200',
    reason: 'no_results',
    means: 'The page was read and nothing on it matched: Airbnb listed nothing for those dates, or your min_rating removed every row (check filters_applied)',
    todo: "Don't retry the same request. Loosen min_rating if you set one",
  },
  { status: 'degraded', http: '502', reason: 'blocked_status', means: 'Airbnb refused the request (403, 429, 451...), after our proxy retry', todo: 'Retry after a pause' },
  { status: 'degraded', http: '502', reason: 'blocked_page', means: 'The page came back without results data (a challenge or a different page)', todo: 'Retry once. If it sticks, message us' },
  { status: 'degraded', http: '502', reason: 'parse_failed', means: "The data was there in a shape we don't know. The clearest sign Airbnb changed something", todo: 'Retry once, then message us' },
  { status: 'degraded', http: '502', reason: 'upstream_error', means: 'Airbnb answered 5xx, or the connection failed', todo: 'Retry' },
  { status: 'degraded', http: '502', reason: 'timeout', means: 'Airbnb took too long', todo: 'Retry' },
  {
    status: 'error',
    http: '400',
    reason: 'invalid_request',
    means: "A required field is missing, a date is malformed or in the past, checkout isn't after check-in, or the body isn't JSON",
    todo: 'Fix the request',
  },
  {
    status: 'error',
    http: '400',
    reason: 'unsupported_for_provider',
    means: 'You sent a Booking.com-only field. unsupported_fields and supported_fields say which',
    todo: 'Use the Airbnb parameter named in detail',
  },
  {
    status: 'error',
    http: '400',
    reason: 'bad_request',
    means: "The request was well formed but can't be searched: a listing_id that isn't digits, an unknown sort",
    todo: 'Fix the request',
  },
  { status: 'error', http: '400', reason: 'unknown_provider', means: 'You sent a provider other than airbnb', todo: 'Leave provider out' },
];

const faq: Faq[] = [
  {
    q: 'Does Airbnb have a public API for searching listings?',
    a: 'No. Its API program serves software for hosts, with no guest-side search. The Airbnb Live API reads the same search page a guest reads, live, when you ask, and hands it back as flat JSON. Nothing is cached.',
  },
  {
    q: 'Is the price per night or for the stay?',
    a: "Both, as numbers. price_total is the total Airbnb quoted, for the nights on the row. price_per_night is Airbnb's own per-night line (we only divide when Airbnb didn't print one), so nights times price_per_night need not add up to price_total. price_string carries Airbnb's own label, the way a guest saw it.",
  },
  {
    q: 'How many listings does one search return?',
    a: `One search returns one page of Airbnb's results; that was 20 to 30 listings a search in our tests. The Rome capture on this page returned ${FIXTURES.airbnbSearchRome.data.properties_returned}.`,
  },
  {
    q: 'Can I get prices in euros or pounds?',
    a: 'Send currency (EUR, GBP...) and prices come back in it. Leave it out and you get USD, and every row says which currency it is in.',
  },
  {
    q: 'Can I use my Booking.com filters here?',
    a: 'No, and the API says so instead of ignoring them. filters, budget_per_night, free_cancellation, hotel_name, hotel_booking_id and price_as_seen_from are refused with unsupported_for_provider and, where Airbnb has one, the name of the parameter to use instead. A parameter name this API does not know at all (a typo) is ignored, so check filters_applied: a filter that is not listed there did not run.',
  },
  {
    q: 'Is it the same key as the flights and Booking.com APIs?',
    a: 'One RapidAPI key works on all three once you subscribe to each. The Airbnb Live API is its own listing and its own subscription.',
  },
  {
    q: 'Is this an official Airbnb API?',
    a: 'No. It is an independent API, not affiliated with, endorsed by, or sponsored by Airbnb, Inc.',
  },
];

/** Two rows of the captured Rome response, trimmed to the documented fields. Built from the fixture so it cannot drift. */
const EXCERPT_ROWS = (() => {
  const props = FIXTURES.airbnbSearchRome.data.properties;
  // A discounted, rated room and a whole flat: the two shapes most rows take.
  const picks = [props.find((p) => p.price_original_total !== null && p.rating !== null)!, props.find((p) => p.bedrooms !== null)!];
  return picks;
})();

const AIRBNB_SEARCH_EXCERPT = (() => {
  const d = FIXTURES.airbnbSearchRome.data;
  const keep = (r: AirbnbRow) => ({
    name: r.name,
    price_total: r.price_total,
    price_per_night: r.price_per_night,
    price_original_total: r.price_original_total,
    currency: r.currency,
    nights: r.nights,
    rating: r.rating,
    rating_scale: r.rating_scale,
    review_count: r.review_count,
    beds: r.beds,
    bedrooms: r.bedrooms,
    baths: r.baths,
    latitude: r.latitude,
    longitude: r.longitude,
    link: r.link,
    available: r.available,
  });
  return JSON.stringify(
    {
      provider: d.provider,
      destination: d.destination,
      checkin_date: d.checkin_date,
      checkout_date: d.checkout_date,
      search_status: d.search_status,
      search_reason: d.search_reason,
      properties: EXCERPT_ROWS.map(keep),
    },
    null,
    2
  );
})();

const dash = (v: number | null) => (v === null ? '—' : String(v));

export default function AirbnbApiPage() {
  const fx = FIXTURES.airbnbSearchRome;
  const p0 = EXCERPT_ROWS[0]!;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Hotels API', item: `${SITE.url}/hotels-api` },
            { '@type': 'ListItem', position: 3, name: 'Airbnb', item: `${SITE.url}/hotels-api/airbnb` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers Airbnb Live API',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: `Free tier: ${AIRBNB_BASIC.quota} requests/month on RapidAPI`,
          },
          url: `${SITE.url}/hotels-api/airbnb`,
          dateModified: '2026-10-27',
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/hotels-api', label: 'Hotels API' },
            { href: '/hotels-api/airbnb', label: 'Airbnb' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Airbnb Live API</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                Live Airbnb listings, <span className="text-signal-500">with real numbers</span>
              </h1>
              <p className="lede mt-5">
                FlightPowers&apos; Airbnb Live API: send a place and two dates to{' '}
                <code className="font-mono text-[0.85em] text-signal-400">POST /search</code> and you get the listings Airbnb
                is showing right now, with the stay total and the price per night as numbers in your currency (USD if you do
                not say). Free BASIC plan with {fmt(AIRBNB_BASIC.quota)} requests a month, then ${AIRBNB_PRO.priceMonthly}{' '}
                for {fmt(AIRBNB_PRO.quota)}.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>
                      Price range, room type and minimum beds, bedrooms and bathrooms go to Airbnb&apos;s own search, so the
                      page comes back already cut
                    </>,
                    <>
                      <code className="font-mono text-[13px] text-signal-400">min_rating</code> and{' '}
                      <code className="font-mono text-[13px] text-signal-400">sort</code> run on our side, and{' '}
                      <code className="font-mono text-[13px] text-signal-400">filters_applied</code> says which filter ran where
                    </>,
                    <>Each row carries rating, review count, beds, bedrooms, baths, coordinates and a direct link</>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('airbnb', 'endpoint')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/hotels-api" variant="ghost">
                  All hotel APIs
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">
                Its own RapidAPI listing: {HOST}. Free tier: {fmt(AIRBNB_BASIC.quota)} requests a month.
              </p>
            </div>

            <div>
              <Code label="POST /search · the captured request">{JSON.stringify(fx.request.body, null, 2)}</Code>
              <p className="mt-3 font-mono text-[11px] text-ink-500">
                The response this exact request produced is rendered below, labelled as a captured run.
              </p>
            </div>
          </div>
        </Container>
      </div>

      <ResponseChunk
        title="What an Airbnb search returns"
        answer={
          <>
            <Mono>POST /search</Mono> on <Mono>{HOST}</Mono>, with a RapidAPI key, takes a free-text{' '}
            <code className="field">destination</code> plus <code className="field">checkin_date</code> and{' '}
            <code className="field">checkout_date</code>, and returns the listings Airbnb is showing right now: the stay
            total and the price per night as numbers, the currency, the rating out of 5, review count, beds, bedrooms,
            baths, coordinates and a link to the listing. No listing id, no lookup step. Nothing is cached.
          </>
        }
        excerptLabel={`Rome, ${fx.data.checkin_date} → ${fx.data.checkout_date} · 2 of ${fx.data.properties_returned} listings, trimmed · captured ${fx.captured_at}`}
        excerpt={AIRBNB_SEARCH_EXCERPT}
        valueHeading="First excerpted listing"
        fields={[
          {
            name: 'price_total',
            type: 'number | null',
            meaning: (
              <>
                The total Airbnb quoted, for the <code className="field">nights</code> on the row.
              </>
            ),
            value: `${dash(p0.price_total)} ${p0.currency ?? ''}`,
          },
          {
            name: 'price_per_night',
            type: 'number | null',
            meaning: (
              <>
                Airbnb&apos;s own per-night line; we only divide when Airbnb didn&apos;t print one. Here{' '}
                {p0.nights} × {p0.price_per_night} is below the {p0.price_total} total, so don&apos;t rebuild the total from
                it.
              </>
            ),
            value: dash(p0.price_per_night),
          },
          {
            name: 'price_original_total',
            type: 'number | null',
            meaning: 'The struck-through price when the listing is discounted; null when it is not.',
            value: dash(p0.price_original_total),
          },
          {
            name: 'currency',
            type: 'string',
            meaning: (
              <>
                The currency you sent, or <code className="field">USD</code> when you sent none.
              </>
            ),
            value: p0.currency ?? 'null',
          },
          {
            name: 'rating / rating_scale',
            type: 'number | null · number | null',
            meaning: 'Out of 5 on every rated row; both null when the listing has no rating yet.',
            value: `${dash(p0.rating)} · ${dash(p0.rating_scale)}`,
          },
          {
            name: 'latitude / longitude',
            type: 'number | null · number | null',
            meaning: 'Where Airbnb places the listing on its map; null when Airbnb leaves them out.',
            value: `${dash(p0.latitude)} · ${dash(p0.longitude)}`,
          },
          {
            name: 'link',
            type: 'string',
            meaning: 'The listing on airbnb.com.',
            value: 'airbnb.com/rooms/…',
          },
        ]}
        notes={[
          <>
            Every row has every key: a field Airbnb didn&apos;t publish is <code className="field">null</code>, never a made-up
            zero and never missing. Branch on <code className="field">search_status</code>, not on the length of{' '}
            <code className="field">properties</code>.
          </>,
        ]}
      />

      <Section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHead
            eyebrow="The response, rendered"
            title="What came back for Rome"
            lede={`The first ${fx.data.properties.length} of the ${fx.data.properties_returned} listings the request above returned: 3 nights, 2 adults, priced in USD.`}
          />
          <CapturedBadge date={fx.captured_at} />
        </div>
        <div className="mt-8 scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                  <th className="px-4 py-3 font-normal">Listing</th>
                  <th className="px-4 py-3 font-normal text-right">Rating</th>
                  <th className="px-4 py-3 font-normal text-right">Reviews</th>
                  <th className="px-4 py-3 font-normal text-right">Per night</th>
                  <th className="px-4 py-3 font-normal text-right">Total, 3 nights</th>
                  <th className="px-4 py-3 font-normal text-right">Was</th>
                  <th className="px-4 py-3 font-normal" aria-label="Link" />
                </tr>
              </thead>
              <tbody>
                {fx.data.properties.map((p) => (
                  <tr key={p.provider_property_id ?? p.name} className="border-t rule">
                    <td className="px-4 py-3 font-medium text-ink-100">{p.name}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-200">{dash(p.rating)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-400">
                      {p.review_count === null ? '—' : fmt(p.review_count)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-200">{dash(p.price_per_night)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-100">{dash(p.price_total)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-500">{dash(p.price_original_total)}</td>
                    <td className="px-4 py-3 text-right">
                      {p.link ? (
                        <a
                          href={p.link}
                          rel="noopener nofollow"
                          target="_blank"
                          className="font-mono text-[12px] text-signal-400 hover:text-signal-500 underline underline-offset-4"
                        >
                          link →
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 text-[14px] text-ink-400 leading-relaxed max-w-3xl">
          Prices in USD. &ldquo;Was&rdquo; is <code className="field">price_original_total</code>, the struck-through price on a
          discounted listing; a dash is a <code className="field">null</code> in the response (the first row of this table had no rating
          yet). Every row also has <code className="field">price_string</code>, <code className="field">image_url</code>,{' '}
          <code className="field">provider_property_id</code> and <code className="field">retrieved_at</code>.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="First call"
          title="One request, no lookup step"
          lede="You say where and when, you get what it costs. Replace $RAPIDAPI_KEY and paste it in a terminal."
        />
        <div className="mt-8 max-w-3xl">
          <Code label="curl · POST /search">{SEARCH_CURL}</Code>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Filters"
          title="Filtered at the source"
          lede="Most of these are Airbnb's own search parameters, so the page you get is already narrowed. Two run on our side, on the rows we parsed, and filters_applied in the response marks them post_filter: true. proxy_country is ours too, but it only picks where the request leaves from."
        />
        <div className="mt-8 scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                  <th className="px-4 py-3 font-normal">Parameter</th>
                  <th className="px-4 py-3 font-normal">Type</th>
                  <th className="px-4 py-3 font-normal">What it does</th>
                  <th className="px-4 py-3 font-normal">Runs at</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {FILTERS.map((f) => (
                  <tr key={f.name} className="border-t rule">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <code className="field">{f.name}</code>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-ink-500">{f.type}</td>
                    <td className="px-4 py-3 text-ink-300">{f.what}</td>
                    <td className={`px-4 py-3 font-mono text-[12px] ${f.at === 'ours' ? 'text-signal-400' : 'text-ink-400'}`}>{f.at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-6 text-[15px] text-ink-400 leading-relaxed max-w-3xl">
          A filter that belongs to our Booking.com API (<code className="field">filters</code>,{' '}
          <code className="field">budget_per_night</code>, <code className="field">free_cancellation</code>,{' '}
          <code className="field">hotel_name</code>, <code className="field">hotel_booking_id</code>,{' '}
          <code className="field">price_as_seen_from</code>) is refused with <code className="field">unsupported_for_provider</code>{' '}
          and, where Airbnb has one, the name of the parameter to use instead. Refused, not dropped, because a dropped filter hands you more
          listings than you asked for. A parameter name this API doesn&apos;t know (a typo like{' '}
          <code className="field">min_bedroom</code>) is ignored, so check <code className="field">filters_applied</code>: a
          filter that isn&apos;t listed there didn&apos;t run.
        </p>
        <p className="mt-4 text-[15px] text-ink-400 leading-relaxed max-w-3xl">
          If you want to check whether prices differ by country, hold one listing fixed and call each country a few times. One
          call per country isn&apos;t a measurement.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="The rows" title="What else to know about the rows" />
        <div className="mt-8 max-w-3xl">
          <FieldRow name="rating_scale" type="5 | null">
            5 on every rated row (<code className="field">null</code> when the listing has no rating yet). Our Booking.com API
            rates out of 10, so check the scale before you put a 4.86 next to an 8.3.
          </FieldRow>
          <FieldRow name="taxes_included" type="null">
            Always <code className="field">null</code>. Airbnb&apos;s display total treats taxes differently by place and we
            haven&apos;t pinned it down, so the field says &ldquo;not known&rdquo; instead of guessing.
          </FieldRow>
          <FieldRow name="nights" type="number | null">
            The night count Airbnb quoted the price for. It can differ from your dates when Airbnb shifts them, so read it
            before dividing.
          </FieldRow>
          <FieldRow name="available" type="boolean">
            <code className="field">true</code> when the row has a price. It does not promise your exact dates: when{' '}
            <code className="field">nights</code> differs from your stay, Airbnb priced different dates.
          </FieldRow>
          <FieldRow name="price_string" type="string | null">
            Airbnb&apos;s own label, if you want to show exactly what a guest saw:{' '}
            <code className="field">&quot;{p0.price_string}&quot;</code> on the first excerpted listing.
          </FieldRow>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="POST /details"
          title="One listing in detail (no price)"
          lede="listing_id is the number at the end of an airbnb.com/rooms/... link, and provider_property_id on every search row."
        />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <Code label="curl · POST /details">{DETAILS_CURL}</Code>
          <p className="text-[15px] text-ink-300 leading-relaxed">
            You get the name, property type, rating, review count, coordinates, <code className="field">person_capacity</code>{' '}
            and the full <code className="field">amenities</code> list. No price, and it says so: Airbnb loads a listing
            page&apos;s price after the page opens, so it isn&apos;t in what we read. <code className="field">price_total</code>{' '}
            and <code className="field">available</code> are <code className="field">null</code> and the row carries{' '}
            <code className="field">price_available_on_this_page: false</code>. For a price, search.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Errors"
          title="When something comes back wrong"
          lede="Every response has search_status and search_reason, and every degraded or error one has detail, a sentence you can act on. A 200 with an empty properties list only ever means search_status: empty. A page we couldn't read is never a 200."
        />
        <div className="mt-8 scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                  <th className="px-4 py-3 font-normal">search_status</th>
                  <th className="px-4 py-3 font-normal">HTTP</th>
                  <th className="px-4 py-3 font-normal">search_reason</th>
                  <th className="px-4 py-3 font-normal">What it means</th>
                  <th className="px-4 py-3 font-normal">What to do</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {STATUSES.map((r) => (
                  <tr key={r.reason} className="border-t rule">
                    <td className="px-4 py-3 font-mono text-[12.5px] text-ink-200">{r.status}</td>
                    <td className="px-4 py-3 font-mono text-[12.5px] tabular-nums text-ink-400">{r.http}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <code className="field">{r.reason}</code>
                    </td>
                    <td className="px-4 py-3 text-ink-300">{r.means}</td>
                    <td className="px-4 py-3 text-ink-400">{r.todo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Pricing"
          title={`${fmt(AIRBNB_PRO.quota)} requests for $${AIRBNB_PRO.priceMonthly}`}
          lede={`An Airbnb search is a plain page read. There's no browser behind it, and it goes out direct: a residential proxy only comes in when Airbnb refuses the direct request, or when you ask for a country with proxy_country. It costs far less to serve, so PRO here is ${fmt(AIRBNB_PRO.quota)} requests for $${AIRBNB_PRO.priceMonthly}, against ${fmt(FLIGHTS_PRO.quota)} on the flights API.`}
        />
        <div className="mt-8">
          <PricingTable api="airbnb" plans={AIRBNB_PLANS} medium="endpoint" readOn={AIRBNB_READ_ON} />
        </div>
        <p className="mt-4 text-[14.5px] text-ink-400 leading-relaxed max-w-3xl">
          Every field and every filter is on every plan, the free one too. A call to any endpoint is one request, and a 400
          counts like any other call, so keep check-in in the future.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="Build with it" title="Things to build with it" />
        <div className="mt-8 max-w-3xl">
          <CheckBullets
            items={[
              <>
                <strong className="text-ink-100">Deal scanning.</strong> Sweep a city across a month of check-in dates on a
                schedule and watch <code className="field">price_per_night</code> move.
              </>,
              <>
                <strong className="text-ink-100">Rentals next to hotels.</strong> Same trip, this API and our{' '}
                <Link href="/hotels-api/search" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
                  Booking.com search
                </Link>
                . Airbnb rates out of 5 and Booking out of 10, and <code className="field">taxes_included</code> is{' '}
                <code className="field">null</code> here, so compare with that in mind.
              </>,
              <>
                <strong className="text-ink-100">AI travel agents.</strong> Flat JSON that drops straight into a tool call. Or
                skip the code: on this same subscription, the{' '}
                <Link href="/mcp/booking-hotels" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
                  hotels MCP server
                </Link>{' '}
                gives Claude, Cursor or ChatGPT <code className="field">search_airbnb</code> and{' '}
                <code className="field">compare_hotel_rates</code>, which prices one stay on Booking.com and Airbnb when you
                subscribe to both.
              </>,
              <>
                <strong className="text-ink-100">Market analysis.</strong> Coordinates on the rows, so you can place listings by
                neighbourhood. One search is one page, so cover a city with several searches (by price band or room type).
              </>,
              <>
                <strong className="text-ink-100">Price alerts.</strong> Re-run the same search on a schedule and fire when a
                listing on it drops in <code className="field">price_total</code> or shows{' '}
                <code className="field">price_original_total</code>.
              </>,
            ]}
          />
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Explore more" title="More hotel APIs" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/hotels-api/search', label: 'Booking.com search', sub: 'Live rates by destination' },
            { href: '/hotels-api/by-name', label: 'Hotel by name', sub: 'No property-ID step' },
            { href: '/guides/airbnb-api', label: 'Airbnb API guide', sub: 'Official API, limits, alternatives' },
            { href: '/flights-api', label: 'Flights API', sub: 'Live Google Flights fares' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <div className="rounded-3xl border rule bg-ink-900/70 px-6 py-10 sm:px-12 sm:py-16 text-center">
          <h2 className="text-[1.75rem] sm:text-4xl font-semibold">Start with one search</h2>
          <p className="lede mx-auto mt-4 max-w-2xl">
            Live Airbnb listings with the stay total, the price per night, ratings and coordinates, as flat JSON your code or
            your agent can use directly.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Cta href={rapidApiPricingUrl('airbnb', 'endpoint')} external variant="primary">
              Get a key on RapidAPI →
            </Cta>
            <Cta href="/hotels-api" variant="ghost">
              All hotel APIs
            </Cta>
          </div>
          <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier: {fmt(AIRBNB_BASIC.quota)} requests a month.</p>
          <p className="mt-5 text-[13px] text-ink-500">
            Independent API. Not affiliated with, endorsed by, or sponsored by Airbnb, Inc.
          </p>
        </div>
      </Section>
    </>
  );
}
