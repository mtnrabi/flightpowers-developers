import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { ExecuteWidget } from '@/components/ExecuteWidget';
import { Mono, ResponseChunk } from '@/components/ResponseChunk';
import { PricingTable } from '@/components/PricingTable';
import {
  Breadcrumbs,
  CheckBullets,
  Code,
  Container,
  Cta,
  FaqSection,
  FieldRow,
  JsonLd,
  PriceBand,
  Section,
  SectionHead,
  VerdictBadge,
  type Faq,
} from '@/components/ui';
import { FIXTURES } from '@/lib/fixtures';
import { FLIGHT_PLANS } from '@/lib/pricing';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Flight Price Insights API: Google’s price band & low/typical/high verdict',
  description:
    'Every fare returns with price_insights_low, price_insights_high, and Google’s own low | typical | high verdict for the route and dates. Build price alerts and “book now” recommendations without maintaining your own fare history.',
  alternates: { canonical: '/flights-api/price-insights' },
});

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Where do the price insights come from?',
    a: 'From Google Flights itself. Google computes a historical price range for a route and date window and, when available, a verdict on how the current fare compares. The API surfaces those exact values as price_insights_low, price_insights_high, and price_range_in_relation_to_other_periods. Nothing is modelled on our side.',
  },
  {
    q: 'Is the verdict on every result?',
    a: 'No. It appears when Google publishes it for that route and date, which is most well-travelled routes. When Google doesn’t provide a band, the fields are null and your code should treat the fare as unjudged rather than bad. The captured example on this page shows real values.',
  },
  {
    q: 'What values can the verdict take?',
    a: 'price_range_in_relation_to_other_periods is one of "low", "typical", or "high", in Google’s own wording. "low" means the current fare sits below the usual range for that route and dates: the buy signal.',
  },
  {
    q: 'How do I build a price alert with this?',
    a: 'Poll the route on a schedule (a cron, an n8n workflow, or an agent) and fire when the verdict flips to "low". You skip building a price-history database entirely, because Google’s band is the history.',
  },
  {
    q: 'Do competing flight APIs return this?',
    a: 'Some do. SerpApi documents a price_insights object, and HasData documents a priceInsights object with lowestPrice, typicalPriceRange and priceLevel plus a priceHistory array we do not return. Both read on 2026-09-06. Where the field is missing is the RapidAPI shelf: none of the four Google Flights listings ranked above ours documents a price-insights band, a low / typical / high field, or a search-status header, all four pulled on 2026-09-06. So check the docs of whatever you are comparing, and if a listing does not name the field, assume the fare arrives without context. Our comparison pages quote competitors’ own documentation, dated. What is ours on that shelf is the round-trip: the same three fields ride on the paired itinerary, so one request returns a verdict on the whole trip instead of on two legs you add up yourself.',
  },
  {
    q: 'Does it cost extra?',
    a: 'No. The fields ride on every one-way and round-trip search on every plan, including the free tier.',
  },
];

/**
 * A real response from the free MCP server, run 2026-09-07 (BER→CDG,
 * 2026-10-06), trimmed to the pricing fields. Raw call and full body:
 * state/gtm/content/PRICE-INSIGHTS-CHUNK-2026-09-07.md.
 */
const PRICE_INSIGHTS_EXCERPT = `{
  "results": [
    {
      "from_airport": "Berlin (BER)",
      "to_airport": "Paris (CDG)",
      "departure_date": "2026-10-06",
      "airline": "easyJet",
      "price": "$43",
      "price_as_number": 43,
      "price_insights_low": 50,
      "price_insights_high": 140,
      "price_range_in_relation_to_other_periods": "low"
    },
    {
      "from_airport": "Berlin (BER)",
      "to_airport": "Paris (CDG)",
      "departure_date": "2026-10-06",
      "airline": "easyJet",
      "price": "$45",
      "price_as_number": 45,
      "price_insights_low": 50,
      "price_insights_high": 140,
      "price_range_in_relation_to_other_periods": "low"
    }
  ],
  "result_count": 2,
  "search_status": "ok"
}`;

