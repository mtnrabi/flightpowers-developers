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
import { GOOGLE_HOTELS_PLANS, GOOGLE_HOTELS_READ_ON } from '@/lib/pricing';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

/*
 * Every claim on this page comes from one of:
 *  - the live listing rapidapi.com/mtnrabi/api/google-hotels-live-api (plans
 *    read from its /pricing payload on 2026-10-27, see lib/pricing.ts),
 *  - the reviewed listing copy and launch notes in the agents repo
 *    (state/gtm/PASTE-google-hotels-listing-2026-10-23.md,
 *    state/gtm/research/multi-ota-2026-10-23/google-hotels-launch-02.md and
 *    google-hotels-phase2.md),
 *  - hotel_agent main, nodejs_mvp/providers/google_hotels.js and
 *    nodejs_mvp/ota_lite/main.js (parameters, fields, refusals, statuses).
 * The Rome rows below are from the post-deploy call of 2026-10-23
 * (Hotel Artemide, 2026-12-15 to 12-18, 2 adults, USD). Google Hotels is NOT
 * on the MCP servers: make no MCP claim here. Wording rule: "the sites Google
 * lists for this hotel", never "every OTA". Example dates must be dates Google
 * shows prices for (about 6-8 weeks out; far dates come back with no sites).
 */

const BASIC = GOOGLE_HOTELS_PLANS.find((p) => p.name === 'BASIC')!;
const PRO = GOOGLE_HOTELS_PLANS.find((p) => p.name === 'PRO')!;
const fmt = (n: number) => n.toLocaleString('en-US');

const TITLE = 'Google Hotels API: live hotel rates on each site Google lists';

export const metadata: Metadata = {
  ...withOg({
    title: TITLE,
    description:
      'Google Hotels Live API: send a hotel name and dates, get its rate on each booking site Google lists for it, with links. Or search a city. Free tier.',
    alternates: { canonical: '/hotels-api/google-hotels' },
  }),
  title: { absolute: TITLE },
};

export const dynamic = 'force-static';

const HOST = 'google-hotels-live-api.p.rapidapi.com';
const CAPTURED = '2026-10-23';
const CHECKIN = '2026-12-15';
const CHECKOUT = '2026-12-18';

const RATES_CURL = `curl -X POST "https://${HOST}/rates" \\
  -H "Content-Type: application/json" \\
  -H "x-rapidapi-host: ${HOST}" \\
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \\
  -d '{"hotel_name":"Hotel Artemide","destination":"Rome","checkin_date":"${CHECKIN}","checkout_date":"${CHECKOUT}","adults":2,"currency":"USD"}'`;

const SEARCH_CURL = `curl -X POST "https://${HOST}/search" \\
  -H "Content-Type: application/json" \\
  -H "x-rapidapi-host: ${HOST}" \\
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \\
  -d '{"destination":"Lisbon","checkin_date":"${CHECKIN}","checkout_date":"${CHECKOUT}","adults":2,"currency":"USD"}'`;

/** Three of the 29 sites the Rome by-name call returned on 2026-10-23 (links trimmed). */
const ROME_SITES = [
  { site: 'Agoda', price_total: 673, price_total_before_taxes: 612, price_per_night: 224.33 },
  { site: 'Expedia.com', price_total: 742, price_total_before_taxes: 629, price_per_night: 247.33 },
  { site: 'Booking.com', price_total: 751, price_total_before_taxes: 637, price_per_night: 250.33 },
];

const siteRow = (s: (typeof ROME_SITES)[number], domain: string) => ({
  site: s.site,
  official_site: false,
  price_total: s.price_total,
  price_total_before_taxes: s.price_total_before_taxes,
  price_per_night: s.price_per_night,
  taxes_included: true,
  currency: 'USD',
  link: `https://www.${domain}/...`,
});

