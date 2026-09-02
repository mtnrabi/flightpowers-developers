import 'server-only';
import { Pool } from 'pg';

/**
 * A durable sink for the `/api/e` beacon.
 *
 * WHY THIS EXISTS. The beacon used to write `[fp-event] {...}` with
 * `console.log` and nothing else. That looked like instrumentation and was
 * not: on 2026-09-02 the Vercel API was checked end to end and there is no
 * way to read those lines back. `/v1/projects/<id>/logs` 404s, the
 * deployments events API returns build lines only (a live-tail test with three
 * real beacon POSTs in flight returned zero runtime lines), and log drains —
 * the one mechanism that persists runtime output — are a paid feature with
 * none configured. Retention on the dashboard tail is short and it cannot be
 * queried. So every event the site has ever recorded is already gone.
 *
 * One table, `fp_events`, in the same Neon instance as `fp_dev_subscribers`,
 * namespaced `fp_` for the same reason. Rows are counts, not people:
 *
 *   - no IP, no user agent, no cookie, no id of any kind
 *   - `us`/`um`/`uc` are the campaign labels that were already in the URL
 *   - `ref` is a referrer HOSTNAME, never a full referring URL
 *
 * which is the same data the log line carried, in a place it can be read from.
 *
 * The beacon must never fail loudly and must never slow a page down, so every
 * function here swallows its errors and the route does not wait on the write
 * to answer. The `console.log` line is kept as well: it is free, and it is the
 * only thing that still works if `DATABASE_URL` is unset.
 */

export const EVENTS_TABLE = 'fp_events';

const SCHEMA = `
create table if not exists ${EVENTS_TABLE} (
  id      bigserial   primary key,
  t       timestamptz not null default now(),
  e       text        not null,
  tool    text,
  action  text,
  target  text,
  medium  text,
  mode    text,
  path    text,
  us      text,
  um      text,
  uc      text,
  ref     text
);
create index if not exists ${EVENTS_TABLE}_t_idx  on ${EVENTS_TABLE} (t);
create index if not exists ${EVENTS_TABLE}_us_idx on ${EVENTS_TABLE} (us, t);
create index if not exists ${EVENTS_TABLE}_e_idx  on ${EVENTS_TABLE} (e, t);
`;

let pool: Pool | null = null;
let ensured: Promise<void> | null = null;

export function isConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      max: 1,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 4_000,
    });
  }
  return pool;
}

async function ensureTable(): Promise<void> {
  if (!ensured) {
    ensured = getPool()
      .query(SCHEMA)
      .then(() => undefined)
      .catch((err) => {
        ensured = null; // let the next request retry
        throw err;
      });
  }
  return ensured;
}

export type EventRow = {
  e: string;
  tool: string;
  action: string;
  target: string;
  medium: string;
  mode: string;
  path: string;
  us: string;
  um: string;
  uc: string;
  ref: string;
};

/** Empty string and null both mean "not set"; null is what groups cleanly. */
const n = (v: string) => (v ? v : null);

/**
 * Record one event. Resolves either way — a failed write is logged and
 * dropped, because a lost analytics row is never worth a broken beacon.
 */
export async function saveEvent(row: EventRow): Promise<void> {
  if (!isConfigured()) return;
  try {
    await ensureTable();
    await getPool().query(
      `insert into ${EVENTS_TABLE} (e, tool, action, target, medium, mode, path, us, um, uc, ref)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        row.e,
        n(row.tool),
        n(row.action),
        n(row.target),
        n(row.medium),
        n(row.mode),
        n(row.path),
        n(row.us),
        n(row.um),
        n(row.uc),
        n(row.ref),
      ]
    );
  } catch (err) {
    console.error('[fp-event] sink write failed', err);
  }
}
