# codex-review

A Claude Code skill that gets a second opinion on your changes from OpenAI Codex, then checks that opinion before you see it.

1. **Finder:** Codex reviews the diff. Every finding needs a file, a line, a verbatim quote and a confidence score.
2. **Verifier:** a second Codex run, on a different model and without the finder's reasoning, opens each cited line in your repository and marks the finding confirmed, refuted or uncertain.
3. **Report:** Claude shows the verified findings. It may only overrule the verifier with evidence from the code, because Claude usually wrote the code under review.

Refuted findings stay visible in one line each, so you can overrule the verifier too.

## Requirements

- [Codex CLI](https://github.com/openai/codex) with `codex exec --output-schema` support, logged in with `codex login` (ChatGPT sign-in or API key).
- `git`, `bash`, and `python3` or `jq`.

## Install

```
/plugin marketplace add mschmdb/schmidbauer-mktplc
/plugin install codex-review@schmidbauer-mktplc
```

Or with the skills CLI:

```
npx skills add mschmdb/schmidbauer-mktplc --skill codex-review
```

## Use

Ask for it ("have Codex review this", "second opinion before I open the PR") or run `/codex-review`.

| Option | Effect |
|---|---|
| `--quick` | Finder only, no verifier |
| `--deep` | High reasoning effort |
| `--fast` | Low reasoning effort, no auto-escalation |
| `--base <ref>` | Diff against this ref instead of the detected default branch |
| `--spec <file>` | Check the change against a spec or story |
| `--exclude <glob>` | Leave paths out |
| `--verifier-model <slug>` | Pick the verifier model yourself |
| `-- <path>...` | Review only these paths |

The skill raises reasoning effort on its own for risky diffs: auth, payments, migrations, infrastructure, raw-HTML sinks, shell execution, and interactive markup without accessible names.

## Configure

- **Models:** the finder uses the model from your Codex config. The verifier takes the best-ranked other model from `codex debug models`. No model names are hard-coded.
- **Excluded paths:** lock files and common build output are excluded. Add more in `.codex-review-ignore` at your repository root, one glob per line.
- **Prompts:** edit `skills/codex-review/prompts/finder.md` and `verifier.md`.
- **Frameworks:** framework checklists in `skills/codex-review/references/frameworks/` are added only when the diff matches. SvelteKit ships as an example; copy `TEMPLATE.md` to add your own.

## Data

Your diff, spec excerpts and root `CLAUDE.md`/`AGENTS.md` go to OpenAI under your Codex account. With an API key, runs are billed per token.

## Tests

```
bash plugins/codex-review/tests/test-scripts.sh
```

The tests cover the helper scripts with temporary git repositories and a stubbed `codex`. They do not call OpenAI.
