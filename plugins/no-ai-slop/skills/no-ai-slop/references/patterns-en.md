# English patterns

Pattern catalogue for English text. The German catalogue (`patterns-de.md`) uses the same IDs, so a rule in `SKILL.md` that cites `C4` means the same move in both languages.

Every entry has three parts:

- **Move:** what the sentence does. This part transfers across languages.
- **Shapes:** how the move shows up in English. These are examples, not a blocklist.
- **Fix:** what to write instead.

Match the move, never the example string. A sentence can perform `B1` without containing a single word listed under it.

Part 1 covers wording and grammar (G1 to G11, plus G13 for structure; G12 is German-only). Part 2 covers rhetorical clichés (A1 to E2, 36 patterns). Known false positives live in `false-positives.md`.

---

## Part 1: Wording and grammar

### G1: Filler phrases

- **Move:** words that delay the statement without adding to it.
- **Shapes:** `It's important to note that ...` `Basically, ...` `Essentially, ...` `In essence, ...` `At the end of the day, ...` `It should be noted that ...` `Needless to say, ...`
- **Fix:** delete the phrase and start with the statement. If the sentence is empty without it, delete the sentence.

### G2: Transitions that connect nothing

- **Move:** a connector that signals logic the text does not have.
- **Shapes:** `Furthermore,` `Moreover,` `Additionally,` `In addition to this,`
- **Fix:** keep a connector only if it expresses a real contrast, cause or sequence (`but`, `because`, `then`). Otherwise start the sentence with its subject.

### G3: Stacked hedging

- **Move:** two or more hedges on one claim, so the claim says nothing.
- **Shapes:** `perhaps possibly` `it could be argued that` `some might say` `it may potentially`
- **Fix:** one hedge where the uncertainty is real, and name its source (`untested on Windows`). No hedge where you know the answer.

### G4: Self-reference

- **Move:** the text describes itself instead of doing its job.
- **Shapes:** `This section will discuss ...` `In this document, we will ...` `Let's dive into ...` `As mentioned above, ...`
- **Fix:** delete. Headings already tell the reader what a section covers.

### G5: Nominal style

- **Move:** verbs turned into nouns (`-ation`, `-ment`, `-ance`, `-ity`), carried by an empty verb.
- **Shapes:** `The utilization of caching for the optimization of performance ...` `Validation of the input is performed by the parser.` `We made a decision to ...` `perform an analysis of`
- **Fix:** find the hidden verb and give it a subject. `The parser validates the input.` `We decided to ...` `Caching makes the page load faster.` Two such nouns in one sentence is the signal to rewrite.

### G6: Passive voice that hides the actor

- **Move:** the sentence omits who acts, although the actor matters.
- **Shapes:** `It is recommended that users update their passwords.` `The token is validated by the server.` `Mistakes were made.`
- **Fix:** name the actor. `Update your password.` `The server validates the token.` Keep the passive when the actor is unknown or irrelevant: `The file was deleted in 2019.`

### G7: Nested sentences

- **Move:** several clauses stacked into one sentence, so the reader holds three ideas at once.
- **Shapes:** `The service, which is responsible for authentication and which also manages sessions, sends a token, whereupon the client stores it so that subsequent requests can be authenticated.`
- **Fix:** one idea per sentence, in full sentences. `The auth service manages sessions and sends a token. The client stores the token and sends it with every later request.` Do not overcorrect into a row of four-word sentences (see `C5`, `C6`).

### G8: Dashes as dramatic pauses

- **Move:** an em dash or a spaced en dash that stages a pause instead of joining clauses.
- **Shapes:** `The feature is done (em dash) except for the tests.` `We shipped it (en dash) and nobody noticed.`
- **Fix:** comma, colon, period or parentheses. `The feature is done, except for the tests.` Hyphens in compounds (`well-known`) and ranges (`5-10`) are not dashes. See the house-style switch in `SKILL.md`.

### G9: Buzzwords and adjective stacks

