# How to review PR #2 - Milestone 2 (Projects)

PR: https://github.com/LezardSC/portfolio/pull/2 · branch `milestone-2-projects` → `master`

The review has three parts, in this order:

1. **Automated checks** (5 min)
2. **Manual browser testing** (15–20 min). This matters more than for M1, because no browser was available while building it.
3. **Content and code review** (30–45 min)

The source of truth is the "Projects (core feature)" section of
`docs/superpowers/specs/2026-09-23-portfolio-design.md`, as revised on 2026-09-30, together with
`docs/superpowers/plans/2026-09-30-milestone-2-projects.md`.

---

## 0. Get the code

```bash
cd /home/lezard/portfolio/.claude/worktrees/milestone-2-projects
git pull
npm install        # @types/node was added
```

(Alternative from any clone: `gh pr checkout 2`.)

Commits (`git log --oneline master..HEAD`):

| Commit | Plan task |
|---|---|
| `feat: add project types with filter, sort, count and tier logic` | Task 1 |
| `feat: add project content with data-integrity tests` | Task 2 |
| `feat: add EN/FR strings for project filters and cards` | Task 3 |
| `feat: add project card building blocks (icon, links, tags, media)` | Task 4 |
| `feat: render projects with filters, sort and two card tiers` | Task 5 |
| `style: format CLAUDE.md with Prettier` | Task 6. Blank lines only, so `npm run lint` passes. |
| `docs: align Projects spec with implemented animation and small card` | final review |
| `docs: add Milestone 2 review guide` | this file |

The spec revision and the plan were committed on `master` before the branch started, so they
are part of this PR's base.

---

## 1. Automated checks

```bash
npm run lint     # "All matched files use Prettier code style!"
npm run check    # 0 errors and 0 warnings
npm test         # 46 passed (18 from M1 + 28 new)
npm run build    # prerenders /en/ and /fr/ without errors
```

---

## 2. Manual browser testing

```bash
npm run build && npm run preview     # http://localhost:4173/en/
```

Scroll to **Projects**.

### 2.1 Default layout
- [ ] 6 **large** cards, 2 per row, in this order: KAYP, KAYP - H-W3B Paris, ft_transcendence, microcode, Bahapad, GoldenEye.
- [ ] Then a **"More projects"** divider, and 9 **small** cards, 3 per row.
- [ ] Large cards: a coloured placeholder with the title (no images yet), then year · context, title, 🏆 award (for the 3 winners), description, tech tags, and a GitHub icon.
- [ ] Small cards: domain icon on the top left, GitHub icon on the top right, the title (a link), year · context, the description clamped to **3 lines** with no overflow, and tech tags.

### 2.2 Filters
- [ ] Click Context **Professional**. GoldenEye alone is shown, as a large card with a **"Private"** tag. Nothing on it is clickable, including the placeholder.
- [ ] Click **School**, then Domain **AI**. You get 1 large card (ft_linear_regression) and no divider.
- [ ] The chip counts follow the *other* group. With Domain = Games, Context shows All 3 · Professional 0 · Personal 0 · School 1 · Hackathon 2.
- [ ] Chips with a count of 0 are greyed out and can't be clicked, unless they're the active one.
- [ ] The empty state can't be reached from the UI, because empty chips are disabled. To see it once, temporarily change `filters` in `src/lib/components/sections/Projects.svelte` to `{ context: 'professional', domain: 'games' }`, then run `npm run dev`. You should see "No project matches these filters." Clicking **Reset filters** should bring all 15 back. Then revert the change.

### 2.3 Sort and animation
- [ ] Sort **Newest**: microcode comes first, then GoldenEye and ft_linear_regression (2025-07), and the cards slide into place.
- [ ] When the filters change, new cards fade in and cards that stay slide into place. Outgoing cards disappear without a fade-out, on purpose (see §3.4).
- [ ] Turn on reduced motion (DevTools → Rendering → *Emulate prefers-reduced-motion: reduce*). Filtering changes the grid instantly.

### 2.4 Links and keyboard
- [ ] Clicking a large card's placeholder opens its GitHub repo in a **new tab**.
- [ ] Tab through the page. On large cards, focus goes to the GitHub icon and **skips the media**. Screen readers announce "Source code on GitHub: KAYP".
- [ ] Chips show as pressed (`aria-pressed`), and the sort is a normal select.

