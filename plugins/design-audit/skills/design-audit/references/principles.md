# Design principles

Rules for judging the visual design, perception, craft, copy and motion of a live website. The Gestalt block (G) is the foundation and comes first. The other blocks build on it.

## How to use the rules

Each rule carries one of three evidence classes in its **Evidence** line.

- **research**: an empirical study supports it. A violation can become a finding.
- **convention**: a documented design system or an authoritative guide states it. A violation can become a finding.
- **rule of thumb**: common practice without a citable source. It yields an observation with the measured value, never a finding.

Further conventions:

- A threshold marked "own target" is the choice of this rule set. It is not a research result.
- Cite a rule in a finding by ID and short name, e.g. "G3, common region".
- Where verified conventions disagree, the rule lists all values. Report the measured value against each. Flag only a value outside all of them.
- Rules can pull in different directions. Name the tension in the finding and judge by the page's purpose.
- Measure first, judge second. Judge detail on crops of the screenshot, not on a downscaled full page.

## G Gestalt (foundation)

Wagemans et al. 2012 split the field into perceptual grouping and figure-ground organisation. G1 to G9 apply that split to a page. G10 settles conflicts. G11 is the umbrella.

### G1 Proximity
**Principle.** Elements that sit closer together read as one group.
**Violation.** A heading sits nearer to the block above than to its own text. A form label sits nearer to the previous field than to its own. Space between sibling groups equals the space inside them.
**Check.** Heading: gap to the following block against gap to the preceding block. Form label: gap to its own field against gap to the neighbouring field. Sibling groups: inner gap against outer gap. Flag only when the inner gap is equal to or larger than the outer gap. Otherwise report the ratio. In dot lattices a ratio of about 1.5 made grouping unambiguous. Interfaces were not tested. Mobile: stacked layouts lose the side-by-side cue, so check the vertical gaps again.
**Evidence.** research. Source: [Wertheimer 1923](https://psychclassics.yorku.ca/Wertheimer/Forms/forms.htm), [Kubovy et al. 1998](https://pubmed.ncbi.nlm.nih.gov/9520318/), [NN/g proximity](https://www.nngroup.com/articles/gestalt-proximity/)

### G2 Similarity
**Principle.** Elements that look alike read as one kind. Elements that differ read as different.
**Violation.** Two buttons with the same role differ in radius, fill or weight. A decorative element looks like a link. Links in body text look like plain text.
**Check.** Count style variants per role (buttons, links, cards, headings): radius, shadow, border, fill. Question: do elements with the same job look the same, and do elements with different jobs look different?
**Evidence.** research. Source: [Wertheimer 1923](https://psychclassics.yorku.ca/Wertheimer/Forms/forms.htm), [NN/g similarity](https://www.nngroup.com/articles/gestalt-similarity/)

### G3 Common region
**Principle.** Elements inside the same bounded area read as one group.
**Violation.** A card or box wraps items that do not belong together. Related items are split across boxes. Boxes nest three or four deep without a reason.
**Check.** Nesting depth of bordered or shadowed containers. Question: does every box hold exactly one group? Does a box exist where spacing alone would group?
**Evidence.** research. Source: [Palmer 1992](https://pubmed.ncbi.nlm.nih.gov/1516361/), [NN/g common region](https://www.nngroup.com/articles/common-region/)

### G4 Connectedness
**Principle.** Elements joined by a line, a connector or a shared border read as one unit.
**Violation.** Steps of a process, timeline entries or a label and its value have no visible link. A decorative line joins items that are unrelated.
**Check.** Question: where lines or shared borders exist, do they join the items that belong together? A closed area of uniform colour is also seen as one unit first (uniform connectedness).
**Evidence.** research. Source: [Palmer & Rock 1994](https://link.springer.com/article/10.3758/BF03200760)

### G5 Continuity and alignment
**Principle.** Elements on a smooth line or a shared edge read as a sequence.
**Violation.** Items in a row sit a few pixels off each other. Many left edges compete in one column. A visual line points to something unrelated.
**Check.** Distinct left edges of text blocks, with a tolerance. Question: do the eye paths along edges lead to the content that matters? The edge count itself is an observation, not a finding.
**Evidence.** research for the principle, rule of thumb for any edge count. Source: [Wertheimer 1923](https://psychclassics.yorku.ca/Wertheimer/Forms/forms.htm)

### G6 Closure
**Principle.** People complete open shapes and prefer self-enclosed units.
**Violation.** A cropped image or card cuts through the one element that carries meaning. A carousel hides the cue that more content exists. An icon or logo needs a shape the viewer cannot complete.
**Check.** Question on the crops: does a cut-off element read as continuing, or as broken?
**Evidence.** research. Source: [Wertheimer 1923](https://psychclassics.yorku.ca/Wertheimer/Forms/forms.htm)

### G7 Figure and ground
**Principle.** The viewer separates a figure from its background. Small, convex, enclosed and surrounded shapes become the figure.
**Violation.** Text over an image has no clear separation. A modal does not dim the page behind it. Cards and background share a lightness, so nothing stands out.
**Check.** Question on crops: what is figure and what is ground, and is the intended figure the one that wins? Text over images: read `axeIncomplete`, because axe often cannot decide contrast there.
**Evidence.** research. Source: [Wagemans et al. 2012, part I](https://pmc.ncbi.nlm.nih.gov/articles/PMC3482144/)

### G8 Common fate
**Principle.** Elements that move alike read as one group.
**Violation.** Items of one group animate with different timing or direction. Unrelated items move together.
**Check.** Compare the scroll series and the load frames. Question: does the motion follow the grouping, or cut across it?
**Evidence.** research. Source: [Wertheimer 1923](https://psychclassics.yorku.ca/Wertheimer/Forms/forms.htm)

### G9 Symmetry and parallelism
**Principle.** Symmetric or parallel contours read as one group.
**Violation.** Parallel columns or cards of the same role differ in width or height without a reason. A symmetric layout breaks by a few pixels.
**Check.** Question: do parallel elements share size and spacing? Small deviations are more visible than large ones.
**Evidence.** research (secondary attribution). Source: [Wagemans et al. 2012, part I](https://pmc.ncbi.nlm.nih.gov/articles/PMC3482144/)

### G10 Conflicting cues
**Principle.** When grouping cues disagree, the stronger cue decides. The verified order:
- Common region can overcome proximity and similarity.
- Uniform connectedness beats similarity and weak proximity. Strong proximity is as fast as connectedness.
- Proximity and similarity trade off. There is no fixed rank between them.
- Weak cues that agree add up to a strong grouping.
- Closure can dominate continuity.
- Grouping strength falls with relative distance. The 1.5 distance ratio comes from dot lattices, not interfaces.

**Violation.** Cues point at different groupings: a box (G3) encloses items that proximity (G1) splits, or colour (G2) joins items that spacing separates.
**Check.** Where a finding under G1 to G6 rests on one cue, look for a conflicting cue. Name both cues in the finding and say which one wins by the order above.
**Evidence.** research. Source: [Palmer 1992](https://pubmed.ncbi.nlm.nih.gov/1516361/), [Han, Humphreys & Chen 1999](https://pubmed.ncbi.nlm.nih.gov/10370335/), [Wagemans et al. 2012, part II](https://pmc.ncbi.nlm.nih.gov/articles/PMC3728284/), [Kubovy et al. 1998](https://pubmed.ncbi.nlm.nih.gov/9520318/)

### G11 Simplicity (Prägnanz)
**Principle.** People see the simplest organisation the conditions allow. Every element needs a reason.
**Violation.** Elements, boxes or effects that no cue or content needs.
**Check.** Umbrella idea, not scored on its own. Cite G1 to G10 for the concrete cue. As a single law Prägnanz failed for its vagueness.
**Evidence.** research (umbrella). Source: [Wagemans et al. 2012, part I](https://pmc.ncbi.nlm.nih.gov/articles/PMC3482144/)

On screens the direct evidence is thin. One study found that spatial grouping and icons each sped up visual scanning (Niemelä & Saarinen 2000, [abstract](https://pubmed.ncbi.nlm.nih.gov/11324855/)). Wertheimer also names direction, objective set and past experience. They are too weak for a check.

## T Typography

### T1 Families and weights
**Principle.** Few typefaces and weights keep a page coherent.
**Violation.** Three or more families in body content. Ultralight, Thin or Light weights in text.
**Check.** Count families (icon fonts excluded) and weights. Butterick: most documents tolerate a second font, few a third. Apple asks to minimise typefaces and avoid Ultralight, Thin and Light. No source gives a maximum count, so a count alone is an observation.
**Evidence.** convention for the family guidance and light weights, rule of thumb for counts. Source: [Butterick, mixing fonts](https://practicaltypography.com/mixing-fonts.html), [Apple HIG typography](https://developer.apple.com/design/human-interface-guidelines/typography)

### T2 Sizes and scale
**Principle.** Sizes follow one scale, so steps look intentional.
**Violation.** Many sizes with ratios that do not repeat. Neighbouring sizes so close that they read as a mistake.
**Check.** Distinct font sizes, the ratio between neighbouring sizes, the h1 to body ratio. Any single ratio is allowed. Material 3 uses 15 styles on a 1.125 scale with base 14. No source gives a maximum count.
**Evidence.** convention for a modular scale, rule of thumb for counts. Source: [A List Apart](https://alistapart.com/article/more-meaningful-typography/), [Material 3 type scale](https://m3.material.io/styles/typography/type-scale-tokens)

### T3 Line length
**Principle.** Lines of moderate length read comfortably.
**Violation.** Body lines far wider or narrower than the conventions.
**Check.** Measure characters per line in body text and report the value against all three conventions. Butterick: 45 to 90. Material 3: 40 to 60. Baymard: 50 to 75, ceiling 80. Flag only values outside all three. `measure.paragraphs[].charsPerLine` holds the measured median of full lines. Scope: running text only. Skip one-line blocks (`lines: 1`) and card snippets under about 3 lines; they are not body text. No verified figure exists for mobile.
**Evidence.** convention. Source: [Butterick](https://practicaltypography.com/line-length.html), [Material 3](https://m3.material.io/foundations/layout/breakpoints/overview), [Baymard](https://baymard.com/blog/line-length-readability)

### T4 Line height
**Principle.** Body text needs leading in proportion to its size.
**Violation.** Body text set tight or loose far outside the range.
**Check.** Line height of body paragraphs against 120 to 145 %. Headings and display type: no verified number, observation only. WCAG 1.4.8 (AAA) asks for at least 150 %. Cite it as the stricter reference only. Body text at 150 % is no finding, and accessibility is out of scope here.
**Evidence.** convention. Source: [Butterick, line spacing](https://practicaltypography.com/line-spacing.html)

### T5 Body size
**Principle.** Body text is large enough for the device.
**Violation.** Body text below the convention on the target device.
**Check.** Report the body size against: web 15 to 25 px (Butterick); GOV.UK type scale starts at 16 px; iOS default 17 pt, minimum 11 pt. Flag only values outside the cited range for the platform. Zoom of inputs below 16 px on iOS is widely reported but has no verified source.
**Evidence.** convention. Source: [Butterick, point size](https://practicaltypography.com/point-size.html), [GOV.UK type scale](https://design-system.service.gov.uk/get-started/new-type-scale/), [Apple HIG typography](https://developer.apple.com/design/human-interface-guidelines/typography)

### T6 Tracking of capitals
**Principle.** Capitals need extra letter-spacing.
**Violation.** All-caps text without tracking.
**Check.** Letter-spacing on uppercase text against 5 to 12 % of the font size. The violation is missing tracking. No source sets an upper limit beyond the cited range, so values above 12 % are an observation.
**Evidence.** convention. Source: [Butterick, letterspacing](https://practicaltypography.com/letterspacing.html)

### T7 Justified and centred text
**Principle.** Justified text needs hyphenation. Long centred text is hard to scan.
**Violation.** Justified text without hyphenation leaves rivers. Several lines of centred body text.
**Check.** Justified paragraphs and their `hyphens` value. Centred paragraphs longer than three lines. The centred-text part has no verified source and stays an observation.
**Evidence.** convention for hyphenation, rule of thumb for centred text. Source: [Butterick, justified text](https://practicaltypography.com/justified-text.html)

### T8 Font loading and layout shift
**Principle.** Fonts load without making the layout jump.
**Violation.** Text reflows after the font swaps. Fonts ship in heavy formats without `font-display`.
**Check.** The script does not measure this. Compare the load frames for text that reflows. With a repository, check for WOFF2, `font-display` and `size-adjust` on the fallback. Cumulative layout shift counts as good at 0.1 or less and poor above 0.25.
**Evidence.** convention. Source: [web.dev CLS](https://web.dev/articles/cls), [web.dev font best practices](https://web.dev/articles/font-best-practices)

## S Spacing and layout

### S1 Spacing scale
**Principle.** Spacing values come from one scale.
**Violation.** Many one-off values, such as 13, 17 and 22 px in the same page.
**Check.** Measure the page against its own scale. Report the number of distinct spacing values and the share that fits a 4 px step and a 5 px step. No pass or fail. Design systems differ: Atlassian (base 8 with 2, 4, 6), Carbon, USWDS (multiples of 8 with a 4 half step), Tailwind (4 px), GOV.UK (5, 10, 15, 20 and up).
**Evidence.** convention, scale choice is free. Source: [Atlassian](https://atlassian.design/foundations/spacing), [Carbon](https://carbondesignsystem.com/elements/spacing/overview/), [USWDS](https://designsystem.digital.gov/design-tokens/spacing-units/), [Tailwind](https://tailwindcss.com/docs/theme), [GOV.UK](https://design-system.service.gov.uk/styles/spacing/)

### S2 Section rhythm and density
**Principle.** Spacing between sections is regular, and density fits the page type.
**Violation.** Section paddings jump without a reason. A message page packs its content tightly. A tool wastes the screen on whitespace.
**Check.** Section paddings in order, whitespace share and edge density as observations. Desktop layouts can use more generous spacing than mobile ones (Material 3). No source gives a whitespace share or a maximum count of spacing values.
**Evidence.** rule of thumb. Source for the desktop and mobile difference: [Material 3 spacing](https://m3.material.io/foundations/layout/grids-spacing/spacing)

### S3 Margins around text
**Principle.** Text with margins reads better.
**Violation.** Text runs to the edge of the viewport or its box.
**Check.** Side margin of text blocks, and on mobile the margin to the viewport edge. One small study (n = 19) found comprehension of 5.1 with margins against 4.4 of 8 without (p = .01), with reading somewhat slower. Leading had no effect there. Treat the study as weak.
**Evidence.** research (small). Source: [Wichita State study](https://web.archive.org/web/20170426011344/http://psychology.wichita.edu/surl/usabilitynews/62/whitespace.asp)

### S4 Container width
**Principle.** The content container has a defined maximum width.
**Violation.** Text and layout stretch across a wide viewport without a limit.
**Check.** Container width at 1440 px against the systems: Bootstrap 540 / 720 / 960 / 1140 / 1320 px; GOV.UK 1020 px with a text column up to about 75 characters. Report the value, flag only extreme widths together with a line length outside T3.
**Evidence.** convention. Source: [Bootstrap](https://getbootstrap.com/docs/5.3/layout/containers/), [GOV.UK layout](https://design-system.service.gov.uk/styles/layout/)

### S5 Consistency of repeated components
**Principle.** Repeated components share the same padding, gap and structure.
**Violation.** Cards of one list differ in padding or radius. The same component differs between pages.
**Check.** Variants of padding, radius and shadow within one component type. Question: is each difference intended?
**Evidence.** rule of thumb. Cite G2 when the variants confuse the roles.

### S6 Breakpoints and reflow
**Principle.** The layout adapts at defined widths.
**Violation.** Layout breaks between breakpoints. Horizontal scroll appears on mobile.
**Check.** Compare the desktop and mobile series. `design.overflow` lists elements that pass the viewport width. Material 3 breakpoints: compact under 600, medium 600 to 839, expanded 840 to 1199, large from 1200 dp.
**Evidence.** convention. Source: [Material 3 breakpoints](https://m3.material.io/foundations/layout/breakpoints/overview)

### S7 Form labels
**Principle.** A label placed above its field is scanned faster.
**Violation.** Left-aligned labels beside fields of a long form.
**Check.** Label position. Eye-tracking in a small study found about 50 ms for a label above the field against 500 ms for a left-aligned label beside it. Sample size not stated. Mobile: one column.
**Evidence.** research (small) for label position, convention for one column. Source: [UXmatters](https://www.uxmatters.com/mt/archives/2006/07/label-placement-in-forms.php), [Baymard](https://baymard.com/blog/avoid-multi-column-forms)

## C Colour

### C1 Neutrals dominate
**Principle.** A neutral base with accents used sparingly keeps the colour meaningful.
**Violation.** Many saturated hues compete. Accent colour covers most of the page.
**Check.** Hue families above a chroma threshold in the computed colours, accent colours on interactive elements. Carbon: neutral grey dominant, other colours "sparingly and purposefully". Refactoring UI: greys 8 to 10 shades, primary 5 to 10. No source supports a fixed hue cap or 60-30-10, so report the count as an observation.
**Evidence.** convention for the principle, rule of thumb for counts. Source: [Carbon colour](https://carbondesignsystem.com/elements/color/overview/), [Refactoring UI](https://www.refactoringui.com/previews/building-your-color-palette)

### C2 Accent with meaning
**Principle.** An accent colour marks the one thing that matters.
**Violation.** The accent decorates headings, icons and borders alike and loses its signal.
**Check.** Where the accent appears compared with where the primary action sits. Question: does the accent point to the action?
**Evidence.** rule of thumb.

### C3 Lightness per role
**Principle.** Colours of one role share a lightness, so they read as a set.
**Violation.** Status or category colours differ so much in lightness that one outshouts the rest.
**Check.** Lightness spread per role in OKLCH. OKLab predicts perceived lightness well. No source gives a threshold, so report the spread. Harmony in a lab study was highest for the same hue and fell as hue difference grew. No study supports contrasting hues as harmonious, and no study supports "colour psychology".
**Evidence.** convention (OKLab), research (lab study). Source: [Ottosson, OKLab](https://bottosson.github.io/posts/oklab/), [Harmony study](https://pmc.ncbi.nlm.nih.gov/articles/PMC3037488)

### C4 Colour is never the only cue
**Principle.** Colour is never the only cue for a state or a meaning. About 8 % of men and 0.5 % of women of Northern European ancestry have a red-green deficiency.
**Violation.** Error, status or selection shown by colour alone. Links in text with no other cue.
**Check.** Question on the screenshot: if the page were greyscale, would states and links remain distinguishable? Contrast belongs to the accessibility audit (A1).
**Evidence.** research for prevalence. Source: [Colour vision deficiency](https://pmc.ncbi.nlm.nih.gov/articles/PMC12385717/)

### C5 Black, dark mode and taste
**Principle.** Colour choices serve the audience. No single colourfulness is optimal.
**Violation.** Pure black type or surfaces that look unnatural. A forced dark theme with no switch.
**Check.** True black "tends to look pretty unnatural" (Refactoring UI), a practice note and not a defect. Light polarity helps acuity for small text, so offer a switch. Preferred colourfulness varies with country, gender and education (about 40,000 people). Report the Hasler-Süsstrunk colourfulness value as an observation. It correlates r = .71 with perceived colourfulness of websites.
**Evidence.** research for the dark-mode and colourfulness data, convention for the black note. Source: [NN/g dark mode](https://www.nngroup.com/articles/dark-mode/), [Reinecke & Gajos 2013](https://kgajos.seas.harvard.edu/papers/reinecke13aesthetics.pdf), [Reinecke & Gajos 2014](https://www.eecs.harvard.edu/~kgajos/papers/2014/reinecke14visual.shtml), [Refactoring UI](https://www.refactoringui.com/previews/building-your-color-palette)

## H Hierarchy

### H1 One primary action per view
**Principle.** One action stands out in each view.
**Violation.** Several filled, primary-looking buttons compete in the first viewport.
**Check.** Count filled primary-looking buttons per viewport. Question: which action does the eye find first, and is it the right one?
**Evidence.** rule of thumb. Cite G2 and G7 for the cue.

### H2 Hierarchy survives greyscale and blur
**Principle.** Order comes from size, weight and spacing first. Colour supports it.
**Violation.** The order disappears when colour is removed or the page is blurred.
**Check.** View the greyscale and blurred first viewport. Question: do the same elements still lead? The prominence ranking (area, contrast, type size, position) is a prediction, not eye-tracking.
**Evidence.** rule of thumb.

### H3 One key message per area
**Principle.** Each area has one message with strong size contrast against its details.
**Violation.** Three headings of similar size share a viewport. The key message is the same size as its caption.
**Check.** Elements within 20 % of the largest visual weight in the first viewport. h1 to body ratio from T2.
**Evidence.** rule of thumb. The 20 % is an own target.

### H4 Nothing without a reason
**Principle.** Every element serves content or a cue.
**Violation.** Decorative boxes, icons, badges or lines that no cue (G1 to G10) or content needs.
**Check.** Question: what is lost if this element goes?
**Evidence.** rule of thumb. Cite G11.

## P Perception and orientation

### P1 Five-second rule
**Principle.** After 5 seconds on the first viewport, a first-time visitor can name the type of site, say what it offers and for whom, and find the primary action.
**Violation.** The visitor cannot name the site type, the offer or the audience, or does not find the action.
**Check.** Follow [glance-test.md](glance-test.md). Run it on desktop and mobile separately. The 5 seconds are this rule set's own target. People recognise the category of a page at a glance (47 % correct after 120 ms against 10 % chance). Naming its purpose improves from 2 s to 10 s of viewing, and the first 10 seconds decide whether a visitor stays. The 5 seconds of the five-second test are convention.
**Evidence.** convention (the test), own target (the rule). Source: [Smashing Magazine](https://smashingmagazine.com/2023/12/five-second-testing-case-study), [page category at a glance](https://pmc.ncbi.nlm.nih.gov/articles/PMC5945715/), [NN/g time on page](https://www.nngroup.com/articles/how-long-do-users-stay-on-web-pages/)

### P2 First viewport
**Principle.** The value proposition and primary action sit in the first viewport.
**Violation.** The first viewport holds only a logo, an image or a banner. A clean section edge at the fold suggests the page ends there (false floor).
**Check.** h1 present, its size and word count, share covered by image, video, canvas or large inline svg (a decorative canvas behind the text counts; read it with `textOverImage`), overlay or banner area, content that appears after 1000 ms (`design.firstViewport`). Desktop: 57 % of viewing time above the fold, 74 % in the first two screenfuls. No verified fold figure exists for mobile, so ask the same question on the mobile viewport.
**Evidence.** research. Source: [NN/g scrolling and attention](https://www.nngroup.com/articles/scrolling-and-attention/)

### P3 Placement
**Principle.** Key content and the primary action sit left or centre. The logo sits top left.
**Violation.** Key content in a right rail or in an area that looks like an ad. The logo on the right.
**Check.** Position of the primary action and the logo. Viewing time leans left (80 % on the left half in one study of 120+ users). Brand recall was 39 % for a left logo against 21 % for a right one. Banner blindness was replicated since 1997. On mobile UIs gaze has a top-left bias.
**Evidence.** research. Source: [NN/g left bias](https://www.nngroup.com/articles/horizontal-attention-leans-left/), [NN/g logo placement](https://www.nngroup.com/articles/logo-placement-brand-recall/), [NN/g banner blindness](https://www.nngroup.com/articles/banner-blindness-old-and-new-findings/), [Gaze on mobile UIs](https://arxiv.org/abs/2101.09176)

### P4 Headings carry the content
**Principle.** People scan. Headings and short blocks carry the message.
**Violation.** Long paragraphs without subheads. Headings that say nothing on their own.
**Check.** Read only the headings. Question: do they tell the story? Short paragraphs, subheads and lists. In a 1997 study 79 % scanned. The F-pattern is a rough tendency. Do not check for an F shape.
**Evidence.** research. Source: [NN/g how users read](https://www.nngroup.com/articles/how-users-read-on-the-web/), [NN/g scanning patterns](https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/)

### P5 Recognisable links and buttons
**Principle.** Links and buttons look clickable without hover.
**Violation.** Flat styling where a button looks like a label. Link labels such as "More".
**Check.** Question on the screenshot: can I tell what is clickable? Link text is specific on its own. Weak signifiers cost 22 % more time on page in one study (71 users).
**Evidence.** research for weak signifiers, convention for link labels. Source: [NN/g flat UI](https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/), [NN/g information scent](https://www.nngroup.com/articles/information-scent/)

### P6 Navigation
**Principle.** Navigation is visible, shallow and predictable.
**Violation.** Main links hidden behind a menu on desktop. Deep menus. The first click for the main task is not obvious.
**Check.** Desktop: main links visible. Hidden navigation was used by 27 % against 48 % when visible, and was at least 39 % slower. Mobile: show a few key links beside the menu (57 % hidden against 86 % combined). A bar holds 3 to 5 destinations (Material 3). Few levels: greater depth hurt in a study, medium breadth beat the broadest. A correct first click goes with 87 % against 46 % task success, an association and not a law.
**Evidence.** research. Source: [NN/g hamburger menus](https://www.nngroup.com/articles/hamburger-menus/), [Material 3 navigation bar](https://m3.material.io/components/navigation-bar/guidelines), [Microsoft Research](https://www.microsoft.com/en-us/research/publication/web-page-design-implications-memory-structure-scent-information-retrieval/), [MeasuringU](https://measuringu.com/?p=193)

### P7 Informative images
**Principle.** Images carry information.
**Violation.** Decorative stock photos fill the space where content belongs.
**Check.** Question per image: what does it tell the visitor? Informative photos get looks and decorative stock gets skipped. Text and images draw gaze on mobile UIs.
**Evidence.** research. Source: [NN/g photos](https://www.nngroup.com/articles/photos-as-web-content/), [Gaze on mobile UIs](https://arxiv.org/abs/2101.09176)

### P8 Mobile targets and chrome
**Principle.** Touch targets are large and spaced, and chrome stays small next to content.
**Violation.** Small, tight targets. Large banners and interstitials. Carousels with autoplay. Multi-column forms.
**Check.** Target size against: 1 cm by 1 cm with about 2 mm gap (NN/g); 48 by 48 dp with 8 dp gap (Material 3); 44 by 44 pt (Apple). Measure against the conventions with `mobile.measure.touchTargets`, which lists elements under 44 by 44 CSS px (an own value between the Apple and Material sizes). `smallTargets` lists elements under 24 by 24 CSS px, the WCAG 2.5.8 floor and an own screening value, not a convention. A project decision that meets 24 px is not a failure of the floor, but still a finding against the conventions when the elements are primary controls. Banners take "a small fraction of the screen". Carousels: at most 5 frames, no autoplay on mobile. Sessions last 72 s on mobile against 150 s on desktop. Fewer than half of people hold the phone with one hand, so do not use thumb-zone maps.
**Evidence.** convention. Source: [NN/g touch target](https://www.nngroup.com/articles/touch-target-size/), [Material 3 structure](https://m3.material.io/foundations/designing/structure), [Apple HIG accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Google interstitials](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials), [NN/g carousels](https://www.nngroup.com/articles/designing-effective-carousels/), [NN/g mobile UX](https://www.nngroup.com/articles/mobile-ux/), [UXmatters grip study](https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php)

## K Craft

K leads with positive craft. The generic-AI-look traits are secondary evidence.

### K1 Positive craft
**Principle.** A crafted page shows decisions at the level of detail.
**Violation.** Detail is missing where a designer would have chosen: straight quotes, a hyphen for a range, undesigned empty and error states.
**Check.** Look for the signs. Copy and imagery specific to the content. Section layouts that vary with their content. Curly quotes, real ellipsis, balanced rag, tabular figures, tracked capitals. Designed empty, error and loading states. Styled `::selection`, focus rings that fit the corner radius. Motion by purpose (M1).
**Evidence.** convention. The sources are practitioner guidelines, not studies. Source: [Vercel web interface guidelines](https://vercel.com/design/guidelines), [Rauno Freiberg, interfaces](https://github.com/raunofreiberg/interfaces), [Butterick](https://practicaltypography.com/summary-of-key-rules.html), [Emil Kowalski](https://emilkowal.ski/ui/you-dont-need-animations)

### K2 Default or decision?
**Principle.** Every element is a decision for this project, not a default.
**Violation.** Traits of the generic AI look with no reason from the project. Attested traits: purple or indigo gradients, Inter, Roboto or a system font as the only face, the fixed skeleton (centred hero, pill badge, three identical icon cards, social proof, call to action), unmodified shadcn or Tailwind defaults, invented stats, logo walls and testimonials. Further tells: one headline word styled differently, an uppercase eyebrow over every heading, middle-dot strings, "→" on links, `01 02 03` markers with no sequence, one radius and shadow for everything, fade-and-slide on every section.
**Check.** Counts in `measure.tells` are signals, not verdicts. Ask "default or decision?" and answer from the project's `DESIGN.md` or stated direction. That document is the reason to look for. A trait the project explains is not a finding. A trait with no reason counts as an observation. Glassmorphism, bento grids and mesh backgrounds are disputed, so do not flag them. A fixed list ages, because banning one default moves models to the next likely look. The durable test is the question.
**Evidence.** rule of thumb. The trait list comes from a prompt guide and one analysis of launch pages, not from studies. Source: [Anthropic, prompting for frontend aesthetics](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics), [Krebs, design slop](https://www.adriankrebs.ch/blog/design-slop/)

### K3 Corporate design, convention and tension
**Principle.** A given corporate design overrides K. Fidelity to it comes first.
**Violation.** A finding that asks a brand to drop its own colours, type or layout.
**Check.** With a corporate design, judge fidelity to it. Then judge craft inside what it leaves open. Conventional structure is fine: prototypical layouts with low visual complexity rate as most appealing (partial η² .58 for complexity, .81 for prototypicality). Distinctiveness belongs in type, imagery, content and detail. Tension: lines instead of boxes (G3, S5) and a restrained palette (C1) sit close to two generic clusters (cream background with serif display; newspaper layout with hairlines and zero radius). The rules do not contradict each other. Each use needs a reason from the project.
**Evidence.** research for the layout finding. Source: [Tuch et al. 2012](https://research.google/pubs/pub38315/)

## W Copy

### W1 Users' words
**Principle.** The page uses the words its users use.
**Violation.** Internal jargon, product codenames or buzzwords in headings and calls to action.
**Check.** Question: would a first-time visitor use this word? Link and button labels are specific (P5).
**Evidence.** convention. Source: [NN/g usability heuristics, match with the real world](https://www.nngroup.com/articles/ten-usability-heuristics/)

### W2 No AI slop
**Principle.** Copy is concrete and specific to this product.
**Violation.** Stacks of three adjectives. Staged rhetoric: manufactured depth, staged reveals, "not X, but Y". Brochure phrases. Invented figures.
**Check.** Read headings, intro and calls to action. Quote the phrase in the finding. Apply the no-ai-slop pattern list where the skill is installed.
**Evidence.** rule of thumb.

### W3 Repetition budget
**Principle.** A figure used once is voice. Used three times it is a tic.
**Violation.** The same claim, figure or phrase repeats across sections.
**Check.** `measure.repeated` lists word pairs and triples that occur three or more times. Discount visually hidden text such as "(opens in new tab)" and navigation.
**Evidence.** rule of thumb. The count of three is an own target.

## M Motion

### M1 Purposeful and short
**Principle.** Motion has a purpose and stays short. It is absent from frequent actions.
**Violation.** Fade-and-slide on every section. A hover effect on every card. Long transitions on actions a user repeats.
**Check.** Compare the load frames (300, 1000, 2500 ms) and the scroll series. `runningAnimations`, `canvases` and `videos` list what runs after load. Question: what does each motion tell the user?
**Evidence.** rule of thumb.

### M2 Reduced motion
**Principle.** Non-essential motion stops or changes under `prefers-reduced-motion: reduce`. Motion never carries meaning alone.
**Violation.** No reduced-motion rule. Auto-starting motion that runs longer than five seconds without a way to pause.
**Check.** `measure.reducedMotionRule`. Cross-origin sheets are unreadable and count as absent, so verify before reporting. The accessibility audit (A1) covers the details.
**Evidence.** rule of thumb.

### M3 Scroll-driven timing
**Principle.** Content is readable without waiting for an animation.
**Violation.** Content hidden until a scroll trigger fires late. Content invisible in the full-page capture.
**Check.** Content that appears after 1000 ms (`design.firstViewport.lateContent`). Whether content that starts hidden shows in the scroll series. Link to G8 when groups move apart.
**Evidence.** rule of thumb.

## A Accessibility floor

### A1 Floor, not audit
**Principle.** axe-core results are a floor. They find a part of the problems and never prove accessibility.
**Violation.** Any `axe` violation. Open items in `axeIncomplete`.
**Check.** Report `axe` violations and `axeIncomplete` as they are. This rule set does not audit accessibility. State in the report that a dedicated accessibility audit is needed.
**Evidence.** rule of thumb.

## O Questions for the owner

A URL cannot answer these. List them in the report. They are not scored.

- Which user needs does the site serve, and how does the team know?
- Has the site been tested with real users? What did the tests show?
- In which context do people use it: device, place, time pressure, experience?
- Who is the intended audience, and what is the purpose of the first viewport? The glance test needs both.
- Is there a corporate design, `DESIGN.md` or stated direction that K should use as the reason?

## Do not use

These claims circulate widely. Research does not support them, so never base a finding on them.

- Gutenberg diagram: no empirical test found.
- 3-click rule: [no data supports it](https://www.nngroup.com/articles/3-click-rule/).
- 7±2 for menus: [a misreading of memory research](https://www.nngroup.com/articles/short-term-memory-and-web-usability/). No evidence for any item limit.
- Thumb-zone maps and "primary actions belong at the bottom": the author corrected his own 2013 map.
- 60-30-10 and "accent at most 10 %".
- Colour psychology ("blue builds trust") and any fixed hue cap.
- The F-pattern as a design goal. It is a rough tendency, not a target.
- "Users decide in 50 ms whether to stay": the study measured appeal ratings.
