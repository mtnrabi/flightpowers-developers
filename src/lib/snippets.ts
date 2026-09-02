/**
 * Code-snippet builders for the ApiUpsellCard — the exact request that
 * reproduces what the visitor is looking at, pre-filled with their own
 * inputs. Key always shown as $RAPIDAPI_KEY / env var, never a real value.
 * Isomorphic: used by server pages and client components alike.
 *
 * Every builder can render against either host:
 *   - `rapidapi` (default): the marketplace host the caller subscribes on.
 *   - `own`: api.flightpowers.com, our own REST front. Same engines, same
 *     key, `/v1/...` paths, and the key goes in `x-api-key`. Paths and field
 *     names below come from public/openapi.json, the spec served at
 *     /openapi.json.
 * Both are real, working requests. The toggle exists because "the listing
 * can vanish" is a live objection to a RapidAPI-fronted API, and the honest
 * answer is that the same call works on a domain we own.
 */

export type Snippets = { curl: string; python: string; node: string };

/** Which host the snippet targets. */
export type SnippetHost = 'rapidapi' | 'own';

/** Both renderings of the same request, so a component can offer the toggle. */
export type SnippetPair = { rapidapi: Snippets; own: Snippets };

const FLIGHTS_HOST = 'google-flights-live-api.p.rapidapi.com';
const HOTELS_HOST = 'booking-live-api.p.rapidapi.com';
const OWN_HOST = 'api.flightpowers.com';

/** Marketplace path → the same operation on api.flightpowers.com. */
const OWN_PATHS: Record<string, string> = {
  '/api/google_flights/oneway/v1': '/v1/flights/oneway',
  '/api/google_flights/roundtrip/v1': '/v1/flights/roundtrip',
  '/search': '/v1/hotels/search',
  '/hotel_by_name': '/v1/hotels/by-name',
};

type Target = {
  host: string;
  path: string;
  /** Header lines for a `curl` continuation block. */
  curlHeaders: string;
  /** Header entries for an inline Python dict, indented eight spaces. */
  pyHeaders: string;
  /** Header entries for a JS object literal, at `indent`. */
  nodeHeaders: (indent: string) => string;
};

function target(api: 'flights' | 'hotels', path: string, host: SnippetHost): Target {
  if (host === 'own') {
    return {
      host: OWN_HOST,
      path: OWN_PATHS[path] ?? path,
      curlHeaders: `  -H "Content-Type: application/json" \\\n  -H "x-api-key: $RAPIDAPI_KEY" \\`,
      pyHeaders: `        "Content-Type": "application/json",\n        "x-api-key": os.environ["RAPIDAPI_KEY"],`,
      nodeHeaders: (indent) =>
        `${indent}  "Content-Type": "application/json",\n${indent}  "x-api-key": process.env.RAPIDAPI_KEY,`,
    };
  }
  const h = api === 'flights' ? FLIGHTS_HOST : HOTELS_HOST;
  return {
    host: h,
    path,
    curlHeaders: `  -H "Content-Type: application/json" \\\n  -H "x-rapidapi-host: ${h}" \\\n  -H "x-rapidapi-key: $RAPIDAPI_KEY" \\`,
    pyHeaders: `        "Content-Type": "application/json",\n        "x-rapidapi-host": "${h}",\n        "x-rapidapi-key": os.environ["RAPIDAPI_KEY"],`,
    nodeHeaders: (indent) =>
      `${indent}  "Content-Type": "application/json",\n${indent}  "x-rapidapi-host": "${h}",\n${indent}  "x-rapidapi-key": process.env.RAPIDAPI_KEY,`,
  };
}

/** Header block for a hoisted Python `HEADERS = {...}` constant. */
function pyHeadersConst(t: Target): string {
  return `HEADERS = {\n${t.pyHeaders.replace(/^ {8}/gm, '    ')}\n}`;
}

function fmtJson(body: Record<string, unknown>, indent: string): string {
  const inner = Object.entries(body)
    .map(([k, v]) => `${indent}  ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(',\n');
  return `{\n${inner}\n${indent}}`;
}

function curlFor(t: Target, body: Record<string, unknown>): string {
  return `curl -X POST "https://${t.host}${t.path}" \\
${t.curlHeaders}
  -d '${JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')}'`;
}

