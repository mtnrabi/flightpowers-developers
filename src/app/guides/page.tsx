import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { Breadcrumbs, Container, JsonLd, Section, SectionHead } from '@/components/ui';
import { SITE } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Guides: working code for flight & hotel data',
  description:
    'How-to guides for live flight and hotel pricing: getting real-time Google Flights data, getting API keys, handling empty search results correctly, decoding Google Flights URLs, monitoring hotel rate parity, fare watches in n8n, and an honest comparison of the 2026 flight-API field.',
  alternates: { canonical: '/guides' },
});

export const dynamic = 'force-static';

const GUIDES = [
  {
    href: '/guides/ai-travel-agent',
    title: 'Create your 24/7 AI travel agent',
    sub: 'Connect live flight and hotel data to Claude or ChatGPT in about 15 minutes, then schedule a daily scan of your routes that only pings you when Google\'s own verdict says the fare is low. Real captured runs, honest cost math.',
    tag: 'flagship',
  },
  {
    href: '/guides/google-flights-api-key',
    title: 'How to get a Google Flights API Key in 2026',
    sub: 'Step-by-step guide to getting a Google Flights API key through RapidAPI. Since Google shut down QPX Express in 2018, this is the path to live flight data as JSON. Takes under 2 minutes, includes a free tier.',
    tag: 'getting started',
  },
  {
    href: '/guides/booking-com-api-key',
    title: 'How to get a Booking.com API Key in 2026',
    sub: 'Step-by-step guide to getting a Booking.com API key through RapidAPI. The official Partner API requires an OTA business; this path is instant access with proxy_country geo-pricing included.',
    tag: 'getting started',
  },
  {
    href: '/guides/real-time-google-flights-data',
    title: 'How to get real-time Google Flights data',
    sub: 'The full walkthrough: endpoints, paste-and-run code, the price-insight fields, paired round-trips, and scanning a whole month of dates in one parallel burst.',
    tag: 'start here',
  },
  {
    href: '/guides/what-is-a-google-flights-api',
    title: 'What is a Google Flights API?',
    sub: 'Category explainer: what these APIs do (return shoppable live fares with Google\'s verdict), why the niche exists (Amadeus Self-Service gone, Kiwi Tequila closed), and what they cannot do (issue tickets).',
    tag: 'explainer',
  },
  {
    href: '/guides/google-flights-api',
    title: 'Is there a Google Flights API? What actually exists in 2026',
    sub: 'No, and there has not been one since QPX Express closed in April 2018. The three real options today: extraction APIs, GDS/booking APIs, and self-hosted scrapers, with the trade-offs stated plainly.',
    tag: 'explainer',
  },
  {
    href: '/guides/amadeus-self-service-alternatives',
    title: 'Amadeus Self-Service Alternatives',
    sub: 'Amadeus for Developers Self-Service is deprecated. For shopping: FlightPowers returns live Google Flights pricing with verdict. For booking: Duffel or Amadeus Enterprise. Honest comparison with migration path.',
    tag: 'migration guide',
  },
  {
    href: '/guides/handle-empty-flight-search-results',
    title: 'Handling empty flight search results',
    sub: 'Why 200 [] is the most dangerous response a search API can return, the failure taxonomy behind it, and a vendor-neutral checklist for evaluating any search API\'s empty-result semantics.',
    tag: 'engineering essay',
  },
  {
    href: '/guides/google-flights-url-parameters',
    title: 'Google Flights URL parameters, decoded',
    sub: 'What is inside a Google Flights URL: the tfs= base64url protobuf, the q= natural-language form, curr=. How to decode tfs at the wire level, and why you should never encode it yourself.',
    tag: 'deep dive',
  },
  {
    href: '/guides/monitor-hotel-rate-parity',
    title: 'How to monitor hotel rate parity',
    sub: 'The proxy_country mechanism (the same room priced from the US, Germany and Israel in three requests), with a real captured spread, a scheduling pattern, and honest notes on how often parity holds.',
    tag: 'hotels',
  },
  {
    href: '/guides/flight-api-in-n8n',
    title: 'Using a flight API in n8n',
    sub: 'A four-node fare watch that fires when Google\'s verdict says "low", with the community node or a plain HTTP Request node, exact POST body included.',
    tag: 'automation',
  },
  {
    href: '/guides/google-flights-api-make',
    title: 'Using the Google Flights API in Make.com',
    sub: 'A three-module scenario with the HTTP module: schedule, search, filter. Alert when the price is low, no price history to build.',
    tag: 'automation',
  },
  {
    href: '/guides/booking-api-make',
    title: 'Using the Booking.com API in Make.com',
    sub: 'A three-module scenario with the HTTP module: search hotels or check a specific property by name, no property IDs to maintain.',
    tag: 'automation',
  },
  {
    href: '/guides/google-flights-api-zapier',
    title: 'Using Google Flights API in Zapier',
    sub: 'Connect live Google Flights data to Zapier workflows with the HTTP Request action. Build fare watches, price feeds, and automated alerts with a POST request.',
    tag: 'automation',
  },
  {
    href: '/guides/best-flight-data-apis-2026',
    title: 'The best flight data APIs in 2026',
    sub: 'The listicle, with disclosed bias: it starts with our own API and says so, quotes every competitor price with a retrieval date, and names the competitor that is cheaper per request than we are.',
    tag: 'comparison',
  },
];

export default function GuidesIndexPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'FlightPowers guides',
          url: `${SITE.url}/guides`,
          hasPart: GUIDES.map((g) => ({
            '@type': 'TechArticle',
            headline: g.title,
            url: `${SITE.url}${g.href}`,
          })),
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/guides', label: 'Guides' }]} />
      </Container>

      <Container className="pt-8 sm:pt-12 pb-4">
        <p className="eyebrow">Guides</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          Working code, honest <span className="text-signal-500">guides</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Every guide is written against the live API, code first, with the limitations stated before you find them. Prices are never
          restated in guides: they go stale there; the current numbers always live on{' '}
          <Link href="/pricing" className="text-signal-400 underline underline-offset-4">/pricing</Link>.
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {GUIDES.map((g) => (
            <Link key={g.href} href={g.href} className="rounded-2xl border rule bg-ink-900/50 p-6 hover:border-ink-500 transition-colors flex flex-col">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal-500">{g.tag}</p>
              <h2 className="mt-2 text-[18px] font-semibold text-ink-100">{g.title}</h2>
              <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed flex-1">{g.sub}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Prefer to click than to read?"
          title="The free tools run the same code"
          lede="Each guide has a tool that does its job in the browser, on our key. Judge the data before writing a line."
        />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { href: '/tools/flight-price-checker', label: 'Flight Price Checker', sub: 'A fare with its verdict' },
            { href: '/tools/cheapest-month-to-fly', label: 'Cheapest Month to Fly', sub: 'A whole month as a price grid' },
            { href: '/tools/hotel-price-by-country', label: 'Hotel Price by Country', sub: 'The 3-market parity check' },
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
          medium="guide"
          title="Every guide ends the same way: run it"
          body="Live flight and hotel data with the context to judge it. Free tier on RapidAPI, no card to try."
        />
      </Section>
    </>
  );
}
