import Link from 'next/link';
import { TrackedLink } from './TrackedLink';
import { perThousand, type Plan } from '@/lib/pricing';
import { job, perMonth } from '@/lib/daily-runs';
import { rapidApiPricingUrl, type RapidApiListing } from '@/lib/site';

/**
 * One listing's plans as four cards with a button each, for the top of
 * /pricing.
 *
 * Every number comes from lib/pricing.ts. Clicks beacon with medium
 * "pricing-top", so they read apart from the tables further down.
 */
export function PlanCards({ api, label, plans }: { api: RapidApiListing; label: string; plans: Plan[] }) {
  return (
    <div>
      <p className="font-mono text-[12px] text-signal-400">{label}</p>
      <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {plans.map((plan) => {
          const href = rapidApiPricingUrl(api, 'pricing', `pricing-top-${plan.name.toLowerCase()}`);
          const u = new URL(href);
          const free = plan.priceMonthly === 0;
          return (
            <li
              key={plan.name}
              className={`flex flex-col rounded-2xl border p-4 sm:p-5 ${
                plan.recommended ? 'border-signal-600/50 bg-signal-600/[0.06]' : 'rule bg-ink-900/60'
              }`}
            >
              <p className="text-[14px] font-semibold text-ink-100">{plan.name}</p>
              <p className="mt-1 text-2xl font-semibold text-ink-100 tabular-nums">
                ${plan.priceMonthly}
                <span className="text-[13px] font-normal text-ink-400"> / month</span>
              </p>
              <p className="mt-2 text-[14px] text-ink-300">{plan.quota.toLocaleString('en-US')} requests a month</p>
              <p className="mt-1 text-[13px] text-ink-400">
                {free ? 'No card. Stops at the cap.' : `${perThousand(plan)} per 1,000, ${plan.ratePerMinute} a minute`}
              </p>
              <div className="mt-auto pt-4">
                <TrackedLink
                  href={href}
                  target={`${u.host}${u.pathname}`}
                  medium="pricing-top"
                  className={`btn w-full ${plan.recommended || plan.name === 'PRO' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {free ? 'Start free' : `Get ${plan.name}`}
                </TrackedLink>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[13.5px] text-ink-400 leading-relaxed">
        The button opens the plans on RapidAPI. Sign in or make an account there, pick the plan, and your key is on the
        Endpoints tab. RapidAPI takes the payment; we never see your card.
      </p>
      {api === 'flights' ? (
        <p className="mt-2 text-[13.5px] text-ink-400 leading-relaxed">
          What the PRO quota does: one route checked every morning, a month of dates at a time, is{' '}
          {perMonth(job('template-one').perRun)} a month.{' '}
          <Link href="/docs/run-daily" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
            Four ways to run it every day
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
