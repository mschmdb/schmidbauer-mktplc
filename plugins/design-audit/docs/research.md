# Research base for design-audit 2.0

Collected 2026-11-14. This file is the evidence the rules rest on. It is development documentation and does not ship inside a skill.

## How to read it

Every statement carries two labels.

**Evidence class**

- **R** research: an empirical study.
- **C** convention: a documented design system or an authoritative guide.
- **T** rule of thumb: common practice without a citable source.

**Check status**

- **V** verified: someone opened the source in this session and saw the statement.
- **U** unverified: from memory, a search snippet or a secondary summary.

Rules for the skills:

- Only R and C statements may produce a finding. T statements produce an observation with the measured value.
- The skills cite no U source. A U statement may shape a check, but the rule text does not name the source.
- Thresholds marked "own" are this project's choice and say so.

## 1. Gestalt principles

Wagemans et al. 2012 separate two phenomena: perceptual grouping and figure-ground organisation. The rule set follows that split.

### Grouping

| Principle | Source | Definition | Status |
|---|---|---|---|
| Proximity | Wertheimer 1923 | Closer elements group. | R, V |
| Similarity | Wertheimer 1923 | Like elements group. | R, V |
| Common fate | Wertheimer 1923 | Elements that move alike group. | R, V |
| Good continuation | Wertheimer 1923 | A smooth line or curve reads as one unit. | R, V |
| Closure | Wertheimer 1923 | Self-enclosed units win over alternatives. | R, V |
| Symmetry, parallelism | Listed by Wagemans 2012 | Symmetric or parallel contours group. | R, V (secondary attribution) |
| Common region | Palmer 1992 | Elements inside the same bounded area group. | R, V (abstract) |
| Element connectedness | Palmer & Rock 1994 | Elements that share a border or a connector group. | R, V |
| Uniform connectedness | Palmer & Rock 1994 | A closed region of uniform colour or texture is seen as one unit first. The authors call it an entry-level principle, not a grouping factor. | R, V (abstract) |

Wertheimer also names direction, objective set and past experience. They are too weak for a check.

### Figure and ground

Classic cues: convexity, symmetry, small area, surroundedness. Newer cues: lower region, top-bottom polarity. On a web page: cards and buttons (small, convex, enclosed), a modal on a dimmed backdrop (surrounded), text over an image (figure must separate from ground). R, V (Wagemans 2012, section 5).

### Prägnanz

The tendency toward the simplest organisation the conditions allow (Koffka, quoted in Wagemans). As a single unifying law it "failed because of its vagueness"; later work tries to formalise it. Use it as the umbrella idea, not as a check. R, V.

### When cues conflict

- Common region can overcome proximity and similarity (Palmer 1992, abstract). R, V.
- Uniform connectedness beats similarity and weak proximity. Strong proximity is as fast as connectedness (Han, Humphreys & Chen 1999, abstract). R, V.
- Proximity and similarity combine additively. There is no fixed rank between them (Kubovy & van den Berg 2008, via Wagemans). R, V (secondary).
- Weak cues that agree add up to a strong grouping (Wagemans 2012, 4.4.2). R, V.
- Closure can dominate continuity (Wertheimer; confirmed by Wagemans). R, V.
- Grouping strength falls off exponentially with relative distance. Grouping along the longer distance is almost never seen once the distance ratio exceeds about 1.5 (Kubovy, Holcombe & Wagemans 1998, via Wagemans). Stimuli were dot lattices, not interfaces. R, V (secondary).

### Not Gestalt

"Focal point" is visual hierarchy. Wagemans does not list it. "7±2" is a memory finding. Neither belongs in the Gestalt block.

### Evidence on screens

Thin. One verified study: spatial grouping and icons each sped up visual scanning (Niemelä & Saarinen 2000, abstract, n not stated). R, V. NN/g gives practice checks without data (C, V): proximity, similarity, common region as articles; closure, continuation, common fate and figure-ground as videos.

### Sources