- **Move:** words that sound like a claim and contain none.
- **Shapes:** `leverage` `robust` `seamless` `cutting-edge` `synergy` `holistic` `best-in-class` `game-changer`; stacks like `fast, reliable, and scalable`.
- **Fix:** replace with the measurable property (`answers in 40 ms`) or drop. From a stack, keep the one adjective you can prove.

### G10: Empty openers and closers

- **Move:** chat politeness or a summary of what the reader just read.
- **Shapes:** `Great question!` `Sure!` `Absolutely!` `I hope this helps!` `In conclusion, ...` `To summarize, ...` `Let me know if you have any questions.`
- **Fix:** start with the answer, stop after the last fact. Add a closing line only if it asks the reader for a decision.

### G11: Unsupported absolutes

- **Move:** a claim of uniqueness or totality without evidence.
- **Shapes:** `the only tool that ...` `the first platform to ...` `no competitor offers ...` `market-leading` `always` `never` `every user`
- **Fix:** back it with a source, narrow its scope (`the only tool we tested that ...`), or drop it.

### G13: Text deserts

- **Move:** information that has the shape of a table, a list or a chart, delivered as a row of sentences.
- **Shapes:** three or more figures in one paragraph (`closed 14 of 18 tickets, a rate of 78%, coverage rose from 61% to 67%`); the same attributes repeated per item (`Option A costs X and takes Y. Option B costs Z and takes W.`); a status update as an essay; an opening that builds context before the answer; a summary that restates the table above it.
- **Fix:** answer first, then move the figures into a table, a list or key figures and keep one or two sentences of meaning. Keep every figure, add none. Rules, forms and a before/after example: `text-deserts.md`.

---

## Part 2: Rhetorical clichés

### A. Manufactured profundity

The sentence announces that something is deep instead of saying what it is.

#### A1: "That's the whole point"

- **Move:** collapse a paragraph into a fake thesis to sound final.
- **Shapes:** `That's the whole point.` `This is the entire business model.` `The entire trick is timing.` `Here's the whole idea.`
- **Fix:** state the point and drop the frame. `Timing decides whether it works.`

#### A2: "The punchline is"

- **Move:** label the conclusion as a joke's payoff so the reader expects wit.
- **Shapes:** `The punchline is that it never shipped.` `The punchline:` `The punchline?`
- **Fix:** `It never shipped.`

#### A3: "That's not nothing"

- **Move:** understate to imply hidden weight.
- **Shapes:** `That's not nothing.` `Which is not nothing.`
- **Fix:** quantify. `That saves 4 hours a week.`

#### A4: "Sit with that"

- **Move:** therapist voice that tells the reader what to feel.
- **Shapes:** `Sit with that for a moment.` `Let that sink in.` `Sit with the discomfort.`
- **Fix:** delete. The reader decides how long to think.

#### A5: "Worth naming"

- **Move:** announce that a thing deserves a name instead of naming it.
- **Shapes:** `That loss is real and it's worth naming.` `Worth naming:` `It bears mentioning that ...`
- **Fix:** name it in the same sentence, without the preamble.

#### A6: "You already know"

- **Move:** flatter the reader and skip the argument.
- **Shapes:** `You already know the answer.` `You already know how this ends.`
- **Fix:** give the answer.

#### A7: "That's the part that ..."

- **Move:** gesture at a favoured detail rather than stating it.
- **Shapes:** `That's the part a metric can't reach.` `The part that makes me trust the rest.` `My favourite part of this ...`
- **Fix:** name the detail.

#### A8: "That's why X mattered"

- **Move:** assign significance after the fact.
- **Shapes:** `That's why keeping every transcript mattered.` `This is why it counted.`
- **Fix:** show the consequence. `The transcripts let us trace the bug back to its first occurrence.`

#### A9: "The only X I trust"

- **Move:** a narrowing superlative, sold as hard-won judgement.
- **Shapes:** `The only marketing I trust.` `The only thing that matters.`
- **Fix:** drop the superlative or give the reason. See `G11`.

#### A10: "X is real, and ..."