function pythonFor(t: Target, body: Record<string, unknown>, tail: string): string {
  return `import os, requests

r = requests.post(
    "https://${t.host}${t.path}",
    headers={
${t.pyHeaders}
    },
    json=${fmtJson(body, '    ')},
)
${tail}`;
}

function nodeFor(t: Target, body: Record<string, unknown>, tail: string): string {
  return `const res = await fetch("https://${t.host}${t.path}", {
  method: "POST",
  headers: {
${t.nodeHeaders('  ')}
  },
  body: JSON.stringify(${fmtJson(body, '  ')}),
});
${tail}`;
}

/** Build the same request for both hosts, for components that offer the toggle. */
export function bothHosts(build: (host: SnippetHost) => Snippets): SnippetPair {
  return { rapidapi: build('rapidapi'), own: build('own') };
}

export function onewaySnippets(
  params: { from: string; to: string; date: string },
  host: SnippetHost = 'rapidapi'
): Snippets {
  const body = { from_airport: params.from, to_airport: params.to, departure_date: params.date, currency: 'usd' };
  const t = target('flights', '/api/google_flights/oneway/v1', host);
  return {
    curl: curlFor(t, body),
    python: pythonFor(
      t,
      body,
      `for f in sorted(r.json(), key=lambda x: x["price_as_number"]):
    print(f["price"], f["price_range_in_relation_to_other_periods"], f["airline"], f["buy_link"])`
    ),
    node: nodeFor(
      t,
      body,
      `const flights = await res.json();
console.log(res.headers.get("x-search-status")); // ok | empty | partial | degraded
for (const f of flights) console.log(f.price, f.price_range_in_relation_to_other_periods, f.buy_link);`
    ),
  };
}

export function roundtripSnippets(
  params: { from: string; to: string; date: string; returnDate: string },
  host: SnippetHost = 'rapidapi'
): Snippets {
  const body = {
    from_airport: params.from,
    to_airport: params.to,
    departure_date: params.date,
    return_date: params.returnDate,
    currency: 'usd',
  };
  const t = target('flights', '/api/google_flights/roundtrip/v1', host);
  return {
    curl: curlFor(t, body),
    python: pythonFor(
      t,
      body,
      `for t in sorted(r.json(), key=lambda x: x["total_price_as_number"]):
    print(t["total_price"], t["departure_flight_airline"], "/", t["return_flight_airline"])`
    ),
    node: nodeFor(
      t,
      body,
      `const trips = await res.json();
trips.sort((a, b) => a.total_price_as_number - b.total_price_as_number);`
    ),
  };
}

export function monthScanSnippets(
  params: { from: string; to: string; month: string; days: number },
  host: SnippetHost = 'rapidapi'
): Snippets {
  const t = target('flights', '/api/google_flights/oneway/v1', host);
  const exampleBody = { from_airport: params.from, to_airport: params.to, departure_date: `${params.month}-01`, currency: 'usd' };
  return {
    curl: `# one request per date. your plan's rate limit is built for this
${curlFor(t, exampleBody)}`,
    python: `import os, requests
from concurrent.futures import ThreadPoolExecutor

${pyHeadersConst(t)}

def day(d):
    r = requests.post(
        "https://${t.host}${t.path}",
        headers=HEADERS,
        json={"from_airport": "${params.from}", "to_airport": "${params.to}",
              "departure_date": f"${params.month}-{d:02d}", "currency": "usd"},
    )
    fares = r.json()
    return (d, min((f["price_as_number"] for f in fares), default=None))

# ${params.days} dates, fired in parallel. finishes in one rate-limit burst
with ThreadPoolExecutor(max_workers=25) as ex:
    for d, price in ex.map(day, range(1, ${params.days + 1})):
        print(f"${params.month}-{d:02d}", price)`,
    node: `const days = Array.from({ length: ${params.days} }, (_, i) => i + 1);

const results = await Promise.all(
  days.map(async (d) => {
    const res = await fetch("https://${t.host}${t.path}", {
      method: "POST",
      headers: {
${t.nodeHeaders('      ')}
      },
      body: JSON.stringify({
        from_airport: "${params.from}",
        to_airport: "${params.to}",
        departure_date: \`${params.month}-\${String(d).padStart(2, "0")}\`,
        currency: "usd",
      }),
    });
    const fares = await res.json();
    return { day: d, cheapest: Math.min(...fares.map((f) => f.price_as_number)) };
  })
);`,
  };
}

