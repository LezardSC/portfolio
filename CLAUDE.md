# Portfolio — project guide for Claude

Personal portfolio for recruiters. SvelteKit + **Svelte 5 (runes)**, fully static (`adapter-static`), bilingual EN/FR, dark/light theme.

- Design spec (source of truth): `docs/superpowers/specs/2026-09-23-portfolio-design.md`
- Milestone plans: `docs/superpowers/plans/`
- PR review guides: `docs/reviews/`

## Commands

- `npm run dev`: dev server
- `npm test`: Vitest unit tests
- `npm run check`: svelte-check (type check)
- `npm run lint` / `npm run format`: Prettier
- `npm run build`, then `npm run preview`: static site in `build/`, served at http://localhost:4173
- `npm run audit`: builds, serves, then runs axe (EN/FR × dark/light × 360/1280px, menu open, before hydration), a 360px overflow check and Lighthouse (mobile + desktop). Targets: 0 axe violations, Lighthouse 100 (Performance ≥ 95). Reports in `reports/` (git-ignored); `npm run audit -- --screens` also saves screenshots at 360–1440px. Not `npm audit`, which is npm's own security audit.

## Conventions

- **Runes only:** `$props`, `$state`, `$derived`. No `export let`, no `$:`, no legacy stores.
- SvelteKit config lives **inside `vite.config.ts`** (`sveltekit({ ... })`). There is no `svelte.config.js`; don't create one.
- Everything is prerendered: `prerender = true` and `trailingSlash = 'always'` in `src/routes/+layout.ts`. No server or backend.
- Locales are exactly `en` and `fr`, in `src/lib/i18n/lang.ts`. That file must not import the dictionaries.
- UI text (buttons, headings, labels) lives only in `src/lib/i18n/en.ts` and `fr.ts`. `fr` is typed `Dict` (= `typeof en`), so every key must exist in both files. Category labels (project domains and contexts, skill groups) are content: they live with their entry in `src/lib/data/`.
- Build locale URLs with `localeHref(base, lang)` and `base` from `$app/paths`. Never hardcode `/en/`, because the site must work under a sub-path.
- Theme: `data-theme` on `<html>` is set by the inline script in `src/app.html`, which duplicates `resolveTheme` in `src/lib/theme.ts` on purpose. Keep the two in sync.
- Content (projects, skills, experience) goes in typed data files in `src/lib/data/`, with `{ en, fr }` text fields. Components only render it.
- Put logic in pure functions with unit tests (`*.spec.ts` next to the file). Keep components thin.
- `docs/` and `.superpowers/` are in `.prettierignore`, so docs are never reformatted.

## Workflow (superpowers plugin)

The user builds this **one milestone at a time** and reviews each one before the next starts. For each milestone:

1. `superpowers:brainstorming` to settle open questions and check the spec (update it if needed).
2. `superpowers:writing-plans`, which writes `docs/superpowers/plans/YYYY-MM-DD-milestone-N-<name>.md`.
3. Execute. The user chose **subagent-driven** for Milestone 1; ask again for each new plan.
4. Push a branch, open a PR with `gh` (installed and authenticated as LezardSC), and add a review guide in `docs/reviews/`.
5. Stop. The user reviews the PR before anything is merged.

## Git notes

- Remote: `origin` = `git@github.com:LezardSC/portfolio.git`, default branch `master`.
- Worktrees live in `.claude/worktrees/<name>`, with local branch `worktree-<name>`. The remote branch is `<name>`, so push with
  `git push origin worktree-<name>:<name>`, because a plain `git push` is refused (the names differ).

## Reference material

- `tmp/` in the main checkout (`/home/lezard/portfolio/tmp/`, gitignored, not in worktrees) holds 4 screenshots of the user's Malt profile (`malt1.png`–`malt4.png`): bio, stack, portfolio projects, experience, recommendations, education, certifications, skills. Use them as a content source; never commit them.
