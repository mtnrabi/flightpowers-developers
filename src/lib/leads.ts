import fs from 'node:fs';
import path from 'node:path';

/**
 * The private /for/<slug> pages: one JSON file per lead in src/data/leads.
 * `capture` is written by scripts/lead-capture.mjs from ONE real call through
 * api.flightpowers.com; nothing in it is typed by hand. A file without a
 * capture gets no page, so a page never shows a request with no real answer.
 */
export type Lead = {
  slug: string;
  name: string;
  product: 'flights' | 'hotels';
  title: string;
  intro: string;
  /** One sentence that reads the captured response back in plain words. */
  resultLine: string;
  request: { path: string; body: Record<string, unknown> };
  fanout: { title: string; note: string; code: string };
  mcp: { server: 'flights' | 'hotels'; prompt: string; note: string };
  extras: string[];
  capture?: {
    fetchedAt: string;
    httpStatus: number;
    elapsedMs: number;
    searchStatus: string | null;
    rowsReturned: number | null;
    rowsShown: number;
    response: unknown;
  };
};

const DIR = path.join(process.cwd(), 'src', 'data', 'leads');

export function allLeads(): Lead[] {
  let files: string[];
  try {
    files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  return files
    .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) as Lead)
    .filter((lead) => lead.capture && lead.capture.httpStatus === 200 && /^[a-z0-9-]+$/.test(lead.slug));
}

export function leadBySlug(slug: string): Lead | undefined {
  return allLeads().find((lead) => lead.slug === slug);
}

/** The exact curl for the captured request. */
export function curlFor(lead: Lead): string {
  return [
    `curl -s https://api.flightpowers.com${lead.request.path} \\`,
    '  -H "Content-Type: application/json" \\',
    '  -H "x-api-key: $RAPIDAPI_KEY" \\',
    `  -d '${JSON.stringify(lead.request.body)}'`,
  ].join('\n');
}
