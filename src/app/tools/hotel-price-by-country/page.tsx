import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { HotelGeoTool } from '@/components/tools/HotelGeoTool';
import { HotelMarketsTable } from '@/components/results';
import { CapturedBadge, Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { FIXTURES } from '@/lib/fixtures';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Hotel Price by Country: the same room, priced from 3 markets',
  description:
    'Pick a hotel and dates and see what Booking.com quotes visitors from 2–3 different countries for the same stay, via per-country residential proxies. The free demo behind rate-parity and geo-pricing monitoring.',
  alternates: { canonical: '/tools/hotel-price-by-country' },
});

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Why would the same room cost different amounts by country?',
    a: 'Booking.com shows different rates depending on where the visitor is browsing from: market-specific promotions, currency handling, and channel deals all move the number. The only way to see it is to genuinely ask from each market, which is what the per-country residential proxy does.',
  },
  {
    q: 'Is this tool really free?',
    a: 'Yes: no account, no email. But each selected market is a real request routed through a residential proxy in that country, the most expensive kind of call we serve, so this tool carries the tightest per-visitor cap on the site and repeated queries come from a short cache. The page shows captured runs until you run one.',
  },
  {
    q: 'What is proxy_country exactly?',
    a: 'A request parameter on the hotels API. Set proxy_country to a two-letter code and the request routes through a residential proxy in that country, so Booking.com answers as if a local were asking. Vary only that parameter across otherwise-identical requests and the price differences are the finding.',
  },
  {
    q: 'What if all markets come back with the same price?',
    a: 'Then parity is holding for that property and dates. That is a real answer, not a failed check. The captured Kremlin Palace example on this page shows exactly that, within a dollar across three markets. A monitoring setup wants both outcomes: the spread and the all-clear.',
  },
  {
    q: 'Why only 2–3 markets, and only from a fixed list?',
    a: 'Demo economics: each market is one proxied call on our key, so the demo allows 13 allowlisted countries and at most 3 per run. From your own code there is no such list: one request per market you care about, as many as your plan’s rate limit lets you fire.',
  },
  {
    q: 'What does “sold out” or “search failed” in a row mean?',
    a: 'Sold out means Booking.com answered from that market with no availability for your dates. Search failed means that one proxied request didn’t complete. The other markets still stand, and the tool reports the row honestly instead of dropping it.',
  },
  {
    q: 'Can I automate this across a whole comp set?',
    a: 'That is the intended production shape: the same by-name lookup across your properties and markets on a schedule, alerting on spread. The card under the results shows the exact code, pre-filled with the hotel and markets you just checked.',
  },
];

function marketsOf(fx: typeof FIXTURES.hotelGeoRixos) {
  return (['us', 'de', 'il'] as const).map((c) => ({ country: c, result: fx.data[c] }));
}

