# Design and UX guidelines

32 rules for judging a website's design, UX, motion and copy. Cite them by number and short name in findings, e.g. "rule 23, targets large and close".

Rules 1 and 2 are the base. Rules 31 and 32 carry the same weight as the base.

## Base

1. **Follow the Gestalt principles. They are the base.** Prägnanz as the umbrella law: people see the simplest form. Under it proximity, similarity, continuity, closure, figure and ground, and common region (a later addition by Palmer).
2. **Add nothing that is not needed.** Every element needs a reason. Without one, it goes. (Rams 10 "as little design as possible", "Less, but better"; Nielsen 8; GOV.UK 2 "Do less")

## Visual design

3. **Hierarchy through typography first.** Size, weight and spacing create order. Color supports the order, it never carries it alone. (Refactoring UI: design in grayscale first)
4. **Structure through space and lines.** Proximity groups, a line separates. Boxes, cards and shadows only with a reason.
5. **One key message per area.** Strong size contrast between message and detail.
6. **Color sparingly and with meaning.** One accent. Only the most important thing stands out (von Restorff effect). Color is never the only cue (WCAG 1.4.1, level A).
7. **One system instead of one-off values.** Color, type and spacing come from tokens. Components use no raw values.
8. **Accessibility is part of the design.** It is not retrofitted. Contrast for text and UI parts (WCAG 1.4.3, 1.4.11), visible focus that nothing covers (2.4.7, 2.4.11), full keyboard operation (2.1.1), semantic structure for screen readers, and reflow at 320 CSS px without horizontal scrolling (1.4.10). (GOV.UK 6 "This is for everyone", Shneiderman 2)
9. **Motion only when subtle and purposeful.** Short transitions; motion never carries meaning alone. Under `prefers-reduced-motion: reduce`, remove or replace non-essential motion (WCAG 2.3.3, level AAA). Motion that starts by itself and runs longer than five seconds needs a way to pause it (WCAG 2.2.2, level A).
10. **Form follows content.** The design makes the message visible; it does not decorate.
11. **Purpose sets density.** A message page needs white space. A tool may be dense.
12. **A grid orders the page.** Columns and spacing follow a grid. (Vignelli Canon)
13. **Reading typography by measure.** 45 to 90 characters per line, body text 15 to 25 px, line height 120 to 145 %. Bold and italic sparingly, never together. (Butterick) The layout survives user text-spacing overrides: line height 1.5, paragraph spacing 2, letter spacing 0.12, word spacing 0.16 times the font size (WCAG 1.4.12, level AA). Stricter, level AAA: at most 80 characters per line, line height at least 1.5 (WCAG 1.4.8).
14. **Avoid fashion, stay honest.** No trends that look dated in two years. Promise nothing the product does not deliver. (Rams 6 and 7)

## UX

