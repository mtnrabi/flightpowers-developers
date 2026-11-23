import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CheapestDayTool } from '@/components/tools/CheapestDayTool';
import { Container, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import type { CheapestDatesAnswer } from '@/lib/cheapest-day';
import capture from '@/lib/fixtures/cheapest-dates-jfk-lax.json';
import { FLIGHT_PLANS } from '@/lib/pricing';
import { SITE } from '@/lib/site';

const PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;

export const metadata: Metadata = {
  ...withOg({
    title: 'Cheapest Day to Fly: a month of Google Flights fares on one calendar',
    description:
      'Free tool: pick a route, a month and a trip length and see the lowest fare Google Flights shows for every departure date, on one calendar, with the cheapest day highlighted. One live request, no signup.',
    alternates: { canonical: '/tools/cheapest-day' },
  }),
  title: { absolute: 'Cheapest Day to Fly: a month of fares on one calendar' },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Where do the prices come from?',
    a: 'From Google Flights’ own price calendar, read live when you press the button: the lowest fare Google shows for each departure date of the month, for one adult, in US dollars. It is the same data the cheapest-dates endpoint of our flights API returns, in one request.',
  },
  {
    q: 'Are these the same prices as a full search?',
    a: 'They are Google’s calendar estimates, without airline or flight details. In our checks they matched a full one-way or round-trip search to the dollar, but a full search of a date can return a different price, so open the date you pick (the “See full flights for this date” link) before you book.',
  },
  {
    q: 'Is it free?',
    a: 'Yes: no account, no email. Each run is one real request on our own API key, so runs are capped at 10 per visitor per day, and the same route, month and trip length is served from a 6-hour cache.',
  },
  {
    q: 'Why does a date show a dash?',
    a: 'Google shows no calendar fare for that date. Days of the current month that are already past are faded: they cannot be searched.',
  },
  {
    q: 'Can I get this from my own code?',
    a: `Yes. The calendar is one request to POST /v1/flights/cheapest-dates (or the same endpoint on RapidAPI). PRO is $${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')} requests a month, so ${PRO.quota.toLocaleString('en-US')} month-wide calendars. The code card under the tool is pre-filled with your search.`,
  },
  {
    q: 'What do the colours mean?',
    a: 'They compare the dates of this month with each other: green is the month’s low end, red its high end, and the cheapest date has a green outline. They say nothing about whether the month itself is cheap for the route.',
  },
];

export default function CheapestDayPage() {
  const answer = capture.data as CheapestDatesAnswer;
  const body = capture.request.body;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Cheapest Day to Fly',
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          url: `${SITE.url}/tools/cheapest-day`,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            'The lowest Google Flights fare for every departure date of a month',
            'One-way or a round trip of 3 to 14 nights',
            'Calendar heatmap with the cheapest day highlighted',
            'The exact API request, pre-filled with your search',
          ],
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-10">
        <p className="eyebrow">Free tool · one live request</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          Cheapest <span className="text-signal-500">Day to Fly</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Pick a route, a month and how long you are staying. You get the lowest fare Google Flights shows for every departure
          date, on one calendar, and the cheapest day stands out.
        </p>
      </Container>

      <Container className="pb-16">
        <CheapestDayTool
          initial={{ from: body.from_airport, to: body.to_airport, month: body.month, nights: body.nights }}
          captured={{ answer, capturedAt: capture.captured_at.slice(0, 10) }}
        />
      </Container>

      <Section>
        <SectionHead eyebrow="How it works" title="One month, one request, one calendar" />
        <ol className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            ['Pick a route and a month', 'Airport codes, a month, and one-way or a round trip of a few nights.'],
            ['One live request', 'Our server asks the cheapest-dates endpoint for the whole month at once. Your browser never sees our key.'],
            ['Read the calendar', 'Each day shows Google’s lowest fare for leaving that day. The cheapest one is outlined, with a link to its full flight list.'],
          ].map(([title, text], i) => (
            <li key={title} className="rounded-2xl border rule bg-ink-900/50 p-5">
              <p className="font-mono text-[13px] text-signal-500">{i + 1}</p>
              <p className="mt-1.5 text-[15.5px] font-semibold text-ink-100">{title}</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Related" title="Keep going" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { href: '/flights-api/cheapest-dates', label: 'Cheapest Dates API', sub: 'The endpoint behind this calendar' },
            { href: '/tools/flight-price-checker', label: 'Flight Price Checker', sub: 'One date in full, with Google’s verdict' },
            { href: '/flights', label: 'Flight prices by route', sub: 'A season of fetched fares for 100 routes' },
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
          medium="tool"
          title="A month of fares, one request, on your own key"
          body={`The cheapest-dates endpoint returns this calendar as JSON. PRO is $${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')} requests a month; the free tier on RapidAPI needs no card.`}
        />
      </Section>
    </>
  );
}
