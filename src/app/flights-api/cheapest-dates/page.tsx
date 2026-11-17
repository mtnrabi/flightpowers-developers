import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { Mono, ResponseChunk } from '@/components/ResponseChunk';
import {
  Breadcrumbs,
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
import capture from '@/lib/fixtures/cheapest-dates-jfk-lax.json';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Cheapest dates API: a month of Google Flights fares in one request',
  description:
    'POST /cheapest_dates: the lowest fare Google Flights shows for every departure date of a month or a range (up to 61 days), one-way or a round trip of N nights, in one request.',
  alternates: { canonical: '/flights-api/cheapest-dates' },
});

export const dynamic = 'force-static';

const HOST = 'google-flights-live-api.p.rapidapi.com';
const PATH = '/api/google_flights/cheapest_dates/v1';

type Row = { departure_date: string; return_date?: string; price: number | null };
const data = capture.data as {
  from_airport: string;
  to_airport: string;
  trip_type: string;
  nights: number;
  currency: string;
  fetched_at: string;
  dates_searched: number;
  dates_with_price: number;
  cheapest: Row;
  dates: Row[];
  source_note: string;
};

const CURL = `curl -X POST "https://${HOST}${PATH}" \\
  -H "Content-Type: application/json" \\
  -H "x-rapidapi-host: ${HOST}" \\
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \\
  -d '${JSON.stringify(capture.request.body)}'`;

const ONEWAY_BODY = JSON.stringify(
  { from_airport: 'LHR', to_airport: 'BCN', departure_date_from: '2027-02-01', departure_date_to: '2027-03-15', currency: 'EUR' },
  null,
  2
);

/** The captured answer with the date list cut to its first four rows. */
const EXCERPT = JSON.stringify({ ...data, dates: [...data.dates.slice(0, 4), '…'] }, null, 2);

const prices = data.dates.map((d) => d.price).filter((p): p is number => p !== null);
const HIGHEST = Math.max(...prices);

const REFUSALS: { when: string; field: string; detail: string }[] = [
  { when: 'month and a date range together', field: 'month', detail: 'month: send month or a date range, not both' },
  { when: 'month not YYYY-MM', field: 'month', detail: "month must be YYYY-MM (e.g. 2027-01), got '2027-1-5'" },
  { when: 'Neither month nor a range', field: 'departure_date_from', detail: 'departure_date_from: required when month is not sent' },
  { when: 'A range over 61 days', field: 'departure_date_to', detail: 'departure_date_to: the range is at most 61 days' },
  { when: 'A start date in the past', field: 'departure_date_from', detail: 'departure_date_from: must be today or later in UTC' },
  { when: 'nights outside 1 to 30', field: 'nights', detail: 'nights: must be 1 to 30' },
  { when: 'adults outside 1 to 9', field: 'adults', detail: 'adults: must be 1 to 9' },
];

const faq: Faq[] = [
  {
    q: 'How many requests does it cost?',
    a: 'One. A whole month (or any range up to 61 days) is one request on your RapidAPI plan, one-way or round trip.',
  },
  {
    q: 'Are these the same prices as a full search?',
    a: 'They are Google Flights’ calendar estimates: the lowest fare Google shows for each date, with no airline or flight details. In our checks they matched the one-way and round-trip endpoints to the unit, but a full search for a date can return a different price, so confirm the date you pick with the one-way or round-trip endpoint before booking.',
  },
  {
    q: 'Why is a price null?',
    a: 'Google shows no fare for that date. Every date in the range gets a row; price is null where Google has none. A range with no priced date at all answers 200 with X-Search-Status: empty.',
  },
  {
    q: 'Is the price per person?',
    a: 'No: it is for all the adults you send, together. Children and infants are not taken on this endpoint.',
  },
  {
    q: 'What happens when Google does not answer?',
    a: 'A 503 with the standard failure body (search_status degraded, retry true). It is safe to send again.',
  },
];

