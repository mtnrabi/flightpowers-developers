import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { Breadcrumbs, CapturedBadge, Code, Container, Cta, JsonLd, Section, SectionHead } from '@/components/ui';
import { HOTEL_PLANS } from '@/lib/pricing';
import { LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';
import RUN from './run-2026-10-06.json';
import TOOLS from './tools-2026-10-06.json';

// W2-5: the "hotel mcp" / "booking.com mcp" page. Before this, the only page
// with the phrase was the 3.6 KB shell on hotels.flightpowers.com (audit C §4).
// title.absolute keeps the " · FlightPowers" suffix off.
const TITLE = 'Hotel MCP server: live Booking.com room rates for Claude';

export const metadata: Metadata = {
  ...withOg({
    title: TITLE,
    description:
      'Hotel MCP server for Claude, Cursor and ChatGPT: live Booking.com rates by destination or hotel name, priced as seen from another country if you ask.',
    alternates: { canonical: '/mcp/booking-hotels' },
  }),
  title: { absolute: TITLE },
};

export const dynamic = 'force-static';

const PRO = HOTEL_PLANS[1]!;
const BASIC = HOTEL_PLANS[0]!;
const FREE_HOST = LINKS.mcpFree.replace('https://', '');
const HOST = LINKS.mcpHotels.replace('https://', '');

const SHORT_ANSWERS: { q: string; a: string }[] = [
  {
    q: 'Is there an MCP server for hotel prices?',
    a: `Yes. FlightPowers runs a hosted hotel MCP server at ${HOST}: add the URL to Claude, Cursor, ChatGPT or any MCP client, sign in with Google, and the assistant can price hotels by destination or by name, live from Booking.com.`,
  },
  {
    q: 'Is there a Booking.com MCP?',
    a: `This is one: its tools read live Booking.com availability and rates at request time and return each property's total price, review score, room type, position and a booking link. It reads rates; it does not make reservations.`,
  },
  {
    q: 'Can it show the price a shopper in another country sees?',
    a: 'Yes. price_as_seen_from takes a two-letter country code and prices the stay through a connection in that country. Gaps between countries are real but usually modest and depend on the property, so hold one hotel fixed and call each country a few times before you call it a gap.',
  },
];

const MORE_FAQ: { q: string; a: string }[] = [
  {
    q: 'Is there a free hotel MCP?',
    a: `Yes, ${FREE_HOST}: sign in with Google and you get hotel and flight search with no key, 50 searches a day and 250 a month, with one labelled sponsored card on each result. Use it to try the tools; use the ad-free server on this page, on your own RapidAPI key, for anything you ship.`,
  },
  {
    q: 'What does a search cost on my key?',
    a: `One stay is one request on your RapidAPI plan. The Lisbon run on this page returned ${RUN.result.result_count} properties for ${RUN.result.api_usage.requests_used_by_this_call} request. PRO is $${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')} searches a month; BASIC is free with ${BASIC.quota} a month, enough to check the setup works.`,
  },
  {
    q: 'Can it price several dates in one call?',
    a: 'Yes, on this server. checkin_date_from, checkin_date_to and nights price one stay per check-in date in a single call, and find_hotel_by_name does the same for one property, which gives you a rate calendar. Each stay is one billed request.',
  },
  {
    q: 'Is the price per night or for the stay?',
    a: 'For the stay. Every row carries nights, so a nightly rate is one division away.',
  },
];

const ALL_FAQ = [...SHORT_ANSWERS, ...MORE_FAQ];

const CLAUDE_CODE = `claude mcp add --transport http hotels ${LINKS.mcpHotels}`;

const MCP_JSON = `{
  "mcpServers": {
    "hotels": { "url": "${LINKS.mcpHotels}" }
  }
}`;

const KEY_JSON = `{
  "mcpServers": {
    "hotels": {
      "url": "${LINKS.mcpHotels}",
      "headers": { "x-rapidapi-key": "YOUR_RAPIDAPI_KEY" }
    }
  }
}`;

const CALL = JSON.stringify({ name: RUN.tool, arguments: RUN.arguments }, null, 2);

/** The response trimmed to two rows; every value is from the captured run. */
const EXCERPT = JSON.stringify(
  {
    result_count: RUN.result.result_count,
    results: RUN.result.results_first_six.slice(0, 2).map((r) => ({
      name: r.name,
      price: r.price,
      price_string: r.price_string,
      review_score: r.review_score,
      review_count: r.review_count,
      room_type: r.room_type,
      nights: r.nights,
      latitude: r.latitude,
      longitude: r.longitude,
    })),
    api_usage: RUN.result.api_usage,
  },
  null,
  2
);

const RUN_DATE = RUN.captured_at.slice(0, 10);
const RUN_TIME = RUN.captured_at.slice(11, 16);
const RUN_SECONDS = Math.round((Date.parse(RUN.finished_at) - Date.parse(RUN.captured_at)) / 1000);
const CHEAPEST = RUN.result.cheapest_of_all;
const perNight = (price: number, nights: number) => `US$${Math.round(price / nights)}`;

const RELATED = [
  { href: '/mcp', label: 'Both MCP servers', sub: 'The hub: flights and hotels, every way to connect' },
  { href: '/mcp/google-flights', label: 'Google Flights MCP server', sub: 'Live fares for the same clients' },
  { href: '/guides/best-travel-mcp-servers-2026', label: 'Travel MCP servers compared', sub: '11 servers, read on the same day' },
  { href: '/hotels-api/geo-pricing', label: 'Pricing by country', sub: 'A repeat-sampled run across markets' },
  { href: '/hotels-api', label: 'Hotels API (REST)', sub: 'The same data over plain HTTP' },
  { href: '/integrations/claude-mcp/hotel-search', label: 'Hotel search in Claude', sub: 'The prompt and the tool it calls' },
  { href: '/guides/hotel-api-in-n8n', label: 'Hotels in n8n', sub: 'The same rates in a workflow' },
  { href: '/status', label: 'Status', sub: 'The uptime probe and nightly tests' },
];

export default function BookingHotelsMcpPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'MCP servers', item: `${SITE.url}/mcp` },
            { '@type': 'ListItem', position: 3, name: 'Hotel MCP', item: `${SITE.url}/mcp/booking-hotels` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers Booking.com hotel MCP server',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          url: `${SITE.url}/mcp/booking-hotels`,
          installUrl: LINKS.mcpHotels,
          offers: [
            {
              '@type': 'Offer',
              name: BASIC.name,
              price: String(BASIC.priceMonthly),
              priceCurrency: 'USD',
              description: `${BASIC.quota} searches a month on your own RapidAPI key, hard cap`,
            },
            {
              '@type': 'Offer',
              name: PRO.name,
              price: String(PRO.priceMonthly),
              priceCurrency: 'USD',
              description: `${PRO.quota.toLocaleString('en-US')} searches a month on your own RapidAPI key`,
            },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: ALL_FAQ.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/mcp', label: 'MCP servers' },
            { href: '/mcp/booking-hotels', label: 'Hotels' },
          ]}
        />
      </Container>

      {/* ============================== HERO ============================== */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:items-start">
            <div>
              <p className="eyebrow">Hotel MCP</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                Hotel MCP server: live Booking.com rates in <span className="text-signal-500">Claude, Cursor and ChatGPT</span>
              </h1>
              {/* The citation sentence, hotels-MCP variant (plan "The one citation sentence").
                  Numbers from lib/pricing.ts and the free server's published caps. */}
              <p className="lede mt-5">
                FlightPowers&apos; hotel MCP server gives Claude, Cursor and ChatGPT live Booking.com room rates by destination or
                by hotel name, with a <code className="font-mono text-[0.85em] text-signal-400">price_as_seen_from</code>{' '}
                parameter that prices the stay as a shopper in another country would see it. Free with ads at{' '}
                <code className="font-mono text-[0.85em] text-signal-400">{FREE_HOST}</code> (Google sign-in, 50 searches a
                day); ad-free on your own RapidAPI key, where PRO is ${PRO.priceMonthly} for{' '}
                {PRO.quota.toLocaleString('en-US')} searches. A hotel data server, not a booking engine.
              </p>
              <p className="mt-3 text-[15px] text-ink-400 leading-relaxed">
                Also called a Booking.com MCP or a hotel price MCP. It is hosted: you add a URL, nothing runs on your machine.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('hotels', 'mcp')} external variant="primary">
                  Get a hotels key →
                </Cta>
                <Cta href="#connect" variant="ghost">
                  Connect it
                </Cta>
              </div>
            </div>
            <div>
              <Code label="add this URL to your MCP client">{LINKS.mcpHotels}</Code>
              <p className="mt-3 text-[15px] text-ink-300 leading-relaxed">
                Your client shows a <strong className="text-ink-100">Sign in</strong> button. Sign in with Google; your first
                10 searches each day run free and ad-free with nothing pasted, and you paste your RapidAPI key once on the page
                that opens when you want more.
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* ============================== SHORT ANSWERS ============================== */}
      <Section>
        <div className="max-w-3xl space-y-10">
          {SHORT_ANSWERS.map((f) => (
            <div key={f.q}>
              <h2 className="text-[1.5rem] sm:text-3xl font-semibold">{f.q}</h2>
              <p className="mt-3 text-[15.5px] text-ink-300 leading-relaxed">{f.a}</p>
            </div>
          ))}
          <p className="text-[14px] text-ink-400 leading-relaxed">
            The country comparison, measured on fixed properties with repeat samples, is on the{' '}
            <Link href="/hotels-api/geo-pricing" className="text-signal-400 underline underline-offset-4">
              geo-pricing page
            </Link>
            . On the REST API the same control is called <code className="field">proxy_country</code>.
          </p>
        </div>
      </Section>

      {/* ============================== ONE REAL SEARCH ============================== */}
      <Section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHead
            eyebrow="One real search"
            title={`${RUN.result.result_count} Lisbon hotels in one tool call`}
            lede={`Two adults, November 11 to 16. I sent this call to ${HOST} on ${RUN_DATE} at ${RUN_TIME} UTC; it is the call an assistant makes for that question. It came back in about ${RUN_SECONDS} seconds and billed ${RUN.result.api_usage.requests_used_by_this_call} request.`}
          />
          <CapturedBadge date={RUN_DATE} />
        </div>
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <Code label="tools/call · the request">{CALL}</Code>
          <Code label={`the response · trimmed to 2 of ${RUN.result.result_count} rows`}>{EXCERPT}</Code>
        </div>
        <div className="mt-8 scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                  <th className="px-4 py-3 font-normal">Property</th>
                  <th className="px-4 py-3 font-normal">Room</th>
                  <th className="px-4 py-3 font-normal text-right">Score</th>
                  <th className="px-4 py-3 font-normal text-right">5 nights</th>
                  <th className="px-4 py-3 font-normal text-right">Per night</th>
                </tr>
              </thead>
              <tbody>
                {RUN.result.results_first_six.map((r) => (
                  <tr key={r.name} className="border-t rule">
                    <td className="px-4 py-3 text-ink-100">{r.name}</td>
                    <td className="px-4 py-3 text-ink-400">{r.room_type}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-200">{r.review_score ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-100">{r.price_string}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-400">{perNight(r.price, r.nights)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          The first six rows in the order Booking.com ranked them. The cheapest of all {RUN.result.result_count} was{' '}
          {CHEAPEST.name} at {CHEAPEST.price_string} for the stay ({perNight(CHEAPEST.price, CHEAPEST.nights)} a night). Every
          row also carries latitude, longitude and a booking link. Rates move by the minute, so read this as a captured run, not
          a price you can book today.
        </p>
      </Section>

      {/* ============================== CONNECT ============================== */}
      <Section id="connect">
        <SectionHead
          eyebrow="Connect it"
          title="One URL, any MCP client"
          lede="The same address works for every client. A client with a sign-in button gets a Google sign-in; a script sends your key in a header instead."
        />
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100">Claude (claude.ai and Desktop)</h3>
            <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">
              Settings, Connectors, Add custom connector, paste <code className="field">{LINKS.mcpHotels}</code>, press Connect
              and sign in with Google.
            </p>
            <h3 className="mt-6 text-[16px] font-semibold text-ink-100">Claude Code</h3>
            <div className="mt-2">
              <Code label="terminal">{CLAUDE_CODE}</Code>
            </div>
            <p className="mt-2 text-[14px] text-ink-500">Then open /mcp in a session and sign in.</p>
            <h3 className="mt-6 text-[16px] font-semibold text-ink-100">ChatGPT</h3>
            <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">
              Settings, Connectors, turn on developer mode, add the URL as a connector with OAuth authentication, and sign in
              with Google.
            </p>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100">Cursor and any mcp.json client</h3>
            <div className="mt-2">
              <Code label=".cursor/mcp.json">{MCP_JSON}</Code>
            </div>
            <h3 className="mt-6 text-[16px] font-semibold text-ink-100">Scripts, CI and clients with no sign-in button</h3>
            <div className="mt-2">
              <Code label="same URL, key in a header">{KEY_JSON}</Code>
            </div>
            <p className="mt-2 text-[14px] text-ink-500">
              A client that takes only a URL can put the key on it: <code className="field">?rapidapi_key=</code>. Treat that
              URL as a secret.
            </p>
          </div>
        </div>
      </Section>

      {/* ============================== TOOLS, RAW ============================== */}
      <Section>
        <SectionHead
          eyebrow="The tools, printed raw"
          title={`${TOOLS.tools.length} tools, read from a live tools/list`}
          lede={`Names, titles, hints and every parameter as ${HOST} returned them on ${TOOLS.read_at.slice(0, 10)}. Each parameter line is the first sentence of the server's own description.`}
        />
        <div className="mt-10 space-y-12">
          {TOOLS.tools.map((t) => (
            <div key={t.name}>
              <p className="font-mono text-[15px] text-signal-400">{t.name}</p>
              <p className="mt-1 text-[14px] text-ink-500">
                {t.title} · required: {t.required.join(', ')} · readOnlyHint {String(t.annotations.readOnlyHint)} ·
                idempotentHint {String(t.annotations.idempotentHint)}
              </p>
              <p className="mt-3 max-w-3xl text-[15px] text-ink-300 leading-relaxed">{t.summary}</p>
              <div className="mt-4 scroll-x rounded-2xl border rule">
                <div className="overflow-x-auto rounded-2xl">
                  <table className="w-full text-[13.5px]">
                    <tbody>
                      {t.parameters.map((p) => (
                        <tr key={p.name} className="border-t rule first:border-t-0">
                          <td className="px-4 py-2.5 align-top font-mono text-[12.5px] text-ink-100 whitespace-nowrap">{p.name}</td>
                          <td className="px-4 py-2.5 text-ink-400 leading-relaxed">{p.about}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Booking.com is the source a FlightPowers hotels key covers. The <code className="field">providers</code> argument and{' '}
          <code className="field">compare_hotel_rates</code> price a stay only on sources you hold a key for, and list the rest
          as skipped.
        </p>
      </Section>

      {/* ============================== PRICE ============================== */}
      <Section>
        <SectionHead eyebrow="What it costs" title="Free to try, $10 on your own key" />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Try it free</h3>
            <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">
              <code className="field">{FREE_HOST}</code>: Google sign-in, no key, 50 searches a day and 250 a month, one
              sponsored card per result.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">PRO on your key</h3>
            <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">
              ${PRO.priceMonthly} a month for {PRO.quota.toLocaleString('en-US')} hotel searches, {PRO.ratePerMinute} a minute,
              no ads.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Bigger plans</h3>
            <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">
              {HOTEL_PLANS.slice(2)
                .map((p) => `${p.name} $${p.priceMonthly} for ${p.quota.toLocaleString('en-US')}`)
                .join(', ')}
              . Billing runs on RapidAPI, month to month. <Link href="/pricing" className="text-signal-400 underline underline-offset-4">All plans</Link>
              .
            </p>
          </div>
        </div>
      </Section>

      {/* ============================== MORE QUESTIONS ============================== */}
      <Section>
        <SectionHead title="More questions" />
        <dl className="mt-8 max-w-3xl">
          {MORE_FAQ.map((f) => (
            <div key={f.q} className="border-t rule py-6">
              <dt className="text-[16px] font-semibold text-ink-100">{f.q}</dt>
              <dd className="mt-2 text-[15px] text-ink-400 leading-relaxed">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ============================== RELATED ============================== */}
      <Section>
        <SectionHead eyebrow="Keep going" title="Where to next" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((l) => (
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
          api="hotels"
          title="Ask your assistant for a hotel rate"
          body="Add the URL, sign in with Google, and ask for hotels in any city on your dates. Every row comes back with the room, the score and a booking link."
        />
      </Section>
    </>
  );
}
