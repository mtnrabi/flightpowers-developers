import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { IntegrationGrid } from '@/components/IntegrationLogos';
import { Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { INTEGRATIONS } from '@/lib/integrations';
import { RecipeMatrix } from './_recipes';
import { LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = withOg({
  title: 'Integrations: n8n, Zapier, Make, Claude, ChatGPT, MCP & more',
  description:
    'Every surface the FlightPowers travel-data APIs ship on: hosted MCP servers for Claude, ChatGPT and Cursor, an n8n community node, Zapier and Make via the HTTP step, LangChain, RapidAPI, Apify actors, and open-source agent skills.',
  alternates: { canonical: '/integrations' },
});

const faq: Faq[] = [
  {
    q: 'Which integration should I start with?',
    a: 'If you write code, the REST API. If you use an MCP client (Claude, ChatGPT, Cursor), the hosted servers: a URL plus your key. If you automate in n8n, Zapier, or Make, start from that tile. Every door reads the same live data with the same key.',
  },
  {
    q: 'Do the integrations cost extra?',
    a: 'No. Every surface here is a different door to the same RapidAPI subscriptions: you pay for API usage on your own plan, wherever the calls come from. The exception is Apify, where the actors bill pay-per-event through Apify instead.',
  },
  {
    q: 'Where do I get the key all of these use?',
    a: 'From RapidAPI, on either listing’s pricing tab. The free tier is 10 requests/month, hard-capped: enough to verify your key. Flights and hotels are separate subscriptions; one account key covers both once you subscribe to each.',
  },
  {
    q: 'Is there a native Zapier or Make app?',
    a: 'Not listed yet; both are in review, and we don’t publish doors that don’t open. The REST API works in both today through the HTTP request step, and the Zapier and Make pages here show the exact module setup.',
  },
];

export default function IntegrationsPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'FlightPowers integrations',
          url: `${SITE.url}/integrations`,
          hasPart: INTEGRATIONS.filter((c) => !c.external).map((c) => ({
            '@type': 'WebPage',
            name: c.name,
            url: `${SITE.url}${c.href}`,
          })),
        }}
      />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-12 sm:pt-20 pb-10">
          <p className="eyebrow">Integrations</p>
          <h1 className="mt-4 max-w-3xl text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
            One API, everywhere your <span className="text-signal-500">stack</span> already lives
          </h1>
          <p className="lede mt-5 max-w-2xl">
            The same live Google Flights and Booking.com data, reachable the way you already work. Pick a door; each page has the
            connect block and what to build.
          </p>
        </Container>
      </div>

      <Section bordered={false} className="!pt-2">
        <IntegrationGrid showTags />
      </Section>

      <Section>
        <div className="rounded-3xl border rule bg-ink-900/70 p-6 sm:p-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal-500">Start here</p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold">One key opens every door</h2>
              <p className="mt-3 text-[15px] text-ink-400 leading-relaxed max-w-xl">
                Every integration authenticates with a RapidAPI key. Two listings (flights and hotels, separate plans), free tier
                on each, metering and invoicing handled by RapidAPI.
              </p>
              <Link href="/integrations/rapidapi" className="mt-4 inline-block text-sm text-signal-400 underline underline-offset-4 hover:text-signal-500">
                How billing works →
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <Cta href={rapidApiPricingUrl('flights', 'integration')} external variant="primary">
                Get a flights key →
              </Cta>
              <Cta href={rapidApiPricingUrl('hotels', 'integration')} external variant="ghost">
                Get a hotels key →
              </Cta>
              <p className="font-mono text-[12px] text-ink-500 text-center">Free tier: 10 requests/month. No card to try.</p>
            </div>
          </div>
        </div>
      </Section>

      <RecipeMatrix />

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Keep exploring" title="Related pages" />
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link href="/mcp" className="chip">
            MCP setup
          </Link>
          <Link href="/ai-agents" className="chip">
            Agent recipes
          </Link>
          <Link href="/pricing" className="chip">
            Pricing
          </Link>
          <a href={LINKS.apiDocs} rel="noopener" className="chip">
            API docs
          </a>
          <a href={LINKS.openapi} rel="noopener" className="chip">
            openapi.json
          </a>
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand medium="integration" />
      </Section>
    </>
  );
}