export default function HotelGeoPage() {
  const rixos = FIXTURES.hotelGeoRixos;
  const kremlin = FIXTURES.hotelGeoKremlin;
  const captured = {
    markets: marketsOf(rixos),
    capturedAt: rixos.captured_at,
    query: { hotel: 'Rixos Sungate', area: 'Antalya', checkin: '2026-10-05', checkout: '2026-10-10', countries: ['us', 'de', 'il'] },
  };

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Hotel Price by Country',
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          url: `${SITE.url}/tools/hotel-price-by-country`,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            'One hotel priced from 2–3 countries side by side',
            'Live Booking.com rates via per-country residential proxies',
            'Spread between cheapest and most expensive market',
            'Rate-parity and geo-pricing monitoring, demoed free',
          ],
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-10">
        <p className="eyebrow">Free tool · live demo, rate-limited</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          Hotel Price <span className="text-signal-500">by Country</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Booking.com doesn&apos;t quote one price; it quotes one per market. Pick a hotel and dates and see what the same room costs
          a visitor from the US, Germany, or eleven other countries.
        </p>
      </Container>

      <Container className="pb-16">
        <HotelGeoTool captured={captured} />
      </Container>

      <Section>
        <SectionHead eyebrow="How it works" title="One parameter does all the travelling" />
        <ol className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            ['Name the hotel, pick the markets', 'The name a human would type, no property IDs. Add an area to disambiguate, choose 2–3 countries.'],
            ['We ask from each country', 'One real Booking.com lookup per market, identical except proxy_country, each routed through a residential proxy in that country at request time.'],
            ['Compare the quotes', 'Same room, same dates, side by side, with the spread computed. When the markets agree, the tool says parity is holding rather than inventing a difference.'],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-2xl border rule bg-ink-900/50 p-5">
              <p className="font-mono text-[13px] text-signal-500">{i + 1}</p>
              <p className="mt-1.5 text-[15.5px] font-semibold text-ink-100">{title}</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Who it's for"
          title="A tool for people whose job is the rate"
          lede="Travellers save a few dollars with a VPN. Businesses monitor this; that's who the API sells to."
        />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15.5px] font-semibold text-ink-100">Revenue managers</p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              Rate parity is a contract term, and breaches hide in markets you don&apos;t browse from. Check your own property from the
              markets that matter, on a schedule, and catch the $195-style spreads before your account manager does.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15.5px] font-semibold text-ink-100">OTAs and metasearch</p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              Geo-pricing intelligence at the source: what your competitor&apos;s channel actually quotes each market, not what their
              rate feed claims. Per-country data is the difference between a hunch and a report.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15.5px] font-semibold text-ink-100">Analysts and consultants</p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              Pricing studies need observed prices, not brochure rates. Identical requests that differ only in proxy_country are a
              clean methodology section waiting to happen.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="The honest counter-example"
          title="Parity can hold too"
          lede="A monitoring tool that only ever finds differences is selling you something. Same capture date, same three markets, different property:"
        />
        <div className="mt-8 rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h3 className="text-[16px] font-semibold text-ink-100">Kremlin Palace, Antalya · 2026-10-05 → 2026-10-10</h3>
            <CapturedBadge date={kremlin.captured_at} />
          </div>
          <HotelMarketsTable markets={marketsOf(kremlin)} />
          <p className="mt-3 text-[13.5px] text-ink-400 leading-relaxed">
            Three markets, all within a dollar. The Rixos Sungate capture above (same dates, same markets) showed a $195 spread
            on the same room. Which of the two your property looks like is exactly what monitoring answers.
          </p>
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10">
          <SectionHead
            eyebrow="Scale it"
            title="Watching a whole comp set? That's what the API is for"
            lede="This page checks one hotel at a time, from at most three markets. Your code doesn't have those limits."
          />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="text-[15px] font-semibold text-ink-100">Any market, not an allowlist</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                proxy_country takes a two-letter code on every hotels endpoint; the demo&apos;s 13-country list is a demo budget, not
                an API limit.
              </p>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink-100">By name, on a schedule</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                The by-name endpoint resolves the property for you, so a comp-set sweep is a list of names and a cron, no ID
                bookkeeping.
              </p>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink-100">Alert on the spread</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                Flat JSON per market makes the diff trivial: compare price across runs, alert when the gap crosses your threshold.
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/hotels-api/geo-pricing" variant="ghost">
              View documentation
            </Cta>
            <Cta href={rapidApiPricingUrl('hotels', 'tool')} external variant="primary">
              See pricing on RapidAPI →
            </Cta>
          </div>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Related tools" title="Keep going" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { href: '/tools/flight-price-checker', label: 'Flight Price Checker', sub: 'Live fare + Google’s verdict' },
            { href: '/tools/cheapest-month-to-fly', label: 'Cheapest Month to Fly', sub: 'A whole month as a price grid' },
            { href: '/hotels-api/geo-pricing', label: 'Geo-Pricing API', sub: 'proxy_country, documented field by field' },
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
          medium="tool"
          api="hotels"
          title="Rate-parity monitoring is one parameter away"
          body="Live Booking.com rates with proxy_country on every endpoint: the same check you just ran, as a scheduled job. Free tier on RapidAPI, no card to try."
        />
      </Section>
    </>
  );
}
