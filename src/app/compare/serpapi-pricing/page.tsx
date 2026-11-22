import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PricingTable } from '@/components/PricingTable';
import { Breadcrumbs, Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { FLIGHT_PLANS } from '@/lib/pricing';
import { SITE, rapidApiPricingUrl } from '@/lib/site';
import { CompareTable, Quotable } from '../_components/CompareTable';
import { OtherAlternatives } from '../_components/OtherAlternatives';
import { RIVAL_PRICES_READ, SERPAPI_PLANS, perThousandUsd } from '../_lib/rival-prices';

const TITLE = 'SerpApi pricing, discounts and coupon codes';

export const metadata: Metadata = {
  ...withOg({
    title: TITLE,
    description:
      'What SerpApi costs today, plan by plan, whether a coupon or discount exists, when SerpApi is the better buy, and what the same Google Flights searches cost on FlightPowers.',
    alternates: { canonical: '/compare/serpapi-pricing' },
  }),
  title: { absolute: `${TITLE} (read ${RIVAL_PRICES_READ})` },
};

export const dynamic = 'force-static';

const PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
const BASIC = FLIGHT_PLANS.find((p) => p.name === 'BASIC')!;
const STARTER = SERPAPI_PLANS.find((p) => p.name === 'Starter')!;
const FREE = SERPAPI_PLANS.find((p) => p.name === 'Free')!;
const n = (x: number) => x.toLocaleString('en-US');

const faq: Faq[] = [
  {
    q: 'Is there a SerpApi coupon or promo code?',
    a: `We know of none. SerpApi’s pricing page, read on ${RIVAL_PRICES_READ}, lists no coupon field, no promo code and no annual discount; plans are month-to-month. A site that offers you a SerpApi code is most likely guessing. The real ways to pay less are the free plan (${n(FREE.searches)} searches a month) and their refund window.`,
  },
  {
    q: 'What is the cheapest SerpApi plan?',
    a: `Starter, $${STARTER.price} a month for ${n(STARTER.searches)} searches, which is ${perThousandUsd(STARTER.price, STARTER.searches)} per 1,000. Below it is the free plan with ${n(FREE.searches)} searches a month.`,
  },
  {
    q: 'Does SerpApi charge for failed searches?',
    a: 'No. Their pricing FAQ says: “Only successful searches are counted toward your monthly searches. Cached, errored, and failed searches are not.” That is a real point in their favour.',
  },
  {
    q: 'Does SerpApi give refunds?',
    a: 'Their FAQ says: “We offer a full refund within 7 days of the date you subscribed to a plan unless you’ve used more than 20% of your searches.”',
  },
  {
    q: 'Does FlightPowers have a coupon code?',
    a: `No codes here either. The free plan is the trial: ${BASIC.quota} requests a month, no card. PRO is $${PRO.priceMonthly} for ${n(PRO.quota)} searches.`,
  },
];

export default function SerpApiPricingPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: TITLE,
          url: `${SITE.url}/compare/serpapi-pricing`,
          dateModified: RIVAL_PRICES_READ,
        }}
      />
      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/compare', label: 'Compare' },
            { href: '/compare/serpapi-pricing', label: 'SerpApi pricing' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Pricing · SerpApi’s page read {RIVAL_PRICES_READ}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            SerpApi pricing, and whether a <span className="text-signal-500">coupon</span> exists
          </h1>
          <Quotable>
            SerpApi’s plans run from a free {n(FREE.searches)} searches a month to ${STARTER.price} for {n(STARTER.searches)} and
            up; we know of no public coupon or promo code, and their pricing page lists no annual discount. For Google Flights
            only, FlightPowers PRO is ${PRO.priceMonthly} for {n(PRO.quota)} searches, about a sixth of SerpApi’s price per search
            (their cheapest plan is ${STARTER.price} for {n(STARTER.searches)}).
          </Quotable>
          <p className="mt-5 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
            This page is written by FlightPowers, a competitor for one of SerpApi’s engines. Every SerpApi figure below was read
            from serpapi.com/pricing on <strong className="text-ink-200">{RIVAL_PRICES_READ}</strong>. If a number here disagrees
            with their site today, believe their site.
          </p>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead eyebrow="Their plans" title="What SerpApi costs" lede="Month-to-month, cancel anytime, per their page." />
        <div className="mt-8 max-w-4xl">
          <CompareTable
            caption={`serpapi.com/pricing · read ${RIVAL_PRICES_READ} · per 1,000 = price ÷ included searches`}
            head={['Plan', 'Price', 'Searches / month', 'Per 1,000', 'Throughput']}
            rows={[
              ...SERPAPI_PLANS.map((p) => [
                p.name,
                `$${p.price} / month`,
                n(p.searches),
                p.price === 0 ? 'free' : perThousandUsd(p.price, p.searches),
                `${n(p.perHour)} / hour`,
              ]),
              ['Enterprise', 'Contact sales', 'Custom', 'Custom', 'Custom'],
            ]}
          />
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Coupons and discounts"
          title="No code that we know of"
          lede="We looked so you do not have to click through coupon sites."
        />
        <ul className="mt-6 max-w-3xl space-y-3 text-[15px] text-ink-300 leading-relaxed list-disc pl-5">
          <li>
            Their pricing page ({RIVAL_PRICES_READ}) shows no coupon or promo field and no annual-billing discount. We are not
            aware of any public SerpApi code, and we will not print one we cannot verify.
          </li>
          <li>
            The free plan is real: {n(FREE.searches)} searches a month at {n(FREE.perHour)} an hour. For a small project that may
            be all you need.
          </li>
          <li>Only successful searches count, so errors and cached answers do not use the plan.</li>
          <li>A full refund within 7 days if you used no more than 20% of the searches.</li>
          <li>For volume past Big Data, their Enterprise plan is a conversation with their sales team.</li>
        </ul>
      </Section>

      <Section>
        <SectionHead
          eyebrow="When each is the better buy"
          title="SerpApi for many engines, FlightPowers for flights"
          lede="Price per search is only one row."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2 max-w-5xl">
          <div className="rounded-2xl border rule bg-ink-900/50 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Stay with SerpApi when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You use several of their engines (Search, Maps, Shopping, Flights): one credit pool, one bill.</li>
              <li>
                {n(FREE.searches)} free searches a month covers you; our free plan is {BASIC.quota} requests a month.
              </li>
              <li>You want their U.S. Legal Shield, or a vendor that does not count failed searches.</li>
              <li>You need the price history series their Google Flights engine returns; we return the range, not the history.</li>
            </ul>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Look at FlightPowers when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>
                Flights carry the volume: ${PRO.priceMonthly} buys {n(PRO.quota)} searches, against ${STARTER.price} for{' '}
                {n(STARTER.searches)}.
              </li>
              <li>
                You price round trips: ours is one request with both legs and one total; SerpApi’s docs describe a second
                call with a departure_token (read 2026-10-06, see the{' '}
                <Link href="/compare/serpapi" className="text-signal-400 underline underline-offset-4">
                  row-by-row page
                </Link>
                ).
              </li>
              <li>You scan many dates at once: PRO allows {PRO.ratePerMinute} requests a minute.</li>
              <li>You want hotels too: live Booking.com rates on a separate $10 plan.</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Our prices"
          title={`PRO: $${PRO.priceMonthly} for ${n(PRO.quota)} flight searches`}
          lede="Rendered from the same data as our pricing page. No codes; the free plan is the trial."
        />
        <div className="mt-8">
          <PricingTable api="flights" plans={FLIGHT_PLANS} medium="compare" compact />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Cta href={rapidApiPricingUrl('flights', 'compare', 'serpapi-pricing')} external variant="primary">
            Get a free key →
          </Cta>
          <Cta href="/compare/serpapi" variant="ghost">
            SerpApi vs FlightPowers, row by row
          </Cta>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>
      <Section>
        <OtherAlternatives current="/compare/serpapi-pricing" />
      </Section>
    </>
  );
}
