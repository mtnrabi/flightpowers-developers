import Link from 'next/link';
import { LINKS, SITE, SURFACES } from '@/lib/site';

/**
 * The footer is the crawl graph: four columns, ~45 links, identical on every
 * page. Long-tail pages feed link equity into the money pages from here.
 */

type FooterLink = { href: string; label: string; external?: boolean };

const columns: { heading: string; links: FooterLink[] }[] = [
  {
    heading: 'Company',
    links: [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/changelog', label: 'Changelog' },
      { href: '/blog', label: 'Blog' },
      { href: '/contact', label: 'Contact' },
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
  {
    heading: 'APIs',
    links: [
      { href: '/docs', label: 'Docs hub' },
      { href: '/flights-api', label: 'Flights API' },
      { href: '/flights-api/one-way', label: 'One-way search' },
      { href: '/flights-api/round-trip', label: 'Round-trip search' },
      { href: '/flights-api/price-insights', label: 'Price insights' },
      { href: '/flights-api/search-status', label: 'Search status' },
      { href: '/flights-api/parallel-date-scan', label: 'Parallel date scans' },
      { href: '/hotels-api', label: 'Hotels API' },
      { href: '/hotels-api/search', label: 'Hotel search' },
      { href: '/hotels-api/by-name', label: 'Hotel by name' },
      { href: '/hotels-api/geo-pricing', label: 'Geo-pricing' },
      { href: '/hotels-api/bulk', label: 'Competitive sets' },
    ],
  },
  {
    heading: 'For AI agents',
    links: [
      { href: '/mcp', label: 'MCP servers' },
      { href: '/ai-agents', label: 'AI agents' },
      { href: '/skills', label: 'Agent skills' },
      { href: '/integrations/claude', label: 'Claude' },
      { href: '/integrations/chatgpt', label: 'ChatGPT' },
      { href: '/integrations/cursor', label: 'Cursor' },
      { href: '/integrations/claude-code', label: 'Claude Code' },
      { href: LINKS.openapi, label: 'OpenAPI spec', external: true },
      { href: '/llms.txt', label: 'llms.txt' },
    ],
  },
  {
    heading: 'Free tools & more',
    links: [
      { href: '/tools', label: 'All free tools' },
      { href: '/tools/flight-price-checker', label: 'Flight price checker' },
      { href: '/tools/cheapest-month-to-fly', label: 'Cheapest month to fly' },
      { href: '/tools/hotel-price-by-country', label: 'Hotel price by country' },
      { href: '/integrations', label: 'Integrations' },
      { href: '/compare', label: 'Compare' },
      { href: '/use-cases', label: 'Use cases' },
      { href: '/guides', label: 'Guides' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t rule mt-16 sm:mt-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <p className="text-[15px] font-semibold text-ink-100">FlightPowers</p>
            <p className="mt-2 text-sm text-ink-400 max-w-[26ch]">{SITE.tagline}</p>
            <p className="mt-4 font-mono text-[11px] text-ink-400">{SITE.apiHost}</p>
            <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1.5">
              {SURFACES.map((s) =>
                s.external ? (
                  <a key={s.label} href={s.href} rel="noopener" className="font-mono text-[11px] text-ink-500 hover:text-signal-400">
                    {s.label}
                  </a>
                ) : (
                  <Link key={s.label} href={s.href} className="font-mono text-[11px] text-ink-500 hover:text-signal-400">
                    {s.label}
                  </Link>
                )
              )}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <p className="eyebrow">{col.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a href={link.href} rel="noopener" className="text-sm text-ink-300 hover:text-signal-400 transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-sm text-ink-300 hover:text-signal-400 transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t rule flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-ink-400">&copy; {new Date().getFullYear()} FlightPowers</p>
          <div className="flex items-center gap-5">
            <a href={LINKS.skills} rel="noopener" className="font-mono text-[11px] text-ink-400 hover:text-ink-200 transition-colors">
              GitHub
            </a>
            <a href={SITE.docsUrl} rel="noopener" className="font-mono text-[11px] text-ink-400 hover:text-ink-200 transition-colors">
              API docs &rarr;
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
