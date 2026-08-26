import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { PricingTable } from '@/components/PricingTable';
import {
  Breadcrumbs,
  Container,
  Cta,
  FaqSection,
  Feature,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { FLIGHT_PLANS, HOTEL_PLANS, READ_ON } from '@/lib/pricing';
import { SITE, rapidApiListingUrl, rapidApiPricingUrl } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'RapidAPI — where the key, metering, and invoice live',
  description:
    'Both FlightPowers APIs are listed on RapidAPI: Google Flights Live and Booking.com Live. RapidAPI handles the account, the key, usage metering, and the invoice — free tier on each listing, no card to try.',
  alternates: { canonical: '/integrations/rapidapi' },
};

const faq: Faq[] = [
  {
    q: 'Why is billing on RapidAPI instead of on this site?',
    a: 'Because it removes a vendor. RapidAPI runs the accounts, keys, metering, and invoicing for thousands of APIs — if your company already uses it, procurement is already done, and your usage across APIs lands on one invoice. We never see your card.',
  },
  {
    q: 'Is it one key for both APIs?',
    a: 'One RapidAPI key works across the APIs you subscribe to — but flights and hotels are separate listings with separate subscriptions and quotas. Subscribe to each you need; the key in your code stays the same.',
  },
  {
    q: 'Is the free tier enough to evaluate?',
    a: 'Honestly, no. BASIC is 10 requests/month with a hard cap — enough to verify your key and see the response shape. Evaluate with the live demo and free tools on this site; they run real requests on our key.',
  },
  {
    q: 'Is there an approval step?',
    a: 'No. Every public plan on both listings has request-approval disabled — subscribing is immediate, and the free tier needs no card.',
  },
  {
    q: 'Does the key work outside RapidAPI’s own host?',
    a: 'Yes. The same key authenticates against api.flightpowers.com (as x-rapidapi-key, x-api-key, or a Bearer token) and against the hosted MCP servers. Usage from every surface meters against the same subscription.',
  },
  {
    q: 'What happens when I hit my quota?',
    a: 'On paid plans, overage billing per request at the rate shown in the tables above. On the free tier the cap is hard — request 11 is rejected, not billed.',
  },
];

export default function RapidApiIntegrationPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Integrations', item: `${SITE.url}/integrations` },
            { '@type': 'ListItem', position: 2, name: 'RapidAPI', item: `${SITE.url}/integrations/rapidapi` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/integrations', label: 'Integrations' }, { href: '/integrations/rapidapi', label: 'RapidAPI' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <p className="eyebrow">Integrations · RapidAPI</p>
          <h1 className="mt-4 max-w-3xl text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
            The marketplace where the <span className="text-signal-500">billing</span> lives
          </h1>
          <p className="lede mt-5 max-w-2xl">
            Both APIs are listed on RapidAPI. Whatever surface you connect through — REST, MCP, n8n, an agent — the key comes
            from here and the usage bills here. This page is the short version; the numbers are the live listings&apos;.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href={rapidApiPricingUrl('flights', 'integration')} external variant="primary">
              Flights pricing tab →
            </Cta>
            <Cta href={rapidApiPricingUrl('hotels', 'integration')} external variant="ghost">
              Hotels pricing tab →
            </Cta>
          </div>
          <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on both listings: 10 requests/month. No card to try.</p>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="What RapidAPI handles"
          title="Four things you never build against us"
          lede="RapidAPI sits between you and the API for exactly these — everything else is direct."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Feature title="The account">
            One RapidAPI login covers every API you use there. No FlightPowers account exists — there is nothing extra to
            create, verify, or forget.
          </Feature>
          <Feature title="The key">
            Issued the moment you subscribe, shown on the listing, bound automatically when you hit Test Endpoint. The same
            key authenticates on RapidAPI&apos;s host, on api.flightpowers.com, and on the MCP servers.
          </Feature>
          <Feature title="The metering">
            Every request counts against your plan&apos;s monthly quota and per-minute rate limit, visible in RapidAPI&apos;s
            developer dashboard — their counter, not our word.
          </Feature>
          <Feature title="The invoice">
            RapidAPI charges your card and issues the invoice. Overage on paid plans bills at the listed per-request rate;
            the free tier is a hard cap, never a surprise charge.
          </Feature>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="The two listings"
          title="One subscription per API, every endpoint included"
          lede={`Plans read from the live listings on ${READ_ON} — the listing is authoritative. Plans differ only on volume and rate limit; no endpoint is ever gated.`}
        />
        <div className="mt-10 space-y-12">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
              <h3 className="text-xl font-semibold">
                Google Flights Live API{' '}
                <a href={rapidApiListingUrl('flights')} rel="noopener" className="ml-2 font-mono text-[12px] text-ink-500 hover:text-ink-300">
                  rapidapi.com/mtnrabi/api/google-flights-live-api
                </a>
              </h3>
              <a href={rapidApiPricingUrl('flights', 'integration')} rel="noopener" className="text-sm text-signal-400 underline underline-offset-4">
                Get a key →
              </a>
            </div>
            <PricingTable api="flights" plans={FLIGHT_PLANS} medium="integration" compact />
          </div>
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
              <h3 className="text-xl font-semibold">
                Booking.com Live API{' '}
                <a href={rapidApiListingUrl('hotels')} rel="noopener" className="ml-2 font-mono text-[12px] text-ink-500 hover:text-ink-300">
                  rapidapi.com/mtnrabi/api/booking-live-api
                </a>
              </h3>
              <a href={rapidApiPricingUrl('hotels', 'integration')} rel="noopener" className="text-sm text-signal-400 underline underline-offset-4">
                Get a key →
              </a>
            </div>
            <PricingTable api="hotels" plans={HOTEL_PLANS} medium="integration" compact />
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="From click to working key"
          title="Six steps, condensed"
          lede="Two of them are RapidAPI’s walls, not ours — and none needs approval."
        />
        <ol className="mt-8 max-w-3xl space-y-2.5">
          {[
            'Open the pricing tab — the buttons on this page land there directly.',
            'Create a RapidAPI account, or log in. This is the wall, and it is theirs.',
            'Pick a plan. BASIC is free with no card; access is immediate on every public plan.',
            'Hit “Test Endpoint” on the Endpoints tab — your key is bound automatically.',
            'Copy a code snippet in your language, key already in place.',
            'Verify the key against the live API — the step RapidAPI leaves out.',
          ].map((step, i) => (
            <li key={step} className="flex gap-4 text-[15px] text-ink-300 leading-relaxed">
              <span className="font-mono text-[13px] text-signal-500 tabular-nums pt-0.5">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          The full walkthrough — with the key checker for step 6 built in — is on the{' '}
          <Link href="/pricing" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
            pricing page
          </Link>
          .
        </p>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Keep exploring" title="Use the key you just got" />
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link href="/integrations/api" className="chip">
            REST API direct
          </Link>
          <Link href="/mcp" className="chip">
            MCP servers
          </Link>
          <Link href="/integrations/n8n" className="chip">
            n8n node
          </Link>
          <Link href="/pricing" className="chip">
            Full pricing page
          </Link>
          <Link href="/integrations" className="chip">
            All integrations
          </Link>
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand medium="integration" title="Get the key once, use it everywhere" body="REST, MCP, n8n, skills — every surface on this site runs on the same RapidAPI subscription. Free tier to verify, $10 to actually build." />
      </Section>
    </>
  );
}
