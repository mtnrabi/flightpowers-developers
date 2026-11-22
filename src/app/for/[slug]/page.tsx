import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PricingTable } from '@/components/PricingTable';
import { Code, Container, Cta, Section, SectionHead } from '@/components/ui';
import { allLeads, curlFor, leadBySlug } from '@/lib/leads';
import { FLIGHT_PLANS, HOTEL_PLANS } from '@/lib/pricing';
import { LINKS, rapidApiPricingUrl } from '@/lib/site';

/**
 * A private page for one lead: their own route or hotel, priced once by a real
 * call (scripts/lead-capture.mjs), with the exact request, the trimmed
 * response, the fan-out, the MCP prompt and the public plan ladder.
 *
 * Unlisted on purpose: noindex, no link from any page, and absent from the
 * sitemap (discoverRoutes skips dynamic segments and nothing enumerates this
 * one). It is reached only from a link we send.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return allLeads().map((lead) => ({ slug: lead.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const lead = leadBySlug(slug);
  return {
    title: lead ? lead.title : 'Not found',
    robots: { index: false, follow: false, nocache: true },
  };
}

function fetchedLabel(iso: string): string {
  return `${iso.slice(11, 16)} UTC on ${iso.slice(0, 10)}`;
}

export default async function LeadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lead = leadBySlug(slug);
  if (!lead || !lead.capture) notFound();
  const { capture } = lead;
  const flights = lead.product === 'flights';
  const plans = flights ? FLIGHT_PLANS : HOTEL_PLANS;
  const pro = plans.find((p) => p.name === 'PRO')!;
  const free = plans.find((p) => p.name === 'BASIC')!;
  const api = flights ? 'flights' : 'hotels';
  const mcpUrl = lead.mcp.server === 'flights' ? LINKS.mcpFlights : LINKS.mcpHotels;
  const seconds = (capture.elapsedMs / 1000).toFixed(1);
  const trimmedNote =
    capture.rowsReturned !== null && capture.rowsReturned > capture.rowsShown
      ? `first ${capture.rowsShown} of ${capture.rowsReturned} rows, long strings cut`
      : 'long strings cut';

  return (
    <>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-12 sm:pt-16 pb-12">
          <p className="eyebrow">For {lead.name} · run once at {fetchedLabel(capture.fetchedAt)}</p>
          <h1 className="mt-4 text-[2.1rem] sm:text-[3rem] leading-[1.08] font-semibold max-w-4xl">{lead.title}</h1>
          <p className="lede mt-5 max-w-3xl">{lead.intro}</p>
          <p className="mt-6 max-w-3xl rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-5 text-[15.5px] text-ink-200 leading-relaxed">
            {lead.resultLine} Fetched in {seconds} seconds at {fetchedLabel(capture.fetchedAt)}; prices move, so run it again
            for a current one.
          </p>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead eyebrow="The request" title="Exactly what was sent" />
        <div className="mt-8 max-w-4xl">
          <Code label={`POST ${lead.request.path}`}>{curlFor(lead)}</Code>
        </div>
        <h3 className="mt-10 text-[16px] font-semibold text-ink-100">What came back</h3>
        <p className="mt-2 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          HTTP {capture.httpStatus} in {seconds} seconds. The real response, {trimmedNote}; nothing else was edited.
        </p>
        <div className="mt-4 max-w-4xl">
          <Code label={`response · ${fetchedLabel(capture.fetchedAt)}`}>{JSON.stringify(capture.response, null, 2)}</Code>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="The fan-out" title={lead.fanout.title} lede={lead.fanout.note} />
        <div className="mt-8 max-w-4xl">
          <Code label="bash">{lead.fanout.code}</Code>
        </div>
        <ul className="mt-6 max-w-3xl space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
          {lead.extras.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHead eyebrow="In Claude, Cursor or ChatGPT" title="The same thing as one prompt" lede={lead.mcp.note} />
        <div className="mt-8 max-w-4xl space-y-4">
          <Code label="connector URL">{mcpUrl}</Code>
          <Code label="prompt">{lead.mcp.prompt}</Code>
        </div>
        <p className="mt-4 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Sign in with Google and the first 10 searches a day are free; after that it runs on your own key.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Plans"
          title={`PRO is $${pro.priceMonthly} for ${pro.quota.toLocaleString('en-US')} requests a month`}
          lede={`The free plan has ${free.quota} requests a month and needs no card. These are the public plans, the same for everyone.`}
        />
        <div className="mt-8">
          <PricingTable api={api} plans={plans} medium="compare" compact />
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Cta href={rapidApiPricingUrl(api, 'compare', `for-${lead.slug}`)} external variant="primary">
            Get a key and run this request →
          </Cta>
          <Cta href="/docs/quickstart" variant="ghost">
            Quickstart
          </Cta>
        </div>
        <p className="mt-6 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Questions about your own routes, hotels or volume: reply to my email, I read every one. Matan
        </p>
      </Section>
    </>
  );
}
