import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PriceCheckerTool } from '@/components/tools/PriceCheckerTool';
import { RouteCrossLinks, RouteFacts } from '@/components/tools/GridSections';
import { Breadcrumbs, Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { withOg } from '@/lib/meta';
import { ROUTES, findRoute, routeArrow, type GridRoute } from '@/lib/grid';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return ROUTES.map((r) => ({ route: r.slug }));
}

type Props = { params: Promise<{ route: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { route } = await params;
  const r = findRoute(route);
  if (!r) return {};
  return withOg({
    title: `${r.from.city} to ${r.to.city} Flight Price Check (${routeArrow(r)})`,
    description: `Check a live ${r.from.iata} to ${r.to.iata} fare for any date, with Google's own price band and its low, typical or high verdict on what you are looking at. One real search, free, no signup.`,
    alternates: { canonical: `/tools/flight-price-checker/${r.slug}` },
  });
}

function faqFor(r: GridRoute): Faq[] {
  return [
    {
      q: `How much is a flight from ${r.from.city} to ${r.to.city}?`,
      a: 'It depends entirely on the date, which is why this page runs the search instead of printing a number. Pick a date above and the answer comes from one real Google Flights search made while you wait, with the fare, the airline, the stops and the duration.',
    },
    {
      q: 'Is that fare a good one?',
      a: 'That is what the band under each row is for. Google publishes price_insights_low and price_insights_high for the route, plus a low, typical or high verdict against its own history, and we pass all three through. A cheap-looking fare marked "high" is not a bargain, and a fare marked "low" usually is.',
    },
    {
      q: 'Do I need an account or a key to use this?',
      a: 'No. No account, no email, nothing gated. The search runs on our key, which is why it is capped per visitor per day. If you want to run it in bulk, that is the point at which a key of your own makes sense.',
    },
    {
      q: 'The result came back empty. Is the tool broken?',
      a: 'Probably not. The API reports search outcome in an X-Search-Status header: "empty" means Google genuinely returned no itineraries for that route and date, which is itself an answer, and "degraded" means the search did not complete and should be retried. Most APIs return an empty list for both and let you guess.',
    },
    {
      q: `Can I check ${r.to.iata} to ${r.from.iata} as well?`,
      a: 'Yes. Swap the codes in the form. Nothing about the request depends on the direction.',
    },
    {
      q: 'How would I do this from my own code?',
      a: 'The card under the result is the same request in cURL, Python and Node, filled in with this route and date, against either the RapidAPI host or api.flightpowers.com. One POST, one JSON array back.',
    },
  ];
}

export default async function Page({ params }: Props) {
  const { route } = await params;
  const r = findRoute(route);
  if (!r) notFound();

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: `${r.from.city} to ${r.to.city} flight price checker`,
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          url: `${SITE.url}/tools/flight-price-checker/${r.slug}`,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            `Live ${routeArrow(r)} fares for any date`,
            'Google’s price band and low, typical or high verdict',
            'Airline, stops and duration on every row',
            'Honest empty against degraded search reporting',
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Free tools', item: `${SITE.url}/tools` },
            { '@type': 'ListItem', position: 2, name: 'Flight Price Checker', item: `${SITE.url}/tools/flight-price-checker` },
            { '@type': 'ListItem', position: 3, name: routeArrow(r), item: `${SITE.url}/tools/flight-price-checker/${r.slug}` },
          ],
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-10">
        <Breadcrumbs
          trail={[
            { href: '/tools', label: 'tools' },
            { href: '/tools/flight-price-checker', label: 'flight-price-checker' },
            { href: `/tools/flight-price-checker/${r.slug}`, label: r.slug },
          ]}
        />
        <p className="eyebrow mt-6">Free tool · live search, rate-limited</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          <span className="text-signal-500">
            {r.from.city} to {r.to.city}
          </span>{' '}
          flight prices, live
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Pick a date and see what {routeArrow(r)} actually costs right now, next to Google&apos;s own view of whether that is a
          low, typical or high fare for this route.
        </p>
      </Container>

      <Container className="pb-16">
        <PriceCheckerTool initial={{ from: r.from.iata, to: r.to.iata }} />
      </Container>

      <RouteFacts route={r} />

      <Section>
        <SectionHead
          eyebrow="The bit other price checkers skip"
          title="A price on its own does not tell you anything"
          lede="Every fare here carries the context that makes it a decision instead of a number."
        />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            [
              'price_insights_low / high',
              'The band Google has seen this route trade in. A fare near the bottom of the band is a different thing from the cheapest fare on a bad day.',
            ],
            [
              'The verdict',
              'price_range_in_relation_to_other_periods is Google’s own low, typical or high call, published where Google publishes it. Most flight APIs drop this field entirely.',
            ],
            [
              'X-Search-Status',
              'The header that separates "no flights exist" from "the search did not finish". Without it, an empty array is ambiguous and you end up telling users there are no flights when there are.',
            ],
          ].map(([heading, body]) => (
            <div key={heading} className="rounded-2xl border rule bg-ink-900/50 p-5">
              <p className="font-mono text-[13px] text-signal-500">{heading}</p>
              <p className="mt-2 text-[14px] text-ink-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10">
          <SectionHead
            eyebrow="One date here, every date on your key"
            title={`Checking ${routeArrow(r)} once is a page. Checking it every morning is an API`}
            lede="A fare alert, a price history, a comparison across a whole calendar: all of them are this same request on a schedule, and none of them fit in a free tool that runs on our key."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/flights-api/price-insights" variant="ghost">
              Price insights docs
            </Cta>
            <Cta href="/docs/quickstart" variant="ghost">
              Five-minute quickstart
            </Cta>
            <Cta href={rapidApiPricingUrl('flights', 'tool')} external variant="primary">
              See pricing on RapidAPI →
            </Cta>
          </div>
        </div>
      </Section>

      <RouteCrossLinks route={r} currentTool="flight-price-checker" />

      <Section>
        <FaqSection items={faqFor(r)} />
      </Section>

      <Section>
        <SectionHead eyebrow="Keep going" title="The rest of the toolkit" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/tools/flight-price-checker', label: 'Any other route', sub: 'The same checker, empty form' },
            { href: `/tools/cheapest-time-to-fly/${r.slug}`, label: 'Which month is cheapest', sub: `A year of ${routeArrow(r)} in one chart` },
            { href: '/tools#free-mcp', label: 'Free MCP server', sub: 'Ask your assistant instead. No key, ad-supported' },
            { href: '/flights-api/search-status', label: 'Search status docs', sub: 'Why empty and degraded are different' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 transition-colors hover:border-ink-500">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
