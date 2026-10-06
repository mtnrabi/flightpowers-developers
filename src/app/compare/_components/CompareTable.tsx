import type { ReactNode } from 'react';

/**
 * The prose comparison table the compare pages share. Each page writes its
 * own rows by hand; this only draws them. First column is the row label.
 */
export function CompareTable({
  caption,
  head,
  rows,
}: {
  caption?: string;
  head: string[];
  rows: ReactNode[][];
}) {
  return (
    <figure>
      <div className="scroll-x rounded-2xl border rule">
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                {head.map((h, i) => (
                  <th key={i} className="px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((cells, i) => (
                <tr key={i} className="border-t rule align-top">
                  {cells.map((cell, j) => (
                    <td
                      key={j}
                      className={`px-4 py-3.5 ${j === 0 ? 'font-semibold text-ink-100 sm:whitespace-nowrap' : 'text-ink-300'} text-[13.5px] leading-relaxed`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {caption ? <figcaption className="mt-2 font-mono text-[11px] text-ink-500">{caption}</figcaption> : null}
    </figure>
  );
}

/** The 40-60 word answer at the top of every compare page, the passage an answer engine can lift whole. */
export function Quotable({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 max-w-3xl rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-5 text-[15.5px] text-ink-200 leading-relaxed">
      {children}
    </p>
  );
}
