#!/usr/bin/env bash
# Prints the commit that the current branch should be diffed against.
# Usage: resolve-base.sh [--base <ref>]
# Order: --base, origin/HEAD, origin/main, origin/master, main, master.
# On the base branch itself it uses HEAD~1; with a single commit the empty tree.
set -u

EMPTY_TREE=4b825dc642cb6eb9a060e54bf8d69288fbee4904
base_ref=""

while [ $# -gt 0 ]; do
  case "$1" in
    --base) base_ref="${2:-}"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

ref_exists() { git rev-parse --verify --quiet "$1^{commit}" >/dev/null; }

if [ -n "$base_ref" ]; then
  if ! ref_exists "$base_ref"; then
    echo "base ref not found: $base_ref" >&2
    exit 2
  fi
else
  origin_head=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)
  for candidate in "$origin_head" origin/main origin/master main master; do
    if [ -n "$candidate" ] && ref_exists "$candidate"; then
      base_ref="$candidate"
      break
    fi
  done
fi

head_sha=$(git rev-parse HEAD)
merge_base=""
if [ -n "$base_ref" ]; then
  merge_base=$(git merge-base HEAD "$base_ref" 2>/dev/null || true)
fi

if [ -n "$merge_base" ] && [ "$merge_base" != "$head_sha" ]; then
  echo "$merge_base"
elif ref_exists HEAD~1; then
  git rev-parse HEAD~1
else
  echo "$EMPTY_TREE"
fi
