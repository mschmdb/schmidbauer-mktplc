# Project DESIGN.md

The DESIGN.md records the design the build work follows. Every value names its source. The file ends the guessing: the next session reads it instead of re-deriving the design.

Rules:

- A DESIGN.md exists already: read it, then extend it. Never replace it. Add new sections below the existing ones or mark changes in the decisions log.
- It may cover only part of the product. Read its title and scope line. Add a section with its own scope line and leave the existing text untouched.
- Location: where the existing file lives. Without one, the repo root as `DESIGN.md`.
- A code comment or test may cite a DESIGN.md that does not exist. Record it as a gap and ask for the file.
- Never write a value without a source and a status.
- Never change a brand value silently. A change goes into "Conflicts" and waits for the owner.

Google publishes a `design.md` spec as an alpha (YAML front matter for tokens, fixed section order, a lint command). This template is compatible in spirit and does not depend on it. If the project already follows that spec, keep its format and add the parts below that it lacks (sources, gaps, conflicts).

## Status values

- **specified**: a machine-readable token, a style guide or a CI document states it.
- **observed**: measured on a live page or dev server (`scripts/extract-tokens.mjs`).
- **estimated**: read off a screenshot or mockup. Treat as a proposal.
- **derived**: the skill computed it from specified values. Always label "derived, to confirm".

## Template

```markdown
# Design: <product>

Scope: <whole product | area>. Sources read: <list with dates>.

## Intent
Three sentences. Who uses it, what the design should make them feel or do, which traits carry it (type, colour, density, tone).

## Tokens
One table per category: colour roles, type, spacing, radius and shadow, breakpoints, motion.

| Token | Value | Source | Status |
|---|---|---|---|

Group large domain palettes (charts, maps, severity) in one row with the file range.
Also record: rules enforced by tests (contrast pairs, no raw hex in components), logo rules (clear space, minimum size, forbidden uses), imagery style, tone of voice.

## Gaps
What the design does not define. Each gap has a proposed derivation.

| Gap | Proposal | Status |
|---|---|---|

## Conflicts
Where two sources disagree, or a brand value fails a rule.
Each entry: what, both values with sources, the measured ratio or number, what the build does meanwhile, the question for the owner.

## Decisions
One line per decision, "default or decision?" answered:
<date> <area>: <choice>. Reason: <project reason>.
```

Typical gaps to check: interaction states (hover, focus-visible, active, disabled), error and success colours, dark mode, mobile type scale, focus style, empty and loading states, breakpoints, motion, icon set, form controls.

Typical conflicts: a brand colour that fails text contrast (keep the brand value for fills and large display, add an adjacent variant for text, record the ratio, ask); two documents with different values; tokens that break the project's own rules; a CI font without the licence for web use.

## Filled example (short)

```markdown
# Design: Example Kiosk

Scope: whole site. Sources read: src/app.css (2026-11-14), brand-guide.pdf.

## Intent
Neighbourhood bakery with a weekly bread plan. Visitors check today's bread and opening hours on a phone. The design is warm, plain and quick: one serif for headlines, one sans for text, cream paper with one red accent.

## Tokens
| Token | Value | Source | Status |
|---|---|---|---|
| --bg | #f4efe4 | src/app.css:12 | specified |
| --accent | #c8402a | brand-guide.pdf p.4 | specified |
| --font-display | "Fraunces" | brand-guide.pdf p.5 | specified |
| --font-body | system-ui | observed on https://localhost:5173 | observed |
| --text-base | 1rem | src/app.css:20 | specified |
| --space-4 | 1rem | derived from 4 px step in src/app.css:25 | derived |

## Gaps
| Gap | Proposal | Status |
|---|---|---|
| Focus style | 2 px outline, --ink, 2 px offset | derived, to confirm |
| Mobile h1 | 2rem (desktop 3rem) | derived, to confirm |

## Conflicts
- --accent #c8402a on --bg: 4.34:1, below 4.5:1 for body-size text. Build keeps #c8402a for buttons and headings above 24 px. Text links use #a8321f (5.83:1, derived). Question: may links use #a8321f?

## Decisions
2026-11-14 imagery: photos of the real bread, no stock. Reason: the offer is the bread.
```
