# design-audit

A Claude Code plugin with two skills that share one rule file.

- **design-audit** checks a live website. It measures the page in a headless browser and reports findings.
- **design-build** applies the same rules while you build or redesign UI.

## design-audit

- Audits visual design and how people perceive and find their way around a page, on desktop and mobile.
- Measures typography, spacing, alignment, proximity, similarity, colour, hierarchy and the first viewport. Mobile gets the full measurement too.
- Takes screenshots: load frames, first viewport (with greyscale and blurred copies), full page and a scroll series.
- Runs a simulated five-second glance test. Fresh observers see only the first-viewport screenshot.
- Rates every finding with a rule ID, an evidence class, a severity from 0 to 4 and a measured value.
- Checks its own findings in a refutation pass.
- Reads the source repository when one exists, and a project `DESIGN.md` for the question "default or decision?".

## design-build

- Takes in a given corporate design: tokens, CSS, brand PDF, screenshots or a live site.
- Records values, gaps and conflicts in the project's `DESIGN.md`.
- Builds tokens, then components with all states, desktop and mobile together.
- Ends with a finish gate: audit measurements against your dev server, plus the glance test.

## Install

```
/plugin marketplace add mschmdb/schmidbauer-mktplc
/plugin install design-audit@schmidbauer-mktplc
```

With the skills CLI:

```
npx skills add mschmdb/schmidbauer-mktplc --skill design-audit
npx skills add mschmdb/schmidbauer-mktplc --skill design-build
```

Each skill folder installs on its own. `design-build` keeps a copy of the rule file for that reason. Without `design-audit` it has no measurement scripts and reviews screenshots instead.

### Setup (once)

Needs Node.js 18 or later. In `skills/design-audit/scripts`, install with your package manager and add the browser:

```
pnpm install       # or npm install, yarn, bun install
pnpm exec playwright install chromium
```

Claude runs this step itself when the dependencies are missing.

## Use

> Audit the design of https://example.com

> Audit https://example.com, perception only

The scope argument is `visual` (Gestalt, typography, spacing, colour, hierarchy, craft), `perception` (orientation and the glance test) or `all`. The default is `all`. The report goes to `./design-audit-<yyyy-mm>.md` unless you name another place. Screenshots stay in the system temp directory.

> Build the pricing page with our brand tokens in `tokens.css`

## How rules are classed

Rules live in [`skills/design-audit/references/principles.md`](skills/design-audit/references/principles.md). Each rule has an ID such as G3 or T5 and one of three evidence classes.

- **Research**: a study supports it. A violation can become a finding.
- **Convention**: a design system or an authoritative guide states it. A violation can become a finding.
- **Rule of thumb**: common practice without a source. It yields an observation with the measured value, never a finding.

To use your own rules with the audit, name your rule file in the prompt.

## Out of scope

Accessibility is not audited. axe-core runs as a floor and its results appear in the report. For a full check, use a dedicated accessibility audit.

## Tests

```
cd skills/design-audit/scripts && node --test
cd skills/design-build/scripts && node --test
```

The second command includes a check that both `principles.md` copies are identical.

## Changed in 2.0

- Rule IDs (G, T, S, C, H, P, K, W, M, A, O) replace the 32 numbered guidelines.
- `audit.json` has `desktop` and `mobile` objects. Mobile gets the full measurement, on a device descriptor.
- New: the simulated glance test.
- New: severity 0 to 4, a refutation pass, and separate lists for findings and observations.
- New: pixel measures, prominence ranking and crops for evidence.
- New skill: design-build.
- Dependencies now include `sharp`.
