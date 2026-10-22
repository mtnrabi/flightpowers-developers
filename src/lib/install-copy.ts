import { FLIGHT_PLANS } from './pricing';
import { LINKS, PAID_TRIAL_PER_DAY } from './site';

const pro = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;

/** The line under every set of install buttons. Prices from lib/pricing.ts. */
export const PAID_TRIAL_LINE =
  `Sign in with Google: ${PAID_TRIAL_PER_DAY} free searches a day, no card. ` +
  `More with your own key: PRO $${pro.priceMonthly}/month for ${pro.quota.toLocaleString('en-US')} flight searches.`;

/** The one place an integration page names the free ad-supported server. Text only, no button. */
export const FREE_SERVER_LINE = `There is also a free server with ads, 50 searches a day: ${LINKS.mcpFree.replace('https://', '')}`;
