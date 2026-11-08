---
name: design-audit
description: Audits a live website's visual design, UX, motion and copy against 32 bundled guidelines (Gestalt as the base, WCAG 2.2, established UX heuristics, no generic AI look, no AI-slop copy). Measures in a real or headless browser with axe-core, desktop and mobile screenshots, a scroll series and load-animation frames, and reads the source repository when one is available. Every finding cites a rule and an evidence level. Use this skill when the user gives a URL and asks to audit, review, critique or check a site's design, UX, accessibility, typography or animation, or to check it against design guidelines, even if they only say "what do you think of this page". Not for building or redesigning UI, and not for reviewing a code diff.
---

# Design audit

Audit a website against `references/guidelines.md`. The guidelines are the rule source; this file describes the procedure. If the user names their own guideline file, use it instead and cite its numbers.

## 1. Load the rules

Read `${CLAUDE_SKILL_DIR}/references/guidelines.md`. Cite findings by rule number and short name ("rule 23, targets large and close"), so a reader can follow them without the file.

## 2. Identify sources

- Is there a repository (local checkout or a hosted one)? Then read the code as well. Read only: the audit must not change the project it judges. For hosted code, use the host's API, e.g. `gh api repos/<owner>/<repo>/contents/<path>?ref=<branch>` on GitHub.
- Read the branch that is deployed, which is not always the default branch. Fetch local checkouts against their remote and report if they are behind; otherwise code and page may disagree.
- Look for an earlier audit where reports are kept (step 7). If one exists, compare and name what changed.

## 3. Measure in the browser

### Setup (once)

The scripts need Node.js 18 or later. In `${CLAUDE_SKILL_DIR}/scripts`, install the dependencies with the user's package manager (`npm install`, `pnpm install`, `yarn` or `bun install`), then install the browser:

```bash
npx playwright install chromium
```

### Run

```bash
node ${CLAUDE_SKILL_DIR}/scripts/audit.mjs <url> <temp-dir>/design-audit/<slug>
```

Use the system temp directory and a short slug for the page. Run the script again for each subpage. It writes `audit.json` and screenshots: full page, load-animation frames at 300/1000/2500 ms and a scroll series. Read `${CLAUDE_SKILL_DIR}/references/audit-output.md` when interpreting the fields.

### First viewport (rule 16)

Before anything else, judge `desktop-t2500.png` and `mobile-t2500.png`: the first viewport, without scrolling or interaction. Write down in one sentence what the page is for and what the main action is, using only what is visible there. If that is not possible, or if it only works after the load animation ends, that is a rule 16 finding. Compare with `t300` and `t1000`: content that appears late counts against the 3-second target. `measure.firstViewport` lists the headings, text and actions visible above the fold.

Look at the screenshots, not only the JSON. The numbers say where to look; the pictures say what is there.

A real browser tool (for example Claude in Chrome) helps for interaction, hover states and judgment. Run `audit.mjs` anyway for the measurements. To get the same page measurements in another browser tool, evaluate the contents of `scripts/measure.js` in the page; it returns one object.

### Contrast

```bash
node ${CLAUDE_SKILL_DIR}/scripts/contrast.mjs [--base <color>] '<fg>' '<bg>' ...
```

Accepts hex (3, 4, 6, 8 digits), `rgb()`/`rgba()`, `oklch()`, `oklab()` and `white`/`black`/`transparent`, which covers what browsers report as computed colors. oklch/oklab outside the sRGB gamut are clamped. Translucent colors are composited: the background over `--base` (default white, or the color actually behind it), then the foreground over that. Other formats (`lab()`, `color()`, named colors) need converting to sRGB first.

### If the run fails

- `Cannot find package 'playwright'` or a missing browser: run the setup step.
- `notes` in `audit.json` lists timeouts or a failed viewport. Report those parts as "Not checked".
- Status 401/403/429, a login page or a bot wall in the screenshots: the measurements describe the wall. Ask the user for access or use a real browser session.
- A cookie banner covers the page: name it as a finding if it blocks content (rules 2, 20), and judge the rest from the scroll series or a real browser after dismissing it.

## 4. Pitfalls

- **Full-page screenshots hide sticky and scroll-driven animation.** An apparently empty area is often a scroll track. Check the scroll series and the code before judging.
- **WebGL needs SwiftShader headless** (set in the script). Check whether the page sets a class like `has-gl` or renders a canvas.
- **Judging animation means two questions:** does it fit the content (rule 10)? Is it needed (rules 2, 31)? Read order and logic from the code: does it show technique (draw order) or content?
- **Recompute timing.** For scroll-driven animation, compare where the sticky section ends with where the animation ends. If the climax only arrives while scrolling away, that violates rule 25.
- **Read content files.** They often hold builder notes ("do not claim") that show honesty (rule 14) or label drift between content and page.
- **AI-look signals are counts, not verdicts.** Each trait can be right when the project gives a reason, such as mono for real timestamps or numbers for a real sequence.
- **Count repetition across the whole site:** `repeated` in `audit.json` per page, plus sentences that appear verbatim on several pages.
- **Gestalt similarity:** the same form for unlike content (an offer, a tool and a link in identical cards) is a finding.
- **Automated checks miss many accessibility problems.** axe results are a floor, not a pass. Walk the focus order and check the reading order yourself.

## 5. Evidence levels

Label every finding with its origin, so the reader knows how much weight it carries:

- **seen in browser** (screenshot, measurement)
- **from code** (file and line)
- **computed** (contrast, timing, estimate)
- **interpretation** (model reading; say so explicitly)

Correct errors from an earlier version openly rather than overwriting them.

## 6. Report format

- Verdict in one sentence first.
- Findings by weight, each with rule number, evidence level and evidence.
- "Met" briefly; "Not checked" explicitly, with the reason.
- Biggest lever last.
- Plain, specific prose. If a writing-style skill such as `no-ai-slop` is installed, apply it.

## 7. Save the report

Save where the user asks. Default: `./design-audit-<yyyy-mm>.md` in the current working directory. Screenshots stay in the temp directory unless the user wants them kept.
