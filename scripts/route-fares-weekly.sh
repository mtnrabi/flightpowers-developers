#!/usr/bin/env bash
# Weekly refresh of the /flights/<from>-to-<to> data (proposal, 2026-11-11).
# Fresh clone -> fetch (12 dates x 100 routes = 1,200 searches) -> build -> tests -> a PR with the
# fares files only. Merging the PR deploys (the Vercel project is git-linked).
#   SOURCE=rest        needs RAPIDAPI_KEY in the environment (preferred: no model tokens).
#   SOURCE=claude-mcp  drives the claude.ai FlightPowers Flights connector through `claude -p`.
# Usage: SOURCE=rest bash scripts/route-fares-weekly.sh <workdir>
set -euo pipefail
WORK="${1:?workdir}"; SOURCE="${SOURCE:-rest}"
DAY="$(date -u +%Y-%m-%d)"
rm -rf "$WORK/repo" "$WORK/raw"; mkdir -p "$WORK/cwd"
git clone -q https://github.com/mtnrabi/flightpowers-developers.git "$WORK/repo"
cd "$WORK/repo"
npm ci --no-audit --no-fund >/dev/null
ROUTE_FARES_CWD="$WORK/cwd" node scripts/route-fares.mjs fetch --source "$SOURCE" --out "$WORK/raw" --step 14 --horizon 168 --max-searches 1500
node scripts/route-fares.mjs build --raw "$WORK/raw"
node --experimental-strip-types --test scripts/route-fares.test.mjs >/dev/null
git checkout -q -b "agent/route-fares-$DAY"
git add src/data/routes/fares
git diff --cached --quiet && { echo "no change"; exit 0; }
git commit -q -m "route pages: weekly fare refresh $DAY"
git push -q origin "agent/route-fares-$DAY"
gh pr create -R mtnrabi/flightpowers-developers --head "agent/route-fares-$DAY" --title "Route pages: weekly fare refresh $DAY" \
  --body "Data-only refresh of src/data/routes/fares (scripts/route-fares.mjs, source $SOURCE)."
