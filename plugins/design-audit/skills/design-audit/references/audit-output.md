# audit.json and output files

Read this when you interpret `audit.json` from `scripts/audit.mjs`. Rule IDs refer to `principles.md`. "Own value" marks a threshold or cap chosen by this rule set. It is not a convention.

Boxes are `{x, y, w, h}` in CSS pixels, in document coordinates. Screenshots use CSS pixels too, so a box fits `<viewport>-full.png` directly and `<viewport>-viewport.png` when the element sits in the first viewport. For a scroll shot, subtract its `y` from the box `y`.

## Top level

| Field | Meaning | Rules |
|---|---|---|
| `url` | The audited URL. | |
| `incomplete` | `true` when a viewport never started or its `missing` list is not empty. Report the gaps as "Not checked". | |
| `notes` | Problems during the run: unsettled page, scroll cap reached, a failed screenshot or measurement. Anything listed is partial or "Not checked". | |
| `desktop`, `mobile` | One viewport object each, same keys. `null` if the viewport never started. | |

## Per viewport (`desktop`, `mobile`)

| Field | Meaning | Rules |
|---|---|---|
| `viewport` | Width and height in CSS px. Desktop is 1440 x 900. Mobile comes from the device descriptor `device`. | P8, S6 |
| `device` | Playwright device name for mobile (iPhone 13). `null` on desktop. | |
| `userAgent` | User agent of the context. | |
| `status` | HTTP status of the load. 401, 403 or 429 means the measurements describe a wall. | |
| `timing` | `domContentLoadedMs`, `loadMs`, `settledMs`, `fontsReady`, `domQuiet`. Settled means fonts ready and 500 ms without DOM change, capped at 8 s (own values). | M3, T8 |
| `frames` | Load frames: `file`, `targetMs` (300, 1000, 2500), `atMs` (real capture time). | M1, M3, P2 |
| `fullPage`, `scrollHeight` | Full-page screenshot name and document height. The page is scrolled once first so lazy content loads (cap 30 steps, own value). `fullPage` is `null` when the capture failed twice. | |
| `missing` | Steps that failed: `fullPage`, `pixels`, `measure`, `design`, `focus`, `axe`, `frame t<ms>`, `scroll shot <y>`. Each capture is retried once after 500 ms (own value) and a failure never empties the other data. Empty when all steps worked. | |
| `scrollShots` | Scroll series: `file`, `y`. Evenly spaced, top excluded, last at the bottom, at most 12 shots including the top (own value). Empty for a one-screen page. | M1, M3, G8 |
| `measure` | Page measurements (next section). | |
| `design` | Design measurements (see below). `null` if the step failed (see `notes`, `missing`). | |
| `pixels` | Pixel measures of the first viewport (see below). | |
| `focus` | First 10 Tab stops (own value): `element`, `label`, `visible`, `via` (outline, box-shadow, border, background, color, underline, none). `visible: false` means no indicator differs from the unfocused style. | A1 |
| `axe` | Desktop only, `null` on mobile. axe-core violations for WCAG 2.0 A and AA, 2.1 AA, 2.2 AA: `id`, `impact`, `nodes`, `help`, 3 `examples`. | A1 |
| `axeIncomplete` | Desktop only. Checks axe could not decide, often contrast over images or gradients. Verify by hand. | A1, G7 |

## `measure`

| Field | Meaning | Rules |
|---|---|---|
| `title`, `lang`, `bodyBg`, `pageHeight`, `hasMain`, `firstLinkText` | Document facts. | |
| `firstViewport` | `viewport` (the configured size as `WxH`, equal to `viewport` above), `headings`, `text`, `actions` (up to 15), `hasAction`. Text, not geometry. | P1, P2 |
| `fonts`, `sizes`, `colors` | Counts of computed values on text elements. | T1, T2, C1 |
| `fontsOutsideCode` | Not in `audit.json`. Used for `tells.monoTextElements`. | |
| `paragraphs` | Up to 15 paragraphs or list items over 80 characters in the main content (own value): `fontSize`, `lineHeight`, `width`, `lines`, `charsPerLine` (median over full lines), `charsPerLineMax`, `text`. Measured per glyph, not estimated. | T3, T4, T5 |
| `smallTargets` | Targets under 24 x 24 CSS px (own screening value, the WCAG 2.5.8 minimum): `total`, `failingSpacing`, `items` (25 shown). Excluded: inline links in running text, hidden native inputs. `(spacing ok)` means no other target within a 24 px circle. | P8 |
| `headings` | One string per h1 to h4: tag, size, weight, text. ` ACCENT ` marks parts styled differently from the heading. | T2, K2 |
| `tells` | Counts of generic-look signals. Not verdicts (K2). Keys below. | K2 |
| `repeated` | `[phrase, count]` pairs of two or three words that occur 3 or more times, at most 20 (own values). Phrases come from adjacent tokens only and never span a block. A phrase of only one- or two-letter tokens is dropped. Navigation, footer and hidden text excluded. A bigram inside a surviving trigram is dropped. | W3 |
| `reducedMotionRule`, `colorSchemeRule` | A readable stylesheet mentions `prefers-reduced-motion` or `prefers-color-scheme`. Cross-origin sheets are unreadable and count as absent. | M2 |
| `runningAnimations`, `canvases`, `videos` | Web Animations running after load; canvas and video elements. | M1 |

