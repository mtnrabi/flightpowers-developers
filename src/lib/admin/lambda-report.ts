import 'server-only';
import { neon } from '@neondatabase/serverless';
import { HISTOGRAM_EDGES_MS, resolutionFor } from './lane-metrics';
import type { Resolution } from './lane-metrics';
import { percentileFrom } from './histogram';
import type { Percentile } from './histogram';

/**
 * Reads `lambda_report_10m` — what the CloudWatch REPORT line says our three
 * Lambdas actually used.
 *
 * WHY THIS TABLE IS SEPARATE FROM THE LANE TABLES. `lane_metrics_10m` and
 * `hotel_metrics_10m` measure a REQUEST: which lane, which transport, what the
 * caller waited. The REPORT line measures the CONTAINER: max memory used
 * against memory allocated, billed duration, cold starts, and the two
 * failures that never appear in an application log at all — a timeout (this
 * log group prints `Status: timeout` on the REPORT line, never "Task timed
 * out") and an OOM kill, where the runtime dies with `signal: killed` and
 * writes no Max Memory line. One row per 10-minute bucket per function.
 *
 * WHO WRITES IT. Not this repo. The flights rollup in mtnrabi/flight_rabbi
 * writes `flyMyGApi`; the hotels rollup in mtnrabi/hotel_agent writes
 * `hotelAgent` and `multipleHotelsAgent` from eu-central-1 under a different
 * AWS identity. Both read the REPORT lines in the same CloudWatch window they
 * already read, under the same watermark. Until they ship, the table exists
 * and is empty, and the panel says exactly that.
 *
 * THE MEDIAN IS NOT STORED, FOR THE SAME REASON IT IS NOT STORED ANYWHERE ELSE
 * ON THIS PAGE: the median of a day is not the average of 144 ten-minute
 * medians. `mem_hist` and `dur_hist` are summed element-wise with
 * `unnest(...) WITH ORDINALITY` and the percentile is walked out of the sum.
 *
 * MEMORY p99 IS THE POINT OF THE PANEL. The average tells you what a typical
 * call used; the allocation is billed on every call whatever it used; and the
 * decision ("is 1024 MB right") is made by the far tail, because that is what
 * an OOM kill is. So the cards are median / average / p99 / max, each against
 * the allocation, rather than one "memory" number that hides the question.
 */

/** The three functions behind the two products. Free text in the table. */
export const FLIGHTS_FUNCTION = 'flyMyGApi';
export const HOTEL_FUNCTIONS = ['hotelAgent', 'multipleHotelsAgent'] as const;
export const DEFAULT_FUNCTIONS = [FLIGHTS_FUNCTION, ...HOTEL_FUNCTIONS] as const;

/**
 * `mem_hist` edges in MB, frozen in db/0005_lambda_report.sql and in both
 * rollups. Fifteen edges, sixteen buckets, the last unbounded. Never edit
 * without a new column: every row already written only means what it means
 * because these have not moved.
 */
export const MEMORY_EDGES_MB = [
  128, 192, 256, 320, 384, 448, 512, 576, 640, 704, 768, 896, 1024, 1536, 2048,
] as const;

/** `dur_hist` uses the lane edges, imported rather than retyped. */
export const DURATION_EDGES_MS = HISTOGRAM_EDGES_MS;

/**
 * AWS Lambda x86 compute, us-east-2 and eu-central-1 alike: $0.0000166667 per
 * GB-second. Requests are billed too ($0.20 per million) but at our volume
 * that is cents a month, and this is a cost ESTIMATE from the billed duration
 * we recorded, not a copy of the bill.
 */
export const GB_SECOND_USD = 0.0000166667;

export type LambdaFunctionSummary = {
  functionName: string;
  invocations: number;
  /** `mem_size_mb` from the most recent bucket in the window, in MB */
  allocationMb: number | null;
  /** mem_sum_mb / invocations */
  memAvgMb: number | null;
  /** p50 of mem_hist — called "median" everywhere it is shown */
  memMedian: Percentile;
  memP99: Percentile;
  /** max(mem_max_mb): an exact figure, not a histogram edge */
  memMaxMb: number | null;
  /** max memory used ÷ allocation, as a fraction */
  memHeadroom: number | null;
  durAvgMs: number | null;
  durP50: Percentile;
  durP90: Percentile;
  timeouts: number;
  oomKills: number;
  /** REPORT lines carrying an Init Duration */
  coldStarts: number;
  billedMsSum: number;
  /** billed GB-seconds × $0.0000166667 — an estimate, not a bill */
  estimatedCostUsd: number;
};