### 2.5 French and theme
- [ ] On `/fr/`, the labels read Contexte / Domaine / Tous / Professionnel… / Trier par / À la une / Autres projets / Privé, and the descriptions and awards are in French.
- [ ] Both themes are readable: chips, the award badge and the "Private" tag.

### 2.6 Mobile
- [ ] Below 768px, both tiers are 1 column. Below 1024px, small cards are 2 columns.

---

## 3. Content and code review

### 3.1 Content: please read and correct
`src/lib/data/projects.ts` holds the 15 projects. I drafted the descriptions from your READMEs, so read each one in **both languages**. Some specific things to check:
- Is the event name **"H-W3B Paris"** spelled correctly? The repo name says `WEB3PARIS`.
- **Love Takedown** has almost no description, because its README is empty. Please write one.
- **GoldenEye** is described from the repo's one-line description. Check that it says nothing you can't share publicly.
- Check the dates (`YYYY-MM`). Where I didn't know the month, I used the repo's creation date, but ft_transcendence uses its end date.
- Check the `featured` ranks 1–6, which decide the large cards. To change them, edit the numbers. Ranks must stay unique.

To add media later, put a file in `static/projects/` and add `media: { kind: 'image', src: 'projects/kayp.webp' }` (or `kind: 'video'` with an optional `poster`). A test fails if the file doesn't exist.

### 3.2 Suggested reading order
1. `src/lib/projects.ts` + `projects.spec.ts`: all the logic. It's short and pure.
2. `src/lib/data/projects.ts` + `projects.spec.ts`: the content and its guard rails.
3. `src/lib/i18n/en.ts` / `fr.ts`: the new `projects` block.
4. `src/lib/components/sections/Projects.svelte`: state → `$derived` tiers → grids.
5. `src/lib/components/projects/*`: `ProjectFilters`, then the two cards, then `ProjectMedia`, `ProjectLinks`, `TechTags` and `DomainIcon`.

### 3.3 Questions for each file
- Could you change it without reading anything else?
- Is there logic in a component that belongs in `projects.ts`?
- Is any text hardcoded outside `en.ts` / `fr.ts`? Project data is the exception.

### 3.4 Decisions already made (review them, but they're deliberate)
- **Tiers are decided by position after filtering**, not by a fixed flag. Any filter always shows its best 6 projects as large cards.
- **Empty chips are disabled**, so the empty state is only a safety net.
- **Fade-in only, no fade-out.** An out-transition would keep the old card in its grid cell and push the others around. The spec was updated to say so.
- **Small cards also show year · context and the award.** This goes beyond the original spec, which was updated so that winners in the small tier keep their badge.
- **Cards show the year only**, while sorting uses the month.
- **The hidden media link has an `aria-label`**, even though `aria-hidden` means it's never announced. It keeps svelte-check's a11y rule quiet. It's harmless.
- **The small card's title link and GitHub icon point to the same URL**, which makes two tab stops. This follows the spec (title = primary link).
- **`@types/node`** was added, so type checking understands `node:fs` in the data test.
- **The `Projects` section gets only `lang`, `title` and `t.projects`**, not the whole dictionary. This was a deferred M1 item, done here.

### 3.5 Known minor items (deferred, not blocking)
- The filter label ids are hardcoded. That's fine with a single instance on the page.
- `DomainIcon`'s last `{:else}` branch draws the games icon. The `Domain` type is exhaustive today.
- When the "More projects" block first appears (0 → some small cards), its cards don't fade in (Svelte 5 local transitions). This is cosmetic.

---

## 4. Giving your verdict

On GitHub, in the PR's **Files changed** tab:

- Click a line number (or drag over several lines) to leave a **comment** on specific code.
- When you're done, click **Review changes** and pick one:
  - **Comment**: questions only, no decision yet.
  - **Request changes**: something must change before merging.
  - **Approve**: good to merge.

Or tell me in the next session: "PR #2: <what you found>". I'll read your GitHub comments
(`gh` is set up), fix things on the same branch, and the PR updates automatically. Once it's
approved and merged, we move to Milestone 3 (Hero + About).
