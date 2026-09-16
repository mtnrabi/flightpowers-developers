/**
 * Sign out. POST because a GET would let any image tag on any page log the
 * admin out; the page submits a same-origin form.
 */
import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/admin/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL('/admin', req.url), { status: 303 });
}
