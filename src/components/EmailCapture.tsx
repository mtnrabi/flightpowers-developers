'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { track } from '@/lib/track';

/**
 * The only place this site asks for anything.
 *
 * Rules it is built to, and which must survive any edit:
 *  - ONE field. No name, no company, no role, no hidden extras.
 *  - The reason is stated in full above the button, in the same size type as
 *    everything else, and it is a promise we can actually keep: one email
 *    when something ships that changes what you can build.
 *  - No pre-ticked box, and no box at all — the form does one thing and says
 *    exactly what that is.
 *  - The quickstart it links to is free and needs no address. Nothing is
 *    withheld behind the form.
 *  - Success is only ever shown when the server confirms the row was written.
 */
export function EmailCapture({
  tool,
  source,
  className = '',
}: {
  tool: string;
  /** Where this instance sits, e.g. `tool:cheapest-month`. Stored on the row. */
  source: string;
  className?: string;
}) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setMessage('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, source, path: window.location.pathname }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setState('error');
        setMessage(data.message ?? 'That did not go through. Nothing was saved. Try again in a minute.');
        track({ e: 'email_submit', tool, action: 'error' });
        return;
      }
      setState('done');
      track({ e: 'email_submit', tool, action: 'ok' });
    } catch {
      setState('error');
      setMessage('That did not go through. Nothing was saved. Try again in a minute.');
      track({ e: 'email_submit', tool, action: 'error' });
    }
  }

  if (state === 'done') {
    return (
      <div className={`rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6 ${className}`}>
        <p className="text-[15px] font-semibold text-ink-100">You are on the list.</p>
        <p className="mt-1.5 text-[14px] text-ink-300 leading-relaxed">
          Nothing arrives until something ships. Every email carries an unsubscribe link, and it works from the first one.
        </p>
        <p className="mt-3 text-[14px]">
          <Link href="/docs/quickstart" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
            The five-minute quickstart is here
          </Link>
          <span className="text-ink-400">. It needs no account and never did.</span>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6 ${className}`}>
      <p className="text-[15px] font-semibold text-ink-100">Know before the response shape changes</p>
      <p className="mt-1.5 text-[14px] text-ink-300 leading-relaxed">
        One email when something ships that changes what you can build: a new endpoint, a changed field, a deprecation, a
        price move. Nothing else goes to this list.
      </p>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor={id} className="sr-only">
          Email address
        </label>
        <input
          id={id}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourcompany.com"
          className="min-w-0 flex-1 rounded-xl border rule bg-ink-950 px-3.5 py-2.5 text-[15px] text-ink-100 placeholder:text-ink-600 focus:border-signal-600 focus:outline-none"
        />
        <button type="submit" className="btn btn-accent shrink-0" disabled={state === 'sending'}>
          {state === 'sending' ? 'Adding…' : 'Add me'}
        </button>
      </div>

      {state === 'error' ? (
        <p role="alert" className="mt-3 text-[14px] text-verdict-typical leading-relaxed">
          {message}
        </p>
      ) : null}

      <p className="mt-3 text-[13px] text-ink-400 leading-relaxed">
        The address is stored to send that list and nothing else. It is not sold, not shared with the marketplaces, and not
        used to build a profile. Unsubscribe from any email, or from{' '}
        <Link href="/unsubscribe" className="underline underline-offset-4 hover:text-ink-200">
          the unsubscribe page
        </Link>
        . More in{' '}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-ink-200">
          privacy
        </Link>
        .
      </p>
    </form>
  );
}
