/**
 * The free-tool grid: {tool type} x {route or city}.
 *
 * Two axes, both taken from published demand rankings rather than from whatever
 * was convenient to type:
 *
 *  - ROUTES: every city pair in the two global tables of
 *    https://en.wikipedia.org/wiki/List_of_busiest_passenger_air_routes
 *    (retrieved 2026-09-02) — "By available seats" (2025) and the busiest
 *    international routes (2025). Direction is the direction printed in the
 *    source table. Four rows of the international table are deliberately not
 *    generated (see REFUSED below).
 *  - CITIES: ranks 1 to 30, in order and with no exclusions, of the Euromonitor
 *    column on https://en.wikipedia.org/wiki/List_of_cities_by_international_visitors
 *    (retrieved 2026-09-02).
 *
 * Airport facts — name, city, country, coordinates, time zone — come from the
 * mwgg/Airports dataset (OurAirports-derived), retrieved 2026-09-02. Distances
 * are great-circle, computed here from those coordinates; where the Wikipedia
 * table also prints a distance the two agree to within about 1% (e.g. CJU-GMP
 * 451 km computed against 449 km printed, SYD-MEL 705 against 705).
 *
 * NOTHING in this file is an estimate, a traffic figure we invented, or a price.
 * The visitor-arrival and passenger numbers behind the rankings are not
 * republished on the site; they are only used to decide which pages exist.
 *
 * REFUSED, and why:
 *  - Moscow Domodedovo–Simferopol, Moscow Sheremetyevo–Simferopol and
 *    Antalya–Moscow Sheremetyevo (international rows 18, 20, 25) and
 *    Tehran–Istanbul (row 21). Google Flights does not sell these, so the tool
 *    on the page would return nothing. A page whose tool cannot answer is a
 *    doorway.
 *  - The full airport cross-product. 52 airports would make 1,326 pairs; all
 *    but the 47 below are pairs nobody flies and nobody searches for.
 */

export type Airport = {
  iata: string;
  name: string;
  city: string;
  country: string;
  countryName: string;
  lat: number;
  lon: number;
  tz: string;
};

