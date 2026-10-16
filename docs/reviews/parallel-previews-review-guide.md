# How to review PR #54 (PR previews and parallel issue work)

Branch `parallel-previews` → `master`. Closes #53.

The review has three parts:

1. **Try it from your phone** (5 min). This PR is its own first test.
2. **Read the routine and the setup doc** (10 min). They decide how future work runs.
3. **Code review** (10–15 min).

Source of truth: `docs/superpowers/specs/2026-10-16-parallel-work-previews-design.md` and the plan `docs/superpowers/plans/2026-10-16-parallel-work-previews.md`.

---

## 1. Try it from your phone

Open PR #54 in the GitHub app. The bot comment links:

- **English / Français**: the site built from this branch, at `https://pr-54.jocelynrenault-previews.pages.dev`. It should look exactly like the live site (this PR changes no page).
- **Visual review**: `/_review/`, which should say "No visual change".

What I already checked on the real run:

- Every step of the Preview workflow passed; `checks` (CI) passed too.
- `/en/`, `/fr/` and `/_review/` answer 200 with `x-robots-tag: noindex`.
- Two separate CI builds (this PR and its merge base) capture identically: "No visual change", so no false noise.
- With a throwaway red outline pushed on top, the **same** comment was edited (not a second one) to "25 of 25 screens changed", and `/_review/` showed before / after / diff, one column at 390px, no sideways scroll. That commit was then dropped.
- After a push, the PR address takes **about two minutes** to show the new version (Cloudflare). The comment now says so.

To see the review page with real changes, open any future PR that touches the UI.

## 2. The routine and the setup

- `CLAUDE.md`, "Smaller work goes issue by issue": the 6-step routine (one worktree per issue, `npm ci`, ask before guessing, checks, PR, check `/_review/`, stop) and how dispatching several issues works.
- `README.md`, "Working on several issues at once".
- `docs/deploy.md`, "PR previews": what a preview is and is not, and the one-time setup you just did. Check it matches what you clicked (the dashboard now hides Pages behind "Continue to Pages").

## 3. Code review

| Commit | What |
|---|---|
| `docs: design for parallel issue work and PR previews` | spec |
| `docs: plan for PR previews…` | plan |
| `fix: audit and screens pick free ports…` | `scripts/preview.ts` (`freePort`, `startPreview` returns `{ origin, stop }`), audit and screens use it |
| `feat: screens --out and --no-build…` | `parseScreensArgs` (pure, tested); `screens.ts` split into `captureInto` / `compareDirs` |
| `feat: review page listing the screens a PR changed` | `scripts/review-page.ts` (pure, tested) |
| `feat: screens review mode writes the before/after page` | JPEGs + `index.html` + `summary.txt` |
| `feat: PR comment linking the preview and its review page` | `preview-comment.ts` (pure, tested) and its runner `post-preview-comment.ts` |
| `feat: preview of every PR on Cloudflare Pages…` | `.github/workflows/preview.yml`, `docs/deploy.md` |
| `docs: routine for parallel issue work…` | CLAUDE.md, README |
| `fix: Cloudflare secrets only in the deploy step…` | after the final review |
| `fix: preview comment says the address takes a minute to update` | after the real run |

Things worth a look:

- **`preview.yml`**: the Cloudflare token is in the deploy step's `env` only, and the checkout does not keep the GitHub token, so the PR's code (install, build, captures) never sees a credential. The three review steps are `continue-on-error`: if they fail, the site still deploys and the comment says the review page is unavailable.
- **The base capture** runs this PR's `screens.ts` from a worktree of the merge base, so `vite preview` serves that checkout's build.
- **`wrangler` is not a dependency** (it would add about 150 MB to every `npm ci`): the workflow runs `npx --yes wrangler@4.146.0`.
- **Local `npm run screens`** behaves as before: `--compare` gave "all 25 captures identical" right after the restructure. Unknown options now fail instead of being ignored.

## Known limits (not fixed here)

- A PR that changes what `openCollapsibles()` clicks makes the base capture fail: the comment then says "Visual review unavailable" on every push of that PR.
- When every screen changes, `/_review/` is heavy (about 50 MB of JPEGs, loaded lazily).
- Old Cloudflare deployments are never deleted (out of scope; the free plan keeps them).
- Minor hardening noted by the final review: audit's Chromium debugging port has no retry if another process takes it first; the image loaders in `screens.ts` have no error path (a corrupt PNG would hang until the job timeout).
