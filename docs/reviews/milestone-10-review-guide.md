# How to review the Milestone 10 PR (Phone design)

Branch `milestone-10-phone-design` → `master`. See the PR link on GitHub for the number.

The review has three parts, in this order:

1. **Automated checks** (3 min)
2. **Compare with the board and try it on a real phone** (15–20 min). I drove the built site with headless Chromium at 360, 390, 900 and 1280px, both themes and both languages, measured the key styles against the board, and checked the folding behaviour with and without JavaScript. What I can't do is put the canvas next to your phone, touch the screen, or judge how it feels.
3. **Code review** (10 min)

Source of truth: the "Milestone 10 - Phone design" section of `docs/superpowers/specs/2026-09-23-portfolio-design.md`, the plan `docs/superpowers/plans/2026-10-08-milestone-10-phone-design.md`, and the boards **Mobile - clair** / **Mobile - sombre** on the canvas https://claude.ai/artifact/9N2zK35VungBsy2GnLcE59 (snapshot in `docs/superpowers/designs/2026-10-08-m10-final/`).

"Phone" means narrower than 48rem (768px). From 768px up the site is the M9 desktop design, unchanged.

---

## 0. Get the code

```bash
cd /home/lezard/portfolio/.claude/worktrees/milestone-10-phone-design   # or: gh pr checkout <PR number>
node -v                 # v24.x (source ~/.nvm/nvm.sh && nvm use 24 otherwise)
npm ci
```

| Commit | Plan task |
|---|---|
| `docs: final phone design references for Milestone 10` | design snapshot |
| `docs: Milestone 10 phone design spec`, `docs: no filter counts in the phone selects` | spec |
| `docs: Milestone 10 implementation plan` | plan |
| `feat: project summaries, main domain and domain colours; split pitch and short glance values` | Task 1 |
| `feat: phone header with a Contact button instead of the menu; one-line section headers` | Task 2 |
| `feat: phone hero with glance tiles and an About folded behind Read more` | Task 3 |
| `feat: phone featured cards on a veiled photo or domain colour; board-style filter selects` | Task 4 |
| `feat: other projects as domain-tinted phone tiles with summaries, six then See N more` | Task 5 |
| `feat: skills accordion on phones, one group open at a time` | Task 6 |
| `feat: phone experience with recommendations behind a button; compact education and hackathons` | Task 7 |
| `feat: compact phone contact with a one-row Malt card and three equal buttons; phone footer` | Task 8 |
| `docs: add Milestone 10 review guide; audit opens the phone collapsibles` | Task 9 |
| `fix: Malt card link named by its visible title on phones` | final review |

## 1. Automated checks

```bash
npm run check && npm test && npm run lint && npm run build
npm run audit -- --screens     # full-page screenshots land in reports/screens/
```

Expected (what I got):

| Check | Result |
|---|---|
| `npm test` | 258 passed |
| `npm run check` | 0 errors, 0 warnings |
| axe: EN/FR × dark/light × 360/1280px, **every phone collapsible opened** at 360px, before hydration | 0 violations (21 runs) |
| No horizontal scroll at 360px | fits (EN/FR × dark/light) |
| Lighthouse mobile: Performance / A11y / Best practices / SEO | 97 / 100 / 100 / 92 (pending domain: hreflang) |
| Lighthouse desktop: Performance / A11y / Best practices / SEO | 100 / 100 / 100 / 92 (pending domain: hreflang) |
| Board values measured in the browser at 390px (21 selectors × 2 themes × 2 languages) | all match |

Measured values: header 60px with the Contact button, hero name 58px, role 20px, 2px tile borders, section number 46px, titles 29px, About photo 88px, selects 48px / 16px, featured cards ≥300px with a 2px border and 23px titles, tiles ≥200px with 17px titles, accordion rows 64px, job titles 20px, recommendation buttons 48px, e-mail on one line, contact buttons 72px, footer 76px.

