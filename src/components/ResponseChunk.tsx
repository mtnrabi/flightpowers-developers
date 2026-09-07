import type { ReactNode } from 'react';
import { Code, Section, SectionHead } from './ui';

/**
 * The quotable chunk: one short answer, one trimmed real response, one small
 * field table, all as plain visible text.
 *
 * Why this exists: ExecuteWidget renders its response inside a `hidden` div
 * until someone clicks Execute. That HTML is on the page, but nothing reading
 * the raw HTML treats it as the page's answer, and no major AI crawler runs
 * the JS that would reveal it. Retrieval is passage-level, so every endpoint
 * page needs one passage that stands on its own: names the host and the
 * endpoint, shows what comes back, and names the fields.
 *
 * Every excerpt passed in must come from a real captured response (the
 * fixtures in src/lib/fixtures), trimmed, never hand-written.
 */

export type ChunkField = {
  /** The response (or request, or header) field name, verbatim. */
  name: string;
  /** Its type, in the same notation the rest of the docs use. */
  type: string;
  /** One sentence: what a developer actually wants to know about it. */
  meaning: ReactNode;
  /** The value this field had in the excerpt above. */
  value: ReactNode;
};

/** Inline field name in the running prose of a short answer. */
export function Mono({ children }: { children: ReactNode }) {
  return <code className="font-mono text-[13px] text-signal-400">{children}</code>;
}

export function ResponseChunk({
  eyebrow = 'Short answer',
  title,
  answer,
  excerptLabel,
  excerpt,
  request,
  fields,
  valueHeading = 'Above',
  notes,
}: {
  eyebrow?: string;
  title: string;
  /** ~60 words naming the product, the host and the endpoint. */
  answer: ReactNode;
  excerptLabel: string;
  /** A trimmed real response: at most two rows, or about twelve lines. */
  excerpt: string;
  /**
   * Optional: the call that produced the excerpt, so the passage can be run
   * as it stands instead of sending the reader to another section for the
   * request shape.
   */
  request?: { label: string; text: string };
  fields: ChunkField[];
  /** Header of the last column: what the value is taken from. */
  valueHeading?: string;
  notes?: ReactNode[];
}) {
  return (
    <Section>
      <SectionHead eyebrow={eyebrow} title={title} />
      <div className="mt-5 max-w-3xl text-[16px] text-ink-300 leading-relaxed">{answer}</div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <div>
          {request ? (
            <div className="mb-4">
              <Code label={request.label}>{request.text}</Code>
            </div>
          ) : null}
          <Code label={excerptLabel}>{excerpt}</Code>
        </div>

        <div>
          <div className="scroll-x rounded-2xl border rule">
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                    <th className="px-4 py-3 font-normal">Field</th>
                    <th className="px-4 py-3 font-normal">Type</th>
                    <th className="px-4 py-3 font-normal">Meaning</th>
                    <th className="px-4 py-3 font-normal">{valueHeading}</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {fields.map((f) => (
                    <tr key={f.name} className="border-t rule">
                      <td className="px-4 py-3.5">
                        <code className="field">{f.name}</code>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[12px] text-ink-500">{f.type}</td>
                      <td className="px-4 py-3.5 text-ink-300">{f.meaning}</td>
                      <td className="px-4 py-3.5 font-mono text-[12.5px] tabular-nums text-ink-100">{f.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {notes?.map((n, i) => (
            <p key={i} className={`${i === 0 ? 'mt-6' : 'mt-4'} text-[15px] text-ink-400 leading-relaxed`}>
              {n}
            </p>
          ))}
        </div>
      </div>
    </Section>
  );
}
