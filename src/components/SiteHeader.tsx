import Link from 'next/link';
import { NAV, LINKS } from '@/lib/site';
import { Wordmark } from './Wordmark';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b rule bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="FlightPowers home">
            <Wordmark />
          </Link>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-7">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-ink-300 hover:text-ink-100 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={LINKS.rapidapiFlights}
              className="text-sm font-medium bg-signal-500 text-ink-950 px-3.5 py-1.5 rounded hover:bg-signal-400 transition-colors"
            >
              Get a key
            </a>
          </div>
        </div>

        {/* Mobile nav: still server-rendered links, no JS. */}
        <nav
          aria-label="Primary mobile"
          className="md:hidden flex items-center gap-5 overflow-x-auto pb-3 -mt-1"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13px] whitespace-nowrap text-ink-300 hover:text-ink-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
