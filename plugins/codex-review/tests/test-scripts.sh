#!/usr/bin/env bash
# Unit tests for the helper scripts of the codex-review skill.
# Run: bash plugins/codex-review/tests/test-scripts.sh
# Needs git, and python3 or jq. Does not call the Codex service.
set -u

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS="$HERE/../skills/codex-review/scripts"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/codex-review-test.XXXXXX")"
PASS=0
FAIL=0

ok()   { PASS=$((PASS + 1)); printf 'ok   %s\n' "$1"; }
fail() { FAIL=$((FAIL + 1)); printf 'FAIL %s\n     expected: %s\n     actual:   %s\n' "$1" "$2" "$3"; }
eq()   { if [ "$2" = "$3" ]; then ok "$1"; else fail "$1" "$2" "$3"; fi; }
has()  { case "$3" in *"$2"*) ok "$1" ;; *) fail "$1" "contains '$2'" "$3" ;; esac; }
lacks(){ case "$3" in *"$2"*) fail "$1" "lacks '$2'" "$3" ;; *) ok "$1" ;; esac; }

new_repo() {
  local dir="$WORK/$1"
  mkdir -p "$dir"
  git -C "$dir" init -q -b "${2:-main}"
  git -C "$dir" config user.email test@example.com
  git -C "$dir" config user.name test
  git -C "$dir" config commit.gpgsign false
  printf '%s\n' "$dir"
}

commit_file() {
  local repo="$1" path="$2" content="$3"
  mkdir -p "$(dirname "$repo/$path")"
  printf '%s\n' "$content" > "$repo/$path"
  git -C "$repo" add "$path"
  git -C "$repo" commit -q -m "change $path"
}

# ---------------------------------------------------------------- resolve-base.sh

repo=$(new_repo base-origin-head work)
commit_file "$repo" a.txt one
main_sha=$(git -C "$repo" rev-parse HEAD)
git -C "$repo" update-ref refs/remotes/origin/trunk "$main_sha"
git -C "$repo" symbolic-ref refs/remotes/origin/HEAD refs/remotes/origin/trunk
git -C "$repo" checkout -q -b feature
commit_file "$repo" b.txt two
eq "resolve-base: uses origin/HEAD" "$main_sha" "$(cd "$repo" && bash "$SCRIPTS/resolve-base.sh")"

repo=$(new_repo base-override main)
commit_file "$repo" a.txt one
first=$(git -C "$repo" rev-parse HEAD)
git -C "$repo" branch develop
commit_file "$repo" a.txt two
git -C "$repo" checkout -q -b feature
commit_file "$repo" b.txt three
eq "resolve-base: --base overrides" "$first" "$(cd "$repo" && bash "$SCRIPTS/resolve-base.sh" --base develop)"

out=$(cd "$repo" && bash "$SCRIPTS/resolve-base.sh" --base does-not-exist 2>&1); code=$?
eq "resolve-base: unknown --base exits 2" "2" "$code"
has "resolve-base: unknown --base names the ref" "does-not-exist" "$out"

repo=$(new_repo base-fallback-main main)
commit_file "$repo" a.txt one
main_sha=$(git -C "$repo" rev-parse HEAD)
git -C "$repo" checkout -q -b feature
commit_file "$repo" b.txt two
eq "resolve-base: falls back to local main" "$main_sha" "$(cd "$repo" && bash "$SCRIPTS/resolve-base.sh")"

repo=$(new_repo base-single main)
commit_file "$repo" a.txt one
eq "resolve-base: single commit on main uses empty tree" \
  "4b825dc642cb6eb9a060e54bf8d69288fbee4904" "$(cd "$repo" && bash "$SCRIPTS/resolve-base.sh")"

repo=$(new_repo base-on-main main)
commit_file "$repo" a.txt one
first=$(git -C "$repo" rev-parse HEAD)
commit_file "$repo" a.txt two
eq "resolve-base: on default branch uses HEAD~1" "$first" "$(cd "$repo" && bash "$SCRIPTS/resolve-base.sh")"

# ---------------------------------------------------------------- collect-diff.sh

repo=$(new_repo diff-uncommitted main)
commit_file "$repo" src/app.js "const a = 1;"
printf 'const a = 2;\n' > "$repo/src/app.js"
git -C "$repo" add src/app.js
printf 'lockfile\n' > "$repo/pnpm-lock.yaml"
printf 'export const b = 3;\n' > "$repo/src/new.js"
out=$(cd "$repo" && bash "$SCRIPTS/collect-diff.sh" --uncommitted)
has "collect-diff: staged change present" "+const a = 2;" "$out"
eq  "collect-diff: staged change appears once" "1" "$(printf '%s\n' "$out" | grep -c '^+const a = 2;')"
has "collect-diff: untracked file included" "export const b = 3;" "$out"
lacks "collect-diff: lockfile excluded" "lockfile" "$out"

repo=$(new_repo diff-ignorefile main)
commit_file "$repo" keep.js "keep"
git -C "$repo" checkout -q -b feature
commit_file "$repo" gen/out.js "generated"
commit_file "$repo" keep.js "kept change"
printf '# comment\ngen/**\n\n' > "$repo/.codex-review-ignore"
base=$(git -C "$repo" rev-parse main)
out=$(cd "$repo" && bash "$SCRIPTS/collect-diff.sh" --base "$base")
has   "collect-diff: committed change present" "+kept change" "$out"
lacks "collect-diff: .codex-review-ignore honoured" "generated" "$out"

out=$(cd "$repo" && bash "$SCRIPTS/collect-diff.sh" --base "$base" --exclude 'keep.js')
lacks "collect-diff: --exclude honoured" "kept change" "$out"

