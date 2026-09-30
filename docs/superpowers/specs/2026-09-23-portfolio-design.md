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
| Project click | Icon links (GitHub / demo) + clickable media, new tab; no detail pages/modals. Private projects have no link |
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
    data/profile.ts             # name, role, pitch, bio, facts, links, CV/photo paths
    data/skills.ts, skill-icons.ts  # skill groups; hand-drawn icon paths
    data/experience.ts
    skills.ts                   # pure skillName()
    paths.ts                    # pure assetHref(base, path)
    projects.ts                 # pure filterProjects() + counts
    components/Nav.svelte, ThemeToggle.svelte, LangSwitch.svelte
    components/skills/SkillGroupIcon.svelte
    components/projects/ProjectFilters, ProjectCardLarge, ProjectCardSmall, ProjectMedia, ProjectLinks, DomainIcon (.svelte)
    components/sections/Hero|About|Projects|Skills|Experience|Contact.svelte
static/  projects/* (images/videos), cv-en.pdf, cv-fr.pdf, photo.jpg
```
- Localized text in data files uses `{ en: string; fr: string }`.
- Theme: CSS custom properties on `:root[data-theme=dark|light]`; choice stored in `localStorage`, fallback `prefers-color-scheme`.
- Single scrolling page, fixed nav with anchor links, language switch links to the other locale's URL (same hash).

## Projects (core feature)
_Revised during Milestone 2 brainstorming (2026-09-30)._
```ts
type Context = 'professional' | 'personal' | 'school' | 'hackathon';
type Domain  = 'web' | 'blockchain' | 'ai' | 'low-level' | 'games';
type Localized = { en: string; fr: string };
type Project = {
  id: string; title: string;
  description: Localized;
  date: string;            // 'YYYY-MM'
  context: Context; domains: Domain[]; tech: string[];
  links: { repo?: string; demo?: string };   // both optional: private projects have none
  media?: { kind: 'image' | 'video'; src: string; poster?: string }; // files in static/projects/
  award?: Localized;
  featured?: number;       // lower = shown first in the "Highlights" sort
};
```
- **Filters:** group *Context* (All, Professional, Personal, School, Hackathon — game jams count as Hackathon) and group *Domain* (All, Web, Blockchain, AI, Low-level, Games). One active chip per group; groups combine with AND. Each chip shows a count computed against the other group's current selection.
- **Sort:** Highlights / Incontournables (key `featured`; default; projects with `featured` first, ascending, then the rest newest first) | Newest.
- **Empty state:** "No project matches" + reset button.
- **Two tiers (by position, after filter + sort):** the first **6** results render as **large cards, 2 per row** (1 on mobile); all remaining results render as **small cards, 3 per row** (1–2 on smaller screens).
  - *Large card:* 16:9 media on top (image, or muted looping video that autoplays only while in view and never under `prefers-reduced-motion`, showing the poster instead); below it date · context, title, award badge, description, tech tags, link icons.
  - *Small card:* domain icon (top-left, inline SVG), link icons (top-right), title, year · context, award line (if any), description clamped to 3 lines, tech tags. No media.
  - *No media yet:* a styled placeholder (domain-coloured gradient + title). Real media can be dropped into `static/projects/` later without code changes.
- **Links:** GitHub and demo icons (`target=_blank rel=noopener noreferrer`) are the accessible links. The large card's media and the small card's title also link to the primary link (repo, else demo) — the media link is `tabindex=-1 aria-hidden` to avoid duplicate focus stops. No link at all → a "Private" tag, nothing clickable.
- **Logic:** pure, unit-tested functions in `src/lib/projects.ts`: `filterProjects`, `sortProjects`, `countFor`, `splitTiers(list, 6)`, `primaryLink`. Components only render; filter/sort state lives in `sections/Projects.svelte`.
- **Animation:** both tiers use `animate:flip` + fade-in (duration 0 under `prefers-reduced-motion`). Outgoing cards leave immediately (no fade-out: it would hold their grid cell and shove the others); a project moving between tiers fades into its new tier.
- **Initial content:** at least one project per context. Professional: GoldenEye data augmentation (SogetiLabs/Capgemini, private). Hackathon: KAYP (PBW 2024 winner; links to the backend repo), KAYP-H-WEB3PARIS (winner), Bahapad (PBW 2025 3rd), GameJam Confiture de jeu, Love_Takedown. School: libft, ft_printf, get_next_line, libasm, ft_linear_regression, tokenizer, tokenizArt, ft_transcendence. Personal: microcode. Descriptions drafted from READMEs; Jocelyn edits the list freely afterwards.

## Hero + About
_Settled during Milestone 3 brainstorming (2026-09-30)._

**Positioning:** general software engineer with a backend & systems lean. Broader than the Malt profile ("Développeur Backend & Systèmes") so web, blockchain, AI and games projects stay on-message. No location is shown anywhere on the site.

**Content** lives in a new `src/lib/data/profile.ts` (content, `{ en, fr }` fields). UI labels (CTA texts, photo alt, availability text) live in the i18n dicts. `hero.name` / `hero.tagline` leave the dicts; `meta.title` becomes "Jocelyn Renault — Software Engineer" / "Jocelyn Renault — Ingénieur logiciel", and the meta description uses the full name.
```ts
export const profile = {
  name: 'Jocelyn Renault',
  role:  Localized,        // 'Software Engineer · Backend & Systems' / 'Ingénieur logiciel · Backend & Systèmes'
  pitch: Localized,        // one sentence, see below
  bio:   Localized[],      // 3 paragraphs, see below
  facts: { icon: string; text: Localized }[],  // 🎓 '42 Lyon (RNCP 7)', 🗣 'French / English' | 'Français / Anglais'; icon is aria-hidden
  github: 'https://github.com/LezardSC',
  cv:    { en: 'cv-en.pdf', fr: 'cv-fr.pdf' },   // paths under static/, resolved with `base`
  photo: 'photo.jpg',
  available: false         // true shows the "Available for work" pill in the Hero
};
```

**Assets** (`static/`): `cv-en.pdf`, `cv-fr.pdf` (phone number removed; `cv-en.pdf` is temporarily a copy of the French CV until the English one is re-exported — replacing the file needs no code change), `photo.jpg` (cropped once to a 480×480 square centred on Jocelyn, EXIF stripped; the original is not kept).

**Hero** (`sections/Hero.svelte`, props `{ lang, t: Dict['hero'] }`): full height (`100svh`), centred.
- Optional pill "● Available for work" / "● Disponible" (green dot) when `profile.available`.
- `h1` name, role line, pitch (muted, max ~60ch).
- CTAs, wrapping on narrow screens: **See projects** (primary, `#projects`), **Download CV** (opens `cv-{lang}.pdf` in a new tab, no forced download), **GitHub** (icon + label, new tab). External links use `target=_blank rel="noopener noreferrer"`.
- Pitch EN: *"I build the invisible part of products: APIs, services, data processing, automation and deployment. My field is backend and low-level — reliability and performance over UI."*
- Pitch FR: *"Je conçois la partie invisible des produits : APIs, services, traitement de données, automatisation et mise en production. Mon terrain, c'est le backend et le bas niveau — la fiabilité et la performance plutôt que l'interface."*

**About** (`sections/About.svelte` inside `Section`, props `{ lang, title, t: Dict['about'] }`, same pattern as Projects): two-column grid, round 200px photo left and bio right; under 640px it stacks with the photo centred on top. Photo has explicit `width`/`height`, `loading="lazy"`, localized alt ("Photo of Jocelyn Renault"). Below the bio, the facts render as chips in the project tech-tag style (🎓 42 Lyon (RNCP 7) · 🗣 French / English).

Bio draft (Jocelyn edits freely):
1. EN *"I got into programming for the money. I stayed because I found out I love understanding how things work underneath: memory, processes, the network, the machine itself."* — FR *"Je me suis mis à la programmation pour l'argent. J'y suis resté parce que j'ai découvert que j'adore comprendre comment les choses fonctionnent en dessous : la mémoire, les processus, le réseau, la machine elle-même."*
2. EN *"I trained at 42 Lyon (RNCP 7 — Expert in computer architecture), then worked as a full-stack developer at Y247 Group and as a machine-learning developer at Sogeti (Capgemini), and won several hackathons along the way."* — FR *"Je me suis formé à 42 Lyon (RNCP 7 — Expert en architecture informatique), puis j'ai travaillé comme développeur full stack chez Y247 Group et comme développeur machine learning chez Sogeti (Capgemini), en remportant plusieurs hackathons au passage."*
3. EN *"Today I focus on backend and systems work — APIs, services, Rust, infrastructure — while staying at home with Web3 and AI when a project needs them."* — FR *"Aujourd'hui je me concentre sur le backend et les systèmes — APIs, services, Rust, infrastructure — tout en restant à l'aise avec le Web3 et l'IA quand un projet en a besoin."*

**Logic:** pure `assetHref(base, path)` in `src/lib/paths.ts` (joins `base` and a `static/` path without double slashes), used for the CV and photo URLs so the site works under a sub-path.

**Tests:** `assetHref` (empty and non-empty `base`, no `//`); `profile.spec.ts` (CV and photo files exist in `static/`, every localized field non-empty in both languages, `github` is `https`).

## Skills
_Settled during Milestone 4 brainstorming (2026-09-30)._

A **static showcase**: grouped skill chips with logos. Nothing is clickable and nothing is linked to the Projects filters; no percentage bars, no levels.

**Data** in `src/lib/data/skills.ts`:
```ts
type SkillIcon = { path: string; hex: string };    // one 24×24 SVG path + brand colour ('3776AB', no #)
type Skill = { name: string | Localized; icon: SkillIcon };
type SkillGroupId = 'backend' | 'systems' | 'devops' | 'ai' | 'blockchain' | 'frontend';
type SkillGroup = { id: SkillGroupId; title: Localized; skills: Skill[] };
export const SKILL_GROUPS: SkillGroup[];
```
- **Brand icons** come from `simple-icons` (CC0, devDependency), imported one by one (`import { siRust } from 'simple-icons'`) so only the used ones end up in the build.
- **Brand colours** _(revised after the first PR review: grey logos were too hard to scan)_. Each logo is drawn in its brand colour, so a recruiter spots Python, Docker or React at a glance. When the brand colour would vanish into a theme's background (WCAG contrast < 2.2 against `--bg`, e.g. Rust black on dark, JavaScript yellow on white), that theme uses `var(--text)` instead. Pure, tested `contrastRatio(a, b)` and `logoColor(hex, bg)` in `src/lib/skills.ts`, with `THEME_BG` mirroring the `--bg` tokens of `src/app.css` (a test keeps them in sync). Both colours are computed at build time and set as `--logo-dark` / `--logo-light` on each chip; CSS picks one with the same theme selectors as `app.css`, so there's no flash.
- **Hand-drawn icons** for skills without a logo, in `src/lib/data/skill-icons.ts`, same `{ path }` shape: Hardhat (hard hat with an Ethereum diamond cut out; drawn from scratch, not copied), x86-64 Assembly (CPU chip), SQL (database cylinder), Prompt engineering (chat bubble).
- Names are plain strings except translatable ones, which are `{ en, fr }`. Pure `skillName(skill, lang)` in `src/lib/skills.ts` resolves either.
- Each skill appears in exactly one group.

**Content**, groups in this order (leads with the backend & systems positioning), chips in the order listed:

| Group (EN / FR) | Skills (icon) |
|---|---|
| Backend / Backend | Python · Node.js · Express · Django · Java (OpenJDK) · SQL (hand-drawn) · PostgreSQL |
| Systems & Low-level / Systèmes & bas niveau | Rust · C · x86-64 Assembly (hand-drawn) · Linux |
| DevOps & Tools / DevOps & outils | Docker · Kubernetes · Nginx · GitHub Actions (CI/CD) · Git |
| AI & ML / IA & ML | PyTorch · scikit-learn · pandas · Computer Vision / Vision par ordinateur (OpenCV) · LLM agents / Agents LLM (Ollama) · Prompt engineering / Ingénierie de prompts (hand-drawn) |
| Blockchain / Blockchain | Solidity · Hardhat (hand-drawn) · Solana · XRPL (XRP) · IPFS |
| Frontend / Frontend | TypeScript · JavaScript · SvelteKit (Svelte) · React · Tailwind CSS |

Deliberately left out: C# and a Game dev group (not enough to fill it yet), NumPy (implied by PyTorch/pandas), Jupyter (an environment, not a skill), a separate "Languages" group (languages sit in the group they belong to).

**Components:** `sections/Skills.svelte` inside `Section`, props `{ lang, title }` (no dict needed). Grid: 3 columns on desktop, 2 on tablet, 1 under 640px. Each group is an `<article>` deliberately unlike the project cards: transparent background, no side/bottom borders, a 3px `--accent` top border; header = line icon from `components/skills/SkillGroupIcon.svelte` (DomainIcon style, one shape per group id, `aria-hidden`) + `h3` title. Chips are a `<ul>` of pills: 1px `--border`, 22px logo in its brand colour (`aria-hidden`), name in `--text` at 1rem, weight 500. No hover effect (nothing is clickable).

**Tests:** `skills.spec.ts` (`skillName` with string and localized names; `contrastRatio`; `logoColor` keeps visible brand colours and falls back for invisible ones; `THEME_BG` matches `app.css`); `data/skills.spec.ts` (unique group ids, unique skill names across all groups, every group non-empty, every localized field non-empty in both languages, every icon path non-empty and starting with `M`/`m`, every icon has a 6-digit hex colour).

## Other sections
- **Experience/Education:** vertical timeline (42 School, jobs, hackathon results).
- **Contact:** email, GitHub, LinkedIn, CV link. No form/backend.

## Testing
- Vitest: `filterProjects` / counts / sort / tiers / `primaryLink`; project data integrity (unique ids, `YYYY-MM` dates, ≥1 project per context, media files exist); `skillName` and skill data integrity; i18n completeness (fr keys == en keys).
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
