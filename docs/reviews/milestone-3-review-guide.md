# How to review PR #3 — Milestone 3 (Hero + About)

Branch `milestone-3-hero-about` → `master`. The PR number may differ; see the PR link on GitHub.

The review has three parts, in this order:

1. **Automated checks** (2 min)
2. **Manual browser testing** (10 min). No browser was available while this was built, so this part is yours.
3. **Content and code review** (15–20 min). Most of it is reading your own bio in both languages.

Source of truth: the "Hero + About" section of `docs/superpowers/specs/2026-09-23-portfolio-design.md`,
together with `docs/superpowers/plans/2026-09-30-milestone-3-hero-about.md`.

---

## 0. Get the code

```bash
cd /home/lezard/portfolio/.claude/worktrees/milestone-3-hero-about
npm install
```

(Alternative from any clone: `gh pr checkout <PR number>`.)

| Commit | Plan task |
|---|---|
| `docs: specify Hero and About for Milestone 3` | spec |
| `docs: add Milestone 3 hero and about implementation plan` | plan |
| `feat: add base-aware assetHref helper` | Task 1 |
| `feat: add profile content, CVs and cropped photo` | Task 2 (also 2 small spec refinements, `.gitignore`) |
| `feat: render hero with role, pitch and CTAs` | Task 3 (dicts, Hero, Nav brand, shared `GitHubIcon`) |
| `feat: render about section with photo, bio and facts` | Task 4 |
| `docs: add Milestone 3 review guide` | this file |
| `fix: language switch lands on the section in view` | review feedback |
| `feat: glide to the current section after a language switch` | review feedback |
| `feat: rename the Featured sort to Highlights` | review feedback |

Task 5 (build verification) changed no files.

## 1. Automated checks

```bash
npm run check && npm test && npm run lint && npm run build
```
Expected: 0 errors/warnings, 66 tests pass, lint clean, build writes `build/`.

## 2. Manual browser testing

```bash
npm run preview    # http://localhost:4173
```

Hero (`/en/` then `/fr/`):
- [ ] "Jocelyn Renault", the role line in the accent colour, the pitch, then 3 buttons.
- [ ] **See projects** scrolls to Projects.
- [ ] **Download CV** opens the PDF in a new tab. `/fr/` → `cv-fr.pdf`, `/en/` → `cv-en.pdf`. The EN one is still the French CV (see §3).
- [ ] **GitHub** opens github.com/LezardSC in a new tab.
- [ ] Browser tab title: "Jocelyn Renault — Software Engineer" / "— Ingénieur logiciel".
- [ ] No "Available for work" pill. To see it, set `available: true` in `src/lib/data/profile.ts`, check it in `npm run dev`, then set it back.

About:
- [ ] Round photo on the left, the 3 paragraphs on the right, and 2 fact chips below (🎓 42 Lyon (RNCP 7), 🗣 French / English).
- [ ] The photo shows only you: no friend, no hand.

Language switch (the fix from your first review):
- [ ] Click **About** in the nav, scroll back to the very top, then switch language: you stay at the top.
- [ ] Scroll into Projects without clicking a link, then switch language: the new page opens at the top, then glides smoothly to the start of Projects. The URL has no `#projects`.
- [ ] With reduced motion on (DevTools → Rendering → `prefers-reduced-motion: reduce`), the same switch jumps to Projects without animating.

Projects sort:
- [ ] The sort menu reads **Highlights / Newest** in EN and **Incontournables / Plus récents** in FR.

Both themes (toggle in the nav):
- [ ] The primary button is readable in dark and light mode.

Phone width (DevTools device mode, 360px wide):
- [ ] The buttons wrap onto several lines, and nothing scrolls sideways.
- [ ] In About, the photo sits centred above the text.
- [ ] Known limitation: the nav brand is longer now, so only 1–2 section links are visible before the strip scrolls. The mobile nav is planned for M7.

## 3. Content and code review

**Content (the part that matters most):** read `src/lib/data/profile.ts`. It holds the pitch, the 3 bio
paragraphs and the facts in EN and FR. Edit any wording directly. The tests only check that no field is empty.

**Files you added:**
- `static/cv-fr.pdf`: I checked it, and the phone number is gone.
- `static/cv-en.pdf`: a copy of the French CV for now. Overwrite it with the English export when it's ready. No code change is needed.
- `static/photo.jpg`: cropped once to 480×480, with the phone's EXIF data stripped. The original is not kept in git.

**Code, in reading order:**
1. `src/lib/paths.ts` + `paths.spec.ts`: a single `assetHref` helper.
2. `src/lib/data/profile.ts` + `profile.spec.ts`: content, plus checks that the CV and photo files exist.
3. `src/lib/i18n/en.ts` / `fr.ts`: `hero.name`/`tagline` removed; new CTA, alt and "new tab" labels.
4. `src/lib/components/sections/Hero.svelte`, `About.svelte`: rendering only; props narrowed to their dict slice.
5. `src/lib/components/icons/GitHubIcon.svelte`: extracted from `ProjectLinks.svelte`, which now uses it.

**Final review result:** a fresh reviewer said "Ready to merge: Yes", with 0 Critical and 0 Important
issues. Its 5 minor findings are deferred:
- the facts list is keyed on the emoji;
- the green availability dot is a hardcoded colour;
- the local `.sr-only` should move to `app.css` once it's reused;
- `profile.spec` resolves `static/` relative to the working directory;
- the mobile nav space issue above.