out=$(cd "$repo" && bash "$SCRIPTS/collect-diff.sh" --base "$base" -- keep.js)
has   "collect-diff: path scope keeps scoped file" "kept change" "$out"

out=$(cd "$repo" && bash "$SCRIPTS/collect-diff.sh" 2>&1); code=$?
eq "collect-diff: missing mode exits 2" "2" "$code"

# ---------------------------------------------------------------- pick-models.sh

catalog="$WORK/models.json"
cat > "$catalog" <<'JSON'
{"models":[
 {"slug":"model-b","visibility":"list","priority":2},
 {"slug":"hidden","visibility":"hide","priority":0},
 {"slug":"model-a","visibility":"list","priority":1},
 {"slug":"model-c","visibility":"list","priority":3}
]}
JSON

home="$WORK/codex-home-a"; mkdir -p "$home"
printf 'model = "model-b"\nmodel_reasoning_effort = "medium"\n\n[profiles.fast]\nmodel = "model-c"\n' > "$home/config.toml"
out=$(CODEX_HOME="$home" bash "$SCRIPTS/pick-models.sh" --catalog "$catalog")
has "pick-models: finder from top-level config" "finder=model-b" "$out"
has "pick-models: verifier is best-ranked other model" "verifier=model-a" "$out"

home="$WORK/codex-home-b"; mkdir -p "$home"
printf '[profiles.fast]\nmodel = "model-c"\n' > "$home/config.toml"
out=$(CODEX_HOME="$home" bash "$SCRIPTS/pick-models.sh" --catalog "$catalog")
has "pick-models: profile model is not the finder" "finder=model-a" "$out"
has "pick-models: no config model, verifier is second" "verifier=model-b" "$out"
has "pick-models: finder pinned when config is silent" "finder_source=catalog" "$out"

home="$WORK/codex-home-c"; mkdir -p "$home"
printf 'model = "model-a"\n' > "$home/config.toml"
out=$(CODEX_HOME="$home" bash "$SCRIPTS/pick-models.sh" --catalog "$catalog" --verifier-model custom-x)
has "pick-models: --verifier-model overrides" "verifier=custom-x" "$out"

printf 'not json' > "$WORK/broken.json"
out=$(CODEX_HOME="$home" bash "$SCRIPTS/pick-models.sh" --catalog "$WORK/broken.json")
has "pick-models: broken catalog gives empty verifier" "verifier=" "$out"
has "pick-models: broken catalog keeps config finder" "finder=model-a" "$out"
eq  "pick-models: broken catalog verifier value is empty" "verifier=" "$(printf '%s\n' "$out" | grep '^verifier=')"

# Windows ships a python3 placeholder that exists but runs nothing.
if command -v jq >/dev/null 2>&1; then
  dead_python="$WORK/dead-python-bin"; mkdir -p "$dead_python"
  printf '#!/usr/bin/env bash\necho "Python was not found" >&2\nexit 9009\n' > "$dead_python/python3"
  chmod +x "$dead_python/python3"
  home="$WORK/codex-home-b"
  out=$(CODEX_HOME="$home" PATH="$dead_python:$PATH" bash "$SCRIPTS/pick-models.sh" --catalog "$catalog")
  has "pick-models: placeholder python3 falls back to jq (finder)" "finder=model-a" "$out"
  has "pick-models: placeholder python3 falls back to jq (verifier)" "verifier=model-b" "$out"
fi

# ---------------------------------------------------------------- run-codex.sh

stub="$WORK/stub-bin"; mkdir -p "$stub"
cat > "$stub/codex" <<'SH'
#!/usr/bin/env bash
printf '%s\n' "$@" > "$STUB_ARGS"
cat > "$STUB_STDIN"
SH
chmod +x "$stub/codex"
printf 'PROMPT BODY\n' > "$WORK/prompt.md"
STUB_ARGS="$WORK/args" STUB_STDIN="$WORK/stdin" PATH="$stub:$PATH" \
  bash "$SCRIPTS/run-codex.sh" --prompt "$WORK/prompt.md" --out "$WORK/out.json" \
  --model m1 --effort high --schema "$WORK/s.json" --cd "$WORK"
args=$(cat "$WORK/args")
eq  "run-codex: prompt goes through stdin" "PROMPT BODY" "$(cat "$WORK/stdin")"
lacks "run-codex: prompt not in argv" "PROMPT BODY" "$args"
has "run-codex: read-only sandbox" "read-only" "$args"
has "run-codex: model passed" "m1" "$args"
has "run-codex: effort passed" "model_reasoning_effort=high" "$args"
has "run-codex: schema passed" "--output-schema" "$args"
lacks "run-codex: never bypasses sandbox" "dangerously" "$args"

STUB_ARGS="$WORK/args2" STUB_STDIN="$WORK/stdin2" PATH="$stub:$PATH" \
  bash "$SCRIPTS/run-codex.sh" --prompt "$WORK/prompt.md" --out "$WORK/out.json"
args=$(cat "$WORK/args2")
lacks "run-codex: no model flag by default" "--model" "$args"
lacks "run-codex: no effort override by default" "model_reasoning_effort" "$args"

# ---------------------------------------------------------------- preflight.sh

empty_home="$WORK/codex-home-empty"; mkdir -p "$empty_home"
out=$(CODEX_HOME="$empty_home" bash "$SCRIPTS/preflight.sh" 2>&1); code=$?
if command -v codex >/dev/null 2>&1; then
  eq  "preflight: logged out exits 3" "3" "$code"
  has "preflight: logged out tells how to log in" "codex login" "$out"
fi
out=$(PATH="/usr/bin:/bin" bash "$SCRIPTS/preflight.sh" 2>&1); code=$?
eq "preflight: missing codex exits 2" "2" "$code"

rm -rf "$WORK"
printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
