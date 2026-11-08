#!/usr/bin/env bash
# Checks that the Codex CLI is installed and logged in.
# Prints "auth=<chatgpt|api-key|unknown>" on success.
# Exit codes: 0 ok, 2 codex missing, 3 not logged in, 4 codex too old.
set -u

if ! command -v codex >/dev/null 2>&1; then
  echo "codex CLI not found. Install it: npm install -g @openai/codex (or brew install codex), then run: codex login" >&2
  exit 2
fi

status_output=$(codex login status 2>&1 </dev/null)
status_code=$?
if [ "$status_code" -ne 0 ]; then
  echo "Codex is not logged in. Run: codex login (ChatGPT sign-in or API key both work)." >&2
  echo "codex said: $status_output" >&2
  exit 3
fi

if ! codex exec --help 2>/dev/null | grep -q -- '--output-schema'; then
  echo "This codex CLI lacks 'exec --output-schema'. Update it: npm install -g @openai/codex@latest" >&2
  exit 4
fi

case "$status_output" in
  *ChatGPT*) echo "auth=chatgpt" ;;
  *"API key"*|*"api key"*) echo "auth=api-key" ;;
  *) echo "auth=unknown" ;;
esac
