import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { ExecuteWidget } from '@/components/ExecuteWidget';
import { PricingTable } from '@/components/PricingTable';
import {
  Breadcrumbs,
  CheckBullets,
  Code,
  Container,
  Cta,
  FaqSection,
  FieldRow,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { FIXTURES } from '@/lib/fixtures';
import { HOTEL_PLANS } from '@/lib/pricing';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Hotel by Name API: availability and price without property IDs',
  description:
    'POST /hotel_by_name takes the hotel name a human would type (name resolution included) and returns availability, live price, review score and a booking link. Sold out and not found return the same shape with available: false, so parsing never branches.',
  alternates: { canonical: '/hotels-api/by-name' },
});

export const dynamic = 'force-static';

const RESPONSE_SHAPE = `{
  name:          string | null,
  available:     boolean,   // false = sold out or not found
  price_string:  string | null,   // total for the stay
  price:         number | null,
  review_score:  number | null,
  review_count:  number | null,
  room_type:     string | null,
  image_url:     string | null,
  link:          string | null,   // booking link for this room & dates
  nights:        number | null,
  adults:        number | null,
  children:      number | null
}`;

const faq: Faq[] = [
  {
    q: 'What if two hotels share a name?',
    a: 'Pass area, a city or region like "Budapest" or "Antalya". The search query becomes "<hotel_name>, <area>" while name matching still uses only hotel_name, so the area steers the search without polluting the match.',
  },
  {
    q: 'What comes back when the hotel is sold out or not found?',
    a: 'The same response shape, with "available": false and nulls in the price fields. There is no separate error format to branch on: check one boolean and move on.',
  },
  {
    q: 'Do I ever need a property ID?',
    a: 'Not on this endpoint: resolution from name to property happens inside the call. If you check the same property repeatedly, the ID-based path is faster to build on: POST /resolve turns the name into a Booking.com ID once, then POST /hotel returns the full room list directly. The competitive-set tracking page covers that pattern.',
  },
  {
    q: 'Can I price the same hotel from another market?',
    a: 'Yes. proxy_country works here like on every endpoint. The captured example on this page was one of three requests that differed only in proxy_country; the geo-pricing page shows the full comparison.',
  },
  {
    q: 'Is the price per night?',
    a: 'No: price is the total for the stay, and the response carries nights so a nightly rate is one division away.',
  },
];

