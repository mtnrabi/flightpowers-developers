import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RoundTripTool } from '@/components/tools/RoundTripTool';
import { RouteCrossLinks, RouteFacts } from '@/components/tools/GridSections';
import { Breadcrumbs, Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { withOg } from '@/lib/meta';
import { findRoute, roundTripPlannerTitle, routeArrow, ROUTES, type GridRoute } from '@/lib/grid';
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
    title: roundTripPlannerTitle(r),
    description: `Price a ${r.from.iata} to ${r.to.iata} return trip as one itinerary: paired legs, one total, each side with its own airline, stops and duration. Live Google Flights data, free, no signup.`,
    alternates: { canonical: `/tools/round-trip-planner/${r.slug}` },
  });
}

function faqFor(r: GridRoute): Faq[] {
  return [
    {
      q: `How much is a round trip from ${r.from.city} to ${r.to.city}?`,
      a: 'Set the two dates above and the search answers it for those dates. There is no fixed number to print here: a return fare is a function of when you go and how long you stay, and any figure written into this page would be stale by the time you read it.',
    },
    {
      q: 'Why is this not just two one-way searches?',
      a: 'Because airlines price a return as one product. The total of two one-way fares is frequently higher than the return fare, and occasionally lower than anything actually on sale. This calls the round-trip endpoint, which returns paired legs and a real total for the pair.',
    },
    {
      q: 'What does each row contain?',
      a: 'total_price and total_price_as_number for the itinerary, then the outbound leg and the return leg separately, each with its own airline, stop count, duration and times. That is how you tell a cheap total with a long layover apart from a cheap total without one.',
    },
    {
      q: 'Does trip length change the price?',
      a: 'Often, and sometimes by more than moving the outbound date does. Change the return date and run it again; each run is one request. Sweeping several trip lengths at once is a job for your own key, in parallel.',
    },
    {
      q: 'The search came back empty. What does that mean?',
      a: 'On a round trip it usually means the pair of dates cannot be flown as an itinerary, not that the route has no flights. The API says so through X-Search-Status: "empty" is a real answer, "degraded" means the search did not finish and would be retried.',
    },
    {
      q: `Can I run the ${r.to.iata} to ${r.from.iata} direction?`,
      a: 'Yes, swap the codes in the form. The endpoint does not care which end you start from.',
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
          name: `${r.from.city} to ${r.to.city} round-trip planner`,
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          url: `${SITE.url}/tools/round-trip-planner/${r.slug}`,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            `Live ${routeArrow(r)} return itineraries`,
            'Paired legs with one real total',
            'Per-leg airline, stops and duration',
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
            { '@type': 'ListItem', position: 2, name: 'Round-Trip Planner', item: `${SITE.url}/tools/round-trip-planner` },
            { '@type': 'ListItem', position: 3, name: routeArrow(r), item: `${SITE.url}/tools/round-trip-planner/${r.slug}` },
          ],
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-10">
        <Breadcrumbs
          trail={[
            { href: '/tools', label: 'tools' },
            { href: '/tools/round-trip-planner', label: 'round-trip-planner' },
            { href: `/tools/round-trip-planner/${r.slug}`, label: r.slug },
          ]}
        />
        <p className="eyebrow mt-6">Free tool · live search, rate-limited</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          Round trip{' '}
          <span className="text-signal-500">
            {r.from.city} to {r.to.city}
          </span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Out and back on {routeArrow(r)}, priced as one itinerary. Both legs, their airlines and their stops, and one total for
          the pair rather than two searches you add up and hope match.
        </p>
      </Container>

      <Container className="pb-16">
        <RoundTripTool initial={{ from: r.from.iata, to: r.to.iata }} />
      </Container>

      <RouteFacts route={r} />

      <Section>
        <SectionHead
          eyebrow="Reading the result"
          title="The total is only half the answer"
          lede="Two itineraries with the same total can be very different trips, and the response says which is which."
        />
        <div className="mt-8 space-y-4 text-[15px] text-ink-300 leading-relaxed max-w-3xl">
          <p>
            Each row gives you the outbound leg and the return leg separately: airline, stops, duration and the times, on both
            sides. At {r.km.toLocaleString('en-US')} km between {r.from.iata} and {r.to.iata}, a connection adds real hours, and
            the row shows you where they go rather than burying them in a single total.
          </p>
          <p>
            Trip length is the other lever. The return date is a field, so a week against ten days is two requests, not two
            different tools. If the difference matters to you, sweep it: that is the same call in a loop on your own key.
          </p>
          <p>
            Nothing here is an average or a prediction. It is the itineraries that came back for the two dates you chose, at the
            moment you asked.
          </p>
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10">
          <SectionHead
            eyebrow="On your own key"
            title={`One ${routeArrow(r)} trip here. Every trip length, on your key`}
            lede="Paired-leg pricing across a range of return dates is the request on this page, fired in parallel."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/flights-api/round-trip" variant="ghost">
              Round-trip docs
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

      <RouteCrossLinks route={r} currentTool="round-trip-planner" />

      <Section>
        <FaqSection items={faqFor(r)} />
      </Section>

      <Section>
        <SectionHead eyebrow="Keep going" title="The rest of the toolkit" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/tools/round-trip-planner', label: 'Any other route', sub: 'The same planner, empty form' },
            { href: `/tools/cheapest-time-to-fly/${r.slug}`, label: 'Which month is cheapest', sub: `A year of ${routeArrow(r)} in one chart` },
            { href: '/tools#free-mcp', label: 'Free MCP server', sub: 'Ask your assistant instead. No key, ad-supported' },
            { href: '/flights-api/round-trip', label: 'Round-trip endpoint', sub: 'Field names and response shape' },
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
