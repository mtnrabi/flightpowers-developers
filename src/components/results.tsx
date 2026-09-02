/**
 * Presentational result renderers — pure components, no hooks, usable from
 * server pages (captured fixtures) and client components (live responses)
 * alike, so canned and live output look identical and are labelled apart.
 */

import type { DealHuntRow, GeoRepeatRun, HotelByName, OnewayFlight, RoundtripItinerary, ScanDay, YearMonth } from '@/lib/fixtures';
import { splitAirline } from '@/lib/format';
import { PriceBand, VerdictBadge } from './ui';

/** Airline string with the operating-carrier clause styled as secondary text. */
export function AirlineLabel({ airline, className = 'text-[13.5px] text-ink-300' }: { airline: string; className?: string }) {
  const { main, operatedBy } = splitAirline(airline);
  return (
    <span className={`${className} min-w-0 break-words`}>
      {main}
      {operatedBy ? <span className="text-[12px] text-ink-500"> · operated by {operatedBy}</span> : null}
    </span>
  );
}

export function SearchHeaderChips({ headers }: { headers: Record<string, string> }) {
  const entries = Object.entries(headers).filter(([k]) => k.startsWith('x-search-'));
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => (
        <span key={k} className="font-mono text-[10.5px] rounded bg-ink-800 border rule px-1.5 py-0.5 text-ink-400">
          {k}: <span className={k === 'x-search-status' ? (v === 'ok' ? 'text-verdict-low' : v === 'degraded' ? 'text-verdict-high' : 'text-verdict-typical') : 'text-ink-300'}>{v}</span>
        </span>
      ))}
    </div>
  );
}

export function FlightRow({ f }: { f: OnewayFlight }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t rule py-3 first:border-t-0">
      <span className="font-mono text-[15px] font-semibold text-ink-100 tabular-nums w-16">{f.price}</span>
      <VerdictBadge verdict={f.price_range_in_relation_to_other_periods} />
      <AirlineLabel airline={f.airline} />
      <span className="font-mono text-[12px] text-ink-400">
        {f.duration} · {f.stops === 0 ? 'nonstop' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`}
      </span>
      <a
        href={f.buy_link}
        rel="noopener nofollow"
        target="_blank"
        className="ml-auto font-mono text-[12px] text-signal-400 hover:text-signal-500 underline underline-offset-4"
      >
        buy_link →
      </a>
    </div>
  );
}

export function FlightResults({ flights, showBand = true }: { flights: OnewayFlight[]; showBand?: boolean }) {
  const withBand = flights.find((f) => f.price_insights_low != null && f.price_insights_high != null);
  const cheapest = flights.reduce((a, b) => (a.price_as_number <= b.price_as_number ? a : b), flights[0]!);
  return (
    <div>
      {showBand && withBand?.price_insights_low != null && withBand.price_insights_high != null ? (
        <div className="mb-4">
          <PriceBand
            low={withBand.price_insights_low}
            high={withBand.price_insights_high}
            price={cheapest.price_as_number}
            label={`Google's price band for this route & dates. Cheapest live fare: ${cheapest.price}`}
          />
        </div>
      ) : null}
      <div>
        {flights.map((f, i) => (
          <FlightRow key={i} f={f} />
        ))}
      </div>
    </div>
  );
}

export function RoundtripRow({ t }: { t: RoundtripItinerary }) {
  return (
    <div className="border-t rule py-3 first:border-t-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-mono text-[15px] font-semibold text-ink-100 tabular-nums w-16">{t.total_price}</span>
        <VerdictBadge verdict={t.price_range_in_relation_to_other_periods} />
        <span className="font-mono text-[12px] text-ink-400">
          {t.total_stops === 0 ? 'nonstop both ways' : `${t.total_stops} total stop${t.total_stops > 1 ? 's' : ''}`}
        </span>
        <a
          href={t.buy_link}
          rel="noopener nofollow"
          target="_blank"
          className="ml-auto font-mono text-[12px] text-signal-400 hover:text-signal-500 underline underline-offset-4"
        >
          buy_link →
        </a>
      </div>
      <div className="mt-1.5 grid grid-cols-1 gap-x-6 gap-y-0.5 sm:grid-cols-2 text-[13px] text-ink-400">
        <span>
          <span className="font-mono text-[11px] text-ink-500 mr-1.5">OUT</span>
          <AirlineLabel airline={t.departure_flight_airline} className="" /> · {t.departure_flight_duration} · {t.departure_flight_departure_description}
        </span>
        <span>
          <span className="font-mono text-[11px] text-ink-500 mr-1.5">RET</span>
          <AirlineLabel airline={t.return_flight_airline} className="" /> · {t.return_flight_duration} · {t.return_flight_departure_description}
        </span>
      </div>
    </div>
  );
}

