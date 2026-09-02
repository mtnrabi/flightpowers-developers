import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheapestTimeTool } from '@/components/tools/CheapestTimeTool';
import { RouteCrossLinks, RouteFacts } from '@/components/tools/GridSections';
import { Breadcrumbs, Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { withOg } from '@/lib/meta';
import { ROUTES, findRoute, isDomestic, routeArrow, type GridRoute } from '@/lib/grid';
import { COUNTS, SITE, rapidApiPricingUrl } from '@/lib/site';

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
    title: `Cheapest Month to Fly ${r.from.city} to ${r.to.city} (${routeArrow(r)})`,
    description: `Scan a year of ${r.from.iata} to ${r.to.iata} fares in one go: one real Google Flights search per coming month, charted side by side, each with Google's own low, typical or high verdict. Free, no signup, live rather than cached.`,
    alternates: { canonical: `/tools/cheapest-time-to-fly/${r.slug}` },
  });
}

function faqFor(r: GridRoute): Faq[] {
  return [
    {
      q: `Which month is cheapest to fly ${r.from.city} to ${r.to.city}?`,
      a: `Run the scan above and the chart answers it for the coming year, today. We do not publish a fixed answer here, because a cheapest month written into a page in September is wrong by November. The scan fires about ten real searches, one per coming month departing the 15th, and the cheapest sampled month is called out under the chart.`,
    },
    {
      q: 'Is the scan really free, and is it really live?',
      a: 'Free: no account, no email, nothing withheld. Live: each run is roughly ten real searches against Google Flights on our own key, which is why runs are capped per visitor per day. Nothing on this page is a saved screenshot of an old scan.',
    },
    {
      q: 'Why one date per month instead of every day?',
      a: `Every date is a real request. One mid-month fare per month is enough to see the shape of the year and pick the month worth zooming into. On your own key you choose the resolution: three dates a month, weekends against midweek, or all 365 days. The flights API allows ${COUNTS.flightsRateLimits} requests per minute by tier, so even a full-year daily scan is one burst rather than a loop.`,
    },
    {
      q: 'What does Google’s verdict add?',
      a: 'Each fare carries price_range_in_relation_to_other_periods, Google’s own low, typical or high call against that route’s history, where Google publishes it. The chart says which month is cheapest this year; the verdict says whether that fare is genuinely cheap for the route. A cheapest month that still reads "typical" means this route does not dip much, which is worth knowing before you wait for it to.',
    },
    {
      q: `Does the scan work in the other direction, ${r.to.iata} to ${r.from.iata}?`,
      a: 'Yes. Swap the two codes in the form and run it again. The engine has no notion of a preferred direction, and neither does the API.',
    },
    {
      q: 'What happens on a month with no result?',
      a: 'The chart shows the status instead of inventing a price. "empty" means Google genuinely returned no itineraries for that date, which is an answer. "degraded" means that one search did not complete and would simply be retried. The API reports this in an X-Search-Status header rather than returning a silent empty list.',
    },
    {
      q: `How do I run this ${r.from.iata} to ${r.to.iata} scan from my own code?`,
      a: 'One request per departure date, fired in parallel. The code card under the chart is already filled in with this route in cURL, Python and Node, against either the RapidAPI host or api.flightpowers.com.',
    },
  ];
}

