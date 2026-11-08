# design-audit

A Claude Code skill that audits a live website's design, UX, motion and copy against 32 guidelines. It measures the page in a browser, reads the source when there is a repository, and reports findings with a rule number and an evidence level.

## What it does

- Runs axe-core (WCAG 2.0 A/AA, 2.1 AA, 2.2 AA) and walks the first ten focus stops.
- Takes desktop and mobile screenshots: full page, load-animation frames at 300, 1000 and 2500 ms, and a scroll series that shows sticky and scroll-driven animation a full-page screenshot hides.
- Renders WebGL headless through SwiftShader.
- Measures fonts, sizes, colors, line length (estimated), small targets and accented headings.
- Counts signals of a generic AI look and repeated word pairs. These are counts, not verdicts.
- Computes WCAG contrast for hex, `rgb()`, `oklch()` and `oklab()` colors, compositing translucent colors against their background.
- Labels every finding: seen in browser, from code, computed, or interpretation.

The guidelines are in [`skills/design-audit/references/guidelines.md`](skills/design-audit/references/guidelines.md): Gestalt as the base, typography, WCAG 2.2, UX heuristics (Nielsen, Shneiderman, GOV.UK, Laws of UX), motion, no generic AI look, no AI-slop copy. To use your own rules, name your guideline file when you ask for an audit.

## Install

```
/plugin marketplace add mschmdb/schmidbauer-mktplc
/plugin install design-audit@schmidbauer-mktplc
```

Or with the skills CLI:

```
npx skills add mschmdb/schmidbauer-mktplc --skill design-audit
```

### Setup (once)

Requires Node.js 18 or later. In the skill's `scripts/` directory, install dependencies with your package manager and add the browser:

```
npm install        # or pnpm install, yarn, bun install
npx playwright install chromium
```

Claude runs this step itself if the dependencies are missing.

## Use

Give Claude a URL and ask for an audit:

> Audit the design of https://example.com against the guidelines.

The report goes to `./design-audit-<yyyy-mm>.md` unless you name another place. Screenshots stay in the system temp directory.

## Optional

If a writing-style skill such as `no-ai-slop` is installed, the report text follows its rules.

## Tests

```
cd skills/design-audit/scripts && node --test
```
