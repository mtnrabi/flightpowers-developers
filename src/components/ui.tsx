import Link from 'next/link';
import type { ReactNode } from 'react';

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Section({
  children,
  className = '',
  bordered = true,
}: {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <section className={`${bordered ? 'border-t rule' : ''} py-16 sm:py-20 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className={`text-2xl sm:text-3xl font-semibold ${eyebrow ? 'mt-3' : ''}`}>{title}</h2>
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
  variant?: 'primary' | 'ghost';
  external?: boolean;
}) {
  const cls =
    variant === 'primary'
      ? 'bg-signal-500 text-ink-950 hover:bg-signal-400'
      : 'border rule text-ink-200 hover:border-ink-600 hover:text-ink-100';
  const common = `inline-flex items-center gap-2 rounded px-4 py-2.5 text-sm font-medium transition-colors ${cls}`;
  return external ? (
    <a href={href} rel="noopener" className={common}>
      {children}
    </a>
  ) : (
    <Link href={href} className={common}>
      {children}
    </Link>
  );
}

/** Server-rendered code block. No syntax-highlighting runtime ships to the browser. */
export function Code({ label, children }: { label?: string; children: string }) {
  return (
    <figure className="rounded-lg border rule bg-ink-900 overflow-hidden">
      {label ? (
        <figcaption className="flex items-center gap-2 border-b rule px-4 py-2 font-mono text-[11px] tracking-wider uppercase text-ink-400">
          <span className="inline-block size-1.5 rounded-full bg-signal-600" aria-hidden="true" />
          {label}
        </figcaption>
      ) : null}
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed">
        <code className="font-mono text-ink-200">{children}</code>
      </pre>
    </figure>
  );
}

export function FieldRow({
  name,
  type,
  children,
}: {
  name: string;
  type?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,16rem)_1fr] sm:gap-6 py-4 border-b rule last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <code className="field">{name}</code>
        {type ? <span className="font-mono text-[11px] text-ink-600">{type}</span> : null}
      </div>
      <p className="text-sm text-ink-300 leading-relaxed">{children}</p>
    </div>
  );
}

export function Feature({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t rule pt-5">
      <h3 className="text-[15px] font-semibold text-ink-100">{title}</h3>
      <p className="mt-2 text-sm text-ink-400 leading-relaxed">{children}</p>
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
export function FaqSection({ items, heading = 'Questions' }: { items: Faq[]; heading?: string }) {
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
            <dt className="text-[15px] font-semibold text-ink-100">{item.q}</dt>
            <dd className="mt-2 text-sm text-ink-400 leading-relaxed">{item.a}</dd>
          </div>
        ))}
      </dl>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
