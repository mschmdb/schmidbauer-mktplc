---
name: no-ai-slop
description: Writing rules against AI-sounding prose and fabricated claims, with pattern catalogues for English and German and a method for other languages. This skill should be used when writing or editing text meant for people (READMEs, docs, ADRs, commit messages, PR descriptions, UI copy, error messages, emails, reports) and when reviewing a text that sounds machine-written. It covers filler, nominal style, passive voice, rhetorical cliché moves, unsupported absolutes, unverified numbers and invented APIs. Not for code identifiers, logs, JSON or YAML, or direct quotes.
license: MIT
metadata:
  version: "1.0.0"
---

# No AI Slop

Rules for prose that people read. Treat a violation as a bug: fix it before delivering the text.

## Precedence

The user's instructions and the project's style guide override every default in this skill. If an override conflicts with a rule here, mention the conflict once, then follow the instruction.

## House style (switchable defaults)

Two rules are house style, not grammar. Both are on by default.

- **No dramatic dashes:** ${user_config.ban_dashes}
- **Sentence-length ceiling in words:** ${user_config.max_sentence_words}

If a value above is not `true`, `false` or a number, the skill runs outside the plugin: use `true` and `25`. Plugin users change both in `/config`. Anyone can also switch them off in project instructions, for example "no-ai-slop: allow em dashes".

When the dash ban is on, use no em dash (U+2014) and no spaced en dash (U+2013) as a sentence break. Use a comma, colon, period or parentheses, or restructure. A spaced hyphen is not a replacement. Hyphens in compounds and ranges stay. When the ban is off, a dash may mark a real parenthetical, but a dash used as a dramatic pause still counts as a move under the repetition budget.

## Pick the catalogue for the text's language

Detect the language of the text you write or review, then read the matching catalogue:

- **English:** read `${CLAUDE_SKILL_DIR}/references/patterns-en.md` ([link](references/patterns-en.md))
- **German:** read `${CLAUDE_SKILL_DIR}/references/patterns-de.md` ([link](references/patterns-de.md))
- **Mixed:** go by the language of the sentences, not by the loanwords. German prose full of English tech terms is German.
- **Any other language:** read the English catalogue and ask, for each move, what the local idiom for it is. Never translate the English example strings.

When to read it:

- **Reviewing, editing or rewriting a text, of any length:** always read the catalogue first. The rules in this file name the groups; only the catalogue has the shapes you need to spot them. Pattern IDs cited from memory are wrong; cite an ID only after reading its entry.
- **Writing more than a few paragraphs:** read it before the cutting pass.
- **Writing a commit message or a short reply:** this file is enough. Both catalogues use the same IDs (G1 to G11 for wording, A1 to E2 for 36 rhetorical patterns), so a rule here that cites an ID applies in every language. The German catalogue adds G12 for calques from English.

## Core rules

1. **Cut filler (G1 to G4).** If a sentence or phrase can go without losing information, delete it. This includes connectors that link nothing, stacked hedges and text that describes itself.
2. **Use verbs, not nouns (G5).** Find the verb hidden in `-ation`, `-ment` or `-ung` nouns and give it a subject. "Validation of the input is performed by the parser" becomes "The parser validates the input."
3. **Name the actor (G6).** "The token is validated by the server" becomes "The server validates the token." Keep the passive only when the actor is unknown or irrelevant.
4. **One idea per sentence (G7).** Split stacked clauses. Write full sentences with articles, not telegram style.
5. **Vary sentence length.** Stay under the ceiling from the house style, and do not aim for it. A paragraph of identical 8-word sentences reads as machine-made as one 40-word sentence (C5, C6). Mix short sentences with a few longer ones where the thought needs a clause. If a paragraph ticks like a metronome, merge two sentences.
6. **Lists for lists.** Three or more parallel items, steps, options or comparisons go into a bulleted or numbered list. Put no intro line like "Here are some things to consider:" in front of it.
7. **No buzzwords (G9).** Replace `seamless`, `robust`, `leverage` and their kin with the measurable property, or drop them. From a stack of three adjectives, keep the one you can prove.
8. **No empty openers or closers (G10).** Start with the answer. Do not summarize what the reader just read.

## Truthfulness

Never invent facts, statistics, rules, standards, API signatures, version numbers, quotes, names or sources. A confident fabrication is worse than any filler.

- **No invented numbers.** Do not write "studies show 73% of users ..." without the study. Find the source or drop the number.
- **No invented rules.** Do not cite standard clauses, RFC numbers, framework conventions or "best practices" you cannot point to.
- **No invented APIs.** Check function signatures, methods, CLI flags and config keys in the code or the docs before you name them.
- **No invented people or history.** Do not attribute quotes to real people, invent customers or case studies, or make up project background.
- **No unsupported absolutes (G11).** "The only", "the first", "best", "always", "never", "no competitor", "market-leading": back the claim with a source, narrow its scope ("the only tool we tested that ..."), or drop it.

When you are unsure, do one of three things:

1. Check: search the web, fetch the documentation, or read the source.
2. Say so: "Not verified, needs a check of X."
3. Leave the claim out.

## Length and claim ownership

One writer, many readers. A long text is cheap to produce and expensive to read.