- **Move:** validate a feeling before pivoting.
- **Shapes:** `The frustration is real, and it's not going away.` `The concern is valid, but ...`
- **Fix:** state the fact behind the feeling. `The frustration persists because the ticket has been open for 6 weeks.`

### B. Stage-managed reveals

The sentence sells a surprise that is not one.

#### B1: "Here's the twist / thing / catch"

- **Move:** a curtain-raiser before an ordinary statement.
- **Shapes:** `Here's the twist:` `Here's the thing.` `Here's the catch:` `Here's the kicker.` `But here's where it gets interesting.`
- **Fix:** open with the statement.

#### B2: "Turns out ..."

- **Move:** a casual-revelation opener bolted onto a tidy conclusion.
- **Shapes:** `Turns out nobody used it.` `It turns out that ...` `As it happens, ...`
- **Fix:** `Nobody used it.`

#### B3: "X is dead"

- **Move:** an obituary headline, often with a `long live X` sequel.
- **Shapes:** `Code review is dead.` `The framework is dead; long live the framework.`
- **Fix:** say what changed. `Teams now review asynchronously in the pull request.`

#### B4: "Don't take my word for it"

- **Move:** a stock invitation to verify, usually without a link.
- **Shapes:** `You don't have to take my word for it.` `Don't believe me? Try it.`
- **Fix:** give the source or the steps to reproduce.

#### B5: Performative honesty

- **Move:** announce sincerity rather than demonstrate it.
- **Shapes:** `I'll be honest.` `Let's be real.` `To be clear,` `Honestly,` `Look,` `I won't pretend that ...`
- **Fix:** delete the opener. The honest sentence stands on its own.

### C. Rhythm and parallelism tics

The prose sounds composed because it repeats a skeleton, not because it argues.

#### C1: "No X, no Y, no Z"

- **Move:** two or more `no ...` items in a row, for cadence.
- **Shapes:** `No fluff, no filler, no jargon.` `No excuses, no shortcuts.`
- **Fix:** one negation, or say what the thing is.

#### C2: "It didn't X. It didn't Y."

- **Move:** the same cadence with negated verbs.
- **Shapes:** `It didn't crash. It didn't warn. It didn't log.` `Not asked, not planned, not wanted.`
- **Fix:** one sentence with the actual behaviour. `It failed without a log entry.`

#### C3: "Don't call it X. Call it Y."

- **Move:** negate a verb, then repeat it with a better object.
- **Shapes:** `Don't call it a bug. Call it a design decision.` `Don't see it as a failure, see it as a signal.`
- **Fix:** make the claim once.

#### C4: "Not just X, but Y" / "It's not X, it's Y"

- **Move:** negative parallelism that fakes nuance.
- **Shapes:** `Not just faster, but safer.` `It's not a tool, it's a workflow.` `This isn't about speed. It's about trust.`
- **Fix:** name the property that matters. `It validates input before writing.`

#### C5: Repeated sentence openers

- **Move:** three or more consecutive sentences on the same opening word.
- **Shapes:** `Maybe nobody needed it. Maybe it broke. Maybe it never mattered.`
- **Fix:** keep the strongest sentence and merge the rest. Pronouns and articles at the start are normal prose, not a tell.

#### C6: Echoing sentence runs

- **Move:** consecutive sentences on the same skeleton with swapped nouns.
- **Shapes:** `A cart is an object in the system. A chat room is an object in the system.`
- **Fix:** one sentence plus a list of the nouns.

#### C7: Stacked rhetorical questions

- **Move:** two or more questions in a row, the later ones as fragments.
- **Shapes:** `Do I know how it works? Where it breaks? Which corners it cut?`
- **Fix:** answer the one question that matters. Delete the rest.

#### C8: Colon into a triple

- **Move:** a colon opening onto exactly three items, to sound concrete.
- **Shapes:** `Three things make it work: separate ports, separate processes, and local state.`
- **Fix:** if the three items carry content, make them a list. If they exist for rhythm, keep the one that matters. Weigh this one: technical text lists three real things all the time.

#### C9: Stranded auxiliary contrast

