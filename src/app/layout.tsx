import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { SITE } from '@/lib/site';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
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
    default: 'FlightPowers: live flight & hotel pricing APIs with a price verdict',
    template: '%s · FlightPowers',
  },
  description:
    'Real-time Google Flights and Booking.com data as clean JSON. Google’s own price band and a ' +
    'low | typical | high verdict on every fare, paired-leg round trips, per-country hotel rates, ' +
    'and headers that tell “no flights” apart from “the search failed.”',
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
      </head>
      <body className="min-h-screen flex flex-col antialiased">
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
