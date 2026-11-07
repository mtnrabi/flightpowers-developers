import type { Plan } from './pricing';

/**
 * Pure text helpers for <PlanBox /> (src/components/PlanBox.tsx), kept free of
 * runtime imports so scripts/plan-box.test.mjs can run them on the real plan
 * arrays from lib/pricing.ts. Every number comes from the plans passed in;
 * nothing here is typed by hand.
 */

const fmt = (n: number) => n.toLocaleString('en-US');

/**
 * One listing's public ladder as one sentence, e.g.
 * "Google Flights Live API: free for 10 searches a month, then PRO $10 a month
 * for 2,500, ULTRA $25 for 10,000, MEGA $50 for 25,000."
 * The free plan is named by its quota; paid plans in the listing's own order.
 */
export function ladderLine(label: string, plans: Plan[]): string {
  const free = plans.find((p) => p.priceMonthly === 0);
  const paid = plans.filter((p) => p.priceMonthly > 0);
  const paidText = paid
    .map((p, i) => `${p.name} $${p.priceMonthly}${i === 0 ? ' a month' : ''} for ${fmt(p.quota)}`)
    .join(', ');
  const head = free ? `free for ${fmt(free.quota)} searches a month, then ` : '';
  return `${label}: ${head}${paidText}.`;
}

/**
 * utm_content for one PlanBox: "planbox-" + the page path, slashes to dashes,
 * so /compare/duffel -> "planbox-compare-duffel". Only [a-z0-9-] survive, the
 * same alphabet the /api/e beacon keeps for campaign labels.
 */
export function planBoxContent(path: string): string {
  const slug = path
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `planbox-${slug || 'home'}`;
}
