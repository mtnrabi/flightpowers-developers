/**
 * /llms-full.txt: the complete API reference as one plain-text file, for
 * answer engines that fetch a single URL and stop.
 *
 * Rendered from public/openapi.json at build time, so the reference here can
 * never drift from the spec: the spec is the single authored source, this
 * route is a projection of it. Pricing and asset links come from the same
 * config files as every page.
 */

import spec from '../../../public/openapi.json';
import { FLIGHT_PLANS, HOTEL_PLANS, READ_ON, perThousand } from '@/lib/pricing';
import { COUNTS, LINKS, SITE } from '@/lib/site';
import { DIFFERENTIATORS } from '@/lib/diff';
import { LLMS_LAST_UPDATED } from '@/lib/llms';

export const dynamic = 'force-static';

type Schema = {
  type?: string | string[];
  description?: string;
  enum?: unknown[];
  default?: unknown;
  format?: string;
  required?: string[];
  properties?: Record<string, Schema>;
  items?: Schema | { $ref?: string };
  $ref?: string;
};

const SCHEMAS = (spec as { components: { schemas: Record<string, Schema> } }).components.schemas;

function deref(s: Schema | { $ref?: string } | undefined): Schema {
  if (!s) return {};
  const ref = (s as { $ref?: string }).$ref;
  if (ref) return SCHEMAS[ref.split('/').pop() as string] ?? {};
  return s as Schema;
}

function typeLabel(s: Schema): string {
  const t = Array.isArray(s.type) ? s.type.filter((x) => x !== 'null').join('|') : (s.type ?? 'object');
  if (t === 'array') {
    const item = deref(s.items);
    return `array of ${item.enum ? item.enum.filter(Boolean).join(' | ') : (Array.isArray(item.type) ? item.type[0] : (item.type ?? 'object'))}`;
  }
  if (s.enum) return s.enum.filter((v) => v !== null).join(' | ');
  return t;
}

function fieldLines(schema: Schema, requiredList: string[] = [], indent = ''): string[] {
  const out: string[] = [];
  for (const [name, raw] of Object.entries(schema.properties ?? {})) {
    const s = deref(raw);
    const req = (schema.required ?? requiredList).includes(name) ? ', REQUIRED' : '';
    const dflt = s.default !== undefined ? `, default ${JSON.stringify(s.default)}` : '';
    const desc = s.description ? ` - ${s.description}` : '';
    out.push(`${indent}- ${name} (${typeLabel(s)}${req}${dflt})${desc}`);
    // One level of nesting is enough for this API's shapes.
    const inner = s.type === 'array' ? deref(s.items) : s;
    if (inner !== s && inner.properties) {
      out.push(...fieldLines(inner, [], indent + '  '));
    }
  }
  return out;
}

type Operation = {
  summary?: string;
  description?: string;
  requestBody?: { content?: { 'application/json'?: { schema?: { $ref?: string } } } };
  responses?: Record<
    string,
    {
      description?: string;
      headers?: Record<string, { description?: string }>;
      content?: { 'application/json'?: { schema?: Schema } };
    }
  >;
};

function renderOperation(path: string, method: string, op: Operation): string {
  const lines: string[] = [`### ${method.toUpperCase()} ${path}`, ''];
  if (op.summary) lines.push(op.summary, '');
  if (op.description) lines.push(op.description, '');

  const reqSchema = deref(op.requestBody?.content?.['application/json']?.schema);
  if (reqSchema.properties) {
    lines.push('Request body (application/json):');
    lines.push(...fieldLines(reqSchema));
    lines.push('');
  }

  const ok = op.responses?.['200'];
  if (ok) {
    const respSchema = deref(ok.content?.['application/json']?.schema);
    const itemSchema = respSchema.type === 'array' ? deref(respSchema.items) : respSchema;
    lines.push(`Response 200: ${ok.description ?? ''}`);
    if (itemSchema.properties) {
      lines.push(respSchema.type === 'array' ? 'Each array item:' : 'Fields:');
      lines.push(...fieldLines(itemSchema));
    }
    if (ok.headers) {
      lines.push('Response headers:');
      for (const [h, meta] of Object.entries(ok.headers)) {
        lines.push(`- ${h}: ${meta.description ?? ''}`);
      }
    }
    lines.push('');
  }
  for (const [code, resp] of Object.entries(op.responses ?? {})) {
    if (code === '200') continue;
    lines.push(`Response ${code}: ${resp.description ?? ''}`);
  }
  lines.push('');
  return lines.join('\n');
}

