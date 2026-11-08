# Reasoning effort and auto-escalation

The finder and the verifier run at the same reasoning effort. This file decides which one.

## Order of evaluation

Stop at the first rule that matches.

1. `--fast` → `low`. Skip every trigger below. Report: "Low effort forced via `--fast`; auto-escalation skipped."
2. `--deep` → `high`. Report: "Escalated to high reasoning: requested via `--deep`."
3. A path trigger matches → `high`.
4. A diff-content trigger matches → `high`.
5. A framework file in `references/frameworks/` that applies to this diff lists an escalation pattern that matches → `high`.
6. Otherwise → no override; Codex uses `model_reasoning_effort` from its config.

For rules 3 to 5, report the first match: "Auto-escalated to high reasoning because: <reason>."

## Path triggers

Match against the changed file paths, after exclusions.

| Pattern | Reason |
|---|---|
| `**/auth/**`, `**/*auth*.*`, `**/*session*.*` | authentication or session code |
| `**/payment*`, `**/billing*`, `**/checkout*` | payment code |
| `**/*security*`, `**/*crypto*`, `**/*permission*`, `**/*acl*` | security-sensitive code |
| `infrastructure/**`, `infra/**`, `terraform/**`, `**/*.tf`, `**/k8s/**`, `**/helm/**` | infrastructure |
| `**/migrations/**`, `**/*.sql`, `prisma/schema.prisma`, `drizzle/**`, `**/alembic/**` | DB schema or migration |
| `.github/workflows/**`, `.gitlab-ci.yml`, `Dockerfile*` | CI or build pipeline |
| more than 1000 changed lines | large change |
| the spec or issue is tagged `priority: critical` or similar | flagged critical |

## Diff-content triggers

Scan added or modified lines (prefix `+`) only.

1. **Interactive element without an accessible name.** In markup files (`.html`, `.jsx`, `.tsx`, `.vue`, `.svelte`, `.astro`, templates): an added `<input`, `<button`, `<select`, `<textarea`, `<form`, `<dialog`, or `<a` with `href`, where the same element has none of: `aria-label`, `aria-labelledby`, `aria-describedby`, an associated `<label for>` in the diff, visible text content, or `alt`. Reason: `interactive element without accessible name`.
2. **Raw-HTML sink.** `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `dangerouslySetInnerHTML`, `v-html`, `{@html`. Reason: `raw HTML sink`.
3. **Cookie or session writes.** `Set-Cookie`, `cookies.set(`, `cookies.delete(`, `setCookie(`, `res.cookie(`, `session.destroy(`, `session.regenerate(`. Reason: `cookie or session change`.
4. **Shell or eval.** `exec(`, `execSync(`, `spawn(` with `shell: true`, `subprocess` with `shell=True`, `eval(`, `new Function(`. Reason: `shell execution or eval`.
5. **Destructive SQL.** `DROP `, `TRUNCATE`, `ALTER TABLE ... DROP`, `DELETE FROM` without `WHERE`. Reason: `destructive SQL`.
