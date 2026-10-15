# Milestone 12 - Pre-deploy refactor: review guide

Spec: `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section "Milestone 12 - Pre-deploy refactor". Plan: `docs/superpowers/plans/2026-10-15-milestone-12-pre-deploy-refactor.md`.

**The site looks the same.** Every task was checked with tests, type check, lint, build and a 25-capture screenshot comparison against a baseline taken before any change. The only visible changes are the ones you approved (below).

## What to look at on the site

1. **Desktop, Projects, Goldeneye's small card** (if it is on a small card; filter "Professional" puts it on a big one): the company line now starts with the line briefcase icon instead of the 💼 emoji.
2. **Desktop Hero, "View CV" button:** the document icon now has slightly rounded corners, like the Contact CV tile.
3. Accepted while building: a few anti-aliased edge pixels changed on the medal (Experience → Hackathons), copy (Contact → "Copy address") and CV icons, because their circles and rectangles are now path data. Nothing a person would notice at normal size.

Manual checklist (`npm run build && npm run preview`, http://localhost:4173): theme toggle; language switch lands on the section you were on; project filters and sort (desktop buttons, phone selects); phone collapsibles (About "Read more", "See N other projects", skills accordion, recommendation); copy e-mail.

## Commit by commit

| Commit | What changed |
|---|---|
| `aecb9d3` | **Safety net.** `npm run screens` (baseline) and `npm run screens -- --compare` (diff images in `reports/screens-diff/`). The server start and phone collapsibles moved to `scripts/preview.ts`, shared with the audit; the audit no longer deletes the baseline. New tracked watch list `docs/backlog.md`. |
| `dc5c006` | **Dead code and tooling.** `formatPeriod` removed (its timezone test now runs on `periodPoints`, which renders the dates). Unused 775 KB `so_long_phone.png` removed. Node 24 pinned (`engines`, `.nvmrc`). `npm run check` also type-checks `scripts/`. **`npm run og` was broken since M11** (`$lib` imports in the data): it now loads the data through Vite. Regenerated images are byte-identical to the committed ones. |
| `08c2578` | **Colours and tokens.** `contrastRatio` / `logoColor` → `src/lib/color.ts`; `THEME_BG` → `src/lib/theme.ts`. One `.logo` rule in `app.css` replaces three per-theme rule sets. Tokens `--page-max`, `--gutter` (Nav, Footer, Section, Hero) and `--on-photo-*` / `--photo-*` (the 11 hardcoded colours of phone photo cards). |
| `348c280` | **Icons.** Briefcase, medal, trophy, chevrons, arrow, document, mail and copy join `ICONS`; `BriefcaseIcon` / `MedalIcon` / `TrophyIcon` deleted; Hero's Malt logo uses `ContactIcon`. The two approved changes. |
| `70bbdf0` | **i18n helpers.** One `localize()` (was `localize` + `skillName`) and one `plural()` with the language's plural rules (was `glance.plural` + `durationLabel`). Dictionary: `hero.glanceText` and `projects.showMore` (singular/plural) with the same texts. |
| `3202f79` | **Breakpoints.** `src/lib/breakpoints.ts`; a test fails on any `@media` width that isn't 48, 60 or 24.375rem, so CSS and JS can't drift apart. |
| `58c4779` | **Logic out of components.** The project grid rule (big cards on desktop vs phone, phone-only tiles, folded tiles) is a tested `projectLayout()`. Checked against the previous build in 64 filter/sort/fold states: same projects in the same places. One `hydrated()` helper replaces four copies of the "ready after mount" pattern. |
| `4226c03` | **Docs:** CLAUDE.md (commands, conventions), content guide, README. |

## Tests restored (removed in 9eec576)

Only where a test catches a breakage nobody would see while editing, or that screenshots can't see:

- the two light palettes in `app.css` identical (with and without JS);
- `THEME_BG` = `--bg` (the browser bar colour);
- every domain colour readable at 4.5:1 on phone tiles (both themes) and on phone cards without a photo. You'll edit these colours; the guide now says `npm test` checks them;
- `sectionInView` / `isAtBottom` (nav highlight, language switch), the `panelHidden` desktop and phone cases, one `contrastRatio` / `logoColor` test each.

They read the values straight from `app.css` and the card CSS, so `mixHex` / `OVERLAY` / `DOMAIN_TILE` did not come back. Not restored: `sectionNumber`, `longestWordLength`, unique icons, contact icon shapes, and the content rules (summary length, event name length, one wide glance row).

Tests: 214 → 253. `npm run audit`: unchanged (0 axe violations, no overflow at 360px; Lighthouse desktop 100, mobile performance 93, already known).

## Final review

Fresh reviewer (Opus) on the whole branch: **0 Critical, 0 Important, ready to merge.** Deferred minors (on `docs/backlog.md`):

- the `icons.ts` header comment still describes only category icons at a 1.5 stroke;
- `projectLayout` tests could add the exact-5 boundary case;
- `npm run screens` without `--compare` silently replaces an existing baseline;
- the small card's company spacing now comes from `gap` (part of approved change 1).

## Worth knowing

- **`static/cv-en.pdf` is byte-identical to `cv-fr.pdf`:** English visitors download the French CV. At the top of the watch list.
- The pre-M12 screenshot baseline is kept locally in `reports/screens-baseline-pre-m12/` (git-ignored).