export const AIRPORTS: Record<string, Airport> = {
  BAH: { iata: 'BAH', name: "Bahrain International Airport", city: "Manama", country: 'BH', countryName: "Bahrain", lat: 26.2708, lon: 50.6336, tz: 'Asia/Bahrain' },
  BKK: { iata: 'BKK', name: "Suvarnabhumi Airport", city: "Bangkok", country: 'TH', countryName: "Thailand", lat: 13.6811, lon: 100.7470, tz: 'Asia/Bangkok' },
  BOG: { iata: 'BOG', name: "El Dorado International Airport", city: "Bogota", country: 'CO', countryName: "Colombia", lat: 4.7016, lon: -74.1469, tz: 'America/Bogota' },
  BOM: { iata: 'BOM', name: "Chhatrapati Shivaji International Airport", city: "Mumbai", country: 'IN', countryName: "India", lat: 19.0887, lon: 72.8679, tz: 'Asia/Kolkata' },
  CAI: { iata: 'CAI', name: "Cairo International Airport", city: "Cairo", country: 'EG', countryName: "Egypt", lat: 30.1219, lon: 31.4056, tz: 'Africa/Cairo' },
  CAN: { iata: 'CAN', name: "Guangzhou Baiyun International Airport", city: "Guangzhou", country: 'CN', countryName: "China", lat: 23.3924, lon: 113.2990, tz: 'Asia/Shanghai' },
  CGK: { iata: 'CGK', name: "Soekarno-Hatta International Airport", city: "Jakarta", country: 'ID', countryName: "Indonesia", lat: -6.1256, lon: 106.6560, tz: 'Asia/Jakarta' },
  CJU: { iata: 'CJU', name: "Jeju International Airport", city: "Jeju", country: 'KR', countryName: "South Korea", lat: 33.5113, lon: 126.4930, tz: 'Asia/Seoul' },
  CPT: { iata: 'CPT', name: "Cape Town International Airport", city: "Cape Town", country: 'ZA', countryName: "South Africa", lat: -33.9648, lon: 18.6017, tz: 'Africa/Johannesburg' },
  CTS: { iata: 'CTS', name: "New Chitose Airport", city: "Sapporo", country: 'JP', countryName: "Japan", lat: 42.7752, lon: 141.6920, tz: 'Asia/Tokyo' },
  CTU: { iata: 'CTU', name: "Chengdu Shuangliu International Airport", city: "Chengdu", country: 'CN', countryName: "China", lat: 30.5785, lon: 103.9470, tz: 'Asia/Shanghai' },
  CUN: { iata: 'CUN', name: "Cancun International Airport", city: "Cancun", country: 'MX', countryName: "Mexico", lat: 21.0365, lon: -86.8771, tz: 'America/Cancun' },
  DEL: { iata: 'DEL', name: "Indira Gandhi International Airport", city: "Delhi", country: 'IN', countryName: "India", lat: 28.5665, lon: 77.1031, tz: 'Asia/Kolkata' },
  DFW: { iata: 'DFW', name: "Dallas Fort Worth International Airport", city: "Dallas Fort Worth", country: 'US', countryName: "United States", lat: 32.8968, lon: -97.0380, tz: 'America/Chicago' },
  DPS: { iata: 'DPS', name: "Ngurah Rai (Bali) International Airport", city: "Denpasar", country: 'ID', countryName: "Indonesia", lat: -8.7482, lon: 115.1670, tz: 'Asia/Makassar' },
  DXB: { iata: 'DXB', name: "Dubai International Airport", city: "Dubai", country: 'AE', countryName: "United Arab Emirates", lat: 25.2528, lon: 55.3644, tz: 'Asia/Dubai' },
  FUK: { iata: 'FUK', name: "Fukuoka Airport", city: "Fukuoka", country: 'JP', countryName: "Japan", lat: 33.5859, lon: 130.4510, tz: 'Asia/Tokyo' },
  GMP: { iata: 'GMP', name: "Gimpo International Airport", city: "Seoul", country: 'KR', countryName: "South Korea", lat: 37.5583, lon: 126.7910, tz: 'Asia/Seoul' },
  HAN: { iata: 'HAN', name: "Noi Bai International Airport", city: "Hanoi", country: 'VN', countryName: "Vietnam", lat: 21.2212, lon: 105.8070, tz: 'Asia/Bangkok' },
  HKG: { iata: 'HKG', name: "Chek Lap Kok International Airport", city: "Hong Kong", country: 'HK', countryName: "Hong Kong", lat: 22.3089, lon: 113.9150, tz: 'Asia/Hong_Kong' },
  HND: { iata: 'HND', name: "Tokyo International Airport", city: "Tokyo", country: 'JP', countryName: "Japan", lat: 35.5523, lon: 139.7800, tz: 'Asia/Tokyo' },
  IAH: { iata: 'IAH', name: "George Bush Intercontinental Houston Airport", city: "Houston", country: 'US', countryName: "United States", lat: 29.9844, lon: -95.3414, tz: 'America/Chicago' },
  ICN: { iata: 'ICN', name: "Incheon International Airport", city: "Seoul", country: 'KR', countryName: "South Korea", lat: 37.4691, lon: 126.4510, tz: 'Asia/Seoul' },
  IST: { iata: 'IST', name: "Istanbul Airport", city: "Istanbul", country: 'TR', countryName: "Turkey", lat: 41.2622, lon: 28.7278, tz: 'Europe/Istanbul' },
  ITM: { iata: 'ITM', name: "Osaka International Airport", city: "Osaka", country: 'JP', countryName: "Japan", lat: 34.7855, lon: 135.4380, tz: 'Asia/Tokyo' },
  JED: { iata: 'JED', name: "King Abdulaziz International Airport", city: "Jeddah", country: 'SA', countryName: "Saudi Arabia", lat: 21.6796, lon: 39.1565, tz: 'Asia/Riyadh' },
  JFK: { iata: 'JFK', name: "John F Kennedy International Airport", city: "New York", country: 'US', countryName: "United States", lat: 40.6398, lon: -73.7789, tz: 'America/New_York' },
  JNB: { iata: 'JNB', name: "O. R. Tambo International Airport", city: "Johannesburg", country: 'ZA', countryName: "South Africa", lat: -26.1333, lon: 28.2500, tz: 'Africa/Johannesburg' },
  KIX: { iata: 'KIX', name: "Kansai International Airport", city: "Osaka", country: 'JP', countryName: "Japan", lat: 34.4273, lon: 135.2440, tz: 'Asia/Tokyo' },
  KNO: { iata: 'KNO', name: "Polonia International Airport", city: "Medan", country: 'ID', countryName: "Indonesia", lat: 3.6378, lon: 98.8706, tz: 'Asia/Jakarta' },
  KUL: { iata: 'KUL', name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: 'MY', countryName: "Malaysia", lat: 2.7456, lon: 101.7100, tz: 'Asia/Kuala_Lumpur' },
  LHR: { iata: 'LHR', name: "London Heathrow Airport", city: "London", country: 'GB', countryName: "United Kingdom", lat: 51.4706, lon: -0.4619, tz: 'Europe/London' },
  MCO: { iata: 'MCO', name: "Orlando International Airport", city: "Orlando", country: 'US', countryName: "United States", lat: 28.4294, lon: -81.3090, tz: 'America/New_York' },
  MDE: { iata: 'MDE', name: "Jose Maria Cordova International Airport", city: "Medellin", country: 'CO', countryName: "Colombia", lat: 6.1645, lon: -75.4231, tz: 'America/Bogota' },
  MEL: { iata: 'MEL', name: "Melbourne International Airport", city: "Melbourne", country: 'AU', countryName: "Australia", lat: -37.6733, lon: 144.8430, tz: 'Australia/Melbourne' },
  MEX: { iata: 'MEX', name: "Licenciado Benito Juarez International Airport", city: "Mexico City", country: 'MX', countryName: "Mexico", lat: 19.4363, lon: -99.0721, tz: 'America/Mexico_City' },
  MLE: { iata: 'MLE', name: "Male International Airport", city: "Male", country: 'MV', countryName: "Maldives", lat: 4.1918, lon: 73.5291, tz: 'Indian/Maldives' },
  NRT: { iata: 'NRT', name: "Narita International Airport", city: "Tokyo", country: 'JP', countryName: "Japan", lat: 35.7647, lon: 140.3860, tz: 'Asia/Tokyo' },
  OKA: { iata: 'OKA', name: "Naha Airport", city: "Naha", country: 'JP', countryName: "Japan", lat: 26.1958, lon: 127.6460, tz: 'Asia/Tokyo' },
  PEK: { iata: 'PEK', name: "Beijing Capital International Airport", city: "Beijing", country: 'CN', countryName: "China", lat: 40.0801, lon: 116.5850, tz: 'Asia/Shanghai' },
  PUS: { iata: 'PUS', name: "Gimhae International Airport", city: "Busan", country: 'KR', countryName: "South Korea", lat: 35.1795, lon: 128.9380, tz: 'Asia/Seoul' },
  RUH: { iata: 'RUH', name: "King Khaled International Airport", city: "Riyadh", country: 'SA', countryName: "Saudi Arabia", lat: 24.9576, lon: 46.6988, tz: 'Asia/Riyadh' },
  SDQ: { iata: 'SDQ', name: "Las Americas International Airport", city: "Santo Domingo", country: 'DO', countryName: "Dominican Republic", lat: 18.4297, lon: -69.6689, tz: 'America/Santo_Domingo' },
  SGN: { iata: 'SGN', name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: 'VN', countryName: "Vietnam", lat: 10.8188, lon: 106.6520, tz: 'Asia/Ho_Chi_Minh' },
  SHA: { iata: 'SHA', name: "Shanghai Hongqiao International Airport", city: "Shanghai", country: 'CN', countryName: "China", lat: 31.1979, lon: 121.3360, tz: 'Asia/Shanghai' },
  SIN: { iata: 'SIN', name: "Singapore Changi International Airport", city: "Singapore", country: 'SG', countryName: "Singapore", lat: 1.3502, lon: 103.9940, tz: 'Asia/Singapore' },
  SJU: { iata: 'SJU', name: "Luis Munoz Marin International Airport", city: "San Juan", country: 'PR', countryName: "Puerto Rico", lat: 18.4394, lon: -66.0018, tz: 'America/Puerto_Rico' },
  STI: { iata: 'STI', name: "Cibao International Airport", city: "Santiago de los Caballeros", country: 'DO', countryName: "Dominican Republic", lat: 19.4061, lon: -70.6047, tz: 'America/Santo_Domingo' },
  SYD: { iata: 'SYD', name: "Sydney Kingsford Smith International Airport", city: "Sydney", country: 'AU', countryName: "Australia", lat: -33.9461, lon: 151.1770, tz: 'Australia/Sydney' },
  SZX: { iata: 'SZX', name: "Shenzhen Bao'an International Airport", city: "Shenzhen", country: 'CN', countryName: "China", lat: 22.6393, lon: 113.8110, tz: 'Asia/Shanghai' },
  TPE: { iata: 'TPE', name: "Taiwan Taoyuan International Airport", city: "Taipei", country: 'TW', countryName: "Taiwan", lat: 25.0777, lon: 121.2330, tz: 'Asia/Taipei' },
  UPG: { iata: 'UPG', name: "Hasanuddin International Airport", city: "Makassar", country: 'ID', countryName: "Indonesia", lat: -5.0616, lon: 119.5540, tz: 'Asia/Makassar' },
};

