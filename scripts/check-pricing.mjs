#!/usr/bin/env node
/**
 * Pricing drift check — fetches the three RapidAPI listing pages anonymously,
 * extracts the billing plans from the RSC payload, filters to PUBLIC, and
 * compares against the committed data in src/lib/pricing.ts.
 *
 * Exit codes:
 *   0  live PUBLIC plans match the committed table
 *   1  drift detected (or a non-public plan matched committed output) — the
 *      committed values are stale; update src/lib/pricing.ts and READ_ON
 *   2  fetch/parse failure — the site keeps rendering last-good committed
 *      values; investigate before trusting this check again
 *
 * Run before every deploy: `npm run check-pricing`.
 * The private plans that also sit in the public payload must NEVER reach the
 * rendered site; this script fails loudly if a committed plan matches a
 * non-PUBLIC plan's identity.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const LISTINGS = {
  flights: 'https://rapidapi.com/mtnrabi/api/google-flights-live-api',
  hotels: 'https://rapidapi.com/mtnrabi/api/booking-live-api',
  airbnb: 'https://rapidapi.com/mtnrabi/api/airbnb-live-api',
};

/** Pull every {"id":"billingplan_... object out of the RSC payload by brace-matching. */
function extractPlans(html) {
  // The payload is streamed as self.__next_f.push([1,"..."]) chunks with JSON escaping.
  const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)].map((m) =>
    JSON.parse(`"${m[1]}"`)
  );
  const joined = chunks.join('');
  const plans = [];
  let idx = 0;
  const needle = '{"id":"billingplan_';
  while ((idx = joined.indexOf(needle, idx)) !== -1) {
    let depth = 0;
    let end = idx;
    for (let i = idx; i < joined.length; i++) {
      const c = joined[i];
      if (c === '"') {
        // skip string
        i++;
        while (i < joined.length && joined[i] !== '"') {
          if (joined[i] === '\\') i++;
          i++;
        }
        continue;
      }
      if (c === '{') depth++;
      if (c === '}') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    try {
      plans.push(JSON.parse(joined.slice(idx, end)));
    } catch {
      /* partial object across chunk boundary variants — ignore */
    }
    idx = end;
  }
  // Deduplicate by id.
  const byId = new Map();
  for (const p of plans) byId.set(p.id, p);
  return [...byId.values()];
}

function normalizeLive(plan) {
  const version = plan.version ?? {};
  const limit =
    version.billinglimits?.find?.((l) => l.billingitem?.name === 'Requests') ?? version.billinglimits?.[0];
  return {
    name: plan.name,
    priceMonthly: version.price ?? null,
    quota: limit?.amount ?? null,
    overagePerRequest: limit?.overageprice ?? null,
    // A rate limit only counts if the listing actually enforces it per minute:
    // enabled:false means RapidAPI's platform default applies (not our number),
    // and unit:60 would be a per-HOUR window, not per-minute.
    ratePerMinute:
      version.rateLimit?.enabled && version.rateLimit?.unit === 1 ? version.rateLimit.amount : null,
    visibility: plan.visibility,
  };
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const fullSrc = readFileSync(join(here, '..', 'src', 'lib', 'pricing.ts'), 'utf8');
  // Scope the comparison per API: FLIGHT_PLANS, HOTEL_PLANS and AIRBNB_PLANS share plan names.
  const hotelStart = fullSrc.indexOf('export const HOTEL_PLANS');
  const airbnbStart = fullSrc.indexOf('export const AIRBNB_READ_ON');
  if (hotelStart === -1 || airbnbStart === -1 || airbnbStart < hotelStart) {
    console.error('[check-pricing] PARSE FAILURE: pricing.ts no longer has HOTEL_PLANS followed by AIRBNB_READ_ON.');
    process.exitCode = 2;
    return;
  }
  const sections = {
    flights: fullSrc.slice(0, hotelStart),
    hotels: fullSrc.slice(hotelStart, airbnbStart),
    airbnb: fullSrc.slice(airbnbStart),
  };

  let drift = false;

  for (const [api, url] of Object.entries(LISTINGS)) {
    let html;
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (err) {
      console.error(`[check-pricing] FETCH FAILED for ${api}: ${err.message} — keeping last-good committed values.`);
      process.exitCode = 2;
      return;
    }

    const all = extractPlans(html);
    if (all.length === 0) {
      console.error(`[check-pricing] PARSE FAILURE for ${api}: zero billingplan objects found — the payload format may have changed. Keeping last-good committed values.`);
      process.exitCode = 2;
      return;
    }

    const pub = all.filter((p) => p.visibility === 'PUBLIC').map(normalizeLive);
    const priv = all.filter((p) => p.visibility !== 'PUBLIC');

    console.log(`[check-pricing] ${api}: ${pub.length} public plans, ${priv.length} non-public (never rendered).`);

    // Guard: no committed plan may match a non-public plan's name+price combo.
    for (const p of priv) {
      const marker = `'${p.name}'`;
      if (sections[api].includes(marker)) {
        console.error(`[check-pricing] FATAL: committed pricing.ts contains non-PUBLIC plan name ${p.name}.`);
        process.exitCode = 1;
        drift = true;
      }
    }

    for (const live of pub) {
      // Committed rows look like: { name: 'PRO', priceMonthly: 10, quota: 2500, ...
      const rowRe = new RegExp(`name: '${live.name}', priceMonthly: (\\d+), quota: (\\d+)`);
      const m = sections[api].match(rowRe);
      if (!m) {
        console.error(`[check-pricing] DRIFT (${api}): live PUBLIC plan ${live.name} not found in committed table.`);
        drift = true;
        continue;
      }
      const [committedPrice, committedQuota] = [Number(m[1]), Number(m[2])];
      if (live.priceMonthly != null && committedPrice !== live.priceMonthly) {
        console.error(`[check-pricing] DRIFT (${api} ${live.name}): price live $${live.priceMonthly} vs committed $${committedPrice}.`);
        drift = true;
      }
      if (live.quota != null && committedQuota !== live.quota) {
        console.error(`[check-pricing] DRIFT (${api} ${live.name}): quota live ${live.quota} vs committed ${committedQuota}.`);
        drift = true;
      }
    }

    // Reverse check: a committed row with no live PUBLIC plan behind it (a tier never created) is drift too.
    const liveNames = new Set(pub.map((p) => p.name));
    for (const m of sections[api].matchAll(/name: '([A-Z]+)', priceMonthly:/g)) {
      if (!liveNames.has(m[1])) {
        console.error(`[check-pricing] DRIFT (${api}): committed plan ${m[1]} has no live PUBLIC plan; remove the row.`);
        drift = true;
      }
    }
    if (api === 'airbnb' && /AIRBNB_READ_ON[^=]*= null/.test(sections.airbnb)) {
      console.log('[check-pricing] airbnb: AIRBNB_READ_ON is null; if this run ends OK, set it to today so the table names the date.');
    }
  }

  if (drift) {
    console.error('[check-pricing] Update src/lib/pricing.ts (and READ_ON) from the live listing before deploying.');
    process.exitCode = 1;
  } else if (process.exitCode === undefined || process.exitCode === 0) {
    console.log('[check-pricing] OK — committed pricing matches the live PUBLIC plans.');
  }
}

await main();
