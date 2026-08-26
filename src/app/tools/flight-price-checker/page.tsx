import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { PriceCheckerTool } from '@/components/tools/PriceCheckerTool';
import { Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { FIXTURES } from '@/lib/fixtures';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Free Flight Price Checker — is your fare low, typical, or high?',
  description:
    'Enter a route and date and get the live fare with Google’s own price band and a low | typical | high verdict — the context a bare price is missing. Free, no signup; live checks are rate-limited.',
  alternates: { canonical: '/tools/flight-price-checker' },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Is this checker really free?',
    a: 'Yes — no account, no email. Each check runs a real search against live Google Flights data on our own API key, so live checks are capped per visitor per day and repeated queries are served from a short-lived cache. The page shows a captured example until you run one.',
  },
  {
    q: 'What do “low”, “typical”, and “high” mean?',
    a: 'They are Google’s own verdict comparing the current fare to the historical price range for that route and date window. “Low” means the fare sits below the usual range — the buy signal. The band itself is returned as price_insights_low and price_insights_high.',
  },
  {
    q: 'Why do some routes come back without a verdict?',
    a: 'Google publishes the band for most well-travelled routes but not all. When it isn’t published, the fields are null and the checker shows fares without a gauge — honestly unjudged rather than guessed.',
  },
  {
    q: 'What if there are no flights on my date?',
    a: 'The API distinguishes a genuine empty result from a failed search with an X-Search-Status header. This tool shows you which one happened — “empty” is a real answer, “degraded” means try again.',
  },
  {
    q: 'Can I run this from my own code?',
    a: 'Yes — the card under the results shows the exact cURL, Python, or Node request that reproduces your check, pre-filled with your route and dates. A free RapidAPI key takes about a minute.',
  },
  {
    q: 'How fast is a check?',
    a: 'It is a live scan, not a cache read, so it tracks route complexity — trunk routes usually answer in a few seconds; dense or hard routes take longer. The API’s own listing says the same thing: live data costs latency.',
  },
];

export default function FlightPriceCheckerPage() {
  const fx = FIXTURES.onewayTlvJfk;
  const captured = {
    flights: fx.data,
    headers: fx.headers ?? {},
    capturedAt: fx.captured_at,
    query: { from: 'TLV', to: 'JFK', date: '2026-10-13' },
  };

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Flight Price Checker',
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          url: `${SITE.url}/tools/flight-price-checker`,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            'Live Google Flights fare for any route and date',
            "Google's price band (price_insights_low/high)",
            'low | typical | high verdict on the current fare',
            'Honest empty-vs-failed search signalling',
          ],
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-10">
        <p className="eyebrow">Free tool</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          Free Flight <span className="text-signal-500">Price Checker</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          A fare on its own is just a number. This checker returns the live fare <em>with</em> Google&apos;s price band and verdict —
          so you know whether to book or to wait.
        </p>
      </Container>

      <Container className="pb-16">
        <PriceCheckerTool captured={captured} />
      </Container>

      <Section>
        <SectionHead eyebrow="How it works" title="Three steps, one field that matters" />
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            ['Enter a route and date', 'Airport codes and a departure date — the same inputs the API takes.'],
            ['We run a real search', 'A live scan of Google Flights through the FlightPowers API, on our key, at request time. No cache, no stale fares.'],
            ['Read the verdict', 'The gauge places the fare on Google’s historical band; the badge shows Google’s own low | typical | high call.'],
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
          eyebrow="Who uses it"
          title="Built for the question everyone actually asks"
          lede='Not "what does it cost" — "should I book it now?"'
        />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15.5px] font-semibold text-ink-100">Travellers with a quote</p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              You have a price from a booking site. Check it against Google&apos;s band before paying — below the low end means book,
              above the high end means keep looking.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15.5px] font-semibold text-ink-100">Developers evaluating the API</p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              This tool IS the API — same endpoint, same fields, our key. The free RapidAPI tier is a 10-request hard cap, so
              evaluate here where runs are free.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15.5px] font-semibold text-ink-100">Deal hunters</p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              A &quot;deal&quot; is only a deal relative to the usual price. The verdict is computed from the route&apos;s own history —
              not from a marketing banner.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10">
          <SectionHead
            eyebrow="Scale it"
            title="Checking hundreds of routes? That's what the API is for"
            lede="This page runs one check at a time. Your code doesn't have to."
          />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-[15px] font-semibold text-ink-100">Parallel date scans</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                150–500 requests/minute by tier — a whole month of dates in one burst, not a serial loop.
              </p>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink-100">Alerts on the verdict</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                Poll a route and fire when the verdict flips to <span className="font-mono text-verdict-low text-[13px]">low</span>. No
                price-history database needed.
              </p>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink-100">Every result bookable</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                A working <span className="font-mono text-[13px] text-signal-400">buy_link</span> into Google Flights on every row.
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/flights-api/price-insights" variant="ghost">
              View documentation
            </Cta>
            <Cta href={rapidApiPricingUrl('flights', 'tool')} external variant="primary">
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
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { href: '/tools/cheapest-month-to-fly', label: 'Cheapest Month to Fly', sub: 'A whole month as a price grid' },
            { href: '/tools/hotel-price-by-country', label: 'Hotel Price by Country', sub: 'The same room, priced from 3 markets' },
            { href: '/tools/google-flights-url-parser', label: 'Google Flights URL Parser', sub: 'Decode a tfs= URL into an API call' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand medium="tool" title="The same check, from your own code" body="One POST, and the verdict field does the judging for you. Free tier on RapidAPI — no card to try." />
      </Section>
    </>
  );
}
