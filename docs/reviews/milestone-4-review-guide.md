# How to review the Milestone 4 PR (Skills)

Branch `milestone-4-skills` → `master`. See the PR link on GitHub for the number.

The review has three parts, in this order:

1. **Automated checks** (2 min)
2. **Manual browser testing** (10 min). No browser was available while this was built, so this part is yours.
3. **Content and code review** (10 min). Mostly checking that the skill list is what you want to claim.

Source of truth: the "Skills" section of `docs/superpowers/specs/2026-09-23-portfolio-design.md`,
together with `docs/superpowers/plans/2026-09-30-milestone-4-skills.md`.

---

## 0. Get the code

```bash
cd /home/lezard/portfolio/.claude/worktrees/milestone-4-skills
npm install
```

(Alternative from any clone: `gh pr checkout <PR number>`.)

| Commit | Plan task |
|---|---|
| `docs: note the Malt screenshots in tmp/ and ignore them` | housekeeping (CLAUDE.md, `.gitignore`) |
| `docs: settle the Skills section design in the spec` | spec |
| `docs: add Milestone 4 (Skills) implementation plan` | plan |
| `feat: add skill types and skillName helper` | Task 1 |
| `feat: add skill groups content with brand and hand-drawn icons` | Task 2 (adds the `simple-icons` dev dependency) |
| `feat: render skills section with grouped logo chips` | Task 3 |
| `docs: add Milestone 4 review guide` | this file |

## 1. Automated checks

```bash
npm run check && npm test && npm run lint && npm run build
```
Expected: 0 errors/warnings, 73 tests pass, lint clean, build writes `build/`.

Optional check that only the used logos ship. `simple-icons` has ~3,400 of them:
```bash
grep -rl '1Password' build/ | wc -l   # 0
du -sh build/_app                     # ~250K
```

## 2. Manual browser testing

```bash
npm run preview    # http://localhost:4173
```

Skills (`/en/#skills`, then `/fr/#skills`):
- [ ] Six groups in this order: **Backend, Systems & Low-level, DevOps & Tools, AI & ML, Blockchain, Frontend**.
- [ ] On `/fr/`: *Systèmes & bas niveau*, *DevOps & outils*, *IA & ML*. The three translated chips read *Vision par ordinateur*, *Agents LLM* and *Ingénierie de prompts*. Everything else stays in English: brand names, and Backend, Blockchain and Frontend, which are the same in French.
- [ ] Each group has a thin accent line on top, an accent line icon and a title. There's no background and no side borders, so it looks clearly different from the project cards.
- [ ] Every chip has a small grey logo and the name.
- [ ] The four hand-drawn logos look right at chip size: **SQL** (database cylinder), **x86-64 Assembly** (CPU chip), **Prompt engineering** (chat bubble with 3 dots) and **Hardhat** (hard hat with an Ethereum diamond).
- [ ] Nothing in the section reacts to hover or click.

Both themes (toggle in the nav):
- [ ] Every logo is visible in dark **and** light mode. None disappears into the background, including Rust, GitHub Actions and Ollama.
- [ ] The accent lines and group icons follow the theme's accent colour.

Widths (DevTools device mode):
- [ ] 3 columns on a wide screen, 2 columns below ~1024px, 1 column below 640px.
- [ ] At 360px on `/fr/`, nothing scrolls sideways and long chips such as *Ingénierie de prompts* wrap onto the next line.

## 3. Content and code review

Content, which is yours to edit freely in `src/lib/data/skills.ts`:
- [ ] Every chip is something you're happy to be asked about in an interview. Remove or reorder anything; the order in the file is the display order.
- [ ] Left out on purpose: C#, a Game dev group, NumPy, Jupyter. Add any of them back by adding a line.
- [ ] To add a skill with a brand logo, import `si<Name>` from `simple-icons`, the slug from simpleicons.org in PascalCase (e.g. `siFlask`). Without a logo, add a path to `src/lib/data/skill-icons.ts`.

Code:
- `src/lib/skills.ts`: types and the pure `skillName(skill, lang)`, which returns a plain name as-is or the `{ en, fr }` one for the language.
- `src/lib/data/skills.ts`: content only. `src/lib/data/skills.spec.ts` guards the group order, that no group is empty, that no skill is duplicated, that the text is non-empty in both languages, and that SVG paths are well formed.
- `src/lib/data/skill-icons.ts`: the four hand-drawn icons. Holes (the diamond, the dots, the chip centre) are subpaths wound the opposite way. Keep that in mind if you ever edit a path.
- `src/lib/components/skills/SkillGroupIcon.svelte`: reuses the project `DomainIcon` for Systems, AI, Blockchain and Frontend, and draws Backend (a server stack) and DevOps (a cycle).
- `src/lib/components/sections/Skills.svelte`: props narrowed to `{ lang, title }`, as the backlog asked.
