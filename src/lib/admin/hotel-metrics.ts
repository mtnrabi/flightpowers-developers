import 'server-only';
import { neon } from '@neondatabase/serverless';
import {
  HISTOGRAM_EDGES_MS,
  percentileFromHistogram,
  percentileIsOverflow,
  resolutionFor,
} from './lane-metrics';
import type { Resolution } from './lane-metrics';

/**
 * Reads `hotel_metrics_10m` and `hotel_top_users_daily` — the Booking half of
 * the admin dashboard.
 *
 * WHO WRITES THESE TABLES. Not this repo, and not flight_rabbi either. The
 * hotels Lambdas (`hotelAgent`, `multipleHotelsAgent`) are in eu-central-1
 * under a different AWS identity, so their rollup is a workflow in
 * mtnrabi/hotel_agent pointing at this same Neon database. The schema is
 * created by flight_rabbi's `backend/ops/lane_metrics.sql` (mirrored here as
 * `db/0004_lane_metrics.sql`) so that one migration sets up both products.
 * Until that rollup exists the tables are empty and the tab says so.
 *
 * THE SAME HISTOGRAM EDGES AS FLIGHTS. Imported, not redeclared, so a hotels
 * p50 and a flights p50 mean the same thing and cannot drift apart.
 *
 * `source` IS NOT A CUSTOMER COUNT, AND THAT IS WHY IT IS A DIMENSION HERE.
 * On 2026-09-12 a read of 124 `source=rapidapi` lines was taken for 124
 * customer calls; 79 of them were the bulk listing fanning out one untagged
 * `hotel_by_name` per name to hotelAgent, 26 were ours and 8 were Apify. Since
 * the 09-13 deploy every line carries its own `source`, and the dashboard
 * splits by it everywhere rather than reporting one total anybody can misread.
 */

export type HotelOutcome = 'ok' | 'available_false' | 'error_4xx' | 'error_5xx';

export type HotelToolSummary = {
  tool: string;
  calls: number;
  okCalls: number;
  availableFalse: number;
  error4xx: number;
  error5xx: number;
  avgMs: number | null;
  p50Ms: number | null;
  p90Ms: number | null;
  /** the percentile landed in the unbounded `>= 90 s` bucket */
  p50Overflow: boolean;
  p90Overflow: boolean;
};

export type HotelSourceSummary = {
  source: string;
  calls: number;
  availableFalse: number;
  error5xx: number;
};

export type HotelPoint = {
  t: string;
  calls: number;
  /** calls keyed by tool */
  byTool: Record<string, number>;
  /** calls keyed by source */
  bySource: Record<string, number>;
  /** calls keyed by outcome */
  byOutcome: Record<string, number>;
  /** average wall clock keyed by tool */
  avgMsByTool: Record<string, number | null>;
};

export type HotelTopUser = {
  user: string;
  calls: number;
  bySource: Record<string, number>;
};

export type HotelMetrics = {
  range: { fromIso: string; toIso: string; resolution: Resolution };
  empty: boolean;
  /** true when the tables do not exist yet — the rollup has not been built */
  schemaMissing: boolean;
  tools: string[];
  sources: string[];
  byTool: HotelToolSummary[];
  bySource: HotelSourceSummary[];
  series: HotelPoint[];
  topUsers: HotelTopUser[];
  totals: {
    calls: number;
    okCalls: number;
    availableFalse: number;
    error4xx: number;
    error5xx: number;
    availableFalseShare: number | null;
    error5xxShare: number | null;
    avgMs: number | null;
    p50Ms: number | null;
    p90Ms: number | null;
    p50Overflow: boolean;
    p90Overflow: boolean;
    /** callers seen in hotel_top_users_daily over the range, `-` excluded */
    namedCallers: number;
    /** calls whose caller could not be attributed */
    unattributedCalls: number;
  };
};

type Sql = ReturnType<typeof neon>;

let client: Sql | null = null;

function getClient(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  if (!client) client = neon(url);
  return client;
}

