import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CodeTabs } from '@/components/CodeTabs';
import { CopyPrompt } from '@/components/CopyPrompt';
import { PlanBox } from '@/components/PlanBox';
import { RouteFareChart } from '@/components/RouteFareChart';
import { Breadcrumbs, Container, FaqSection, JsonLd, Section, SectionHead, VerdictBadge, type Faq } from '@/components/ui';
import { airlineText } from '@/lib/format';
import { withOg } from '@/lib/meta';
import {
  allRouteFares,
  dayLabel,
  findRouteFares,
  money,
  relatedRouteFares,
  routeFareDescription,
  routeFareTitle,
  routeDatasetJsonLd,
  routeName,
  spacingText,
  type RouteFares,
} from '@/lib/route-fares';
import { onewaySnippets } from '@/lib/snippets';
import { COUNTS, SITE } from '@/lib/site';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return allRouteFares().map((r) => ({ route: r.slug }));
}

type Props = { params: Promise<{ route: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { route } = await params;
  const r = findRouteFares(route);
  if (!r) return {};
  const title = routeFareTitle(r);
  return {
    ...withOg({ title, description: routeFareDescription(r), alternates: { canonical: `/flights/${r.slug}` } }),
    title: title.length > 45 ? { absolute: title } : title,
  };
}

const stopsText = (n: number | null) => (n == null ? '' : n === 0 ? 'nonstop' : n === 1 ? '1 stop' : `${n} stops`);

function bandSentence(r: RouteFares): string | null {
  const f = r.cheapest.fare;
  if (f.band_low == null || f.band_high == null) return null;
  return `For that date Google put the usual range for this route at ${money(f.band_low)} to ${money(f.band_high)}${f.verdict ? ` and marked the fare ${f.verdict}` : ''}.`;
}

function faqFor(r: RouteFares): Faq[] {
  const c = r.cheapest;
  const m = r.cheapestMonth;
  const n = r.priced.length;
  const v = r.verdictCounts;
  const band = bandSentence(r);
  return [
    {
      q: `What is the cheapest month to fly ${routeName(r)}?`,
      a: `In our searches it was ${m.label}: the lowest one-way fare we found that month was ${money(m.cheapest!.fare.price)}, departing ${dayLabel(m.cheapest!.date)}. That comes from ${m.searched} departure date${m.searched === 1 ? '' : 's'} searched in ${m.label}, fetched between ${dayLabel(r.fetchedFirst)} and ${dayLabel(r.fetchedLast)}. Fares move daily, so it is a sample of the season, not a forecast.`,
    },
    {
      q: `What was the cheapest ${r.from.iata} to ${r.to.iata} fare you found?`,
      a: `${money(c.fare.price)} one-way for one adult in economy, departing ${dayLabel(c.date)}${c.fare.airline ? ` on ${airlineText(c.fare.airline)}` : ''}${c.fare.stops != null ? `, ${stopsText(c.fare.stops)}` : ''}. It was fetched on ${dayLabel(c.fetched_at.slice(0, 10))}.${band ? ` ${band}` : ''}`,
    },
    {
      q: 'How often did Google call a fare low, typical or high?',
      a: `Of the ${n} departure dates that returned a fare, Google marked the cheapest fare low on ${v.low}, typical on ${v.typical} and high on ${v.high}${v.none ? `, and showed no verdict on ${v.none}` : ''}. The verdict compares a fare with that route's own price history, so it tells you whether a cheap date is cheap for this route, not just cheaper than its neighbours.`,
    },
    {
      q: 'Where do these prices come from?',
      a: `From real searches of Google Flights run through our own flights API, one per departure date, the same request shown on this page. Nothing is averaged or estimated, and a date that returned no fare is shown as a gap. Prices change within minutes, so check the live fare before you book.`,
    },
    {
      q: `Can I get the same data for other dates or routes?`,
      a: `Yes. Every date here is one API request, so a different route, every day of a month, or the round trip is the same request with other values. The flights API allows ${COUNTS.flightsRateLimits} requests per minute on its Pro, Ultra and Mega plans, so a whole season is one parallel burst.`,
    },
  ];
}

export default async function Page({ params }: Props) {
  const { route } = await params;
  const r = findRouteFares(route);
  if (!r) notFound();

  const c = r.cheapest;
  const url = `${SITE.url}/flights/${r.slug}`;
  const faqs = faqFor(r);
  const band = bandSentence(r);
  const first = r.points[0]!.date;
  const last = r.points[r.points.length - 1]!.date;
  const failed = r.points.filter((p) => p.status === 'failed').length;
  const empty = r.points.filter((p) => p.status === 'empty').length;
  const prompt = `Find the cheapest one-way flight from ${r.from.iata} to ${r.to.iata} on any day in ${r.cheapestMonth.label}, and tell me how Google rates that price.`;
  const related = relatedRouteFares(r);
  const sp = spacingText(r);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Flight prices by route', item: `${SITE.url}/flights` },
            { '@type': 'ListItem', position: 2, name: `${r.from.iata} to ${r.to.iata}`, item: url },
          ],
        }}
      />
      <JsonLd data={routeDatasetJsonLd(r, SITE.url)} />

      <Container className="pt-14 sm:pt-20 pb-8">
        <Breadcrumbs
          trail={[
            { href: '/flights', label: 'flights' },
            { href: `/flights/${r.slug}`, label: r.slug },
          ]}
        />
        <p className="eyebrow mt-6">
          Fetched fares · {r.from.iata} → {r.to.iata} · one-way
        </p>
        <h1 className="mt-4 text-[2.1rem] sm:text-[3.1rem] leading-[1.05] font-semibold max-w-3xl">
          {r.from.city} to {r.to.city}: <span className="text-signal-500">the cheapest dates to fly</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          We searched {r.points.length} departure dates, {sp.cadence} from {dayLabel(first)} to {dayLabel(last)}. The cheapest one-way
          fare was <strong className="text-ink-100">{money(c.fare.price)}</strong> on {dayLabel(c.date)}, and the cheapest month was{' '}
          {r.cheapestMonth.label}. {band}
        </p>
        <p className="mt-3 font-mono text-[12px] text-ink-400">
          {r.from.name} ({r.from.iata}) to {r.to.name} ({r.to.iata}) · 1 adult, economy, USD · fetched {dayLabel(r.fetchedFirst)}
          {r.fetchedLast !== r.fetchedFirst ? ` to ${dayLabel(r.fetchedLast)}` : ''}
        </p>
      </Container>

      <Container className="pb-12">
        <RouteFareChart points={r.points} cheapestDate={c.date} />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">Cheapest date</p>
            <p className="mt-2 text-2xl font-semibold text-ink-100">{money(c.fare.price)}</p>
            <p className="mt-1 text-[13.5px] text-ink-300">
              {dayLabel(c.date)}
              {c.fare.airline ? ` · ${airlineText(c.fare.airline)}` : ''}
              {c.fare.stops != null ? ` · ${stopsText(c.fare.stops)}` : ''}
            </p>
            {c.fare.buy_link ? (
              <a href={c.fare.buy_link} rel="nofollow noopener" target="_blank" className="mt-2 inline-block text-[13px] text-signal-400 underline underline-offset-4">
                Check it on Google Flights →
              </a>
            ) : null}
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">Cheapest month</p>
            <p className="mt-2 text-2xl font-semibold text-ink-100">{r.cheapestMonth.label}</p>
            <p className="mt-1 text-[13.5px] text-ink-300">
              from {money(r.cheapestMonth.cheapest!.fare.price)} · {r.cheapestMonth.searched} date{r.cheapestMonth.searched === 1 ? '' : 's'} searched
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">Google&apos;s verdicts</p>
            <p className="mt-2 text-[15px] text-ink-100">
              {r.verdictCounts.low} low · {r.verdictCounts.typical} typical · {r.verdictCounts.high} high
            </p>
            <p className="mt-1 text-[13.5px] text-ink-300">on the cheapest fare of each of {r.priced.length} priced dates</p>
          </div>
        </div>
      </Container>

      <Section>
        <SectionHead eyebrow="Month by month" title={`${r.from.iata} to ${r.to.iata}: the cheapest fare we found each month`} />
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[14px]">
            <thead className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400">
              <tr>
                <th className="py-2 pr-4 font-normal">Month</th>
                <th className="py-2 pr-4 font-normal">Cheapest</th>
                <th className="py-2 pr-4 font-normal">Departing</th>
                <th className="py-2 pr-4 font-normal">Google</th>
                <th className="py-2 font-normal">Dates searched</th>
              </tr>
            </thead>
            <tbody className="text-ink-200">
              {r.months.map((m) => (
                <tr key={m.month} className="border-t rule">
                  <td className="py-2.5 pr-4">{m.label}</td>
                  <td className="py-2.5 pr-4 font-mono">{m.cheapest ? money(m.cheapest.fare.price) : 'no fare'}</td>
                  <td className="py-2.5 pr-4">{m.cheapest ? dayLabel(m.cheapest.date, false) : '-'}</td>
                  <td className="py-2.5 pr-4">{m.cheapest ? <VerdictBadge verdict={m.cheapest.fare.verdict} /> : '-'}</td>
                  <td className="py-2.5">
                    {m.priced} of {m.searched} priced
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details className="mt-6">
          <summary className="cursor-pointer text-[14px] text-signal-400">Every departure date ({r.points.length})</summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13.5px]">
              <thead className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400">
                <tr>
                  <th className="py-2 pr-4 font-normal">Date</th>
                  <th className="py-2 pr-4 font-normal">Fare</th>
                  <th className="py-2 pr-4 font-normal">Airline</th>
                  <th className="py-2 pr-4 font-normal">Stops</th>
                  <th className="py-2 pr-4 font-normal">Google range</th>
                  <th className="py-2 font-normal">Fetched</th>
                </tr>
              </thead>
              <tbody className="text-ink-300">
                {r.points.map((p) => (
                  <tr key={p.date} className="border-t rule">
                    <td className="py-2 pr-4">{dayLabel(p.date)}</td>
                    <td className="py-2 pr-4 font-mono">
                      {p.fare ? money(p.fare.price) : p.status === 'empty' ? 'no flights found' : 'search failed'}
                    </td>
                    <td className="py-2 pr-4">{p.fare?.airline ? airlineText(p.fare.airline) : '-'}</td>
                    <td className="py-2 pr-4">{p.fare ? stopsText(p.fare.stops) || '-' : '-'}</td>
                    <td className="py-2 pr-4 font-mono">
                      {p.fare && p.fare.band_low != null && p.fare.band_high != null
                        ? `${money(p.fare.band_low)}-${money(p.fare.band_high)}${p.fare.verdict ? ` (${p.fare.verdict})` : ''}`
                        : '-'}
                    </td>
                    <td className="py-2 font-mono">{dayLabel(p.fetched_at.slice(0, 10), false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Section>

      <Section>
        <SectionHead eyebrow="How to read this" title="What these numbers are, and what they are not" />
        <div className="mt-8 space-y-4 text-[15px] text-ink-300 leading-relaxed max-w-3xl">
          <p>
            Each bar is one real search of Google Flights for that departure date: one adult, economy, one-way, in US dollars, and
            the cheapest fare it returned. We searched departure dates {sp.cadence}
            {sp.weekday ? ` (every ${sp.weekday})` : ''}, so a cheap day between two searched dates does not show up here.
          </p>
          <p>
            The fares are what Google showed on the day we fetched them ({dayLabel(r.fetchedFirst)}
            {r.fetchedLast !== r.fetchedFirst ? ` to ${dayLabel(r.fetchedLast)}` : ''}). They move within minutes, so treat this
            page as the shape of the season and check the live fare before you book.
            {failed || empty
              ? ` ${failed ? `${failed} date${failed === 1 ? '' : 's'} did not complete` : ''}${failed && empty ? ' and ' : ''}${empty ? `${empty} returned no flights` : ''}; they are gaps in the chart, not zeros.`
              : ''}
          </p>
          <p>
            Google&apos;s low, typical and high verdict compares a fare with this route&apos;s own history. It is the useful part
            when a whole month is expensive: the cheapest date of a bad month can still read high.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Get this data via the API"
          title="The exact request behind each bar"
          lede={`Every date on this page is one request to the Google Flights Live API. Here is the one for the cheapest date, ${dayLabel(c.date)}. Change the date to fill in any other bar, or loop it over a month.`}
        />
        <div className="mt-8 max-w-3xl">
          <CodeTabs snippets={onewaySnippets({ from: r.from.iata, to: r.to.iata, date: c.date })} tool="route-page" />
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink-400">
            The response is a JSON list of flights with price, airline, stops, duration, a booking link, and Google&apos;s{' '}
            <code className="font-mono text-[0.9em]">price_insights_low</code>,{' '}
            <code className="font-mono text-[0.9em]">price_insights_high</code> and verdict where Google shows them. More in the{' '}
            <Link href="/flights-api/one-way" className="text-signal-400 underline underline-offset-4">
              one-way docs
            </Link>{' '}
            and the{' '}
            <Link href="/flights-api/parallel-date-scan" className="text-signal-400 underline underline-offset-4">
              parallel date scan guide
            </Link>
            .
          </p>
        </div>
        <div className="mt-10 max-w-3xl">
          <p className="text-[15px] font-semibold text-ink-100">Or ask your AI app</p>
          <p className="mt-1.5 mb-3 text-[14px] text-ink-400 leading-relaxed">
            With the flights connector in Claude, Cursor or ChatGPT, a whole month of dates is one sentence:
          </p>
          <CopyPrompt prompt={prompt} tool="route-page" />
        </div>
        <PlanBox page={`/flights/${r.slug}`} listings={['flights']} medium="tool" title="Run these searches on your own key" mcp />
      </Section>

      {related.length ? (
        <Section>
          <SectionHead eyebrow="More routes" title="Nearby routes we fetched" />
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((o) => (
              <Link key={o.slug} href={`/flights/${o.slug}`} className="rounded-2xl border rule bg-ink-900/50 p-5 transition-colors hover:border-ink-500">
                <p className="text-[15px] font-semibold text-ink-100">{routeName(o)}</p>
                <p className="mt-1 text-[13px] text-ink-400">
                  {o.from.iata} → {o.to.iata} · from {money(o.cheapest.fare.price)} on {dayLabel(o.cheapest.date, false)}
                </p>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-[14px]">
            <Link href="/flights" className="text-signal-400 underline underline-offset-4">
              All {allRouteFares().length} routes →
            </Link>
          </p>
        </Section>
      ) : null}

      <Section>
        <FaqSection items={faqs} />
      </Section>
    </>
  );
}