export default function PriceInsightsPage() {
  const fx = FIXTURES.onewayJfkCun;
  const rec = fx.data[0]!;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Flights API', item: `${SITE.url}/flights-api` },
            { '@type': 'ListItem', position: 3, name: 'Price Insights', item: `${SITE.url}/flights-api/price-insights` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers Price Insights API',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free tier: 10 requests/month on RapidAPI' },
          url: `${SITE.url}/flights-api/price-insights`,
          dateModified: '2026-09-07',
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/flights-api', label: 'Flights API' }, { href: '/flights-api/price-insights', label: 'Price Insights' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Flight Price Insights API</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                Fares with a <span className="text-signal-500">verdict</span> attached to the number
              </h1>
              <p className="lede mt-5">
                Send a route and a date; get live fares with Google&apos;s own price band and a low | typical | high call on each.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>
                      <code className="font-mono text-[13px] text-signal-400">price_insights_low / high</code>: Google&apos;s historical
                      band for the route &amp; dates
                    </>,
                    <>
                      <code className="font-mono text-[13px] text-signal-400">price_range_in_relation_to_other_periods</code>: the
                      verdict, straight from Google
                    </>,
                    <>On every plan, on every search, including round-trips and the free tier</>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'endpoint')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/tools/flight-price-checker" variant="ghost">
                  Try it for free
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>

            <ExecuteWidget
              title="POST /api/google_flights/oneway/v1"
              tool="price-insights-execute"
              capturedAt={fx.captured_at}
              requestText={JSON.stringify(fx.request.body, null, 2)}
              responseText={JSON.stringify(fx.data.slice(0, 2), null, 2)}
              headers={fx.headers}
            />
          </div>
        </Container>
      </div>

      <ResponseChunk
        title="What a price insights response looks like"
        answer={
          <>
            Every fare FlightPowers returns carries Google&apos;s own price band. One POST to{' '}
            <Mono>/v1/flights/oneway</Mono> on <Mono>api.flightpowers.com</Mono> (or to{' '}
            <Mono>google-flights-live-api.p.rapidapi.com</Mono> with a RapidAPI key) returns{' '}
            <Mono>price_insights_low</Mono>, <Mono>price_insights_high</Mono> and{' '}
            <Mono>price_range_in_relation_to_other_periods</Mono> on every result, so you get a{' '}
            <VerdictBadge verdict="low" /> <VerdictBadge verdict="typical" /> <VerdictBadge verdict="high" /> call on
            the fare without keeping any price history of your own.
          </>
        }
        excerptLabel="BER → CDG, 2026-10-06 · trimmed to the pricing fields · run 2026-09-07"
        excerpt={PRICE_INSIGHTS_EXCERPT}
        fields={[
          {
            name: 'price_insights_low',
            type: 'number | null',
            meaning: "Bottom of Google's usual price range for this route and date.",
            value: '50',
          },
          {
            name: 'price_insights_high',
            type: 'number | null',
            meaning: 'Top of that range.',
            value: '140',
          },
          {
            name: 'price_range_in_relation_to_other_periods',
            type: '"low" | "typical" | "high" | null',
            meaning: "Google's verdict on this fare against that range. Branch on it directly.",
            value: <VerdictBadge verdict="low" />,
          },
          {
            name: 'price_as_number',
            type: 'number',
            meaning: (
              <>
                The fare itself, unformatted, so you can compare it to the band. <code className="field">price</code> is
                the same value as a display string.
              </>
            ),
            value: '43',
          },
        ]}
        notes={[
          <>
            The verdict is Google&apos;s, not ours. Google Flights publishes a usual price range for that route and
            those dates, and the API passes the range and Google&apos;s call on the current fare through untouched.
            Nothing is modelled on our side, and the fields are <code className="field">null</code> when Google shows no
            band.
          </>,
          <>
            Scoping the claim honestly: SerpApi and HasData document a band of their own, so a band is not unique to us
            (their docs, read 2026-09-06). What is ours is the round-trip. The same three fields ride on the paired
            itinerary from{' '}
            <Link href="/flights-api/round-trip" className="text-signal-400 hover:text-signal-300">
              <code className="font-mono text-[13px]">/v1/flights/roundtrip</code>
            </Link>
            , so one request gives you a verdict on the whole trip instead of two one-ways you have to add up.
          </>,
        ]}
      />

      <Section>
        <SectionHead
          eyebrow="The three fields"
          title="What the response tells you"
          lede="Captured from a real search (JFK→Cancún, January 1) on the date stamped above."
        />
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <FieldRow name="price_insights_low" type="number | null">
              The bottom of Google&apos;s historical price range for this route and these dates. In the capture: ${rec.price_insights_low}.
            </FieldRow>
            <FieldRow name="price_insights_high" type="number | null">
              The top of the band. In the capture: ${rec.price_insights_high}. A fare under the low end is objectively cheap for the
              route; over the high end, objectively expensive.
            </FieldRow>
            <FieldRow name="price_range_in_relation_to_other_periods" type='"low" | "typical" | "high" | null'>
              Google&apos;s own comparison of the current fare against that band: the field your alerting, ranking, and
              &quot;book now&quot; logic can branch on directly. In the capture: <VerdictBadge verdict={rec.price_range_in_relation_to_other_periods} />
            </FieldRow>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <PriceBand
              low={rec.price_insights_low!}
              high={rec.price_insights_high!}
              price={rec.price_as_number}
              label={`The captured fare (${rec.price}) on Google's band for JFK→CUN`}
            />
            <p className="mt-5 text-[14px] text-ink-400 leading-relaxed">
              This is the whole feature in one picture: the band says what the route usually costs, the dot says what it costs right
              now. Rendering this, or just reading the verdict, is one field access.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Patterns"
          title="Three things this field replaces"
          lede="Each of these normally requires months of your own fare history. The band ships it in the response."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">A price alert without a database</h3>
            <Code label="python · poll & alert">{`fares = search("JFK", "LHR", "2026-12-10")
best = min(fares, key=lambda f: f["price_as_number"])

if best["price_range_in_relation_to_other_periods"] == "low":
    alert(f"JFK→LHR is LOW: {best['price']}",
          link=best["buy_link"])`}</Code>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">An agent that can say &quot;book it&quot;</h3>
            <Code label="the tool response your agent reads">{`{
  "price": "${rec.price}",
  "price_insights_low": ${rec.price_insights_low},
  "price_insights_high": ${rec.price_insights_high},
  "price_range_in_relation_to_other_periods":
      "${rec.price_range_in_relation_to_other_periods}"
}
// "That fare is ${rec.price_range_in_relation_to_other_periods} for this route.
//  The usual range is $${rec.price_insights_low} to $${rec.price_insights_high}."`}</Code>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">Ranking results by value</h3>
            <Code label="javascript · sort by value, not price">{`const rank = { low: 0, typical: 1, high: 2 };
flights.sort((a, b) =>
  rank[a.price_range_in_relation_to_other_periods] -
  rank[b.price_range_in_relation_to_other_periods] ||
  a.price_as_number - b.price_as_number
);`}</Code>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Pricing" title="Every plan carries this field" />
        <div className="mt-8">
          <PricingTable api="flights" plans={FLIGHT_PLANS} medium="endpoint" />
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Explore more" title="More Flights API" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/flights-api/one-way', label: 'One-way search', sub: 'The base endpoint' },
            { href: '/flights-api/round-trip', label: 'Round-trip search', sub: 'Paired-leg itineraries' },
            { href: '/flights-api/search-status', label: 'Search status', sub: '"empty" vs "failed"' },
            { href: '/flights-api/parallel-date-scan', label: 'Parallel date scans', sub: '150–500 req/min' },
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
          medium="endpoint"
          title="Stop guessing whether a fare is good"
          body="One subscription, every endpoint, and Google's own price context on every result."
        />
      </Section>
    </>
  );
}
