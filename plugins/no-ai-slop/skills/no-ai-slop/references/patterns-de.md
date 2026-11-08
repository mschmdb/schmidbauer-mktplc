# German patterns

Pattern catalogue for German text. Instructions and explanations are in English; the example sentences under **Shapes** and **Fix** are German, because they show how each move surfaces in German. The IDs match `patterns-en.md`.

Every entry has three parts:

- **Move:** what the sentence does. This part transfers across languages.
- **Shapes:** how the move shows up in German. These are examples, not a blocklist.
- **Fix:** what to write instead, as a German example.

Match the move, never the example string. German often performs a move with different grammar than English (see `D8`), so never translate the English shapes word for word.

Part 1 covers wording and grammar (G1 to G12, where G12 is German-only). Part 2 covers rhetorical clichés (A1 to E2, 36 patterns). Known false positives live in `false-positives.md`.

---

## Part 1: Wording and grammar

### G1: Filler phrases and filler words

- **Move:** words that delay the statement without adding to it.
- **Shapes:** `Es ist wichtig zu beachten, dass ...` `Im Wesentlichen ...` `Grundsätzlich ...` `Letztendlich ...` `In der Regel ...`; modal particles with no function in written text: `eigentlich`, `durchaus`, `quasi`, `sozusagen`, `eben`, `halt`, `mal`, `ja`, `doch`, `einfach`, `irgendwie`.
- **Fix:** delete the phrase or particle. If the sentence is empty without it, delete the sentence.

### G2: Transitions that connect nothing

- **Move:** a connector that signals logic the text does not have.
- **Shapes:** `Darüber hinaus` `Zusätzlich` `Ferner` `Des Weiteren` `Außerdem ist zu erwähnen`
- **Fix:** keep a connector only for a real contrast, cause or sequence (`aber`, `weil`, `danach`).

### G3: Stacked hedging

- **Move:** two or more hedges on one claim.
- **Shapes:** `möglicherweise vielleicht` `könnte unter Umständen` `man könnte argumentieren, dass`
- **Fix:** one hedge where the uncertainty is real, with its source (`unter Windows ungetestet`).

### G4: Self-reference

- **Move:** the text describes itself instead of doing its job.
- **Shapes:** `In diesem Abschnitt werden wir ...` `Im Folgenden wird erläutert ...` `Wie bereits oben erwähnt ...`
- **Fix:** delete. The heading already says what the section covers.

### G5: Nominal style (Nominalstil)

- **Move:** verbs turned into nouns (`-ung`, `-heit`, `-keit`, `-ion`, `-ierung`, `-ität`), carried by an empty function verb. This is the main marker of bureaucratic German (Behördendeutsch).
- **Shapes:** `Die Implementierung der Authentifizierung erfolgt durch die Verwendung von JWT.` `Zur Durchführung der Validierung der Eingabedaten ...` Function-verb constructions: `zur Anwendung kommen`, `zur Umsetzung bringen`, `in Betracht ziehen`, `eine Entscheidung treffen`. Periphrases: `in Bezug auf`, `hinsichtlich`, `im Rahmen von`.
- **Fix:** find the hidden verb and give it a subject. `Die App authentifiziert Nutzer per JWT.` `Um die Eingaben zu prüfen, ...` `Wir entscheiden ...` Two such nouns in one sentence is the signal to rewrite.

### G6: Passive voice that hides the actor

- **Move:** the sentence omits who acts, although the actor matters.
- **Shapes:** `Der Token wird vom Server validiert.` `Es wird empfohlen, das Passwort zu ändern.` `Es ist zu beachten, dass ...`
- **Fix:** name the actor. `Der Server prüft den Token.` `Ändere dein Passwort.` Keep the passive when the actor is unknown or irrelevant: `Die Datei wurde 2019 gelöscht.`

### G7: Nested sentences (Schachtelsätze)

- **Move:** relative clauses and `dass`/`wobei`/`während` clauses stacked into one sentence. German verb-final order makes this harder to read than in English, because the reader waits for the verb.
- **Shapes:** `Der Service, der für die Authentifizierung zuständig ist und der auch Sessions verwaltet, sendet einen Token, wobei dieser dann vom Client gespeichert wird, damit nachfolgende Requests authentifiziert werden können.`
- **Fix:** one idea per sentence, in full sentences with articles. `Der Auth-Service verwaltet Sessions und sendet einen Token. Der Client speichert den Token und schickt ihn bei jedem weiteren Request mit.` Do not overcorrect into telegram style (`Client speichert Token.`) or a row of four-word sentences (see `C5`, `C6`).