`measure.tells` from `measure.js`: `uppercaseTrackedLabels` (+ `uppercaseLabelExamples`), `middleDotStrings`, `arrowSuffixes` (link and button labels only), `headingAccents`, `numberedMarkers` (text is exactly 01 to 09), `emDashes`, `cardLikeBoxes` (radius 6 px or more, a visible edge, height over 120 px; own values), `monoTextElements` (added by the script).

Added from the design scripts: `gradientText`, `backdropBlurElements`, `emojiIcons`, `gradientBackgrounds` (each with `...Examples` of `{selector, box, text}`, up to 5), `gradientHues` (hue bins in degrees), `mostCommonRadius` and `mostCommonShadow` (`value`, `share`, `count`), `identicalCardGroups` (three or more siblings with the same skeleton, each at least 120 x 80; `selector` is the top-left member, `parent` the container), `generator` (meta tag), `builderFingerprints` (`attributes`, `hosts`, `matched`), `defaultFontsOnly` (only Inter, Roboto, Arial, Helvetica or a system-ui entry in body text). Each is a count or a name. None says "generic".

## `design`

Every list entry carries `selector` and `box`. A group entry (`proximity.groups`, `identicalCardGroups`) carries the selector of its top-left member, its container in `parent`, and `box` of the whole group. `limits` per script: `total`, `scanned`, `capped`. Each script inspects the first 3,000 elements of `<body>` (own value). If `capped` is true, say so in the report.

