/**
 * Code-snippet builders for the ApiUpsellCard — the exact request that
 * reproduces what the visitor is looking at, against the RapidAPI host they
 * would actually subscribe to. Key always shown as $RAPIDAPI_KEY / env var.
 * Isomorphic: used by server pages and client components alike.
 */

export type Snippets = { curl: string; python: string; node: string };

const FLIGHTS_HOST = 'google-flights-live-api.p.rapidapi.com';
const HOTELS_HOST = 'booking-live-api.p.rapidapi.com';

function fmtJson(body: Record<string, unknown>, indent: string): string {
  const inner = Object.entries(body)
    .map(([k, v]) => `${indent}  ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(',\n');
  return `{\n${inner}\n${indent}}`;
}

function curlFor(host: string, path: string, body: Record<string, unknown>): string {
  return `curl -X POST "https://${host}${path}" \\
  -H "Content-Type: application/json" \\
  -H "x-rapidapi-host: ${host}" \\
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \\
  -d '${JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')}'`;
}

function pythonFor(host: string, path: string, body: Record<string, unknown>, tail: string): string {
  return `import os, requests

r = requests.post(
    "https://${host}${path}",
    headers={
        "Content-Type": "application/json",
        "x-rapidapi-host": "${host}",
        "x-rapidapi-key": os.environ["RAPIDAPI_KEY"],
    },
    json=${fmtJson(body, '    ')},
)
${tail}`;
}

function nodeFor(host: string, path: string, body: Record<string, unknown>, tail: string): string {
  return `const res = await fetch("https://${host}${path}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-rapidapi-host": "${host}",
    "x-rapidapi-key": process.env.RAPIDAPI_KEY,
  },
  body: JSON.stringify(${fmtJson(body, '  ')}),
});
${tail}`;
}

export function onewaySnippets(params: { from: string; to: string; date: string }): Snippets {
  const body = { from_airport: params.from, to_airport: params.to, departure_date: params.date, currency: 'usd' };
  const path = '/api/google_flights/oneway/v1';
  return {
    curl: curlFor(FLIGHTS_HOST, path, body),
    python: pythonFor(
      FLIGHTS_HOST,
      path,
      body,
      `for f in sorted(r.json(), key=lambda x: x["price_as_number"]):
    print(f["price"], f["price_range_in_relation_to_other_periods"], f["airline"], f["buy_link"])`
    ),
    node: nodeFor(
      FLIGHTS_HOST,
      path,
      body,
      `const flights = await res.json();
console.log(res.headers.get("x-search-status")); // ok | empty | partial | degraded
for (const f of flights) console.log(f.price, f.price_range_in_relation_to_other_periods, f.buy_link);`
    ),
  };
}

export function roundtripSnippets(params: { from: string; to: string; date: string; returnDate: string }): Snippets {
  const body = {
    from_airport: params.from,
    to_airport: params.to,
    departure_date: params.date,
    return_date: params.returnDate,
    currency: 'usd',
  };
  const path = '/api/google_flights/roundtrip/v1';
  return {
    curl: curlFor(FLIGHTS_HOST, path, body),
    python: pythonFor(
      FLIGHTS_HOST,
      path,
      body,
      `for t in sorted(r.json(), key=lambda x: x["total_price_as_number"]):
    print(t["total_price"], t["departure_flight_airline"], "/", t["return_flight_airline"])`
    ),
    node: nodeFor(
      FLIGHTS_HOST,
      path,
      body,
      `const trips = await res.json();
trips.sort((a, b) => a.total_price_as_number - b.total_price_as_number);`
    ),
  };
}