export type LambdaPoint = {
  t: string;
  invocations: number;
  memMedian: Percentile;
  memP99: Percentile;
  memMaxMb: number | null;
  allocationMb: number | null;
};

export type LambdaReport = {
  range: { fromIso: string; toIso: string; resolution: Resolution };
  /** the functions that were asked for, in the order they were asked for */
  requested: string[];
  /** true when `lambda_report_10m` does not exist — the migration is not applied */
  schemaMissing: boolean;
  /** true when the table exists but has no row for any requested function */
  empty: boolean;
  /** one entry per requested function that HAS rows; a missing key is "no rows" */
  functions: Record<string, LambdaFunctionSummary>;
  series: Record<string, LambdaPoint[]>;
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
  // Neon hands back bigint and numeric columns as strings. None of these
  // counts comes near 2^53, so Number() is safe and BigInt would not survive
  // JSON on the way to the client.
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function average(sum: number, n: number): number | null {
  return n > 0 ? sum / n : null;
}

function bucketExpression(resolution: Resolution): string {
  if (resolution === '1h') return "date_trunc('hour', bucket_ts)";
  if (resolution === '1d') return "date_trunc('day', bucket_ts)";
  return 'bucket_ts';
}

/** `relation ... does not exist` — db/0005_lambda_report.sql is not applied. */
export function isMissingRelation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /relation .*lambda_report_10m.* does not exist/i.test(message);
}

const SLOTS = MEMORY_EDGES_MB.length + 1;
const emptyHist = () => new Array(SLOTS).fill(0) as number[];

/**
 * Names are interpolated nowhere — they are bound as a text[] parameter — but
 * they are still validated, because an unbounded name is an unbounded GROUP BY
 * key and the panel only ever asks for three.
 */
const NAME_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
export const MAX_FUNCTIONS = 10;

export function parseFunctions(raw: string | null): string[] | { error: string } {
  if (!raw) return [...DEFAULT_FUNCTIONS];
  const names = Array.from(
    new Set(
      raw
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
    )
  );
  if (names.length === 0) return [...DEFAULT_FUNCTIONS];
  if (names.length > MAX_FUNCTIONS) {
    return { error: `functions takes at most ${MAX_FUNCTIONS} names.` };
  }
  const bad = names.find((name) => !NAME_PATTERN.test(name));
  if (bad) {
    return { error: `functions must be Lambda names ([A-Za-z0-9_-]); got "${bad}".` };
  }
  return names;
}

