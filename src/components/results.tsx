/**
 * Presentational result renderers — pure components, no hooks, usable from
 * server pages (captured fixtures) and client components (live responses)
 * alike, so canned and live output look identical and are labelled apart.
 */

import type { HotelByName, OnewayFlight, RoundtripItinerary, ScanDay } from '@/lib/fixtures';
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
            label={`Google's price band for this route & dates — cheapest live fare ${cheapest.price}`}
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
      <div className="mt-1.5 grid gap-x-6 gap-y-0.5 sm:grid-cols-2 text-[13px] text-ink-400">
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
            label={`Google's price band — cheapest paired itinerary ${cheapest.total_price}`}
          />
        </div>
      ) : null}
      {itineraries.map((t, i) => (
        <RoundtripRow key={i} t={t} />
      ))}
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
          Spread: <span className="font-mono text-verdict-low">${(max - min).toLocaleString('en-US')}</span> between the cheapest and the
          most expensive market for the same room.
        </p>
      ) : min != null ? (
        <p className="mt-2 text-[13px] text-ink-400">All markets quoted the same rate — parity holding is an answer too.</p>
      ) : null}
    </div>
  );
}
