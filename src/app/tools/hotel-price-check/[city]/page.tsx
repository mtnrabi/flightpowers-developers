import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { HotelSearchTool } from '@/components/tools/HotelSearchTool';
import { CityCrossLinks, CityFacts } from '@/components/tools/GridSections';
import { Breadcrumbs, Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { withOg } from '@/lib/meta';
import { CITIES, findCity, hotelPriceCheckTitle, type GridCity } from '@/lib/grid';
import { COUNTS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const c = findCity(city);
  if (!c) return {};
  return withOg({
    title: hotelPriceCheckTitle(c),
    description: `See what hotels in ${c.name} are quoting right now for your dates: property names, the total for the stay, review scores and a link that opens the same room. One real search, free, no signup.`,
    alternates: { canonical: `/tools/hotel-price-check/${c.slug}` },
  });
}

function faqFor(c: GridCity): Faq[] {
  return [
    {
      q: `How much is a hotel in ${c.name}?`,
      a: `It depends on the dates, which is why this page runs the search instead of printing a figure. Set your check-in and check-out above and you get the properties Booking.com is quoting for exactly those nights, cheapest first, with the spread across that result set.`,
    },
    {
      q: `Is the cheapest result the cheapest room in ${c.name}?`,
      a: 'No. It is the cheapest of the properties this one search returned, which is a sample of what is available, not an exhaustive sweep of the city. Treat it as the floor this search found, and say so if you republish it.',
    },
    {
      q: 'Why do the numbers change between runs?',
      a: 'Because they are live. Rates and availability move within minutes, and the set of properties that comes back moves with them. Nothing here is cached to look stable.',
    },
    {
      q: `Do prices in ${c.name} differ depending on the country you book from?`,
      a: 'Sometimes, and the API can measure it through proxy_country. But one reading per country is not a comparison: a single market moves between identical requests by more than the gap you would be trying to prove. That needs repeat sampling, which is a different tool with a different budget.',
    },
    {
      q: 'What comes back in each row?',
      a: 'Property name, total price for the stay, review score and review count where Booking publishes them, room type, and a deep link with your dates and occupancy already applied.',
    },
    {
      q: `How do I run a ${c.name} search from my own code?`,
      a: `One POST with destination "${c.destination}" and your two dates. The card under the results is that request in cURL, Python and Node, against either the RapidAPI host or api.flightpowers.com. On your own key you can add a per-night budget and the ${COUNTS.hotelFilters} Booking.com filters.`,
    },
  ];
}

export default async function Page({ params }: Props) {
  const { city } = await params;
  const c = findCity(city);
  if (!c) notFound();

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: `Hotel price check: ${c.name}`,
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          url: `${SITE.url}/tools/hotel-price-check/${c.slug}`,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            `Live Booking.com search for ${c.name}`,
            'Total price for the stay, cheapest first',
            'Review score and count where Booking publishes them',
            'A deep link that opens the same room with your dates',
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Free tools', item: `${SITE.url}/tools` },
            { '@type': 'ListItem', position: 2, name: 'Hotel Price Check', item: `${SITE.url}/tools/hotel-price-check` },
            { '@type': 'ListItem', position: 3, name: c.name, item: `${SITE.url}/tools/hotel-price-check/${c.slug}` },
          ],
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-10">
        <Breadcrumbs
          trail={[
            { href: '/tools', label: 'tools' },
            { href: '/tools/hotel-price-check', label: 'hotel-price-check' },
            { href: `/tools/hotel-price-check/${c.slug}`, label: c.slug },
          ]}
        />
        <p className="eyebrow mt-6">Free tool · live search, rate-limited</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          Hotel prices in <span className="text-signal-500">{c.name}</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          What Booking.com is quoting for {c.name} right now, on your dates. Cheapest first, review score next to every price,
          and a link straight to the room.
        </p>
      </Container>

      <Container className="pb-16">
        <HotelSearchTool initial={{ destination: c.destination }} />
      </Container>

      <CityFacts city={c} />

      <Section>
        <SectionHead
          eyebrow="Reading the result"
          title={`What this ${c.name} search does and does not prove`}
          lede="The limits are part of the tool, not a disclaimer bolted on the bottom."
        />
        <div className="mt-8 space-y-4 text-[15px] text-ink-300 leading-relaxed max-w-3xl">
          <p>
            Everything above is one live Booking.com search for the dates in the form. The range printed under the list is the
            spread inside that result set, which is a genuine fact about those properties on those nights. It is not an average
            nightly rate for {c.name}, and we do not compute one, because a defensible average needs a defined sample and repeat
            measurement rather than one lookup.
          </p>
          <p>
            Review score sits next to price on purpose. A cheap room in a well-reviewed property and a cheap room in a badly
            reviewed one are different results, and sorting by price alone hides that. Where Booking publishes no score, the row
            says so rather than filling the gap.
          </p>
          <p>
            Move the dates and run it again. Two searches a week apart on the same city tell you more than any static table
            could, and each one costs a single request.
          </p>
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10">
          <SectionHead
            eyebrow="On your own key"
            title={`One ${c.name} search here. A tracked comp set on your key`}
            lede={`Same endpoint, more arguments: a per-night budget, the ${COUNTS.hotelFilters} Booking.com filters, your own occupancy, and proxy_country once you are sampling markets properly.`}
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/hotels-api/search" variant="ghost">
              Hotels search docs
            </Cta>
            <Cta href="/docs/quickstart" variant="ghost">
              Five-minute quickstart
            </Cta>
            <Cta href={rapidApiPricingUrl('hotels', 'tool')} external variant="primary">
              See pricing on RapidAPI →
            </Cta>
          </div>
        </div>
      </Section>

      <CityCrossLinks city={c} />

      <Section>
        <FaqSection items={faqFor(c)} />
      </Section>

      <Section>
        <SectionHead eyebrow="Keep going" title="The rest of the toolkit" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/tools/hotel-price-check', label: 'Any other destination', sub: 'The same search, empty form' },
            { href: '/tools/hotel-price-by-country', label: 'Hotel Price by Country', sub: 'Repeat-sampled per-market pricing' },
            { href: '/hotels-api/bulk', label: 'Bulk hotel search', sub: 'Up to five properties in one request' },
            { href: '/tools#free-mcp', label: 'Free MCP server', sub: 'Ask your assistant instead. No key, ad-supported' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 transition-colors hover:border-ink-500">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
