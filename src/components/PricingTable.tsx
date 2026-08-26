import { fmtOverage, fmtQuota, fmtRate, perThousand, READ_ON, type Plan } from '@/lib/pricing';
import { rapidApiPricingUrl, type UtmMedium } from '@/lib/site';

/**
 * The pricing table, rendered from the verified plan data in lib/pricing.ts.
 * Inlined on every commercial page — deciding to pay never requires
 * navigating. The $/1k row is the number a developer actually compares on.
 */
export function PricingTable({
  api,
  plans,
  medium,
  compact = false,
}: {
  api: 'flights' | 'hotels';
  plans: Plan[];
  medium: UtmMedium;
  compact?: boolean;
}) {
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border rule">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
              <th className="px-4 py-3 font-normal">Plan</th>
              <th className="px-4 py-3 font-normal text-right">Price / mo</th>
              <th className="px-4 py-3 font-normal text-right">Requests</th>
              <th className="px-4 py-3 font-normal text-right">$ / 1k req</th>
              <th className="px-4 py-3 font-normal text-right">Overage</th>
              <th className="px-4 py-3 font-normal text-right">Rate limit</th>
              {!compact ? <th className="px-4 py-3 font-normal" /> : null}
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.name} className={`border-t rule ${plan.recommended ? 'bg-signal-600/[0.06]' : ''}`}>
                <td className="px-4 py-3.5">
                  <span className="font-semibold text-ink-100">{plan.name}</span>
                  {plan.recommended ? (
                    <span className="ml-2 rounded-full bg-signal-500 px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-950">
                      recommended
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3.5 text-right font-mono tabular-nums text-ink-100">
                  {plan.priceMonthly === 0 ? 'Free' : `$${plan.priceMonthly}`}
                </td>
                <td className="px-4 py-3.5 text-right font-mono tabular-nums">{fmtQuota(plan)}</td>
                <td className="px-4 py-3.5 text-right font-mono tabular-nums text-signal-400">{perThousand(plan)}</td>
                <td className="px-4 py-3.5 text-right font-mono tabular-nums text-ink-400">{fmtOverage(plan)}</td>
                <td className="px-4 py-3.5 text-right font-mono tabular-nums text-ink-400">{fmtRate(plan)}</td>
                {!compact ? (
                  <td className="px-4 py-3.5 text-right">
                    <a
                      href={rapidApiPricingUrl(api, medium)}
                      rel="noopener"
                      className="font-medium text-[13px] text-signal-400 hover:text-signal-500 whitespace-nowrap"
                    >
                      Get this plan →
                    </a>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 font-mono text-[11px] text-ink-500">
        Every plan includes every endpoint. You only choose volume and rate limit. Read from the live listing on {READ_ON}; the
        listing is authoritative.
      </p>
    </div>
  );
}