- Wagemans et al. 2012, part I: https://pmc.ncbi.nlm.nih.gov/articles/PMC3482144/
- Wagemans et al. 2012, part II: https://pmc.ncbi.nlm.nih.gov/articles/PMC3728284/
- Wertheimer 1923, English translation: https://psychclassics.yorku.ca/Wertheimer/Forms/forms.htm
- Palmer 1992: https://pubmed.ncbi.nlm.nih.gov/1516361/
- Palmer & Rock 1994: https://link.springer.com/article/10.3758/BF03200760
- Han, Humphreys & Chen 1999: https://pubmed.ncbi.nlm.nih.gov/10370335/
- Kubovy, Holcombe & Wagemans 1998: https://pubmed.ncbi.nlm.nih.gov/9520318/
- Niemelä & Saarinen 2000: https://pubmed.ncbi.nlm.nih.gov/11324855/
- NN/g proximity: https://www.nngroup.com/articles/gestalt-proximity/
- NN/g similarity: https://www.nngroup.com/articles/gestalt-similarity/
- NN/g common region: https://www.nngroup.com/articles/common-region/

## 2. Typography

| Check | Value | Class | Status | Source |
|---|---|---|---|---|
| Typefaces | "Most documents can tolerate a second font. Few can tolerate a third." | C | V | https://practicaltypography.com/mixing-fonts.html |
| Typefaces | "Minimize the number of typefaces you use" (no number) | C | V | https://developer.apple.com/design/human-interface-guidelines/typography |
| Weights | Avoid Ultralight, Thin and Light. No source gives a maximum count. | C (light weights), T (count) | V | Apple HIG, same URL |
| Distinct sizes | No source gives a maximum. Material 3 has 15 baseline styles on a 1.125 scale with base 14. | T (count), C (scale) | V | https://m3.material.io/styles/typography/type-scale-tokens |
| Scale | A modular scale with one ratio; any ratio is allowed. | C | V | https://alistapart.com/article/more-meaningful-typography/ |
| Line length | 45 to 90 characters | C | V | https://practicaltypography.com/line-length.html |
| Line length | 40 to 60 characters | C | V | https://m3.material.io/foundations/layout/breakpoints/overview |
| Line length | 50 to 75, ceiling 80 (rests on Ruder, no own data) | C | V | https://baymard.com/blog/line-length-readability |
| Line height | 120 to 145 % for body text | C | V | https://practicaltypography.com/line-spacing.html |
| Body size, web | 15 to 25 px | C | V | https://practicaltypography.com/point-size.html |
| Body size, iOS | Default 17 pt, minimum 11 pt | C | V | Apple HIG typography |
| Caps tracking | 5 to 12 % extra letter-spacing for all caps | C | V | https://practicaltypography.com/letterspacing.html |
| Justified text | Needs hyphenation | C | V | https://practicaltypography.com/justified-text.html |
| Layout shift | CLS good at 0.1 or less, poor above 0.25 | C | V | https://web.dev/articles/cls |
| Font loading | WOFF2, `font-display`, `size-adjust` for the fallback | C | V | https://web.dev/articles/font-best-practices |

Not supported, report as observation only:

- A hard maximum for weights or sizes.
- Display-type leading and tracking numbers.
- "Mobile 30 to 50 characters".
- iOS zooming into inputs below 16 px: well attested in blogs, no Apple or WebKit source found. T, U.
- Serif against sans on screen. No universal best font (Wallace et al. 2022, U).
- The reading studies by Dyson, Ling & van Schaik, Rello and Beymer were blocked. U. Do not cite.

## 3. Spacing and layout

