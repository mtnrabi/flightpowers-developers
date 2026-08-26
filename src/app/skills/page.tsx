import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import {
  CheckBullets,
  Code,
  Container,
  Cta,
  FaqSection,
  Feature,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { COUNTS, LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: `Agent skills: ${COUNTS.skills} open-source travel skills for Claude Code & OpenClaw`,
  description:
    'Eight MIT-licensed agent skills for live flight and hotel pricing: cheapest dates, fare watch, trip planning, hotel search, rate-parity monitoring. One install line, works over MCP or plain REST with your own RapidAPI key.',
  alternates: { canonical: '/skills' },
});

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'What exactly is an agent skill here?',
    a: 'A packaged workflow the agent follows: which tool or endpoint to call, which fields to branch on, how to present the answer. The skills talk to the same live FlightPowers API as everything else on this site, over MCP or plain REST, with your key.',
  },
  {
    q: 'What does the MIT license let me do?',
    a: 'Use, copy, modify, and ship the skills (commercially included) with attribution per the license text in the repo. The skills are open source; the API behind them is metered on your own RapidAPI plan.',
  },
  {
    q: 'Do I need an API key to use the skills?',
    a: 'Yes: the skills bring the workflow and you bring a RapidAPI key. The free BASIC tier (10 requests/month, hard cap, no card) verifies the setup works; the paid tiers start at $10/month for real daily use.',
  },
  {
    q: 'Which agents can run them?',
    a: 'Claude Code, via npx skills add mtnrabi/travel-agent-skills, and OpenClaw, via the ClawHub listings for the flights and hotels skills. The repo is plain files, so other skill-compatible runtimes can load it from GitHub.',
  },
  {
    q: 'How is this different from connecting the MCP server?',
    a: 'The MCP server provides the tools; a skill packages the judgment around them: when to scan a range, what a verdict flip means, how to compare markets. They are complementary, and by the repo’s own description the skills work over MCP or plain REST.',
  },
  {
    q: 'Can I see what a skill does before installing it?',
    a: 'Yes: the repository is public on GitHub. Every skill is readable source, so you can see exactly what the agent will follow before you install anything.',
  },
];

