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
import { AgentRecipes } from '../_recipes';

export const dynamic = 'force-static';

export const metadata: Metadata = withOg({
  title: 'Smithery: the three MCP server listings',
  description:
    'FlightPowers MCP servers on Smithery (mrabi/google-flights, mrabi/booking). Smithery’s hosted connection ends 31 Oct 2026: connect at our own /mcp URLs.',
  alternates: { canonical: '/integrations/smithery' },
});

const faq: Faq[] = [
  {
    q: 'Can I still connect through Smithery?',
    a: 'Not from 31 October 2026. Smithery’s own notice says its hosted connections (server URLs on run.tools and server.smithery.ai) stop working that day and Smithery stays a public directory. Add our URLs to your client instead: https://flights.flightpowers.com/mcp and https://hotels.flightpowers.com/mcp.',
  },
  {
    q: 'How does my key reach the server when I connect directly?',
    a: 'Add the URL and sign in with Google. When you want more than the free searches, paste your RapidAPI key once on the /connect page that opens (flights.flightpowers.com/connect). A script with no browser sends the key on the same URL in an x-rapidapi-key header. Usage meters against your own RapidAPI subscription.',
  },
  {
    q: 'What is the freemium listing?',
    a: 'A separate, free, ad-supported server that covers both flights and hotels. You sign in with Google and use it with no RapidAPI key; answers carry a sponsored card. The paid servers are ad-free and bring-your-own-key. They are different products; the paid ones are what this site documents.',
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
            As of 27 October 2026, all three FlightPowers servers are listed in the Smithery directory. Smithery&apos;s hosted connection ends on
            31 October 2026, so connect at our own URLs: the names, the key mechanics, and where the servers live.
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
            A separate server: free to use, flights and hotels together, ad-supported. Sign in with Google, no RapidAPI key,
            and every result carries a sponsored card. Kept deliberately apart from the paid, ad-free servers above.{' '}
            <a href={LINKS.smitheryFree} rel="noopener" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              View on Smithery
            </a>
          </FieldRow>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Key mechanics"
          title="Connect directly, one URL per server"
          lede="Smithery says it stays a directory, but its hosted connection (run.tools and server.smithery.ai URLs) ends on 31 October 2026, per Smithery’s own notice. Connect to our servers directly; usage meters on your own RapidAPI subscription."
        />
        <div className="mt-8 max-w-3xl">
          <p className="text-[15px] text-ink-300 leading-relaxed">
            Add the URL to your client and sign in with Google. When you want more than the free searches, paste your
            RapidAPI key once on the /connect page that opens. A script with no browser sends the key on that same URL
            instead:
          </p>
          <div className="mt-5">
            <Code label="canonical hosts: direct connection">{`${LINKS.mcpFlights}
${LINKS.mcpHotels}

no sign-in button? headers: { "x-rapidapi-key": "YOUR_RAPIDAPI_KEY" }`}</Code>
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

      <AgentRecipes slug="smithery" />

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
