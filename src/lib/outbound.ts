/**
 * Which outbound links count as a marketplace/listing click worth an
 * `outbound` beacon, and what `target` string they record.
 *
 * Pulled out of the tracker component so the host list is one place and is
 * plain data — no DOM, no React, easy to read and to extend.
 */

const FP_APEX = 'flightpowers.com';

/**
 * `*.flightpowers.com` subdomains that are our own infrastructure, not an
 * MCP endpoint and not a marketplace conversion: `api.` is our own REST
 * docs host, `demo.` is the separate demo product, `www.` is just the site
 * itself under another name.
 */
const FP_NON_MCP_SUBDOMAINS = new Set(['api', 'demo', 'www']);

function isFlightpowersMcpHost(hostname: string): boolean {
  const suffix = `.${FP_APEX}`;
  if (!hostname.endsWith(suffix)) return false;
  const sub = hostname.slice(0, -suffix.length);
  return sub.length > 0 && !FP_NON_MCP_SUBDOMAINS.has(sub);
}

function isHostOrSubdomain(hostname: string, apex: string): boolean {
  return hostname === apex || hostname.endsWith(`.${apex}`);
}

/**
 * Returns the `target` value (`host+path`, no query string) to record for
 * this URL, or `null` if it is not one of our marketplace/listing
 * destinations. `currentHostname` is `window.location.hostname` — a link
 * back to our own site is never "outbound", whatever host it names.
 */
export function matchOutboundTarget(url: URL, currentHostname: string): string | null {
  const host = url.hostname.toLowerCase();
  if (host === currentHostname) return null;

  const isMarketplace =
    isHostOrSubdomain(host, 'rapidapi.com') ||
    isHostOrSubdomain(host, 'apify.com') ||
    isHostOrSubdomain(host, 'smithery.ai') ||
    isHostOrSubdomain(host, 'npmjs.com') ||
    (host === 'github.com' && url.pathname.toLowerCase().startsWith('/mtnrabi')) ||
    isFlightpowersMcpHost(host);

  if (!isMarketplace) return null;
  return `${host}${url.pathname}`;
}
