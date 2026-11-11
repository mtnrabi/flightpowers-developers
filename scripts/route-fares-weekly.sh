#!/usr/bin/env bash
# Weekly refresh of the /flights/<from>-to-<to> data (2026-11-11).
# Runs IN PLACE in a clone the caller already reset to origin/main (the VM cron wrapper keeps a persistent clone
# under ~/.cache/route-fares and holds the lock; this script never clones, resets or deletes the repo it runs from).
#   fetch (12 dates x 100 routes = 1,200 searches) -> build -> tests -> next build ->
#   pass: commit ONLY src/data/routes/fares/*.json straight to main and push (data-only; the git-linked
#         Vercel project deploys main);
#   fail: the same data commit goes to a branch agent/route-fares-<date> and a PR is opened instead.
# SOURCE: rest (needs RAPIDAPI_KEY), claude-mcp (the claude.ai FlightPowers Flights connector through `claude -p`),
#   or auto (default): rest when RAPIDAPI_KEY is set, else claude-mcp.
# Env: RAW_DIR (raw answers, default <repo>/../raw), ROUTE_FARES_CWD (claude -p cwd, default <repo>/../cwd),
#   BUILD_WRAP (optional prefix for `npm run build`, e.g. a resource-bounding wrapper), DRY_RUN=1 (no commit/push/PR).
# Usage: bash scripts/route-fares-weekly.sh            (from anywhere; works on the repo the script sits in)
# Marker for the cron wrapper: ROUTE_FARES_INPLACE=1
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"
DAY="$(date -u +%Y-%m-%d)"
SOURCE="${SOURCE:-auto}"
if [ "$SOURCE" = auto ]; then if [ -n "${RAPIDAPI_KEY:-}" ]; then SOURCE=rest; else SOURCE=claude-mcp; fi; fi
RAW="${RAW_DIR:-$REPO/../raw}"; CWD_DIR="${ROUTE_FARES_CWD:-$REPO/../cwd}"
rm -rf "$RAW"; mkdir -p "$RAW" "$CWD_DIR"
echo "route-fares: source=$SOURCE day=$DAY head=$(git rev-parse --short HEAD)"

npm ci --no-audit --no-fund >/dev/null
ROUTE_FARES_CWD="$CWD_DIR" node scripts/route-fares.mjs fetch --source "$SOURCE" --out "$RAW" --step 14 --horizon 168 --max-searches 1500
node scripts/route-fares.mjs build --raw "$RAW"

git add -- src/data/routes/fares
if git diff --cached --quiet; then echo "route-fares: no change"; exit 0; fi
CHANGED="$(git diff --cached --name-only | wc -l)"

ok=1; why=""
LOGS="$REPO/.."
npm test >"$LOGS/last-test.log" 2>&1 || { ok=0; why="tests failed (last-test.log)"; }
if [ "$ok" = 1 ]; then ${BUILD_WRAP:-} npm run build >"$LOGS/last-build.log" 2>&1 || { ok=0; why="next build failed (last-build.log)"; }; fi

GIT=(git -c user.name="Matan Rabi" -c user.email="46162004+mtnrabi@users.noreply.github.com")
MSG="route pages: weekly fare refresh $DAY ($CHANGED route files, source $SOURCE)"
if [ "${DRY_RUN:-0}" = 1 ]; then echo "route-fares: DRY_RUN, would commit $CHANGED files (ok=$ok $why)"; git reset -q; exit 0; fi

if [ "$ok" = 1 ]; then
  # pathspec commit: only the fares files, whatever else the build touched
  "${GIT[@]}" commit -q -m "$MSG" -- src/data/routes/fares
  # main may have moved during the long fetch: replay the data commit on top (never a force push)
  git fetch -q origin main
  if "${GIT[@]}" rebase -q origin/main && git push -q origin HEAD:main; then
    echo "route-fares: pushed $(git rev-parse --short HEAD) to main ($CHANGED files)"; exit 0
  fi
  git rebase --abort 2>/dev/null || true
  ok=0; why="could not replay or push the data commit on the current main"
fi
if [ "$ok" = 0 ]; then
  BR="agent/route-fares-$DAY"
  git checkout -q -B "$BR"
  # the push-to-main path may already have made the commit (HEAD is it then); otherwise make it here
  git diff --cached --quiet -- src/data/routes/fares || "${GIT[@]}" commit -q -m "$MSG" -- src/data/routes/fares
  git push -q origin "$BR"
  gh pr create -R mtnrabi/flightpowers-developers --head "$BR" --title "Route pages: weekly fare refresh $DAY" \
    --body "Data-only refresh of src/data/routes/fares (scripts/route-fares.mjs, source $SOURCE). Not pushed to main because: $why. Check the run log on the VM (~/.cache/route-fares/cron.log)."
  echo "route-fares: $why, opened a PR from $BR"
  exit 3
fi
