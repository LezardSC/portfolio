# How to review the Milestone 5 PR (Experience & Education)

Branch `milestone-5-experience` → `master`. See the PR link on GitHub for the number.

The review has three parts, in this order:

1. **Automated checks** (2 min)
2. **Manual browser testing** (10 min). I already screenshotted the section with headless Chromium (EN/FR, dark/light, 1280px and 375px; the final reviewer also did 320px and 360px). Nothing scrolled sideways. Look at it in a real browser anyway, above all to check the medal emoji, which headless Chromium can't draw.
3. **Content and code review** (10 min). Mostly checking that the wording is what you want to claim.

Source of truth: the "Experience & Education" section of `docs/superpowers/specs/2026-09-23-portfolio-design.md`,
together with `docs/superpowers/plans/2026-09-30-milestone-5-experience.md`.

---

## 0. Get the code

```bash
cd /home/lezard/portfolio/.claude/worktrees/milestone-5-experience
npm install
```

(Alternative from any clone: `gh pr checkout <PR number>`.)

| Commit | Plan task |
|---|---|
| `docs: spec the Experience & Education section (Milestone 5)` + 2 follow-ups | spec (CS50 link, hackathons newest first, hackathon dates) |
| `docs: add Milestone 5 plan; align spec quote type and paper wording with the CV` | plan |
| `feat: add experience types and period/sort helpers` | Task 1 |
| `feat: add experience, education and hackathon content` | Task 2 |
| `feat: render experience and education timelines with hackathon results` | Task 3 |
| `fix: use French guillemets for quotes on the French page` | final review |
| `docs: add Milestone 5 review guide` | this file |
| `feat: move hackathons under education in the right column` | review feedback |

## 1. Automated checks

```bash
npm run check && npm test && npm run lint && npm run build
```
Expected: 0 errors/warnings, 103 tests pass, lint clean, build writes `build/`.

Optional: the month formatting holds in a timezone west of UTC:
```bash
TZ=America/Los_Angeles npx vitest run src/lib/experience.spec.ts
```

## 2. Manual browser testing

```bash
npm run preview    # http://localhost:4173
```

Experience & Education (`/en/#experience`, then `/fr/#experience`):
- [ ] Two columns. **Experience** has Sogeti (part of Capgemini) first, then Y247 Group. **Education** has 42 Lyon, then CS50, and **Hackathons** sits below it in the same column.
- [ ] Period lines: *Jul 2025 – Jan 2026 · Internship* and *Oct 2024 – Apr 2025 · Internship*. On `/fr/`: *juil. 2025 – janv. 2026 · Stage*.
- [ ] No location anywhere.
- [ ] Each job has its bullet points, tech tags in the project style, and a quote with a blue bar on the left.
- [ ] On `/fr/`, the quotes are the French originals in « guillemets », with no note.
- [ ] On `/en/`, the quotes are the English translations, each followed by *(translated from French)*.
- [ ] The **CS50** title is a link that opens the certificate PDF in a new tab. Nothing else in the section is clickable.
- [ ] **Hackathons**, newest first: 🥉 Commissariat au Numérique de Défense 2025 · Firewall log triage for the armed forces, 🥉 Paris Blockchain Week 2025 · Bahapad, 🥈 H-W3B Super Finale 2024 · KAYP, 🥇 Paris Blockchain Week 2024 · KAYP, 🥇 H-W3B Paris 2024 · KAYP.
- [ ] The medal emoji show up in your browser.

Both themes (toggle in the nav):
- [ ] The timeline line, the blue dots, the quote bars and the hackathon pill borders are visible in dark **and** light mode.

Widths (DevTools device mode):
- [ ] Two columns from 900px wide, one below (Experience, Education, Hackathons).
- [ ] At 360px on `/fr/`, nothing scrolls sideways. The long CND pill wraps inside a rounded rectangle, and the dots stay on the line.

Unchanged but touched:
- [ ] Hero buttons look the same as before. The hidden "(opens in a new tab)" text is still hidden, because the `.sr-only` rule moved to `src/app.css`.

## 3. Content and code review

Content, which is yours to edit freely in `src/lib/data/experience.ts`:
- [ ] The English translations of the two recommendations read well to you.
- [ ] The Sogeti and Y247 bullet points are accurate. Add or remove points freely.
- [ ] Sogeti's role reads *Machine Learning & Computer Vision developer* / *Développeur Machine Learning & IA Vision*.
- [ ] The CND 2025 project is described, not named: *Firewall log triage for the armed forces* / *Tri de logs pare-feu pour les armées*. Replace it with a name by setting `project: 'Name'`.
- [ ] A new job with no `end` shows *Present* / *Aujourd’hui* and sorts first. The order in the file doesn't matter.

Code:
- `src/lib/experience.ts`: types and pure helpers. `formatPeriod` formats months with `Intl` in UTC, so a visitor's timezone can't shift a month. `newestFirst` sorts jobs and education, `hackathonsNewestFirst` sorts hackathons, and `quoted` picks “…” or « … » by language.
- `src/lib/data/experience.ts`: content only. `src/lib/data/experience.spec.ts` checks date formats, that nothing ends before it starts, that no text is empty in either language, that every job has at least one point, the medal values and the https link.
- `src/lib/components/experience/JobItem.svelte` and `EducationItem.svelte`: one timeline entry each. `src/lib/components/sections/Experience.svelte`: the grid, the timeline line and dots, and the hackathon pills under Education. Props are narrowed to `{ lang, title, t: Dict['experience'] }`.
- Accessibility: medal emoji are hidden from screen readers and replaced by a hidden "1st place" / "1re place". Headings go h2 → h3 (columns) → h4 (entries).

Left for later (final-review minors):
- The screen-reader "new tab" text is worded differently in French in the Hero (*ouvre un nouvel onglet*) and here (*s’ouvre dans un nouvel onglet*).
- The timezone test only proves the fix when run with `TZ` set, as above.
- M7: `role="list"` on unstyled lists for Safari/VoiceOver, non-breaking spaces before French colons site-wide, `<time datetime>` on periods.
