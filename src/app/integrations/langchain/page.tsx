import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import { CtaBand } from '@/components/bands';
import { Breadcrumbs, Code, Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = withOg({
  title: 'LangChain: flight & hotel tools via the MCP adapters',
  description:
    'Point langchain-mcp-adapters at the hosted FlightPowers MCP servers and your LangChain agent gets live flight and hotel search tools: real fares with Google’s price verdict. Or wrap the REST API as a plain tool.',
  alternates: { canonical: '/integrations/langchain' },
});

const faq: Faq[] = [
  {
    q: 'Is there a first-party LangChain package?',
    a: 'No, and none is needed. LangChain’s own MCP adapters load the hosted servers’ tools directly, and the plain REST API wraps into a @tool in a few lines. Both paths are shown on this page; there is nothing else to install from us.',
  },
  {
    q: 'What tools does the agent get?',
    a: 'What the MCP servers expose: one-way and round-trip flight search on the flights server, hotel search and hotel-by-name on the hotels server. Each returns the same JSON as the REST API, including the price band and verdict.',
  },
  {
    q: 'Where does the key go?',
    a: 'In the headers block of the server config, as x-rapidapi-key. It rides on every tool call and bills to your own RapidAPI plan. Flights and hotels are separate subscriptions.',
  },
  {
    q: 'Does this work with LangGraph?',
    a: 'Yes. get_tools() returns ordinary LangChain tools; pass them to create_agent or any LangGraph graph the same way you pass any tool list.',
  },
];

export default function LangchainIntegrationPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Integrations', item: `${SITE.url}/integrations` },
            { '@type': 'ListItem', position: 2, name: 'LangChain', item: `${SITE.url}/integrations/langchain` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[{ href: '/integrations', label: 'Integrations' }, { href: '/integrations/langchain', label: 'LangChain' }]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
            <div>
              <p className="eyebrow">Integrations · LangChain</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
                Flight tools for your agent, via <span className="text-signal-500">MCP</span>
              </h1>
              <p className="lede mt-5">
                LangChain&apos;s MCP adapters load the hosted FlightPowers servers as ordinary tools. Your agent searches live
                fares and quotes Google&apos;s verdict; you write no HTTP code.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'integration')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/mcp" variant="ghost">
                  The MCP servers →
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>
            <Code label="pip install langchain-mcp-adapters">{`from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain.agents import create_agent

client = MultiServerMCPClient({
    "flights": {
        "transport": "http",
        "url": "${LINKS.mcpFlights}",
        "headers": {"x-rapidapi-key": "YOUR_KEY"},
    },
    "hotels": {
        "transport": "http",
        "url": "${LINKS.mcpHotels}",
        "headers": {"x-rapidapi-key": "YOUR_KEY"},
    },
})

tools = await client.get_tools()
agent = create_agent(model, tools)  # any chat model`}</Code>
          </div>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="The REST alternative"
          title="No MCP? Wrap one endpoint as a tool"
          lede="The API is one POST with flat JSON, so a hand-rolled tool is a few lines."
        />
        <div className="mt-8 max-w-3xl">
          <Code label="a plain langchain tool over the REST API">{`import os, requests
from langchain_core.tools import tool

@tool
def search_flights(from_airport: str, to_airport: str, departure_date: str) -> list:
    """Live one-way fares with Google's price band and low|typical|high verdict."""
    r = requests.post(
        "https://api.flightpowers.com/v1/flights/oneway",
        headers={"x-api-key": os.environ["RAPIDAPI_KEY"]},
        json={"from_airport": from_airport, "to_airport": to_airport,
              "departure_date": departure_date},
    )
    return r.json()`}</Code>
          <p className="mt-4 text-[14px] text-ink-400 leading-relaxed">
            The response includes <code className="font-mono text-[13px] text-signal-400">price_insights_low</code> /{' '}
            <code className="font-mono text-[13px] text-signal-400">high</code> and the verdict field, so the agent can reason
            about whether a fare is worth booking, not just list it.
          </p>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand medium="integration" title="Give your agent a fare verdict" />
      </Section>
    </>
  );
}
