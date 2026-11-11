import type { Metadata } from 'next';
import Link from 'next/link';
import { PlanBox } from '@/components/PlanBox';
import { Breadcrumbs, Container, JsonLd, Section } from '@/components/ui';
import { withOg } from '@/lib/meta';
import { allRouteFares, dayLabel, money, ROUTE_INDEX_TITLE, routeName, type RouteFares } from '@/lib/route-fares';
import { SITE } from '@/lib/site';

export const dynamic = 'force-static';

export function generateMetadata(): Metadata {
  const routes = allRouteFares();
  return {
    ...withOg({
      title: ROUTE_INDEX_TITLE,
      description: `Cheapest one-way dates for ${routes.length} popular routes across the US, Europe, Israel and Asia, from real Google Flights searches, each with its fetch date and the API request.`,
      alternates: { canonical: '/flights' },
    }),
    title: { absolute: ROUTE_INDEX_TITLE },
  };
}

function byOrigin(routes: RouteFares[]): [string, RouteFares[]][] {
  const m = new Map<string, RouteFares[]>();
  for (const r of routes) {
    const k = `${r.from.city} (${r.from.iata})`;
    m.set(k, [...(m.get(k) ?? []), r]);
  }
  return [...m.entries()];
}

export default function Page() {
  const routes = allRouteFares();
  const fetched = routes.map((r) => r.fetchedLast).sort();
  const last = fetched[fetched.length - 1];
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: ROUTE_INDEX_TITLE,
          itemListElement: routes.map((r, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE.url}/flights/${r.slug}`,
            name: `${routeName(r)} (${r.from.iata}-${r.to.iata})`,
          })),
        }}
      />
      <Container className="pt-14 sm:pt-20 pb-6">
        <Breadcrumbs trail={[{ href: '/flights', label: 'flights' }]} />
        <p className="eyebrow mt-6">Fetched fares{last ? ` · last fetched ${dayLabel(last)}` : ''}</p>
        <h1 className="mt-4 text-[2.1rem] sm:text-[3.1rem] leading-[1.05] font-semibold max-w-3xl">
          Flight prices by route, <span className="text-signal-500">from real searches</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          {routes.length} popular routes. For each one we searched Google Flights on a run of departure dates over the coming
          months and charted the cheapest one-way fare per date, with Google&apos;s low, typical or high verdict and the date we
          fetched it. Every page shows the API request that produced it.
        </p>
      </Container>

      <Section>
      {byOrigin(routes).map(([origin, list]) => (
        <div key={origin} className="mb-12 last:mb-0">
          <h2 className="text-[1.4rem] sm:text-2xl font-semibold">From {origin}</h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((r) => (
              <Link key={r.slug} href={`/flights/${r.slug}`} className="rounded-2xl border rule bg-ink-900/50 p-4 transition-colors hover:border-ink-500">
                <p className="text-[15px] font-semibold text-ink-100">
                  {r.to.city} <span className="font-mono text-[12px] text-ink-400">{r.to.iata}</span>
                </p>
                <p className="mt-1 text-[13px] text-ink-400">
                  from {money(r.cheapest.fare.price)} on {dayLabel(r.cheapest.date)} · cheapest month {r.cheapestMonth.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ))}
      </Section>

      <Section>
        <PlanBox page="/flights" listings={['flights']} medium="tool" title="The same searches, on your own key" mcp />
      </Section>
    </>
  );
}
