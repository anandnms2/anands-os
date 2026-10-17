#!/usr/bin/env bash
# Builds every app in HeyPuter/everything as a static site under <out>/apps/<slug>/,
# then adapts each one to run against the local Puter shim (no puter.com).
#   suite/build.sh [upstream-dir] [out-dir]
# Env: UPSTREAM_REF (git ref, pinned by default), ONLY="chess notes" (subset)
set -uo pipefail
export npm_config_fetch_retries=5 npm_config_fetch_retry_mintimeout=4000 npm_config_fetch_retry_maxtimeout=60000
HERE="$(cd "$(dirname "$0")" && pwd)"
UPSTREAM_REF="${UPSTREAM_REF:-e4b187b39ef1b7094948bf1794c1a5de66e27a80}"
UP="${1:-$HERE/.upstream}"
OUT="${2:-$HERE/dist}"

if [ ! -d "$UP/src" ]; then
  git clone https://github.com/HeyPuter/everything.git "$UP"
  git -C "$UP" checkout "$UPSTREAM_REF"
fi

rm -rf "$OUT"; mkdir -p "$OUT/apps" "$OUT/_icons"
python3 "$HERE/tools/gen-registry.py" "$UP" "$OUT/apps.json"

ok=(); failed=()
build_app() {
  local slug="$1" dir="$UP/src/$1"
  echo "=== $slug"
  if (cd "$dir" && { npm ci --no-audit --no-fund --loglevel=error || { sleep 5; npm ci --no-audit --no-fund --loglevel=error; } || { sleep 15; npm ci --no-audit --no-fund --loglevel=error; }; } \
        && npm run build -- --base=./ --outDir "$OUT/apps/$slug" --emptyOutDir); then
    rm -rf "$dir/node_modules"; return 0
  fi
  rm -rf "$OUT/apps/$slug" "$dir/node_modules"; return 1
}
for slug in $(python3 -c "import json;print(' '.join(a['slug'] for a in json.load(open('$OUT/apps.json')) if a['hasSource']))"); do
  [ "$slug" = "assets" ] && continue   # upstream landing page, not an app
  if [ -n "${ONLY:-}" ] && ! [[ " $ONLY " == *" $slug "* ]]; then continue; fi
  if build_app "$slug"; then ok+=("$slug"); else failed+=("$slug"); fi
done
# A failed app is usually a network hiccup, not a real error: try each one again, up to three more times, so it does not show as "Soon".
for pass in 1 2 3; do
  [ ${#failed[@]} -eq 0 ] && break
  echo "--- retry pass $pass: ${failed[*]}"; sleep 30
  again=(); for slug in "${failed[@]}"; do if build_app "$slug"; then ok+=("$slug"); else again+=("$slug"); fi; done
  failed=("${again[@]}")
done

for icon in "$UP"/src/*/icon-128.png; do
  s="$(basename "$(dirname "$icon")")"
  python3 -c "import json,sys;sys.exit(0 if '$s' in [a['slug'] for a in json.load(open('$OUT/apps.json'))] else 1)" || continue
  cp "$icon" "$OUT/_icons/$s.png"
done

python3 "$HERE/tools/postprocess.py" "$OUT/apps"
cp "$UP/LICENSE" "$OUT/UPSTREAM-LICENSE-MIT.txt" 2>/dev/null || true
python3 - "$OUT" "${ok[*]}" "${failed[*]}" "$UPSTREAM_REF" <<'PY'
import json,sys
out,ok,failed,ref=sys.argv[1:5]
json.dump({"upstream":ref,"built":ok.split(),"failed":failed.split()},open(f"{out}/build-report.json","w"),indent=2)
apps=json.load(open(f"{out}/apps.json"))
built=set(ok.split())
for a in apps:
    # an app that did not build (or was skipped) must not be launchable
    if a["slug"] not in built: a["hasSource"]=False
    if a["slug"]=="meetings": a["name"]="Anands Meeting"
json.dump(apps,open(f"{out}/apps.json","w"),indent=2)
print("built",len(built),"failed",failed.split() or "none")
PY
# One flaky app must not sink the image; fail only if most of the suite is missing.
[ ${#ok[@]} -ge "${MIN_BUILT:-40}" ] || { echo "only ${#ok[@]} apps built"; exit 1; }
