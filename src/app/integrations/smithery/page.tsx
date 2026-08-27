import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import {
  Breadcrumbs,
  Code,
  Container,
  FaqSection,
  FieldRow,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { LINKS, SITE } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = withOg({
  title: 'Smithery: the three MCP server listings',
  description:
    'The FlightPowers MCP servers on Smithery: mrabi/google-flights, mrabi/booking, and the free ad-supported server. Qualified names, how the gateway passes your key, and the canonical self-hosted URLs.',
  alternates: { canonical: '/integrations/smithery' },
});

const faq: Faq[] = [
  {
    q: 'How does my key reach the server through Smithery?',
    a: 'Smithery’s gateway proxies the MCP connection and passes your credentials through its server-config mechanism: you set your RapidAPI key in the server’s configuration on Smithery, and the gateway forwards it with each call. Usage still meters against your own RapidAPI subscription.',
  },
  {
    q: 'Should I connect via Smithery or directly?',
    a: 'Both work. Direct (flights.flightpowers.com/mcp and hotels.flightpowers.com/mcp, key in a header) is one hop shorter and what the rest of this site documents. Smithery is convenient if your client already installs servers from its registry.',
  },
  {
    q: 'What is the freemium listing?',
    a: 'A separate, free, ad-supported server that covers both flights and hotels. Answers can carry a sponsored line. The paid servers are ad-free and bring-your-own-key. They are different products; the paid ones are what this site documents.',
  },
  {
    q: 'Are the qualified names above the real ones?',
    a: 'Yes: mrabi/google-flights, mrabi/booking, and mrabi/freemium-google-flights-and-booking-mcp, verified against the live Smithery pages on 2026-08-26. Older documents elsewhere carry stale slugs; these are canonical.',
  },
];

export default function SmitheryIntegrationPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Integrations', item: `${SITE.url}/integrations` },
            { '@type': 'ListItem', position: 2, name: 'Smithery', item: `${SITE.url}/integrations/smithery` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/integrations', label: 'Integrations' }, { href: '/integrations/smithery', label: 'Smithery' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Integrations · Smithery</p>
          <h1 className="mt-4 max-w-3xl text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
            The servers on <span className="text-signal-500">Smithery</span>
          </h1>
          <p className="lede mt-5 max-w-2xl">
            If your MCP client installs from the Smithery registry, all three FlightPowers servers are listed there. Short
            page on purpose: the names, the key mechanics, and where the canonical servers live.
          </p>
        </Container>
      </div>

      <Section>
        <SectionHead eyebrow="The listings" title="Three servers, exact qualified names" />
        <div className="mt-8 max-w-3xl">
          <FieldRow name="mrabi/google-flights" type="paid · BYO key">
            Live Google Flights search: one-way, round-trip, and Google&apos;s price band with the low | typical | high
            verdict.{' '}
            <a href={LINKS.smitheryFlights} rel="noopener" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              View on Smithery
            </a>
          </FieldRow>
          <FieldRow name="mrabi/booking" type="paid · BYO key">
            Live Booking.com rates: destination search, hotel-by-name, and per-market pricing via price_as_seen_from.{' '}
            <a href={LINKS.smitheryHotels} rel="noopener" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              View on Smithery
            </a>
          </FieldRow>
          <FieldRow name="mrabi/freemium-google-flights-and-booking-mcp" type="free · ad-supported">
            A separate server: free to use, flights and hotels together, ad-supported. Answers can carry a sponsored line.
            Kept deliberately apart from the paid, ad-free servers above.{' '}
            <a href={LINKS.smitheryFree} rel="noopener" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              View on Smithery
            </a>
          </FieldRow>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Key mechanics"
          title="Your key rides in the server config"
          lede="Smithery’s gateway proxies the connection; your RapidAPI key goes into the server’s configuration on Smithery and is forwarded per call. Usage meters on your own subscription either way."
        />
        <div className="mt-8 max-w-3xl">
          <p className="text-[15px] text-ink-300 leading-relaxed">
            Prefer to skip the gateway? The canonical self-hosted servers are unchanged: connect any MCP client to them
            directly with the key as a header:
          </p>
          <div className="mt-5">
            <Code label="canonical hosts: direct connection">{`${LINKS.mcpFlights}
${LINKS.mcpHotels}

headers: { "x-rapidapi-key": "YOUR_RAPIDAPI_KEY" }`}</Code>
          </div>
          <p className="mt-4 text-[14px] text-ink-400 leading-relaxed">
            Full direct-connection setup, tool inventory, and example prompts are on the{' '}
            <Link href="/mcp" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              MCP page
            </Link>
            .
          </p>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Keep exploring" title="Related pages" />
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link href="/mcp" className="chip">
            MCP setup (direct)
          </Link>
          <Link href="/integrations/claude" className="chip">
            Claude
          </Link>
          <Link href="/integrations/cursor" className="chip">
            Cursor
          </Link>
          <Link href="/integrations" className="chip">
            All integrations
          </Link>
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand medium="integration" />
      </Section>
    </>
  );
}
