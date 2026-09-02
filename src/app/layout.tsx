import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { SITE } from '@/lib/site';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SessionBeacon } from '@/components/SessionBeacon';
import { JsonLd } from '@/components/ui';
import './globals.css';

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-face',
});

const display = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display-face',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-face',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'FlightPowers: Scan deals 24/7 with real-time flight & hotel data',
    template: '%s · FlightPowers',
  },
  // Fallback only, and kept inside Google's ~160-char snippet window. Every
  // page sets its own; this is what a page that skipped withOg() would ship.
  description:
    'Scan deals 24/7 with real-time flight & hotel data, connected to your AI agent',
  applicationName: SITE.name,
  authors: [{ name: 'Matan Rabi' }],
  // Fallbacks only: every page wraps its own metadata in withOg(), which
  // replaces these wholesale with per-route card fields. No og:url here, so a
  // page that somehow skips withOg() ships no url rather than the wrong one.
  openGraph: {
    type: 'website',
    siteName: SITE.name,
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <head>
        <link rel="author" href="/llms.txt" type="text/plain" title="LLM Information" />
        {/*
          The brand entity. Before this the site had no Organization node at
          all, so nothing tied the name, the logo, and the marketplace profiles
          together; the only Organization on the site was a bare {name} stub
          nested in article publisher fields. It carries an @id so those
          publisher references resolve to a real node instead of a stub.

          Every sameAs below is a live profile we control. Nothing here is a
          claim about size, rating, or customers.
        */}
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Organization',
            '@id': `${SITE.url}/#organization`,
            name: SITE.name,
            url: SITE.url,
            logo: {
              '@type': 'ImageObject',
              url: `${SITE.url}/apple-icon.png`,
            },
            description: SITE.tagline,
            founder: { '@type': 'Person', name: 'Matan Rabi', url: `${SITE.url}/about` },
            sameAs: [
              'https://rapidapi.com/user/mtnrabi',
              'https://github.com/mtnrabi',
              'https://apify.com/mtnrabi',
              'https://www.npmjs.com/package/n8n-nodes-flight-hotel-data',
            ],
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        {/* One beacon per tab, carrying the campaign labels from the URL. It
            is the denominator for every funnel rate we report. */}
        <SessionBeacon />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-3 focus:left-3 focus:bg-signal-500 focus:text-ink-950 focus:px-3 focus:py-2 focus:rounded"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
