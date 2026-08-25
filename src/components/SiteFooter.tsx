import Link from 'next/link';
import { LINKS, SITE } from '@/lib/site';

const columns: { heading: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    heading: 'APIs',
    links: [
      { href: '/flights-api', label: 'Flights API' },
      { href: '/hotels-api', label: 'Hotels API' },
      { href: '/changelog', label: 'Changelog' },
    ],
  },
  {
    heading: 'Get a key',
    links: [
      { href: LINKS.rapidapiFlights, label: 'RapidAPI — Flights', external: true },
      { href: LINKS.rapidapiHotels, label: 'RapidAPI — Hotels', external: true },
      { href: LINKS.apifyFlights, label: 'Apify — Flights actor', external: true },
      { href: LINKS.apifyHotels, label: 'Apify — Hotels actor', external: true },
    ],
  },
  {
    heading: 'For agents',
    links: [
      { href: LINKS.smithery, label: 'MCP server on Smithery', external: true },
      { href: LINKS.npmNode, label: 'n8n community node', external: true },
      { href: LINKS.skills, label: 'Agent skills (MIT)', external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t rule mt-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[15px] font-semibold text-ink-100">FlightPowers</p>
            <p className="mt-2 text-sm text-ink-400 max-w-[24ch]">{SITE.tagline}</p>
            <p className="mt-4 font-mono text-[11px] text-ink-600">{SITE.apiHost}</p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <p className="eyebrow">{col.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) =>
                  link.external ? (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        rel="noopener"
                        className="text-sm text-ink-300 hover:text-signal-400 transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-ink-300 hover:text-signal-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t rule flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-ink-600">
            &copy; {new Date().getFullYear()} FlightPowers
          </p>
          <a
            href={LINKS.product}
            rel="noopener"
            className="font-mono text-[11px] text-ink-600 hover:text-ink-400 transition-colors"
          >
            flightpowers.com &rarr;
          </a>
        </div>
      </div>
    </footer>
  );
}
