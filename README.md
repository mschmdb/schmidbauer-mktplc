# schmidbauer-mktplc

Claude Code plugins by Matze Schmidbauer.

| Plugin | What it does |
|---|---|
| [codex-review](plugins/codex-review) | Code review by OpenAI Codex in two stages: one model finds issues and quotes the code, a second model checks each finding against the repository. |
| [design-audit](plugins/design-audit) | Audits a live website against 32 design and UX guidelines, with browser measurements, screenshots and evidence for every finding. |
| [no-ai-slop](plugins/no-ai-slop) | Writing rules against AI-sounding prose and made-up facts, with pattern catalogues for English and German. |
| [wakemux](https://github.com/mschmdb/wakemux) | Runs side tasks as Claude Code threads in cmux worktrees that report back to the main session. |

## Install

In Claude Code:

```
/plugin marketplace add mschmdb/schmidbauer-mktplc
/plugin install codex-review@schmidbauer-mktplc
```

Single skills also work with other agents through the `skills` CLI:

```
npx skills add mschmdb/schmidbauer-mktplc --skill design-audit
```

## License

MIT, see [LICENSE](LICENSE). `no-ai-slop` includes material under Apache-2.0, see its [NOTICE](plugins/no-ai-slop/NOTICE).
