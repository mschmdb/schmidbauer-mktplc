#!/usr/bin/env bash
# Chooses the finder and verifier models.
# Usage: pick-models.sh [--verifier-model <slug>] [--catalog <file>]
# Prints: finder=<slug or empty>, finder_source=<config|catalog|none>, verifier=<slug or empty>
# finder: top-level `model` in $CODEX_HOME/config.toml (default ~/.codex).
#         If unset, the best-ranked listed model, so finder and verifier differ.
# verifier: best-ranked listed model that is not the finder, from `codex debug models`.
# --catalog reads the model list from a file instead of calling codex.
set -u

verifier_override=""
catalog_file=""
while [ $# -gt 0 ]; do
  case "$1" in
    --verifier-model) verifier_override="${2:-}"; shift 2 ;;
    --catalog) catalog_file="${2:-}"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

config="${CODEX_HOME:-$HOME/.codex}/config.toml"

# Top-level keys only: stop at the first [table] header.
config_model=""
if [ -f "$config" ]; then
  config_model=$(awk '
    /^[[:space:]]*\[/ { exit }
    /^[[:space:]]*model[[:space:]]*=/ {
      sub(/^[^=]*=[[:space:]]*/, "")
      sub(/[[:space:]]*#.*$/, "")
      gsub(/^"|"$/, "")
      print
      exit
    }' "$config")
fi

if [ -n "$catalog_file" ]; then
  catalog_json=$(cat "$catalog_file" 2>/dev/null || true)
else
  catalog_json=$(codex debug models </dev/null 2>/dev/null || true)
fi

# Prints listed model slugs, best rank first. Empty on any parse problem.
ranked_models() {
  if command -v python3 >/dev/null 2>&1; then
    printf '%s' "$catalog_json" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
models = data if isinstance(data, list) else data.get("models", [])
listed = [m for m in models if isinstance(m, dict) and m.get("visibility") == "list" and m.get("slug")]
for m in sorted(listed, key=lambda m: m.get("priority", 99)):
    print(m["slug"])
' 2>/dev/null
  elif command -v jq >/dev/null 2>&1; then
    printf '%s' "$catalog_json" | jq -r '
      (if type == "array" then . else (.models // []) end)
      | map(select(type == "object" and .visibility == "list" and .slug != null))
      | sort_by(.priority // 99) | .[].slug' 2>/dev/null
  fi
}

ranked=$(ranked_models || true)

finder="$config_model"
finder_source="config"
if [ -z "$finder" ]; then
  finder=$(printf '%s\n' "$ranked" | sed -n '1p')
  finder_source="catalog"
  [ -z "$finder" ] && finder_source="none"
fi

if [ -n "$verifier_override" ]; then
  verifier="$verifier_override"
else
  verifier=$(printf '%s\n' "$ranked" | grep -v -x -F -- "$finder" | sed -n '1p')
fi

echo "finder=$finder"
echo "finder_source=$finder_source"
echo "verifier=$verifier"
