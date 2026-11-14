---
name: design-audit
description: Audits a live website's visual design and how people perceive and find their way around it, on desktop and mobile, against bundled principles (Gestalt as the foundation, typography, spacing and layout, colour, hierarchy, perception and orientation, craft against the generic AI look, copy, motion). Measures in a headless browser and runs a simulated five-second glance test with blind observers. Every finding cites a rule, an evidence class, a severity and a measured value. Use when the user gives a URL and asks to audit, review, critique or check a site's design, UX, layout or typography, or asks "what do you think of this page". Not for building or redesigning UI (use design-build), not for reviewing a code diff, and not an accessibility audit (it runs axe-core only as a floor).
argument-hint: [url] [visual|perception|all]
---

# Design audit

Audit a website against `references/principles.md`. This file lists the steps. The references hold the knowledge and load when a step names them.

Scope argument: `visual` checks blocks G, T, S, C, H and K. `perception` checks block P and runs the glance test. The default is `all`.

## 1. Load the rules

Read `${CLAUDE_SKILL_DIR}/references/principles.md`. Cite findings by rule ID and short name, for example "G3 Common region". A user-supplied rule file replaces it. Then cite that file's IDs.

The rule file defines the evidence classes: research, convention, rule of thumb.

## 2. Identify sources

- **Repository.** Read the code when a checkout or hosted repo exists. Read only: the audit must not change the project. For hosted code use the host's API, e.g. `gh api repos/<owner>/<repo>/contents/<path>?ref=<branch>`. Read the deployed branch. Fetch local checkouts against their remote and report if they are behind.
- **Direction.** Look for a project `DESIGN.md` or a stated direction. Rule K2 ("default or decision?") needs it. A given corporate design overrides K (K3).
- **Earlier audit.** Look where reports are kept (step 8). Compare and name what changed.
- **Owner questions.** The O block lists what a URL cannot answer (users, tests, context of use). Collect them for the report.

## 3. Measure in the browser

Setup, once. Node.js 18 or later. In `${CLAUDE_SKILL_DIR}/scripts`, install with the user's package manager (`pnpm install`, `npm install`, `yarn` or `bun install`), then run `playwright install chromium` through it (`pnpm exec`, `npx`, `yarn` or `bunx`).

Run:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/audit.mjs <url> <temp-dir>/design-audit/<slug>
```

Use the system temp directory and a short slug. Run it again for each subpage.

The script measures desktop (1440 x 900) and mobile (a Playwright device descriptor) in full. Per viewport it writes load frames, a first-viewport screenshot with greyscale and blurred copies, a full-page screenshot, a scroll series, and the measurements `measure`, `design`, `pixels` and `focus`. axe-core runs on desktop only. Read `${CLAUDE_SKILL_DIR}/references/audit-output.md` when you interpret fields or file names.

If the run fails:

- `Cannot find package 'playwright'` or a missing browser: run the setup step.
- `notes` in `audit.json` lists timeouts, an unsettled page or a failed measurement. Report those parts as "Not checked".
- Status 401, 403 or 429, a login page or a bot wall: the measurements describe the wall. Ask for access or use a real browser session.
- A cookie banner covers the page: name it as a finding if it blocks content. Judge the rest from the scroll series or a real browser after dismissing it.

## 4. Glance test

Skip this step for scope `visual`. Otherwise follow `${CLAUDE_SKILL_DIR}/references/glance-test.md`. Observers are fresh subagents that see only the screenshot. Never answer the questions yourself.

## 5. Judge

Go block by block. Judge desktop and mobile separately.

- The measurements say where to look. The crops say what is there. Judge detail on crops, not on the downscaled full page.
- Cut a crop for every element you cite. Boxes in `audit.json` are `{x, y, w, h}` in document pixels:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/crop.mjs <png> <x> <y> <w> <h> <out.png>
```

- Note the locator, crop path and measured value for each finding as you go. The report needs all three.
- Check the greyscale and blurred first viewport for H2, and the load frames for M1 and P2.
- Before a Gestalt finding (G1 to G6), look for a conflicting cue (G10). Name both cues in the finding.
- For colour pairs, compute contrast:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/contrast.mjs [--base <color>] '<fg>' '<bg>' ...
```

  It accepts hex, `rgb()`, `rgba()`, `oklch()`, `oklab()`, `white`, `black` and `transparent`. Translucent colours are composited over `--base` (default white). Convert `lab()` and `color()` to sRGB first.

A real browser tool (for example Claude in Chrome) helps for hover states and interaction. To get the page measurements in another tool, evaluate `scripts/measure.js` in the page. `audit-output.md` lists what that returns.

## 6. Pitfalls

- Full-page screenshots hide sticky and scroll-driven animation. An apparently empty area is often a scroll track. Check the scroll series and the code before judging.
- WebGL needs SwiftShader headless. The script sets it. Check whether the page renders a canvas.
- Tells in `measure.tells` are counts, not verdicts. Ask "default or decision?" (K2).
- Count repetition across pages: `repeated` per page, plus sentences that appear verbatim on several pages.
- Read content files. They often hold builder notes that show label drift between content and page.
- A rule of thumb never becomes a finding. Report it as an observation with the measured value.
- Prominence and pixel values are predictions, not eye-tracking.
- The mobile viewport is what `audit.json` says (`mobile.viewport`, `mobile.device`). Do not assume 390 x 844.
- A value outside one convention but inside another is not a finding (see T3, T5, P8).

## 7. Report

Write plain, specific prose. Apply a writing-style skill such as `no-ai-slop` when it is installed.


Follow `${CLAUDE_SKILL_DIR}/references/report.md`: severity 0 to 4, required fields per finding, a refutation pass, findings and observations in separate lists, and stated limits.

axe results are a floor (A1), not an accessibility audit. Recommend a dedicated accessibility audit.

## 8. Save

Save where the user asks. Default: `./design-audit-<yyyy-mm>.md` in the current working directory. Screenshots stay in the temp directory unless the user wants them kept.
