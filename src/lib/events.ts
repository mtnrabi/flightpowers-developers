import 'server-only';
import { neon } from '@neondatabase/serverless';

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
 *
 * WHY THE HTTP DRIVER AND NOT `pg`. This is the highest-invocation route on
 * the site and, at about ten invocations an hour, essentially every one of
 * them is a cold start — so the bill is module graph and connection setup, not
 * the insert. `pg` is the biggest thing in this function's graph and opens a
 * TCP connection and a TLS handshake to reach Neon; `@neondatabase/serverless`
 * sends the same SQL as one `fetch` over Neon's HTTPS endpoint, with no pool
 * to open, keep warm or leak. Measured on 2026-09-04, the first valid beacon
 * on a container cost ~0.87 s of which the insert itself was a rounding error.
 * The SQL below is byte-for-byte what `pg` sent.
 *
 * `subscribe`/`unsubscribe` still use `pg` (src/lib/subscribers.ts): they are
 * human-rate routes where a cold start is invisible, and they are not worth
 * touching to prove a point.
 */

export const EVENTS_TABLE = 'fp_events';

/**
 * The same DDL `pg` ran, one statement per array entry: Neon's HTTP endpoint
 * takes a single statement per request, so a four-statement string that was
 * legal over the wire protocol is not legal here. Also in db/0003_fp_events.sql;
 * this is the belt to that migration's braces.
 */
const SCHEMA = [
  `create table if not exists ${EVENTS_TABLE} (
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
)`,
  `create index if not exists ${EVENTS_TABLE}_t_idx  on ${EVENTS_TABLE} (t)`,
  `create index if not exists ${EVENTS_TABLE}_us_idx on ${EVENTS_TABLE} (us, t)`,
  `create index if not exists ${EVENTS_TABLE}_e_idx  on ${EVENTS_TABLE} (e, t)`,
];

type Sql = ReturnType<typeof neon>;

let client: Sql | null = null;
let ensured: Promise<void> | null = null;

export function isConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getClient(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  if (!client) client = neon(url);
  return client;
}

/**
 * Once per cold start, never per request: the promise is held at module scope,
 * so the second and later beacons on a warm container await an already
 * resolved value and send one HTTP request instead of five.
 */
async function ensureTable(): Promise<void> {
  if (!ensured) {
    const sql = getClient();
    ensured = (async () => {
      for (const statement of SCHEMA) await sql.query(statement);
    })().catch((err) => {
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
    await getClient().query(
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
