import type { Metadata } from 'next';
import Link from 'next/link';
import { withOg } from '@/lib/meta';
import { LINKS, SITE } from '@/lib/site';
import { Breadcrumbs, Code, Container, JsonLd, Section, SectionHead } from '@/components/ui';

/**
 * Open-source example apps (MIT) that run on a free RapidAPI key of the Google
 * Flights Live API. Each repo ships a recorded real response (fetched
 * 2026-11-11 21:55-21:57 UTC) so it can be tried before a key exists; the
 * example output below is copied from those repos' READMEs.
 */

export const metadata: Metadata = withOg({
  title: 'Examples: open-source flight price apps on the Google Flights API',
  description:
    'Three MIT example apps on the Google Flights Live API: a Telegram / Discord fare-drop bot, a cheapest-dates CLI that ranks a date range, and a daily fare watch as an n8n workflow or GitHub Action.',
  alternates: { canonical: '/docs/examples' },
});

export const dynamic = 'force-static';

const linkClass = 'text-signal-400 underline underline-offset-4 hover:text-signal-500';

const EXAMPLES = [
  {
    name: 'flight-price-alert-bot',
    url: 'https://github.com/mtnrabi/flight-price-alert-bot',
    what: 'A Telegram (or Discord) bot that watches routes and messages you when a fare drops under your target, under Google’s usual range, or is rated low by Google. Never pings twice for the same price.',
    stack: 'Python, standard library only. Docker, cron or GitHub Actions.',
    requests: 'One request per watch per check.',
  },
  {
    name: 'cheapest-week-to-fly',
    url: 'https://github.com/mtnrabi/cheapest-week-to-fly',
    what: 'A CLI that prices every departure date in a range at one or more trip lengths and ranks the round trips, each with Google’s verdict and usual range. Writes a CSV.',
    stack: 'One Python file, standard library only.',
    requests: 'One request per date and trip length: a week at 7 nights is 7.',
  },
  {
    name: 'n8n-flight-fare-watch',
    url: 'https://github.com/mtnrabi/n8n-flight-fare-watch',
    what: 'A daily fare watch you import into n8n (with the FlightPowers node or the plain HTTP Request node) that emails or Slacks you on a deal. The same watch also runs as a GitHub Action that opens an issue.',
    stack: 'n8n workflow JSON, or a GitHub Action in Python.',
    requests: 'One request a day, about 30 a month.',
  },
] as const;

const OUTPUT = `$ python cheapest_week.py --from JFK --to LIS --start 2027-02-01 --end 2027-02-07 --nights 7

#  depart      return      nights  total USD  stops  airline (outbound)          Google says  usual range
1  2027-02-01  2027-02-08  7       628        0      Tap Air Portugal | JetBlue  typical      470-660
2  2027-02-02  2027-02-09  7       628        0      Tap Air Portugal | JetBlue  high         425-540
3  2027-02-03  2027-02-10  7       628        0      Tap Air Portugal | JetBlue  high         425-540
4  2027-02-04  2027-02-11  7       628        0      Tap Air Portugal | JetBlue  typical      470-660
5  2027-02-07  2027-02-14  7       628        0      Tap Air Portugal | JetBlue  typical      470-660
6  2027-02-05  2027-02-12  7       699        2      American, British Airways   high         470-660
7  2027-02-06  2027-02-13  7       713        2      Royal Air Maroc             high         470-660

7 requests, 7 priced, 0 failed.`;

export default function ExamplesPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Docs', item: `${SITE.url}/docs` },
            { '@type': 'ListItem', position: 3, name: 'Examples', item: `${SITE.url}/docs/examples` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/docs', label: 'Docs' },
            { href: '/docs/examples', label: 'Examples' },
          ]}
        />
      </Container>

      <Container className="pt-8 sm:pt-12 pb-12">
        <p className="eyebrow">Examples</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
          Open-source apps you can <span className="text-signal-500">fork and run</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Three small, working projects on the Google Flights API, MIT licensed on GitHub. Each one runs on a free
          RapidAPI key, and each ships a real recorded response so you can try it before you sign up.
        </p>
      </Container>

      <Section>
        <SectionHead eyebrow="Repos" title="Three examples, one key" />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {EXAMPLES.map((e) => (
            <div key={e.name} className="border rule rounded-xl p-6">
              <h3 className="font-mono text-[15px] font-semibold">
                <a href={e.url} rel="noopener" className={linkClass}>
                  {e.name}
                </a>
              </h3>
              <p className="mt-3 text-[14.5px] text-ink-300 leading-relaxed">{e.what}</p>
              <p className="mt-3 text-[13.5px] text-ink-400">{e.stack}</p>
              <p className="mt-1 text-[13.5px] text-ink-400">{e.requests}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Real output"
          title="The cheapest week to fly, JFK to Lisbon"
          lede="From cheapest-week-to-fly, on fares fetched 2026-11-11 21:55 UTC. The same $628 nonstop is typical one week and high the next, because Google's usual range for those dates differs."
        />
        <div className="mt-8">
          <Code label="cheapest-week-to-fly">{OUTPUT}</Code>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Get a key" title="Two minutes from clone to a live fare" />
        <p className="mt-6 max-w-3xl text-[14.5px] text-ink-400 leading-relaxed">
          Subscribe to the{' '}
          <a href={LINKS.rapidapiFlights} rel="noopener" className={linkClass}>
            Google Flights Live API on RapidAPI
          </a>{' '}
          (the BASIC plan is free, no card), put the key in <code className="field">RAPIDAPI_KEY</code>, and run the
          example. Each repo&rsquo;s README says how many requests it makes; plans and quotas are on{' '}
          <Link href="/pricing" className={linkClass}>
            the pricing page
          </Link>
          . Prefer a client library? See{' '}
          <Link href="/docs/sdks" className={linkClass}>
            the SDKs
          </Link>
          .
        </p>
      </Section>
    </>
  );
}
