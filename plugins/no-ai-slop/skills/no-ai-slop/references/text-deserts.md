# Text deserts

A text desert is information written as a row of sentences that a table, list, chart or key figure would show faster.

Each sentence can be clean and true. The reader still has to rebuild in their head the structure the writer had and threw away.

Readers skim. They look at the first line, the bold words and anything that is not a paragraph, and then they stop. Write for that reader.

The German shapes and the German example live under `G13` in `patterns-de.md`.

## Rules

1. **Lead with the answer.** The first thing on the page is a table, a chart, key figures or one sentence of at most 25 words that answers the reader's question. Background comes later or not at all.
2. **Numbers are not prose.** More than two figures in one paragraph is a table, a chart or a row of key figures in disguise. Build that, then delete the paragraph.
3. **Pick the form from the shape of the data:**

| Content | Form |
|---|---|
| Several items measured on the same attributes | table |
| Options compared on one scale | bar chart, or a sorted table |
| Change over time | line chart, or a table with one row per period |
| Dates, deadlines, phases | timeline, or a dated list |
| Steps in order | numbered list |
| Three or more parallel points | bulleted list |
| Two to four headline figures | key figures: the number in bold, a label, one line of context |
| Status per item | one line per item with a status word |
| A flow or dependency without data | diagram |

4. **Text says what the structure cannot.** One or two sentences per table or chart: what it means for this reader, and why. Never repeat in prose the values the table already shows.
5. **The deletion test.** For every sentence: if I delete it, does the reader lose a fact, a reason or a decision? No: delete it.
6. **Templates are not exempt.** Boilerplate sections and "we always have this chapter" text pass the deletion test or move to an appendix.

The numeric limits in this file are default rules of thumb, and a project can set its own:

- opening: at most 25 words of prose before the answer
- figures: at most 2 per paragraph
- prose: at most 120 words per section without a table, list or picture

These rules cut structure, not content. Every number, source and caveat from the prose version must survive in the new form (see "What not to strip" in `SKILL.md`). Converting prose into a table is no licence to add rows, columns or totals the source did not contain.

## Shapes to spot

- Three or more figures in one paragraph (counts, percentages, amounts, durations).
- The same attributes repeated for several items: "A costs X and takes Y. B costs Z and takes W."
- A status update written as an essay: done, in progress and blocked items in running text.
- A paragraph of more than about 120 words with no list, table or heading near it.
- An opening paragraph that builds up context before it gives the answer.
- A summary paragraph that restates the figures of the table directly above it.

## Not a text desert

- An argument, a reason or a narrative. Causal chains read better as prose than as bullets.
- One or two figures that support a sentence: "Load time dropped from 4.1 s to 0.9 s."
- A short reply in chat where a table would be heavier than the answer.
- Text whose target medium cannot render tables (a plain-text commit subject, an SMS). Use a list or line breaks instead.

## Accessibility

A table or chart replaces prose, not information.

- Tables get a header row. Do not merge cells to build layouts.
- Charts get a text alternative that states the finding, plus a caption. Offer the data as a table for screen readers.
- Do not encode a status by colour alone; pair it with a word or an icon with a label.

## Count instead of estimating (optional)

For a Markdown draft, `scripts/desert_check.py` counts figures per paragraph, the length of the opening and the words per section without a table, list or picture:

```bash
python3 "${CLAUDE_SKILL_DIR}/scripts/desert_check.py" draft.md
```

Exit code 1 means at least one limit failed.

- **Limits:** the defaults above. Change them with `--max-figures`, `--max-opening-words` and `--max-section-words`.
- **Skipped:** lists, tables, images, code, inline code and front matter. Blockquotes count as prose.
- **By hand:** the deletion test, repetition between text and table, and any draft outside Markdown.

## Example: status update

Before (68 words, 6 figures in one paragraph):

> This sprint went fairly well overall. The team closed 14 of the 18 planned tickets, which is a completion rate of 78%. Two tickets carried over because the payment API was not ready, and the other two were blocked by missing designs. Test coverage rose from 61% to 67%. We also fixed 9 bugs that came in from support during the sprint, which took more time than expected.

After:

> Sprint result: 14 of 18 tickets closed. The rest are blocked.
>
> | Metric | Value |
> |---|---|
> | Tickets closed | 14 of 18 (78%) |
> | Test coverage | 61% to 67% |
> | Support bugs fixed | 9 |
>
> Open tickets:
>
> - 2 wait for the payment API
> - 2 wait for designs

What changed:

- The answer moved to the first line.
- The figures went into a table; the prose keeps only the reason.
- The blockers became a list, so the reader sees who to chase.
- "Went fairly well overall" failed the deletion test.
- "More time than expected" was cut because the source gives no number for it. Had the reader needed it, the right move would be to ask for the figure, not to invent one.
- No figure was added, and every figure from the source survives.