export default async function Page({ params }: Props) {
  const { route } = await params;
  const r = findRoute(route);
  if (!r) notFound();

  const title = `Cheapest month to fly ${r.from.city} to ${r.to.city}`;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: `${title} (${routeArrow(r)})`,
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          url: `${SITE.url}/tools/cheapest-time-to-fly/${r.slug}`,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            `A year of ${routeArrow(r)} fares as one chart, live from Google Flights`,
            'One real mid-month search per coming month',
            'Google’s low, typical or high verdict on each fare',
            'A booking link on every priced month',
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Free tools', item: `${SITE.url}/tools` },
            { '@type': 'ListItem', position: 2, name: 'Cheapest Time to Fly', item: `${SITE.url}/tools/cheapest-time-to-fly` },
            { '@type': 'ListItem', position: 3, name: routeArrow(r), item: `${SITE.url}/tools/cheapest-time-to-fly/${r.slug}` },
          ],
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-10">
        <Breadcrumbs
          trail={[
            { href: '/tools', label: 'tools' },
            { href: '/tools/cheapest-time-to-fly', label: 'cheapest-time-to-fly' },
            { href: `/tools/cheapest-time-to-fly/${r.slug}`, label: r.slug },
          ]}
        />
        <p className="eyebrow mt-6">Free tool · live scan, rate-limited</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          Cheapest month to fly{' '}
          <span className="text-signal-500">
            {r.from.city} to {r.to.city}
          </span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          {routeArrow(r)}, every coming month priced side by side from one real search each, with Google&apos;s own verdict on
          every fare. Run it now and the cheap months jump out of the chart.
        </p>
      </Container>

      <Container className="pb-16">
        <CheapestTimeTool initial={{ from: r.from.iata, to: r.to.iata }} />
      </Container>

      <RouteFacts route={r} />

      <Section>
        <SectionHead eyebrow="How it works" title="Ten real searches, one chart" />
        <ol className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            [
              'The route is already filled in',
              `${r.from.iata} and ${r.to.iata} are in the form. Change either one and the scan follows: nothing on this page is hard-wired to the route in its title.`,
            ],
            [
              'We scan the year live, in parallel',
              'One real Google Flights search per coming month, departing the 15th, run on our key while you wait. It is a sample of the year, and the page says so rather than implying it scanned every day.',
            ],
            [
              'Read the chart, then zoom in',
              'Each bar is that month’s cheapest sampled fare. Take the winning month into the day grid, then check the winning day’s live fare before you book anything.',
            ],
          ].map(([heading, body], i) => (
            <li key={heading} className="rounded-2xl border rule bg-ink-900/50 p-5">
              <p className="font-mono text-[13px] text-signal-500">{i + 1}</p>
              <p className="mt-1.5 text-[15.5px] font-semibold text-ink-100">{heading}</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10">
          <SectionHead
            eyebrow="Free here, full resolution on your own key"
            title={`What this page does for ${routeArrow(r)}, and what it does not`}
            lede="The free scan is one sample date per month on our key. The full-resolution version is the same request, as many times as you want, on yours."
          />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="text-[15px] font-semibold text-ink-100">Free here: one date per month</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                About ten real searches per scan, roughly one live scan per visitor per day, cached for a day afterwards.
              </p>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink-100">Your key: any resolution</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                Weekends against midweek, three dates a month, or every day of the year. {COUNTS.flightsRateLimits} requests per
                minute by tier means the whole year is a burst.
              </p>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink-100">Same data either way</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                price_insights_low and price_insights_high, the verdict, and a bookable buy_link on every fare. What you see here
                is the API response, not a mock of one.
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/flights-api/parallel-date-scan" variant="ghost">
              View documentation
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

      <Section>
        <SectionHead eyebrow="Reading the result" title={`What a ${routeArrow(r)} scan can and cannot tell you`} />
        <div className="mt-8 space-y-4 text-[15px] text-ink-300 leading-relaxed max-w-3xl">
          <p>
            A cheap month in the chart is a place to look closer, not a promise. The scan samples the 15th, so a month whose
            cheap days sit at the start or the end of it can read as expensive here and still hold a bargain. That is the honest
            limit of ten searches, and it is why the next step is the day grid rather than a booking.
          </p>
          <p>
            The verdict column is the part most tools do not have.{' '}
            {isDomestic(r)
              ? `On a domestic ${r.from.countryName} route like this one, fares move in a narrower band than on a long international hop, so "typical" turns up more often than "low".`
              : `On an international route the band can be wide, and a fare in the low part of it is a genuinely different proposition from the cheapest fare of a bad month.`}{' '}
            Google publishes price_insights_low and price_insights_high against the route&apos;s own history, and we pass both
            through untouched.
          </p>
          <p>
            Nothing on this page is an average, a forecast or a seasonality claim. We report what the searches returned, when
            they returned it. If you want the version with error bars, that is your own key and as many sample dates as you care
            to spend.
          </p>
        </div>
      </Section>

      <RouteCrossLinks route={r} currentTool="cheapest-time-to-fly" />

      <Section>
        <FaqSection items={faqFor(r)} />
      </Section>

      <Section>
        <SectionHead eyebrow="Keep going" title="The rest of the toolkit" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/tools/cheapest-time-to-fly', label: 'Any other route', sub: 'The same scanner, empty form' },
            { href: '/tools/cheapest-month-to-fly', label: 'Cheapest Month to Fly', sub: 'Day-by-day grid inside one month' },
            { href: '/tools#free-mcp', label: 'Free MCP server', sub: 'Ask your assistant instead. No key, ad-supported' },
            { href: '/flights-api/parallel-date-scan', label: 'Parallel Date Scan', sub: 'The every-day version on your own key' },
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
