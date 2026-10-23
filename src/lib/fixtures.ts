/**
 * Typed access to the captured fixtures in ./fixtures/*.json.
 *
 * Every fixture is a REAL response captured from a live request to
 * api.flightpowers.com on the date stamped in the file. Nothing is invented,
 * and anything rendered from a fixture must be labelled as a captured run
 * (the UI components do this). Prices were live at capture time.
 */

import onewayTlvJfk from './fixtures/oneway-tlv-jfk.json';
import roundtripBerCdg from './fixtures/roundtrip-ber-cdg.json';
import roundtripJfkLhr from './fixtures/roundtrip-jfk-lhr.json';
import degradedExample from './fixtures/degraded-example.json';
import novscanLisJfk from './fixtures/novscan-lis-jfk.json';
import yearscanLisJfk from './fixtures/yearscan-lis-jfk.json';
import hotelGeoRixos from './fixtures/hotel-geo-rixos.json';
import hotelGeoKremlin from './fixtures/hotel-geo-kremlin.json';
import hotelGeoRepeatRome from './fixtures/hotel-geo-repeat-rome.json';
import hotelSearchLisbon from './fixtures/hotel-search-lisbon.json';
import dealHuntLgw from './fixtures/deal-hunt-lgw.json';
import onewayJfkCun from './fixtures/oneway-jfk-cun.json';
import onewayLaxSfoLow from './fixtures/oneway-lax-sfo-low.json';
import airbnbSearchRome from './fixtures/airbnb-search-rome.json';
import airbnbSearchLisbonFront from './fixtures/airbnb-search-lisbon-front.json';

export type OnewayFlight = {
  price_range_in_relation_to_other_periods: 'low' | 'typical' | 'high' | null;
  price_insights_low: number | null;
  price_insights_high: number | null;
  from_airport: string;
  to_airport: string;
  departure_date: string;
  price: string;
  price_as_number: number;
  duration: string;
  duration_seconds: number;
  buy_link: string;
  airline: string;
  stops: number;
  stops_info: { stop_airport: string; stop_duration_seconds: number }[];
  departure_description: string;
  arrival_description: string;
};

export type RoundtripItinerary = {
  price_range_in_relation_to_other_periods: 'low' | 'typical' | 'high' | null;
  price_insights_low: number | null;
  price_insights_high: number | null;
  from_airport: string;
  to_airport: string;
  departure_date: string;
  return_date: string;
  total_price: string;
  total_price_as_number: number;
  total_duration_seconds: number;
  total_stops: number;
  buy_link: string;
  departure_flight_departure_description: string;
  departure_flight_arrival_description: string;
  departure_flight_airline: string;
  departure_flight_stops: number;
  departure_flight_duration: string;
  return_flight_departure_description: string;
  return_flight_arrival_description: string;
  return_flight_airline: string;
  return_flight_stops: number;
  return_flight_duration: string;
};

/**
 * One property from /v1/hotels/search. Field names and nullability come from
 * `HotelSearchResponse` / `HotelProperty` in public/openapi.json; `location`
 * really does come back null on some searches, so nothing may assume it.
 */
export type HotelProperty = {
  name: string;
  price_string: string | null;
  price: number | null;
  review_score: number | null;
  review_count: number | null;
  room_type: string | null;
  location: string | null;
  image_url: string | null;
  link: string | null;
};

export type HotelByName = {
  name: string | null;
  available: boolean;
  price_string: string | null;
  price: number | null;
  review_score: number | null;
  review_count: number | null;
  room_type: string | null;
  image_url: string | null;
  link: string | null;
  nights: number | null;
  adults: number | null;
  children: number | null;
};

/**
 * A repeat-sampling run: for each property, every market was asked the same
 * question several times. The samples are kept as arrays on purpose, because
 * the movement inside one market is as much of a finding as the difference
 * between markets.
 */
export type GeoRepeatRun = {
  samples_per_market: number;
  markets: string[];
  properties: { name: string; quotes: Record<string, number[]> }[];
};

export type DealHuntRow = {
  dest: string;
  date: string;
  status: string;
  price: number | null;
  verdict: 'low' | 'typical' | 'high' | null;
  low: number | null;
  high: number | null;
  airline: string | null;
  stops: number | null;
  duration: string | null;
  buy_link: string | null;
};

export type ScanDay = {
  date: string;
  status: string;
  price: number | null;
  verdict: 'low' | 'typical' | 'high' | null;
  low: number | null;
  high: number | null;
  airline: string | null;
  stops: number | null;
  duration: string | null;
};

