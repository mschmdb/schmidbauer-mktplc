# audit.json fields

Read this when interpreting `audit.json` from `scripts/audit.mjs`.

| Field | Meaning | Rules |
|---|---|---|
| `notes` | Problems during the run (timeouts, failed viewport). Anything listed here is "Not checked" or partial. | – |
| `desktopStatus`, `mobileStatus` | HTTP status of the page load. 401/403/429 or a bot wall means the measurements show the wall, not the site. | – |
| `desktopLoadMs`, `mobileLoadMs` | Time until network idle, capped by a 60 s timeout. | 18 |
| `axe` | axe-core violations for WCAG 2.0 A/AA, 2.1 AA, 2.2 AA: id, impact, node count, examples. | 8, 23 |
| `axeIncomplete` | Checks axe could not decide (often contrast over images or gradients). Verify by hand. | 8 |
| `measure.firstViewport` | Headings, text snippets and actions (links, buttons) visible in the first desktop viewport at scroll position 0, plus whether a link or button sits in it. Basis for the first-viewport check. | 16 |
| `measure.fonts`, `sizes`, `colors` | Counts of computed values on text elements. Many distinct values point to missing tokens. | 3, 6, 7 |
| `measure.paragraphs` | Font size, line height, width and `charsPerLineEstimate` for long paragraphs. The estimate assumes 0.5 em per glyph; report it as an estimate. | 13 |
| `measure.smallTargets`, `mobileSmallTargets` | Interactive elements under 24 × 24 CSS px. WCAG 2.5.8 exempts inline links and targets with enough spacing; check before reporting. | 23 |
| `measure.headings` | Heading tag, size/weight, text. `ACCENT` marks parts styled differently from the rest of the heading. | 3, 31 |
| `measure.tells` | AI-look signals: tracked uppercase labels, middle-dot strings, arrows, mono elements, accented headings, `01`-style markers, em dashes, card-like boxes. Counts, not verdicts. | 31 |
| `measure.repeated` | Word pairs and triples that occur three or more times on the page. Includes visually hidden text such as "(opens in new tab)"; discount those before reporting. | 32 |
| `measure.reducedMotionRule`, `colorSchemeRule` | Whether any readable stylesheet mentions `prefers-reduced-motion` / `prefers-color-scheme`. Cross-origin sheets are not readable and count as absent. | 9 |
| `measure.runningAnimations`, `canvases`, `videos` | Web Animations running after load, canvas and video elements. | 9, 10 |
| `measure.hasMain`, `firstLinkText`, `lang` | Landmark, skip link candidate, document language. | 8 |
| `focus` | The first 10 Tab stops with outline and box-shadow. `outline=none` with `shadow=false` means no visible focus indicator. | 8 |
| `*ScrollShots` | File names of the scroll series. | 9, 10, 25 |

## Screenshots

- `desktop-full.png`, `mobile-full.png`: the whole page after network idle.
- `desktop-t300.png`, `-t1000`, `-t2500` (and mobile): load animation at 300, 1000 and 2500 ms after navigation. `t2500` is the first viewport for rule 16.
- `*-scroll-NN-<px>.png`: viewport after scrolling in half-viewport steps across the first four viewport heights, 1.2 s apart.
