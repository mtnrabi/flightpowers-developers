import Link from 'next/link';
import type { ReactNode } from 'react';
import { CtaBand } from '@/components/bands';
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
import { AGENTS, TASKS } from '@/lib/matrix';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

/**
 * Shared skeleton for the per-agent-brand integration pages
 * (/integrations/{claude,chatgpt,cursor,claude-code,openclaw}).
 * Same structure on every page — Postiz-style — with agent-specific config,
 * prompts, and FAQ passed in. The CTA is the copyable connect block itself.
 *
 * Not a route: the leading underscore keeps it out of the router.
 */

export type ConnectStep = { title: string; body: ReactNode };
export type ToolLine = { name: string; type?: string; note: ReactNode };

export function AgentIntegrationPage({
  slug,
  lede,
  heroCodeLabel,
  steps,
  promptsLede,
  prompts,
  toolsEyebrow,
  toolsTitle,
  toolsLede,
  tools,
  extra,
  faq,
}: {
  /** must match an AGENTS slug in src/lib/matrix.ts */
  slug: string;
  lede: string;
  heroCodeLabel: string;
  steps: ConnectStep[];
  promptsLede: string;
  prompts: string[];
  toolsEyebrow: string;
  toolsTitle: string;
  toolsLede: string;
  tools: ToolLine[];
  /** optional agent-specific section, rendered before the FAQ */
  extra?: ReactNode;
  faq: Faq[];
}) {
  const agent = AGENTS.find((a) => a.slug === slug);
  if (!agent) throw new Error(`Unknown agent slug: ${slug}`);
  const otherAgents = AGENTS.filter((a) => a.slug !== slug);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Integrations', item: `${SITE.url}/integrations` },
            { '@type': 'ListItem', position: 2, name: agent.name, item: `${SITE.url}/integrations/${agent.slug}` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/integrations', label: 'Integrations' }, { href: `/integrations/${agent.slug}`, label: agent.name }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
            <div>
              <p className="eyebrow">Integrations</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
                Live flight &amp; hotel data in <span className="text-signal-500">{agent.name}</span>
              </h1>
              <p className="lede mt-5">{lede}</p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>Google&apos;s price band + a low | typical | high verdict on every fare</>,
                    <>Bring your own key — usage bills to your own RapidAPI plan, never ours</>,
                    <>
                      Live Booking.com rates too, with <code className="font-mono text-[13px] text-signal-400">proxy_country</code>{' '}
                      per-market pricing
                    </>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'integration')} external variant="primary">
                  Get a free key on RapidAPI →
                </Cta>
                <Cta href="/mcp" variant="ghost">
                  All MCP options
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier: 10 requests/month. No card to try.</p>
            </div>
            <div>
              <Code label={heroCodeLabel}>{agent.connectSnippet}</Code>
              <p className="mt-3 text-[13.5px] text-ink-400 leading-relaxed">{agent.connectNote}</p>
            </div>
          </div>
        </Container>
      </div>

      <Section>
        <SectionHead eyebrow="Connect" title={agent.connectLabel} />
        <ol className="mt-10 max-w-3xl space-y-4">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-2xl border rule bg-ink-900/50 p-5">
              <span className="font-mono text-[15px] text-signal-500 tabular-nums">{i + 1}</span>
              <div>
                <p className="text-[15.5px] font-semibold text-ink-100">{step.title}</p>
                <p className="mt-1 text-[14px] text-ink-400 leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionHead eyebrow="Ask it" title="Five things to say, verbatim" lede={promptsLede} />
        <div className="mt-8 grid gap-4 max-w-3xl">
          {prompts.map((prompt) => (
            <blockquote key={prompt} className="rounded-2xl border rule bg-ink-900/60 p-5 text-[15px] leading-relaxed text-ink-200">
              &ldquo;{prompt}&rdquo;
            </blockquote>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow={toolsEyebrow} title={toolsTitle} lede={toolsLede} />
        <div className="mt-8 max-w-3xl">
          {tools.map((tool) => (
            <FieldRow key={tool.name} name={tool.name} type={tool.type}>
              {tool.note}
            </FieldRow>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Recipes"
          title={`Seven things to build in ${agent.name}`}
          lede="Each one is a full page: the connect block, the prompt, the exact call it makes, and the response fields your logic reads."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TASKS.map((task) => (
            <Link
              key={task.slug}
              href={`/integrations/${agent.slug}/${task.slug}`}
              className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors"
            >
              <p className="text-[15px] font-semibold text-ink-100">{task.name}</p>
              <p className="mt-1 font-mono text-[11px] text-ink-500">
                {task.api === 'flights' ? 'Flights API' : 'Hotels API'} · {task.tool}
              </p>
            </Link>
          ))}
        </div>
      </Section>

      {extra}

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Elsewhere" title="The same data in the rest of your stack" />
        <div className="mt-6 flex flex-wrap gap-2.5">
          {otherAgents.map((other) => (
            <Link key={other.slug} href={`/integrations/${other.slug}`} className="chip">
              {other.name}
            </Link>
          ))}
          <Link href="/integrations/api" className="chip">
            Plain REST
          </Link>
          <Link href="/integrations" className="chip">
            All integrations
          </Link>
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand medium="integration" />
      </Section>
    </>
  );
}