/** Which published table a route came from. Printed on the page. */
export type RouteSource = 'international' | 'seats';

export type GridRoute = {
  /** URL segment, e.g. `lhr-jfk`. */
  slug: string;
  from: Airport;
  to: Airport;
  source: RouteSource;
  rank: number;
  /** Great-circle distance in km, computed from the two coordinate pairs. */
  km: number;
};

const RAW_ROUTES: [string, string, RouteSource, number][] = [
  ['HKG', 'TPE', 'international', 1],
  ['CAI', 'JED', 'international', 2],
  ['KUL', 'SIN', 'international', 3],
  ['ICN', 'NRT', 'international', 4],
  ['ICN', 'KIX', 'international', 5],
  ['CGK', 'SIN', 'international', 6],
  ['DXB', 'RUH', 'international', 7],
  ['BKK', 'HKG', 'international', 8],
  ['TPE', 'NRT', 'international', 9],
  ['LHR', 'JFK', 'international', 10],
  ['BKK', 'SIN', 'international', 11],
  ['BKK', 'ICN', 'international', 12],
  ['DXB', 'LHR', 'international', 13],
  ['DXB', 'JED', 'international', 14],
  ['BOM', 'DXB', 'international', 15],
  ['CAI', 'RUH', 'international', 16],
  ['DEL', 'DXB', 'international', 17],
  ['MCO', 'SJU', 'international', 19],
  ['BAH', 'DXB', 'international', 22],
  ['CUN', 'DFW', 'international', 23],
  ['JFK', 'STI', 'international', 24],
  ['IAH', 'MEX', 'international', 26],
  ['DXB', 'IST', 'international', 27],
  ['JFK', 'SDQ', 'international', 28],
  ['DXB', 'MLE', 'international', 29],
  ['CJU', 'GMP', 'seats', 1],
  ['CTS', 'HND', 'seats', 2],
  ['FUK', 'HND', 'seats', 3],
  ['HAN', 'SGN', 'seats', 4],
  ['JED', 'RUH', 'seats', 5],
  ['SYD', 'MEL', 'seats', 6],
  ['HND', 'OKA', 'seats', 7],
  ['BOM', 'DEL', 'seats', 8],
  ['PEK', 'SHA', 'seats', 9],
  ['SHA', 'SZX', 'seats', 10],
  ['CAN', 'SHA', 'seats', 12],
  ['CGK', 'DPS', 'seats', 13],
  ['GMP', 'PUS', 'seats', 14],
  ['BOG', 'MDE', 'seats', 15],
  ['CUN', 'MEX', 'seats', 16],
  ['PEK', 'SZX', 'seats', 17],
  ['CPT', 'JNB', 'seats', 18],
  ['CGK', 'UPG', 'seats', 19],
  ['HND', 'ITM', 'seats', 20],
  ['CTU', 'PEK', 'seats', 21],
  ['CJU', 'PUS', 'seats', 22],
  ['CGK', 'KNO', 'seats', 23],
];

