/**
 * The reader half of THE HISTOGRAM CONTRACT (written out in full at the top of
 * db/0004_lane_metrics.sql), in one place and with the edges as an argument.
 *
 * NO `server-only` HERE, DELIBERATELY. This is arithmetic over an array of
 * numbers: no database client, no environment, nothing secret. Keeping it free
 * of that import is what lets `npm test` run it under plain node, which is the
 * whole reason the off-by-one that matters most on this page -- the unbounded
 * last bucket -- has a test at all.
 *
 * WHY ONE FUNCTION AND NOT THREE. `lane_metrics_10m.hist`,
 * `hotel_metrics_10m.hist`, `lambda_report_10m.dur_hist` and
 * `lambda_report_10m.mem_hist` are all 16-slot, fixed-edge, half-open,
 * lower-inclusive histograms whose last slot is unbounded. Only the edges (and
 * the unit) differ. Three copies of this walk would be three places for the
 * `>=` to drift into a `>`.
 */

/**
 * A percentile read out of a histogram.
 *
 * `value` is the UPPER EDGE of the bucket the percentile falls in -- a
 * ceiling, never an interpolation. With 250 ms (or 64 MB) as the finest edge,
 * interpolating would invent precision the storage does not have.
 *
 * `value: null` happens two ways and they are NOT the same thing, which is why
 * `overflow` exists:
 *   - `overflow: false` — no samples at all. There is nothing to report.
 *   - `overflow: true`  — the percentile landed in the unbounded last slot.
 *     It is AT LEAST the top edge and we cannot say by how much. A caller that
 *     renders this as the top edge turns "at least 90 s" into "exactly 90 s",
 *     which is the sort of number a latency argument gets built on; render it
 *     as `> 90 s` / `> 2048 MB` instead.
 */
export type Percentile = { value: number | null; overflow: boolean };

/**
 * `hist` is 16 counts, `edges` is the 15 upper bounds. Slot i (0-based) counts
 * `edges[i-1] <= v < edges[i]`, and slot 15 counts `v >= edges[14]`.
 *
 * A histogram longer than `edges.length + 1` is not an error here: extra slots
 * simply belong to the overflow, which is the honest reading of "the writer
 * has more buckets than this reader knows about".
 */
export function percentileFrom(
  hist: readonly number[],
  fraction: number,
  edges: readonly number[]
): Percentile {
  const total = hist.reduce((sum, n) => sum + n, 0);
  if (total <= 0) return { value: null, overflow: false };

  const target = total * fraction;
  let seen = 0;
  for (let i = 0; i < hist.length; i += 1) {
    seen += hist[i];
    if (seen >= target) {
      return i >= edges.length
        ? { value: null, overflow: true }
        : { value: edges[i], overflow: false };
    }
  }
  // Only reachable if the counts do not add up to their own total, i.e. never.
  return { value: null, overflow: false };
}
