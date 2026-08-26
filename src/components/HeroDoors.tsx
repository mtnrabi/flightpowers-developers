'use client';

import { useState, type ReactNode } from 'react';

/**
 * The two-door hero toggle (Postiz's self-segmentation mechanic).
 * BOTH doors' content is server-rendered into the HTML; the toggle only
 * switches visibility, so crawlers and no-JS visitors get everything
 * (door A shows by default).
 */
export function HeroDoors({
  doorALabel,
  doorBLabel,
  doorA,
  doorB,
}: {
  doorALabel: string;
  doorBLabel: string;
  doorA: ReactNode;
  doorB: ReactNode;
}) {
  const [door, setDoor] = useState<'a' | 'b'>('a');
  return (
    <div>
      <div className="inline-flex rounded-full border rule bg-ink-900 p-1" role="tablist" aria-label="Choose your path">
        <button
          type="button"
          role="tab"
          aria-selected={door === 'a'}
          onClick={() => setDoor('a')}
          className={`rounded-full px-4 py-1.5 text-[13.5px] font-medium transition-colors ${
            door === 'a' ? 'bg-ink-100 text-ink-950' : 'text-ink-300 hover:text-ink-100'
          }`}
        >
          {doorALabel}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={door === 'b'}
          onClick={() => setDoor('b')}
          className={`rounded-full px-4 py-1.5 text-[13.5px] font-medium transition-colors ${
            door === 'b' ? 'bg-ink-100 text-ink-950' : 'text-ink-300 hover:text-ink-100'
          }`}
        >
          {doorBLabel}
        </button>
      </div>
      <div className={door === 'a' ? 'mt-8' : 'hidden'}>{doorA}</div>
      <div className={door === 'b' ? 'mt-8' : 'hidden'}>{doorB}</div>
    </div>
  );
}