/** One month of a year scan: the cheapest fare of one real mid-month search. */
export type YearMonth = {
  month: string; // YYYY-MM
  date: string; // the sampled departure date, YYYY-MM-DD
  status: string;
  price: number | null;
  verdict: 'low' | 'typical' | 'high' | null;
  low: number | null;
  high: number | null;
  airline: string | null;
  stops: number | null;
  duration: string | null;
  buy_link: string | null;
};

/**
 * One row from the Airbnb Live API's POST /search (hotel_agent ota_lite,
 * common/schema.js PROPERTY_KEYS). Every key is on every row; a field Airbnb
 * did not publish is null.
 */
export type AirbnbRow = {
  name: string | null;
  price_string: string | null;
  price: number | null;
  review_score: number | null;
  review_count: number | null;
  room_type: string | null;
  location: string | null;
  image_url: string | null;
  link: string | null;
  nights: number | null;
  adults: number | null;
  children: number | null;
  provider: 'airbnb';
  provider_property_id: string | null;
  latitude: number | null;
  longitude: number | null;
  price_total: number | null;
  price_per_night: number | null;
  price_original_total: number | null;
  currency: string | null;
  taxes_included: boolean | null;
  rating: number | null;
  rating_scale: number | null;
  beds: number | null;
  bedrooms: number | null;
  baths: number | null;
  available: boolean;
  retrieved_at: string;
};

export type AirbnbSearch = {
  provider: 'airbnb';
  destination: string;
  checkin_date: string;
  checkout_date: string;
  filters_applied: Record<string, { value: unknown; applied_by: 'airbnb' | 'flightpowers'; post_filter: boolean }>;
  search_status: 'ok' | 'empty' | 'degraded' | 'error';
  search_reason: string;
  /** What Airbnb matched the free-text destination to (present on api.flightpowers.com captures). */
  destination_matched?: { name: string; airbnb_place_id: string; precision: string; page_title: string };
  /** Added by the capture: how many rows the full response carried before the fixture was trimmed. */
  properties_returned: number;
  properties: AirbnbRow[];
};

export type Fixture<T> = {
  captured_at: string;
  captured_from: string;
  note: string;
  request: { endpoint: string; note?: string; body: Record<string, unknown> };
  headers?: Record<string, string>;
  data: T;
};

export const FIXTURES = {
  onewayTlvJfk: onewayTlvJfk as unknown as Fixture<OnewayFlight[]>,
  roundtripBerCdg: roundtripBerCdg as unknown as Fixture<RoundtripItinerary[]>,
  roundtripJfkLhr: roundtripJfkLhr as unknown as Fixture<RoundtripItinerary[]>,
  degradedExample: degradedExample as unknown as Fixture<RoundtripItinerary[]>,
  novscanLisJfk: novscanLisJfk as unknown as Fixture<ScanDay[]>,
  yearscanLisJfk: yearscanLisJfk as unknown as Fixture<YearMonth[]>,
  hotelGeoRixos: hotelGeoRixos as unknown as Fixture<Record<'us' | 'de' | 'il', HotelByName>>,
  hotelGeoKremlin: hotelGeoKremlin as unknown as Fixture<Record<'us' | 'de' | 'il', HotelByName>>,
  hotelGeoRepeatRome: hotelGeoRepeatRome as unknown as Fixture<GeoRepeatRun>,
  dealHuntLgw: dealHuntLgw as unknown as Fixture<DealHuntRow[]>,
  onewayJfkCun: onewayJfkCun as unknown as Fixture<OnewayFlight[]>,
  onewayLaxSfoLow: onewayLaxSfoLow as unknown as Fixture<OnewayFlight[]>,
  airbnbSearchRome: airbnbSearchRome as unknown as Fixture<AirbnbSearch>,
  airbnbSearchLisbonFront: airbnbSearchLisbonFront as unknown as Fixture<AirbnbSearch>,
  hotelSearchLisbon: hotelSearchLisbon as unknown as Fixture<{
    destination: string;
    checkin_date: string;
    checkout_date: string;
    applied_filters: string[];
    budget_per_night: number | null;
    properties: {
      name: string;
      price_string: string;
      price: number;
      review_score: number;
      review_count: number;
      room_type: string;
      location: string | null;
      image_url: string | null;
      link: string;
      nights: number;
      adults: number;
      children: number | null;
    }[];
  }>,
} as const;

/** The standard honesty label rendered next to anything canned. */
export function capturedLabel(f: Fixture<unknown>): string {
  return `Captured run: real response from a live request on ${f.captured_at}`;
}
