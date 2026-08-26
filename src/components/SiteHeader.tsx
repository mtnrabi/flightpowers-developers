import Link from 'next/link';
import { NAV, rapidApiPricingUrl } from '@/lib/site';
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
            {NAV.map((item) =>
              item.external ? (
                <a key={item.href} href={item.href} rel="noopener" className="text-sm text-ink-300 hover:text-ink-100 transition-colors">
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} href={item.href} className="text-sm text-ink-300 hover:text-ink-100 transition-colors">
                  {item.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-3">
            <a href={rapidApiPricingUrl('flights', 'nav')} rel="noopener" className="btn btn-accent !px-4 !py-2 text-sm">
              Get a key
            </a>
          </div>
        </div>

        {/* Mobile nav: server-rendered links, no JS. */}
        <nav aria-label="Primary mobile" className="md:hidden flex items-center gap-6 overflow-x-auto pb-1 -mt-2">
          {NAV.map((item) =>
            item.external ? (
              <a key={item.href} href={item.href} rel="noopener" className="text-sm whitespace-nowrap text-ink-300 hover:text-ink-100 py-2.5">
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className="text-sm whitespace-nowrap text-ink-300 hover:text-ink-100 py-2.5">
                {item.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