| Check | Value | Class | Status | Source |
|---|---|---|---|---|
| Spacing scale | Base 8 px: 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80 | C | V | https://atlassian.design/foundations/spacing |
| Spacing scale | 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160 | C | V | https://carbondesignsystem.com/elements/spacing/overview/ |
| Spacing scale | Multiples of 8 with a 4 px half step | C | V | https://designsystem.digital.gov/design-tokens/spacing-units/ |
| Spacing scale | 4 px steps (`--spacing: 0.25rem`) | C | V | https://tailwindcss.com/docs/theme |
| Spacing scale | 5, 10, 15, 20, 25, 30, 40, 50, 60 px. Not a multiple of 4. | C | V | https://design-system.service.gov.uk/styles/spacing/ |
| Spacing by viewport | "Desktop layouts can use more generous spacing than mobile layouts" | C | V | https://m3.material.io/foundations/layout/grids-spacing/spacing |
| Proximity | Space inside a group is smaller than space between groups. Ratio of about 1.5 makes the grouping unambiguous. | R (dot lattices) | V (secondary) | Kubovy et al. 1998 via Wagemans 2012 |
| Margins | Text with margins: comprehension 5.1 against 4.4 of 8 (p = .01), reading somewhat slower (p = .07). Leading had no effect on performance. n = 19. | R | V | https://web.archive.org/web/20170426011344/http://psychology.wichita.edu/surl/usabilitynews/62/whitespace.asp |
| Container width | 540 / 720 / 960 / 1140 / 1320 px | C | V | https://getbootstrap.com/docs/5.3/layout/containers/ |
| Container width | 1020 px, text column up to about 75 characters | C | V | https://design-system.service.gov.uk/styles/layout/ |
| Breakpoints | Compact under 600, medium 600 to 839, expanded 840 to 1199, large from 1200 dp | C | V | https://m3.material.io/foundations/layout/breakpoints/overview |
| Labels in forms | Label above the field: 50 ms saccade. Left-aligned label beside the field: 500 ms. n not stated. | R (small) | V | https://www.uxmatters.com/mt/archives/2006/07/label-placement-in-forms.php |

Consequences:

- Measure the page against its own scale. Report the share of spacing values that fit a 4 px or 5 px step and the number of distinct values. No pass or fail.
- Flag proximity only when the inside gap is equal to or larger than the outside gap. Report the ratio otherwise.

Not supported:

- "90 % of values are multiples of 4", "at most 10 to 12 spacing values", "4 to 6 left edges", "40 % whitespace". T, own.
- "Whitespace raises comprehension by 20 %". The Chaparro abstract has no such figure.
- Ngo's balance formula: correlation with human ratings r = .05 (Zen & Vanderdonckt 2016, n = 15). Do not use.
- Tullis, Parush and Coursaris on density and alignment: U.

## 4. Colour

| Check | Value | Class | Status | Source |
|---|---|---|---|---|
| Palette | Greys 8 to 10 shades, primary 5 to 10 shades, accents used sparingly | C | V | https://www.refactoringui.com/previews/building-your-color-palette |
| Palette | Neutral grey dominant, other colours "sparingly and purposefully" | C | V | https://carbondesignsystem.com/elements/color/overview/ |
| Black | "True black tends to look pretty unnatural" | C | V | Refactoring UI preview, same URL |
| Harmony | Harmony is highest for the same hue and falls as hue difference grows. No support for contrasting hues as harmonious. Lab study, not websites. | R | V (partial text) | https://pmc.ncbi.nlm.nih.gov/articles/PMC3037488 |
| Colourfulness | The Hasler-Süsstrunk metric alone correlates r = .71 with perceived colourfulness of websites; Reinecke's model reaches R² = .78. | R | V | https://kgajos.seas.harvard.edu/papers/reinecke13aesthetics.pdf |
| Preference | Preferred colourfulness and complexity vary with country, gender and education (about 40,000 people). No universal optimum. | R | V (abstract) | https://www.eecs.harvard.edu/~kgajos/papers/2014/reinecke14visual.shtml |
| Colour meaning | Colour-emotion associations share a pattern across 30 nations and still differ by nation. | R | V (abstract) | https://eprints.whiterose.ac.uk/id/eprint/169496/ |
| Dark mode | Light polarity helps acuity for small text. Let users switch. | R + C | V | https://www.nngroup.com/articles/dark-mode/ |
| Colour vision | Red-green deficiency: about 8 % of men and 0.5 % of women of Northern European ancestry | R | V | https://pmc.ncbi.nlm.nih.gov/articles/PMC12385717/ |
| Lightness | OKLab predicts perceived lightness well. No source gives a spread threshold. | C | V | https://bottosson.github.io/posts/oklab/ |

Not supported, report as observation only:

