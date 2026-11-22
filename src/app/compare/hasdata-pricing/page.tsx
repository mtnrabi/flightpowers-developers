import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PricingTable } from '@/components/PricingTable';
import { Breadcrumbs, Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { FLIGHT_PLANS } from '@/lib/pricing';
import { SITE, rapidApiPricingUrl } from '@/lib/site';
import { CompareTable, Quotable } from '../_components/CompareTable';
import { OtherAlternatives } from '../_components/OtherAlternatives';
import { HASDATA_PLANS, RIVAL_PRICES_READ, perThousandUsd } from '../_lib/rival-prices';

const TITLE = 'HasData pricing, discounts and promo codes';

export const metadata: Metadata = {
  ...withOg({
    title: TITLE,
    description:
      'What HasData costs today for Google Flights data, its one real discount (annual billing), when HasData is the better buy, and what the same searches cost on FlightPowers.',
    alternates: { canonical: '/compare/hasdata-pricing' },
  }),
  title: { absolute: `${TITLE} (read ${RIVAL_PRICES_READ})` },
};

export const dynamic = 'force-static';

const PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
const MEGA = FLIGHT_PLANS.find((p) => p.name === 'MEGA')!;
const BASIC = FLIGHT_PLANS.find((p) => p.name === 'BASIC')!;
const FREE = HASDATA_PLANS.find((p) => p.name === 'Free')!;
const STARTUP = HASDATA_PLANS.find((p) => p.name === 'Startup')!;
const HD_BASIC = HASDATA_PLANS.find((p) => p.name === 'Basic')!;
const n = (x: number) => x.toLocaleString('en-US');
const ourPerK = (p: typeof PRO) => perThousandUsd(p.priceMonthly, p.quota);

const faq: Faq[] = [
  {
    q: 'Is there a HasData coupon or promo code?',
    a: `We know of no public code. The discount HasData does publish is annual billing: their pricing page (read ${RIVAL_PRICES_READ}) says “Billed annually, 2 months free”, which takes Startup from $${STARTUP.monthly} to $${STARTUP.annualPerMonth} a month, paid as one yearly charge.`,
  },
  {
    q: 'What does HasData cost for Google Flights?',
    a: `By their table a Google Flights request works out to 15 credits. Startup has ${n(STARTUP.credits)} credits a month, which their table lists as ${n(STARTUP.flightSearches)} Google Flights requests: ${perThousandUsd(STARTUP.monthly, STARTUP.flightSearches)} per 1,000 month-to-month, ${perThousandUsd(STARTUP.annualPerMonth, STARTUP.flightSearches)} per 1,000 billed annually.`,
  },
  {
    q: 'Is HasData free to try?',
    a: `Yes. The free plan gives ${n(FREE.credits)} credits every month with no card, which their table lists as ${FREE.flightSearches} Google Flights requests. Our free plan is ${BASIC.quota} requests a month.`,
  },
  {
    q: 'Is FlightPowers cheaper than HasData?',
    a: `To start, yes: $${PRO.priceMonthly} a month against $${STARTUP.monthly}, and ${ourPerK(PRO)} per 1,000 searches against ${perThousandUsd(STARTUP.monthly, STARTUP.flightSearches)}. At volume, no: HasData Basic works out to ${perThousandUsd(HD_BASIC.monthly, HD_BASIC.flightSearches)} per 1,000 month-to-month, under our lowest public rate of ${ourPerK(MEGA)}.`,
  },
  {
    q: 'Does FlightPowers have a promo code?',
    a: `No codes. The free plan is the trial: ${BASIC.quota} requests a month, no card. PRO is $${PRO.priceMonthly} for ${n(PRO.quota)} searches.`,
  },
];

export default function HasDataPricingPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: TITLE,
          url: `${SITE.url}/compare/hasdata-pricing`,
          dateModified: RIVAL_PRICES_READ,
        }}
      />
      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/compare', label: 'Compare' },
            { href: '/compare/hasdata-pricing', label: 'HasData pricing' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Pricing · HasData’s page read {RIVAL_PRICES_READ}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            HasData pricing, and the one <span className="text-signal-500">discount</span> that is real
          </h1>
          <Quotable>
            HasData’s paid plans start at ${STARTUP.monthly} a month, or ${STARTUP.annualPerMonth} a month billed annually
            (two months free); that buys {n(STARTUP.flightSearches)} Google Flights requests. We know of no public promo code.
            FlightPowers PRO is ${PRO.priceMonthly} for {n(PRO.quota)} flight searches, a lower way in; at high volume
            HasData’s price per search is lower than ours.
          </Quotable>
          <p className="mt-5 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
            This page is written by FlightPowers, a competitor for HasData’s travel APIs. Every HasData figure below was read
            from hasdata.com/pricing on <strong className="text-ink-200">{RIVAL_PRICES_READ}</strong>. If a number here
            disagrees with their site today, believe their site.
          </p>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead
          eyebrow="Their plans"
          title="What HasData costs for Google Flights"
          lede="HasData sells credits that work across all its APIs; by their own table a Google Flights request works out to 15."
        />
        <div className="mt-8 max-w-5xl">
          <CompareTable
            caption={`hasdata.com/pricing · read ${RIVAL_PRICES_READ} · per 1,000 = price ÷ the Google Flights requests their table lists`}
            head={['Plan', 'Month-to-month', 'Billed annually', 'Credits / month', 'Google Flights requests', 'Per 1,000 (monthly / annual)']}
            rows={HASDATA_PLANS.map((p) => [
              p.name,
              `$${p.monthly}`,
              `$${p.annualPerMonth} / month`,
              n(p.credits),
              n(p.flightSearches),
              p.annualPerMonth === 0
                ? 'free'
                : `${perThousandUsd(p.monthly, p.flightSearches)} / ${perThousandUsd(p.annualPerMonth, p.flightSearches)}`,
            ])}
          />
        </div>
        <p className="mt-4 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Their Booking.com, Airbnb and Google Hotels APIs are each listed at {n(20000)} requests a month on Startup.
          Annual plans are charged once for the year, at the price of ten months.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="Discounts" title="Annual billing is the discount" lede="No coupon needed, and none that we know of." />
        <ul className="mt-6 max-w-3xl space-y-3 text-[15px] text-ink-300 leading-relaxed list-disc pl-5">
          <li>
            “Billed annually, 2 months free”: Startup is charged once at $590 for twelve months, which is the $
            {STARTUP.annualPerMonth} a month their page shows.
          </li>
          <li>
            The free plan renews every month: {n(FREE.credits)} credits, no card, every tool. That is {FREE.flightSearches}{' '}
            Google Flights requests.
          </li>
          <li>We are not aware of a public HasData promo code, and we will not print one we cannot verify.</li>
        </ul>
      </Section>

      <Section>
        <SectionHead eyebrow="When each is the better buy" title="It depends on your volume" />
        <div className="mt-8 grid gap-6 md:grid-cols-2 max-w-5xl">
          <div className="rounded-2xl border rule bg-ink-900/50 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">HasData is the better buy when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>
                You run tens of thousands of flight searches a month: Basic is {n(HD_BASIC.flightSearches)} requests for $
                {HD_BASIC.monthly}, {perThousandUsd(HD_BASIC.monthly, HD_BASIC.flightSearches)} per 1,000. Our lowest public rate
                is {ourPerK(MEGA)}.
              </li>
              <li>You also scrape Google Search, Maps, Amazon or Zillow: the same credits pay for all of it.</li>
              <li>You are happy to pay a year up front for two months free.</li>
            </ul>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Look at FlightPowers when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>
                You want a small way in: ${PRO.priceMonthly} a month for {n(PRO.quota)} searches ({ourPerK(PRO)} per 1,000),
                against ${STARTUP.monthly} month-to-month.
              </li>
              <li>
                Round trips are a real share of your searches: ours is one request with both legs and one total. HasData’s
                FAQ described the return leg as a second request when we read it on 2026-10-06 (see{' '}
                <Link href="/compare/hasdata" className="text-signal-400 underline underline-offset-4">
                  the row-by-row page
                </Link>
                ).
              </li>
              <li>You scan many dates at once: PRO allows {PRO.ratePerMinute} requests a minute.</li>
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
          <Cta href={rapidApiPricingUrl('flights', 'compare', 'hasdata-pricing')} external variant="primary">
            Get a free key →
          </Cta>
          <Cta href="/compare/hasdata" variant="ghost">
            HasData vs FlightPowers, row by row
          </Cta>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>
      <Section>
        <OtherAlternatives current="/compare/hasdata-pricing" />
      </Section>
    </>
  );
}