/**
 * Year scan: one request per coming month, departing mid-month. The scan the
 * tool samples on our key, at full control on yours: every month, any sample
 * dates, and the verdict on each fare.
 */
export function yearScanSnippets(
  params: { from: string; to: string; months: string[] },
  host: SnippetHost = 'rapidapi'
): Snippets {
  const t = target('flights', '/api/google_flights/oneway/v1', host);
  const first = params.months[0] ?? '2026-09';
  const exampleBody = { from_airport: params.from, to_airport: params.to, departure_date: `${first}-15`, currency: 'usd' };
  const monthsJs = JSON.stringify(params.months);
  return {
    curl: `# one request per month (departing the 15th). fire them in parallel
${curlFor(t, exampleBody)}`,
    python: `import os, requests
from concurrent.futures import ThreadPoolExecutor

MONTHS = ${JSON.stringify(params.months)}
${pyHeadersConst(t)}

def month(m):
    r = requests.post(
        "https://${t.host}${t.path}",
        headers=HEADERS,
        json={"from_airport": "${params.from}", "to_airport": "${params.to}",
              "departure_date": f"{m}-15", "currency": "usd"},
    )
    fares = r.json()
    best = min(fares, key=lambda f: f["price_as_number"], default=None)
    return (m, best and best["price_as_number"], best and best["price_range_in_relation_to_other_periods"])

# ${params.months.length} months, fired in parallel. finishes in one rate-limit burst;
# add more sample dates per month for a tighter answer
with ThreadPoolExecutor(max_workers=25) as ex:
    for m, price, verdict in ex.map(month, MONTHS):
        print(m, price, verdict)`,
    node: `const months = ${monthsJs};

const results = await Promise.all(
  months.map(async (m) => {
    const res = await fetch("https://${t.host}${t.path}", {
      method: "POST",
      headers: {
${t.nodeHeaders('      ')}
      },
      body: JSON.stringify({
        from_airport: "${params.from}",
        to_airport: "${params.to}",
        departure_date: \`\${m}-15\`,
        currency: "usd",
      }),
    });
    const fares = await res.json();
    const best = fares.reduce((a, b) => (a.price_as_number <= b.price_as_number ? a : b));
    return { month: m, price: best.price_as_number, verdict: best.price_range_in_relation_to_other_periods };
  })
);`,
  };
}

export function hotelGeoSnippets(
  params: {
    hotel: string;
    area?: string;
    checkin: string;
    checkout: string;
    countries: string[];
    samples?: number;
  },
  host: SnippetHost = 'rapidapi'
): Snippets {
  const t = target('hotels', '/hotel_by_name', host);
  const samples = params.samples ?? 3;
  const base: Record<string, unknown> = {
    hotel_name: params.hotel,
    ...(params.area ? { area: params.area } : {}),
    checkin_date: params.checkin,
    checkout_date: params.checkout,
    currency: 'USD',
  };
  const a = params.countries[0] ?? 'de';
  const b = params.countries[1] ?? 'jp';
  return {
    curl: `# one request. a real check repeats it: ${samples} times per market,
# because a market's own quote moves between identical requests.
${curlFor(t, { ...base, proxy_country: a })}`,
    python: `import os, requests

${pyHeadersConst(t)}

SAMPLES = ${samples}  # one reading per market is not a comparison

ranges = {}
for country in ${JSON.stringify(params.countries)}:
    prices = []
    for _ in range(SAMPLES):
        r = requests.post(
            "https://${t.host}${t.path}",
            headers=HEADERS,
            json=${fmtJson({ ...base, proxy_country: '<country>' }, '            ').replace('"<country>"', 'country')},
        )
        hotel = r.json()
        if hotel["available"]:
            prices.append(hotel["price"])
    ranges[country] = (min(prices), max(prices)) if prices else None
    print(country, ranges[country])

# Call a gap real only when one market's whole range sits below the other's.
lo, hi = ranges["${a}"], ranges["${b}"]
if lo and hi and (lo[1] < hi[0] or hi[1] < lo[0]):
    print("gap held across every sample")
else:
    print("ranges overlap: movement, not a parity break")`,
    node: `const markets = ${JSON.stringify(params.countries)};
const SAMPLES = ${samples}; // one reading per market is not a comparison

async function quote(proxy_country) {
  const res = await fetch("https://${t.host}${t.path}", {
    method: "POST",
    headers: {
${t.nodeHeaders('    ')}
    },
    body: JSON.stringify(${fmtJson({ ...base, proxy_country: '<pc>' }, '      ').replace('"<pc>"', 'proxy_country')}),
  });
  const hotel = await res.json();
  return hotel.available ? hotel.price : null;
}

const ranges = {};
for (const market of markets) {
  const prices = [];
  for (let i = 0; i < SAMPLES; i++) prices.push(await quote(market));
  const seen = prices.filter((p) => p != null);
  ranges[market] = seen.length ? [Math.min(...seen), Math.max(...seen)] : null;
}

// Call a gap real only when one market's whole range sits below the other's.
const [x, y] = markets.map((m) => ranges[m]);
const gap = x && y && (x[1] < y[0] || y[1] < x[0]);
console.log(ranges, gap ? "gap held across every sample" : "ranges overlap: movement, not a parity break");`,
  };
}

