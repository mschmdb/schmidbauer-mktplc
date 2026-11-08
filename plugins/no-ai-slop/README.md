# no-ai-slop

A Claude Code skill that keeps written text free of AI tells and invented facts. It applies when Claude writes or edits prose for people: READMEs, docs, commit messages, PR descriptions, UI copy, emails and reports. It also applies when you ask Claude to review a text that sounds machine-written.

## What it does

- **Wording rules:** cut filler, turn nouns back into verbs, name the actor, split nested sentences, drop buzzwords.
- **Rhetorical clichés:** 36 patterns such as staged reveals ("Here's the twist:"), "not just X, but Y" and fake profundity. The skill matches the move, not the words, so it works in any language.
- **Repetition budget:** a figure used once is voice, five times is a tic. The skill counts moves across the whole text.
- **Text deserts:** figures and comparisons buried in prose go into a table, a list or key figures. An optional script, `scripts/desert_check.py`, counts figures per paragraph and prose without structure in a Markdown draft.
- **Truthfulness:** no invented numbers, APIs, sources or absolutes. Unchecked claims get flagged as "not verified".
- **Counterweight:** numbers, sources, specific verbs and admitted uncertainty survive every cut.
- **False positives:** a guide to what regex linters flag wrongly, so correct prose stays untouched.

## Languages

The skill detects the language of the text and loads the matching catalogue:

- `references/patterns-en.md` for English
- `references/patterns-de.md` for German, including German-only patterns such as nominal style with function verbs and calques from English

For any other language, Claude uses the English catalogue and looks for the local idiom of each move.

## Install

```
/plugin marketplace add mschmdb/schmidbauer-mktplc
/plugin install no-ai-slop@schmidbauer-mktplc
```

Or with the skills CLI:

```
npx skills add mschmdb/schmidbauer-mktplc --skill no-ai-slop
```

## Options

Two house-style rules are on by default. Plugin users change them in `/config`:

| Option | Default | Effect |
|---|---|---|
| `ban_dashes` | `true` | No em dashes or spaced en dashes as sentence breaks |
| `max_sentence_words` | `25` | Sentence-length ceiling, not a target |

Without the plugin system, the defaults apply. You can also override them in your project instructions, for example "no-ai-slop: allow em dashes". Your own instructions and your project's style guide always take precedence over the skill.

## Always on

The skill loads when a writing task matches its description. To apply the rules to every chat reply as well, put a short version of the core rules into your `CLAUDE.md`.

## Credits

The cliché catalogue adapts Simon Willison's [LLM cliché highlighter](https://tools.simonwillison.net/llm-cliche-highlighter) (Apache-2.0, see `NOTICE`) and draws on Wikipedia's [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).

## License

MIT. Adapted material: Apache-2.0, see `NOTICE` and `LICENSES/`.