export default function CheapestDatesPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Flights API', item: `${SITE.url}/flights-api` },
            { '@type': 'ListItem', position: 3, name: 'Cheapest Dates', item: `${SITE.url}/flights-api/cheapest-dates` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers Cheapest Dates API',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free tier: 50 requests/month on RapidAPI' },
          url: `${SITE.url}/flights-api/cheapest-dates`,
          dateModified: '2026-11-17',
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/flights-api', label: 'Flights API' },
            { href: '/flights-api/cheapest-dates', label: 'Cheapest Dates' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Cheapest Dates API</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                A month of fares, <span className="text-signal-500">one request</span>
              </h1>
              <p className="lede mt-5">
                Send a route and a month. Get back the lowest fare Google Flights shows for every departure date, and the
                cheapest one, in one call.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>A month, or any range up to 61 days</>,
                    <>One-way, or a round trip of 1 to 30 nights</>,
                    <>Billed as one request</>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'endpoint')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>
            <Code label={`curl · ${data.from_airport} → ${data.to_airport}, ${capture.request.body.month}, ${data.nights} nights`}>
              {CURL}
            </Code>
          </div>
        </Container>
      </div>

      <ResponseChunk
        title="What the cheapest dates endpoint returns"
        answer={
          <>
            <Mono>POST {PATH}</Mono> on <Mono>{HOST}</Mono> (RapidAPI key) takes one airport a side and a{' '}
            <code className="field">month</code> or a date range. It returns one row per departure date with Google
            Flights&apos; lowest fare for it, the <code className="field">cheapest</code> date, and when the prices were
            fetched. Prices are Google&apos;s calendar estimates, without airline or flight details.
          </>
        }
        request={{ label: 'request body · the captured run', text: JSON.stringify(capture.request.body, null, 2) }}
        excerptLabel={`${data.from_airport} → ${data.to_airport}, January 2027, ${data.nights} nights · first 4 of ${data.dates.length} dates · captured ${capture.captured_at}`}
        excerpt={EXCERPT}
        valueHeading="In this run"
        fields={[
          {
            name: 'cheapest',
            type: 'object',
            meaning: 'The date with the lowest price in the range, with its return date on a round trip.',
            value: `${data.cheapest.departure_date} → ${data.cheapest.return_date}, $${data.cheapest.price}`,
          },
          {
            name: 'dates[].price',
            type: 'number | null',
            meaning: 'The lowest fare Google shows for that departure date, for all passengers together. Null where Google shows none.',
            value: `$${data.cheapest.price} to $${HIGHEST} across the month`,
          },
          {
            name: 'dates_searched / dates_with_price',
            type: 'int',
            meaning: 'How many dates the range covered, and how many of them Google priced.',
            value: `${data.dates_searched} / ${data.dates_with_price}`,
          },
          {
            name: 'fetched_at',
            type: 'string',
            meaning: 'When the calendar was read (UTC). Prices move; read them with this time.',
            value: data.fetched_at,
          },
        ]}
        notes={[
          <>
            Pick a date here, then price it in full with the{' '}
            <Link href="/flights-api/one-way" className="text-signal-400 hover:text-signal-300">
              one-way
            </Link>{' '}
            or{' '}
            <Link href="/flights-api/round-trip" className="text-signal-400 hover:text-signal-300">
              round-trip
            </Link>{' '}
            endpoint for flights, airlines and a booking link.
          </>,
        ]}
      />

      <Section>
        <SectionHead
          eyebrow="Request"
          title="Fields"
          lede="Unknown fields are refused, so a typo never silently searches something else."
        />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <FieldRow name="from_airport / to_airport" type="string">
              One IATA airport or city code a side, e.g. <code className="field">JFK</code>.
            </FieldRow>
            <FieldRow name="month" type="string">
              <code className="field">YYYY-MM</code>: every departure date of that month. A month already under way starts
              today. Send this, or the two range fields.
            </FieldRow>
            <FieldRow name="departure_date_from / departure_date_to" type="string">
              <code className="field">YYYY-MM-DD</code>, today or later, at most 61 days with both ends included.
            </FieldRow>
            <FieldRow name="nights" type="int 1–30">
              A round trip of this many nights; each row then carries its <code className="field">return_date</code>. Omit it
              for a one-way.
            </FieldRow>
            <FieldRow name="adults" type="int 1–9">
              Defaults to 1. Prices are for all of them together.
            </FieldRow>
            <FieldRow name="currency" type="string">
              e.g. <code className="field">USD</code>, <code className="field">EUR</code>.
            </FieldRow>
          </div>
          <Code label="request body · one-way over a 43-day range, in EUR">{ONEWAY_BODY}</Code>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Errors"
          title="Every refusal is a 422 that names the field"
          lede="Refused before anything is fetched. The body carries detail, help, hint and field, like every other 422 on this API."
        />
        <div className="mt-8 scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                  <th className="px-4 py-3 font-normal">You sent</th>
                  <th className="px-4 py-3 font-normal">field</th>
                  <th className="px-4 py-3 font-normal">detail (example)</th>
                </tr>
              </thead>
              <tbody>
                {REFUSALS.map((r) => (
                  <tr key={r.when} className="border-t rule align-top">
                    <td className="px-4 py-3.5 text-ink-300">{r.when}</td>
                    <td className="px-4 py-3.5 font-mono text-[12.5px] text-ink-200 whitespace-nowrap">{r.field}</td>
                    <td className="px-4 py-3.5 font-mono text-[12.5px] text-ink-400">{r.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Explore more" title="More Flights API" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/flights-api/one-way', label: 'One-way search', sub: 'Every request and response field' },
            { href: '/flights-api/round-trip', label: 'Round-trip search', sub: 'Paired-leg itineraries' },
            { href: '/flights-api/parallel-date-scan', label: 'Parallel date scans', sub: 'Full fares for many dates' },
            { href: '/pricing', label: 'Pricing', sub: 'Plans, quotas and rate limits' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="endpoint"
          title="A month of fares, one request"
          body="Google Flights' lowest fare for every date of a month, from your first call."
        />
      </Section>
    </>
  );
}
