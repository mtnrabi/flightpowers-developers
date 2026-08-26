'use client';

import { useState } from 'react';
import { track } from '@/lib/track';

/**
 * "Did my key work?" — the visitor pastes their new RapidAPI key and we
 * relay it once to GET /v1/verify through a same-origin route that never
 * logs it. Closes the loop RapidAPI leaves open after checkout.
 *
 * Honest cost disclosure: /v1/verify performs a real upstream check that
 * counts as one request against the key's hotels-plan quota (measured
 * 2026-08-26), so the box says so before the button.
 */
export function KeyVerifyBox() {
  const [key, setKey] = useState('');
  const [state, setState] = useState<'idle' | 'checking' | 'done'>('idle');
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function check() {
    if (!key.trim() || state === 'checking') return;
    setState('checking');
    setResult(null);
    track({ e: 'verify_key' });
    try {
      const res = await fetch('/api/verify-key', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = (await res.json()) as {
        valid?: boolean;
        detail?: { type?: string; message?: string } | null;
        error?: string;
        message?: string;
      };
      if (data.valid) {
        setResult({ ok: true, text: 'Key works. It reached the live API and authenticated. You are ready to build.' });
      } else if (data.detail?.message) {
        setResult({ ok: false, text: `The API said: “${data.detail.message}”` });
      } else if (data.message) {
        setResult({ ok: false, text: data.message });
      } else {
        setResult({ ok: false, text: 'The key did not verify. Check you copied it exactly as RapidAPI shows it, and that you are subscribed to a plan.' });
      }
    } catch {
      setResult({ ok: false, text: 'Could not reach the verifier. Try again, or call GET api.flightpowers.com/v1/verify directly with your key.' });
    } finally {
      setState('done');
    }
  }

  return (
    <div className="rounded-2xl border rule bg-ink-900/70 p-5 sm:p-6">
      <h3 className="text-[17px] font-semibold text-ink-100">Did my key work?</h3>
      <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
        Paste the key RapidAPI gave you and we check it against <code className="font-mono text-[12.5px] text-signal-400">GET /v1/verify</code> on
        the live API. The key is used for that one request and never stored or logged.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void check();
        }}
        className="mt-4 flex flex-col sm:flex-row gap-2"
      >
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="x-rapidapi-key…"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border rule bg-ink-950 px-4 py-2.5 font-mono text-[13px] text-ink-100 placeholder:text-ink-600 focus:border-signal-600 focus:outline-none"
        />
        <button type="submit" className="btn btn-primary text-sm" disabled={state === 'checking'}>
          {state === 'checking' ? 'Checking…' : 'Check my key'}
        </button>
      </form>
      <p className="mt-2.5 font-mono text-[11px] text-ink-500">
        Heads-up: the check itself is one real request against your hotels quota. That is how you know it works.
      </p>
      {result ? (
        <p className={`mt-3 text-[14px] leading-relaxed ${result.ok ? 'text-verdict-low' : 'text-verdict-typical'}`}>{result.text}</p>
      ) : null}
    </div>
  );
}