const EARTH_KM = 6371.0088;

/** Great-circle distance between two airports, km, rounded. */
export function distanceKm(a: Airport, b: Airport): number {
  const rad = Math.PI / 180;
  const la1 = a.lat * rad;
  const la2 = b.lat * rad;
  const dLa = (b.lat - a.lat) * rad;
  const dLo = (b.lon - a.lon) * rad;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLo / 2) ** 2;
  return Math.round(2 * EARTH_KM * Math.asin(Math.sqrt(h)));
}

export const ROUTES: GridRoute[] = RAW_ROUTES.map(([a, b, source, rank]) => {
  const from = AIRPORTS[a]!;
  const to = AIRPORTS[b]!;
  return { slug: `${a.toLowerCase()}-${b.toLowerCase()}`, from, to, source, rank, km: distanceKm(from, to) };
});

export function findRoute(slug: string): GridRoute | undefined {
  return ROUTES.find((r) => r.slug === slug);
}

/** "London (LHR) to New York (JFK)" — the code disambiguates multi-airport cities. */
export function routeLabel(r: GridRoute): string {
  return `${r.from.city} (${r.from.iata}) to ${r.to.city} (${r.to.iata})`;
}

/** "LHR → JFK" */
export function routeArrow(r: GridRoute): string {
  return `${r.from.iata} → ${r.to.iata}`;
}