export function RoundtripResults({ itineraries }: { itineraries: RoundtripItinerary[] }) {
  const withBand = itineraries.find((t) => t.price_insights_low != null && t.price_insights_high != null);
  const cheapest = itineraries.reduce((a, b) => (a.total_price_as_number <= b.total_price_as_number ? a : b), itineraries[0]!);
  return (
    <div>
      {withBand?.price_insights_low != null && withBand.price_insights_high != null ? (
        <div className="mb-4">
          <PriceBand
            low={withBand.price_insights_low}
            high={withBand.price_insights_high}
            price={cheapest.total_price_as_number}
            label={`Google's price band. Cheapest paired itinerary: ${cheapest.total_price}`}
          />
        </div>
      ) : null}
      {itineraries.map((t, i) => (
        <RoundtripRow key={i} t={t} />
      ))}
    </div>
  );
}


/** One steal row from a deal hunt: route, date, price, verdict, buy_link. */
export function StealRow({ r, destName }: { r: DealHuntRow; destName: string }) {
  if (r.price == null) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t rule py-3 first:border-t-0">
      <span className="font-mono text-[15px] font-semibold text-ink-100 tabular-nums w-16">${r.price}</span>
      <VerdictBadge verdict={r.verdict} />
      <span className="text-[13.5px] text-ink-200">{destName}</span>
      <span className="font-mono text-[12px] text-ink-400">
        {new Date(r.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
        {r.airline ? ` · ${r.airline}` : ''}
        {r.stops != null ? ` · ${r.stops === 0 ? 'nonstop' : `${r.stops} stop${r.stops > 1 ? 's' : ''}`}` : ''}
      </span>
      {r.buy_link ? (
        <a
          href={r.buy_link}
          rel="noopener nofollow"
          target="_blank"
          className="ml-auto font-mono text-[12px] text-signal-400 hover:text-signal-500 underline underline-offset-4"
        >
          buy_link →
        </a>
      ) : null}
    </div>
  );
}

/** Destination x date price matrix for a multi-destination hunt. */
export function DealHuntGrid({ rows, destNames, origin }: { rows: DealHuntRow[]; destNames: Record<string, string>; origin: string }) {
  const dests = [...new Set(rows.map((r) => r.dest))];
  const dates = [...new Set(rows.map((r) => r.date))].sort();
  const prices = rows.map((r) => r.price).filter((p): p is number => p != null);
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const cell = new Map(rows.map((r) => [`${r.dest}|${r.date}`, r]));
  return (
    <div className="scroll-x">
      <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-left font-mono text-[10px] uppercase tracking-wider text-ink-500 font-normal pr-2">route</th>
            {dates.map((d) => (
              <th key={d} className="font-mono text-[10px] text-ink-500 font-normal">
                {d.slice(8)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dests.map((dest) => (
            <tr key={dest}>
              <td className="pr-2 font-mono text-[12px] text-ink-300 whitespace-nowrap">{origin}→{dest}</td>
              {dates.map((d) => {
                const r = cell.get(`${dest}|${d}`);
                const p = r?.price ?? null;
                const heat = p == null ? null : (p - min) / span;
                const bg =
                  heat == null
                    ? 'transparent'
                    : heat < 0.2
                      ? 'color-mix(in oklab, var(--color-verdict-low) 24%, transparent)'
                      : heat < 0.55
                        ? 'color-mix(in oklab, var(--color-verdict-typical) 15%, transparent)'
                        : 'color-mix(in oklab, var(--color-verdict-high) 15%, transparent)';
                return (
                  <td
                    key={d}
                    className="rounded-md border rule px-1 py-1.5 text-center font-mono text-[11.5px] tabular-nums"
                    style={{ background: bg }}
                    title={
                      p == null
                        ? `${dest} ${d}: ${r?.status ?? 'no data'}`
                        : `${dest} ${d}: $${p}${r?.verdict ? ` (${r.verdict})` : ''}`
                    }
                  >
                    {p == null ? <span className="text-ink-600">·</span> : <span className={p === min ? 'text-verdict-low font-bold' : 'text-ink-200'}>{p}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <p className="mt-1.5 font-mono text-[10.5px] text-ink-500">
        {destNames && Object.keys(destNames).length ? Object.entries(destNames).map(([c, n]) => `${c} ${n}`).join(' · ') + ' · ' : ''}dots are searches that
        came back degraded and would simply be retried
      </p>
    </div>
  );
}

/** Price-per-day grid for a month scan. */
export function HeatGrid({ days, note }: { days: ScanDay[]; note?: string }) {
  const prices = days.map((d) => d.price).filter((p): p is number => p != null);
  if (prices.length === 0) return <p className="text-sm text-ink-400">No priced days in this scan.</p>;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  return (
    <div>
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
        {days.map((d) => {
          const heat = d.price == null ? null : (d.price - min) / span;
          const bg =
            heat == null
              ? 'transparent'
              : heat < 0.25
                ? 'color-mix(in oklab, var(--color-verdict-low) 22%, transparent)'
                : heat < 0.6
                  ? 'color-mix(in oklab, var(--color-verdict-typical) 16%, transparent)'
                  : 'color-mix(in oklab, var(--color-verdict-high) 16%, transparent)';
          return (
            <div
              key={d.date}
              className="rounded-lg border rule px-1.5 py-2 text-center"
              style={{ background: bg }}
              title={d.price == null ? `${d.date}: ${d.status}` : `${d.date}: $${d.price} (${d.verdict ?? 'no band'})`}
            >
              <p className="font-mono text-[10px] text-ink-500">{d.date.slice(8)}</p>
              <p className={`font-mono text-[12.5px] tabular-nums ${d.price === min ? 'text-verdict-low font-bold' : 'text-ink-200'}`}>
                {d.price == null ? '—' : `$${d.price}`}
              </p>
            </div>
          );
        })}
      </div>
      {note ? <p className="mt-2 font-mono text-[11px] text-ink-500">{note}</p> : null}
    </div>
  );
}


/**
 * Month-by-month price curve for a year scan. Bar length is the fare as a
 * share of the scan's most expensive month (zero-based, so a flat year looks
 * flat); color is relative within the scan, like the month heat grid.
 */
export function YearScanChart({ months, note }: { months: YearMonth[]; note?: string }) {
  const prices = months.map((m) => m.price).filter((p): p is number => p != null);
  if (prices.length === 0) return <p className="text-sm text-ink-400">No priced months in this scan.</p>;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const firstCheapest = months.findIndex((m) => m.price === min);
  return (
    <div>
      <div className="space-y-1.5">
        {months.map((m, i) => {
          const heat = m.price == null ? null : (m.price - min) / span;
          const bg =
            heat == null
              ? 'transparent'
              : heat < 0.25
                ? 'color-mix(in oklab, var(--color-verdict-low) 26%, transparent)'
                : heat < 0.6
                  ? 'color-mix(in oklab, var(--color-verdict-typical) 18%, transparent)'
                  : 'color-mix(in oklab, var(--color-verdict-high) 18%, transparent)';
          const width = m.price == null ? 0 : Math.round((m.price / max) * 100);
          const label = new Date(Date.parse(`${m.month}-01T00:00:00Z`)).toLocaleString('en-US', {
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
          });
          const cheapest = m.price != null && m.price === min;
          const chip = i === firstCheapest;
          return (
            <div key={m.month} className="flex items-center gap-2 sm:gap-3">
              <span className="w-16 shrink-0 font-mono text-[11px] text-ink-400">{label}</span>
              <div
                className="relative h-8 min-w-0 flex-1 overflow-hidden rounded-md border rule bg-ink-950/50"
                title={
                  m.price == null
                    ? `${label}: ${m.status}`
                    : `${label}: $${m.price} departing ${m.date} (${m.verdict ?? 'no band'})`
                }
              >
                {m.price != null ? (
                  <div className="h-full rounded-r-md" style={{ width: `${width}%`, background: bg }} />
                ) : null}
                {chip ? (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[9.5px] uppercase tracking-wider text-verdict-low">
                    cheapest
                  </span>
                ) : null}
                <span
                  className={`absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[12.5px] tabular-nums ${
                    m.price == null ? 'text-ink-500' : cheapest ? 'font-bold text-verdict-low' : 'text-ink-200'
                  }`}
                >
                  {m.price == null ? (m.status === 'empty' ? 'no fares' : 'search failed') : `$${m.price}`}
                </span>
              </div>
              <span className="shrink-0">
                <VerdictBadge verdict={m.verdict} />
              </span>
              {m.buy_link ? (
                <a
                  href={m.buy_link}
                  rel="noopener nofollow"
                  target="_blank"
                  className="w-12 shrink-0 whitespace-nowrap text-right font-mono text-[11px] text-signal-400 underline underline-offset-4 hover:text-signal-500"
                >
                  book →
                </a>
              ) : (
                <span className="w-12 shrink-0" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
      {note ? <p className="mt-2 font-mono text-[11px] text-ink-500">{note}</p> : null}
    </div>
  );
}

const COUNTRY_NAMES: Record<string, string> = {
  us: 'United States', de: 'Germany', il: 'Israel', gb: 'United Kingdom', fr: 'France',
  br: 'Brazil', in: 'India', jp: 'Japan', au: 'Australia', es: 'Spain', it: 'Italy',
  nl: 'Netherlands', tr: 'Türkiye',
};

export function HotelMarketsTable({ markets }: { markets: { country: string; result: HotelByName | null }[] }) {
  const prices = markets.map((m) => m.result?.price).filter((p): p is number => p != null);
  const min = prices.length ? Math.min(...prices) : null;
  const max = prices.length ? Math.max(...prices) : null;
  const name = markets.find((m) => m.result?.name)?.result?.name;
  const room = markets.find((m) => m.result?.room_type)?.result?.room_type;
  return (
    <div>
      {name ? (
        <p className="text-[14px] text-ink-300 mb-3">
          <span className="font-semibold text-ink-100">{name}</span>
          {room ? <span className="text-ink-400"> · {room}</span> : null}
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500">
              <th className="py-2 pr-4 font-normal">Priced from</th>
              <th className="py-2 pr-4 font-normal">proxy_country</th>
              <th className="py-2 pr-4 font-normal text-right">Total for the stay</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => (
              <tr key={m.country} className="border-t rule">
                <td className="py-2.5 pr-4 text-ink-200">{COUNTRY_NAMES[m.country] ?? m.country.toUpperCase()}</td>
                <td className="py-2.5 pr-4 font-mono text-[12px] text-signal-400">&quot;{m.country}&quot;</td>
                <td className="py-2.5 pr-4 text-right font-mono tabular-nums">
                  {m.result == null ? (
                    <span className="text-ink-500">search failed</span>
                  ) : !m.result.available ? (
                    <span className="text-ink-500">sold out</span>
                  ) : (
                    <span className={m.result.price === min && min !== max ? 'text-verdict-low font-semibold' : 'text-ink-100'}>
                      {m.result.price_string}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {min != null && max != null && max > min ? (
        <p className="mt-2 text-[13px] text-ink-300">
          Difference in this sample: <span className="font-mono text-verdict-low">${(max - min).toLocaleString('en-US')}</span> between
          the cheapest and the most expensive market. Rates move between identical requests, so sample each market a few times
          before you call a gap real.
        </p>
      ) : min != null ? (
        <p className="mt-2 text-[13px] text-ink-400">Every market quoted the same rate in this sample.</p>
      ) : null}
    </div>
  );
}

/** min and max of a list of numbers. */
function span(ns: number[]): { lo: number; hi: number } {
  return { lo: Math.min(...ns), hi: Math.max(...ns) };
}

function pct(a: number, b: number): number {
  return Math.round(((b - a) / a) * 100);
}

/**
 * A repeat-sampling run rendered as properties x markets, each cell showing
 * the observed range across identical requests. The point of the shape: you
 * can see how much one market moves on its own before comparing markets.
 */
export function HotelRepeatSamplesTable({ run }: { run: GeoRepeatRun }) {
  const worstWobble = Math.max(
    ...run.properties.flatMap((p) =>
      run.markets.map((m) => {
        const { lo, hi } = span(p.quotes[m] ?? [0]);
        return lo ? pct(lo, hi) : 0;
      })
    )
  );
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500">
              <th className="py-2 pr-4 font-normal">Property</th>
              {run.markets.map((m) => (
                <th key={m} className="py-2 pr-4 font-normal text-right">
                  {COUNTRY_NAMES[m] ?? m.toUpperCase()} <span className="text-signal-400">&quot;{m}&quot;</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {run.properties.map((p) => (
              <tr key={p.name} className="border-t rule">
                <td className="py-2.5 pr-4 text-ink-200">{p.name}</td>
                {run.markets.map((m) => {
                  const quotes = p.quotes[m] ?? [];
                  const { lo, hi } = span(quotes);
                  return (
                    <td key={m} className="py-2.5 pr-4 text-right font-mono tabular-nums text-ink-100">
                      {lo === hi ? lo.toLocaleString('en-US') : `${lo.toLocaleString('en-US')}–${hi.toLocaleString('en-US')}`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 font-mono text-[11px] text-ink-500">
        {run.samples_per_market} identical requests per market. One number means every request came back the same; a range means
        the market moved on its own, by up to {worstWobble}% here.
      </p>
    </div>
  );
}

/**
 * The live tool's result: every market asked more than once, so a difference
 * between markets is only claimed when their observed ranges do not overlap.
 */
export function HotelMarketSamplesTable({
  markets,
}: {
  markets: { country: string; samples: (HotelByName | null)[] }[];
}) {
  const rows = markets.map((m) => {
    const prices = m.samples.filter((s): s is HotelByName => s?.available === true && s.price != null).map((s) => s.price!);
    const first = m.samples.find((s) => s?.price_string);
    return { country: m.country, prices, tries: m.samples.length, currency: first?.price_string ?? null };
  });
  const priced = rows.filter((r) => r.prices.length > 0);
  const name = markets.flatMap((m) => m.samples).find((s) => s?.name)?.name;
  const room = markets.flatMap((m) => m.samples).find((s) => s?.room_type)?.room_type;

  const ranges = priced.map((r) => ({ country: r.country, ...span(r.prices) }));
  const lowest = ranges.length ? ranges.reduce((a, b) => (a.hi <= b.hi ? a : b)) : null;
  const highest = ranges.length ? ranges.reduce((a, b) => (a.lo >= b.lo ? a : b)) : null;
  const separated = lowest && highest && lowest.country !== highest.country && lowest.hi < highest.lo;

  return (
    <div>
      {name ? (
        <p className="text-[14px] text-ink-300 mb-3">
          <span className="font-semibold text-ink-100">{name}</span>
          {room ? <span className="text-ink-400"> · {room}</span> : null}
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500">
              <th className="py-2 pr-4 font-normal">Priced from</th>
              <th className="py-2 pr-4 font-normal">proxy_country</th>
              <th className="py-2 pr-4 font-normal text-right">Each request</th>
              <th className="py-2 pr-4 font-normal text-right">Observed range</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const { lo, hi } = r.prices.length ? span(r.prices) : { lo: 0, hi: 0 };
              return (
                <tr key={r.country} className="border-t rule">
                  <td className="py-2.5 pr-4 text-ink-200">{COUNTRY_NAMES[r.country] ?? r.country.toUpperCase()}</td>
                  <td className="py-2.5 pr-4 font-mono text-[12px] text-signal-400">&quot;{r.country}&quot;</td>
                  <td className="py-2.5 pr-4 text-right font-mono text-[12px] tabular-nums text-ink-400">
                    {r.prices.length ? r.prices.map((p) => p.toLocaleString('en-US')).join(' · ') : 'n/a'}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono tabular-nums">
                    {r.prices.length === 0 ? (
                      <span className="text-ink-500">no rate came back</span>
                    ) : lo === hi ? (
                      <span className="text-ink-100">{lo.toLocaleString('en-US')}</span>
                    ) : (
                      <span className="text-ink-100">
                        {lo.toLocaleString('en-US')}–{hi.toLocaleString('en-US')}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {separated ? (
        <p className="mt-2 text-[13px] text-ink-300">
          Every {COUNTRY_NAMES[lowest!.country] ?? lowest!.country.toUpperCase()} request came in below every{' '}
          {COUNTRY_NAMES[highest!.country] ?? highest!.country.toUpperCase()} request. Ranges that do not overlap are the point at
          which a gap is worth acting on.
        </p>
      ) : priced.length > 1 ? (
        <p className="mt-2 text-[13px] text-ink-400">
          The markets&apos; ranges overlap. On this many samples that is not yet a gap: run it again, or take the check to your own
          key where you can sample as often as you like.
        </p>
      ) : null}
    </div>
  );
}
