---
name: codex-review
description: Runs a two-stage cross-model code review through the OpenAI Codex CLI. One Codex model finds issues, each with a verbatim code quote and a confidence score; a second Codex model re-reads the cited code in the repository and confirms or refutes every finding, so false positives are filtered before anyone acts on them. Use when the user wants a second opinion or an independent review by another model ("have Codex review this", "cross-check with another model", "second opinion before I open the PR", "/codex-review"), or before merging a substantial or security-relevant change. Not for prose or design reviews, and not when the user asks for Claude's own review. Requires the Codex CLI.
---

# codex-review

The model that wrote the code tends to miss its own mistakes. This skill hands the diff to a different model family in two stages:

1. **Finder:** Codex reviews the diff adversarially. Every finding must carry `path:line`, a verbatim quote and a confidence.
2. **Verifier:** a second Codex run, on a different model and in a fresh context, opens each cited location in the repository and returns `CONFIRMED`, `REFUTED` or `UNCERTAIN`.

Claude (usually the author) presents the verified result and may only overrule the verifier with evidence.

Paths below use `${CLAUDE_SKILL_DIR}`, the folder containing this file. If your agent does not substitute it, use that folder's absolute path.

## Arguments

All optional. Free text from the user that names a branch, paths or a spec counts too.

| Argument | Effect |
|---|---|
| `--quick` | Finder only, no verifier. Confidence threshold 0.8 instead of 0.6. |
| `--deep` | Reasoning effort `high` for both runs. |
| `--fast` | Reasoning effort `low`; skips auto-escalation. |
| `--base <ref>` | Review `<ref>...HEAD` instead of the auto-detected base. |
| `--spec <file>` | Spec, story or issue file to check for spec drift. |
| `--exclude <glob>` | Drop extra paths from the diff (repeatable). |
| `--verifier-model <slug>` | Use this verifier model instead of the catalog pick. |
| `-- <path>...` | Limit the review to these paths. |

## Step 1: Preflight

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/preflight.sh"
```

Exit 2: Codex CLI missing. Exit 3: not logged in. Exit 4: CLI too old. Relay the script's message (it names the fix) and stop. Both ChatGPT sign-in and API-key login work. With an API key, Codex bills per token; mention that once if the output says `auth=api-key`.

Then create a work folder. Do not name the variable `TMPDIR`; that would redirect every child process's temp files.

```bash
WORKDIR=$(mktemp -d "${TMPDIR:-/tmp}/codex-review.XXXXXX")
```

## Step 2: Collect the diff

Run from inside the repository. Choose the scope:

- `--base <ref>` given, or a spec file declares a baseline commit (for example `baseline_commit:` in its frontmatter): base mode with that ref.
- Otherwise, if `git status --porcelain` is non-empty: uncommitted mode.
- Otherwise: base mode with the auto-detected base.

```bash
# uncommitted changes (staged + unstaged + untracked)
bash "${CLAUDE_SKILL_DIR}/scripts/collect-diff.sh" --uncommitted [--exclude <glob>]... [-- <path>...] > "$WORKDIR/diff.patch"

# committed changes on this branch
BASE=$(bash "${CLAUDE_SKILL_DIR}/scripts/resolve-base.sh" [--base <ref>])
bash "${CLAUDE_SKILL_DIR}/scripts/collect-diff.sh" --base "$BASE" [--exclude <glob>]... [-- <path>...] > "$WORKDIR/diff.patch"
```

`resolve-base.sh` tries `--base`, then `origin/HEAD`, `origin/main`, `origin/master`, `main`, `master`. `collect-diff.sh` drops lock files and common build output, plus every glob listed in `.codex-review-ignore` at the repository root (one per line, `#` comments allowed).

Then:

- Diff empty → tell the user there is nothing to review and stop.
- Only binary files changed → say so and stop.
- More than ~3000 lines → tell the user the size and ask whether to narrow it by path before continuing.

## Step 3: Gather context

Build `$WORKDIR/context.md` with these sections. Skip any source that does not exist; never invent one.

1. `## Diff`: the contents of `diff.patch`.
2. `## Spec` (optional): from `--spec`, a file the user names, an issue referenced in the branch name or commit messages (`gh issue view <n>` if `gh` is installed), or a spec the project's `CLAUDE.md`/`AGENTS.md` points to. Without a spec, skip the section; the finder then skips spec drift.
3. `## Architecture excerpt` (optional): only sections of architecture or design docs that the spec or the changed paths refer to. Not whole files.
4. `## Project context`: the root `CLAUDE.md` or `AGENTS.md`, if present. Skip nested ones unless they sit next to changed files.

Keep `context.md` under ~150 KB; trim the optional sections first, then the diff by path, and tell the user what you cut.

## Step 4: Framework checklists

List `${CLAUDE_SKILL_DIR}/references/frameworks/`. For each file except `TEMPLATE.md`, read its **Applies when** line. If it applies to this diff, use its extra excludes (rerun Step 2 with them if any matched files are in the diff), its escalation patterns (Step 5) and its review checklist (Step 6). Shipped: `sveltekit.md`. Users add frameworks by copying `TEMPLATE.md`.

## Step 5: Reasoning effort and models

