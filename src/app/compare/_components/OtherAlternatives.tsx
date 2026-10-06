import Link from 'next/link';
import { SectionHead } from '@/components/ui';
import { COMPARE_PAGES } from '../_lib/pages';

/**
 * The sibling block at the foot of each compare page: every other page in
 * the hub, plus the two product hubs. `current` is the page's own href.
 */
export function OtherAlternatives({ current }: { current: string }) {
  const others = COMPARE_PAGES.filter((p) => p.href !== current);
  return (
    <>
      <SectionHead eyebrow="Other alternatives" title="Compared on the same terms" />
      <p className="mt-4 max-w-3xl text-[14.5px] text-ink-400 leading-relaxed">
        The product side of every page:{' '}
        <Link href="/flights-api" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
          Flights API
        </Link>
        ,{' '}
        <Link href="/hotels-api" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
          Hotels API
        </Link>{' '}
        and the{' '}
        <Link href="/mcp" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
          MCP servers
        </Link>
        . All comparisons are on{' '}
        <Link href="/compare" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
          /compare
        </Link>
        .
      </p>
      <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((p) => (
          <li key={p.href}>
            <Link href={p.href} className="block h-full rounded-2xl border rule bg-ink-900/50 p-4 hover:border-ink-500 transition-colors">
              <p className="text-[14.5px] font-semibold text-ink-100">{p.title}</p>
              <p className="mt-1 font-mono text-[11px] text-ink-500">their pages read {p.read}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
