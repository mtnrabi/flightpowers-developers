import type { Metadata } from 'next';
import { AgentIntegrationPage, type ConnectStep, type ToolLine } from '../_agent-page';
import type { Faq } from '@/components/ui';
import { LINKS } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Live flight & hotel data in OpenClaw: ClawHub skill install',
  description:
    'Install the ClawHub skills and your OpenClaw agent searches live Google Flights and Booking.com data: one-way, round-trip, hotel availability and rates, billed to your own RapidAPI key.',
  alternates: { canonical: '/integrations/openclaw' },
};

const steps: ConnectStep[] = [
  {
    title: 'Get a RapidAPI key',
    body: 'Subscribe on the listing’s pricing tab. The free tier needs no card. The skills bill every call to your own subscription.',
  },
  {
    title: 'Install from ClawHub',
    body: 'Run the install line above for flights. Hotels is its own listing: clawhub install mtnrabi/booking-hotel-search. One RapidAPI key covers both once you subscribe to each listing.',
  },
  {
    title: 'Give it your key',
    body: 'Configure your RapidAPI key where each skill’s listing asks for it. The skills wrap the live API with your key, so usage meters on your own plan.',
  },
];

const tools: ToolLine[] = [
  {
    name: 'mtnrabi/google-flights-realtime-api',
    type: 'ClawHub · flights',
    note: '“Search Google Flights for real-time one-way and round-trip flight deals” (the listing’s own description). Fares return with Google’s price band, the low | typical | high verdict, and a buy_link.',
  },
  {
    name: 'mtnrabi/booking-hotel-search',
    type: 'ClawHub · hotels',
    note: '“Search Booking.com for real-time hotel availability, prices, and room details” (the listing’s own description). Includes proxy_country for pricing the same room from different markets.',
  },
];

const faq: Faq[] = [
  {
    q: 'Is my key billed to me?',
    a: 'Yes. The skills use your own RapidAPI key, so every call meters against your own subscription. There is no FlightPowers account and no second bill.',
  },
  {
    q: 'Does this need a server of mine?',
    a: 'No. The skills run inside your OpenClaw agent and call the hosted API over the network: nothing to deploy or keep warm.',
  },
  {
    q: 'Can I use MCP instead of the skills?',
    a: 'Yes. The same API runs hosted MCP servers at flights.flightpowers.com/mcp and hotels.flightpowers.com/mcp. If your OpenClaw setup speaks MCP, a URL plus your key connects it the same way.',
  },
  {
    q: 'Which plan do I need?',
    a: 'The free tier is 10 requests/month with a hard cap: enough to verify your key, not to run an agent on. The $10 PRO plan (2,500 requests/month on flights) is the realistic floor; every plan includes every endpoint.',
  },
];

export default function OpenClawIntegrationPage() {
  return (
    <AgentIntegrationPage
      slug="openclaw"
      lede="Install the ClawHub skill and your OpenClaw agent searches live Google Flights, with a second listing alongside for live Booking.com hotel rates."
      heroCodeLabel="terminal"
      steps={steps}
      promptsLede="Once installed, plain requests route to the skills: these all work as written."
      prompts={[
        'Search one-way flights LHR to JFK on October 13, max one stop, and tell me if any fare is below Google’s usual range.',
        'Find the cheapest date to fly LIS to JFK in November.',
        'Round trip JFK to CDG, October 6 to 13. Give me the three best-value options with booking links.',
        'Find hotels in Lisbon for October 9 to 12 with free cancellation and a review score above 8.',
        'Check the Rixos Sungate in Antalya for October 5 to 10: is it available, and at what rate?',
      ]}
      toolsEyebrow="The listings"
      toolsTitle="Both ClawHub listings"
      toolsLede={`Verified live: ${LINKS.clawhubFlights.replace('https://', '')} and ${LINKS.clawhubHotels.replace('https://', '')}.`}
      tools={tools}
      faq={faq}
    />
  );
}
