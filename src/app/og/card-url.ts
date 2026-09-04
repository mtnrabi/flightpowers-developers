/**
 * Naming a share card: the pure, runtime-agnostic half of card.tsx.
 *
 * This file deliberately imports nothing. `card.tsx` pulls in `next/og` (WASM,
 * fonts, a base64 robot), which is the right dependency for the renderer and
 * the wrong one for anything that only needs to spell a URL — the legacy
 * `/og?title=` redirect runs on the edge runtime, where `Buffer` does not
 * exist and where every kilobyte of module graph is cold-start cost.
 *
 * So the encoding uses `btoa`/`atob` + `TextEncoder`, which exist on both the
 * edge and Node runtimes, instead of `Buffer`. The bytes on the wire are
 * unchanged: base64url of the UTF-8 title, exactly as before.
 */

export const DEFAULT_TITLE = 'Scan deals 24/7 with real-time flight and hotel data';

/** One year, and the response never changes for a given path. */
export const OG_CACHE_CONTROL =
  'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=604800, immutable';

/** base64url of a UTF-8 string, without `Buffer`. */
function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * The `[card]` segment for a page title — `<base64url(title)>.png`.
 * The single source of truth for the set: `generateStaticParams` on
 * `/og/[card]` prerenders exactly what this function produces, so a card that
 * a page links can never be a card the build did not render.
 */
export function ogCard(title: string): string {
  return `${toBase64Url(title)}.png`;
}

/** The og:image path for a page title. The inverse of `titleFromCard`. */
export function ogImagePath(title: string): string {
  return `/og/${ogCard(title)}`;
}

/** Read a title back out of a card segment. Returns null if it is not one. */
export function titleFromCard(card: string): string | null {
  const encoded = card.endsWith('.png') ? card.slice(0, -4) : card;
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const title = new TextDecoder('utf-8').decode(bytes);
    // U+FFFD means the segment was not UTF-8, i.e. not one of our titles.
    return title.length > 0 && !title.includes('�') ? title : null;
  } catch {
    return null;
  }
}
