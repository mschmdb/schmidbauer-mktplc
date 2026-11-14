# design-audit 2.0: build plan

Tracking: Orbit MKTPU-1. Evidence: `research.md` in this folder. This file holds the decisions and the work packages.

## Decisions

- The plugin keeps the name `design-audit` and gains a second skill, `design-build`. Version 2.0.0.
- Scope of the audit: design principles (Gestalt first, then typography, spacing and layout, colour, hierarchy), perception and orientation, craft against the generic AI look, copy. Desktop and mobile, each on its own.
- Accessibility is a side topic. axe-core still runs as a floor. The report points to a dedicated accessibility audit. No new accessibility checks.
- Five-second rule: after 5 seconds on the first viewport a first-time visitor names the type of site, the offer and audience, and the primary action. It is this project's target, not a research finding.
- Three evidence classes: research, convention, rule of thumb. A rule of thumb yields an observation with the measured value, never a violation.
- The skills cite only sources marked verified in `research.md`.
- A given corporate design beats the rule against the generic AI look. With a CI, fidelity comes first.
- Conventional structure, distinctive type, imagery, content and detail (Tuch 2012: prototypical layouts rate best).
- Rules live in `skills/design-audit/references/principles.md`. `skills/design-build/references/principles.md` is an identical copy, because `npx skills add --skill` installs one skill folder on its own. A test fails when the two files differ.
- Scripts stay in `skills/design-audit/scripts`. The build skill calls them through `${CLAUDE_PLUGIN_ROOT}` and says how to proceed when the audit skill is not installed.
- New dependency: `sharp`, for pixel statistics and greyscale or blurred screenshots.

## Target layout

```
plugins/design-audit/
  docs/research.md, docs/v2-plan.md
  skills/
    design-audit/
      SKILL.md
      references/
        principles.md        the rules: criterion, check, evidence class, source
        glance-test.md       five-second test with blind observers
        report.md            severity, evidence, refutation pass, report format
        audit-output.md      fields of audit.json
      scripts/
        audit.mjs            orchestration in Playwright
        measure.js           page measurements, injected
        measure-design.js    typography, spacing, edges, colour, prominence, injected
        pixels.mjs           colourfulness, edge density, greyscale, blur (sharp)
        contrast.mjs
        lib/*.mjs            pure functions with unit tests
        fixtures/*.html      test pages
        *.test.mjs
    design-build/
      SKILL.md
      references/
        principles.md        copy
        intake.md            taking in a CI or a given design
        design-md.md         template: values with source, gaps, conflicts
        process.md           brief, direction, tokens, states, responsive, finish gate
        adapters.md          Svelte, Tailwind v4, shadcn notes
      scripts/
        extract-tokens.mjs   observed tokens from a live site or dev server
```

## Rule structure for principles.md

Stable IDs with a letter per block, so rules can be added without renumbering.

- **G** Gestalt: G1 proximity, G2 similarity, G3 common region, G4 connectedness, G5 continuity and alignment, G6 closure, G7 figure and ground, G8 common fate, G9 symmetry, G10 conflicting cues, G11 simplicity (Prägnanz, umbrella, not scored on its own).
- **T** Typography: families, weights, sizes and scale, line length, line height, body size, caps tracking, alignment, typographic detail.
- **S** Spacing and layout: scale, section rhythm, margins around text, container width, alignment edges, density by page type, consistency of repeated components.
- **C** Colour: neutrals dominate, accent with meaning, consistent lightness per role, colour never the only cue, text over images.
- **H** Hierarchy: one primary action per view, hierarchy survives greyscale and blur, one key message per area, nothing without a reason.
- **P** Perception and orientation: five-second rule, first viewport, continuation cue, left and centre placement, headings carry the content, recognisable links and buttons, visible navigation, conventions for logo and search, informative images, nothing key in ad-like areas, link labels, mobile targets and chrome.
- **K** Craft: positive craft evidence first, traits of the generic AI look second, project direction as the reason.
- **W** Copy: users' words, no AI slop, repetition budget.
- **M** Motion: purposeful, short, reduced-motion respected, timing of scroll-driven animation.
- **A** Accessibility floor: axe results and a pointer. One short rule.
- **O** Questions for the owner: user needs, testing with users, context of use. Not scored.

Each rule has: one-sentence principle, what a violation looks like, the check (measured field or screenshot question), desktop and mobile notes where they differ, evidence class, source URL.

## Work package: script fixes

From the code review. Each fix gets a fixture and a failing test first.

