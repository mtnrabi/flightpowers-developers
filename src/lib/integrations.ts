/**
 * The integrations dataset — one list renders the homepage logo grid and the
 * /integrations hub. Only surfaces that are live today, with one honest line
 * each. Logos are self-hosted official marks in /public/logos (see
 * public/logos/SOURCES.md for provenance); a missing file renders as a text
 * wordmark tile, never a hotlink or a redrawn mark.
 */

export type Integration = {
  /** basename of the mark in /public/logos/<slug>.svg */
  slug: string;
  name: string;
  href: string;
  external?: boolean;
  /** one line: what you build with it */
  line: string;
  /** small mono tag on the hub card */
  tag: string;
};

export const INTEGRATIONS: Integration[] = [
  {
    slug: 'claude',
    name: 'Claude',
    href: '/integrations/claude',
    line: 'Live prices and hotel rates, quoted mid-conversation',
    tag: 'MCP connector',
  },
  {
    slug: 'openai',
    name: 'ChatGPT',
    href: '/integrations/chatgpt',
    line: 'Connector in developer mode; the key stays in settings',
    tag: 'MCP connector',
  },
  {
    slug: 'cursor',
    name: 'Cursor',
    href: '/integrations/cursor',
    line: 'The agent writing your travel feature can also run it',
    tag: '.cursor/mcp.json',
  },
  {
    slug: 'mcp',
    name: 'MCP servers',
    href: '/mcp',
    line: 'Hosted: a URL plus your key, nothing to install',
    tag: '3 hosted servers',
  },
  {
    slug: 'n8n',
    name: 'n8n',
    href: '/integrations/n8n',
    line: 'Price-watch crons without writing HTTP',
    tag: 'community node',
  },
  {
    slug: 'zapier',
    name: 'Zapier',
    href: '/integrations/zapier',
    line: 'Price checks in any Zap via the HTTP step',
    tag: 'HTTP step',
  },
  {
    slug: 'make',
    name: 'Make',
    href: '/integrations/make',
    line: 'Scenarios on live prices and hotel rates',
    tag: 'HTTP module',
  },
  {
    slug: 'langchain',
    name: 'LangChain',
    href: '/integrations/langchain',
    line: 'Tools for your agent via the MCP adapters',
    tag: 'MCP adapters',
  },
  {
    slug: 'rapidapi',
    name: 'RapidAPI',
    href: '/integrations/rapidapi',
    line: 'Where the key and the bill live',
    tag: 'marketplace',
  },
  {
    slug: 'apify',
    name: 'Apify',
    href: '/integrations/apify',
    line: 'Pay-per-event actors, no subscription',
    tag: 'actors',
  },
  {
    slug: 'github',
    name: 'Agent skills',
    href: '/skills',
    line: '8 MIT-licensed skills to read, fork, and run',
    tag: 'open source',
  },
  {
    slug: 'openclaw',
    name: 'OpenClaw',
    href: '/integrations/openclaw',
    line: 'ClawHub skills installed in one line',
    tag: 'ClawHub',
  },
  {
    slug: 'smithery',
    name: 'Smithery',
    href: '/integrations/smithery',
    line: 'The MCP registry listings, key via config',
    tag: 'MCP registry',
  },
  {
    slug: 'rest',
    name: 'REST API',
    href: '/integrations/api',
    line: 'One POST, flat JSON, OpenAPI spec',
    tag: '6 endpoints',
  },
];

/** The homepage grid: the first 12 (the hub shows everything). */
export const HOME_INTEGRATIONS = INTEGRATIONS.slice(0, 12);