- 60-30-10 and "accent at most 10 %".
- Any fixed cap on hues.
- Complementary, triadic or split-complementary schemes as good.
- Colour psychology ("blue builds trust").
- Pure black on pure white as a defect. Practice only.
- A single optimal colourfulness.

## 5. First impression and five-second comprehension

| Finding | Number | Class | Status | Source |
|---|---|---|---|---|
| Appeal ratings after 50 ms match those after 500 ms | r = .947, n = 40 | R | V | https://www.makinggood.ac.nz/media/1265/lindegaardetal_2006_attention.pdf |
| Low visual complexity and high prototypicality rate as most appealing | Partial η²: complexity .58, prototypicality .81; n = 59 and 82 | R | V | https://research.google/pubs/pub38315/ |
| Colourfulness and complexity plus demographics explain about half the variance in appeal | 548 raters, 450 sites | R | V (abstract) | https://www.eecs.harvard.edu/~kgajos/papers/2013/reinecke13predicting.shtml |
| Design look is the most mentioned credibility cue | 46.1 % of comments, n = 2,684 | R | V | https://advocacy.consumerreports.org/research/how-do-people-evaluate-a-web-sites-credibility |
| Same content with better styling rates as more credible | p < .001, small effect, n = 20 | R | V | https://www.makinggood.ac.nz/media/1276/robinsholmes_2008_aestheticsandcredibilityinwebdesign.pdf |
| Page category recognised at a glance | 47 % correct at 120 ms against 10 % chance | R | V | https://pmc.ncbi.nlm.nih.gov/articles/PMC5945715/ |
| The first 10 seconds decide whether a visitor stays | 205,873 pages | R | V | https://www.nngroup.com/articles/how-long-do-users-stay-on-web-pages/ |
| Naming a page's purpose improves from 2 s to 10 s of viewing. The 5 seconds of the five-second test are convention. | – | C | V (secondary) | https://smashingmagazine.com/2023/12/five-second-testing-case-study |

What these studies do not show: they measure appeal and rated credibility on desktop screenshots, mostly with students. None measures comprehension, task success or mobile.

**Rule that follows (own target, not a finding):** after 5 seconds on the first viewport, a first-time visitor can name the type of site, say what it offers and for whom, and find the primary action. Checked separately on desktop and mobile.

**Tension with "does not look generic":** conventional layouts rate best. Keep structure conventional. Put distinctiveness into type, imagery, content and detail.

Myths to keep out of the rules:

- "8-second attention span": no underlying research found. U.
- "Users decide in 50 ms whether to stay": Lindgaard measured appeal ratings, not staying.
- "53 % leave after 3 seconds": a load-time figure, not comprehension. U.

## 6. Attention and orientation

All from NN/g unless stated, R, V.

| Finding | Number | Check | Source |
|---|---|---|---|
| Viewing time leans left | 80 % on the left half (2017, 120+ users) | Key content and the primary action sit left or centre. | https://www.nngroup.com/articles/horizontal-attention-leans-left/ |
| Viewing time above the fold | 57 % above the fold, 74 % in the first two screenfuls, 81 % in three (2018, desktop) | Value proposition and primary action in the first viewport. | https://www.nngroup.com/articles/scrolling-and-attention/ |
| False floor | No test, a stated warning | The viewport edge must not cut a section cleanly; content visibly continues. | same |
| Scan patterns | F-pattern is a rough tendency (2006, 232 users); layer-cake pattern follows headings | Headings carry the content on their own. Do not check for an F shape. | https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/ |
| People scan | 79 % scanned (1997) | Short paragraphs, subheads, lists. | https://www.nngroup.com/articles/how-users-read-on-the-web/ |
| Banner blindness | Replicated since 1997 | Key content is not in a right rail and does not look like an ad. | https://www.nngroup.com/articles/banner-blindness-old-and-new-findings/ |
| Photos | Informative photos get looks, decorative stock gets skipped (2010) | Images carry information. | https://www.nngroup.com/articles/photos-as-web-content/ |
| Weak signifiers | 22 % more time on page (2017, 71 users) | Links and buttons are recognisable without hover. | https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ |
| Hidden navigation | Desktop: used by 27 % when hidden, 48 % when visible; at least 39 % slower. Mobile: 57 % hidden, 86 % combined (2016, 179 users) | Desktop: main links visible. Mobile: a few key links visible beside the menu. | https://www.nngroup.com/articles/hamburger-menus/ |
| Logo placement | Brand recall 39 % for left against 21 % for right (128 users) | Logo top left. | https://www.nngroup.com/articles/logo-placement-brand-recall/ |
| First click | 87 % task success after a correct first click against 46 % (Bailey); 78 % against 70 % in a second data set | The first click for the main task is obvious. Association, not a law. | https://measuringu.com/?p=193 |
| Link labels | Guidance, no data | A label is specific on its own; no "More". | https://www.nngroup.com/articles/information-scent/ |
| Menu structure | Greater depth hurt; medium breadth beat the broadest | Few levels. | https://www.microsoft.com/en-us/research/publication/web-page-design-implications-memory-structure-scent-information-retrieval/ |

