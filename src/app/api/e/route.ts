/**
 * First-party event beacon — the only site→marketplace attribution we will
 * ever have. Events land in the function log as structured JSON lines
 * (greppable, drainable to a real sink later). No cookies, no IP stored,
 * no third-party script.
 *
 * Event vocabulary (mirrors SocialKit's api_upsell_click instrumentation):
 *   { e: "session_start", us, um, uc, ref, path }   -- once per tab, see below
 *   { e: "api_upsell_click", tool, action: copy_curl|copy_python|copy_node|get_key|docs, path }
 *   { e: "demo_run", tool, mode: live|cached|canned|capped, path }
 *   { e: "outbound", target, medium, path }
 *   { e: "upsell_view", tool, path }                       -- card scrolled into view, once per mount
 *   { e: "email_submit", tool, action: ok|created|error, path }

 * Together those four are the whole capture funnel, in order:
 *   demo_run -> upsell_view -> api_upsell_click -> email_submit.
 * `session_start` sits in front of all of them and is what makes a campaign
 * measurable in visits rather than in clicks.
 *
 * Campaign fields, on every event (`src/lib/attribution.ts`):
 *   us  utm_source   e.g. reddit | x | threads
 *   um  utm_medium   e.g. social
 *   uc  utm_campaign the post slug
 *   ref referrer HOSTNAME only, never the full referring URL
 *
 * WHERE THESE GO. Both to the function log (free, unreadable after the fact)
 * and, when DATABASE_URL is set, to the `fp_events` table — see
 * src/lib/events.ts for why the log alone was never a data source.
 *
 * Nothing here identifies a person: no cookie, no id, and the address
 * itself never reaches this endpoint. `us`/`um`/`uc` are labels that were
 * already in the URL the visitor clicked; `ref` is a hostname. None of them
 * can be joined back to an individual, which is also the honest limit of this
 * data: it counts arrivals per campaign, not people per campaign.
 */

import { NextResponse } from 'next/server';
import { isConfigured, saveEvent } from '@/lib/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = new Set([
  'session_start',
  'api_upsell_click',
  'upsell_view',
  'demo_run',
  'outbound',
  'verify_key',
  'email_submit',
]);

/** Labels only. Anything that is not a short campaign token is dropped. */
function label(v: unknown, max: number): string {
  return String(v ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, max);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const e = String(body.e ?? '');
    if (!ALLOWED.has(e)) return new NextResponse(null, { status: 204 });
    const line = {
      t: new Date().toISOString(),
      e,
      tool: String(body.tool ?? '').slice(0, 60),
      action: String(body.action ?? '').slice(0, 40),
      target: String(body.target ?? '').slice(0, 120),
      medium: String(body.medium ?? '').slice(0, 40),
      mode: String(body.mode ?? '').slice(0, 20),
      path: String(body.path ?? '').slice(0, 120),
      us: label(body.us, 60),
      um: label(body.um, 60),
      uc: label(body.uc, 60),
      ref: label(body.ref, 80),
    };
    // Kept: free, and the only thing that still works with no DATABASE_URL.
    console.log(`[fp-event] ${JSON.stringify(line)}`);
    // The durable copy. Awaited, because a serverless function can be frozen
    // the instant it responds and a detached promise would simply be lost.
    // `saveEvent` never rejects and returns immediately when unconfigured.
    if (isConfigured()) await saveEvent(line);
  } catch {
    // A beacon never errors loudly.
  }
  return new NextResponse(null, { status: 204 });
}