### G8: Dashes as dramatic pauses

- **Move:** an em dash or a spaced en dash (Gedankenstrich) that stages a pause.
- **Shapes:** `Das Feature ist fertig (Gedankenstrich) bis auf die Tests.`
- **Fix:** comma, colon, period or parentheses. `Das Feature ist fertig, nur die Tests fehlen noch.` See the house-style switch in `SKILL.md`.

### G9: Buzzwords and adjective stacks

- **Move:** words that sound like a claim and contain none.
- **Shapes:** `nahtlos` `ganzheitlich` `wegweisend` `innovativ` `zukunftssicher` `maßgeschneidert` `Mehrwert schaffen`; stacks like `schnell, zuverlässig und skalierbar`.
- **Fix:** replace with the measurable property (`antwortet in 40 ms`) or drop.

### G10: Empty openers and closers

- **Move:** chat politeness or a summary of what the reader just read.
- **Shapes:** `Klar!` `Selbstverständlich!` `Gute Frage!` `Zusammenfassend lässt sich sagen ...` `Abschließend ...` `Ich hoffe, das hilft!`
- **Fix:** start with the answer, stop after the last fact.

### G11: Unsupported absolutes

- **Move:** a claim of uniqueness or totality without evidence.
- **Shapes:** `die einzige Lösung, die ...` `als erster Anbieter` `kein Wettbewerber bietet ...` `marktführend` `immer` `nie` `alle Nutzer`
- **Fix:** back it with a source, narrow the scope (`das einzige getestete Tool, das ...`), or drop it.

### G12: Calques from English (German only)