export default function SkillsPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareSourceCode',
          name: 'travel-agent-skills',
          codeRepository: LINKS.skills,
          license: 'https://opensource.org/license/mit',
          url: `${SITE.url}/skills`,
          description: 'Agent skills for live flight and hotel pricing. Works over MCP or plain REST.',
        }}
      />

      {/* ============================== HERO ============================== */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-14 sm:pt-20 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Open source · MIT</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                {COUNTS.skills} travel skills your agent can <span className="text-signal-500">read</span>
              </h1>
              <p className="lede mt-5">
                Agent skills for live flight and hotel pricing: one install line, readable source, MIT license.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>
                      {COUNTS.skills} MIT-licensed skills in one public repo: cheapest dates, fare watch, trip planning, hotel
                      search, rate-parity monitoring
                    </>,
                    <>Works over MCP or plain REST: the same live API either way, with your own key</>,
                    <>Runs in Claude Code and OpenClaw today</>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={LINKS.skills} external variant="primary">
                  View the repo on GitHub →
                </Cta>
                <Cta href={rapidApiPricingUrl('flights', 'mcp')} external variant="ghost">
                  Get a key on RapidAPI
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier: 10 requests/month. No card to try.</p>
            </div>

            <div>
              <Code label="terminal · claude code">{`npx skills add mtnrabi/travel-agent-skills

# then just ask:
# "watch JFK→LHR for my December dates and
#  tell me when Google calls the fare low"`}</Code>
              <p className="mt-3 text-[15px] text-ink-300">One line. The skills land in your agent&apos;s skill directory, readable before they run.</p>
            </div>
          </div>
        </Container>
      </div>

      {/* ============================== WHAT THEY COVER ============================== */}
      <Section>
        <SectionHead
          eyebrow="Coverage"
          title="What the skills cover"
          lede="Five jobs, drawn from the repo's own description. Each one packages the workflow and the judgment fields, so the agent knows what to call and what the answer means."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Feature title="Cheapest dates">
            Scan a flexible window for a route and come back with the cheapest day and what picking it saves, built on the date-range
            search and per-day fares.
          </Feature>
          <Feature title="Fare watch">
            Track a route over time and surface the moment worth acting on: Google&apos;s low | typical | high verdict flipping to
            &ldquo;low&rdquo;, with the buy_link ready to hand over.
          </Feature>
          <Feature title="Trip planning">
            Turn &ldquo;I want a week in Lisbon this fall&rdquo; into paired round-trip options and a hotel shortlist, every leg and
            property with a working booking link.
          </Feature>
          <Feature title="Hotel search">
            Live Booking.com availability with the filters the real site has (review-score floors, free cancellation, budget per
            night), returned as a shortlist the user can act on.
          </Feature>
          <Feature title="Rate-parity monitoring">
            Price the same room from different markets via proxy_country and report the spread: the revenue-manager job that
            general-purpose scrapers can&apos;t do from one API.
          </Feature>
          <Feature title="…and the source is the spec">
            The repo holds {COUNTS.skills} skills across these themes. Rather than trust a marketing list, read them: every skill
            is plain, auditable text on{' '}
            <a href={LINKS.skills} rel="noopener" className="text-signal-400 underline underline-offset-4">
              GitHub
            </a>
            .
          </Feature>
        </div>
      </Section>

      {/* ============================== WHERE THEY RUN ============================== */}
      <Section>
        <SectionHead
          eyebrow="Runtimes"
          title="Works where your agent lives"
          lede="Two supported homes today, one repo behind both."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Claude Code</h3>
            <div className="mt-4">
              <Code label="terminal">{`npx skills add mtnrabi/travel-agent-skills`}</Code>
            </div>
            <p className="mt-3 text-[14.5px] text-ink-400 leading-relaxed">
              The skills load alongside your project and trigger when a travel question comes up. Set your RapidAPI key once and
              they talk to the same live API, over MCP or plain REST.
            </p>
            <Link href="/integrations/claude-code" className="mt-3 inline-block text-sm text-signal-400 underline underline-offset-4 hover:text-signal-500">
              Claude Code setup →
            </Link>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">OpenClaw</h3>
            <div className="mt-4">
              <Code label="terminal">{`clawhub install mtnrabi/google-flights-realtime-api`}</Code>
            </div>
            <p className="mt-3 text-[14.5px] text-ink-400 leading-relaxed">
              Both listings are on ClawHub:{' '}
              <a href={LINKS.clawhubFlights} rel="noopener" className="text-signal-400 underline underline-offset-4">
                google-flights-realtime-api
              </a>{' '}
              and{' '}
              <a href={LINKS.clawhubHotels} rel="noopener" className="text-signal-400 underline underline-offset-4">
                booking-hotel-search
              </a>
              . Same API, same key, wrapped for OpenClaw agents.
            </p>
            <Link href="/integrations/openclaw" className="mt-3 inline-block text-sm text-signal-400 underline underline-offset-4 hover:text-signal-500">
              OpenClaw setup →
            </Link>
          </div>
        </div>
      </Section>

      {/* ============================== BYO KEY ============================== */}
      <Section>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <SectionHead
            eyebrow="The one dependency"
            title="The skills bring the workflow; you bring the key"
            lede="Nothing in the repo phones home. Every request the skills make runs on your own RapidAPI key, against your own plan. The free tier verifies the setup, the $10 Pro tier covers real daily use."
          />
          <div className="flex flex-wrap items-center gap-3">
            <Cta href={rapidApiPricingUrl('flights', 'mcp')} external variant="primary">
              Get a key on RapidAPI →
            </Cta>
            <Cta href="/pricing" variant="ghost">
              See pricing
            </Cta>
          </div>
        </div>
      </Section>

      {/* ============================== STAR ASK ============================== */}
      <Section>
        <div className="rounded-3xl border rule bg-ink-900/50 p-6 sm:p-10 max-w-3xl">
          <h2 className="text-2xl font-semibold">An honest ask</h2>
          <p className="mt-3 text-[15px] text-ink-400 leading-relaxed">
            If the skills save you an afternoon, a GitHub star helps other people find them. That&apos;s the whole pitch: no
            newsletter, no signup.
          </p>
          <div className="mt-5">
            <Cta href={LINKS.skills} external variant="ghost">
              Star travel-agent-skills →
            </Cta>
          </div>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      {/* ============================== RELATED ============================== */}
      <Section>
        <SectionHead eyebrow="Keep going" title="Where to next" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/mcp', label: 'The MCP servers', sub: 'Prefer tools over skills? One URL' },
            { href: '/ai-agents', label: 'For AI agents', sub: 'Six things to build this week' },
            { href: '/integrations', label: 'All integrations', sub: 'Every surface we ship on' },
            { href: '/flights-api/price-insights', label: 'Price Insights API', sub: 'The verdict the fare-watch runs on' },
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
          medium="mcp"
          title="Install the skills, add a key, ask a travel question"
          body="Eight open-source workflows on live Google Flights and Booking.com data, with the price band and verdict your agent needs to give a real answer."
        />
      </Section>
    </>
  );
}