/** Both airports in one country: the search is a domestic one. */
export function isDomestic(r: GridRoute): boolean {
  return r.from.country === r.to.country;
}

/** True when the two ends sit on opposite sides of the equator. */
export function crossesEquator(r: GridRoute): boolean {
  return r.from.lat * r.to.lat < 0;
}

/** Other generated routes touching either airport, nearest rank first. */
export function relatedRoutes(r: GridRoute, limit = 6): GridRoute[] {
  return ROUTES.filter(
    (o) =>
      o.slug !== r.slug &&
      (o.from.iata === r.from.iata ||
        o.to.iata === r.to.iata ||
        o.from.iata === r.to.iata ||
        o.to.iata === r.from.iata)
  ).slice(0, limit);
}

export type GridCity = {
  /** URL segment, e.g. `kuala-lumpur`. */
  slug: string;
  /** Display name. */
  name: string;
  /** Exactly what goes in the `destination` field of /v1/hotels/search. */
  destination: string;
  country: string;
  /** Rank in the Euromonitor top-100 table. */
  rank: number;
};

const RAW_CITIES: [string, string, number][] = [
  ['Hong Kong', 'Hong Kong', 1],
  ['Bangkok', 'Thailand', 2],
  ['London', 'United Kingdom', 3],
  ['Macau', 'Macau', 4],
  ['Singapore', 'Singapore', 5],
  ['Paris', 'France', 6],
  ['Dubai', 'United Arab Emirates', 7],
  ['New York', 'United States', 8],
  ['Kuala Lumpur', 'Malaysia', 9],
  ['Istanbul', 'Turkey', 10],
  ['Delhi', 'India', 11],
  ['Antalya', 'Turkey', 12],
  ['Shenzhen', 'China', 13],
  ['Mumbai', 'India', 14],
  ['Phuket', 'Thailand', 15],
  ['Rome', 'Italy', 16],
  ['Tokyo', 'Japan', 17],
  ['Pattaya', 'Thailand', 18],
  ['Taipei', 'Taiwan', 19],
  ['Mecca', 'Saudi Arabia', 20],
  ['Guangzhou', 'China', 21],
  ['Prague', 'Czech Republic', 22],
  ['Medina', 'Saudi Arabia', 23],
  ['Seoul', 'South Korea', 24],
  ['Amsterdam', 'Netherlands', 25],
  ['Agra', 'India', 26],
  ['Miami', 'United States', 27],
  ['Osaka', 'Japan', 28],
  ['Los Angeles', 'United States', 29],
  ['Shanghai', 'China', 30],
];

export const CITIES: GridCity[] = RAW_CITIES.map(([name, country, rank]) => ({
  slug: name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, ''),
  name,
  destination: name,
  country,
  rank,
}));

export function findCity(slug: string): GridCity | undefined {
  return CITIES.find((c) => c.slug === slug);
}

/**
 * Generated flight pages whose origin or destination city matches this hotel
 * city — the cross-family link that keeps flights and hotels one site.
 * Matched on the display city name, so `Seoul` finds every route through ICN
 * and GMP, and a city with no route in the grid simply gets none.
 */
export function routesForCity(city: GridCity, limit = 6): GridRoute[] {
  const target = city.name.toLowerCase();
  return ROUTES.filter((r) => r.from.city.toLowerCase() === target || r.to.city.toLowerCase() === target).slice(0, limit);
}

/** The hotel city page for a route's arrival city, when one is generated. */
export function cityForAirport(a: Airport): GridCity | undefined {
  const name = a.city.toLowerCase();
  return CITIES.find((c) => c.name.toLowerCase() === name);
}

/** The three route-axis tools, in the order they appear on /tools. */
export const ROUTE_TOOLS = [
  {
    slug: 'cheapest-time-to-fly',
    label: 'Cheapest Time to Fly',
    sub: 'Which month is cheapest, a year at a glance',
  },
  {
    slug: 'flight-price-checker',
    label: 'Flight Price Checker',
    sub: 'One date, the live fare and Google’s verdict',
  },
  {
    slug: 'round-trip-planner',
    label: 'Round-Trip Planner',
    sub: 'Out and back priced as one paired itinerary',
  },
] as const;

/** Every generated page in the grid, for the sitemap and the /tools directory. */
export function gridPaths(): string[] {
  const routePaths = ROUTE_TOOLS.flatMap((t) => ROUTES.map((r) => `/tools/${t.slug}/${r.slug}`));
  const cityPaths = CITIES.map((c) => `/tools/hotel-price-check/${c.slug}`);
  return [...routePaths, ...cityPaths];
}
