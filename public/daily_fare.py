#!/usr/bin/env python3
"""Two requests a day: the cheapest date in the window, then that trip in full."""
import csv, json, os, sys, time, urllib.error, urllib.request
from datetime import date, datetime, timedelta, timezone

FROM, TO, NIGHTS, TARGET = "LHR", "JFK", 7, 450     # your route, trip length, target in CURRENCY
STARTS_IN_DAYS, DAYS, CURRENCY = 45, 31, "USD"      # rolling window, 61 days at most
HOST = "google-flights-live-api.p.rapidapi.com"

def call(path, body):
    req = urllib.request.Request(
        f"https://{HOST}/api/google_flights/{path}/v1", method="POST",
        data=json.dumps({**body, "_fp_source": "site-docs", "_fp_tool": "daily-cron"}).encode(),
        headers={"Content-Type": "application/json", "x-rapidapi-host": HOST,
                 "x-rapidapi-key": os.environ["RAPIDAPI_KEY"]})
    for attempt in (1, 2):
        try:
            return json.load(urllib.request.urlopen(req, timeout=90))
        except urllib.error.HTTPError as e:
            if e.code < 500 or attempt == 2:          # 4xx: fix the request or the plan
                sys.exit(f"{path}: HTTP {e.code} {e.read()[:200]!r}")
        except OSError as e:
            if attempt == 2:
                sys.exit(f"{path}: {e}")
        time.sleep(5)                                 # 5xx or network: the search did not finish, one retry

first = date.today() + timedelta(days=STARTS_IN_DAYS)
month = call("cheapest_dates", {
    "from_airport": FROM, "to_airport": TO, "nights": NIGHTS, "currency": CURRENCY,
    "departure_date_from": str(first), "departure_date_to": str(first + timedelta(days=DAYS - 1))})
best = month.get("cheapest")
if not best:
    sys.exit("no priced date in the window")
trips = call("roundtrip", {
    "from_airport": FROM, "to_airport": TO, "currency": CURRENCY.lower(), "limit": 10,
    "departure_date": best["departure_date"], "return_date": best["return_date"]})
trip = min(trips, key=lambda t: t["total_price_as_number"], default={})
price, verdict = trip.get("total_price_as_number"), trip.get("price_range_in_relation_to_other_periods")
now = f"{datetime.now(timezone.utc):%Y-%m-%d %H:%M}"

with open("fares.csv", "a", newline="") as f:         # your own price history
    csv.writer(f).writerow([now, FROM, TO, best["departure_date"], best["return_date"], best["price"], price, verdict])
line = (f"{now} UTC  {FROM}-{TO} {best['departure_date']} to {best['return_date']}: calendar {best['price']:.0f}, "
        f"full search {price or 'no trip'} {CURRENCY}, Google says {verdict or 'nothing'} "
        f"(usual {trip.get('price_insights_low', '?')}-{trip.get('price_insights_high', '?')})")
print(line)
if verdict == "low" or min(best["price"], price or best["price"]) <= TARGET:
    print("DEAL", trip.get("buy_link", ""))
    if os.environ.get("SLACK_WEBHOOK_URL"):           # optional: a Slack incoming webhook
        urllib.request.urlopen(urllib.request.Request(
            os.environ["SLACK_WEBHOOK_URL"], headers={"Content-Type": "application/json"},
            data=json.dumps({"text": f"{line}\n{trip.get('buy_link', '')}"}).encode()), timeout=20)
