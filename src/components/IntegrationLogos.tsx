import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { INTEGRATIONS, type Integration } from '@/lib/integrations';

/**
 * The integrations logo grid — the breadth argument, made visual.
 *
 * Marks are official vendor assets self-hosted in /public/logos (provenance:
 * public/logos/SOURCES.md). Rendering rules:
 *  - marks that ship as currentColor (openai, mcp) are inlined so they can
 *    inherit a light color on the dark ground; both are single-path files
 *    with no internal ids, so inlining cannot collide;
 *  - everything else renders as <img> (keeps clip-path ids namespaced by the
 *    browser, keeps the vendor's own colors);
 *  - wordmark-shaped files (zapier, rapidapi) get a shorter cap height so
 *    their visual weight matches the icon marks.
 * A missing file renders a text wordmark tile — never a hotlink, never a
 * redrawn mark.
 */

const CURRENT_COLOR = new Set(['openai', 'mcp']);
const WORDMARK = new Set(['zapier', 'rapidapi']);

function readMark(slug: string): string | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'public', 'logos', `${slug}.svg`), 'utf8');
  } catch {
    return null;
  }
}

function markExists(slug: string): boolean {
  try {
    fs.accessSync(path.join(process.cwd(), 'public', 'logos', `${slug}.svg`));
    return true;
  } catch {
    return false;
  }
}

export function Mark({ slug, name }: { slug: string; name: string }) {
  if (CURRENT_COLOR.has(slug)) {
    const svg = readMark(slug);
    if (svg) {
      return (
        <span
          className="logo-mark text-ink-100"
          role="img"
          aria-label={`${name} logo`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      );
    }
  }
  if (markExists(slug)) {
    return (
      <span className={`logo-mark ${WORDMARK.has(slug) ? 'logo-mark--word' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/logos/${slug}.svg`} alt={`${name} logo`} loading="lazy" />
      </span>
    );
  }
  // Fallback: clean text wordmark, no guessed mark.
  return <span className="logo-mark font-display text-[17px] font-semibold text-ink-100">{name}</span>;
}

function Tile({ item, showTag = false }: { item: Integration; showTag?: boolean }) {
  // A wordmark (or the text fallback) already IS the name; repeating it
  // under the mark reads as a stutter.
  const markIsName = WORDMARK.has(item.slug) || !markExists(item.slug);
  const inner = (
    <>
      <Mark slug={item.slug} name={item.name} />
      {!markIsName ? (
        <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-[14.5px] font-semibold text-ink-100">
          {item.name}
          {showTag ? <span className="font-mono text-[10px] font-normal uppercase tracking-wider text-ink-500">{item.tag}</span> : null}
        </p>
      ) : showTag ? (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-ink-500">{item.tag}</p>
      ) : null}
      <p className={`${markIsName && !showTag ? 'mt-3' : 'mt-1'} hidden sm:block text-[13px] leading-snug text-ink-400`}>{item.line}</p>
    </>
  );
  const cls =
    'block rounded-2xl border rule bg-ink-900/50 p-3.5 sm:p-5 hover:border-ink-500 hover:bg-ink-900/80 transition-colors';
  return item.external ? (
    <a href={item.href} rel="noopener" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={item.href} className={cls}>
      {inner}
    </Link>
  );
}

export function IntegrationGrid({ items = INTEGRATIONS, showTags = false }: { items?: Integration[]; showTags?: boolean }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <Tile key={item.slug + item.href} item={item} showTag={showTags} />
        ))}
      </div>
      <p className="mt-5 font-mono text-[11px] text-ink-500">
        Integrations we build and support. All marks belong to their owners; no partnership or endorsement implied.
      </p>
    </div>
  );
}