- **Lead with the payload:** the decision, the trade-offs, what the reader has to do. Background goes below, or gets cut.
- **Match length to the decision** the text supports, not to the space available.
- **No closing summary** and no restatement of the request.
- **Mark what you did not check.** Every number, count, file name, API and behaviour claim is either verified against the source or flagged inline as "not verified". A reader cannot tell a checked sentence from a generated one.
- **Draft, then cut.** Deliver the cut version.

## Rhetorical clichés: match the move, not the words

Grammar rules catch bad sentences. This part catches sentences that are grammatically clean but perform a move instead of carrying information. These are the strongest machine-writing tells.

A cliché is a move, not a phrase. "Here's the twist:" and its German equivalent are the same defect, although they share no word. The test for every suspect sentence: does it carry information, or does it only signal that information is coming, or that it was important? A signalling sentence gets deleted or replaced by the fact it points at.

The five groups, with full shapes and fixes in the language catalogue:

- **A, manufactured profundity:** announces depth instead of stating a fact.
- **B, stage-managed reveals:** sells a surprise that is not one.
- **C, rhythm and parallelism tics:** sounds composed because it repeats a skeleton ("not just X, but Y", three sentences on the same opener, stacked rhetorical questions).
- **D, encyclopedia and brochure boilerplate:** inflated significance, unnamed experts, scene-setting openers, overused vocabulary.
- **E, chatbot leftovers:** model self-reference and pasted markup debris. Never ship these.

### The repetition budget

Frequency decides, not presence. A figure used once is voice. The same figure five times is a tic, and the tic is the tell. Count each move across the whole text, never per sentence:

- **Once:** leave it.
- **Twice:** check that both earn their place. Usually one is decoration.
- **Three or more times:** keep the instance that carries the most content and rewrite the rest.

This applies to every pattern, including buzzwords, adjective stacks, dashes and sentence rhythm. A linter reports positions, not distributions, so it cannot do this count for you.

Example: a submission used "not X, but Y" five times. Each instance read fine alone; together they made the document sound generated. The fix kept the one instance where the contrast carried a technical distinction and rewrote the other four.

Three patterns fire on legitimate prose: C8 (colon into a triple), C9 (stranded auxiliary) and single hits of D1 (overused vocabulary). Weigh these in context. Before rewriting a sentence a linter flagged, read [references/false-positives.md](references/false-positives.md).

## What not to strip

Every rule above cuts. Without a counterweight, a cleanup pass produces text that is clean, short and dead. These survive:

- **Concrete numbers.** "Load time dropped from 4.1 s to 0.9 s" beats any adjective. Never trade a number for a smoother sentence.
- **Named sources.** A name or a link turns a claim into evidence.
- **Specific verbs.** "recolors", "geocodes", "races the timer". Do not flatten them to "handles" or "processes".
- **Admitted uncertainty.** "We do not know why yet" is information. Cutting it to sound confident is fabrication in reverse.
- **One strong figure per section.** The rules target repetition, not existence.
- **The author's voice** when you edit someone else's text. Fix the defect, keep the register.

Before you delete a sentence, ask: does it carry a fact, a number, a source, an unusual verb or a real caveat? Then it stays, however it is phrased. Fix the phrasing instead.

## Workflow

### When writing

1. Apply the core rules and the truthfulness rules while drafting.
2. Make one cutting pass with the checklist below.
3. Deliver the cut version.

### When reviewing or editing a text

1. Detect the text's language, then read the matching catalogue file. Do not skip this step, even for a short text.
2. Read the whole text before changing a line.
3. Count each move across the whole text against the repetition budget.
4. Rule out false positives with [references/false-positives.md](references/false-positives.md).
5. Fix the defects and keep the author's register and every fact, number and caveat.
6. Report what you changed and why, by pattern ID, unless the user only asked for the clean text.

## Checklist

1. Could a sentence go without losing information? Delete it.
2. Is a sentence over the length ceiling, or does a paragraph tick like a metronome? Split or merge.
3. Is a verb hidden in a noun, or an actor hidden in a passive? Rewrite with subject and verb.
4. Is a list buried in prose? Make it a list.
5. Does a sentence only announce depth, a reveal or importance (A, B, D2 to D4)? Replace it with the fact it points at.
6. Does any move, figure or buzzword appear three or more times? Keep the strongest instance.
7. Is any number, file name, API or absolute claim unchecked? Verify it, flag it as "not verified", or cut it.
8. Is there a chatbot leftover or markup debris (E)? Strip it.
9. Did a cut remove a number, source, specific verb or caveat? Put it back.
10. With the dash ban on: is there a dramatic dash? Replace it.

## Scope

**Apply to:** READMEs, docs, ADRs, code comments longer than one line, commit message bodies, PR descriptions, UI copy (labels, error messages, empty states, tooltips, marketing pages), emails, chat replies, reports, and i18n message values.

**Do not apply to:** code identifiers, debug log strings, machine-readable output (JSON, YAML, SQL), direct quotes, legal and license text, and third-party API payloads.

## Sources

- Simon Willison, LLM cliché highlighter: https://tools.simonwillison.net/llm-cliche-highlighter (source: https://github.com/simonw/tools/blob/main/llm-cliche-highlighter.html, Apache-2.0)
- Wikipedia, Signs of AI writing: https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
