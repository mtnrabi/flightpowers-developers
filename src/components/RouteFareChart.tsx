import { airlineText } from '@/lib/format';
import { dayLabel, money, type FarePoint } from '@/lib/route-fares';

/**
 * One route's fetched one-way fares as a bar per departure date (server-rendered SVG).
 *
 * Single series, so no legend: the heading names it. Bars start at zero (a fare chart
 * that crops the axis makes a $20 gap look like half the price). The cheapest bar is
 * the only one direct-labelled; every bar carries a native tooltip (<title>) with its
 * date, fare and Google's verdict, and the full table sits under the chart for anyone
 * who cannot hover. A date with no fare is a gap with a small mark at the baseline,
 * labelled in its tooltip as "no flights found" or "search failed", never filled in.
 */
export function RouteFareChart({ points, cheapestDate }: { points: FarePoint[]; cheapestDate: string }) {
  const W = 720;
  const H = 280;
  const pad = { l: 46, r: 12, t: 30, b: 34 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const prices = points.flatMap((p) => (p.status === 'ok' && p.fare ? [p.fare.price] : []));
  const max = Math.max(...prices);
  const step = niceStep(max);
  const top = Math.ceil((max * 1.08) / step) * step;
  const y = (v: number) => pad.t + ih - (v / top) * ih;
  const slot = iw / points.length;
  const bw = Math.max(4, Math.min(22, slot - 4));
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);

  // A month label under the first departure date of each month, skipped when it would sit
  // within three bars of the previous label (Nov 25 and Dec 2 would otherwise collide).
  // The year is printed on the first label and on every January.
  const monthStarts: { i: number; ym: string; text: string }[] = [];
  points.forEach((p, i) => {
    const ym = p.date.slice(0, 7);
    const prev = monthStarts[monthStarts.length - 1];
    if (i > 0 && points[i - 1]!.date.slice(0, 7) === ym) return;
    if (prev && i - prev.i < 3) return;
    const mon = dayLabel(`${ym}-01`, false).split(' ')[0]!;
    monthStarts.push({ i, ym, text: !prev || ym.endsWith('-01') ? `${mon} ${ym.slice(0, 4)}` : mon });
  });

  return (
    <figure className="rounded-2xl border rule bg-ink-900/60 p-3 sm:p-5">
      <div className="overflow-x-auto"><svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[560px]" role="img" aria-label="Cheapest one-way fare by departure date">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--color-ink-700)" strokeWidth={v === 0 ? 1.2 : 0.6} />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--color-ink-400)" fontFamily="var(--font-mono)">
              {money(v)}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const cx = pad.l + slot * i + slot / 2;
          if (p.status !== 'ok' || !p.fare) {
            return (
              <g key={p.date}>
                <title>{`${dayLabel(p.date)}: ${p.status === 'empty' ? 'no flights found' : 'search failed'}`}</title>
                <rect x={cx - slot / 2} y={pad.t} width={slot} height={ih} fill="transparent" />
                <path d={`M${cx - 3} ${pad.t + ih - 9} l6 6 m0 -6 l-6 6`} stroke="var(--color-ink-400)" strokeWidth="1.4" />
              </g>
            );
          }
          const isMin = p.date === cheapestDate;
          const h = Math.max(2, pad.t + ih - y(p.fare.price));
          const bx = cx - bw / 2;
          const by = pad.t + ih - h;
          const r = Math.min(4, bw / 2);
          return (
            <g key={p.date}>
              <title>{`${dayLabel(p.date)}: ${money(p.fare.price)}${p.fare.airline ? `, ${airlineText(p.fare.airline)}` : ''}${p.fare.verdict ? ` (Google: ${p.fare.verdict})` : ''}`}</title>
              {/* hit target: the whole column, wider than the bar */}
              <rect x={cx - slot / 2} y={pad.t} width={slot} height={ih} fill="transparent" />
              <path
                d={`M${bx} ${by + h} V${by + r} Q${bx} ${by} ${bx + r} ${by} H${bx + bw - r} Q${bx + bw} ${by} ${bx + bw} ${by + r} V${by + h} Z`}
                fill={isMin ? 'var(--color-signal-400)' : 'var(--color-signal-600)'}
                opacity={isMin ? 1 : 0.75}
              />
              {isMin ? (
                <text x={cx} y={by - 8} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--color-ink-100)" fontFamily="var(--font-mono)">
                  {money(p.fare.price)}
                </text>
              ) : null}
            </g>
          );
        })}
        {monthStarts.map(({ i, ym, text }) => (
          <text key={ym} x={pad.l + slot * i + 2} y={H - 10} fontSize="11" fill="var(--color-ink-300)" fontFamily="var(--font-mono)">
            {text}
          </text>
        ))}
      </svg></div>
      <figcaption className="mt-2 px-1 text-[13px] leading-relaxed text-ink-400">
        One bar per departure date: the cheapest one-way fare found that day. The brightest bar is the cheapest. A cross at the
        baseline marks a date with no fare (hover or tap it for the reason).
        <span className="sm:hidden"> Swipe the chart for later dates.</span>
      </figcaption>
    </figure>
  );
}

function niceStep(max: number): number {
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}
