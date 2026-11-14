# Stack notes (optional)

The skill works without any of this. Read the section for the stack in front of you. Statements below come from two real projects (a SvelteKit site with Tailwind v4, a SvelteKit app with Tailwind v4 and a headless component kit) and from the Tailwind documentation. Check the installed version before you rely on a detail.

## Any stack: tokens as CSS custom properties

- Put tokens in one global stylesheet on `:root`. Import it once in the root layout.
- Both real projects use this shape: colour roles (`--bg`, `--ink`, `--ink-muted`, `--rule`, `--accent`, `--focus`), a type scale (`--text-sm` to `--text-4xl`), a spacing scale, radii, one header height.
- Alternate themes override the same names in a scope such as `[data-theme='dark']`. Components do not change.
- Keep a short comment with the sRGB hex next to values in `oklch()`. It helps contrast checks and reviews.
- Components read `var(--token)`. They contain no raw colours or sizes.
- Enforce it with a test that scans component files for raw hex and free font sizes. One real project does this.

## Plain CSS

- Tokens on `:root`, components in their own files or blocks, one class per role.
- Use logical properties (`margin-inline`, `padding-block`, `inline-size`). They flip with the writing direction.
- Use `@media (min-width: ...)` with the project's breakpoints. Write mobile styles first, then widen.
- Use `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs. One real project sets both in the base layer.

## Svelte 5 / SvelteKit 2

- Component state uses runes: `$props()`, `$state()`, `$derived()`. Children render with `{@render children()}` and a `Snippet` prop type.
- Put component styles in the component's `<style>` block. Svelte scopes them to the component. Read tokens with `var(--token)`. One real project styles whole components this way.
- Global tokens and base rules go in `src/app.css`. Import it in `src/routes/+layout.svelte`.
- A theme that must not flash needs the attribute set before first paint. One real project sets `data-theme` in a small script in `src/app.html`.
- Icons: use `@lucide/svelte` (for example `import Menu from '@lucide/svelte/icons/menu'`). Do not use the deprecated `lucide-svelte`.
- Headless component kit: both projects use `bits-ui` for behaviour (dialog, popover, menu) and style it with their own tokens. Keep the kit's behaviour and replace its look.
- Disclosure and menu buttons are real `<button>` elements. A dedicated audit checks accessibility.

## Tailwind v4

- The stylesheet starts with `@import 'tailwindcss';`. The Vite plugin is `@tailwindcss/vite`. Plugins load with `@plugin`.
- `@theme` defines tokens. They compile to CSS variables and create utilities.
- Both real projects keep their tokens on `:root` and map them with `@theme inline { --color-ink: var(--ink); ... }`. Utilities then read the variable at runtime, so a theme switch changes every utility.
- To stop default utilities from leaking in, clear a namespace before you define yours, for example `--color-*: initial;` inside `@theme`. This is documented on the Tailwind theme page. Neither real project does it. Without it, `bg-blue-500` and other default colours still compile. Decide with the owner. A guard test or lint rule can do the same job.
- Default breakpoints (`sm`, `md`, `lg`) apply to the utility prefixes. A hand-written `@media` value next to them makes two breakpoint systems. Use one list and record it in DESIGN.md.
- Do not ship the default palette, default radius and default shadow as the design. Name the project's tokens.
- Check which utilities the project actually uses: `grep -rhoE "\b(sm|md|lg|xl):" src | sort | uniq -c`.

## shadcn-style component kits

Neither real project uses one. These notes say what to look for.

- Such kits keep their theme in CSS variables in the global stylesheet (`--background`, `--foreground`, `--primary`, `--radius` and similar). Find that block first.
- Override those variables with the project's tokens or map them onto the project's names. Do not leave the generated defaults.
- The kit's components copy into the repo. Edit them: radius, spacing, focus style, type. A default card, button and badge in the kit's stock grey is the generic look (K2).
- Read two or three copied components to see which variants exist before you add a new one.

## Component libraries from a CI

When the project ships its own library, use its components and tokens as they are. Build only what is missing, in the same style. Record each addition in DESIGN.md.