const RATES_EXCERPT = JSON.stringify(
  {
    provider: 'google_hotels',
    hotel_name: 'Hotel Artemide',
    checkin_date: CHECKIN,
    checkout_date: CHECKOUT,
    matched_name: 'Hotel Artemide',
    match_score: 1,
    search_status: 'ok',
    search_reason: 'ok',
    properties: [
      {
        name: 'Hotel Artemide',
        sites: [siteRow(ROME_SITES[0]!, 'agoda.com'), siteRow(ROME_SITES[2]!, 'booking.com')],
      },
    ],
  },
  null,
  2
);

const SEARCH_PARAMS: { name: string; type: string; what: string }[] = [
  { name: 'destination', type: 'string, required', what: 'A place the way a person types it: "Lisbon", "Rome, Italy". Not "hotels in Rome"' },
  { name: 'checkin_date', type: 'YYYY-MM-DD, required', what: 'Today or later' },
  { name: 'checkout_date', type: 'YYYY-MM-DD, required', what: 'After checkin_date' },
  { name: 'adults', type: 'integer 1-9', what: 'Default 2' },
  { name: 'children_ages', type: 'list of integers 0-17', what: 'One age per child. Google prices a child by age, so a bare children count is refused' },
  { name: 'currency', type: 'ISO code', what: 'Default USD. Prices on every row come back in it' },
];

const STATUSES: { status: string; http: string; reason: string; means: string; todo: string }[] = [
  { status: 'ok', http: '200', reason: 'ok', means: 'Data found', todo: 'Use it' },
  {
    status: 'empty',
    http: '200',
    reason: 'no_results',
    means:
      "Read fine, nothing to return: no hotels for those dates, a place Google didn't recognise (destination_matched: null), or a name Google matched to a different hotel (candidates)",
    todo: 'Read detail',
  },
  {
    status: 'degraded',
    http: '502',
    reason: 'blocked_page / blocked_status / upstream_error / timeout',
    means: "We couldn't read Google's page, after one retry",
    todo: 'Retry',
  },
  { status: 'degraded', http: '502', reason: 'parse_failed', means: "Google's page had a shape we don't know yet", todo: 'Retry once, then message us' },
  {
    status: 'error',
    http: '400',
    reason: 'invalid_request / bad_request / unsupported_for_provider',
    means: 'The request cannot be searched as sent',
    todo: 'Fix the request; detail says what',
  },
];

const faq: Faq[] = [
  {
    q: 'Which booking sites does it return?',
    a: "The sites Google Hotels lists for that hotel on those dates. In the Rome call on this page that was 29 sites, 27 of them with a total, Agoda, Expedia and Booking.com among them. Which sites appear is Google's choice and changes by hotel and dates, and Booking.com is not always one of them.",
  },
  {
    q: 'Do I need a Google hotel id?',
    a: 'No. Send hotel_name with the city in destination and Google picks the hotel; we check the name against what you sent and echo matched_name and match_score. If Google picks a different hotel, or the name reads as a place or a chain, you get no rates: search_status is empty and up to 5 candidates (name and entity_id) come back to call again with. A provider_property_id from /search works as entity_id too.',
  },
  {
    q: 'Are the prices whole numbers or to the cent?',
    a: "By name, each site's price is Google's displayed amount, in whole units. By entity_id it is to the cent. price_total includes taxes and fees; a site that shows no with-taxes figure has price_total: null and taxes_included: false, never the before-taxes number relabelled.",
  },
  {
    q: 'Why did a date come back with no sites?',
    a: 'Google shows no prices for dates far ahead, so a stay months out can come back with available: false and no sites. Dates a few weeks to a couple of months out return prices.',
  },
  {
    q: 'Can I filter by price or star rating, or page through results?',
    a: 'Not yet. One /search returns one page of Google’s results, about 18 to 20 hotels and holiday rentals, with no price or class filters and no sort; filter the rows on your side. price_min, price_max, min_rating, sort and the other filters our Airbnb and Booking.com APIs take are refused with unsupported_for_provider rather than ignored.',
  },
  {
    q: 'Is it the same key as the flights, Booking.com and Airbnb APIs?',
    a: 'One RapidAPI key works on all of them once you subscribe to each. The Google Hotels Live API is its own listing and its own subscription.',
  },
  {
    q: 'Is this an official Google API?',
    a: 'No. It reads Google Hotels’ public pages at the moment you ask; nothing is cached. FlightPowers is not affiliated with Google.',
  },
];