**Page height at 390px:** 10,992px → 7,470px in French (−32%), 10,757px → 7,283px in English. Per section (FR): hero 1302 → 771, About 960 → 415, Projects 3982 → 3043, Skills 1095 → 959, Experience 2503 → 1620, Contact 1022 → 586.

## 2. Compare with the board, then try it

Open the canvas and the site side by side: `npm run dev`, then DevTools device mode at 390px (and 360px), or your phone on the same network (`npm run dev -- --host`).

### Screenshots (in `docs/reviews/milestone-10/`)

| | |
|---|---|
| Hero | `hero-fr-light-390.png`, `hero-fr-dark-390.png` |
| About (folded) | `about-fr-light-390.png` |
| Projects: selects and featured cards without photos | `projects-fr-light-390.png` |
| Featured cards with stock photos (injected for the check only, not in the repo) | `projects-photos-fr-dark-390.png` |
| Other projects as tiles | `tiles-fr-light-390.png`, `tiles-fr-dark-390.png` |
| Skills (DevOps open) | `skills-fr-dark-390.png` |
| Experience (first recommendation open) | `experience-fr-light-390.png` |
| Contact + footer | `contact-fr-light-390.png`, `contact-en-dark-360.png` |
| Whole page at 360px | `full-fr-light-360.png` |
| Desktop, unchanged from M9 | `desktop-en-dark-1280.png` |

### Deviations from the board (please confirm)

Chosen by you during the brainstorming:

- **Featured cards without a photo** (all of them today) show the project's **domain colour** under a lighter veil (35%) with a large domain icon as a watermark. With a photo: blurred 6px, 62% veil, as on the board.
- **Web gets violet `#5B3FA0`** (the board reused the low-level red).
- **No result counts in the phone selects** (decided while planning: "Professionnel (1)" can't fit a half-width select at 16px). Zero-result options stay disabled. Desktop keeps its counts.
- Footer keeps **"© 2026"** before the name.

Taken during the build, each because the board value broke something:

- **Header at 360px:** the name drops to 16px and the Contact button padding to 12px below 390px wide; at 390px it's the board's 18px. With the board values the four items were 14px too wide for a 360px screen.
- **Selects at 360px:** below 390px wide the selects have less inner padding, so "Professionnel" isn't cut (the font stays 16px).
- **Hero name** scales down below 390px (58px at 390, ~54px at 360).
- **E-mail address** is 19px from 375px wide and ~18.3px at 360px so it stays on one line.
- **Long section titles wrap beside their number** ("Expérience & / Formation" next to "04") instead of dropping under it.
- The certificate link keeps its existing text **"Voir le certificat ↗"** (the board shows "Certificat ↗").
- **Vincent's recommendation opens whole** (the board cut it with a "Lire la suite" inside the quote).
- Tiles don't show awards (the board has none); the featured cards do.

### For you to review

- **The 17 one-sentence summaries** in `src/lib/data/projects.ts` (`summary:`): I drafted the English for all and the French for the 6 featured projects; the French for the small ones are your drafts from the board.
- **Real photos are still to supply.** For each featured project: an image in `static/projects/` referenced as `media: { kind: 'image', src: 'projects/…' }` (or a video with its `poster`). The phone card then uses it as the blurred background automatically; tune the blur/veil once you see them (`--blur` and the two `--veil` values in `ProjectCardLarge.svelte`, mirrored in `src/lib/overlay.ts`).

### On a real phone (or device mode)

- [ ] Header: name, theme, EN/FR and **Contact** (no menu). Contact scrolls to the Contact section, title not hidden under the bar.
- [ ] Hero matches the board in both themes; "Voir le CV" opens the PDF, "Malt ↗" your profile.
- [ ] About: "Lire la suite" shows two more paragraphs, "Réduire" folds them back.
- [ ] Projects: the native pickers open for Contexte, Domaine, Trier par; options with no result are greyed out. Changing a filter animates the list.
- [ ] Featured cards: domain colours read well, text is legible, "Code ↗" opens GitHub; GoldenEye says "Code privé".
- [ ] Tiles: 6 shown, "Voir les 5 autres projets" shows the rest, "Réduire la liste" folds; changing a filter folds the list back.
- [ ] Skills: one group open at a time, tapping the open group closes it. In the browser's find-in-page, search « Kubernetes »: the DevOps group opens.
- [ ] Experience: each "Recommandation - …" button opens its quote.
- [ ] Contact: "Copier l'adresse" → "Copié !"; tapping anywhere on the Malt card opens Malt; the three buttons are easy to hit.
- [ ] Rotate to landscape / widen past 768px: the desktop layout comes back with every project and the selected skills tab; nothing is lost.
- [ ] On an iPhone (Safari): "Réduire", "Réduire la liste" and closing a recommendation don't make the page jump (Safari has no scroll anchoring; I couldn't test WebKit).
- [ ] Once real photos exist: is the text on the featured cards readable over each photo? (axe can't measure text over an image.)

## 3. Code review

- **Approach:** one set of markup per component; each component's `@media (width < 48rem)` block replaces the M8 phone styles. Where phone and desktop need different controls (skills tabs vs accordion, filter bars vs selects, the phone-only toggle buttons), both exist and CSS shows one set. Folding only happens after hydration (`ready`/`enhanced` flags), so without JS everything is visible and no toggle is rendered.
- `src/lib/projects.ts`: `mainDomain()` (= `domains[0]`), `DOMAIN_COLOR`, `DOMAIN_TILE` (kept in sync with the `--tile-*` tokens in `src/app.css` by `theme-tokens.spec.ts`), `PHONE_OTHERS`, `hiddenCount()`. `src/lib/color.ts`: `mixHex()` (the contrast tests use it to rebuild the CSS `color-mix` colours).
- `src/lib/overlay.ts`: the featured-card overlay values; the test checks text contrast on every veiled domain colour and that the component CSS uses the same values.
- `src/lib/skills.ts`: `panelHidden()`: tabs on desktop and accordion on phones keep separate state.
- Data: `summary` on every project; `PROFILE.pitch` split into `pitch` + `pitchMore`; glance rows gain `short` / `wide`.
- Removed: the M7 phone menu (`nav-menu.ts` and its tests, the burger, `menu` key) and the M8 quote clamp (`quoteView`, `ONE_COLUMN_QUERY`, the overflow measuring, `experience.readMore/showLess`; the read-more strings now live in `common`).
- `scripts/audit.ts`: the menu step is gone; at 360px the audit now opens About, the other projects, a skill group and a recommendation, then runs axe again.

## Final review

An independent reviewer (most capable model) read the whole branch and drove the built site. It found 0 Critical, 0 Important and 5 Minor issues. It confirmed:

- every focus item: no-JS content, crossing 768px with state, French at 360px, filters folding the tiles back, find-in-page in skills;
- axe 0 violations with every collapsible opened;
- **desktop pixel-identical to M9** at 1280 and 1440px in both themes and languages (at 768px only Experience is taller, because the quote clamp is gone as the spec asks).

Fixed, with a browser check that failed first and passes now:

- **The Malt card link wasn't named by what it shows on phones** (its name was "Voir mon profil Malt", its visible text "Vous passez par Malt ?"), so a voice-control user saying the visible words couldn't open it. It's now named by the title, then the action: "Vous passez par Malt ? Voir mon profil Malt (s'ouvre dans un nouvel onglet)".

Left for later (minors):

- A shared link that jumps to a text fragment (`#:~:text=Linux`) for a skill outside the open group lands on an empty spot when the page first loads: hydration hides that group after the browser scrolled to it. Same as M9's desktop tabs; Ctrl+F after load works.
- On phones, Ctrl+F doesn't find folded text in About, the folded project tiles or closed recommendations (only skills use the searchable "until-found" hiding, as the spec asks).
- Project tile titles are ~21px tall tap targets on phones (the "Code ↗" link next to them is 44px; WCAG passes through spacing).
- Folding content back on iOS Safari may make the page jump (added to the manual checks above).