export default function HotelByNamePage() {
  const fx = FIXTURES.hotelGeoKremlin;
  const us = fx.data.us;
  const request = { ...fx.request.body, proxy_country: 'us' };

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Hotels API', item: `${SITE.url}/hotels-api` },
            { '@type': 'ListItem', position: 3, name: 'By Name', item: `${SITE.url}/hotels-api/by-name` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers Hotel by Name API',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free tier: 10 requests/month on RapidAPI' },
          url: `${SITE.url}/hotels-api/by-name`,
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/hotels-api', label: 'Hotels API' },
            { href: '/hotels-api/by-name', label: 'By Name' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Hotel by Name API</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                The name a <span className="text-signal-500">human</span> would type
              </h1>
              <p className="lede mt-5">
                Most hotel APIs make you resolve an internal property ID before you can ask anything useful.{' '}
                <code className="font-mono text-[0.85em] text-signal-400">/hotel_by_name</code> does the resolution for you.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>
                      Send <code className="font-mono text-[13px] text-signal-400">hotel_name</code> + dates: availability, live
                      price and a booking link come back
                    </>,
                    <>
                      <code className="font-mono text-[13px] text-signal-400">area</code> disambiguates generic names: the match
                      still runs on the name alone
                    </>,
                    <>
                      Sold out and not found return the same shape with{' '}
                      <code className="font-mono text-[13px] text-signal-400">available: false</code>, so parsing never branches
                    </>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('hotels', 'endpoint')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/hotels-api" variant="ghost">
                  All hotel endpoints
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>

            <ExecuteWidget
              title="POST /hotel_by_name · booking-live-api"
              tool="hotel-by-name-execute"
              capturedAt={fx.captured_at}
              requestText={JSON.stringify(request, null, 2)}
              responseText={JSON.stringify(us, null, 2)}
              headers={fx.headers}
            />
          </div>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="Request fields"
          title="Name and dates in, one flat object out"
          lede="The captured run above sent “Kremlin Palace” with area “Antalya” (a generic name a plain search could mismatch) and got the property back with its live rate for the stay."
        />
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">Required</p>
            <div className="mt-3">
              <FieldRow name="hotel_name" type="string">
                Free text: the name a person would type. Matching runs on this field only.
              </FieldRow>
              <FieldRow name="checkin_date / checkout_date" type="string">
                <code className="field">YYYY-MM-DD</code>.
              </FieldRow>
            </div>
            <p className="mt-10 font-mono text-[11px] uppercase tracking-wider text-signal-500">Optional</p>
            <div className="mt-3">
              <FieldRow name="area" type="string">
                City or region to disambiguate generic names, like &ldquo;Budapest&rdquo; or &ldquo;Antalya&rdquo;. The search query
                becomes <code className="field">&quot;&lt;hotel_name&gt;, &lt;area&gt;&quot;</code> while name matching still uses
                only <code className="field">hotel_name</code>.
              </FieldRow>
              <FieldRow name="adults / children" type="int">
                Default <code className="field">2</code> / <code className="field">0</code>.
              </FieldRow>
              <FieldRow name="currency" type="string">
                Defaults to <code className="field">USD</code>.
              </FieldRow>
              <FieldRow name="proxy_country" type="string">
                Price the property from another market:{' '}
                <Link href="/hotels-api/geo-pricing" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
                  the geo-pricing page
                </Link>{' '}
                compares three markets with this exact request.
              </FieldRow>
              <FieldRow name="free_cancellation" type="boolean">
                Restrict to refundable rates.
              </FieldRow>
            </div>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">One shape, always</h3>
            <Code label="the response shape">{RESPONSE_SHAPE}</Code>
            <p className="mt-3 text-[14px] text-ink-400 leading-relaxed">
              Sold out and not-found return this same shape with <code className="field">available: false</code> and nulls, never a
              different error format. Your integration checks one boolean; there is no second code path to test.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Response"
          title="Every response field"
          lede="Values in brackets are from the captured Kremlin Palace run above (the us request). Real output, not invented examples."
        />
        <div className="mt-8 max-w-3xl">
          <FieldRow name="name" type="string | null">
            The matched property&apos;s listed name: <code className="field">&quot;{us.name}&quot;</code> in the capture.{' '}
            <code className="field">null</code> when nothing matched.
          </FieldRow>
          <FieldRow name="available" type="boolean">
            The one field to branch on. <code className="field">false</code> means sold out for the dates or not found, and the
            price fields are null; there is no separate error shape.
          </FieldRow>
          <FieldRow name="price / price_string" type="number · string | null">
            The stay total, twice: a number ({us.price}) and the formatted version (<code className="field">{us.price_string}</code>),
            in the currency you set. Total for all {us.nights} nights, not per night: divide by{' '}
            <code className="field">nights</code> for the nightly rate.
          </FieldRow>
          <FieldRow name="review_score / review_count" type="number | null · number | null">
            Booking.com&apos;s guest score and review count: {us.review_score} from {us.review_count} reviews in the capture.{' '}
            <code className="field">review_score</code> can be null even on an available property: the Rixos Sungate capture on
            the{' '}
            <Link href="/hotels-api/geo-pricing" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              geo-pricing page
            </Link>{' '}
            returned null score with 375 reviews counted, so null-check it independently of{' '}
            <code className="field">available</code>.
          </FieldRow>
          <FieldRow name="room_type" type="string | null">
            The room the price is for: <code className="field">&quot;{us.room_type}&quot;</code> in the capture.
          </FieldRow>
          <FieldRow name="image_url" type="string | null">
            A property thumbnail hosted by Booking.com, ready for an {'<img>'} tag.
          </FieldRow>
          <FieldRow name="link" type="string | null">
            A working Booking.com URL for exactly this room, these dates, and this party.
          </FieldRow>
          <FieldRow name="nights / adults / children" type="number | null">
            The stay as priced: nights computed from the dates ({us.nights} in the capture), adults as applied ({us.adults},
            the default since the request sent none), and children, <code className="field">null</code> when the request did not
            send any.
          </FieldRow>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Repeated checks"
          title="The ID-based fast path"
          lede="Name resolution is convenience you pay for on every call. If you check the same property on a schedule, resolve once and go direct instead."
        />
        <div className="mt-8 max-w-3xl">
          <FieldRow name="POST /resolve">
            Turns a hotel name into its Booking.com ID, for example{' '}
            <code className="field">cy/four-seasons-limassol</code>. Call it once per property and cache the ID.
          </FieldRow>
          <FieldRow name="POST /hotel">
            Takes that ID and returns the full room-by-room list (room type, meal plan, guest capacity and price for each)
            instead of a single headline rate.
          </FieldRow>
        </div>
        <p className="mt-6 text-[15px] text-ink-300">
          The{' '}
          <Link href="/hotels-api/bulk" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
            competitive-set tracking page
          </Link>{' '}
          walks through the resolve-once-then-poll pattern end to end.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="Pricing" title="Every plan carries this endpoint" />
        <div className="mt-8">
          <PricingTable api="hotels" plans={HOTEL_PLANS} medium="endpoint" />
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Explore more" title="More Hotels API" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/hotels-api/geo-pricing', label: 'Geo-pricing', sub: 'This request, three markets' },
            { href: '/hotels-api/bulk', label: 'Competitive-set tracking', sub: 'Resolve once, poll /hotel' },
            { href: '/hotels-api/search', label: 'Destination search', sub: 'Ranked properties + 24 filters' },
            { href: '/hotels-api', label: 'Hotels API hub', sub: 'All four endpoints' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="endpoint"
          api="hotels"
          title="Price any hotel by its name"
          body="No ID lookups, no second error format: one POST with a name and dates, one flat object back."
        />
      </Section>
    </>
  );
}
