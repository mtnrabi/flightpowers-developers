/**
 * Shared server-rendered furniture for the generated {tool} x {route|city}
 * pages: the fact block, the source line, and the link rails that keep every
 * generated page two clicks from the home page and one click from its siblings.
 *
 * Everything printed here is either a fact from the airport dataset, a number
 * computed from two coordinate pairs, or a statement about our own API. There
 * is no traffic figure, no average price and no "most popular" claim, because
 * we cannot source one.
 */

import Link from 'next/link';
import { Section, SectionHead } from '@/components/ui';
import {
  CITIES,
  ROUTE_TOOLS,
  cityForAirport,
  crossesEquator,
  isDomestic,
  relatedRoutes,
  routeArrow,
  routesForCity,
  type GridCity,
  type GridRoute,
} from '@/lib/grid';

const SOURCE_LABEL: Record<GridRoute['source'], string> = {
  international: 'busiest international routes, 2025',
  seats: 'busiest routes by available seats, 2025',
  'deal-scan': 'a route we scan for fares ourselves',
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border rule bg-ink-900/50 p-5">
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-1.5 text-[15px] text-ink-100 leading-relaxed">{children}</p>
    </div>
  );
}

/** The facts about a route that we can state without inventing anything. */
export function RouteFacts({ route }: { route: GridRoute }) {
  const miles = Math.round(route.km * 0.621371);
  return (
    <Section>
      <SectionHead
        eyebrow="This route"
        title={`${routeArrow(route)}, in facts rather than adjectives`}
        lede="Airport names, countries and time zones come from the OurAirports-derived airport dataset. The distance is great-circle, computed from those two coordinate pairs. Prices are not here because a price that is not live is not a price."
      />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label="Origin">
          {route.from.name}
          <span className="block text-[13.5px] text-ink-400">
            {route.from.iata} · {route.from.city}, {route.from.countryName}
          </span>
        </Fact>
        <Fact label="Destination">
          {route.to.name}
          <span className="block text-[13.5px] text-ink-400">
            {route.to.iata} · {route.to.city}, {route.to.countryName}
          </span>
        </Fact>
        <Fact label="Great-circle distance">
          {route.km.toLocaleString('en-US')} km
          <span className="block text-[13.5px] text-ink-400">{miles.toLocaleString('en-US')} miles between the two airports</span>
        </Fact>
        <Fact label="Time zones">
          <span className="font-mono text-[13.5px]">{route.from.tz}</span>
          <span className="block text-[13.5px] text-ink-400">
            to <span className="font-mono">{route.to.tz}</span>
          </span>
        </Fact>
        <Fact label="Search type">
          {isDomestic(route) ? 'Domestic' : 'International'}
          <span className="block text-[13.5px] text-ink-400">
            {isDomestic(route)
              ? `Both airports are in ${route.from.countryName}. The request is identical either way: two IATA codes and a date.`
              : `${route.from.countryName} to ${route.to.countryName}. Ask for any currency you like; the fare is converted, not re-priced.`}
          </span>
        </Fact>
        <Fact label="Why this page exists">
          {SOURCE_LABEL[route.source]}
          <span className="block text-[13.5px] text-ink-400">
            {route.rank
              ? `Rank ${route.rank} in that published table. We build a page for a route people actually fly, and only for those.`
              : 'Not from a published ranking, and we are not claiming one. We already run this search ourselves, so the tool on this page answers.'}
          </span>
        </Fact>
      </div>
      {crossesEquator(route) ? (
        <p className="mt-6 text-[14.5px] text-ink-300 leading-relaxed">
          One end of this route sits north of the equator and the other south of it, so the two ends are in opposite seasons.
          That is worth remembering when you read a year scan: the cheap months at one end are the peak months at the other, and
          the chart shows you which side of that trade the fares are on.
        </p>
      ) : null}
    </Section>
  );
}

