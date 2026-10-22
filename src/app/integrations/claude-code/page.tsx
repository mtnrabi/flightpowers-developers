import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AgentIntegrationPage, type ConnectStep, type ToolLine } from '../_agent-page';
import { Section, SectionHead, type Faq } from '@/components/ui';
import { COUNTS, LINKS } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = withOg({
  title: 'Live flight & hotel data in Claude Code: skills install',
  description:
    'One install line gives Claude Code eight open-source travel skills over the live FlightPowers API: cheapest dates, fare watch, trip planning, hotel search, rate-parity monitoring. MIT-licensed, bring your own RapidAPI key.',
  alternates: { canonical: '/integrations/claude-code' },
});

const steps: ConnectStep[] = [
  {
    title: 'Add the server',
    body: 'Run the command above, then type /mcp inside Claude Code and sign in with Google. Add --scope user to have it in every project. If you already added FlightPowers as a connector on claude.ai, it shows up in Claude Code by itself when you sign in with the same account.',
  },
  {
    title: 'For no ads and the big scans, add the keyed servers',
    body: 'claude mcp add --transport http flightpowers-flights https://flights.flightpowers.com/mcp (hotels the same way). The first 10 searches a day are free after sign-in; PRO is $10 for 2,500 flight searches a month. Headless runs send --header "x-rapidapi-key: YOUR_KEY" instead of signing in.',
  },
  {
    title: 'Or install the skills',
    body: 'Run npx skills add mtnrabi/travel-agent-skills in your terminal. Eight MIT-licensed skills from the public repo, no build step. They talk to the same API over MCP or plain REST with your key; the repo’s README documents both paths per skill.',
  },
];

const tools: ToolLine[] = [
  {
    name: 'Cheapest dates',
    note: 'Scans a date range and answers with the cheapest days to fly, one request per date under the hood.',
  },
  {
    name: 'Fare watch',
    note: 'Checks a route on demand and reads Google’s low | typical | high verdict, so “alert me when it flips to low” is a field comparison, not a price-history project.',
  },
  {
    name: 'Trip planning',
    note: 'Combines flight and hotel lookups into one itinerary answer, with booking links on both halves.',
  },
  {
    name: 'Hotel search',
    note: 'Live Booking.com rates by destination, with the site’s own filters.',
  },
  {
    name: 'Rate-parity monitoring',
    note: 'Prices the same property from different countries via proxy_country, sampling each market, and reports the range each one landed in.',
  },
];

const faq: Faq[] = [
  {
    q: 'Is my key billed to me?',
    a: 'Yes. The skills use your own RapidAPI key, so every call meters against your own subscription. There is no FlightPowers account and no second bill.',
  },
  {
    q: 'Do the skills need an MCP server?',
    a: 'No. They work over MCP or plain REST with your key, whichever your setup prefers. If you would rather skip skills entirely, the hosted MCP servers work in Claude Code too; see the MCP page.',
  },
  {
    q: 'What license are the skills under?',
    a: 'MIT, in a public GitHub repository. Read them before you run them, fork them, or lift the API calls straight into your own automation. All fine.',
  },
  {
    q: 'Which plan do I need?',
    a: 'The free tier is 10 requests/month with a hard cap: enough to verify your key, not to work with. A daily fare watch alone is about 30 requests a month, so the $10 PRO plan (2,500 requests/month on flights) is the realistic floor.',
  },
];

export default function ClaudeCodeIntegrationPage() {
  return (
    <AgentIntegrationPage
      slug="claude-code"
      lede="One command adds FlightPowers to Claude Code as an MCP server. One more line gives it eight open-source travel skills on the same live API: cheapest dates, fare watch, trip planning, hotel search, rate-parity monitoring."
      heroCodeLabel="terminal"
      steps={steps}
      promptsLede="After the install, plain requests route to the right skill: these all work as written."
      prompts={[
        'Find the cheapest week to fly LGW to Lisbon this winter.',
        'Check JFK to LHR for December 10 and tell me whether Google calls the fare low, typical, or high.',
        'Plan a 5-day Lisbon trip in October: flights from LGW plus a hotel with a review score above 8.',
        'Is the Rixos Sungate cheaper booked from the US than from Israel for October 5 to 10?',
        'Scan November for the cheapest LIS to JFK date and write the results to a CSV.',
      ]}
      toolsEyebrow="The skills"
      toolsTitle={`${COUNTS.skills} skills, MIT-licensed`}
      toolsLede="The repo’s own description names these five capability areas; all eight skills are listed in its README. Each calls the same live API your key unlocks."
      tools={tools}
      extra={
        <Section>
          <SectionHead
            eyebrow="Open source"
            title="Read the code before you run it"
            lede="The skills are plain, readable files in a public repo: the API calls inside them are the same ones documented on this site."
          />
          <div className="mt-6 flex flex-wrap gap-2.5">
            <a href={LINKS.skills} rel="noopener" className="chip">
              github.com/mtnrabi/travel-agent-skills
            </a>
            <Link href="/skills" className="chip">
              The skills page
            </Link>
          </div>
        </Section>
      }
      faq={faq}
      install="claude-code"
    />
  );
}
