# Portfolio — Design Spec

## Context
Jocelyn (GitHub: LezardSC) wants a portfolio to show recruiters their work, built in **Svelte 5**. Inspiration (idea, not copy): angeluriot.com/portfolio — especially that a recruiter can **filter/sort projects** to quickly find what interests them. Positioning is **general software engineer** (C/ASM, Python/AI, web, blockchain, games). The project directory `/home/lezard/portfolio` is empty (not a git repo). Build happens **incrementally, one milestone at a time**.

**Success criteria:** a recruiter lands on the site in EN or FR, understands who Jocelyn is in seconds, and can narrow projects by context × domain to reach the relevant GitHub repos in a couple of clicks.

## Decisions
| Topic | Decision |
|---|---|
| Framework | SvelteKit (Svelte 5 runes) + `@sveltejs/adapter-static`, fully prerendered, TypeScript |
| Languages | EN + FR toggle; routes `/en`, `/fr` |
| Theme | Dark + light toggle, defaults to system preference |
| Hosting | Undecided → plain static output, host-agnostic |
| Project click | Opens GitHub repo in new tab (no detail pages/modals) |
| Sections | Hero, About, Projects, Skills, Experience/Education, Contact |
| Filtering | Two combinable single-select chip groups: Context × Domain + sort |

## Architecture
```
src/
  app.html                      # inline theme script (no flash)
  params/lang.ts                # matcher: 'en' | 'fr'
  routes/
    +page.svelte                # / → redirect to /fr if navigator.language starts with 'fr', else /en
    +layout.ts                  # export const prerender = true
    [lang=lang]/+page.ts        # entries() → en, fr; load returns dict
    [lang=lang]/+page.svelte    # composes all sections
  lib/
    i18n/en.ts, fr.ts, index.ts # UI strings; fr typed as `typeof en` shape (Dict)
    data/projects.ts            # typed project entries
    data/skills.ts, experience.ts
    projects.ts                 # pure filterProjects() + counts
    components/Nav.svelte, ThemeToggle.svelte, LangSwitch.svelte
    components/projects/ProjectCard.svelte, ProjectFilters.svelte, ProjectGrid.svelte
    components/sections/Hero|About|Projects|Skills|Experience|Contact.svelte
static/  projects/*.webp, cv-en.pdf, cv-fr.pdf, photo
```
- Localized text in data files uses `{ en: string; fr: string }`.
- Theme: CSS custom properties on `:root[data-theme=dark|light]`; choice stored in `localStorage`, fallback `prefers-color-scheme`.
- Single scrolling page, fixed nav with anchor links, language switch links to the other locale's URL (same hash).

## Projects (core feature)
```ts
type Context = 'professionnal' | 'personal' | 'school' | 'hackathon';
type Domain  = 'web' | 'blockchain' | 'ai' | 'low-level' | 'games';
type Project = {
  id: string; title: string;
  description: { en: string; fr: string };
  image: string; repo: string;
  date: string;            // 'YYYY-MM'
  context: Context; domains: Domain[]; tech: string[];
  award?: { en: string; fr: string };
  featured?: number;       // lower = shown first in "Featured" sort
};
```
- **Filters:** group *Context* (All, School, Personal, Hackathon, Game jam) and group *Domain* (All, Web, Blockchain, AI, Low-level, Games). One active chip per group; groups combine with AND. Each chip shows a count computed against the other group's current selection.
- **Sort:** Featured (default; featured ascending, then newest) | Newest.
- **Empty state:** "No project matches" + reset button.
- **Logic:** `filterProjects(projects, { context, domain }, sort)` and `countFor(...)` in `src/lib/projects.ts` — pure, unit-tested; components only render.
- **Card:** image, title, award badge, short description, tech tags, date; whole card is a link to repo (`target=_blank rel=noopener`). Grid animates with `animate:flip` + fade.
- **Initial content (~12):** 42 libft, ft_printf, get_next_line, libasm, ft_linear_regression, tokenizer, tokenizArt, ft_transcendence, KAYP (PBW 2024 winner), KAYP-H-WEB3PARIS (winner), Bahapad (PBW 2025 3rd), microcode, GameJam Confiture de jeu, Love_Takedown. Descriptions drafted from READMEs, reviewed by Jocelyn.

## Other sections
- **Hero:** name, one-line pitch, CTAs: See projects / Download CV / GitHub.
- **About:** photo, short bio (keeps the "got into programming for the money" line), 42 School.
- **Skills:** grouped lists (Languages, Web, Blockchain, Tools) with icons; no percentage bars.
- **Experience/Education:** vertical timeline (42 School, jobs, hackathon results).
- **Contact:** email, GitHub, LinkedIn, CV link. No form/backend.

## Testing
- Vitest: `filterProjects` / counts / sort; i18n completeness (fr keys == en keys).
- `svelte-check` clean.
- `npm run build` prerenders `/en` and `/fr` without errors; `npm run preview` manual check of theme toggle, language switch, filters.

## Milestones (each gets its own implementation plan, built one at a time)
1. **Foundation** — scaffold (sv create, TS, Vitest), adapter-static, lang routing + redirect, i18n dicts, theme toggle, nav, empty section placeholders.
2. **Projects** — data model, cards, two-group filters, sort, animations, tests.
3. **Hero + About**
4. **Skills**
5. **Experience / Education**
6. **Contact + footer**
7. **Polish** — responsive, scroll-reveal animations, SEO/OG meta per locale, a11y, Lighthouse pass.

## Next steps after approval
1. `git init` in `/home/lezard/portfolio`, save this spec to `docs/superpowers/specs/2026-09-23-portfolio-design.md`, commit.
2. Jocelyn reviews the written spec.
3. Invoke writing-plans for **Milestone 1 only**.
