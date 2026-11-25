/**
 * Request counts for /docs/run-daily: what each daily job spends in a 31-day
 * month (the longest one, so the figure is never short) against the flights
 * PRO quota in lib/pricing.ts (callers pass it). Counts are per run without retries; a search
 * that fails with a 5xx is retried once by every path, which the page says.
 *
 * No imports, so the test loads it without a bundler. REST: a cheapest_dates call is one request for a whole window of dates, a
 * round trip is one request. MCP: one request per date x destination.
 */
export const DAYS_IN_LONGEST_MONTH = 31;

/** fare-watcher: one calendar per origin x destination x trip length, plus the confirmations. */
export function fareWatcherRun(from: number, to: number, lengths: number, confirm: number): number {
  return from * to * lengths + confirm;
}

/** MCP: one search per departure date x destination x trip length. */
export function mcpRun(dates: number, destinations: number, lengths = 1): number {
  return dates * destinations * lengths;
}

export type DailyJob = { id: string; path: string; watch: string; perRun: number };

export const DAILY_JOBS: DailyJob[] = [
  { id: 'template-one', path: 'fare-watcher', watch: '1 route, 1 trip length, a month of dates', perRun: fareWatcherRun(1, 1, 1, 1) },
  { id: 'template-readme', path: 'fare-watcher', watch: '2 x 2 airports, 2 trip lengths, a month of dates (the shipped example)', perRun: fareWatcherRun(2, 2, 2, 2) },
  { id: 'template-wide', path: 'fare-watcher', watch: '3 x 8 airports, 3 trip lengths, a month of dates', perRun: fareWatcherRun(3, 8, 3, 8) },
  { id: 'n8n', path: 'n8n', watch: '1 route, 1 date pair', perRun: 1 },
  { id: 'cron', path: 'cron', watch: '1 route, 1 trip length, a month of dates', perRun: 2 },
  { id: 'mcp-two', path: 'Claude or Cursor', watch: '2 cities, 1 departure date', perRun: mcpRun(1, 2) },
  { id: 'mcp-month', path: 'Claude or Cursor', watch: '2 cities, every date of a month', perRun: mcpRun(31, 2) },
];

export const perMonth = (perRun: number): number => perRun * DAYS_IN_LONGEST_MONTH;
export const shareOf = (perRun: number, quota: number): string => {
  const pct = (perMonth(perRun) / quota) * 100;
  return `${pct < 10 ? pct.toFixed(1) : Math.round(pct)}%`;
};
export const job = (id: string): DailyJob => DAILY_JOBS.find((j) => j.id === id)!;
