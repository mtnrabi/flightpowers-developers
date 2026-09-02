import Link from 'next/link';
import { Code, Section, SectionHead } from '@/components/ui';
import { LINKS } from '@/lib/site';

/**
 * The answer to "RapidAPI wrappers: listings vanish, OK for prototypes".
 *
 * That row is on a live competitor page aimed squarely at where we sit, and
 * it is the objection a serious buyer already has about anything fronted by a
 * marketplace. We have a real answer and it was written nowhere on this site.
 *
 * What this section is allowed to claim: where the API is addressable, what
 * the spec is, and what you would have to change if a door closed. It does
 * NOT claim we cannot go away, and it concedes the part that is true, which
 * is that billing runs through RapidAPI today.
 */
export function PortabilityBand({ compact = false }: { compact?: boolean }) {
  return (
    <Section>
      <SectionHead
        eyebrow="The marketplace question"
        title="What happens to your code if a listing disappears"
        lede="Fair question, and the honest answer is a base URL and a key, not a rewrite. Here is exactly why, and the part of it that genuinely does depend on RapidAPI."
      />

      <div className="mt-8 max-w-3xl">
        <p className="text-[15px] text-ink-300 leading-relaxed">
          A marketplace listing is a distribution channel. It is not where this API lives. The same six endpoints answer on
          our own domain, and the same key authenticates on both hosts, so moving between them is one line.
        </p>

        <div className="mt-6">
          <Code label="the same request, two hosts">{`# through the marketplace
POST https://google-flights-live-api.p.rapidapi.com/api/google_flights/oneway/v1
     x-rapidapi-key: $KEY
     x-rapidapi-host: google-flights-live-api.p.rapidapi.com

# on our own domain
POST https://api.flightpowers.com/v1/flights/oneway
     x-api-key: $KEY`}</Code>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15px] font-semibold text-ink-100">The spec is a document you can keep</p>
            <p className="mt-2 text-[14px] text-ink-400 leading-relaxed">
              <a href={LINKS.openapi} rel="noopener" className="text-signal-400 underline underline-offset-4">
                flightpowers.com/openapi.json
              </a>{' '}
              is served from our domain at a fixed path. Generate your client from it, commit the file, and your integration
              does not depend on a listing page rendering.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15px] font-semibold text-ink-100">The MCP servers are on our domain too</p>
            <p className="mt-2 text-[14px] text-ink-400 leading-relaxed">
              flights.flightpowers.com and hotels.flightpowers.com, listed in the official MCP registry as
              com.flightpowers/google-flights and com.flightpowers/booking. A gateway listing is one more door, never the
              only one.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15px] font-semibold text-ink-100">The client code is open and readable</p>
            <p className="mt-2 text-[14px] text-ink-400 leading-relaxed">
              The{' '}
              <Link href="/skills" className="text-signal-400 underline underline-offset-4">
                agent skills
              </Link>{' '}
              are MIT-licensed on GitHub. Every call they make is in the repository, so nothing about how this API is used
              is locked inside a wrapper you cannot read.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15px] font-semibold text-ink-100">What genuinely does depend on RapidAPI</p>
            <p className="mt-2 text-[14px] text-ink-400 leading-relaxed">
              Billing. RapidAPI issues the key, meters the usage, and sends the invoice. If that door closed, the key and
              the invoice would have to move somewhere else. The endpoints, the spec and the response shapes would not.
            </p>
          </div>
        </div>

        {compact ? null : (
          <p className="mt-8 text-[14px] text-ink-400 leading-relaxed">
            The claim we are not making: that we cannot go away. Any vendor can, and a page promising otherwise is worth
            nothing. The useful question is what you would have to change if we did, and for a well-built integration the
            answer is the base URL, the auth header name, and the field names you already mapped. That is the same work as
            switching any HTTP dependency, and it is why the spec is published rather than described.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-2.5">
          <Link href="/integrations/api" className="chip">
            The REST API on our domain
          </Link>
          <Link href="/integrations/rapidapi" className="chip">
            What RapidAPI actually handles
          </Link>
          <Link href="/mcp" className="chip">
            The MCP servers
          </Link>
        </div>
      </div>
    </Section>
  );
}
