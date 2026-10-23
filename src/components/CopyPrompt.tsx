'use client';

import { useState } from 'react';
import { track } from '@/lib/track';

/**
 * One prompt a visitor can paste into their AI client, with a Copy button.
 * A copy sends `api_upsell_click` with action `copy_prompt` and tool = the
 * label passed in, so the beacon shows whether the prompt gets used.
 */
export function CopyPrompt({ prompt, tool }: { prompt: string; tool: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    track({ e: 'api_upsell_click', tool, action: 'copy_prompt' });
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable: the text is on the page to select by hand */
    }
  }

  return (
    <div className="rounded-xl border rule bg-ink-950/60 p-4">
      <p className="text-[14px] leading-relaxed text-ink-200">&ldquo;{prompt}&rdquo;</p>
      <button type="button" onClick={copy} className="btn btn-ghost mt-3">
        {copied ? 'Copied ✓' : 'Copy prompt'}
      </button>
    </div>
  );
}
