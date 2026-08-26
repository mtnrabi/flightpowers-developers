import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { UrlParserTool } from '@/components/tools/UrlParserTool';
import { Code, Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { FIXTURES } from '@/lib/fixtures';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Google Flights URL Parser & Builder: decode tfs= in your browser',
  description:
    'Paste a Google Flights URL and decode its tfs= parameter into a readable tree, with the route and dates extracted and the equivalent API request. Or build a shareable search link from a route. 100% client-side, no signup, no rate limit.',
  alternates: { canonical: '/tools/google-flights-url-parser' },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Does my URL get sent anywhere?',
    a: 'No. This tool is 100% client-side: the decoding runs as JavaScript in your browser and the URL never leaves your machine. That is also why it has no rate limit and no signup: there is nothing on our side to protect.',
  },
  {
    q: 'What exactly is the tfs parameter?',
    a: 'It is Google Flights’ search state (route, dates, passengers, options) serialized as a protocol-buffer message and wrapped in URL-safe base64. Google does not document the format and can change it at any time.',
  },
  {
    q: 'How can you decode an undocumented format?',
    a: 'The protobuf wire format is self-describing at the structural level: every field carries a number and a wire type, so the tree of fields and values can always be recovered without the schema. What the schema would add is the meaning of each field. That part we infer, label as best-effort, and always show the raw tree alongside.',
  },
  {
    q: 'Why are some fields unlabeled?',
    a: 'Because we won’t guess in print. Values that match obvious shapes (YYYY-MM-DD dates, 3-letter airport codes) get labeled. Bare integers and flags stay as field numbers, honestly unexplained, rather than confidently mislabeled.',
  },
  {
    q: 'Can it decode every Google Flights URL?',
    a: 'Only URLs that carry a tfs= parameter; share links and the buy_link URLs our API returns do. A plain search URL (?q=Flights from …) carries text, not an encoded blob, so there is nothing to decode; paste it and the tool says so. Multi-city URLs decode fine, but the two-airports-one-date inference can misread them, so read the tree.',
  },
  {
    q: 'Can the builder create a tfs deep link?',
    a: 'No, and that is deliberate: fabricating an undocumented binary format would break silently the day Google changes it. The builder emits the documented search-query form, a q= phrase Google parses like a search-box entry, which is stable and shareable.',
  },
  {
    q: 'How do I get the fares behind a URL as JSON?',
    a: 'That is the API. Decode the URL here, and the card under the result shows the exact cURL, Python, or Node request for the same route and dates: live fares with Google’s price band and low | typical | high verdict on every row.',
  },
];

/**
 * The example URL's tfs value, decoded; this is the tool's real output for
 * the pre-filled buy_link (a captured API response), with our best-effort
 * annotations added as comments.
 */
const EXAMPLE_TREE = `3 {
  2 (string): "2026-10-13"   ← departure date
  4 {                        ← the flight leg
    1 (string): "TLV"        ← origin
    2 (string): "2026-10-13"
    3 (string): "JFK"        ← destination
    5 (string): "LY"         ← airline code
    6 (string): "11"         ← flight number
  }
  13 {
    2 (string): "TLV"
  }
  14 {
    2 (string): "JFK"
  }
}
8 (bytes): 0x01
9 (varint): 1
19 (varint): 2`;

