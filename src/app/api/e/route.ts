/**
 * First-party event beacon — the only site→marketplace attribution we will
 * ever have. Events land in the function log as structured JSON lines
 * (greppable, drainable to a real sink later). No cookies, no IP stored,
 * no third-party script.
 *
 * Event vocabulary (mirrors SocialKit's api_upsell_click instrumentation):
 *   { e: "api_upsell_click", tool, action: copy_curl|copy_python|copy_node|get_key|docs, path }
 *   { e: "demo_run", tool, mode: live|cached|canned|capped, path }
 *   { e: "outbound", target, medium, path }
 *   { e: "upsell_view", tool, path }                       -- card scrolled into view, once per mount
 *   { e: "email_submit", tool, action: ok|created|error, path }

 * Together those four are the whole capture funnel, in order:
 *   demo_run -> upsell_view -> api_upsell_click -> email_submit.
 * Nothing here identifies a person: no cookie, no id, and the address
 * itself never reaches this endpoint.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = new Set(['api_upsell_click', 'upsell_view', 'demo_run', 'outbound', 'verify_key', 'email_submit']);

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
    };
    console.log(`[fp-event] ${JSON.stringify(line)}`);
  } catch {
    // A beacon never errors loudly.
  }
  return new NextResponse(null, { status: 204 });
}
