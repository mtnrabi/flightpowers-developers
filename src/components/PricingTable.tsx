import type { Plan } from '@/lib/pricing';
import { READ_ON } from '@/lib/pricing';
import { Cta } from './ui';

export function PricingTable({
  plans,
  href,
  label,
}: {
  plans: Plan[];
  href: string;
  label: string;
}) {
  return (
    <div>
      <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="border-b rule">
              <th className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-400 py-3 pr-4">
                Plan
              </th>
              <th className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-400 py-3 pr-4">
                Per month
              </th>
              <th className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-400 py-3 pr-4">
                Requests
              </th>
              <th className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-400 py-3 pr-4">
                Rate limit
              </th>
              <th className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-400 py-3">
                Beyond quota
              </th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.name} className="border-b rule last:border-b-0">
                <td className="py-3.5 pr-4">
                  <span className="text-ink-100 font-medium">{plan.name}</span>
                  {plan.recommended ? (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-signal-500">
                      recommended
                    </span>
                  ) : null}
                </td>
                <td className="py-3.5 pr-4 font-mono text-ink-200">{plan.price}</td>
                <td className="py-3.5 pr-4 text-ink-300">{plan.requests}</td>
                <td className="py-3.5 pr-4 text-ink-300">{plan.rate ?? <span className="text-ink-600">—</span>}</td>
                <td className="py-3.5 text-ink-400">
                  {plan.overage ?? <span className="text-ink-600">hard stop</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-5 text-xs text-ink-600">
        Read from the live RapidAPI listing on {READ_ON}. RapidAPI bills; one call to any endpoint
        counts as one request. Check the listing for the current figures before you commit.
      </p>
      <div className="mt-6">
        <Cta href={href} external>
          {label}
        </Cta>
      </div>
    </div>
  );
}