export function hotelSearchSnippets(
  params: { destination: string; checkin: string; checkout: string },
  host: SnippetHost = 'rapidapi'
): Snippets {
  const body = {
    destination: params.destination,
    checkin_date: params.checkin,
    checkout_date: params.checkout,
    adults: 2,
    currency: 'USD',
  };
  const t = target('hotels', '/search', host);
  return {
    curl: curlFor(t, body),
    python: pythonFor(
      t,
      body,
      `for p in r.json()["properties"]:
    print(p["price_string"], p["review_score"], p["name"])`
    ),
    node: nodeFor(t, body, `const { properties } = await res.json();`),
  };
}

export function dealHuntSnippets(
  params: { from: string; dests: string[]; dates: string[] },
  host: SnippetHost = 'rapidapi'
): Snippets {
  const t = target('flights', '/api/google_flights/oneway/v1', host);
  const exampleBody = {
    from_airport: params.from,
    to_airport: params.dests[0] ?? 'ATH',
    departure_date: params.dates[0] ?? '2027-01-01',
    currency: 'usd',
  };
  const n = params.dests.length * params.dates.length;
  return {
    curl: `# ${n} requests: one per (destination, date). Your rate limit is built for the burst.
${curlFor(t, exampleBody)}`,
    python: `import os, requests
from concurrent.futures import ThreadPoolExecutor
from itertools import product

${pyHeadersConst(t)}
DESTS = ${JSON.stringify(params.dests)}
DATES = ${JSON.stringify(params.dates)}

def search(pair):
    dest, date = pair
    r = requests.post(
        "https://${t.host}${t.path}",
        headers=HEADERS,
        json={"from_airport": "${params.from}", "to_airport": dest,
              "departure_date": date, "currency": "usd"},
    )
    fares = r.json()
    best = min(fares, key=lambda f: f["price_as_number"], default=None)
    return dest, date, best

# ${n} searches, one parallel burst
with ThreadPoolExecutor(max_workers=25) as ex:
    for dest, date, best in ex.map(search, product(DESTS, DATES)):
        if best:
            print(dest, date, best["price"],
                  best["price_range_in_relation_to_other_periods"], best["buy_link"])`,
    node: `const dests = ${JSON.stringify(params.dests)};
const dates = ${JSON.stringify(params.dates)};

const results = await Promise.all(
  dests.flatMap((dest) =>
    dates.map(async (date) => {
      const res = await fetch("https://${t.host}${t.path}", {
        method: "POST",
        headers: {
${t.nodeHeaders('        ')}
        },
        body: JSON.stringify({ from_airport: "${params.from}", to_airport: dest, departure_date: date, currency: "usd" }),
      });
      const fares = await res.json();
      const best = fares.sort((a, b) => a.price_as_number - b.price_as_number)[0];
      return { dest, date, best };
    })
  )
);`,
  };
}
