# Presenting the result

Write the report in the language the user writes in. Technical terms, severities and verdicts stay English.

```
## Codex Review · finder <finder model> · verifier <verifier model> · reasoning <effort or "config default">

**Verdict:** <APPROVE | REQUEST_CHANGES | NEEDS_DISCUSSION>
**Checked:** <n> confirmed · <n> refuted · <n> uncertain · <n> dropped below confidence threshold · <n> not verified (over cap)
<one escalation line from references/escalation.md, if any>

### CRITICAL (n)
- path:line · issue. Fix: …

### MAJOR (n)
- …

### MINOR / NITPICK (n)
- show all if 5 or fewer, otherwise the first 3 and the count

### Uncertain (n)
- path:line · issue. Verifier: <what is missing>

### Refuted (n)
- path:line · issue. Verifier: <evidence>

### Spec drift (finder only, not verified)
- file · expected … · actual … · justified: yes/no/unclear
```

Variants:

- `--quick`: replace the **Checked** line with "Quick mode: finder only, no verifier, confidence threshold 0.8." List the findings under their finder severity.
- Verifier failed or returned unusable output: show the finder's findings marked **unverified** and say why in one line.
- Same model for finder and verifier (catalog unavailable): add "Verifier ran on the finder's model in a fresh context; independence is reduced."
- Leave out empty sections.

## Your own assessment

Directly after the report, add a short assessment, but only where you disagree with the verifier: you reject a confirmed finding, or you reinstate a refuted one. Each disagreement needs evidence from the code, the spec or a test, not an opinion. You probably wrote the code under review; that is the bias this skill exists to counter. So the verifier's verdict is the default, and your deviation is the justified exception. If you agree with everything, write nothing here.
