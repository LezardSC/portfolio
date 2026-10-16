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
- `npm run screens`: builds, then captures the site (EN/FR × dark/light × 360–1440px, phone collapsibles open, before hydration; 25 full pages) into `reports/screens-baseline/`; refuses when that folder (or the `--out` folder) already exists unless `--force` is given, so a baseline is never lost by a slip. `npm run screens -- --compare` captures again and compares pixel by pixel, writing diff images to `reports/screens-diff/` (exit 1 on any difference). Take the baseline before a refactor, compare after each step. `--out <dir>` captures elsewhere, `--no-build` serves the existing build; `--before <dir> --after <dir> --review <dir>` writes the review page that CI publishes in each PR preview.
- `npm run audit` and `npm run screens` serve the build on a free port, so several worktrees can run them at once. `npm run dev` takes the next free port too: read the URL it prints.
- `npm run og`: regenerates the share images and icons in `static/` (loads the data through Vite).
- `npm run budget`: fails when `build/` is over 80 MB (the OVH hosting has 100) and lists the largest files.
- `npm run deploy [-- --dry-run]`: SFTP upload of `build/` (only changed files; reads `.env.deploy`). Normally CI does it on merge: see `docs/deploy.md`.
- Automatic rebase: on every push to `master`, the **Auto-rebase** workflow rebases each open PR onto it; on a conflict, Claude Code resolves it, the workflow re-runs lint, check and test, pushes, and comments on the PR (`docs/deploy.md`, "Automatic rebase").
- PR previews: the **Preview** workflow deploys every PR to `https://pr-<n>.jocelynrenault-previews.pages.dev` with a before/after page at `/_review/`, and links both in a PR comment (`docs/deploy.md`, "PR previews").
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
- Known problems and ideas not done yet are **GitHub issues** (`gh issue list`), not notes in a file or a session. Open one (labels: `bug`, `content`, `refactor`, `hosting`, `tooling`, `accessibility`, `documentation`, `enhancement`; `later` when it waits on something) rather than leaving a note in a session.

## Workflow (superpowers plugin)

The user builds this **one milestone at a time** and reviews each one before the next starts. For each milestone:

1. `superpowers:brainstorming` to settle open questions and check the spec (update it if needed).
2. `superpowers:writing-plans`, which writes `docs/superpowers/plans/YYYY-MM-DD-milestone-N-<name>.md`.
3. Execute. The user chose **subagent-driven** for Milestone 1; ask again for each new plan.
4. Push a branch, open a PR with `gh` (installed and authenticated as LezardSC), and add a review guide in `docs/reviews/`.
5. Stop. The user reviews the PR before anything is merged.

Smaller work goes **issue by issue**, without a plan file. The same routine works in a terminal opened for one issue (`claude --worktree issue-<n>-<slug>`) and for an agent dispatched from another session:

1. One worktree and branch per issue (`issue-<n>-<slug>`), then `npm ci` in it. Small related issues may share a PR.
2. Read the issue (`gh issue view <n>`) and check it still holds (the code may have moved on). Unclear, or a choice that is the user's to make: ask before writing code. A dispatched agent stops and reports the question instead of guessing.
3. Fix it, tests first when there is logic. Run `npm run check`, `npm test`, `npm run lint`; `npm run audit` when the UI changed.
4. Fetch and rebase on `origin/master` (Git notes), push, open the PR with `Closes #<n>` and a short "what to look at" list. A review guide in `docs/reviews/` only when the change is big enough to need one.
5. Wait for the **Preview** comment on the PR (`gh pr view <n> --comments`), open its `/_review/` page and check that only intended screens changed. If not, fix and push again.
6. Stop. The user reviews (often on the phone, from the preview) and merges. "Address the review on PR #<n>" means: read the comments (`gh pr view <n> --comments` and `gh api repos/LezardSC/portfolio/pulls/<n>/comments`), fix, push, and answer each one.

**Dispatching several issues** ("work on #47 #48 #50" in one session): read each issue and guess which files it touches. Issues likely to touch the same files run one after another; the others run in parallel, one background agent per issue (Agent tool, `isolation: "worktree"`), each told to follow the routine above and to stop at step 6. Report each PR with its preview link, and any question an agent stopped on.

## Git notes

- Remote: `origin` = `git@github.com:LezardSC/portfolio.git`, default branch `master`.
- `master` is protected: changes go through a PR whose CI job `checks` passed (admins included, no force-push). **Merging deploys the site** to https://jocelynrenault.com (`docs/deploy.md`). The repo is public: never commit credentials.
- Worktrees live in `.claude/worktrees/<name>`, with local branch `worktree-<name>`. The remote branch is `<name>`, so push with
  `git push origin worktree-<name>:<name>`, because a plain `git push` is refused (the names differ).
- **Before opening a PR, and again before saying it is ready to merge:** `git fetch` and check `git log HEAD..origin/master`. Jocelyn merges other branches in parallel, so `master` may have moved. If it has, rebase onto `origin/master` (never a merge commit: the user merges with "Rebase and merge", which drops merge commits and brings conflicts back), resolve each conflict inside the commit that causes it, re-run the checks, and push with `git push --force-with-lease=<name>:<old sha> origin worktree-<name>:<name>`. Confirm with `gh pr view <n> --json mergeStateStatus` (must be `CLEAN`, not `BEHIND` or `DIRTY`).
- **A PR branch may have been rebased on GitHub** by the Auto-rebase workflow since you last pushed (it then has a new committer, `github-actions[bot]`). Before working on an existing PR again: `git fetch`, and if `git log worktree-<name>..origin/<name>` lists commits, `git rebase origin/<name>` (commits already there are skipped). A push whose lease is refused means the same thing: fetch and rebase, never force without a lease.

## Reference material

- `tmp/` in the main checkout (`/home/lezard/portfolio/tmp/`, gitignored, not in worktrees) holds 4 screenshots of the user's Malt profile (`malt1.png`–`malt4.png`): bio, stack, portfolio projects, experience, recommendations, education, certifications, skills. Use them as a content source; never commit them.