export async function fetchLambdaReport(
  fromMs: number,
  toMs: number,
  functions: string[] = [...DEFAULT_FUNCTIONS]
): Promise<LambdaReport> {
  const resolution = resolutionFor(fromMs, toMs);
  const from = new Date(fromMs).toISOString();
  const to = new Date(toMs).toISOString();
  const sql = getClient();

  const blank = (): LambdaReport => ({
    range: { fromIso: from, toIso: to, resolution },
    requested: functions,
    schemaMissing: false,
    empty: true,
    functions: {},
    series: {},
  });

  // `$3::text[]` is cast explicitly rather than left to inference: the driver
  // serialises the JS array to a Postgres array literal, and an uncast
  // parameter next to `= ANY(...)` is one planner detail away from being read
  // as a single string.
  const args = [from, to, functions];
  const bucket = bucketExpression(resolution);

  let totalsRows: Array<Record<string, unknown>>;
  let allocationRows: Array<Record<string, unknown>>;
  let memHistRows: Array<Record<string, unknown>>;
  let durHistRows: Array<Record<string, unknown>>;
  let seriesRows: Array<Record<string, unknown>>;
  let seriesHistRows: Array<Record<string, unknown>>;

  try {
    [totalsRows, allocationRows, memHistRows, durHistRows, seriesRows, seriesHistRows] =
      (await Promise.all([
        // 1. One row per function. `billed_mb_ms` is the cost integrand:
        //    billed_ms × the allocation THAT BUCKET was billed at, so a window
        //    spanning a memory-size change costs what it actually cost rather
        //    than what it would have cost at today's setting.
        sql.query(
          `SELECT function_name,
                  SUM(invocations)   AS invocations,
                  SUM(mem_sum_mb)    AS mem_sum_mb,
                  MAX(mem_max_mb)    AS mem_max_mb,
                  SUM(dur_sum_ms)    AS dur_sum_ms,
                  SUM(billed_ms_sum) AS billed_ms_sum,
                  SUM(billed_ms_sum::numeric * mem_size_mb) AS billed_mb_ms,
                  SUM(timeouts)      AS timeouts,
                  SUM(oom_kills)     AS oom_kills,
                  SUM(init_count)    AS init_count
             FROM lambda_report_10m
            WHERE bucket_ts >= $1 AND bucket_ts < $2 AND function_name = ANY($3::text[])
            GROUP BY function_name`,
          args
        ),
        // 2. The allocation as it stands: the LAST bucket's `mem_size_mb`, not
        //    the max, so raising 1024 -> 1536 mid-window shows 1536.
        sql.query(
          `SELECT DISTINCT ON (function_name) function_name, mem_size_mb
             FROM lambda_report_10m
            WHERE bucket_ts >= $1 AND bucket_ts < $2 AND function_name = ANY($3::text[])
              AND mem_size_mb > 0
            ORDER BY function_name, bucket_ts DESC`,
          args
        ),
        // 3 & 4. Element-wise histogram sums. Postgres has no array sum, so
        //        `unnest ... WITH ORDINALITY` turns array position into a
        //        group key -- the same shape the lane and hotel readers use.
        sql.query(
          `SELECT function_name, ord, SUM(v) AS n
             FROM lambda_report_10m,
                  LATERAL unnest(mem_hist) WITH ORDINALITY AS t(v, ord)
            WHERE bucket_ts >= $1 AND bucket_ts < $2 AND function_name = ANY($3::text[])
            GROUP BY function_name, ord`,
          args
        ),
        sql.query(
          `SELECT function_name, ord, SUM(v) AS n
             FROM lambda_report_10m,
                  LATERAL unnest(dur_hist) WITH ORDINALITY AS t(v, ord)
            WHERE bucket_ts >= $1 AND bucket_ts < $2 AND function_name = ANY($3::text[])
            GROUP BY function_name, ord`,
          args
        ),
        // 5. The series' scalar half: counts and the exact max, per bucket.
        sql.query(
          `SELECT ${bucket} AS t,
                  function_name,
                  SUM(invocations) AS invocations,
                  MAX(mem_max_mb)  AS mem_max_mb,
                  MAX(mem_size_mb) AS mem_size_mb
             FROM lambda_report_10m
            WHERE bucket_ts >= $1 AND bucket_ts < $2 AND function_name = ANY($3::text[])
            GROUP BY 1, function_name
            ORDER BY 1 ASC`,
          args
        ),
        // 6. The series' histogram half, so the chart's median and p99 are
        //    walked per bucket rather than being a stored average of medians.
        //    `HAVING SUM(v) > 0` drops the empty slots, which is most of them:
        //    a function that always uses ~180 MB fills one slot and leaves the
        //    other fifteen at zero in every bucket.
        sql.query(
          `SELECT ${bucket} AS t, function_name, ord, SUM(v) AS n
             FROM lambda_report_10m,
                  LATERAL unnest(mem_hist) WITH ORDINALITY AS t2(v, ord)
            WHERE bucket_ts >= $1 AND bucket_ts < $2 AND function_name = ANY($3::text[])
            GROUP BY 1, function_name, ord
           HAVING SUM(v) > 0`,
          args
        ),
      ])) as Array<Array<Record<string, unknown>>>;
  } catch (error) {
    if (isMissingRelation(error)) return { ...blank(), schemaMissing: true };
    throw error;
  }

  if (totalsRows.length === 0) return blank();

  // ---- histograms over the whole window ---------------------------------

  const memHist = new Map<string, number[]>();
  const durHist = new Map<string, number[]>();
  const foldHist = (target: Map<string, number[]>, rows: Array<Record<string, unknown>>) => {
    for (const row of rows) {
      const name = String(row.function_name);
      // `WITH ORDINALITY` is 1-based.
      const index = num(row.ord) - 1;
      if (index < 0 || index >= SLOTS) continue;
      const hist = target.get(name) ?? emptyHist();
      hist[index] += num(row.n);
      target.set(name, hist);
    }
  };
  foldHist(memHist, memHistRows);
  foldHist(durHist, durHistRows);

  const allocation = new Map<string, number>();
  for (const row of allocationRows) {
    allocation.set(String(row.function_name), num(row.mem_size_mb));
  }

  // ---- per-function summaries -------------------------------------------

  const summaries: Record<string, LambdaFunctionSummary> = {};
  for (const row of totalsRows) {
    const name = String(row.function_name);
    const invocations = num(row.invocations);
    const mem = memHist.get(name) ?? emptyHist();
    const dur = durHist.get(name) ?? emptyHist();
    const allocationMb = allocation.get(name) ?? null;
    const memMaxMb = num(row.mem_max_mb) || null;

    // Cost from the per-bucket allocation where we have it. `billed_mb_ms`
    // only misses when a bucket recorded no Memory Size at all, and then the
    // current allocation is the best available stand-in -- named here rather
    // than silently reporting $0 for real compute.
    const billedMsSum = num(row.billed_ms_sum);
    const billedMbMs = num(row.billed_mb_ms);
    const gbSeconds =
      billedMbMs > 0
        ? billedMbMs / 1000 / 1024
        : allocationMb
          ? (billedMsSum / 1000) * (allocationMb / 1024)
          : 0;

    summaries[name] = {
      functionName: name,
      invocations,
      allocationMb,
      memAvgMb: average(num(row.mem_sum_mb), invocations),
      memMedian: percentileFrom(mem, 0.5, MEMORY_EDGES_MB),
      memP99: percentileFrom(mem, 0.99, MEMORY_EDGES_MB),
      memMaxMb,
      memHeadroom: allocationMb && memMaxMb ? memMaxMb / allocationMb : null,
      durAvgMs: average(num(row.dur_sum_ms), invocations),
      durP50: percentileFrom(dur, 0.5, DURATION_EDGES_MS),
      durP90: percentileFrom(dur, 0.9, DURATION_EDGES_MS),
      timeouts: num(row.timeouts),
      oomKills: num(row.oom_kills),
      coldStarts: num(row.init_count),
      billedMsSum,
      estimatedCostUsd: gbSeconds * GB_SECOND_USD,
    };
  }

  // ---- the series -------------------------------------------------------

  // Histogram slots first, keyed by function + bucket, so the scalar pass can
  // walk a complete vector instead of assembling one twice.
  const pointHist = new Map<string, number[]>();
  for (const row of seriesHistRows) {
    const index = num(row.ord) - 1;
    if (index < 0 || index >= SLOTS) continue;
    const key = `${String(row.function_name)} ${new Date(String(row.t)).toISOString()}`;
    const hist = pointHist.get(key) ?? emptyHist();
    hist[index] += num(row.n);
    pointHist.set(key, hist);
  }

  const series: Record<string, LambdaPoint[]> = {};
  for (const row of seriesRows) {
    const name = String(row.function_name);
    const t = new Date(String(row.t)).toISOString();
    const hist = pointHist.get(`${name} ${t}`) ?? emptyHist();
    (series[name] ??= []).push({
      t,
      invocations: num(row.invocations),
      memMedian: percentileFrom(hist, 0.5, MEMORY_EDGES_MB),
      memP99: percentileFrom(hist, 0.99, MEMORY_EDGES_MB),
      memMaxMb: num(row.mem_max_mb) || null,
      allocationMb: num(row.mem_size_mb) || null,
    });
  }
  for (const points of Object.values(series)) {
    points.sort((a, b) => a.t.localeCompare(b.t));
  }

  return {
    range: { fromIso: from, toIso: to, resolution },
    requested: functions,
    schemaMissing: false,
    // No ROWS, not "no invocations": a bucket can carry an OOM kill with no
    // REPORT line behind it, and that is not an empty window.
    empty: Object.keys(summaries).length === 0,
    functions: summaries,
    series,
  };
}
