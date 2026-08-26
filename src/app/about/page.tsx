import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CheckBullets, Container, Cta, JsonLd, Section, SectionHead } from '@/components/ui';
import { COUNTS, LINKS, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About: the developer who runs FlightPowers',
  description:
    'FlightPowers is built and operated by one software engineer, Matan Rabi. The consumer flight-search product came first; the data infrastructure underneath it became the real product. Here is the honest version of that story, and the rules this site runs by.',
  alternates: { canonical: '/about' },
};

export const dynamic = 'force-static';

/** Everything that exists today, from the same LINKS config the rest of the site renders. */
const surfaces: { label: string; sub: string; href: string; external?: boolean }[] = [
  { label: 'Google Flights Live API', sub: 'RapidAPI listing: one-way, round-trip, price insights', href: LINKS.rapidapiFlights, external: true },
  { label: 'Booking Live API', sub: 'RapidAPI listing: hotel search, by-name, per-country pricing', href: LINKS.rapidapiHotels, external: true },
  { label: 'Apify actors', sub: 'The same data, pay-per-event: flights and hotels', href: LINKS.apifyFlights, external: true },
  { label: `${COUNTS.mcpServers} hosted MCP servers`, sub: 'A URL your agent connects to, no install', href: '/mcp' },
  { label: 'n8n community node', sub: 'n8n-nodes-flightpowers on npm', href: LINKS.npmNode, external: true },
  { label: `travel-agent-skills · ${COUNTS.skills} skills`, sub: 'Open source, MIT, on GitHub', href: LINKS.skills, external: true },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About FlightPowers',
          url: `${SITE.url}/about`,
          mainEntity: {
            '@type': 'Person',
            name: 'Matan Rabi',
            url: `${SITE.url}/about`,
            sameAs: [LINKS.github],
          },
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-4">
        <p className="eyebrow">About</p>
        <h1 className="mt-4 text-hero font-semibold max-w-3xl">
          One developer, <span className="text-signal-500">live travel data</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          I&apos;m Matan Rabi, a software engineer. I build and run everything you see here: the APIs, the servers behind them,
          and this site. There is no team page because there is no team.
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <div className="prose-fp max-w-3xl">
          <h2>The short, honest story</h2>
          <p>
            FlightPowers started as a consumer product: a flight-search site for travellers, not a developer tool. To make it
            work I had to build the unglamorous layer underneath: the part that reads live Google Flights pages, survives
            markup changes and blocked requests, and can tell &ldquo;there are no flights&rdquo; apart from &ldquo;the page
            wouldn&apos;t load.&rdquo;
          </p>
          <p>
            Running a consumer product on top of that layer taught me what flight-data infrastructure actually costs: not the
            happy path, but the retries, the consent walls, the empty responses that lie to you. Solving those problems well
            turned out to be worth more than the search site sitting on top of them.
          </p>
          <p>
            So the data layer became the product. The APIs you can buy today are that same infrastructure, sold directly,
            with the failure handling exposed as response headers instead of hidden behind a UI, and Google&apos;s own price
            context attached to every fare.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="How I run it"
          title="The rules this site holds itself to"
          lede="You are reading marketing written by the person who also answers the bug reports. These are the constraints I keep on myself."
        />
        <div className="mt-8 max-w-3xl">
          <CheckBullets
            items={[
              <>
                <strong className="text-ink-100">No invented metrics, anywhere on this site.</strong> No uptime percentages,
                no latency claims, no customer counts. Every number you see traces to the live listings or to the code.
              </>,
              <>
                <strong className="text-ink-100">Canned demos are labelled.</strong> Anything pre-recorded carries a
                &ldquo;captured run&rdquo; badge with the date it was captured. If it isn&apos;t labelled, it ran live.
              </>,
              <>
                <strong className="text-ink-100">Failure modes are documented, not hidden.</strong> The API tells you when a
                search degraded instead of pretending an empty list is an answer:{' '}
                <Link href="/flights-api/search-status" className="text-signal-400 underline underline-offset-4">
                  the whole mechanism is public
                </Link>
                .
              </>,
              <>
                <strong className="text-ink-100">I answer.</strong> Both listings end with the same sign-off:{' '}
                <em>&ldquo;Message me. I keep improving this API and I answer.&rdquo;</em> That is not support-page boilerplate:
                the messages come to me and I reply to them personally.
              </>,
            ]}
          />
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="What exists today"
          title="Everything the APIs power right now"
          lede="One data layer, published on the surfaces developers and agents already use. All first-party, all maintained by me."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {surfaces.map((s) =>
            s.external ? (
              <a key={s.label} href={s.href} rel="noopener" className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
                <p className="text-[15px] font-semibold text-ink-100">{s.label}</p>
                <p className="mt-1 text-[13px] text-ink-400">{s.sub}</p>
              </a>
            ) : (
              <Link key={s.label} href={s.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
                <p className="text-[15px] font-semibold text-ink-100">{s.label}</p>
                <p className="mt-1 text-[13px] text-ink-400">{s.sub}</p>
              </Link>
            )
          )}
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Reach me"
          title="Want to talk?"
          lede="Feature requests, custom volume, a data problem, or just a question about whether the API fits your build: the contact page lists the channels I actually watch."
        />
        <div className="mt-8">
          <Cta href="/contact" variant="ghost">
            How to reach me →
          </Cta>
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="footer"
          title="See what the API returns before you decide"
          body="The demos and free tools on this site run real searches, and every canned example is labelled with its capture date. Judge the data, not the pitch."
        />
      </Section>
    </>
  );
}
