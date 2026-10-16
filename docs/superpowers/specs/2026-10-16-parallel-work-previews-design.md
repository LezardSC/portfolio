# Parallel work and PR previews: design

Date: 2026-10-16. Status: approved in conversation, waiting for review of this written version.

## Goal

Work on several GitHub issues at once (one agent, one worktree, one branch and one PR per issue) and review each PR's visual result easily, **from a phone** when away from the computer.

Success means:

- Every PR to `master` gets its own preview URL, posted on the PR, that updates on each push.
- From that PR, a phone can also see how the change looks at desktop widths and in both themes, and whether anything changed that should not have.
- Several agents can run `npm run audit` and `npm run screens` at the same time on one machine.
- One written routine covers both ways of starting work: one terminal per issue (`claude --worktree issue-47-…`) or one session that dispatches background agents.
- Production is unchanged: OVH, deployed only when a PR is merged (`docs/deploy.md`).

## Decisions taken

| Question | Choice | Why |
|---|---|---|
| Preview host | **Cloudflare Pages**, deployed from GitHub Actions with `wrangler` | Each PR gets its own deployment at the root of its own URL: the same build as production (no base path), nothing shared between PRs, nothing to clean up, previews `noindex` by default. GitHub Pages was the alternative (no new account) but a repo has one Pages site: previews under `/portfolio/pr-N/` (a base path production never uses), one shared `gh-pages` branch with a deploy queue, a cleanup job, our own `noindex`. |
| Screenshots | **A before/after review page built by CI**, published inside the preview | Shows the desktop layout and the other theme on a phone, and catches unintended changes. Agents do nothing extra. |
| Starting work | **Both** one terminal per issue and dispatch from one session | Same routine for both. Terminal per issue on the main computer; dispatch when wanted. |

## Part 1: a preview for every PR

New workflow `.github/workflows/preview.yml`, separate from `ci.yml`:

- **Trigger:** `pull_request` into `master` (opened, synchronize, reopened). Not required by branch protection: `checks` stays the only required status, so a preview problem never blocks a merge. `concurrency: preview-<PR number>` with `cancel-in-progress: true`.
- **Permissions:** `contents: read`, `pull-requests: write` (for the comment).
- **Steps:** checkout, setup-node from `.nvmrc`, `npm ci`, `npm run build`, Part 2's review page into `build/_review/`, then `wrangler pages deploy build --project-name=<project> --branch=pr-<n>`. `wrangler` is not a dependency (it would add about 150 MB to every `npm ci`): the workflow runs it with `npx --yes wrangler@4.146.0`, an exact version.
- **Address:** the branch alias `https://pr-<n>.<project>.pages.dev`, stable for the life of the PR. Every push replaces what it serves.
- **Never production:** the Cloudflare project's production branch is `master`, and the workflow never deploys `master`. Every deployment is a preview, which Cloudflare serves with `X-Robots-Tag: noindex`; the workflow also writes a `build/_headers` file setting that header on every path, so it does not depend on Cloudflare's default. (`_headers` exists only in the preview build, never in `static/`.) The production `*.pages.dev` address stays empty.
- **PR comment:** one comment, found by a hidden marker (`<!-- preview -->`) and edited on each push rather than added again. It contains links to `/en/` and `/fr/`, a link to `/_review/` with its one-line summary ("4 of 25 screens changed" / "No visual change"), and the short commit SHA it shows. Posted by `scripts/post-preview-comment.ts` through the GitHub REST API with the workflow's token, no third-party action. Only a comment by `github-actions[bot]` that starts with the marker counts as the preview comment.
- **Secrets:** only the deploy step receives them, and the checkout does not keep the GitHub token, so the PR's own code (install, build, captures) never sees a credential. `CLOUDFLARE_API_TOKEN` (scoped to *Account → Cloudflare Pages → Edit*) and `CLOUDFLARE_ACCOUNT_ID`. If they are missing (before setup) the job ends early with a notice in its log, and no comment. A fork's PR gets no secrets: its jobs are skipped, with no comment.
- **Known differences from production**, written in the comment's footer: `.htaccess` does not run (so `/` does not redirect to a language: the comment links `/en/` and `/fr/`); OVH's caching and headers are not tested (the post-merge `npm run smoke` still checks them on the live site). `SITE_ORIGIN` stays the real domain, so canonical and share URLs point to production, which is right.
- **One-time setup** by Jocelyn, documented in a new "PR previews" section of `docs/deploy.md`: create the Cloudflare account, create the Pages project (direct upload, production branch `master`), create the token, `gh secret set` both values.

## Part 2: the before/after review page

Built in the same `preview.yml` run, before the deploy step.

- **Before = the PR's merge base with `master`**, not `master`'s tip, so changes merged into `master` since the branch started never show up as this PR's changes. (With the rebase rule in CLAUDE.md the two are usually the same.) The workflow adds a git worktree for it at `$RUNNER_TEMP/base`, runs `npm ci` and `npm run build` there.
- **Capture:** both builds are captured by the PR's own `scripts/screens.ts` (same capture code for both sides), with the existing list from `captures()`: EN/FR × dark/light × 360–1440px, phone collapsibles open, before hydration. 25 full pages per side.
- **`screens.ts` gains options**, its current behaviour unchanged without them:
  - `--out <path>`: write the captures there instead of `reports/screens-baseline/`.
  - `--no-build`: serve the existing build instead of running `npm run build` first.
  - `--before <path> --after <path> --review <path>`: compare two capture folders (only a browser page to compute pixel diffs, no server) and write the review page.