function num(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function average(sum: number, n: number): number | null {
  return n > 0 ? Math.round(sum / n) : null;
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

function bucketExpression(resolution: Resolution): string {
  if (resolution === '1h') return "date_trunc('hour', bucket_ts)";
  if (resolution === '1d') return "date_trunc('day', bucket_ts)";
  return 'bucket_ts';
}

/** `relation ... does not exist` — the rollup has not been built yet. */
export function isMissingRelation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /relation .*(hotel_metrics_10m|hotel_top_users_daily).* does not exist/i.test(message);
}

const EMPTY_HIST = () => new Array(HISTOGRAM_EDGES_MS.length + 1).fill(0) as number[];

export async function fetchHotelMetrics(fromMs: number, toMs: number): Promise<HotelMetrics> {
  const resolution = resolutionFor(fromMs, toMs);
  const from = new Date(fromMs).toISOString();
  const to = new Date(toMs).toISOString();

  const blank = (): HotelMetrics => ({
    range: { fromIso: from, toIso: to, resolution },
    empty: true,
    schemaMissing: false,
    tools: [],
    sources: [],
    byTool: [],
    bySource: [],
    series: [],
    topUsers: [],
    totals: {
      calls: 0,
      okCalls: 0,
      availableFalse: 0,
      error4xx: 0,
      error5xx: 0,
      availableFalseShare: null,
      error5xxShare: null,
      avgMs: null,
      p50Ms: null,
      p90Ms: null,
      p50Overflow: false,
      p90Overflow: false,
      namedCallers: 0,
      unattributedCalls: 0,
    },
  });

  const sql = getClient();

  // ONE series query, grouped by every dimension at once. Summing its rows
  // gives the totals exactly, so there is no second "totals" query that could
  // disagree with the chart underneath it.
  let seriesRows: Array<Record<string, unknown>>;
  let histRows: Array<Record<string, unknown>>;
  let userRows: Array<Record<string, unknown>>;
  try {
    [seriesRows, histRows, userRows] = (await Promise.all([
      sql.query(
        `SELECT ${bucketExpression(resolution)} AS t,
                tool, source, outcome,
                SUM(calls)  AS calls,
                SUM(sum_ms) AS sum_ms,
                SUM((SELECT COALESCE(SUM(x), 0) FROM unnest(hist) AS x)) AS samples
           FROM hotel_metrics_10m
          WHERE bucket_ts >= $1 AND bucket_ts < $2
          GROUP BY 1, tool, source, outcome
          ORDER BY 1 ASC`,
        [from, to]
      ),
      // Element-wise histogram sums per tool. Postgres has no array sum, so
      // `unnest ... WITH ORDINALITY` turns position into a group key.
      sql.query(
        `SELECT tool, ord, SUM(v) AS n
           FROM hotel_metrics_10m,
                LATERAL unnest(hist) WITH ORDINALITY AS t(v, ord)
          WHERE bucket_ts >= $1 AND bucket_ts < $2
          GROUP BY tool, ord`,
        [from, to]
      ),
      // Top users is a DAILY table, so the range is taken at day granularity.
      // A partial first or last day is included whole; the alternative is
      // pretending to an hourly precision the table does not have.
      sql.query(
        `SELECT user_name, source, SUM(calls) AS calls
           FROM hotel_top_users_daily
          WHERE day >= $1::date AND day <= $2::date
          GROUP BY user_name, source`,
        [from.slice(0, 10), to.slice(0, 10)]
      ),
    ])) as Array<Array<Record<string, unknown>>>;
  } catch (error) {
    if (isMissingRelation(error)) {
      return { ...blank(), schemaMissing: true };
    }
    throw error;
  }

  if (seriesRows.length === 0 && userRows.length === 0) return blank();

  // ---- shape ------------------------------------------------------------

  const tools = new Set<string>();
  const sources = new Set<string>();

  type ToolAcc = { calls: number; sumMs: number; samples: number } & Record<HotelOutcome, number>;
  const newToolAcc = (): ToolAcc => ({
    calls: 0,
    sumMs: 0,
    samples: 0,
    ok: 0,
    available_false: 0,
    error_4xx: 0,
    error_5xx: 0,
  });

  const toolAcc = new Map<string, ToolAcc>();
  const sourceAcc = new Map<string, HotelSourceSummary>();
  const pointIndex = new Map<string, HotelPoint & { _byToolSum: Record<string, [number, number]> }>();
  const series: (HotelPoint & { _byToolSum: Record<string, [number, number]> })[] = [];

  let calls = 0;
  let sumMs = 0;
  let samples = 0;
  const outcomeTotals: Record<string, number> = {};

  for (const row of seriesRows) {
    const tool = String(row.tool);
    const source = String(row.source);
    const outcome = String(row.outcome);
    const t = new Date(String(row.t)).toISOString();
    const n = num(row.calls);
    const ms = num(row.sum_ms);
    const s = num(row.samples);

    tools.add(tool);
    sources.add(source);

    calls += n;
    sumMs += ms;
    samples += s;
    outcomeTotals[outcome] = (outcomeTotals[outcome] ?? 0) + n;

    const tAcc = toolAcc.get(tool) ?? newToolAcc();
    tAcc.calls += n;
    tAcc.sumMs += ms;
    tAcc.samples += s;
    if (outcome === 'ok' || outcome === 'available_false' || outcome === 'error_4xx' || outcome === 'error_5xx') {
      tAcc[outcome] += n;
    }
    toolAcc.set(tool, tAcc);

    const sAcc = sourceAcc.get(source) ?? { source, calls: 0, availableFalse: 0, error5xx: 0 };
    sAcc.calls += n;
    if (outcome === 'available_false') sAcc.availableFalse += n;
    if (outcome === 'error_5xx') sAcc.error5xx += n;
    sourceAcc.set(source, sAcc);

    let point = pointIndex.get(t);
    if (!point) {
      point = {
        t,
        calls: 0,
        byTool: {},
        bySource: {},
        byOutcome: {},
        avgMsByTool: {},
        _byToolSum: {},
      };
      pointIndex.set(t, point);
      series.push(point);
    }
    point.calls += n;
    point.byTool[tool] = (point.byTool[tool] ?? 0) + n;
    point.bySource[source] = (point.bySource[source] ?? 0) + n;
    point.byOutcome[outcome] = (point.byOutcome[outcome] ?? 0) + n;
    const running = (point._byToolSum[tool] ??= [0, 0]);
    running[0] += ms;
    running[1] += s;
  }

  series.sort((a, b) => a.t.localeCompare(b.t));
  const cleanSeries: HotelPoint[] = series.map((point) => {
    const avgMsByTool: Record<string, number | null> = {};
    for (const [tool, [ms, n]] of Object.entries(point._byToolSum)) {
      avgMsByTool[tool] = average(ms, n);
    }
    return {
      t: point.t,
      calls: point.calls,
      byTool: point.byTool,
      bySource: point.bySource,
      byOutcome: point.byOutcome,
      avgMsByTool,
    };
  });

  // Histograms per tool, and one overall.
  const toolHist = new Map<string, number[]>();
  const overallHist = EMPTY_HIST();
  for (const row of histRows) {
    const tool = String(row.tool);
    const index = num(row.ord) - 1;
    const n = num(row.n);
    if (index < 0 || index >= overallHist.length) continue;
    const hist = toolHist.get(tool) ?? EMPTY_HIST();
    hist[index] += n;
    toolHist.set(tool, hist);
    overallHist[index] += n;
  }

  const byTool: HotelToolSummary[] = Array.from(tools)
    .sort()
    .map((tool) => {
      const acc = toolAcc.get(tool) ?? newToolAcc();
      const hist = toolHist.get(tool) ?? EMPTY_HIST();
      return {
        tool,
        calls: acc.calls,
        okCalls: acc.ok,
        availableFalse: acc.available_false,
        error4xx: acc.error_4xx,
        error5xx: acc.error_5xx,
        avgMs: average(acc.sumMs, acc.samples),
        p50Ms: percentileFromHistogram(hist, 0.5),
        p90Ms: percentileFromHistogram(hist, 0.9),
        p50Overflow: percentileIsOverflow(hist, 0.5),
        p90Overflow: percentileIsOverflow(hist, 0.9),
      };
    });

  const bySource = Array.from(sourceAcc.values()).sort((a, b) => b.calls - a.calls);

  // ---- top users --------------------------------------------------------
  // `-` is the unattributed bucket. It is kept OUT of the ranking, because a
  // list of our biggest customers headed by "unknown" is not a list of
  // customers -- but its size is reported as its own number, because an
  // unattributed share that grows is a bug in the attribution, not noise.
  const userAcc = new Map<string, HotelTopUser>();
  let unattributedCalls = 0;
  for (const row of userRows) {
    const user = String(row.user_name);
    const source = String(row.source);
    const n = num(row.calls);
    if (user === '-' || user === '') {
      unattributedCalls += n;
      continue;
    }
    const entry = userAcc.get(user) ?? { user, calls: 0, bySource: {} };
    entry.calls += n;
    entry.bySource[source] = (entry.bySource[source] ?? 0) + n;
    userAcc.set(user, entry);
  }
  const topUsers = Array.from(userAcc.values())
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 25);

  const availableFalse = outcomeTotals.available_false ?? 0;
  const error5xx = outcomeTotals.error_5xx ?? 0;

  return {
    range: { fromIso: from, toIso: to, resolution },
    empty: calls === 0,
    schemaMissing: false,
    tools: Array.from(tools).sort(),
    sources: Array.from(sources).sort(),
    byTool,
    bySource,
    series: cleanSeries,
    topUsers,
    totals: {
      calls,
      okCalls: outcomeTotals.ok ?? 0,
      availableFalse,
      error4xx: outcomeTotals.error_4xx ?? 0,
      error5xx,
      availableFalseShare: ratio(availableFalse, calls),
      error5xxShare: ratio(error5xx, calls),
      avgMs: average(sumMs, samples),
      p50Ms: percentileFromHistogram(overallHist, 0.5),
      p90Ms: percentileFromHistogram(overallHist, 0.9),
      p50Overflow: percentileIsOverflow(overallHist, 0.5),
      p90Overflow: percentileIsOverflow(overallHist, 0.9),
      namedCallers: userAcc.size,
      unattributedCalls,
    },
  };
}
