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
  title: 'Hotel Price by Country: the same room, priced from two markets',
  description:
    'Pick a hotel and dates and see what Booking.com quotes visitors from two countries for the same stay, via per-country residential proxies. Each market is asked three times, because rates move between identical requests. The free demo behind rate-parity and geo-pricing monitoring.',
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
    a: 'Yes: no account, no email. But a run is six real requests, each routed through a residential proxy, the most expensive kind of call we serve, so this tool carries the tightest per-visitor cap on the site and repeated queries come from a short cache. The page shows a captured run until you run one.',
  },
  {
    q: 'What is proxy_country exactly?',
    a: 'A request parameter on the hotels API. Set proxy_country to a two-letter code and the request routes through a residential proxy in that country, so Booking.com answers as if a local were asking. Vary only that parameter across otherwise-identical requests, repeat each one a few times, and the difference between the ranges is what you can act on.',
  },
  {
    q: 'Why does the tool ask each market three times?',
    a: 'Because a market can answer differently to the same question. In a controlled run on 2026-08-28 the German and Japanese markets returned an identical number on every request, while the US market moved between identical requests by more than the Germany–Japan gap. One reading per market cannot tell those two situations apart; three readings can.',
  },
  {
    q: 'What if both markets come back with the same price?',
    a: 'Then nothing is drifting for that property and those dates, which is a real answer rather than a failed check. Chain properties under parity contracts often look exactly like this. A monitoring setup wants both outcomes: the gap and the all-clear.',
  },
  {
    q: 'Why only two markets, and only from a short list?',
    a: 'Demo economics, spent on the right thing: six proxied calls buys two markets sampled three times each, which is a comparison, instead of six markets sampled once, which is six readings. From your own code there is no list and no pair limit: any two-letter code, as many markets and repeats as your plan’s rate limit allows.',
  },
  {
    q: 'What does “no rate came back” in a row mean?',
    a: 'Either Booking.com answered from that market with no availability for your dates, or none of that market’s requests completed. The other market still stands, and the tool reports the row honestly instead of dropping it.',
  },
  {
    q: 'Can I automate this across a whole comp set?',
    a: 'That is the intended production shape: the same by-name lookup across your properties and markets on a schedule, sampled a few times each, alerting when one market’s whole range clears another’s. The card under the results shows the exact code, pre-filled with the hotel and markets you just checked.',
  },
];

function marketsOf(fx: typeof FIXTURES.hotelGeoRixos) {
  return (['us', 'de', 'il'] as const).map((c) => ({ country: c, result: fx.data[c] }));
}

export default function HotelGeoPage() {
  const rixos = FIXTURES.hotelGeoRixos;
  const kremlin = FIXTURES.hotelGeoKremlin;
  const repeat = FIXTURES.hotelGeoRepeatRome;
  const captured = {
    run: repeat.data,
    capturedAt: repeat.captured_at,
    defaultQuery: { hotel: 'Rixos Sungate', area: 'Antalya', checkin: '2026-10-05', checkout: '2026-10-10', countries: ['de', 'jp'] },
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
            'One hotel priced from two countries side by side',
            'Live Booking.com rates via per-country residential proxies',
            'Three requests per market, so the observed range is visible',
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
          Booking.com doesn&apos;t quote one price; it quotes one per market. Pick a hotel and dates and see what the same room
          costs a visitor from two countries. Each market is asked three times, because a rate can move between identical
          requests and one reading each would not tell you which was which.
        </p>
      </Container>

      <Container className="pb-16">
        <HotelGeoTool captured={captured} />
      </Container>

      <Section>
        <SectionHead eyebrow="How it works" title="One parameter does all the travelling" />
        <ol className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            ['Name the hotel, pick two markets', 'The name a human would type, no property IDs. Add an area to disambiguate, then pick the two countries to compare.'],
            ['We ask each country three times', 'Six real Booking.com lookups, identical except proxy_country, each routed through a residential proxy in that country at request time.'],
            ['Compare the ranges, not two readings', 'You see every request and the range each market landed in. A gap counts when one market’s whole range sits below the other’s; overlapping ranges are movement, not a finding.'],
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
              Rate parity is a contract term, and breaches hide in markets you don&apos;t browse from. Check your own property from
              the markets that matter, on a schedule, and see a drift the day it appears rather than in a guest&apos;s screenshot.
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
              Pricing studies need observed prices, not brochure rates. Identical requests that differ only in proxy_country,
              repeated enough times to show the movement, are a clean methodology section waiting to happen.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Two earlier readings"
          title="What one request per market can and cannot tell you"
          lede="Both of these are real, captured on 2026-08-26, and both are a single request per market. Read them as readings, not as measured gaps."
        />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h3 className="text-[16px] font-semibold text-ink-100">Rixos Sungate, Antalya · 2026-10-05 → 2026-10-10</h3>
              <CapturedBadge date={rixos.captured_at} />
            </div>
            <HotelMarketsTable markets={marketsOf(rixos)} />
            <p className="mt-3 text-[13.5px] text-ink-400 leading-relaxed">
              One request per market, so this is where the check starts, not where it ends. The repeat runs above show a market
              moving on its own by roughly this much, so the honest reading is &ldquo;worth re-sampling&rdquo;, not &ldquo;parity
              is broken&rdquo;.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h3 className="text-[16px] font-semibold text-ink-100">Kremlin Palace, Antalya · 2026-10-05 → 2026-10-10</h3>
              <CapturedBadge date={kremlin.captured_at} />
            </div>
            <HotelMarketsTable markets={marketsOf(kremlin)} />
            <p className="mt-3 text-[13.5px] text-ink-400 leading-relaxed">
              Same day, same markets, different property: three quotes within a dollar. Nothing to chase. A tool that only ever
              finds differences is selling you something.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10">
          <SectionHead
            eyebrow="Scale it"
            title="Watching a whole comp set? That's what the API is for"
            lede="This page checks one hotel at a time, from two markets. Your code doesn't have those limits."
          />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="text-[15px] font-semibold text-ink-100">Any market, not an allowlist</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                proxy_country takes a two-letter code on every hotels endpoint; the demo&apos;s short list and its two-market pair
                are a demo budget, not an API limit.
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
              <p className="text-[15px] font-semibold text-ink-100">Alert on a gap that holds</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                Flat JSON per market makes the diff trivial: sample each market, compare the ranges, alert when one market&apos;s
                whole range clears your threshold against another&apos;s.
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