- **Capturing the base:** SvelteKit's `vite preview` serves `.svelte-kit/output` of the current directory, not an arbitrary folder, so there is no `--dir` option. The workflow runs the PR's `scripts/screens.ts` with the base checkout as working directory; `startPreview()` starts that checkout's own `vite preview`.
- **The page** `build/_review/index.html`, made by a pure function in `scripts/review-page.ts` (unit tests in `review-page.spec.ts`), with no JavaScript and inline CSS:
  - a summary line at the top, then **only the captures that changed**, in `captures()` order;
  - for each: its name (e.g. `fr-light-1280`), the changed-pixel count and bounding box, then *before*, *after* and *diff* images in a grid that stacks them in one column on a phone and puts them side by side on a wide screen, each a link to the full-size image;
  - a capture whose page height changed has no pixel diff: before and after only, with both sizes;
  - "No visual change" alone when nothing differs;
  - readable at 360px; `noindex` meta as well.
- **Image size:** comparison stays on the lossless PNGs. Published images are JPEG (quality 80) from the same canvas that computes the diff, so the page stays light on a phone connection. Only changed captures are published.
- **Failure:** if any capture or comparison step fails, the site preview still deploys and the comment says "Review page unavailable (see the workflow log)" with a link to the run.
- **Cost:** about 3 extra minutes of CI per push (a second `npm ci` and build, 50 captures). Free for a public repo.
- Related but separate: issue #44 (`npm run screens` silently replaces the baseline). The new options do not change that behaviour; if the change makes #44 trivial it is mentioned in the PR, not done in it.

## Part 3: local scripts safe to run in parallel

- `startPreview()` in `scripts/preview.ts` stops taking a fixed port. It asks the OS for a free one (listen on port 0, read the port, close), starts `vite preview --strictPort` on it and returns the origin with the stop function. It keeps waiting for Vite's own URL line (`previewReady`), so it can never test another worktree's server.
- `audit.ts` (fixed 4180 and Chromium debugging port 9223) and `screens.ts` (fixed 4181) use that origin, and `audit.ts` gets a free port for Chromium the same way.
- The free-port helper has a unit test (returns a port that can then be listened on).
- `build/`, `reports/` and `node_modules/` are already per worktree. `npm run dev` stays as it is: Vite takes the next free port and prints it; the routine says to read the printed URL.

## Part 4: the per-issue routine

A new section in CLAUDE.md, **"Working on an issue"**, next to the milestone workflow (milestones keep theirs). A short version goes in the README's contributing part.

1. **Worktree** `issue-<n>-<slug>`, remote branch `issue-<n>-<slug>`. In a terminal: `claude --worktree issue-<n>-<slug>`. Dispatched: the agent creates it. Then `npm ci`.
2. **Read** `gh issue view <n>`. If the issue is unclear or needs a choice that is Jocelyn's to make, ask before writing code; a dispatched agent stops and reports the question instead of guessing.
3. **Work:** tests first for logic; then lint, check, test, build; `npm run audit` when the UI changed.
4. **PR:** fetch and rebase on `origin/master` (existing rule), push, `gh pr create` with `Closes #<n>` and a short "what to look at" list.
5. **Before reporting done:** wait for the preview comment, open `/_review/`. If something changed that should not have, fix it and push again. Then stop: Jocelyn reviews and merges.
6. **Review comments:** "address the review on PR #<n>" (in that worktree's terminal, or a new session) reads the comments with `gh`, fixes, pushes, and replies on each thread.

**Dispatching** (in one main session, "work on #47 #48 #50"): check from each issue which files it is likely to touch; issues likely to touch the same files run one after another, the rest in parallel, each as a background agent in its own worktree following the routine above. The session then lists each PR with its preview link, and any questions an agent stopped on.

**From the phone** (GitHub app): the preview comment notifies; open the site or `/_review/`; comment or request changes; *Rebase and merge* deploys as today.

## Testing

- Unit tests: free-port helper, `review-page.ts` (summary wording, only changed captures, size-changed case, nothing-changed case, escaping of names), and the comment body builder if it is a function (it will be: `scripts/preview-comment.ts`).
- `npm run check` covers the new scripts (`tsc -p scripts`).
- The workflow is tested for real on this feature's own PR: it must post a working preview link and a review page. A deliberate one-line CSS change in a throwaway commit checks that the review page shows it, then is dropped before review.
- Two `npm run audit` runs started at the same time in two worktrees both pass.

## Out of scope

- Issue #23 (`.claude/` missing from `.gitignore` and `.prettierignore`), its own PR.
- Deleting old Cloudflare deployments: free tier keeps them; revisit only if it becomes a problem (new issue then).
- Running agents in the cloud (claude.ai/code).
- Changing production hosting or the deploy workflow.
