#!/usr/bin/env bash
# Prints the diff under review, without lock files and generated output.
# Usage:
#   collect-diff.sh --uncommitted [--exclude <glob>]... [-- <path>...]
#   collect-diff.sh --base <commit> [--exclude <glob>]... [-- <path>...]
# --uncommitted: staged + unstaged changes against HEAD, plus untracked files.
# --base: committed changes from <commit> to HEAD.
# Extra excludes come from --exclude and from .codex-review-ignore at the repo root.
set -u

mode=""
base=""
extra_excludes=()
paths=()

while [ $# -gt 0 ]; do
  case "$1" in
    --uncommitted) mode="uncommitted"; shift ;;
    --base) mode="base"; base="${2:-}"; shift 2 ;;
    --exclude) extra_excludes+=("${2:-}"); shift 2 ;;
    --) shift; paths=("$@"); break ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [ -z "$mode" ]; then
  echo "usage: collect-diff.sh --uncommitted | --base <commit> [--exclude <glob>]... [-- <path>...]" >&2
  exit 2
fi

root=$(git rev-parse --show-toplevel) || exit 2
cd "$root" || exit 2

default_excludes=(
  '**/package-lock.json' '**/pnpm-lock.yaml' '**/yarn.lock' '**/bun.lockb' '**/bun.lock'
  '**/Cargo.lock' '**/poetry.lock' '**/uv.lock' '**/Pipfile.lock' '**/composer.lock'
  '**/Gemfile.lock' '**/go.sum' '**/*.min.js' '**/*.min.css' '**/*.map'
  '**/dist/**' '**/build/**' '**/out/**' '**/coverage/**' '**/vendor/**'
  '**/node_modules/**' '**/__generated__/**' '**/*.generated.*'
)

ignore_file_excludes=()
if [ -f .codex-review-ignore ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%%#*}"
    line="$(printf '%s' "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    [ -n "$line" ] && ignore_file_excludes+=("$line")
  done < .codex-review-ignore
fi

pathspec=()
if [ ${#paths[@]} -gt 0 ]; then
  pathspec+=("${paths[@]}")
else
  pathspec+=(".")
fi
for glob in "${default_excludes[@]}" ${ignore_file_excludes[@]+"${ignore_file_excludes[@]}"} ${extra_excludes[@]+"${extra_excludes[@]}"}; do
  pathspec+=(":(exclude,glob)$glob")
done

if [ "$mode" = "base" ]; then
  git --no-pager diff --no-color --no-ext-diff "$base"..HEAD -- "${pathspec[@]}"
  exit $?
fi

git --no-pager diff --no-color --no-ext-diff HEAD -- "${pathspec[@]}"

git ls-files --others --exclude-standard -z -- "${pathspec[@]}" |
  while IFS= read -r -d '' file; do
    if grep -Iq . "$file" 2>/dev/null; then
      printf '\n=== new untracked file: %s ===\n' "$file"
      cat "$file"
    else
      printf '\n=== new untracked file (binary or empty, skipped): %s ===\n' "$file"
    fi
  done