1. `measure.js` cardLikeBoxes: Tailwind preflight sets `border: 0 solid`, so `borderStyle !== 'none'` is always true. Require a non-zero border width, a shadow, or a background that differs from the parent. Radius check first.
2. `visible()`: counts opacity 0, sr-only clips, off-screen elements and `aria-hidden`. Use `checkVisibility` with opacity and visibility options, require an intersection with the document, skip `aria-hidden` for text counts.
3. `audit.mjs`: the full-page screenshot is taken before scrolling, so lazy content is blank. Scroll the whole page first, return to top, then shoot. Scroll series covers the whole page with a cap, not four viewports.
4. Mobile context lacks `isMobile`, `hasTouch`, `deviceScaleFactor` and a mobile user agent. Use a Playwright device descriptor. Run the full measurement on mobile too, not only small targets.
5. smallTargets: skip inline links in text and hidden native inputs (measure the label), add a spacing test, report the total.
6. charsPerLine: measure real characters per line with `Range.getClientRects`, restrict to main content.
7. focusWalk: Tailwind `outline-none` computes to a transparent outline; check the colour alpha. Compare against the unfocused style.
8. Tells: numbered markers match dates; arrows count all body text; mono detection misses common families and counts `code`.
9. `repeated`: exclude nav, footer and hidden text; drop bigrams contained in a surviving trigram.
10. `networkidle`: wait for `load`, fonts ready and a short quiet window instead.
11. Pure functions move to `lib/*.mjs` with unit tests. `measure.js` stays one injectable script.
12. Update pins: `playwright`, `@axe-core/playwright` to current versions; add `sharp`.

## Work package: new measurements

Per viewport (desktop 1440 × 900, mobile through a device descriptor):

- Typography: families (normalised, icon fonts excluded), weights, sizes and the ratios between neighbouring sizes, h1 to body ratio, body size, line height by role, uppercase tracking, justified or centred long text.
- Spacing: distinct margin, padding and gap values; share that fits a 4 px step and a 5 px step; section paddings; side margin on mobile.
- Proximity: for headings, gap to the following block against gap to the preceding block; for form labels, gap to their own field against gap to the neighbouring field; for sibling groups, inner gap against outer gap.
- Alignment: distinct left edges of text blocks, with tolerance.
- Similarity: variants of radius, shadow and border; style variants per role (buttons, links, cards).
- Common region: nesting depth of bordered or shadowed containers.
- Colour: hue families above a chroma threshold in computed colours, accent colours on interactive elements, lightness spread per role in OKLCH.
- Hierarchy: filled primary-looking buttons per viewport; greyscale and blurred screenshots of the first viewport.
- First viewport: h1 present, its size and word count; elements within 20 % of the largest visual weight; share covered by image or video; overlay or banner area; content that appears after 1000 ms.
- Pixels (`pixels.mjs`): colourfulness, edge density, whitespace share.
- Prominence ranking: top elements per viewport by area × contrast × type size × position prior. Labelled as prediction.
- Tells: gradient text, backdrop blur count, emoji as icons, radius and shadow uniformity, identical sibling-card skeletons, generator meta tags and framework fingerprints, default-only font stack.

## Work package: audit skill

- `SKILL.md` stays near 100 lines: steps and pointers.
- Glance test (`references/glance-test.md`): 3 blind observers per viewport (5 on request) get only the first-viewport screenshot. Fixed questions: what do you remember; what is this page about and what does it offer; who is it for; what would you click first; what is unclear. "Cannot tell" is allowed. Rubric 0 to 3 for purpose, audience and first action. A result counts when at least 2 of 3 agree. Label: "simulated glance test, not a user test". Recommend a real five-second test when observers disagree or score below 2.
- Report (`references/report.md`): severity 0 to 4; each finding with rule ID, evidence level, selector, crop and measured value; a refutation pass in a fresh context; findings and observations in separate lists; desktop and mobile in separate sections; questions for the owner; stated limits.
- Frontmatter: `argument-hint`, `allowed-tools` for the scripts.
- Dependencies install outside the plugin cache where the harness provides a data directory.

## Work package: build skill

- Intake order: tokens, live site, PDF as page images, screenshots. Each value records its source.
- Writes or updates a project `DESIGN.md`: values with source, gaps the CI leaves open, conflicts. The skill never overrides a brand value silently.
- With a CI: fidelity first, craft inside what the CI leaves open. Without one: derive a direction from the subject and write it down before code.
- Process: brief, direction, tokens, components with all states, desktop and mobile together, self-review with screenshots, finish gate.
- Finish gate: run the audit measurements against the local dev server and the glance test on the first viewport.
- Output as CSS custom properties. Framework notes in `adapters.md`.

## Test sites

- `schmidbauer.dev` and `navigator.berlin` (local checkouts in sibling folders). Both are already tuned against the generic look, so they test for false positives and for CI intake (`navigator-berlin/docs/DESIGN.md`, both `src/app.css`).
- Bad examples are built as fixtures: one generic AI-look page, one page with Gestalt violations.
