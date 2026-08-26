import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
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
import { HOTEL_PLANS } from '@/lib/pricing';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Hotel Competitive-Set Tracking: room-level rates on a schedule',
  description:
    'Track a competitive set nightly: POST /resolve turns each competitor’s name into its Booking.com ID once, then POST /hotel returns the full room-by-room list (room type, meal plan, capacity and price) on every scheduled check.',
  alternates: { canonical: '/hotels-api/bulk' },
});

export const dynamic = 'force-static';

/** Documented example from the listing's API reference, not a captured run. */
const HOTEL_RESPONSE = `{
  "hotel_booking_id": "it/boffenigoboutiquegarda",
  "checkin_date": "2026-05-01",
  "checkout_date": "2026-05-10",
  "booking_url": "https://www.booking.com/hotel/it/boffenigoboutiquegarda.html?...",
  "rooms": [
    {
      "room_type": "Classic Double Room",
      "room_economy": "Exceptional breakfast included",
      "guests": 2,
      "price_as_number": 2511,
      "price": "€ 2,511"
    },
    {
      "room_type": "Classic Double Room",
      "room_economy": "Exceptional breakfast included",
      "guests": 1,
      "price_as_number": 1739,
      "price": "€ 1,739"
    }
  ]
}`;

const RESOLVE_EXAMPLE = `// request
{ "hotel_name": "boffenigo boutique italy" }

// response
{
  "hotel_name": "boffenigo boutique italy",
  "hotel_booking_id": "it/boffenigoboutiquegarda",
  "matched_name": "Boffenigo Boutique Hotel & Spa"
}`;

const NIGHTLY_SWEEP = `# IDs resolved once via POST /resolve, then cached (see step 1)
COMP_SET = {
    "Boffenigo Boutique Hotel & Spa": "it/boffenigoboutiquegarda",
    # ...the rest of your set
}

HEADERS = {
    "Content-Type": "application/json",
    "x-rapidapi-host": "booking-live-api.p.rapidapi.com",
    "x-rapidapi-key": os.environ["RAPIDAPI_KEY"],
}

for name, hotel_id in COMP_SET.items():
    r = requests.post(
        "https://booking-live-api.p.rapidapi.com/hotel",
        headers=HEADERS,
        json={
            "hotel_booking_id": hotel_id,
            "checkin_date": checkin,      # the stay you track
            "checkout_date": checkout,
            "currency": "EUR",
        },
    )
    for room in r.json()["rooms"]:
        store(name, room["room_type"], room["room_economy"],
              room["guests"], room["price_as_number"])`;

const faq: Faq[] = [
  {
    q: 'Why resolve first instead of calling /hotel_by_name every night?',
    a: '/hotel_by_name re-runs name resolution on every call and returns one headline rate. /hotel takes the cached Booking.com ID directly and returns every room. Resolve once per competitor, confirm matched_name, cache the ID. After that the nightly job is pure data pulls.',
  },
  {
    q: 'What is a hotel_booking_id?',
    a: 'The Booking.com path ID for a property, for example cy/four-seasons-limassol. POST /resolve returns it together with matched_name, so you can confirm the match is the property you meant before caching it.',
  },
  {
    q: 'What does /hotel return for each room?',
    a: 'The room type, the meal plan (room_economy), the guest capacity, and the price both as a formatted string and as a number, for every room in the property, not a single headline rate.',
  },
  {
    q: 'Can I run the comp set from a specific market?',
    a: 'Yes. /hotel accepts proxy_country like every endpoint, so the same nightly sweep can price your set from the markets you compete in. The geo-pricing page shows a real captured spread between markets.',
  },
  {
    q: 'How do I catch a competitor selling out?',
    a: 'A scheduled /hotel_by_name check returns available: false with nulls (the same shape as ever) when a property has no rooms for the dates. Watch for price drops or the available flag flipping and alert on either.',
  },
  {
    q: 'How many requests does a nightly job cost?',
    a: 'One per property per market per night. A comp set of eight properties tracked from one market is eight requests a night. Size your plan quota from the table on this page.',
  },
];