- **Move:** land the clause on a bare auxiliary for a reversal.
- **Shapes:** `The tool died; the data didn't.` `Reading passed. Writing didn't.` `Maybe it wouldn't have.`
- **Fix:** finish the sentence. `The data is still in the storage bucket.` Weigh this one: it is normal spoken-register contrast.

#### C10: "Fits in your head" boilerplate

- **Move:** dev-blog shorthand for simplicity, never shown.
- **Shapes:** `Small enough to hold in your head.` `Batteries included.` `It just works.` `Zero config.` `Sane defaults.`
- **Fix:** give the number. `4 files, 300 lines, no config file.`

### D. Encyclopedia and brochure boilerplate

Patterns that Wikipedia editors list in "Signs of AI writing".

#### D1: Overused vocabulary

- **Move:** words that language models overuse and people rarely pick.
- **Shapes:** delve, tapestry, meticulous, pivotal, intricate, interplay, underscore, garner, bolster, vibrant, bustling, multifaceted, seamless, commendable, ever-evolving, testament, realm, landscape.
- **Fix:** replace with the plain word. One hit can be coincidence; several on a page are a tell. This list dates quickly as models change; the moves in A to C do not.

#### D2: "It's important to note"

- **Move:** didactic throat-clearing before an ordinary fact.
- **Shapes:** `It's important to note that ...` `It's worth noting ...` `It should be noted ...` `It's worth pausing here.`
- **Fix:** state the fact. If it were not worth noting, it would not be in the text.

#### D3: "Stands as a testament"

- **Move:** inflate significance instead of reporting the event.
- **Shapes:** `stands as a testament to ...` `serves as a reminder that ...` `is a reflection of ...`
- **Fix:** report what happened.

#### D4: "Plays a crucial role"

- **Move:** assert importance without a mechanism.
- **Shapes:** `plays a crucial / pivotal / vital / key role in ...` `is of central importance to ...`
- **Fix:** say what it does. `The cache answers 80% of requests.`

#### D5: "Ever-evolving landscape"

- **Move:** scene-setting boilerplate in the first paragraph.
- **Shapes:** `In today's fast-paced world ...` `In the ever-evolving landscape of ...` `In the digital age ...`
- **Fix:** delete the opener and start with the subject.

#### D6: "Experts argue"

- **Move:** vague attribution to unnamed authorities.
- **Shapes:** `Experts argue ...` `Some critics have noted ...` `Industry reports indicate ...` `Studies show ...`
- **Fix:** name the source, or drop the claim. This is also a truthfulness issue (see `SKILL.md`).

#### D7: "Despite these challenges"

- **Move:** the challenges-and-outlook formula that ends a text without a conclusion.
- **Shapes:** `Despite these challenges, ...` `Challenges remain.` `It remains to be seen.` `Only time will tell.`
- **Fix:** name the open question and who decides it, or end the text.

#### D8: Participle tails

- **Move:** shallow analysis bolted onto the end of a sentence.
- **Shapes:** `..., highlighting the importance of ...` `..., underscoring how ...` `..., reflecting a broader shift.`
- **Fix:** cut the tail. If the analysis matters, it earns its own sentence with evidence.

#### D9: Promotional boilerplate

- **Move:** travel-brochure tone in text that is not a brochure.
- **Shapes:** `nestled in` `in the heart of` `rich heritage` `hidden gem` `must-see` `breathtaking` `boasts a` `stunning views`
- **Fix:** describe the thing. See `G9`.

### E. Chatbot leftovers

These are independent of language. Never ship them.

#### E1: Model self-reference

- **Shapes:** `As an AI language model ...` `As of my last update ...` `my knowledge cutoff` `I cannot browse the internet.`
- **Fix:** delete. If the limitation matters, state it as a plain caveat outside the deliverable.

#### E2: Markup debris

- **Shapes:** `contentReference`, `oaicite`, `turn0search`, `turn0news`, `attributableIndex`, `utm_source=` in pasted URLs.
- **Fix:** strip. These survive copy-paste from chat interfaces. The exact strings change with each interface, so treat the list as examples.
