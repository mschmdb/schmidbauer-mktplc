# Intake: take in a given design

Find every source first, then rank them. Sources differ in reliability. A higher source overrides a lower one. Record the source of each value (see `design-md.md`).

| Rank | Source | Status label |
|---|---|---|
| 1 | Machine-readable tokens, a component library in the repo | specified |
| 2 | Live site or dev server | observed |
| 3 | Brand PDF, read as page images | specified, with page number |
| 4 | Screenshots, mockups | estimated |

Read project instruction files too (`CLAUDE.md`, `AGENTS.md`, `README.md`, `docs/`). They hold rules that tokens do not: tone, forbidden uses, test gates.

## What to extract from every source

- Colour roles: background, surface, text, muted text, border, accent, focus, error, warning, success. Both themes when a dark theme exists.
- Type: families, sizes, weights, line heights, tracking, the scale and its ratio. Where the fonts come from (self-hosted files, a package, a CDN).
- Spacing scale, radii, shadows, border widths.
- Breakpoints and container widths.
- Logo: clear space, minimum size, allowed colour versions, forbidden uses.
- Imagery style and icon set.
- Tone of voice and the language of the UI.
- Motion rules.

## 1. Machine-readable tokens

Look for, in this order:

- Design Tokens files: `*.tokens`, `*.tokens.json` (search with `find . -name "*.tokens*" -not -path "*/node_modules/*"`). A token has `$value` and optional `$type` (format 2025.10, the first stable version). A value can refer to another token. Resolve it to the final value and record both names.
- Style Dictionary: `config.json`, `style-dictionary.config.*`, a `tokens/` folder. Style Dictionary v4 supports the format; full 2025.10 support is planned for v5. Read the token source files, not the generated output, unless no source exists.
- Tokens Studio exports: JSON with sets such as `global`, `$themes.json`, `$metadata.json`. Check which set is the active theme.
- Figma variables: when a Figma MCP server is connected, the server exposes the tools `get_variable_defs`, `get_design_context` and `get_screenshot`. Use them for variables, a frame and a picture, and check what each returns. Without the server, ask for a token export.
- Tailwind v4: `@theme` blocks in the main CSS file. Each entry compiles to a CSS variable.
- Tailwind v3: `tailwind.config.{js,ts,cjs}`, keys under `theme` and `theme.extend`. Note whether a key sits under `theme` or under `theme.extend`, and whether the default palette is still in use.
- CSS custom properties: `grep -rnE "^\s*--[a-z0-9-]+:" src --include='*.css'`. Start with `:root`, then theme scopes such as `[data-theme=...]`, `.dark`, `@media (prefers-color-scheme)`.
- shadcn-style kits: a `components.json` and variables such as `--background`, `--foreground`, `--primary`, `--radius` in the global CSS. Check whether the project changed them or kept the generated defaults.
- Component library in the repo: `src/lib/components/ui`, `components/ui`, `packages/ui`. Read two or three components for the real variants, sizes and state styles. These show what the tokens do not.
- Guard tests: `grep -rlE "contrast|token" src --include='*.test.*'`. A test that reads the tokens enforces rules (contrast pairs, no raw hex in components). Keep them green.

Pitfalls:

- An alias layer hides the source. Tailwind `@theme inline { --color-ink: var(--ink) }` points to `:root`. Record the `:root` value.
- Values come in pairs: `oklch(...)` with a hex comment, or the reverse. Record the declared one, note the other.
- Fluid values (`clamp(...)`) are scales. Record the formula and the two end values.
- Components that bypass tokens (raw hex, arbitrary sizes) show where the design drifted. List them under Conflicts, do not copy them.
- Generated files (`dist/`, `build/`, `.svelte-kit/`) repeat the source. Skip them.
- Scope: a `DESIGN.md` can cover one area only. Read its title and opening lines.
- Dangling references: code comments that cite a `DESIGN.md` or style guide that does not exist in the repo. Search the history (`git log --all -- DESIGN.md`) and ask the owner. Until then the CSS is the source.
- Two systems in one file: Tailwind utility breakpoints (`sm:`, `md:`) next to hand-written `@media` values. Count both (`grep -rhoE "(min|max)-width: ?[0-9.]+(rem|px)" src` and the utility prefixes) and record the mismatch.
- Large token files: record the core roles one by one. Group domain palettes (charts, maps, severity, brand extensions) as one row with the count and the file range.
- Absence is a result. If the source has no shadows, no dark theme or no motion tokens, write "none" with the source. Do not add them unasked.
- Sibling projects can share a palette or scale. Note the relation. Do not merge the files.

## 2. Live site or dev server (observed)

Run `node ${CLAUDE_SKILL_DIR}/scripts/extract-tokens.mjs <url>`. It needs the dependencies of the design-audit skill (see SKILL.md, step 6). The output lists the custom properties on `:root`, and counts of families, sizes, weights, line heights, colours, spacing values, radii and shadows, for desktop (1440 x 900) and a mobile device.

- Use observed values to fill gaps and to check the tokens. Counts show what the page uses, not what the design allows.
- The script reads `:root` and `html` rules only. It does not read theme scopes such as `[data-theme=dark]`. Read those in the source.
- It scans the loaded page. States (hover, focus, error) and other routes need extra runs or a look at the source.
- Fonts: the first family of the stack is counted. Check that the file loads (no fallback in use).
- Run it on the local dev server when the project exists, on the live site otherwise. Do not run it against sites you may not scan.

## 3. Brand PDF

Convert pages to images and read the images. Text extraction loses colour, layout and the link between a swatch and its name.

- Record the page number next to every value: `brand-guide.pdf p.4`.
- Colour: take the named value (HEX, RGB, CMYK, Pantone) as printed. CMYK and Pantone do not map exactly to screen. Use the printed HEX or RGB. If only CMYK exists, mark the screen value estimated and ask.
- Type: note the family, weights, and the fallback the guide names for the web. Check that a web licence exists.
- Logo pages state clear space and minimum size. Copy the rules, not the picture.
- Print rules (bleed, paper) do not apply to the UI. Note them and skip them.
- Guides often show intent in sample layouts. Record the intent and do not copy a layout one to one.

## 4. Screenshots and mockups (estimated)

- Label every value estimated. Sample colours from pixels where you can. Never eyeball a hex.
- Measure spacing relative to a known size, such as the body line height or a button height.
- Identify fonts by name only when the file says so. Otherwise list candidates and ask.
- States are rarely shown. List them as gaps.
- Ask for the source file (Figma, token export) when the project is large.

## After intake

- When no document states the intent, derive it from comments, structure and copy. Label it "derived, to confirm".
- List what is missing and what disagrees. Hand both to `design-md.md`.
- Ask the owner only about conflicts and about gaps that change the brand (a new accent, a new font). Fill the rest with derived values, labelled "derived, to confirm".
