# Report

Use this file after the measurements and the glance test. It replaces the old report steps.

## 1. Order of work
1. Measure.
2. Judge, using the measurements and crops.
3. Refute (section 7).
4. Write.

## 2. Findings and observations
- A finding needs a rule with evidence class research or convention. A failed own target that the rule marks as such also counts (P1).
- A rule of thumb yields an observation with the measured value. Never write it as a violation.
- Keep two separate lists.

## 3. Fields per finding
- Rule ID and short name, for example "H1 One primary action per view"
- Viewport: desktop, mobile or both
- Severity (section 6)
- Evidence level (section 4)
- Locator: CSS selector, or a precise description when no selector exists
- Crop: path of a cropped screenshot that shows the element
- Measured value and the reference value from the rule
- One sentence on the effect for the visitor
- One sentence on the fix direction. The audit does not redesign.

## 4. Evidence levels
- **seen in browser**: screenshot or live observation. Reliable for layout at large scale. Unreliable for small text, fine spacing and exact colour. Measure those.
- **from code**: file and line. Reliable for what the code says, not for what renders.
- **computed**: contrast, sizes, timing, counts. Reliable.
- **interpretation**: a model reading. It is an opinion. Say so.

## 5. Crops
Judge detail on crops, never on a downscaled full-page image. In one study, models located small targets on high-resolution screens in 18.9 % of cases on the whole screen and in 48.1 % after cropping (https://arxiv.org/abs/2504.07981).

Crop each element you cite. Save crops in the temp directory.

## 6. Severity
Use the NN/g scale 0 to 4. Judge by frequency, impact and persistence. Source: https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/

| Level | Meaning | Example |
|---|---|---|
| 0 | Not a problem | A deliberate departure that does not hurt the visitor |
| 1 | Cosmetic | Two card radii differ by 2 px |
| 2 | Minor | Body lines run past the line-length conventions on one page |
| 3 | Major | Three filled buttons compete in the first viewport |
| 4 | Catastrophe | The first viewport shows no h1, no action and no hint of the offer |

## 7. Refutation pass
After drafting, spawn a fresh subagent with no access to your reasoning. Give it each finding's claim, locator, crop and measured value. It tries to refute each one.

- Drop findings it refutes.
- Downgrade findings it cannot confirm to observations.

If no subagent tool exists, re-check each finding against its crop and measurement yourself. Say in the report that the pass was not independent.

```text
You review claims about a web page. For each claim below, try to refute it.
You get the claim, a locator, a cropped screenshot path and a measured value.
Open the crop. Check whether it shows what the claim says.
Check whether the measured value supports the claim.
For each claim answer one of: confirmed, refuted, cannot confirm.
Give one sentence of reason. Do not soften a refutation. Do not guess.

Claims:
<claim 1: rule, claim text, locator, crop path, measured value>
<claim 2: ...>
```

## 8. Conflicting Gestalt cues
When a finding under G1 to G6 rests on one cue, look for a competing cue (G10). Name both cues in the finding. Say which one wins by the order in G10. A finding that ignores a stronger competing cue is wrong. Drop it or turn it into an observation.

## 9. Report structure
````text
# Design audit: <site>

<One-sentence verdict.>

Scope: <URL>, <date>, viewports <desktop 1440 x 900, mobile device>. Not checked: <item and reason>.

## Glance test
<Table per viewport (glance-test.md section 10), label, proxy note if used.>

## Findings
### Severity 4 / 3 / 2 / 1
<Findings with the fields from section 3. Mark each desktop, mobile or both.>

## Observations
<Rule of thumb items and unconfirmed findings, with the measured value.>

## What works
<Short.>

## Questions for the owner
<From the O block in principles.md.>

## Biggest lever
<One change with the largest effect.>

## Limits
<Paragraph below.>
````

The limits paragraph must state:

- This is an expert-style review by a model, without users.
- Models miss issues and produce false positives. In one study GPT-4o found 21.2 % of the issues experts found, and 24.3 % of its findings were false (https://arxiv.org/abs/2506.16345). That study used an older model.
- Attention and prominence values are predictions, not eye-tracking.
- Accessibility was not audited beyond the axe floor. Point to a dedicated accessibility audit.

## 10. Earlier audit
When an earlier audit exists:

- Name what changed since then.
- Correct earlier errors openly. Do not overwrite them.

## 11. Style and saving
- Write plain and specific. Apply a writing-style skill such as no-ai-slop when installed.
- Save to `./design-audit-<yyyy-mm>.md` unless the user names another path.
- Screenshots stay in the temp directory unless the user wants them kept.
