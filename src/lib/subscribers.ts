import 'server-only';
import { Pool } from 'pg';
import { randomBytes } from 'node:crypto';

/**
 * The developer mailing list — the only first-party audience this site has.
 *
 * Storage is the Neon Postgres instance the consumer engine already uses
 * (`DATABASE_URL`). This code never touches the engine's own tables: it owns
 * exactly one, `fp_dev_subscribers`, namespaced so a name can never collide
 * with the engine's schema. The consumer subscriber list is insight-only by
 * standing decision and is not read or written here.
 *
 * Driver is `pg` (plain TCP + TLS) rather than the Neon HTTP driver, so the
 * same code path runs against any Postgres — which is how the migration and
 * the round trip were verified locally before this shipped.
 *
 * Rules this file enforces:
 *   - If `DATABASE_URL` is not set, every write FAILS LOUDLY. The form never
 *     tells anyone we saved an address we did not save.
 *   - Every row carries its own unsubscribe token at insert time, so an
 *     unsubscribe link exists before a single email can be sent.
 */

export const SUBSCRIBERS_TABLE = 'fp_dev_subscribers';

/** The schema, kept next to the code that uses it. Mirrors db/0001_dev_subscribers.sql. */
const SCHEMA = `
create table if not exists ${SUBSCRIBERS_TABLE} (
  id              bigserial primary key,
  email           text        not null,
  source          text        not null default 'unknown',
  path            text,
  unsub_token     text        not null unique,
  created_at      timestamptz not null default now(),
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz
);
create unique index if not exists ${SUBSCRIBERS_TABLE}_email_key
  on ${SUBSCRIBERS_TABLE} (lower(email));
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
      // One connection per warm lambda: this table sees a handful of writes.
      max: 1,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      // Neon requires TLS; `sslmode=require` in the URL is honoured by pg,
      // and local development against a plain instance is unaffected.
    });
  }
  return pool;
}

/** Create the table on first use. Idempotent, and cached per warm instance. */
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

/**
 * RFC-5322 in full is not worth implementing and not worth failing people
 * over. This rejects the shapes that are certainly not addresses and lets
 * everything else through; a bad address costs us one dead row.
 */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (email.length < 6 || email.length > 254) return null;
  if (/\s/.test(email)) return null;
  if (!/^[^@]+@[^@.]+(\.[^@.]+)+$/.test(email)) return null;
  return email;
}

export type SaveResult = { created: boolean };

/**
 * Record an opt-in. Re-submitting an address that already opted out is a
 * fresh, deliberate opt-in, so it clears `unsubscribed_at` — the person
 * typed their address into the form again.
 */
export async function saveSubscriber(input: {
  email: string;
  source: string;
  path: string;
}): Promise<SaveResult> {
  await ensureTable();
  const token = randomBytes(24).toString('base64url');
  const res = await getPool().query(
    `insert into ${SUBSCRIBERS_TABLE} (email, source, path, unsub_token)
     values ($1, $2, $3, $4)
     on conflict (lower(email)) do update
       set source          = excluded.source,
           path            = excluded.path,
           unsubscribed_at = null
     returning (xmax = 0) as inserted`,
    [input.email, input.source.slice(0, 60), input.path.slice(0, 200), token]
  );
  return { created: Boolean(res.rows[0]?.inserted) };
}

export type UnsubscribeResult = 'done' | 'already' | 'unknown';

/** One-click-safe: idempotent, and an unknown token is not an error page. */
export async function unsubscribeByToken(token: string): Promise<UnsubscribeResult> {
  await ensureTable();
  const res = await getPool().query(
    `update ${SUBSCRIBERS_TABLE}
        set unsubscribed_at = now()
      where unsub_token = $1
        and unsubscribed_at is null
      returning id`,
    [token]
  );
  if (res.rowCount && res.rowCount > 0) return 'done';
  const known = await getPool().query(`select 1 from ${SUBSCRIBERS_TABLE} where unsub_token = $1`, [token]);
  return known.rowCount && known.rowCount > 0 ? 'already' : 'unknown';
}

/**
 * Opt out by typing the address instead of following a link. Nobody has a
 * token until the first email goes out, so without this a person who signs
 * up and immediately changes their mind has no way out but a support email.
 * The caller always gets the same answer, so this cannot be used to test
 * whether an address is on the list.
 */
export async function unsubscribeByEmail(email: string): Promise<void> {
  await ensureTable();
  await getPool().query(
    `update ${SUBSCRIBERS_TABLE}
        set unsubscribed_at = now()
      where lower(email) = lower($1)
        and unsubscribed_at is null`,
    [email]
  );
}