15. **User needs first.** Find out what people need, not only what they ask for. (GOV.UK 1, Rams 2)
16. **Purpose clear at a glance.** People understand what the page is for, and what its main elements do, as fast as possible. Target: under 3 seconds. The 3 seconds are this guideline's own target, not a research finding. Check: what is in the first viewport? Is the purpose clear without scrolling and without interaction? Is the main action recognizable? A five-second test with real users checks this directly: show the page for five seconds, then ask what it is for and what to do next.
17. **Use conventions.** Users know patterns from other sites. The same things have the same names and behave the same way. (Jakob's law, Nielsen 4, Shneiderman 1)
18. **Show status and feedback.** Every action gets a visible response. Feedback within about 400 ms keeps people productive (Doherty threshold). Show a loading state once a wait may exceed about 1 s. (Nielsen 1, Shneiderman 3)
19. **Prevent errors, report them clearly.** Make serious errors hard to make. Messages in plain language name the problem and the way out. (Nielsen 5 and 9, Shneiderman 5)
20. **Users stay in control.** Undo, cancel and back work everywhere. (Nielsen 3, Shneiderman 6 and 7)
21. **Recognition over recall.** Keep options visible, split information into meaningful groups. (Nielsen 6, Shneiderman 8, chunking, cognitive load)
22. **Few, clear options.** Every extra choice lengthens the decision. Group and label long lists instead of cutting them at any cost. (Hick's law, choice overload)
23. **Targets large and close.** At least 24 × 24 CSS pixels, important targets larger and where the hand already is. (Fitts's law, WCAG 2.2 SC 2.5.8, level AA)
24. **The system carries complexity.** What cannot be avoided, the software handles, not the user. (Tesler's law, GOV.UK "Do the hard work to make it simple")
25. **Flows with a clear end.** Every flow has a beginning, middle and end. The peak and the end shape the memory; both deserve care. (Shneiderman 4, peak-end rule)
26. **Accept input generously.** Tolerate formats, such as spaces in phone numbers. Keep output unambiguous. (Postel's law)
27. **Understand context.** Device, situation and experience of the users decide too. (GOV.UK 7)
28. **Flexible and efficient.** Shortcuts and accelerators speed up frequent users without getting in the way of new ones, such as keyboard shortcuts, saved filters or deep links. (Nielsen 7)
29. **Help is findable and stays in place.** Help and contact options are easy to find, focused on the task, and appear in the same relative order on every page that offers them. (Nielsen 10, WCAG 3.2.6 Consistent Help, level A)
30. **Test and iterate.** Check early with real users, drop what does not hold. (GOV.UK 3 and 5)

## No AI look

31. **The design does not look AI-made.** Every element is a decision for this project, not a default. Test question: would a generic prompt for a similar site produce the same result? Typical traits of generated pages:
    - a single word or phrase in the headline styled differently (italic, bold or colored)
    - an uppercase eyebrow label above every heading, labels above content that need none
    - meta strings with middle dots ("A · B · C"), labels like "WORD — fragment"
    - monospace for small data labels, "→" on link and button text
    - numbering (01, 02, 03) without a real sequence
    - card kit: identical cards, one radius for everything, the same soft shadow, gradients as decoration
    - fade-and-slide-up on every section, a hover effect on every card
    - palette clusters: cream background with serif display and terracotta accent; near-black with one loud accent; newspaper layout with hairlines and zero radius

    Each trait can be right in a given case. It then needs a reason from the project.
32. **The copy contains no AI slop.** Use the users' words, not internal jargon (Nielsen 2). No buzzwords, no stacks of three adjectives, no staged rhetoric (manufactured depth, staged reveals, parallelism tics such as "not X, but Y", brochure phrases). Repetition budget: a figure used once is voice, three times is a tic.

**Tension between rules 4, 6 and 31:** Lines instead of boxes and a restrained palette sit close to two clusters in rule 31 (cream background, hairline layout). The rules do not contradict each other, but each use needs a reason from the project.

## Sources

- [Anthropic: frontend-design skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), traits of generated pages
- [Vitsœ: Dieter Rams, Good design](https://www.vitsoe.com/gb/about/good-design)
- [NN/g: 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [GOV.UK Government Design Principles](https://www.gov.uk/guidance/government-design-principles)
- [Butterick: Summary of key rules](https://practicaltypography.com/summary-of-key-rules.html)
- [Laws of UX](https://lawsofux.com/)
- [Smashing Magazine: Five-Second Testing (case study)](https://www.smashingmagazine.com/2023/12/five-second-testing-case-study/)
- [WCAG 2.2 Understanding documents](https://www.w3.org/WAI/WCAG22/Understanding/)
- [Shneiderman: Eight Golden Rules](https://www.cs.umd.edu/~ben/goldenrules.html)
- [WCAG 2.2: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [The Vignelli Canon (PDF)](https://www.rit.edu/vignellicenter/sites/rit.edu.vignellicenter/files/documents/The%20Vignelli%20Canon.pdf)
- Refactoring UI (Wathan, Schoger)