| Object and fields | Meaning | Rules |
|---|---|---|
| `typography.families`, `weights`, `sizes` | Share of characters per normalised family (icon fonts excluded), weight and size. `lightWeightShare` is the share of characters set in weight 300 or lighter. | T1, T2 |
| `typography.sizeRatios` | Ratio of each size to the next smaller. Not a pass or fail. | T2 |
| `typography.bodySize`, `h1` | Body size in px; h1 selector, size, words, `ratioToBody`. | T2, T5 |
| `typography.lineHeight` | `body` and `headings`: `median` ratio, `normalCount`, `samples`. | T4 |
| `typography.uppercase` | Capitals with `letterSpacingEm`. | T6 |
| `typography.justified`, `centered` | Long text with `hyphens`, `lines`. `centered` lists only more than 3 lines. | T7 |
| `spacing` | `distinct` values, `histogram` (top 40). Margins, paddings and gaps up to 160 px are counted (own value). `fit4`, `fit5`: share on a 4 or 5 px step within 1 px. `fit4Exact`, `fit5Exact`: tolerance 0. No pass or fail. | S1 |
| `spacing.sections`, `sideMargins` | Section paddings and `paddingRange`. Smallest side margins. `narrow` lists blocks under 16 px (own screening value). | S2, S3 |
| `alignment` | Left edges of text blocks, clustered within 2 px (own value). `distinct` is a count, an observation only. | G5 |
| `proximity.headings` | `gapAbove`, `gapBelow`, `ratio`, `closerToPrevious`. | G1 |
| `proximity.labels` | The same for form labels against their field. | G1, S7 |
| `proximity.groups` | Three or more siblings: `parent`, `members`, `inner`, `outer`, `ratio`, `innerNotSmaller`. | G1 |
| `proximity.violations` | Entries where the inner gap is equal to or larger than the outer gap. The 1.5 ratio is not a threshold here. | G1 |
| `similarity.roles` | Per role (buttons, links, cards, h1 to h6): `total`, `distinct`, `dominantShare`, `differsIn`, `variants`. A variant is one combination of size, weight, colour, fill, border, radius, shadow and padding. | G2, S5 |
| `similarity.radii`, `shadows` | Distinct values, counts, `top`. | G2, K2 |
| `region` | Nesting depth of bordered or shadowed containers: `maxDepth`, `distribution`, `deep` (depth 3 or more, own value). | G3 |
| `colour` | Chroma above 0.04 counts as chromatic. Hue bins are 30 degrees (own values). `text` and `backgrounds`: `neutralShare`, `families`. `accents`: colours on buttons and links. `lightness`: OKLCH spread per role (`text`, `background`, `buttonBackground`, `linkText`). | C1, C2, C3 |
| `hierarchy.primaryButtons` | `count` and `items`: visible, filled links and buttons in the first viewport, at least 24 px high, up to 20 (own values). | H1 |
| `firstViewport` | `width`, `height` (the configured size), `h1` (`present` in the first viewport, `anywhere`), `weights`, `media`, `overlays`, `textOverImage`, `lateContent`. | P1, P2, H3 |
| `firstViewport.lateContent` | `{ referenceMs, count, items[{selector, label, box}] }`, or `null` without a usable snapshot. Lists text visible in the final measurement that was not visible in the first viewport at `referenceMs` (1000 ms). Up to 10 items. A selector that changes between 1000 ms and the end gives a false positive. | M3, P2 |
| `firstViewport.weights` | Text area x font size, a proxy for visual weight. `top` lists 10. `nearLargest` lists elements at 80 % or more of the largest (own value); `competing` is true for two or more. | H3 |
| `firstViewport.media` | `coveredShare`: image, video, canvas and background-image area on an 8 px grid. | P2 |
| `firstViewport.overlays` | Fixed or sticky elements over 10 % of the viewport (own value). | P2, P8 |
| `firstViewport.textOverImage` | Text on a background image or overlapping media (`via`). | G7 |
| `prominence` | `method` and `items` (`rank`, `selector`, `label`, `kind`, `box`, `score`, `relative`): top 8 elements by area share x contrast x type size x weight x position prior. A filled button counts with its whole box (`kind: 'button'`), other text with its text area, media with its box. A prediction, not eye-tracking. All factors are own values. | H2, P3 |
| `overflow` | `{ horizontal, documentWidth, viewportWidth, offenders[{selector, label, box}] }`. `viewportWidth` is the configured width, because mobile emulation widens `window.innerWidth` when the page overflows. `horizontal` is true when the document is wider. `offenders` lists up to 8 visible elements whose right edge passes it, widest first. Fixed elements and content inside `overflow-x: auto` or `scroll` containers are skipped. | S6 |

## `pixels`

Measured on `<viewport>-viewport.png`. Thresholds are own values.

| Field | Meaning | Rules |
|---|---|---|
| `file`, `greyFile`, `blurFile` | The three screenshot names. | H2, C4 |
| `colourfulness` | Hasler and Süsstrunk measure. 0 is grey, about 100 is vivid. | C1 |
| `edgeDensity` | Share of pixels with a Sobel magnitude above 128. | S2 |
| `whitespaceShare` | Share of pixels within RGB distance 12 of the dominant background colour. It is not "empty space": a photo can count. | S2 |

## Files

| File | Shows |
|---|---|
| `<viewport>-t300.png`, `-t1000`, `-t2500` | Load frames, taken from the first paint at 300, 1000 and 2500 ms. |
| `<viewport>-viewport.png` | First viewport after the page settled, at scroll 0. Pixel measures and the design boxes refer to it. |
| `<viewport>-viewport-grey.png`, `-viewport-blur.png` | Greyscale copy and Gaussian blur (sigma 8) of it. |
| `<viewport>-full.png` | Whole page after a scroll pass. |
| `<viewport>-scroll-NN-<y>.png` | Viewport at scroll offset `y`, 1.2 s after scrolling. |

`<viewport>` is `desktop` or `mobile`.

Crop for evidence, with 16 px padding (own value), clamped to the image. It prints the region and exits 1 if the box lies outside:

```bash
node scripts/crop.mjs <png> <x> <y> <w> <h> <out.png>
```

## `measure.js` on its own

Evaluated in another browser tool, `measure.js` returns the raw object. Differences from `measure` in `audit.json`:

- `contentText` and `fontsOutsideCode` are present. `repeated` and `tells.monoTextElements` are missing.
- All design `tells` keys are missing.
- `design`, `pixels`, `focus`, `axe`, `timing` and all screenshots are missing.
- The first-viewport size is `window.__auditViewport` (`{width, height}`) when the caller sets it. Otherwise it is `clientWidth` by `innerHeight`.