export function monthScanSnippets(params: { from: string; to: string; month: string; days: number }): Snippets {
  const path = '/api/google_flights/oneway/v1';
  const exampleBody = { from_airport: params.from, to_airport: params.to, departure_date: `${params.month}-01`, currency: 'usd' };
  return {
    curl: `# one request per date. your plan's rate limit is built for this
${curlFor(FLIGHTS_HOST, path, exampleBody)}`,
    python: `import os, requests
from concurrent.futures import ThreadPoolExecutor

HEADERS = {
    "Content-Type": "application/json",
    "x-rapidapi-host": "${FLIGHTS_HOST}",
    "x-rapidapi-key": os.environ["RAPIDAPI_KEY"],
}

def day(d):
    r = requests.post(
        "https://${FLIGHTS_HOST}${path}",
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
    const res = await fetch("https://${FLIGHTS_HOST}${path}", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "${FLIGHTS_HOST}",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
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
export function yearScanSnippets(params: { from: string; to: string; months: string[] }): Snippets {
  const path = '/api/google_flights/oneway/v1';
  const first = params.months[0] ?? '2026-09';
  const exampleBody = { from_airport: params.from, to_airport: params.to, departure_date: `${first}-15`, currency: 'usd' };
  const monthsJs = JSON.stringify(params.months);
  return {
    curl: `# one request per month (departing the 15th). fire them in parallel
${curlFor(FLIGHTS_HOST, path, exampleBody)}`,
    python: `import os, requests
from concurrent.futures import ThreadPoolExecutor

MONTHS = ${JSON.stringify(params.months)}
HEADERS = {
    "Content-Type": "application/json",
    "x-rapidapi-host": "${FLIGHTS_HOST}",
    "x-rapidapi-key": os.environ["RAPIDAPI_KEY"],
}

def month(m):
    r = requests.post(
        "https://${FLIGHTS_HOST}${path}",
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
    const res = await fetch("https://${FLIGHTS_HOST}${path}", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "${FLIGHTS_HOST}",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
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

export function hotelGeoSnippets(params: { hotel: string; area?: string; checkin: string; checkout: string; countries: string[] }): Snippets {
  const path = '/hotel_by_name';
  const base: Record<string, unknown> = {
    hotel_name: params.hotel,
    ...(params.area ? { area: params.area } : {}),
    checkin_date: params.checkin,
    checkout_date: params.checkout,
    currency: 'USD',
  };
  return {
    curl: `# one request per market. vary proxy_country
${curlFor(HOTELS_HOST, path, { ...base, proxy_country: params.countries[0] ?? 'us' })}`,
    python: `import os, requests

HEADERS = {
    "Content-Type": "application/json",
    "x-rapidapi-host": "${HOTELS_HOST}",
    "x-rapidapi-key": os.environ["RAPIDAPI_KEY"],
}

for country in ${JSON.stringify(params.countries)}:
    r = requests.post(
        "https://${HOTELS_HOST}${path}",
        headers=HEADERS,
        json=${fmtJson({ ...base, proxy_country: '<country>' }, '        ').replace('"<country>"', 'country')},
    )
    hotel = r.json()
    print(country, hotel["price_string"] if hotel["available"] else "sold out")`,
    node: `const markets = ${JSON.stringify(params.countries)};

const quotes = await Promise.all(
  markets.map(async (proxy_country) => {
    const res = await fetch("https://${HOTELS_HOST}${path}", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "${HOTELS_HOST}",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      },
      body: JSON.stringify(${fmtJson({ ...base, proxy_country: '<pc>' }, '      ').replace('"<pc>"', 'proxy_country')}),
    });
    const hotel = await res.json();
    return { market: proxy_country, price: hotel.available ? hotel.price_string : "sold out" };
  })
);`,
  };
}

export function hotelSearchSnippets(params: { destination: string; checkin: string; checkout: string }): Snippets {
  const body = {
    destination: params.destination,
    checkin_date: params.checkin,
    checkout_date: params.checkout,
    adults: 2,
    currency: 'USD',
  };
  const path = '/search';
  return {
    curl: curlFor(HOTELS_HOST, path, body),
    python: pythonFor(
      HOTELS_HOST,
      path,
      body,
      `for p in r.json()["properties"]:
    print(p["price_string"], p["review_score"], p["name"])`
    ),
    node: nodeFor(HOTELS_HOST, path, body, `const { properties } = await res.json();`),
  };
}

export function dealHuntSnippets(params: { from: string; dests: string[]; dates: string[] }): Snippets {
  const path = '/api/google_flights/oneway/v1';
  const exampleBody = { from_airport: params.from, to_airport: params.dests[0] ?? 'ATH', departure_date: params.dates[0] ?? '2027-01-01', currency: 'usd' };
  const n = params.dests.length * params.dates.length;
  return {
    curl: `# ${n} requests: one per (destination, date). Your rate limit is built for the burst.
${curlFor(FLIGHTS_HOST, path, exampleBody)}`,
    python: `import os, requests
from concurrent.futures import ThreadPoolExecutor
from itertools import product

HEADERS = {
    "Content-Type": "application/json",
    "x-rapidapi-host": "${FLIGHTS_HOST}",
    "x-rapidapi-key": os.environ["RAPIDAPI_KEY"],
}
DESTS = ${JSON.stringify(params.dests)}
DATES = ${JSON.stringify(params.dates)}

def search(pair):
    dest, date = pair
    r = requests.post(
        "https://${FLIGHTS_HOST}${path}",
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
      const res = await fetch("https://${FLIGHTS_HOST}${path}", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "${FLIGHTS_HOST}",
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
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
