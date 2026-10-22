import { FLIGHT_PLANS } from './pricing';
import { LINKS } from './site';

const pro = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;

/**
 * The line under every set of install buttons (Matan 2026-10-22: "Add to
 * claude / chat gpt buttons should be the paid MCP version"). The 10 a day is
 * the paid servers' own instructions, read 2026-10-22: "10 free searches a day
 * after sign-in with Google, shared by FlightPowers' flights and hotels
 * servers". Prices from lib/pricing.ts.
 */
export const PAID_TRIAL_LINE =
  `Sign in with Google: 10 free searches a day, no card. ` +
  `More with your own key: PRO $${pro.priceMonthly}/month for ${pro.quota.toLocaleString('en-US')} flight searches.`;

/** The one place an integration page names the free ad-supported server. Text only, no button. */
export const FREE_SERVER_LINE = `There is also a free server with ads, 50 searches a day: ${LINKS.mcpFree.replace('https://', '')}`;
