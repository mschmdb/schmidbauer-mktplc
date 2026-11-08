# Known false positives

Some patterns fire on correct prose. This file applies to every language. Read it before rewriting a sentence that a regex linter flagged, or when a pattern match feels wrong.

## Patterns to weigh, not auto-cut

- **C8, colon into a triple:** technical text lists three real things all the time.
- **C9, stranded auxiliary:** a normal contrast in spoken register.
- **D1, overused vocabulary:** one `pivotal` in a text is not evidence. Three on a page are.

Everywhere else: if the move is present, the sentence is weaker with it than without it.

## Linter false positives

A regex linter, such as Simon Willison's LLM cliché highlighter, reads raw text. It knows nothing about markup, quoting or field labels. The four shapes below trip it without being defects.

### F1: List markers read as sentence openers

A bulleted list of three items looks to an anaphora check (`C5`) like three sentences that open on `-`.

```markdown
- Never let the data path depend on rendering.
- Always return a freshly computed answer.
- Write descriptions the agent can follow literally.
```

This is the correct form, and often the fix for a colon-triple (`C8`). Leave it. The same holds for numbered lists, task lists and table rows.

### F2: Field labels followed by a list

`Stack:`, `Tags:`, `Dependencies:` or `Requirements:` followed by a comma list is a data field, not the rhetorical move. `C8` needs a claim after the colon, not an inventory.

- **Move present:** `Three things make it work: separate ports, separate processes, and local state.`
- **Move absent:** `Stack: Python, FastAPI, PostgreSQL.`

Rewrite the first. Keep the second.

### F3: Direct quotes

Direct quotes are out of scope. A quoted sentence that contains a triple or a cliché is evidence, not authorship.

Exception: if the quote sits directly behind your own colon, the colon is yours. Restructure so the quote carries the sentence.

- **Before:** `People say things like: "quiet, green, close to a train station".`
- **After:** `No search box accepts "quiet, green, close to a train station".`

### F4: Code, identifiers and machine output

Function signatures, JSON, log lines, CLI output and config keys are out of scope. A linter still counts the commas in them.

## The decision rule

Two questions decide it:

1. Does the flagged span perform the move, or does its punctuation only resemble it?
2. Would a reader who does not know the pattern notice anything wrong?

If both answers are no, it is a false positive. Record the reason, move on, and leave the text alone. Never mangle correct prose to make a linter go quiet.