Read `${CLAUDE_SKILL_DIR}/references/escalation.md` and decide `EFFORT`: empty (Codex config default), `high`, or `low`. Remember the reason for the report.

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/pick-models.sh" [--verifier-model <slug>]
```

The script prints `finder=`, `finder_source=` and `verifier=`.

- `finder_source=config`: do not pass `--model` to the finder; Codex uses its configured model.
- `finder_source=catalog`: the config sets no model. Pass `--model <finder>` so finder and verifier stay distinct.
- `finder_source=none` and `verifier` empty: the model catalog was unavailable. Run both without `--model` and say in the report that independence is reduced.
- `verifier` empty, finder known: run the verifier without `--model` and say the same.

Never fall back to a model name you remember; model names go stale. If Codex rejects a model (`model_not_found` or similar), show its stderr verbatim and stop.

## Step 6: Run the finder

Build the prompt: `prompts/finder.md`, then each applicable framework checklist under `## Framework checklist: <name>`, then `## Context` followed by `context.md`.

```bash
cat "${CLAUDE_SKILL_DIR}/prompts/finder.md" > "$WORKDIR/finder-prompt.md"
# append framework checklists here, if any
printf '\n## Context\n\n' >> "$WORKDIR/finder-prompt.md"
cat "$WORKDIR/context.md" >> "$WORKDIR/finder-prompt.md"

bash "${CLAUDE_SKILL_DIR}/scripts/run-codex.sh" \
  --prompt "$WORKDIR/finder-prompt.md" \
  --out "$WORKDIR/finder.json" \
  --schema "${CLAUDE_SKILL_DIR}/schemas/finder.schema.json" \
  --cd "$(git rev-parse --show-toplevel)" \
  [--model <finder>] [--effort <EFFORT>]
```

`run-codex.sh` runs `codex exec` read-only, passes the prompt through stdin (large prompts would exceed the per-argument limit on Linux) and writes Codex's final JSON message to `--out`.

A run takes from under a minute to several minutes at `high` effort. In Claude Code, start it with `run_in_background: true` and read the output file when the task ends. If the task marker gets lost, check the output file directly. If nothing arrives after 20 minutes, stop the task and report a timeout.

If the run exits non-zero (auth expired, rate limit, quota, network), show stderr verbatim and stop. If `finder.json` is not valid JSON, show the raw output with a note and stop.

## Step 7: Filter and verify

Skip this step with `--quick`; then drop findings below confidence 0.8 and go to Step 8.

1. Drop findings with `confidence` below **0.6**, or with an empty `quote`. Count them as dropped.
2. No findings left → skip the verifier and go to Step 8.
3. Sort by severity (`CRITICAL` first), then confidence. Keep the first **25**; count the rest as not verified.
4. Number them `F1` … `Fn`. Write `prompts/verifier.md` plus one block per finding to `$WORKDIR/verifier-prompt.md`:

   ```
   ### F1
   - severity: MAJOR
   - location: src/session.ts:42
   - issue: …
   - fix: …
   - quote: `…`
   ```

   Do not add the diff, the spec or the finder's verdict. The verifier reads the code itself; giving it the finder's reasoning would defeat the fresh context.

5. Run the verifier from the repository root, same effort as the finder:

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/run-codex.sh" \
  --prompt "$WORKDIR/verifier-prompt.md" \
  --out "$WORKDIR/verifier.json" \
  --schema "${CLAUDE_SKILL_DIR}/schemas/verifier.schema.json" \
  --cd "$(git rev-parse --show-toplevel)" \
  [--model <verifier>] [--effort <EFFORT>]
```

6. Merge each verdict onto its finding by `id`. A `CONFIRMED` finding takes the verifier's severity. A finding without a verdict counts as **unverified**. If the run fails or `verifier.json` is unusable, mark all findings **unverified** and say why.

## Step 8: Verdict and report

Compute the verdict from the verified findings:

- any confirmed `CRITICAL` or `MAJOR` → `REQUEST_CHANGES` (`NEEDS_DISCUSSION` if the `MAJOR` is a judgment call);
- else an `UNCERTAIN` or unverified `CRITICAL`/`MAJOR` → `NEEDS_DISCUSSION`;
- else → `APPROVE`.

In `--quick` mode, use the finder's `verdict`.

Present the result as described in `${CLAUDE_SKILL_DIR}/references/output-format.md`, including the rule for your own assessment.

## Step 9: Next actions

- For each confirmed finding behind `REQUEST_CHANGES`, propose a concrete fix. **Do not edit files on your own.** Ask whether to apply all, none, or a selection.
- For each spec drift entry with `justified: no` or `unclear`, ask whether to change the code to match the spec or update the spec.
- If the project keeps a change log in its spec or story files, offer to record handled and rejected findings there.
- Remove the work folder: `rm -rf "$WORKDIR"`.

## Data and cost

The diff, the spec excerpts and the root `CLAUDE.md`/`AGENTS.md` go to OpenAI through the Codex CLI, under whatever account Codex is logged in with. Use `.codex-review-ignore` or `--exclude` for paths that must not leave the machine.

## Files

- `scripts/preflight.sh`: Codex installed, logged in, recent enough.
- `scripts/resolve-base.sh`: base commit for branch reviews.
- `scripts/collect-diff.sh`: diff with exclusions and untracked files.
- `scripts/pick-models.sh`: finder and verifier models from config and the live catalog.
- `scripts/run-codex.sh`: one read-only `codex exec` run, prompt through stdin.
- `prompts/finder.md`, `prompts/verifier.md`: the two prompts. Edit them to tune focus and strictness.
- `schemas/*.schema.json`: the JSON shape each run must return.
- `references/escalation.md`: when to raise reasoning effort.
- `references/output-format.md`: report template.
- `references/frameworks/`: optional framework checklists; `TEMPLATE.md` to add one.
