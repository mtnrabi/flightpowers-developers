import Link from 'next/link';
import { Section, SectionHead } from '@/components/ui';
import { AGENTS, TASKS } from '@/lib/matrix';

/**
 * The recipe rail for a bespoke integration hub page.
 *
 * The six hubs built on _agent-page.tsx already render this grid; the other
 * eight are hand-written pages that had no link down to their {task} children
 * at all, so half the matrix was unreachable from anywhere on the site. This
 * is that missing rail, as one component instead of eight copies.
 *
 * Not a route: the leading underscore keeps it out of the router.
 */
export function AgentRecipes({ slug }: { slug: string }) {
  const agent = AGENTS.find((a) => a.slug === slug);
  if (!agent) throw new Error(`Unknown agent slug: ${slug}`);

  return (
    <Section>
      <SectionHead
        eyebrow="Recipes"
        title={`Seven things to build with ${agent.name}`}
        lede="Each one is a full page: the connect block, the job in plain words, the exact call it makes, and the response fields your logic reads."
      />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TASKS.map((task) => (
          <Link
            key={task.slug}
            href={`/integrations/${agent.slug}/${task.slug}`}
            className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors"
          >
            <p className="text-[15px] font-semibold text-ink-100">{task.name}</p>
            <p className="mt-1 font-mono text-[11px] text-ink-500">
              {task.api === 'flights' ? 'Flights API' : 'Hotels API'} · {task.rest.path}
            </p>
          </Link>
        ))}
      </div>
    </Section>
  );
}

/**
 * The whole matrix, for the /integrations index: every surface with its seven
 * recipes underneath. This is the only page that links to all of them.
 */
export function RecipeMatrix() {
  return (
    <Section>
      <SectionHead
        eyebrow="The recipe matrix"
        title="Every surface, every job"
        lede="The same seven jobs, written out for each surface: the connect block, the exact call, and the fields your logic reads. Pick the row you already work in."
      />
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {AGENTS.map((agent) => (
          <div key={agent.slug} className="rounded-2xl border rule bg-ink-900/50 p-6">
            <Link href={`/integrations/${agent.slug}`} className="text-[16px] font-semibold text-ink-100 hover:text-signal-400">
              {agent.name}
            </Link>
            <p className="mt-1 font-mono text-[11px] text-ink-500">{agent.connectLabel}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {TASKS.map((task) => (
                <Link key={task.slug} href={`/integrations/${agent.slug}/${task.slug}`} className="chip">
                  {task.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