- **Move:** English idioms translated word for word. Typical for machine-translated and model-written German.
- **Shapes:** `Am Ende des Tages ...` (at the end of the day) `Das macht einen Unterschied.` (makes a difference) `in 2024` (instead of `2024` or `im Jahr 2024`) `Lass uns eintauchen.` (let's dive in)
- **Fix:** use the German idiom (`letztlich`, `2024`) or drop the phrase. Instead of `Das macht einen Unterschied`, name the difference.

---

## Part 2: Rhetorical clichés

### A. Manufactured profundity

The sentence announces that something is deep instead of saying what it is.

#### A1: "That's the whole point"

- **Move:** collapse a paragraph into a fake thesis to sound final.
- **Shapes:** `Das ist der ganze Punkt.` `Darum geht es im Kern.` `Das ist das ganze Geschäftsmodell.` `Der ganze Trick ist das Timing.`
- **Fix:** state the point and drop the frame. `Das Timing entscheidet, ob es klappt.`

#### A2: "The punchline is"

- **Move:** label the conclusion as a joke's payoff.
- **Shapes:** `Die Pointe ist:` `Und die Pointe?` `Der Witz an der Sache:`
- **Fix:** `Es ging nie live.`

#### A3: "That's not nothing"

- **Move:** understate to imply hidden weight.
- **Shapes:** `Das ist nicht nichts.` `Das ist immerhin etwas.`
- **Fix:** quantify. `Das spart 4 Stunden pro Woche.`

#### A4: "Sit with that"

- **Move:** therapist voice that tells the reader what to feel.
- **Shapes:** `Lass das kurz wirken.` `Halt das mal aus.` `Das muss man erst mal sacken lassen.`
- **Fix:** delete.

#### A5: "Worth naming"

- **Move:** announce that a thing deserves a name instead of naming it.
- **Shapes:** `Das gehört benannt.` `Das darf man so sagen.` `Erwähnenswert ist hier:`
- **Fix:** name it in the same sentence.

#### A6: "You already know"

- **Move:** flatter the reader and skip the argument.
- **Shapes:** `Du weißt die Antwort längst.` `Du ahnst, wie das ausgeht.`
- **Fix:** give the answer.

#### A7: "That's the part that ..."

- **Move:** gesture at a favoured detail rather than stating it.
- **Shapes:** `Das ist der Teil, den keine Metrik erfasst.` `Genau das ist der Punkt, der ...`
- **Fix:** name the detail.

#### A8: "That's why X mattered"

- **Move:** assign significance after the fact.
- **Shapes:** `Deshalb war es wichtig, alles zu protokollieren.` `Genau darum zählte das.`
- **Fix:** show the consequence. `Über die Protokolle fanden wir die Stelle, an der der Fehler zuerst auftrat.`

#### A9: "The only X I trust"

- **Move:** a narrowing superlative, sold as hard-won judgement.
- **Shapes:** `Das einzige Marketing, dem ich traue.` `Das Einzige, was zählt.`
- **Fix:** drop the superlative or give the reason. See `G11`.

#### A10: "X is real, and ..."

- **Move:** validate a feeling before pivoting.
- **Shapes:** `Der Frust ist real, und er bleibt.` `Die Sorge ist berechtigt, aber ...`
- **Fix:** state the fact behind the feeling. `Der Frust hält an, weil das Ticket seit 6 Wochen offen ist.`

### B. Stage-managed reveals

The sentence sells a surprise that is not one.

#### B1: "Here's the twist / thing / catch"

- **Move:** a curtain-raiser before an ordinary statement.
- **Shapes:** `Und jetzt kommt's:` `Die Sache ist die:` `Der Haken:` `Jetzt wird's interessant:`
- **Fix:** open with the statement.

#### B2: "Turns out ..."

- **Move:** a casual-revelation opener bolted onto a tidy conclusion.
- **Shapes:** `Stellt sich raus: niemand hat es benutzt.` `Wie sich zeigt, ...` `Am Ende nutzte es niemand.`
- **Fix:** `Niemand hat es benutzt.`

#### B3: "X is dead"

- **Move:** an obituary headline, often with a `long live X` sequel.
- **Shapes:** `Code Review ist tot.` `Das Framework ist tot, es lebe das Framework.`
- **Fix:** say what changed. `Die Teams reviewen inzwischen asynchron im Pull Request.`

#### B4: "Don't take my word for it"

- **Move:** a stock invitation to verify, usually without a link.
- **Shapes:** `Du musst mir nicht glauben.` `Glaub es nicht, prüf es.`
- **Fix:** give the source or the steps to reproduce.

#### B5: Performative honesty

- **Move:** announce sincerity rather than demonstrate it.
- **Shapes:** `Ganz ehrlich:` `Mal ehrlich,` `Um es klar zu sagen:` `Sagen wir, wie es ist:` `Ich will nicht so tun, als ob ...`
- **Fix:** delete the opener.

### C. Rhythm and parallelism tics

The prose sounds composed because it repeats a skeleton, not because it argues.

#### C1: "No X, no Y, no Z"

- **Move:** two or more negations in a row, for cadence.
- **Shapes:** `Kein Fluff, kein Füllwort, kein Jargon.` `Ohne Umwege, ohne Ausreden.`
- **Fix:** one negation, or say what the thing is.

#### C2: "It didn't X. It didn't Y."

- **Move:** the same cadence with negated verbs.
- **Shapes:** `Es stürzte nicht ab, warnte nicht, loggte nicht.` `Nicht gefragt, nicht geplant, nicht gewollt.`
- **Fix:** one sentence with the actual behaviour. `Es brach ohne Log-Eintrag ab.`

#### C3: "Don't call it X. Call it Y."

- **Move:** negate a verb, then repeat it with a better object.
- **Shapes:** `Nenn es nicht Bug. Nenn es Design-Entscheidung.` `Sieh es nicht als Fehler, sieh es als Signal.`
- **Fix:** make the claim once.

#### C4: "Not just X, but Y" / "It's not X, it's Y"

- **Move:** negative parallelism that fakes nuance.
- **Shapes:** `Nicht nur schneller, sondern sicherer.` `Es ist kein Werkzeug, es ist ein Workflow.` `Nicht bloß X, sondern auch Y.` `Es geht nicht um Tempo. Es geht um Vertrauen.`
- **Fix:** name the property that matters. `Es prüft die Eingaben, bevor es schreibt.`

#### C5: Repeated sentence openers

- **Move:** three or more consecutive sentences on the same opening word.
- **Shapes:** `Vielleicht brauchte es niemand. Vielleicht war es kaputt. Vielleicht war es egal.`
- **Fix:** keep the strongest sentence and merge the rest. Articles and pronouns at the start are normal prose.

#### C6: Echoing sentence runs

- **Move:** consecutive sentences on the same skeleton with swapped nouns.
- **Shapes:** `Ein Warenkorb ist ein Objekt im System. Ein Chatraum ist ein Objekt im System.`
- **Fix:** one sentence plus a list of the nouns.

#### C7: Stacked rhetorical questions

- **Move:** two or more questions in a row, the later ones as fragments.
- **Shapes:** `Weiß ich, wie es funktioniert? Wo es bricht? Was es weglässt?`
- **Fix:** answer the one question that matters.

#### C8: Colon into a triple

- **Move:** a colon opening onto exactly three items, to sound concrete.
- **Shapes:** `Drei Dinge machen den Unterschied: eigene Ports, eigene Prozesse und lokaler State.`
- **Fix:** a list if the items carry content, otherwise keep the one that matters. Weigh this one.

#### C9: Stranded auxiliary contrast

- **Move:** end the clause early for a reversal.
- **Shapes:** `Das Tool starb, die Daten nicht.` `Lesen ging, Schreiben nicht.` `Vielleicht auch nicht.`
- **Fix:** finish the sentence. `Die Daten liegen weiter im Storage-Bucket.` Weigh this one.

#### C10: "Fits in your head" boilerplate

- **Move:** shorthand for simplicity, never shown.
- **Shapes:** `Passt in einen Kopf.` `Funktioniert einfach.` `Null Konfiguration.` `Sinnvolle Voreinstellungen.`
- **Fix:** give the number. `4 Dateien, 300 Zeilen, keine Config-Datei.`

### D. Encyclopedia and brochure boilerplate

#### D1: Overused vocabulary

- **Move:** words that language models overuse and people rarely pick.
- **Shapes:** eintauchen, beleuchten, akribisch, maßgeblich, vielschichtig, facettenreich, Zusammenspiel, unterstreichen, nahtlos, ganzheitlich, lebendig, pulsierend, sich stetig wandelnd, bemerkenswert, Landschaft (figurative).
- **Fix:** replace with the plain word. Several hits on a page are a tell. The list dates quickly; the moves in A to C do not.

#### D2: "It's important to note"

- **Move:** didactic throat-clearing before an ordinary fact.
- **Shapes:** `Wichtig zu erwähnen ist, dass ...` `Es sei angemerkt, dass ...` `Bemerkenswert ist ...` `An dieser Stelle lohnt ein Blick auf ...`
- **Fix:** state the fact.

#### D3: "Stands as a testament"

- **Move:** inflate significance instead of reporting the event.
- **Shapes:** `zeugt von ...` `steht sinnbildlich für ...` `ist ein Beleg dafür, dass ...` `erinnert daran, dass ...`
- **Fix:** report what happened.

#### D4: "Plays a crucial role"

- **Move:** assert importance without a mechanism.
- **Shapes:** `spielt eine entscheidende Rolle bei ...` `nimmt eine zentrale Rolle ein` `ist von zentraler Bedeutung für ...`
- **Fix:** say what it does. `Der Cache beantwortet 80 % der Requests.`

#### D5: "Ever-evolving landscape"

- **Move:** scene-setting boilerplate in the first paragraph.
- **Shapes:** `In der heutigen schnelllebigen Welt ...` `In der sich stetig wandelnden Landschaft der ...` `Im digitalen Zeitalter ...`
- **Fix:** delete the opener and start with the subject.

#### D6: "Experts argue"

- **Move:** vague attribution to unnamed authorities.
- **Shapes:** `Experten sind sich einig ...` `Fachleute argumentieren ...` `Branchenberichte zeigen ...` `Studien belegen ...`
- **Fix:** name the source, or drop the claim.

#### D7: "Despite these challenges"

- **Move:** the challenges-and-outlook formula that ends a text without a conclusion.
- **Shapes:** `Trotz dieser Herausforderungen ...` `Herausforderungen bleiben.` `Es bleibt abzuwarten.` `Die Zeit wird zeigen, ob ...`
- **Fix:** name the open question and who decides it, or end the text.

#### D8: Analysis tails

- **Move:** shallow analysis bolted onto the end of a sentence. German rarely uses a participle here; it uses a `was ...` or `wodurch ...` relative clause. Same move, different grammar.
- **Shapes:** `..., was die Bedeutung von ... unterstreicht.` `..., was einen größeren Wandel widerspiegelt.` `..., wodurch deutlich wird, dass ...`
- **Fix:** cut the tail. If the analysis matters, it earns its own sentence with evidence.

#### D9: Promotional boilerplate

- **Move:** brochure tone in text that is not a brochure.
- **Shapes:** `eingebettet in` `im Herzen von` `reiche Geschichte` `Geheimtipp` `ein Muss` `atemberaubend` `besticht durch` `lädt ein zu` `beeindruckende Aussicht`
- **Fix:** describe the thing. See `G9`.

### E. Chatbot leftovers

#### E1: Model self-reference

- **Shapes:** `Als KI-Sprachmodell ...` `Stand meines letzten Updates ...` `Mein Wissensstand reicht bis ...`
- **Fix:** delete. If the limitation matters, state it as a plain caveat outside the deliverable.

#### E2: Markup debris

- Same as in `patterns-en.md`: literal strings such as `oaicite`, `turn0search` or `utm_source=`, with no language variant. Strip them.
