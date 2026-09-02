'use client';

import { useId, useState } from 'react';

/**
 * Opting out has to be at least as easy as opting in, so this page takes
 * either the token from an email link (one button, no typing) or the address
 * itself. It confirms in the same words whether or not the address was on
 * the list, because telling a stranger "that address is not subscribed" is
 * itself a disclosure.
 */
export function UnsubscribeBox({ token }: { token?: string }) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function send(body: Record<string, string>) {
    setState('sending');
    setMessage('');
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setState('error');
        setMessage(data.message ?? 'That did not go through. Email app@flightpowers.com and it will be done by hand.');
        return;
      }
      setState('done');
    } catch {
      setState('error');
      setMessage('That did not go through. Email app@flightpowers.com and it will be done by hand.');
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
        <p className="text-[15px] font-semibold text-ink-100">Done. That address is off the list.</p>
        <p className="mt-1.5 text-[14px] text-ink-300 leading-relaxed">
          Nothing further will be sent to it. If you signed up again by mistake later, the same page undoes it again.
        </p>
      </div>
    );
  }

  if (token) {
    return (
      <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
        <p className="text-[15px] font-semibold text-ink-100">Take me off the list</p>
        <p className="mt-1.5 text-[14px] text-ink-300 leading-relaxed">
          One click and the address this link belongs to stops receiving anything. You do not have to tell us why.
        </p>
        <button
          type="button"
          onClick={() => send({ token })}
          disabled={state === 'sending'}
          className="btn btn-accent mt-4"
        >
          {state === 'sending' ? 'Working…' : 'Unsubscribe'}
        </button>
        {state === 'error' ? (
          <p role="alert" className="mt-3 text-[14px] text-verdict-typical leading-relaxed">
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (state !== 'sending') void send({ email });
      }}
      className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6"
    >
      <p className="text-[15px] font-semibold text-ink-100">Take me off the list</p>
      <p className="mt-1.5 text-[14px] text-ink-300 leading-relaxed">
        Type the address you signed up with. No confirmation email, no survey, no retention offer.
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
          {state === 'sending' ? 'Working…' : 'Unsubscribe'}
        </button>
      </div>
      {state === 'error' ? (
        <p role="alert" className="mt-3 text-[14px] text-verdict-typical leading-relaxed">
          {message}
        </p>
      ) : null}
    </form>
  );
}
