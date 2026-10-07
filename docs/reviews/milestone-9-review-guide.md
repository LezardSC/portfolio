# How to review the Milestone 9 PR (Desktop design)

Branch `milestone-9-desktop-design` → `master`. See the PR link on GitHub for the number.

The review has three parts, in this order:

1. **Automated checks** (3 min)
2. **Compare with the design and try it in a real browser** (15–20 min). I already drove the built site with headless Chromium at 360, 390, 768, 1024, 1280 and 1440px, both themes and both languages, and measured the key styles against the design values. What I can't do is look at the canvas next to the site with your eyes, use your real mouse and keyboard, or judge how it feels.
3. **Code review** (10 min)

Source of truth: the "Milestone 9 — Desktop design" section of `docs/superpowers/specs/2026-09-23-portfolio-design.md`, the plan `docs/superpowers/plans/2026-10-08-milestone-9-desktop-design.md`, and the validated artboards on the canvas https://claude.ai/artifact/5rqhnCoS2tUFHpioTu8jZG (**A1·M3 révisée — clair**, **A1·M3 révisée — sombre**, **Compétences 4A**; copies of their sources in `docs/superpowers/designs/2026-10-07-m9-final/`).

Phones are **not** designed in this milestone (that's M10): they get the new colours and font with the M8 layouts, and I only checked that nothing breaks.

---

## 0. Get the code

```bash
cd /home/lezard/portfolio/.claude/worktrees/milestone-9-desktop-design   # or: gh pr checkout <PR number>
node -v                 # v24.x (source ~/.nvm/nvm.sh && nvm use 24 otherwise)
npm ci
```

| Commit | Plan task |
|---|---|
| `docs: Milestone 9 desktop design spec and final design sources` | spec |
| `docs: Milestone 9 implementation plan` | plan |
| `feat: M9 theme tokens, Schibsted Grotesk and shared buttons` | Task 1 |
| `feat: numbered section grid, nav numbers and CV button` | Task 2 |
| `feat: hero with the at-a-glance card and Malt button; About photo 4:5` | Task 3 |
| `feat: segmented project filters, restyled featured and more-project cards` | Task 4 |
| `feat: skills as vertical tabs with a description per area` | Task 5 |
| `feat: experience rows with durations, boxed quotes and hackathon results` | Task 6 |
| `feat: email and Malt contact blocks, brand tiles and footer band` | Task 7 |
| `feat: JR favicon, generated share images and per-locale meta` | Task 8 |
| `feat: fade sections in once as they scroll into view` | Task 9 |
| `fix: audit pages with reduced motion so axe checks every section` | Task 10 |
| `fix: keep two featured project columns at 1024px` | Task 10 |
| `docs: add Milestone 9 review guide` | this file |

## 1. Automated checks

```bash
npm run check && npm test && npm run lint && npm run build
npm run audit -- --screens     # full-page screenshots land in reports/screens/
```

Expected (what I got):

| Check | Result |
|---|---|
| `npm test` | 243 passed |
| `npm run check` | 0 errors, 0 warnings |
| axe — EN/FR × dark/light × 360/1280px, menu open, before hydration | 0 violations (17 runs) |
| No horizontal scroll at 360px | fits (EN/FR × dark/light) |
| Lighthouse mobile — Performance / A11y / Best practices / SEO | 98 / 100 / 100 / 92 (pending domain: hreflang) |
| Lighthouse desktop — Performance / A11y / Best practices / SEO | 100 / 100 / 100 / 92 (pending domain: hreflang) |
| Design values measured in the browser (19 selectors × 2 themes × 2 languages) | all match |

The design-value check compared the computed styles with the artboards: ground and footer colours per theme, Schibsted Grotesk, hero name 122px/900, role accent, at-a-glance card border and background, section number 112px, titles 46px/800, nav 72px, featured titles 32px, more-project titles 19px, selected tab shadow, panel min-height 480px, job titles 24px, email 30px/800.

## 2. Compare with the design, then try it

Open the canvas and the site side by side (`npm run dev`, or `npm run preview` after a build) at a 1280–1440px window.

### Screenshots (from my run, in `docs/reviews/milestone-9/`)

| | |
|---|---|
| Hero, light FR | `hero-fr-light-1440.png` |
| Hero, dark EN | `hero-en-dark-1440.png` |
| About | `about-fr-light-1440.png` |
| Projects | `projects-fr-light-1440.png`, filters in dark `projects-filters-en-dark-1440.png` |
| Skills | `skills-fr-dark-1440.png`, Blockchain tab `skills-en-light-1280-blockchain.png` |
| Experience | `experience-en-light-1440.png` |
| Contact + footer | `contact-fr-light-1440.png`, `contact-fr-dark-1440.png` |
| Phone (not designed yet, just "nothing breaks") | `hero-fr-light-360.png` |
| Share image / favicon | `og-fr.png`, `favicon-tabs.png` |

### Deviations from the canvas (please confirm)

Chosen by you during the brainstorming:

- Project filters keep the **result count** next to each label.
- **Recommendation quotes are whole on desktop** (the canvas cut one with "Read more").
- Footer keeps **"© 2026"** before the name.
- **Nav numbers** use Schibsted Grotesk instead of IBM Plex Mono (one font file less).

Taken during the build, each because the canvas value broke something:

- **Hero buttons are 8px narrower** (18px side padding instead of 22px): in French the three buttons wrapped onto two rows.
- **Hero name scales below ~1270px wide** (`min(122px, 9.6vw)`): it's 122px at 1280 and 1440, 98px at 1024, so it never overflows.
- **Section titles shrink only when their longest word doesn't fit** the narrow title column: "Compétences" is 40px (it was 300px wide in a 266px column and touched the tab list; the canvas has the same flaw), "Expérience & Formation" / "Experience & Education" 44px. All other titles stay 46px.
- **Section numbers** keep the same 2px outline, drawn differently (a 4px stroke under a fill): the bare outline showed the font's inner overlapping lines in "4".
- **Featured project cards** keep 2 columns down to 1024px (minimum card width 320px instead of 380px). Nothing changes at 1280 and 1440.
- **Hackathons stay newest first** (the canvas listed the wins first).
- The skills panel isn't a separate Tab stop (its text follows the tabs in reading order); Tab goes from the selected tab to the next control.
- **Share images only show once the site has a domain** (M11): LinkedIn, Malt and Slack need an absolute image URL. The images are already in `static/og-en.png` / `og-fr.png`.

### In a real browser, at 1280–1440px

- [ ] Both themes (moon/sun button) look like the two canvas artboards; refresh keeps the theme.
- [ ] The at-a-glance card is fully visible without scrolling on your screen.
- [ ] "Voir le CV" opens the PDF in a new tab; "Profil Malt" and "Voir mon profil Malt" open your Malt profile.
- [ ] Nav: numbers in accent, the current section underlined while you scroll, the CV button opens the PDF.
- [ ] Projects: each filter combination works, counts update, zero-result options are disabled, the empty state's reset button works. Hover a featured card (image zoom + accent underline under the title) and a small card (lift + accent shadow).
- [ ] Skills: click each area; with the keyboard, Tab to the selected area, then ↑/↓ (wraps around), Home/End.
- [ ] Contact: "Copier l'adresse" → "Copié !"; hover the LinkedIn/GitHub/CV tiles (filled tile, accent shadow, logo still visible).
- [ ] Sections fade in once as you scroll down. With **Reduce motion** turned on in your OS, nothing fades (everything is just there).
- [ ] The tab shows the JR favicon.
- [ ] Narrow the window to ~1024px: nothing overflows, featured projects stay 2 columns.
- [ ] Phone (or DevTools at 360–390px): it's the M8 layout with the new colours; nothing overlaps or scrolls sideways. The real phone design is M10.

## 3. Code review

- `src/app.css`: theme tokens (dark default, light, and the no-JS light block, kept identical by `src/lib/theme-tokens.spec.ts`), shared `.btn` / `.btn-primary`, scroll-reveal classes. `THEME_BG` in `src/lib/skills.ts` mirrors the grounds (`theme-color` meta and logo colours use it).
- `src/routes/+layout.svelte`: Schibsted Grotesk from `@fontsource-variable/schibsted-grotesk` (self-hosted, no Google request), the latin woff2 preloaded, icon links.
- `src/lib/components/Section.svelte`: the 12-column grid, outlined number (`sectionNumber()`), title size capped by the column (`longestWordLength()`), optional lead, `use:reveal`.
- `src/lib/reveal.ts` / `reveal-dom.ts`: `shouldReveal()` (tested) and the one-shot `IntersectionObserver` action. Nothing is hidden without JS, under reduced motion, in print, or for a section already on screen.
- `Hero.svelte` + `PROFILE.glance` (`src/lib/data/profile.ts`); `About.svelte` (4:5 photo, no fact chips).
- `ProjectFilters.svelte` (segmented bars on desktop, three dropdowns on phones, same state), `ProjectCardLarge.svelte` (desktop design + the M8 phone overlay kept), `ProjectCardSmall.svelte`, `ProjectLinks.svelte` (text links), `TechTags.svelte`.
- `Skills.svelte`: ARIA tabs, `nextTab()` (tested) for the keys; the tab list only exists after hydration, so the prerendered page shows all six areas. Descriptions live in `src/lib/data/skills.ts`.
- `src/lib/experience.ts`: `durationMonths()`, `durationLabel()`; `MEDAL_EMOJI` and `quoted()` are gone. `JobItem.svelte`, `EducationItem.svelte`, `Experience.svelte`.
- `Contact.svelte`, `contactLinks()` (now the three tiles), `ContactIcon.svelte` (LinkedIn's lighter blue in dark), `Footer.svelte`.
- `scripts/og.ts` (`npm run og`) regenerates `static/og-*.png`, `apple-touch-icon.png` and `favicon.ico` from `static/favicon.svg`; `scripts/ico.ts` (tested) writes the ICO.
- `scripts/audit.ts`: pages now use reduced motion, otherwise axe skipped the contrast of every section below the fold (they were still at opacity 0).

Your main checkout still has the downloaded icons8 files and a deleted `src/lib/assets/favicon.svg` (not part of this branch): `git restore src/lib/assets/favicon.svg` there and delete the icons8 files, or let the merge replace them.