export default function GoogleHotelsApiPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Google Hotels API', item: `${SITE.url}/hotels-api/google-hotels` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers Google Hotels Live API',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: `Free tier: ${BASIC.quota} requests/month on RapidAPI`,
          },
          url: `${SITE.url}/hotels-api/google-hotels`,
          dateModified: '2026-10-27',
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/hotels-api/google-hotels', label: 'Google Hotels API' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Google Hotels Live API</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                One hotel&apos;s rate on <span className="text-signal-500">each site Google lists</span>
              </h1>
              <p className="lede mt-5">
                FlightPowers&apos; Google Hotels Live API: send a hotel&apos;s name and your dates to{' '}
                <code className="font-mono text-[0.85em] text-signal-400">POST /rates</code> and you get its rate on each site
                Google Hotels lists for it, each with the total including taxes and a link. Or search a city with{' '}
                <code className="font-mono text-[0.85em] text-signal-400">POST /search</code>. Free BASIC plan with{' '}
                {fmt(BASIC.quota)} requests a month, then ${PRO.priceMonthly} for {fmt(PRO.quota)}.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>No hotel id and no lookup step: the name plus the city is enough</>,
                    <>
                      Each site comes back with the total with taxes, the total before taxes, the price per night and a link,
                      in your currency
                    </>,
                    <>A city search returns the hotels with the stay total, rating, class and coordinates</>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('googleHotels', 'endpoint')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/pricing" variant="ghost">
                  All plans
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">
                Its own RapidAPI listing: {HOST}. Free tier: {fmt(BASIC.quota)} requests a month.
              </p>
            </div>

            <div>
              <Code label="POST /rates · the request behind the rows below">{RATES_CURL}</Code>
              <p className="mt-3 font-mono text-[11px] text-ink-500">
                Replace $RAPIDAPI_KEY and paste it in a terminal. The response this request produced on {CAPTURED} is
                excerpted below, labelled as a captured run.
              </p>
            </div>
          </div>
        </Container>
      </div>

      <ResponseChunk
        title="What a rates call returns"
        answer={
          <>
            <Mono>POST /rates</Mono> on <Mono>{HOST}</Mono>, with a RapidAPI key, takes a{' '}
            <code className="field">hotel_name</code> (with the city in <code className="field">destination</code>) or an{' '}
            <code className="field">entity_id</code>, plus <code className="field">checkin_date</code> and{' '}
            <code className="field">checkout_date</code>, and returns one row for the hotel with a{' '}
            <code className="field">sites</code> list: the rate on each site Google lists for it, read live. In one call on{' '}
            {CAPTURED}, Hotel Artemide in Rome (3 nights in December, 2 adults) ran from $615 to $803, total with taxes,
            across the 27 of its 29 sites that showed one.
          </>
        }
        excerptLabel={`Hotel Artemide, Rome, ${CHECKIN} → ${CHECKOUT} · hotel row trimmed to its name and 2 of 29 sites, links cut · captured ${CAPTURED}`}
        excerpt={RATES_EXCERPT}
        valueHeading="Agoda row"
        fields={[
          {
            name: 'matched_name / match_score',
            type: 'string · number',
            meaning: 'The hotel Google picked for your name, and how closely it matches what you sent.',
            value: 'Hotel Artemide · 1',
          },
          {
            name: 'price_total',
            type: 'number | null',
            meaning: 'The stay total on that site, including taxes and fees; null when the site shows no with-taxes figure.',
            value: '673 USD',
          },
          {
            name: 'price_total_before_taxes',
            type: 'number | null',
            meaning: 'The same stay before taxes, as that site shows it.',
            value: '612',
          },
          {
            name: 'price_per_night',
            type: 'number | null',
            meaning: 'price_total divided by the nights of your stay.',
            value: '224.33',
          },
          {
            name: 'official_site',
            type: 'boolean',
            meaning: "true when the entry is the hotel's own site.",
            value: 'false',
          },
          {
            name: 'link',
            type: 'string',
            meaning: 'A link to that site for this hotel.',
            value: 'agoda.com/…',
          },
        ]}
        notes={[
          <>
            Each entry also carries <code className="field">site_id</code>, <code className="field">price_string</code>,{' '}
            <code className="field">per_night_string</code> and <code className="field">taxes_included</code>. Branch on{' '}
            <code className="field">search_status</code>, not on the length of <code className="field">properties</code>.
          </>,
        ]}
      />

      <Section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHead
            eyebrow="The response, rendered"
            title="Three of the 29 sites for one Rome hotel"
            lede={`Hotel Artemide, ${CHECKIN} to ${CHECKOUT}, 2 adults, priced in USD. By name, site prices are Google's displayed amounts, in whole units.`}
          />
          <CapturedBadge date={CAPTURED} />
        </div>
        <div className="mt-8 scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                  <th className="px-4 py-3 font-normal">Site</th>
                  <th className="px-4 py-3 font-normal text-right">Total with taxes</th>
                  <th className="px-4 py-3 font-normal text-right">Before taxes</th>
                  <th className="px-4 py-3 font-normal text-right">Per night</th>
                </tr>
              </thead>
              <tbody>
                {ROME_SITES.map((s) => (
                  <tr key={s.site} className="border-t rule">
                    <td className="px-4 py-3 font-medium text-ink-100">{s.site}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-100">{s.price_total}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-400">{s.price_total_before_taxes}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-200">{s.price_per_night}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 text-[14px] text-ink-400 leading-relaxed max-w-3xl">
          Which sites appear is Google&apos;s choice and changes by hotel and dates. Booking.com is not always one of them.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="POST /search"
          title="A city's hotels"
          lede="One search returns one page of Google's results, about 18 to 20 hotels and holiday rentals. In a test call on 2026-10-23 (Lisbon, the same dates, 2 adults, USD) all 20 rows came back priced."
        />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <Code label="curl · POST /search">{SEARCH_CURL}</Code>
          <div className="scroll-x rounded-2xl border rule">
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                    <th className="px-4 py-3 font-normal">Parameter</th>
                    <th className="px-4 py-3 font-normal">Type</th>
                    <th className="px-4 py-3 font-normal">Notes</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {SEARCH_PARAMS.map((f) => (
                    <tr key={f.name} className="border-t rule">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <code className="field">{f.name}</code>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-ink-500">{f.type}</td>
                      <td className="px-4 py-3 text-ink-300">{f.what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mt-8 max-w-3xl">
          <FieldRow name="price_total" type="number | null">
            The stay total including taxes and fees: Google&apos;s lowest across the sites it lists for that hotel.{' '}
            <code className="field">price_total_before_taxes</code> and <code className="field">price_per_night</code> sit next
            to it.
          </FieldRow>
          <FieldRow name="provider_property_id" type="string">
            Google&apos;s id for the hotel. Send it as <code className="field">entity_id</code> to{' '}
            <code className="field">/rates</code> for its site list, with prices to the cent.
          </FieldRow>
          <FieldRow name="rating / review_count / hotel_class" type="number | null">
            Rating out of 5, the review count and the star class, as Google shows them.
          </FieldRow>
          <FieldRow name="property_kind" type="hotel | vacation_rental">
            Google mixes holiday rentals into a city search; this tells them apart.
          </FieldRow>
          <FieldRow name="deal_label" type="string | null">
            Google&apos;s own deal line when it shows one (for example &ldquo;17% less than usual&rdquo;).
          </FieldRow>
          <FieldRow name="link" type="string">
            The hotel&apos;s Google Hotels prices page. Each row also has <code className="field">name</code>,{' '}
            <code className="field">latitude</code>, <code className="field">longitude</code>,{' '}
            <code className="field">currency</code>, <code className="field">image_url</code> and{' '}
            <code className="field">retrieved_at</code>; a field Google didn&apos;t show is <code className="field">null</code>.
          </FieldRow>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Refused, not ignored"
          title="What this API does not take"
          lede="A dropped filter hands you more than you asked for, so these come back as a 400 with unsupported_for_provider instead."
        />
        <p className="mt-6 text-[15px] text-ink-400 leading-relaxed max-w-3xl">
          <code className="field">children</code> (use <code className="field">children_ages</code>),{' '}
          <code className="field">infants</code>, <code className="field">pets</code>, <code className="field">filters</code>,{' '}
          <code className="field">proxy_country</code>, <code className="field">price_min</code>,{' '}
          <code className="field">price_max</code>, <code className="field">min_rating</code>, <code className="field">sort</code>,{' '}
          <code className="field">room_types</code> and the bedroom, bed and bathroom counts. Any other field not listed on this
          page is ignored. There are no price or class filters and no sort: filter the rows on your side.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Errors"
          title="When something comes back wrong"
          lede="Every response has search_status and search_reason, and every degraded or error one has detail, a sentence you can act on. A 200 with no rows only ever means search_status: empty. A page we couldn't read is never a 200."
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
                    <td className="px-4 py-3">
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
          title={`${fmt(PRO.quota)} requests for $${PRO.priceMonthly}`}
          lede="Every endpoint costs one request: a city search and a rates call by name are the same price."
        />
        <div className="mt-8">
          <PricingTable api="googleHotels" plans={GOOGLE_HOTELS_PLANS} medium="endpoint" readOn={GOOGLE_HOTELS_READ_ON} />
        </div>
        <p className="mt-4 text-[14.5px] text-ink-400 leading-relaxed max-w-3xl">
          Every field is on every plan, the free one too. A 400 counts like any other call, so keep check-in in the future.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="Build with it" title="Things to build with it" />
        <div className="mt-8 max-w-3xl">
          <CheckBullets
            items={[
              <>
                <strong className="text-ink-100">Rate comparison for one hotel.</strong> The site list puts each booking
                site&apos;s total side by side, with a link to each.
              </>,
              <>
                <strong className="text-ink-100">Direct vs third-party.</strong> <code className="field">official_site</code>{' '}
                marks the hotel&apos;s own site when Google lists it, so you can set it against the other sites.
              </>,
              <>
                <strong className="text-ink-100">Price alerts.</strong> Re-run the same hotel and dates on a schedule and fire
                when a site&apos;s <code className="field">price_total</code> drops.
              </>,
              <>
                <strong className="text-ink-100">Hotels next to rentals.</strong> Same trip, this API and our{' '}
                <Link href="/hotels-api/airbnb" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
                  Airbnb API
                </Link>
                . Both rate out of 5.
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
            { href: '/hotels-api/airbnb', label: 'Airbnb API', sub: 'Live Airbnb listings and prices' },
            { href: '/hotels-api/search', label: 'Booking.com search', sub: 'Live rates by destination' },
            { href: '/hotels-api/by-name', label: 'Booking.com hotel by name', sub: 'No property-ID step' },
            { href: '/pricing', label: 'Pricing', sub: 'Every plan on every API' },
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
          <h2 className="text-[1.75rem] sm:text-4xl font-semibold">Start with one hotel</h2>
          <p className="lede mx-auto mt-4 max-w-2xl">
            One hotel&apos;s rate on each site Google lists for it, or a city&apos;s hotels with the stay total, as flat JSON
            your code or your agent can use directly.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Cta href={rapidApiPricingUrl('googleHotels', 'endpoint')} external variant="primary">
              Get a key on RapidAPI →
            </Cta>
          </div>
          <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier: {fmt(BASIC.quota)} requests a month.</p>
          <p className="mt-5 text-[13px] text-ink-500">Independent API. Not affiliated with, endorsed by, or sponsored by Google.</p>
        </div>
      </Section>
    </>
  );
}
