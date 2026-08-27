import Link from 'next/link';
import type { ReactNode } from 'react';

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Section({
  children,
  className = '',
  bordered = true,
  id,
}: {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={`${bordered ? 'border-t rule' : ''} py-12 sm:py-24 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lede,
  accent,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  /** substring of the title rendered in the accent color */
  accent?: string;
}) {
  let node: ReactNode = title;
  if (accent && title.includes(accent)) {
    const [before, after] = title.split(accent, 2) as [string, string];
    node = (
      <>
        {before}
        <span className="text-signal-500">{accent}</span>
        {after}
      </>
    );
  }
  return (
    <div className="max-w-2xl">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className={`text-[1.75rem] sm:text-4xl font-semibold ${eyebrow ? 'mt-3' : ''}`}>{node}</h2>
      {lede ? <p className="lede mt-4">{lede}</p> : null}
    </div>
  );
}

export function Cta({
  href,
  children,
  variant = 'primary',
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'accent' | 'ghost';
  external?: boolean;
}) {
  const cls = variant === 'primary' ? 'btn btn-primary' : variant === 'accent' ? 'btn btn-accent' : 'btn btn-ghost';
  return external ? (
    <a href={href} rel="noopener" className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function CheckBullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[15px] text-ink-300">
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 shrink-0 text-verdict-low">
            <path d="M4 10.5 8.5 15 16 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Server-rendered code block. No syntax-highlighting runtime ships to the browser. */
export function Code({ label, children }: { label?: string; children: string }) {
  return (
    <figure className="terminal">
      {label ? (
        <figcaption className="terminal-bar">
          <span className="terminal-dots flex gap-1.5" aria-hidden="true">
            <span className="bg-ink-600" />
            <span className="bg-ink-600" />
            <span className="bg-signal-600" />
          </span>
          <span className="uppercase tracking-wider">{label}</span>
        </figcaption>
      ) : null}
      <pre tabIndex={0} className="overflow-x-auto p-4 text-[12.5px] leading-relaxed">
        <code className="font-mono text-ink-200">{children}</code>
      </pre>
    </figure>
  );
}

export function FieldRow({ name, type, children }: { name: string; type?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,16rem)_1fr] sm:gap-6 py-4 border-b rule last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <code className="field">{name}</code>
        {type ? <span className="font-mono text-[11px] text-ink-600">{type}</span> : null}
      </div>
      <p className="text-[15px] text-ink-300 leading-relaxed">{children}</p>
    </div>
  );
}

export function Feature({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border rule bg-ink-900/60 p-6">
      <h3 className="text-[16px] font-semibold text-ink-100">{title}</h3>
      <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">{children}</p>
    </div>
  );
}

export function Breadcrumbs({ trail }: { trail: { href: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="font-mono text-[11px] text-ink-600">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden="true">/</span> : null}
            {i === trail.length - 1 ? (
              <span className="text-ink-400">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-ink-300">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export type Faq = { q: string; a: string };

/** Renders the FAQ as real HTML *and* emits FAQPage JSON-LD from the same array. */
export function FaqSection({ items, heading = 'Questions, answered plainly' }: { items: Faq[]; heading?: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
  return (
    <>
      <SectionHead title={heading} />
      <dl className="mt-8 max-w-3xl">
        {items.map((item) => (
          <div key={item.q} className="border-t rule py-6">
            <dt className="text-[16px] font-semibold text-ink-100">{item.q}</dt>
            <dd className="mt-2 text-[15px] text-ink-400 leading-relaxed">{item.a}</dd>
          </div>
        ))}
      </dl>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function VerdictBadge({ verdict }: { verdict: 'low' | 'typical' | 'high' | null | undefined }) {
  if (!verdict) return <span className="font-mono text-[11px] text-ink-600">no band</span>;
  return <span className={`verdict verdict-${verdict}`}>{verdict}</span>;
}

/**
 * Google's price band rendered as a track, with the fare's position on it.
 * Pure SVG-free CSS; server-renderable.
 */
export function PriceBand({
  low,
  high,
  price,
  label,
}: {
  low: number;
  high: number;
  price: number;
  label?: string;
}) {
  // Position the price on a track that extends 25% beyond the band each side.
  const span = high - low || 1;
  const min = low - span * 0.35;
  const max = high + span * 0.35;
  const pct = Math.min(98, Math.max(2, ((price - min) / (max - min)) * 100));
  const lowPct = ((low - min) / (max - min)) * 100;
  const highPct = ((high - min) / (max - min)) * 100;
  return (
    <div className="w-full">
      {label ? <p className="font-mono text-[11px] text-ink-400 mb-1.5">{label}</p> : null}
      <div className="relative h-2 rounded-full bg-ink-800">
        <div
          className="absolute inset-y-0 rounded-full bg-ink-600"
          style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3.5 rounded-full border-2 border-ink-950 bg-signal-500"
          style={{ left: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[11px] text-ink-500">
        <span className="text-ink-400">${low} low</span>
        <span className="text-ink-400">${high} high</span>
      </div>
    </div>
  );
}

/** Honesty label for canned output. Required next to anything not live. */
export function CapturedBadge({ date }: { date: string }) {
  return (
    <span className="captured-badge">
      <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
        <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 3.5V6l1.8 1.2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      captured run · {date}
    </span>
  );
}
