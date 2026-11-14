# Glance test

This is the procedure behind rule P1 (five-second rule). After 5 seconds on the first viewport, a first-time visitor can name the type of site, say what it offers and for whom, and find the primary action. The 5 seconds are this rule set's own target.

Label the result in the report: "Simulated glance test with AI observers, not a user test".

## 1. Why blind observers

You know the URL, the code and the whole page. Your own reading of the first viewport is contaminated. Fresh subagents that see only the image give a cleaner reading.

## 2. Inputs

- Use the first-viewport screenshot per viewport (desktop and mobile), taken 2500 ms after navigation. The audit script writes them. `audit-output.md` lists the exact file names.
- Copy each to a neutral name in the temp directory, for example `a.png` for desktop and `b.png` for mobile. A file name must leak nothing.

## 3. Observers

- Spawn 3 fresh subagents per viewport. Spawn 5 when the user asks for a stricter run.
- Give each one only the image path and the prompt in section 4. No URL, no domain, no code, no page text, no hint about the purpose.
- Run the observers independently. Do not show one observer another's answers.
- If the harness has no subagent tool, say so in the report and mark P1 as "not checked". Do not answer the questions yourself.

## 4. Observer prompt

```text
Read the image at <path>. Look at it once, as a first-time visitor would, for about five seconds.
Answer from your overall impression. Do not transcribe small print.
Do not guess. Answer "cannot tell" when you cannot tell.
Use only what the image shows. Do not use any knowledge of a brand beyond the image.
Answer these questions one at a time, in this order. Keep each answer to one or two sentences.
1. What do you remember from this page?
2. What kind of site is this?
3. What does it offer?
4. Who is it for?
5. What would you click or tap first?
6. What, if anything, is unclear or confusing?
```

Replace `<path>` with the neutral file path.

## 5. Ground truth

- Use the owner's stated purpose, audience and primary action when available. Ask through the O questions in `principles.md`.
- Otherwise use the title, meta description and h1 as a proxy. State in the report that a proxy was used.

## 6. Scoring

Score each observer on three items: site type and offer (questions 2 and 3), audience (question 4), first action (question 5).

| Score | Meaning |
|---|---|
| 3 | Correct and specific |
| 2 | Correct but generic |
| 1 | Wrong |
| 0 | Cannot tell |

Aggregate per viewport and item:

- Median score.
- Share of observers who score 2 or higher.
- Pass when at least 2 of 3 observers (3 of 5) score 2 or higher. A single outlier is noise.

Questions 1 and 6 do not score. Read them for what stood out and what confused. Quote them in findings.

## 7. Explain a failure with measurements

For each failed item, check the first-viewport measurements described in `audit-output.md`. Do not invent field names. Look for:

- h1 missing from the first viewport, its size and word count
- several elements of similar visual weight (H3)
- several primary-looking buttons (H1)
- share of the viewport covered by image or video
- an overlay or banner covering content
- content that appears after 1000 ms
- a headline that names no product or category

Cite the matching rule (P2, H1, H3) next to P1 in the finding.

## 8. Brand control

When the logo is a widely known brand, observers may recognise it from the image. Note this in the report. The result then overstates clarity.

## 9. Limits

State these in the report:

- Models read small text better than a glancing human.
- Models know brands.
- Models are not the target audience.
- Models give no timing evidence. The 5 seconds are an instruction, not a measurement.
- Reported agreement between model scores and designers is weak (AUC 0.607; designers agree with each other at alpha = .308, https://arxiv.org/html/2604.26020v1).

Recommend a real five-second test with people from the target audience when:

- observers disagree
- an item fails
- the page matters commercially

Do not name a participant number as fact. Tool vendors recommend between 5 and 30 depending on the question (unverified: not in research.md, so state it as vendor advice).

## 10. Result in the report

- Add a small table per viewport:

```text
| Item | Scores | Result |
|---|---|---|
| Site type and offer | 3, 2, 3 | pass |
| Audience | 1, 0, 2 | fail |
| First action | 2, 2, 3 | pass |
```

- Add findings under P1 for each failed item, with the explaining measurement from section 7.
- Add the label from the top of this file and the limits from section 9.