export default function UrlParserPage() {
  const fx = FIXTURES.onewayTlvJfk;
  const exampleUrl = fx.data[0]!.buy_link;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Google Flights URL Parser & Builder',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          url: `${SITE.url}/tools/google-flights-url-parser`,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            'Decode a Google Flights tfs= parameter into a readable tree',
            'Extract route and dates from the decoded fields',
            'Equivalent FlightPowers API request in cURL, Python, and Node',
            'Build a shareable Google Flights search link from a route',
            '100% client-side: no signup, no rate limit',
          ],
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-10">
        <p className="eyebrow">Free tool · 100% client-side</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          Google Flights <span className="text-signal-500">URL Parser</span> &amp; Builder
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Every Google Flights URL hides its search in an encoded tfs= blob. Paste one and see inside it: route, dates, and the
          API request that reproduces it. Or go the other way and build a link.
        </p>
      </Container>

      <Container className="pb-16">
        <UrlParserTool exampleUrl={exampleUrl} exampleCapturedAt={fx.captured_at} />
      </Container>

      <Section>
        <SectionHead eyebrow="How it works" title="Wire format in, working request out" />
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            ['Paste the URL', 'Any Google Flights link with a tfs= parameter: a share link, or a buy_link straight from an API response.'],
            ['We decode it in your browser', 'base64url to bytes, then a generic protobuf wire-format parse: field numbers, wire types, nested messages. No server, no schema, no upload.'],
            ['Read the route, take the request', 'Dates and airport codes are extracted best-effort, and the equivalent FlightPowers API call is generated in cURL, Python, and Node.'],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-2xl border rule bg-ink-900/50 p-5">
              <p className="font-mono text-[13px] text-signal-500">{i + 1}</p>
              <p className="mt-1.5 text-[15.5px] font-semibold text-ink-100">{title}</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Under the hood"
          title="What’s inside a tfs parameter"
          lede="Undocumented doesn’t mean unreadable: the protobuf wire format always reveals its structure, even without the schema."
        />
        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4 text-[15px] text-ink-300 leading-relaxed">
            <p>
              The <code className="field">tfs</code> value is URL-safe base64 wrapping a binary protocol-buffer message. Protobuf
              encodes each field as a tag (a field number plus a wire type) followed by the value, and nested messages are just
              length-delimited fields whose bytes parse as messages themselves. That structure is recoverable without knowing what
              any field means.
            </p>
            <p>
              What the wire format can&apos;t tell you is the <em>meaning</em> of field 3 or field 19; that lives in Google&apos;s private
              schema. So this tool labels only what it can honestly recognize: strings shaped like{' '}
              <span className="font-mono text-[13px]">YYYY-MM-DD</span> are dates, 3-letter A–Z strings are airport codes, and the
              rest is shown as-is. The raw tree is always on screen; the labels are annotations, never substitutions.
            </p>
            <p>
              On the right: the pre-filled example URL, a real{' '}
              <code className="field">buy_link</code> returned by the API on {fx.captured_at} for TLV → JFK, decoded. The arrows
              are our reading, not Google&apos;s documentation.
            </p>
          </div>
          <Code label="the example buy_link, decoded · annotations ours">{EXAMPLE_TREE}</Code>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Who uses it" title="A dev-tools page for a dev-tools problem" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15.5px] font-semibold text-ink-100">Debugging a scraper</p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              Your pipeline produced a Google Flights URL and the results look wrong. Decode the tfs blob and see exactly what
              query the URL actually encodes. No more guessing which leg or date went sideways.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15.5px] font-semibold text-ink-100">Reproducing a user-reported fare</p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              A user sends “I saw it cheaper, here&apos;s the link.” Paste it, read the real route and dates out of the URL, and
              re-run the exact search through the API to see what the fare is now.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15.5px] font-semibold text-ink-100">Building deep links</p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              Send readers to a pre-filled Google Flights search from your app or newsletter. The builder emits the documented
              query form: stable, shareable, and honest about not being a tfs link.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10 text-center">
          <h2 className="text-[1.75rem] sm:text-4xl font-semibold">Need the live price too?</h2>
          <p className="lede mx-auto mt-4 max-w-2xl">
            Decoding tells you what the URL asks for. The Flight Price Checker runs the search live and adds Google&apos;s price band
            and the low | typical | high verdict.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Cta href="/tools/flight-price-checker" variant="accent">
              Check a live fare
            </Cta>
            <Cta href="/tools" variant="ghost">
              See all free tools
            </Cta>
          </div>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Related tools" title="Keep going" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { href: '/tools/flight-price-checker', label: 'Flight Price Checker', sub: 'Live fare + Google’s verdict' },
            { href: '/tools/cheapest-month-to-fly', label: 'Cheapest Month to Fly', sub: 'A whole month as a price grid' },
            { href: '/tools/hotel-price-by-country', label: 'Hotel Price by Country', sub: 'The same room, priced from 3 markets' },
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
          medium="tool"
          title="The URLs decode themselves. The fares are the product"
          body="Every API result already carries a working buy_link, plus Google’s price band and verdict. Free tier on RapidAPI, no card to try."
        />
      </Section>
    </>
  );
}
