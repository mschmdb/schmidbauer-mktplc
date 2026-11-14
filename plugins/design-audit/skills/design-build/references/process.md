# Build process

Rule IDs refer to `principles.md`. Where a given design (CI) fixes a value, the CI wins (K3). Craft happens in what it leaves open.

## 1. Brief

Write five lines before code.

- Audience: who opens this, on which device, in which situation.
- Task: what they must get done or learn here.
- Primary action: one per view (H1).
- Tone: three adjectives, each with a design consequence ("plain" means no gradients).
- Content: what real text, images and numbers exist. List what is missing.

With a CI, the tone line restates the CI intent. Do not invent a new one.

## 2. Direction

Commit to a direction before code. Write it into the DESIGN.md decisions log.

- With a CI: restate its intent in two or three sentences. List what it leaves open.
- Without a CI: pick type, colour, layout and imagery from the subject. For each, answer "default or decision?" (K2). A default needs a reason from the project. "It is common" is no reason.
- Banning one default moves you to the next probable one. Do not run a ban list. Ask the question for every choice.
- Keep the structure conventional (hero, sections, footer, clear navigation). Put distinctiveness into type, imagery, content and detail (K3).

## 3. Tokens first

Write the tokens before any component. Use CSS custom properties. They work in every framework.

- Colour roles, not colour names: background, surface, text, muted text, border, accent, focus, error, success. Add a dark set only when the design has one.
- Type scale as a scale: one ratio, named steps (T2). Body 16 px or more on mobile (T5). Line height 120 to 145 % for body (T4).
- Spacing scale as a scale: one base step, named steps (S1). Fluid steps are allowed. Section spacing gets its own step (S2).
- Radius, border width, shadow, container width, breakpoints (S4, S6), motion durations.
- Components read tokens only. No raw hex, no one-off sizes. A missing value means a new token and a DESIGN.md line.
- Existing tokens are reused as they are. Add only what the design leaves open.

## 4. Components with every state

Build each component once, with all states, before you place it on a page.

- default, hover, focus-visible, active, disabled, loading, empty, error.
- States are part of the component, not a later pass. Design the empty and error state with real wording (K1).
- Same role, same style (G2, S5). One button style per role. One card pattern per content type.
- Focus ring follows the corner radius. Hover is not the only cue (P5).
- A box holds one group (G3). Use spacing alone when it already groups.

## 5. Layout: mobile and desktop together

Design both widths for every section in the same pass. Do not scale a desktop layout down afterwards.

| Concern | Mobile | Desktop |
|---|---|---|
| Columns | One column. Forms in one column. | Multi-column where content has parts. Text column stays within line length (T3). |
| Spacing | Tighter steps. Side margin never zero (S3). | More generous steps (S2). |
| Type | Smaller display steps, body not below 16 px. | Full scale. |
| Navigation | A few key links visible next to the menu (P6). | Main links visible. |
| Targets | Large and spaced (P8). | Same targets. Hover adds, never replaces. |
| Chrome | Small against content. No overlay on load. | Same. |

Rules for both:

- Inside gap smaller than outside gap (G1). Heading closer to its own text than to the block above.
- One left edge per column (G5). Equal parallel items share size (G9).
- Breakpoints from content: widen until the line breaks badly, then add the breakpoint. Use the project's breakpoints first.
- Check at 360, 768, 1024 and 1440 px.

## 6. First viewport

Build the first viewport against the five-second rule (P1, P2). A first-time visitor must name the type of site, the offer and the primary action.

- One headline that names the offer in the visitor's words (W1, P4). Not a slogan.
- One primary action (H1), visible without scrolling, left or centre (P3).
- A continuation cue: the next section starts inside the viewport (P2). Never cut cleanly at the fold.
- No overlay, banner or autoplay on top of it.
- On mobile the same holds with the real viewport height. Test at 390 px wide. Use a real phone height, for example 844 px (the scripts use the iPhone 13 device, 664 px of visible height).

## 7. Content

- Use real content. If it is missing, ask for it or mark the gap visibly in the code (`TODO(content)`), and list it in the report.
- Never invent statistics, logos, testimonials, names, prices or dates.
- Copy follows the writing rules of the project (W1, W2). If a writing skill is installed, use it.
- Placeholder text is a bug. Lorem ipsum never ships.

## 8. Imagery

- Images carry information (P7): product, place, person, process, data.
- No decorative stock. If no real image exists, use type, a diagram or whitespace, and list the gap.
- Text over images needs a reason and a scrim that holds the text (G7).
- Set width and height so the layout does not shift (T8). Add alt text that says what the image shows.

## 9. Motion

- Motion has a purpose: show a state change, guide attention, keep continuity (M1).
- Short and rare. None on frequent actions.
- Respect reduced motion (M2). Items of one group move together (G8).
- Scroll-driven motion ends before the content leaves the screen (M3).

## 10. Self-review with screenshots

Take screenshots at 1440 and 390 px. Judge crops, not the downscaled page.

- Greyscale and blur check: blur or desaturate the first viewport. The headline and the primary action must still stand out (H2). If three things compete, remove one.
- Proximity check: for every heading, label and card, is the inside gap smaller than the outside gap (G1)?
- Same-role check: list all buttons, links, cards and headings. Do the ones with the same role look the same (G2)?
- Cue check: where a box, a colour and spacing disagree, fix the weaker cue (G10).
- Craft check (K1): curly quotes, real ellipsis, tabular figures for numbers, tracked caps (T6), styled `::selection`, designed empty and error states.
- Default check (K2): name each choice that came from habit. Keep it only with a project reason.

## 11. When the brief and a principle disagree

1. A brand value or an explicit instruction from the owner wins.
2. Meet the principle inside the freedom that remains. Example: the brand colour fails text contrast. Keep it for fills and large type, add a text variant next to it.
3. Record the conflict in DESIGN.md with the measured value.
4. Build the brand-faithful version. Put the principle-faithful alternative in the report.
5. Research and convention rules bind harder than rule-of-thumb rules. A rule of thumb never beats the brief.
