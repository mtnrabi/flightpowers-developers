import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CtaBand } from '@/components/bands';
import {
  Breadcrumbs,
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
import { AGENTS, TASKS, matrixPairs, type AgentDef, type TaskDef } from '@/lib/matrix';
import { FLIGHT_PLANS, HOTEL_PLANS } from '@/lib/pricing';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

/**
 * The {agent} × {task} recipe matrix: ~42 statically generated pages, all
 * rendered from the verified dataset in src/lib/matrix.ts. Docs published as
 * landing pages: the CTA is the copyable config, not a signup.
 */

export const dynamic = 'force-static';
export const dynamicParams = false;

type Params = { agent: string; task: string };

export function generateStaticParams(): Params[] {
  return matrixPairs().map(({ agent, task }) => ({ agent: agent.slug, task: task.slug }));
}

function lookup(params: Params): { agent: AgentDef; task: TaskDef } | null {
  const agent = AGENTS.find((a) => a.slug === params.agent);
  const task = TASKS.find((t) => t.slug === params.task);
  if (!agent || !task) return null;
  return { agent, task };
}

function apiName(task: TaskDef): string {
  return task.api === 'flights' ? 'Google Flights' : 'Booking.com hotel';
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const pair = lookup(await params);
  if (!pair) return {};
  const { agent, task } = pair;
  return withOg({
    title: `${task.name} with ${agent.name}: live ${apiName(task)} data`,
    description: `Connect ${agent.name} to live ${apiName(task)} data and run a ${task.name.toLowerCase()}: the exact config, the prompt, the call it makes, and the response fields your logic reads.`,
    alternates: { canonical: `/integrations/${agent.slug}/${task.slug}` },
  });
}

/**
 * One-line meanings for every response field the matrix references, keyed per
 * API because `price` is a display string on flights and a number on hotels.
 * All meanings derive from the listing READMEs. Nothing modelled.
 */
const FLIGHT_FIELDS: Record<string, { type: string; meaning: string }> = {
  price: {
    type: 'string',
    meaning:
      'The fare as Google Flights displays it: “$56”. The numeric twin price_as_number rides alongside for sorting and arithmetic.',
  },
  price_insights_low: {
    type: 'number | null',
    meaning:
      'The bottom of Google’s historical price band for this route and dates. Null when Google doesn’t publish a band: treat the fare as unjudged, not bad.',
  },
  price_insights_high: {
    type: 'number | null',
    meaning: 'The top of the band. A fare above it is expensive for the route by Google’s own history.',
  },
  price_range_in_relation_to_other_periods: {
    type: '"low" | "typical" | "high" | null',
    meaning:
      'Google’s verdict on the current fare against that band, the single field alerting, ranking, and “book now” logic branch on.',
  },
  buy_link: {
    type: 'string (URL)',
    meaning: 'A Google Flights deep link that reopens this exact itinerary. Hand it to the user; it just works.',
  },
  total_price: {
    type: 'string',
    meaning:
      'The combined price of the paired round-trip itinerary: one number for both legs, because they were searched together. total_price_as_number is the integer.',
  },
  total_duration_seconds: {
    type: 'number',
    meaning: 'Travel time across both legs, in seconds, sortable without parsing a display string.',
  },
  departure_flight_airline: {
    type: 'string',
    meaning: 'Operating carrier on the outbound leg.',
  },
  return_flight_airline: {
    type: 'string',
    meaning: 'Operating carrier on the return leg, paired to the same itinerary, not cross-joined.',
  },
  departure_date: {
    type: 'string (YYYY-MM-DD)',
    meaning: 'The date this fare applies to, the axis a date-range scan pivots on.',
  },
};

const HOTEL_FIELDS: Record<string, { type: string; meaning: string }> = {
  name: { type: 'string', meaning: 'The property name as listed on Booking.com.' },
  price_string: {
    type: 'string',
    meaning: 'The total rate for the stay as Booking.com displays it: “US$2,434”.',
  },
  price: {
    type: 'number',
    meaning: 'The same rate as a plain number, for comparing quotes across markets or dates.',
  },
  review_score: { type: 'number', meaning: 'Booking.com guest score out of 10.' },
  review_count: { type: 'number', meaning: 'How many reviews the score rests on: a 9.1 from 12 reviews is not a 9.1 from 1,200.' },
  room_type: { type: 'string', meaning: 'Which room the rate belongs to: compare like with like across markets.' },
  link: { type: 'string (URL)', meaning: 'A working Booking.com link to the property.' },
  available: {
    type: 'boolean',
    meaning:
      'False means sold out for the dates: the response keeps the same shape with nulls, so parsing never branches on an error format.',
  },
};

function fieldInfo(task: TaskDef, field: string): { type: string; meaning: string } {
  const map = task.api === 'flights' ? FLIGHT_FIELDS : HOTEL_FIELDS;
  return map[field] ?? { type: '', meaning: 'Documented in the endpoint reference on the listing.' };
}

function callFraming(agent: AgentDef): { heading: string; lede: string; codeLabel: string } {
  if (agent.connectKind === 'n8n-node') {
    return {
      heading: 'What the node sends',
      lede: 'The node issues this request against the same live API: real parameter names, exactly as the endpoint takes them.',
      codeLabel: 'request the node issues',
    };
  }
  if (agent.connectKind === 'skill') {
    return {
      heading: 'What the skill calls',
      lede: 'The skill calls the same API with your key. This is the call behind the answer, with real parameter names.',
      codeLabel: 'the call the skill makes',
    };
  }
  return {
    heading: 'What the agent calls',
    lede: 'No glue code: the agent reads the tool schema, picks the tool, and fills these parameters from your prompt.',
    codeLabel: 'tool call',
  };
}

function faqFor(agent: AgentDef, task: TaskDef): Faq[] {
  const plans = task.api === 'flights' ? FLIGHT_PLANS : HOTEL_PLANS;
  const free = plans[0]!;
  const pro = plans.find((p) => p.name === 'PRO')!;
  const listing = task.api === 'flights' ? 'Google Flights Live API' : 'Booking.com Live API';

  const billing =
    agent.connectKind === 'n8n-node'
      ? 'Yes. Your RapidAPI key lives in an n8n credential, the node sends it on every request, and usage meters against your own subscription on RapidAPI. There is no FlightPowers account and no second bill.'
      : agent.connectKind === 'skill'
        ? 'Yes. The skill uses your own RapidAPI key, so every call meters against your own subscription on RapidAPI. There is no FlightPowers account and no second bill.'
        : `Yes. The MCP server is bring-your-own-key: ${agent.name} sends your RapidAPI key with each call and usage meters against your own subscription on RapidAPI. There is no FlightPowers account and no second bill.`;

  const server =
    agent.connectKind === 'n8n-node'
      ? 'Only your n8n instance, cloud or self-hosted. The node calls the API directly from wherever n8n runs; there is nothing of ours to deploy.'
      : agent.connectKind === 'skill'
        ? `No. The skill runs inside ${agent.name} and calls the hosted API over the network. Nothing to deploy, nothing to keep warm.`
        : `No. The MCP servers are hosted at flights.flightpowers.com and hotels.flightpowers.com: you add a URL to ${agent.name}, not a deployment.`;

  let cost = `The ${listing}'s free tier is ${free.quota} requests/month with a hard cap: enough to verify your key works, not to evaluate. The PRO plan is $${pro.priceMonthly}/month for ${pro.quota.toLocaleString('en-US')} requests, and every plan includes every endpoint.`;
  if (task.slug === 'fare-alert-cron') {
    cost += ' A single daily check is about 30 requests a month: past the free tier’s 10, comfortably inside PRO.';
  }
  if (task.slug === 'cheapest-date-scan') {
    cost += ' Budget one request per date scanned: a 30-day sweep meters as 30 requests.';
  }

  return [
    { q: 'Is my key billed to me?', a: billing },
    { q: 'Does this need a server of mine?', a: server },
    { q: 'What does it cost?', a: cost },
  ];
}

export default async function MatrixPage({ params }: { params: Promise<Params> }) {
  const pair = lookup(await params);
  if (!pair) notFound();
  const { agent, task } = pair;

  const framing = callFraming(agent);
  const callCode = `// ${task.tool}\n${JSON.stringify(task.toolCall, null, 2)}`;
  const otherAgents = AGENTS.filter((a) => a.slug !== agent.slug);
  const siblingTasks = TASKS.filter((t) => t.slug !== task.slug);
  const pageUrl = `${SITE.url}/integrations/${agent.slug}/${task.slug}`;

  const promptLede =
    agent.connectKind === 'n8n-node'
      ? 'The job in plain words. In n8n you express it as the node configuration below instead of a prompt.'
      : 'Verbatim: paste it, or anything shaped like it. The agent maps it to the call below.';

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Integrations', item: `${SITE.url}/integrations` },
            { '@type': 'ListItem', position: 2, name: agent.name, item: `${SITE.url}/integrations/${agent.slug}` },
            { '@type': 'ListItem', position: 3, name: task.name, item: pageUrl },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/integrations', label: 'Integrations' },
            { href: `/integrations/${agent.slug}`, label: agent.name },
            { href: `/integrations/${agent.slug}/${task.slug}`, label: task.name },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Recipe · {task.api === 'flights' ? 'Flights API' : 'Hotels API'}</p>
          <h1 className="mt-4 max-w-3xl text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
            {task.name} with <span className="text-signal-500">{agent.name}</span>
          </h1>
          <p className="lede mt-5 max-w-2xl">{task.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Cta href={rapidApiPricingUrl(task.api, 'integration')} external variant="primary">
              Get a key on RapidAPI →
            </Cta>
            <Cta href={`/integrations/${agent.slug}`} variant="ghost">
              All {agent.name} recipes
            </Cta>
          </div>
          <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="Step 1 · Connect"
          title={agent.connectLabel}
          lede={agent.connectNote}
        />
        <div className="mt-8 max-w-3xl">
          <Code label={agent.connectKind === 'n8n-node' ? 'community node package name' : agent.connectKind === 'skill' ? 'install' : 'connect'}>
            {agent.connectSnippet}
          </Code>
          <p className="mt-3 font-mono text-[12px] text-ink-500">
            Bring your own RapidAPI key: every request is billed to your own subscription, never ours.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Step 2 · Ask it" title="The prompt" lede={promptLede} />
        <blockquote className="mt-8 max-w-3xl rounded-2xl border rule bg-ink-900/60 p-6 text-[16px] leading-relaxed text-ink-200">
          &ldquo;{task.prompt}&rdquo;
        </blockquote>
      </Section>

      <Section>
        <SectionHead eyebrow="Step 3 · Under the hood" title={framing.heading} lede={framing.lede} />
        <div className="mt-8 max-w-3xl">
          <Code label={framing.codeLabel}>{callCode}</Code>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Step 4 · Read the response"
          title="Fields your logic reads"
          lede="The response is flat JSON. These are the fields this recipe branches on, with what each one means."
        />
        <div className="mt-8 max-w-3xl">
          {task.fields.map((field) => {
            const info = fieldInfo(task, field);
            return (
              <FieldRow key={field} name={field} type={info.type || undefined}>
                {info.meaning}
              </FieldRow>
            );
          })}
        </div>
      </Section>

      <Section>
        <FaqSection items={faqFor(agent, task)} />
      </Section>

      <Section>
        <SectionHead eyebrow="Also works with" title={`${task.name}, elsewhere in your stack`} />
        <div className="mt-6 flex flex-wrap gap-2.5">
          {otherAgents.map((other) => (
            <Link key={other.slug} href={`/integrations/${other.slug}/${task.slug}`} className="chip">
              {task.name} in {other.name}
            </Link>
          ))}
        </div>
        <div className="mt-12">
          <SectionHead eyebrow="More recipes" title={`More to build in ${agent.name}`} />
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {siblingTasks.map((t) => (
              <Link
                key={t.slug}
                href={`/integrations/${agent.slug}/${t.slug}`}
                className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors"
              >
                <p className="text-[15px] font-semibold text-ink-100">{t.name}</p>
                <p className="mt-1 font-mono text-[11px] text-ink-500">
                  {t.api === 'flights' ? 'Flights API' : 'Hotels API'} · {t.tool}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand medium="integration" api={task.api} />
      </Section>
    </>
  );
}
