import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import { CtaBand } from '@/components/bands';
import { Breadcrumbs, Code, Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = withOg({
  title: 'Make: live flight & hotel data in any scenario',
  description:
    'Run FlightPowers searches from Make today with the HTTP module: one POST to api.flightpowers.com, your RapidAPI key in a header, JSON parsed for the next module. A native Make app is in review.',
  alternates: { canonical: '/integrations/make' },
});

const faq: Faq[] = [
  {
    q: 'Is there a native Make app?',
    a: 'In review, not listed yet, and we don’t publish doors that don’t open. Everything on this page works today with the built-in HTTP module. When the app lists, this page will switch to it.',
  },
  {
    q: 'Which key goes in the header?',
    a: 'Your RapidAPI key, sent as x-api-key (x-rapidapi-key and Authorization: Bearer also work). Get it from either listing’s pricing tab; the free tier needs no card.',
  },
  {
    q: 'How do I use the response in later modules?',
    a: 'Set "Parse response" to Yes on the HTTP module. Make then exposes the JSON fields (price, airline, buy_link, the verdict) to map into filters, routers, and any later module.',
  },
  {
    q: 'What does a daily check cost in requests?',
    a: 'One request per run: a daily scenario is about 30 requests a month, well inside the $10 Pro plan’s 2,500. Make’s own operations pricing is separate.',
  },
];

export default function MakeIntegrationPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Integrations', item: `${SITE.url}/integrations` },
            { '@type': 'ListItem', position: 2, name: 'Make', item: `${SITE.url}/integrations/make` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/integrations', label: 'Integrations' }, { href: '/integrations/make', label: 'Make' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
            <div>
              <p className="eyebrow">Integrations · Make</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
                Live fares in a <span className="text-signal-500">Make</span> scenario
              </h1>
              <p className="lede mt-5">
                One HTTP module turns a scenario into a fare-watch or rate-parity monitor: live prices, Google&apos;s verdict,
                routed anywhere Make connects.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'integration')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/integrations/api" variant="ghost">
                  The REST API →
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Works today via the HTTP module. A native app is in review.</p>
            </div>
            <Code label="http · make a request">{`URL             https://api.flightpowers.com/v1/flights/oneway
Method          POST
Body type       Raw
Content type    JSON (application/json)

Request content {"from_airport": "JFK",
                 "to_airport": "CUN",
                 "departure_date": "2027-01-01"}

Headers         x-api-key: YOUR_RAPIDAPI_KEY
Parse response  Yes`}</Code>
          </div>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="Setup"
          title="Three modules to a daily fare-watch"
          lede="Schedule, search, filter. Google's band is the price history, so the alert is one condition."
        />
        <ol className="mt-10 max-w-3xl space-y-4">
          {[
            ['Trigger: a schedule', 'Run the scenario every morning, or as often as your request budget likes.'],
            ['HTTP → Make a request', 'Paste the request on this page and set Parse response to Yes. The JSON fields become mappable.'],
            ['Filter, then route', 'Continue only when price_range_in_relation_to_other_periods equals "low", then send price and buy_link to Slack, email, or a sheet.'],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4 rounded-2xl border rule bg-ink-900/50 p-5">
              <span className="font-mono text-[15px] text-signal-500 tabular-nums">{i + 1}</span>
              <div>
                <p className="text-[15.5px] font-semibold text-ink-100">{title}</p>
                <p className="mt-1 text-[14px] text-ink-400 leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          The same three modules run a hotel rate-watch: only the HTTP module changes. The{' '}
          <code className="font-mono text-[13px] text-signal-400">destination</code> field is required and takes free text.
        </p>
        <div className="mt-4 max-w-3xl">
          <Code label="http · the hotels request">{`URL             https://api.flightpowers.com/v1/hotels/search
Method          POST
Body type       Raw
Content type    JSON (application/json)

Request content {"destination": "Lisbon",
                 "checkin_date": "2026-10-09",
                 "checkout_date": "2026-10-12"}

Headers         x-api-key: YOUR_RAPIDAPI_KEY
Parse response  Yes`}</Code>
        </div>
        <p className="mt-4 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          For a single property, POST /v1/hotels/by-name instead, with{' '}
          <code className="font-mono text-[13px] text-signal-400">proxy_country</code> to watch its rate from another market.
        </p>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand medium="integration" title="Put a verdict in your scenarios" />
      </Section>
    </>
  );
}
