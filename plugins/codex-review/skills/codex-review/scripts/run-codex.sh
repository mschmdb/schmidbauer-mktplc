#!/usr/bin/env bash
# Runs one read-only `codex exec` pass. The prompt goes through stdin, so large
# prompts do not hit the per-argument size limit (128 KB on Linux).
# Usage: run-codex.sh --prompt <file> --out <file> [--schema <file>]
#                     [--model <slug>] [--effort <low|medium|high|...>] [--cd <dir>]
# Without --model and --effort, Codex uses the values from its config.
set -u

prompt="" out="" schema="" model="" effort="" workdir=""
while [ $# -gt 0 ]; do
  case "$1" in
    --prompt) prompt="${2:-}"; shift 2 ;;
    --out) out="${2:-}"; shift 2 ;;
    --schema) schema="${2:-}"; shift 2 ;;
    --model) model="${2:-}"; shift 2 ;;
    --effort) effort="${2:-}"; shift 2 ;;
    --cd) workdir="${2:-}"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [ -z "$prompt" ] || [ -z "$out" ]; then
  echo "usage: run-codex.sh --prompt <file> --out <file> [--schema <file>] [--model <slug>] [--effort <level>] [--cd <dir>]" >&2
  exit 2
fi

args=(exec --sandbox read-only --skip-git-repo-check --ephemeral --color never --output-last-message "$out")
[ -n "$model" ] && args+=(--model "$model")
[ -n "$effort" ] && args+=(-c "model_reasoning_effort=$effort")
[ -n "$schema" ] && args+=(--output-schema "$schema")
[ -n "$workdir" ] && args+=(--cd "$workdir")
args+=(-)

codex "${args[@]}" < "$prompt"