/** Same route, the other tools. Plus routes that share an airport. */
export function RouteCrossLinks({ route, currentTool }: { route: GridRoute; currentTool: string }) {
  const siblings = ROUTE_TOOLS.filter((t) => t.slug !== currentTool);
  const related = relatedRoutes(route);
  const city = cityForAirport(route.to) ?? cityForAirport(route.from);

  return (
    <>
      <Section>
        <SectionHead eyebrow="Same route, different question" title={`Three ways to look at ${routeArrow(route)}`} />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {siblings.map((t) => (
            <Link
              key={t.slug}
              href={`/tools/${t.slug}/${route.slug}`}
              className="rounded-2xl border rule bg-ink-900/50 p-5 transition-colors hover:border-ink-500"
            >
              <p className="text-[15px] font-semibold text-ink-100">
                {t.label}: {routeArrow(route)}
              </p>
              <p className="mt-1 text-[13.5px] text-ink-400">{t.sub}</p>
            </Link>
          ))}
          {city ? (
            <Link
              href={`/tools/hotel-price-check/${city.slug}`}
              className="rounded-2xl border rule bg-ink-900/50 p-5 transition-colors hover:border-ink-500"
            >
              <p className="text-[15px] font-semibold text-ink-100">Hotel prices in {city.name}</p>
              <p className="mt-1 text-[13.5px] text-ink-400">Live Booking.com rates once you have landed</p>
            </Link>
          ) : null}
        </div>
      </Section>

      {related.length > 0 ? (
        <Section>
          <SectionHead
            eyebrow="Routes next door"
            title={`Other pages through ${route.from.iata} and ${route.to.iata}`}
            lede="Same live search, same API call, a different pair of airports."
          />
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/tools/${currentTool}/${r.slug}`}
                className="rounded-2xl border rule bg-ink-900/50 p-4 transition-colors hover:border-ink-500"
              >
                <p className="font-mono text-[13px] text-signal-500">{routeArrow(r)}</p>
                <p className="mt-1 text-[13.5px] text-ink-300">
                  {r.from.city} to {r.to.city}
                </p>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-[14px]">
            <Link href="/tools#grid" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              The full list of route and city pages
            </Link>
            <span className="text-ink-400"> is on the tools index.</span>
          </p>
        </Section>
      ) : null}
    </>
  );
}

/** The facts about a hotel city, and where it sits in our flight grid. */
export function CityFacts({ city }: { city: GridCity }) {
  const routes = routesForCity(city);
  return (
    <Section>
      <SectionHead
        eyebrow="This destination"
        title={`What a ${city.name} search actually asks for`}
        lede="The API takes the destination as free text, the same string a person would type into Booking.com. Everything else on this page is about how the request is shaped, not about what a room should cost."
      />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label="Destination string">
          <code className="font-mono text-[14px] text-signal-400">&quot;{city.destination}&quot;</code>
          <span className="block text-[13.5px] text-ink-400">
            Goes in the <code className="font-mono">destination</code> field. A <code className="font-mono">location</code> key
            is rejected with a 400 that tells you so.
          </span>
        </Fact>
        <Fact label="Country">
          {city.country}
          <span className="block text-[13.5px] text-ink-400">
            Rates come back in whatever <code className="font-mono">currency</code> you ask for.
          </span>
        </Fact>
        <Fact label="Why this page exists">
          Rank {city.rank} by international visitors
          <span className="block text-[13.5px] text-ink-400">
            From the published Euromonitor ranking. We generate a page for the cities people go to, and only for those.
          </span>
        </Fact>
      </div>
      {routes.length > 0 ? (
        <div className="mt-8">
          <p className="text-[14.5px] text-ink-300 leading-relaxed">
            {city.name} is also an end of {routes.length === 1 ? 'one route' : `${routes.length} routes`} in our flight grid, so
            you can price the flight and the room from the same site:
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {routes.map((r) => (
              <Link
                key={r.slug}
                href={`/tools/cheapest-time-to-fly/${r.slug}`}
                className="rounded-lg border rule px-3 py-1.5 font-mono text-[12px] text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-100"
              >
                {routeArrow(r)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </Section>
  );
}

/** Nearby city pages, so no hotel page is a dead end. */
export function CityCrossLinks({ city }: { city: GridCity }) {
  const near = CITIES.filter((c) => c.slug !== city.slug).slice(0, 8);
  return (
    <Section>
      <SectionHead eyebrow="More destinations" title="Other cities on the same tool" />
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {near.map((c) => (
          <Link
            key={c.slug}
            href={`/tools/hotel-price-check/${c.slug}`}
            className="rounded-2xl border rule bg-ink-900/50 p-4 transition-colors hover:border-ink-500"
          >
            <p className="text-[14.5px] font-semibold text-ink-100">{c.name}</p>
            <p className="mt-0.5 text-[13px] text-ink-400">{c.country}</p>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-[14px]">
        <Link href="/tools#grid" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
          The full list of route and city pages
        </Link>
        <span className="text-ink-400"> is on the tools index.</span>
      </p>
    </Section>
  );
}
