---
name: design-build
description: Builds or redesigns UI (pages, components, flows, landing pages) so it follows design principles (Gestalt, typography, spacing, colour, hierarchy, orientation), works on desktop and mobile from the start, and reads as designed by a person, not as a generic AI default. Takes in a given corporate identity or existing design (token files, CSS, Figma variables, brand PDF, screenshots, a live site), records it in the project's DESIGN.md and works inside it. Use when building or redesigning a screen or component, applying a brand or CI, starting a new site without a design, or when the user says "make this look less generic". Not for auditing a live URL (use design-audit) and not for copy alone (use a writing skill). Not framework-bound; notes for Svelte, Tailwind and shadcn-style kits are optional.
---

# Design build

Build UI that follows `references/principles.md` and stays inside the design it is given. Build accessibly; a dedicated accessibility audit checks it. This file lists the steps. The references hold the detail and load only when needed.

References, loaded when a step needs them:

- `references/intake.md`: take in a given design, by source reliability.
- `references/design-md.md`: the DESIGN.md template.
- `references/process.md`: brief, tokens, states, responsive layout, self-review.
- `references/adapters.md`: optional stack notes.
- `references/principles.md`: the full rules with evidence classes.

## 0. Precedence

A given design beats this skill's taste. With a CI or an existing design system, fidelity comes first. Craft happens inside what the design leaves open. The rule against the generic look (K) never overrides a brand value. Never change a brand value silently: record a conflict and ask the owner.

## 1. Intake

Find the design that already exists. Read `references/intake.md`. Check in this order: token files and CSS in the repo, the component library, a live site or dev server, a brand PDF (read as page images), screenshots. Also read `CLAUDE.md`, `AGENTS.md`, `README.md` and `docs/`.

- A live site or dev server: `node ${CLAUDE_SKILL_DIR}/scripts/extract-tokens.mjs <url>` prints observed tokens. It needs the dependencies of the design-audit skill.
- Nothing found: ask once for a CI, a token export or a reference site. If none exists, go to step 3 without a CI.

## 2. Record it in DESIGN.md

Read `references/design-md.md`. Write each value with its source and status (specified, observed, estimated, derived). List gaps (what the design does not define) and conflicts (where sources disagree or a brand value fails a rule). If a DESIGN.md exists, read it and extend it. Do not replace it.

## 3. Direction

- With a CI: restate its intent in two or three sentences. List what it leaves open.
- Without a CI: write a brief from the subject (audience, task, tone). Commit to a direction before code.
- For type, colour, layout and imagery, ask "default or decision?" (K2). Keep a default only with a reason from the project.
- Keep the structure conventional. Put distinctiveness into type, imagery, content and detail.

## 4. Tokens, then components

Read `references/process.md`. Write the tokens first as CSS custom properties. Build components with all states: default, hover, focus-visible, active, disabled, loading, empty, error. Design desktop and mobile together in the same pass. Use real content. Never invent stats, logos or testimonials.

For stack details (Svelte, Tailwind v4, shadcn-style kits, plain CSS), read `references/adapters.md`.

## 5. Apply the principles while building

Check these while you build. The rule IDs refer to `references/principles.md`, which holds the full rules.

- G1: the gap inside a group is smaller than the gap between groups.
- G2: the same role gets the same style.
- G3: a box holds one group. Use spacing where it already groups.
- G10: grouping cues (box, colour, spacing) do not conflict.
- T1: few families and weights. No Light or Thin text.
- T3: body lines of 45 to 90 characters (conventions differ; see T3).
- S1: one spacing scale for the whole page.
- C1: neutrals dominate. The accent carries meaning (C2).
- H1: one primary action per view. The hierarchy survives greyscale and blur (H2).
- P1: the first viewport passes the five-second rule.
- P5: links and buttons look clickable without hover.
- P6 and P8: a few key links visible on mobile, large and spaced targets.
- K1: craft detail (curly quotes, tabular figures, designed empty and error states).

## 6. Finish gate

1. Look at the result in a browser at desktop (1440 px) and mobile (390 px) widths. Check hover, focus and the empty and error states.
2. Run the audit measurements against the local dev server:

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/skills/design-audit/scripts/audit.mjs <local-url> <temp-dir>/design-build/<slug>
   ```

   This path exists only when the plugin is installed as a whole, with the dependencies set up (see the design-audit skill). Otherwise review screenshots at both widths against the step 5 checklist.
3. Run the glance test on the first viewport, desktop and mobile. Show only the first-viewport screenshot to one or more fresh agents without context, or judge it yourself after a pause. Ask: what kind of site is this, what does it offer, for whom, what would you click first? "Cannot tell" is a valid answer. If the answer misses, fix the first viewport (P1, P2). If the design-audit skill is installed, follow its `glance-test.md`.
4. Fix what the gate finds inside the constraints of the design. If a fix would change a brand value, record a conflict instead.
5. Run the project's own tests and guards (type check, lint, token and contrast tests).

## Pitfalls

- Do not work from a ban list of AI-look traits. A banned trait moves you to the next default. Ask "default or decision?" instead.
- Do not add what the design lacks without a reason: dark mode, shadows, gradients, animation.
- Do not copy another site's look. Take its structure at most.
- Stay in the requested area. Mention a problem outside it, and do not fix it.
- Placeholder copy and invented numbers are bugs. Ask for content or mark it missing.

## Report back

End with three short lists:

- Taken from the CI: values and sources used as given.
- Gaps filled: what the design left open, what you derived, and the rationale. Mark each "derived, to confirm".
- Conflicts for the owner: the value, the measured number, what you built meanwhile, and the question.

Add what content is missing (copy, images, numbers), and the DESIGN.md changes.
