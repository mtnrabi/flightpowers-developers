import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { SITE } from '@/lib/site';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-face',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'FlightPowers — real-time flight and hotel pricing APIs',
    template: '%s · FlightPowers',
  },
  description:
    'REST APIs for live Google Flights and Booking.com pricing. Google price-insights bands, ' +
    'paired-leg round-trip search, per-country hotel rates, and response headers that tell you ' +
    'why a search came back empty.',
  applicationName: SITE.name,
  authors: [{ name: 'Matan Rabi' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    url: SITE.url,
    title: 'FlightPowers — real-time flight and hotel pricing APIs',
    description:
      'Live flight and hotel prices over REST. Price-insights bands, paired-leg round trips, ' +
      'per-country hotel pricing, and honest empty-result signalling.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlightPowers — real-time flight and hotel pricing APIs',
    description:
      'Live flight and hotel prices over REST, with price-insights bands and honest empty-result signalling.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
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
