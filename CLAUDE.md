# Portfolio - project guide for Claude

Personal portfolio for recruiters. SvelteKit + **Svelte 5 (runes)**, fully static (`adapter-static`), bilingual EN/FR, dark/light theme.

- Design spec (source of truth): `docs/superpowers/specs/2026-09-23-portfolio-design.md`
- Milestone plans: `docs/superpowers/plans/`
- PR review guides: `docs/reviews/`

## Commands

- `npm run dev`: dev server
- `npm test`: Vitest unit tests
- `npm run check`: svelte-check (type check), plus `tsc -p scripts` for the Node scripts in `scripts/`
- `npm run lint` / `npm run format`: Prettier
- `npm run build`, then `npm run preview`: static site in `build/`, served at http://localhost:4173
- `npm run audit`: builds, serves, then runs axe (EN/FR × dark/light × 360/1280px, menu open, before hydration), a 360px overflow check and Lighthouse (mobile + desktop). Targets: 0 axe violations, Lighthouse 100 (Performance ≥ 95). Reports in `reports/` (git-ignored); `npm run audit -- --screens` also saves screenshots at 360–1440px. Not `npm audit`, which is npm's own security audit.
- `npm run screens`: builds, then captures the site (EN/FR × dark/light × 360–1440px, phone collapsibles open, before hydration; 25 full pages) into `reports/screens-baseline/`. `npm run screens -- --compare` captures again and compares pixel by pixel, writing diff images to `reports/screens-diff/` (exit 1 on any difference). Take the baseline before a refactor, compare after each step.
- `npm run og`: regenerates the share images and icons in `static/` (loads the data through Vite).
- `npm run budget`: fails when `build/` is over 80 MB (the OVH hosting has 100) and lists the largest files.
- `npm run deploy [-- --dry-run]`: SFTP upload of `build/` (only changed files; reads `.env.deploy`). Normally CI does it on merge: see `docs/deploy.md`.
- `npm run smoke`: checks the live site (redirects, canonical, caching, 404).
- `npm run audit -- --ci`: as in CI, Lighthouse performance is reported, not required.

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
- How to edit each kind of content is documented in `docs/content-guide.md`; keep it in sync when a data type or file changes.
- Breakpoints live in `src/lib/breakpoints.ts`; every `@media` width must be one of them (a test checks). Shared colours and sizes are tokens in `src/app.css` (`--page-max`, `--gutter`, `--on-photo-*`…); line icons are path strings in `ICONS` (`src/lib/data/icons.ts`) drawn by `Icon.svelte`.
- The domain lives only in `src/lib/site.ts` (`SITE_ORIGIN`); absolute URLs come from `absoluteUrl(base, path)`. Asset paths are absolute (`paths.relative: false`), so the 404 page works at any depth.
- `static/.htaccess` is the Apache config (redirects, language on `/`, caching, headers). It hardcodes the locale paths; `htaccess.spec.ts` fails when `lang.ts` changes.
- Skill logos are not in the page JS: `+page.server.ts` sends each logo's id and colour, and `skill-logos.svg` (prerendered from `SKILL_GROUPS`) holds the drawings. Editing skills is unchanged.
- Both light palettes in `src/app.css` (with JS: `[data-theme='light']`; without: `prefers-color-scheme`) must stay identical; `theme-tokens.spec.ts` checks it.
- Watch list: `docs/backlog.md` holds known issues not fixed yet. Add to it rather than leaving a note in a session; remove an entry when it is done.

## Workflow (superpowers plugin)

The user builds this **one milestone at a time** and reviews each one before the next starts. For each milestone:

1. `superpowers:brainstorming` to settle open questions and check the spec (update it if needed).
2. `superpowers:writing-plans`, which writes `docs/superpowers/plans/YYYY-MM-DD-milestone-N-<name>.md`.
3. Execute. The user chose **subagent-driven** for Milestone 1; ask again for each new plan.
4. Push a branch, open a PR with `gh` (installed and authenticated as LezardSC), and add a review guide in `docs/reviews/`.
5. Stop. The user reviews the PR before anything is merged.

## Git notes

- Remote: `origin` = `git@github.com:LezardSC/portfolio.git`, default branch `master`.
- `master` is protected: changes go through a PR whose CI job `checks` passed (admins included, no force-push). **Merging deploys the site** to https://jocelynrenault.com (`docs/deploy.md`). The repo is public: never commit credentials.
- Worktrees live in `.claude/worktrees/<name>`, with local branch `worktree-<name>`. The remote branch is `<name>`, so push with
  `git push origin worktree-<name>:<name>`, because a plain `git push` is refused (the names differ).
- **Before opening a PR, and again before saying it is ready to merge:** `git fetch` and check `git log HEAD..origin/master`. Jocelyn merges other branches in parallel, so `master` may have moved. If it has, rebase onto `origin/master` (never a merge commit: the user merges with "Rebase and merge", which drops merge commits and brings conflicts back), resolve each conflict inside the commit that causes it, re-run the checks, and push with `git push --force-with-lease=<name>:<old sha> origin worktree-<name>:<name>`. Confirm with `gh pr view <n> --json mergeStateStatus` (must be `CLEAN`, not `BEHIND` or `DIRTY`).

## Reference material

- `tmp/` in the main checkout (`/home/lezard/portfolio/tmp/`, gitignored, not in worktrees) holds 4 screenshots of the user's Malt profile (`malt1.png`–`malt4.png`): bio, stack, portfolio projects, experience, recommendations, education, certifications, skills. Use them as a content source; never commit them.
