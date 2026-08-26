import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { COUNTS, LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Integrations — RapidAPI, MCP, n8n, Apify, agents & more',
  description:
    'Every surface the FlightPowers travel-data APIs ship on: RapidAPI listings, hosted MCP servers, Claude, ChatGPT, Cursor, Claude Code, OpenClaw, n8n, Apify actors, open-source skills, and plain REST.',
  alternates: { canonical: '/integrations' },
};

/**
 * One local dataset renders the hub. Only surfaces that are live today —
 * Zapier and Make are deliberately a single in-review line, not cards.
 */
type SurfaceCard = {
  title: string;
  href: string;
  tag: string;
  blurb: string;
  external?: boolean;
};

const CARDS: SurfaceCard[] = [
  {
    title: 'MCP servers',
    href: '/mcp',
    tag: `${COUNTS.mcpServers} hosted servers`,
    blurb: 'Hosted at flights. and hotels.flightpowers.com — add a URL and your key, no install. The config block is above the fold.',
  },
  {
    title: 'Claude',
    href: '/integrations/claude',
    tag: 'MCP connector',
    blurb: 'One custom-connector URL and Claude quotes live fares with Google’s verdict mid-conversation.',
  },
  {
    title: 'ChatGPT',
    href: '/integrations/chatgpt',
    tag: 'MCP connector',
    blurb: 'Developer-mode connector on the same servers — the key rides in settings, never in the chat.',
  },
  {
    title: 'Cursor',
    href: '/integrations/cursor',
    tag: '.cursor/mcp.json',
    blurb: 'The agent that writes your travel feature can also run it — live responses instead of guessed schemas.',
  },
  {
    title: 'Claude Code',
    href: '/integrations/claude-code',
    tag: `${COUNTS.skills} open-source skills`,
    blurb: 'npx skills add mtnrabi/travel-agent-skills — cheapest dates, fare watch, rate-parity monitoring and more, MIT-licensed.',
  },
  {
    title: 'OpenClaw',
    href: '/integrations/openclaw',
    tag: 'ClawHub skills',
    blurb: 'Two ClawHub listings — live Google Flights deals and Booking.com availability — installed with one line each.',
  },
  {
    title: 'Smithery',
    href: '/integrations/smithery',
    tag: 'MCP registry',
    blurb: 'The three server listings on Smithery, and how its gateway passes your key through server config.',
  },
  {
    title: 'n8n',
    href: '/integrations/n8n',
    tag: 'n8n-nodes-flightpowers',
    blurb: 'A community node installed by name from Settings — fare-watch crons and rate-parity checks without writing HTTP requests.',
  },
  {
    title: 'Apify',
    href: '/integrations/apify',
    tag: 'pay-per-event actors',
    blurb: 'Both APIs as actors with no monthly fee — the fit for occasional batch jobs with zero baseline volume.',
  },
  {
    title: 'REST API',
    href: '/integrations/api',
    tag: `${COUNTS.restEndpoints} endpoints + /v1/verify`,
    blurb: 'api.flightpowers.com direct: one POST, flat JSON, OpenAPI spec, and the same RapidAPI key you already have.',
  },
  {
    title: 'Skills (open source)',
    href: '/skills',
    tag: 'GitHub · MIT',
    blurb: `${COUNTS.skills} agent skills for flight and hotel pricing in a public repo — read them, fork them, run them.`,
  },
];

const faq: Faq[] = [
  {
    q: 'Which integration should I start with?',
    a: 'If you write code, the REST API — one POST returns flat JSON. If you use an MCP client (Claude, ChatGPT, Cursor), the hosted servers are a URL plus your key, nothing to install. If you automate in n8n, the community node. All of them read the same live data with the same key.',
  },
  {
    q: 'Do the integrations cost extra?',
    a: 'No. Every surface here is a different door to the same two RapidAPI subscriptions — you pay for API usage on your own plan, wherever the calls come from. The one exception is Apify, where the actors bill pay-per-event through Apify instead.',
  },
  {
    q: 'Where do I get the key all of these use?',
    a: 'From RapidAPI, on either listing’s pricing tab. The free tier is 10 requests/month with a hard cap — enough to verify your key works — and one key covers both APIs once you subscribe to each.',
  },
  {
    q: 'Is there a Zapier or Make integration?',
    a: 'In review, and we don’t publish doors that don’t open yet. The REST API already works in both today through a webhook / HTTP-request step — the guides show how.',
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
          hasPart: [
            { '@type': 'WebPage', name: 'RapidAPI', url: `${SITE.url}/integrations/rapidapi` },
            ...CARDS.filter((c) => !c.external).map((c) => ({
              '@type': 'WebPage',
              name: c.title,
              url: `${SITE.url}${c.href}`,
            })),
          ],
        }}
      />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-14 sm:pt-20 pb-14">
          <p className="eyebrow">Integrations</p>
          <h1 className="mt-4 max-w-3xl text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
            One API, everywhere your <span className="text-signal-500">stack</span> already lives
          </h1>
          <p className="lede mt-5 max-w-2xl">
            The same live Google Flights and Booking.com data, reachable the way you already work: {COUNTS.restEndpoints} REST
            endpoints, {COUNTS.mcpServers} hosted MCP servers, {COUNTS.skills} open-source skills, a community n8n node, and
            pay-per-event Apify actors. One RapidAPI key, billed to you, everywhere.
          </p>
        </Container>
      </div>

      <Section bordered={false} className="!pt-2">
        <div className="rounded-3xl border rule bg-ink-900/70 p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal-500">Start here</p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold">RapidAPI — where the key and the bill live</h2>
              <p className="mt-3 text-[15px] text-ink-400 leading-relaxed max-w-xl">
                Every integration on this page authenticates with a RapidAPI key. Two listings — Google Flights Live and
                Booking.com Live — with a free tier on each, account, metering, and invoicing all handled by RapidAPI.
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

      <Section>
        <SectionHead
          eyebrow="Every live surface"
          title="Pick your door"
          lede="Each card is a full setup page: the connect block, what you can build, and honest notes on cost."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border rule bg-ink-900/50 p-6 hover:border-ink-500 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[16px] font-semibold text-ink-100">{card.title}</p>
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-500 whitespace-nowrap">{card.tag}</span>
              </div>
              <p className="mt-2 text-[14px] text-ink-400 leading-relaxed">{card.blurb}</p>
            </Link>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-[14px] text-ink-400 leading-relaxed border rule rounded-2xl bg-ink-900/40 px-5 py-4">
          Zapier and Make integrations are in review — the REST API works in both today via a webhook / HTTP-request step. The{' '}
          <Link href="/guides" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
            guides
          </Link>{' '}
          show the exact setup.
        </p>
      </Section>

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