export default function CompetitiveSetPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Hotels API', item: `${SITE.url}/hotels-api` },
            { '@type': 'ListItem', position: 3, name: 'Competitive-Set Tracking', item: `${SITE.url}/hotels-api/bulk` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers Hotel Room Pricing API',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free tier: 10 requests/month on RapidAPI' },
          url: `${SITE.url}/hotels-api/bulk`,
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/hotels-api', label: 'Hotels API' },
            { href: '/hotels-api/bulk', label: 'Competitive-Set Tracking' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Competitive-Set Tracking</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                Track your <span className="text-signal-500">comp set</span>, room by room
              </h1>
              <p className="lede mt-5">
                Resolve each competitor&apos;s name to its Booking.com ID once, then pull full room-level availability and pricing on
                a schedule.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>
                      <code className="font-mono text-[13px] text-signal-400">/hotel</code> returns every room (type, meal plan,
                      guest capacity and price), not one headline rate
                    </>,
                    <>
                      <code className="font-mono text-[13px] text-signal-400">/resolve</code> once per competitor; cache the ID and
                      every later check goes direct
                    </>,
                    <>
                      Add <code className="font-mono text-[13px] text-signal-400">proxy_country</code> to run the same sweep from
                      the markets you compete in
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

            <div>
              <Code label="POST /hotel · from the API reference">{HOTEL_RESPONSE}</Code>
              <p className="mt-3 font-mono text-[11px] text-ink-500">
                The documented response example from the listing&apos;s API reference. Shown as reference, not as a captured run.
              </p>
            </div>
          </div>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="The pattern"
          title="Resolve once, then go direct"
          lede="A nightly comp-set job should not pay for name resolution on every call. Set it up once; after that, every check is a direct pull."
        />
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          <div className="space-y-8">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">Step 1: once per competitor</p>
              <p className="mt-2 text-[15px] text-ink-300 leading-relaxed">
                <code className="field">POST /resolve</code> turns the name a human would type into the Booking.com path ID.{' '}
                <code className="field">matched_name</code> tells you what it actually matched, so a bad match is caught at setup
                time, not in your nightly numbers.
              </p>
              <div className="mt-4">
                <Code label="POST /resolve · from the API reference">{RESOLVE_EXAMPLE}</Code>
              </div>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">Step 2: cache the ID</p>
              <p className="mt-2 text-[15px] text-ink-300 leading-relaxed">
                <code className="field">hotel_booking_id</code> is stable: store it next to the competitor&apos;s name in your own
                config and never resolve again.
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">Step 3: every night</p>
              <p className="mt-2 text-[15px] text-ink-300 leading-relaxed">
                <code className="field">POST /hotel</code> with the cached ID returns the full room list for the stay you track:
                every room type, meal plan, capacity and price, live from Booking.com at request time.
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">The lighter variant</p>
              <p className="mt-2 text-[15px] text-ink-300 leading-relaxed">
                When one headline rate per competitor is enough, schedule{' '}
                <Link href="/hotels-api/by-name" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
                  <code className="field">/hotel_by_name</code>
                </Link>{' '}
                across the set instead: no setup step at all, at the cost of re-resolving on each call.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">The nightly sweep, in full</h3>
            <Code label="python · one request per property">{NIGHTLY_SWEEP}</Code>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="POST /hotel" title="Request fields" />
        <div className="mt-8 max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">Required</p>
          <div className="mt-3">
            <FieldRow name="hotel_booking_id" type="string">
              The Booking.com path ID, for example <code className="field">cy/four-seasons-limassol</code>, from{' '}
              <code className="field">/resolve</code>.
            </FieldRow>
            <FieldRow name="checkin_date / checkout_date" type="string">
              <code className="field">YYYY-MM-DD</code>.
            </FieldRow>
          </div>
          <p className="mt-10 font-mono text-[11px] uppercase tracking-wider text-signal-500">Optional</p>
          <div className="mt-3">
            <FieldRow name="adults / children" type="int">
              Default <code className="field">2</code> / <code className="field">0</code>.
            </FieldRow>
            <FieldRow name="currency" type="string">
              Defaults to <code className="field">USD</code>.
            </FieldRow>
            <FieldRow name="proxy_country" type="string">
              Run the check from a specific market:{' '}
              <Link href="/hotels-api/geo-pricing" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
                geo-pricing
              </Link>{' '}
              shows a real captured spread.
            </FieldRow>
            <FieldRow name="free_cancellation" type="boolean">
              Restrict to refundable rates.
            </FieldRow>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Pricing" title="Size the plan from your comp set" />
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
            { href: '/hotels-api/geo-pricing', label: 'Geo-pricing', sub: 'The same sweep, per market' },
            { href: '/hotels-api/by-name', label: 'Hotel by name', sub: 'The no-setup variant' },
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
          title="Put your comp set on a schedule"
          body="Room-level Booking.com pricing for every property you compete with, live at request time, one request per property."
        />
      </Section>
    </>
  );
}