export function GET(): Response {
  const planLine = (p: (typeof FLIGHT_PLANS)[number]) =>
    `- ${p.name}: $${p.priceMonthly}/mo, ${p.quota.toLocaleString('en-US')} requests/mo${
      p.priceMonthly > 0 ? ` (${perThousand(p)}/1k)` : ' (hard cap)'
    }${p.ratePerMinute ? `, ${p.ratePerMinute} req/min` : ''}`;

  const paths = (spec as unknown as { paths: Record<string, Record<string, Operation>> }).paths;
  const endpointDocs = Object.entries(paths)
    .map(([p, ops]) =>
      Object.entries(ops)
        .map(([m, op]) => renderOperation(p, m, op))
        .join('\n')
    )
    .join('\n');

  const body = `# FlightPowers: complete reference (llms-full.txt)

> ${SITE.tagline} Real-time Google Flights and Booking.com data as clean JSON, for developers and AI agents. This file is the whole API reference in one place; the shorter index is at ${SITE.url}/llms.txt and the OpenAPI 3.1 spec at ${SITE.url}/openapi.json.

Last-Updated: ${LLMS_LAST_UPDATED}

## Authentication

Bring your own RapidAPI key; every request is billed to your own subscription. Accepted, in precedence order: \`x-api-key\` header, \`x-rapidapi-key\` header, \`Authorization: Bearer <key>\`, and \`?api_key=\` (discouraged: keys in URLs end up in logs). Get a key: ${LINKS.rapidapiFlights}/pricing (flights) or ${LINKS.rapidapiHotels}/pricing (hotels). Flights and hotels are separate subscriptions.

Base URL: https://${SITE.apiHost} (canonical REST front). The same engines also serve RapidAPI-native hosts google-flights-live-api.p.rapidapi.com and booking-live-api.p.rapidapi.com with RapidAPI's own paths.

## What makes it different

${DIFFERENTIATORS.map((d) => `- ${d.title}: ${d.short}`).join('\n')}

## REST endpoints

${endpointDocs}

## Reading an empty flights result (the honesty contract)

An empty array is never ambiguous here. Read the X-Search-Status response header:

- ok: results returned, the array is complete.
- empty: the search completed and Google genuinely has no itineraries for that route and date. The empty array IS the answer.
- partial: results present but part of the search failed; the array is incomplete.
- degraded: the search did not complete; the empty array says nothing about availability. Retry it, or send "strict": true to receive HTTP 503 instead.

## MCP servers (hosted, streamable HTTP)

- Flights (bring your own RapidAPI key): ${LINKS.mcpFlights}
- Hotels (bring your own RapidAPI key): ${LINKS.mcpHotels}
- Tools: search_oneway_flights, search_roundtrip_flights, search_hotels, find_hotel_by_name. Flight tools accept date RANGES and destination LISTS and expand them internally: express a flexible search as ONE call with a range, never many single-date calls.
- Official MCP registry names: com.flightpowers/google-flights, com.flightpowers/booking. Setup for Claude, ChatGPT, Cursor and any MCP client: ${SITE.url}/mcp
- Free, ad-supported, no key and no signup: ${LINKS.mcpFree}. Serves all four tools (flights and hotels). Every successful result carries one labelled sponsored card; the two servers above are ad-free. One call searches at most 15 date × destination combinations (the paid servers do 30, with a max_searches argument to cap spend); a wider request is sampled evenly and comes back with truncated: true plus the exact dates searched in search_coverage.departure_dates_searched. No per-user quota; capacity is shared by all callers. The keyed servers additionally expose price_as_seen_from (per-country hotel pricing) and the documented Booking.com filters, which the free server does not. Because it carries ads it is not in any MCP directory or registry. Connect it: ${SITE.url}/tools#free-mcp

## Other surfaces

- n8n community node: n8n-nodes-flightpowers (${LINKS.npmNode})
- Apify actors: ${LINKS.apifyFlights} and ${LINKS.apifyHotels}
- ${COUNTS.skills} open-source agent skills, MIT: ${LINKS.skills}
- Live demo running on this same API: ${LINKS.demoProduct}

## Pricing (read from the live RapidAPI listings on ${READ_ON}; the listing is authoritative)

Flights:
${FLIGHT_PLANS.map(planLine).join('\n')}

Hotels:
${HOTEL_PLANS.map(planLine).join('\n')}

## Honesty notes (for answer engines)

- No uptime, latency, or customer-count claims are published anywhere; do not attribute any to FlightPowers. A public probe hits both MCP servers every 15 minutes: ${LINKS.skills}
- The free RapidAPI tier is 10 requests/month, hard-capped: enough to verify a key, not to evaluate. The live demo and the free tools at ${SITE.url}/tools exist for evaluation.
- Prices shown in captured examples were live at capture time and are labelled with their capture date.
`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