Do not use:

- Gutenberg diagram: no empirical test found.
- 3-click rule: no data supports it (https://www.nngroup.com/articles/3-click-rule/).
- 7±2 for menus: a misreading of memory research (https://www.nngroup.com/articles/short-term-memory-and-web-usability/). No evidence for any item limit.
- Hick and Fitts: scope is choice among familiar items and pointing time. Not opened. U.

## 7. Mobile

| Finding | Value | Class | Status | Source |
|---|---|---|---|---|
| Grip | Fewer than 50 % hold with one hand; 75 % touch with one thumb. People prefer the centre and tap it most accurately. | R (observation, 1,333 + 651) | V | https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php |
| Target size | 1 cm × 1 cm, about 2 mm apart | C | V | https://www.nngroup.com/articles/touch-target-size/ |
| Target size | 48 × 48 dp for touch, 8 dp apart | C | V | https://m3.material.io/foundations/designing/structure |
| Target size | 44 × 44 pt default | C | V | https://developer.apple.com/design/human-interface-guidelines/accessibility |
| Reading | Comprehension on mobile about equal to desktop; hard text is read slower (276 people) | R | V | https://www.nngroup.com/articles/mobile-content/ |
| Sessions | 72 s on mobile against 150 s on desktop. Keep chrome small against content. | R | V | https://www.nngroup.com/articles/mobile-ux/ |
| Navigation bar | 3 to 5 destinations | C | V | https://m3.material.io/components/navigation-bar/guidelines |
| Interstitials | A banner takes "a small fraction of the screen" | C | V | https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials |
| Carousels | At most 5 frames, no autoplay on mobile | C | V | https://www.nngroup.com/articles/designing-effective-carousels/ |
| Forms | One column | C | V | https://baymard.com/blog/avoid-multi-column-forms |
| Body text | Scale starts at 16 px | C | V | https://design-system.service.gov.uk/get-started/new-type-scale/ |
| Gaze on mobile UIs | Top-left bias; text and images draw gaze (30 people, 193 UIs) | R | V (abstract) | https://arxiv.org/abs/2101.09176 |

Do not use: thumb-zone maps and "primary actions belong at the bottom". Hoober 2017 corrects his own 2013 map. The fold figures above are desktop data; no verified mobile fold figure exists.

## 8. Computed measures

| Measure | Validity | Cost in Node | Decision |
|---|---|---|---|
| Colourfulness (Hasler & Süsstrunk) | r = .71 with perceived colourfulness of websites | trivial with `sharp` | implement, report value |
| Complexity from DOM counts (text groups, image areas, text and non-text area) | Reinecke model R² = .65 on 421 sites; coefficients not published | moderate | implement counts, no score |
| Edge density | AIM definition, no validity number found | trivial | implement, report value |
| Compressed file size per pixel | r = .34 in one study | trivial | skip |
| Whitespace share, distinct left and top edges | no validation | trivial | implement, observation only |
| Prominence ranking (area × contrast × type size × position) | not validated | trivial | implement, label as prediction |
| Ngo balance, symmetry, proportion | r = .05 to .29 with human ratings | trivial | skip |
| Saliency networks (UMSI++, MSI-Net) | CC .83 on UI screenshots | heavy, no ONNX export | skip |

Every one of these is a prediction or a regression estimate. No report calls them eye-tracking.

## 9. Reliability of model-run audits

| Finding | Number | Status | Source |
|---|---|---|---|
| Model critique quality against designers (Gemini Pro Vision) | 0.31 zero-shot, 0.48 few-shot, designers 0.75 | V | https://arxiv.org/abs/2407.08850 |
| GPT-4o heuristic evaluation against experts | 21.2 % of expert issues found; 24.3 % of its findings false | V | https://arxiv.org/abs/2506.16345 |
| Locating small targets on high-resolution screens | 18.9 % whole screen, 48.1 % after cropping | V | https://arxiv.org/abs/2504.07981 |
| Agent usability scores against 17 designers | AUC 0.607; designers agree with each other at α = .308 | V | https://arxiv.org/html/2604.26020v1 |

Procedure that follows:

1. Measure first, judge second.
2. Every finding names a selector, a cropped screenshot and the measured value.
3. Judge detail on crops, never on a downscaled full-page image.
4. A fresh context tries to refute each finding and drops what it cannot confirm.
5. Severity on the NN/g scale 0 to 4 (https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/).
6. The report states it is an expert-style review without users.

## 10. Generic AI look

Sources are blogs plus Anthropic's own prompt guide. The trait lists are class T. The pages named below were opened in this session (V); they are practitioner writing, not studies.

- Best attested traits not in the old rule 31: purple or indigo gradients; Inter, Roboto or a system font as the only face; the fixed skeleton (centred hero, pill badge, three identical icon cards, social proof, call to action); unmodified shadcn or Tailwind defaults; invented stats, logo walls and testimonials.
- Disputed: glassmorphism, bento grids, mesh backgrounds.
- Whack-a-mole: banning one default moves models to the next most probable look. Three sources report it. A fixed list ages. The durable question is "default or decision?", answered from a written project direction.
- Anthropic's guide: https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics
- Largest data set: https://www.adriankrebs.ch/blog/design-slop/

Positive craft evidence (C, V; from Vercel's guidelines, Rauno Freiberg, Butterick's summary of key rules at https://practicaltypography.com/summary-of-key-rules.html, Emil Kowalski):

- Content-specific copy and real imagery.
- Section layouts that vary with their content.
- Typographic detail: curly quotes, real ellipsis, balanced rag, tabular figures, tracked caps.
- Designed empty, error and loading states.
- Motion by purpose and frequency; none on frequent actions.
- Small touches: styled `::selection`, focus rings that fit the radius.

Sources: https://vercel.com/design/guidelines, https://github.com/raunofreiberg/interfaces, https://emilkowal.ski/ui/you-dont-need-animations

Copy: "Match between the system and the real world" is heuristic 2 of NN/g's ten usability heuristics (C, V): https://www.nngroup.com/articles/ten-usability-heuristics/

## 11. Taking in a given design

| Fact | Status | Source |
|---|---|---|
| Design Tokens format 2025.10 is the first stable version. Files end in `.tokens` or `.tokens.json`; a token has `$value` and optional `$type`. | V | https://www.designtokens.org/tr/2025.10/format/ |
| Style Dictionary v4 supports the format; full 2025.10 support is planned for v5. | V | https://styledictionary.com/info/dtcg/ |
| Figma's MCP server exposes `get_variable_defs`, `get_design_context`, `get_screenshot`. | V | https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/ |
| Tailwind v4 defines tokens in `@theme`; they compile to CSS variables. | V | https://tailwindcss.com/docs/theme |
| Google's `design.md` spec is alpha: YAML front matter for tokens, fixed section order, a lint command. | V | https://github.com/google-labs-code/design.md |

Reliability order for intake: machine-readable tokens, then a live site ("observed"), then a PDF read as page images, then screenshots ("estimated").

## Still unverified

Refactoring UI beyond the colour preview; the reading studies by Dyson, Ling & van Schaik, Rello and Beymer; Tullis and Parush on density and alignment; Roth on object placement; Material 3 colour roles and compact margins; Apple HIG layout margins; Scholarpedia's Gestalt article.
