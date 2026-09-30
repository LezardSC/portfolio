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
    data/experience.ts            # JOBS, EDUCATION, HACKATHONS
    experience.ts                 # pure localize(), formatPeriod(), sorting
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
- **Initial content:** at least one project per context. Professional: GoldenEye data augmentation (SogetiLabs/Capgemini, private). Hackathon: KAYP (PBW 2024 winner; links to the backend repo), KAYP-H-WEB3PARIS (winner), Bahapad (PBW 2025 3rd), GameJam Confiture de jeu, Love_Takedown. School: libft, ft_printf, get_next_line, libasm, ft_linear_regression, DSLR (group project; repo is a teammate's), Leaffliction (added in M4), tokenizer, tokenizArt, ft_transcendence. Personal: microcode. Descriptions drafted from READMEs; Jocelyn edits the list freely afterwards.

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
| AI & ML / IA & ML | PyTorch · scikit-learn · Deep Learning (hand-drawn neural network) · Computer Vision (OpenCV) · LLM agents / Agents LLM (Ollama) · Prompt engineering (hand-drawn) |
| Blockchain / Blockchain | Solidity · Hardhat (hand-drawn) · Solana · XRPL (XRP) · IPFS |
| Frontend / Frontend | TypeScript · JavaScript · SvelteKit (Svelte) · React · Tailwind CSS |

Deliberately left out: C# and a Game dev group (not enough to fill it yet), NumPy and pandas (assumed for anyone doing Python data work; they tell a recruiter nothing), Jupyter (an environment, not a skill), a separate "Languages" group (languages sit in the group they belong to). "Computer Vision" and "Prompt engineering" stay in English on the French page, because French tech job ads use the English terms ("Vision par ordinateur" reads as academic). "Deep Learning" is backed by Leaffliction (CNN); the multilayer perceptron is not listed until it's finished.

**Components:** `sections/Skills.svelte` inside `Section`, props `{ lang, title }` (no dict needed). Grid: 3 columns on desktop, 2 on tablet, 1 under 640px. Each group is an `<article>` deliberately unlike the project cards: transparent background, no side/bottom borders, a 3px `--accent` top border; header = line icon from `components/skills/SkillGroupIcon.svelte` (DomainIcon style, one shape per group id, `aria-hidden`) + `h3` title. Chips are a `<ul>` of pills: 1px `--border`, 22px logo in its brand colour (`aria-hidden`), name in `--text` at 1rem, weight 500. No hover effect (nothing is clickable).

**Tests:** `skills.spec.ts` (`skillName` with string and localized names; `contrastRatio`; `logoColor` keeps visible brand colours and falls back for invisible ones; `THEME_BG` matches `app.css`); `data/skills.spec.ts` (unique group ids, unique skill names across all groups, every group non-empty, every localized field non-empty in both languages, every icon path non-empty and starting with `M`/`m`, every icon has a 6-digit hex colour).

## Experience & Education
_Settled during Milestone 5 brainstorming (2026-09-30). Sources: Jocelyn's CV and Malt profile._

**Layout:** two columns: Experience (a vertical timeline) | Education (a vertical timeline) with Hackathons below it in the same column, since Education is always the shorter one _(revised after the PR review; it was a full-width row under both columns)_. The only link is the CS50 certificate; there are no company logos.

**Data:** types and pure helpers in `src/lib/experience.ts`, content in `src/lib/data/experience.ts` (same split as projects and skills):
```ts
type Month = string;   // 'YYYY-MM'
type Quote = { text: Localized; author: string; role: Localized; original: Lang };  // language it was written in
type Job = {
  company: string; role: Localized;
  start: Month; end?: Month;          // no end = "Present"
  internship: boolean;                // adds "· Internship" to the period line
  points: Localized[]; tech: string[];
  quote?: Quote;
};
type Education = { school: string; title: Localized; start?: string; end: string; points: Localized[]; link?: string };  // years 'YYYY'; link = certificate
type Hackathon = { medal: 1 | 2 | 3; event: string; fullName?: string; date: Month; project?: string | Localized };  // fullName = tooltip (<abbr>) when event is an acronym
export const JOBS: Job[]; export const EDUCATION: Education[]; export const HACKATHONS: Hackathon[];
```
- `localize(value: string | Localized, lang)` resolves a plain or localized string.
- `formatPeriod(start, end, lang)` formats the period with `Intl.DateTimeFormat` (month + year for `YYYY-MM`, year alone for `YYYY`): "Jul 2025 – Jan 2026" / "juil. 2025 – janv. 2026"; a missing `end` gives "Present" / "Aujourd'hui" (label passed in from the dict); a single year gives just "2024".
- Sorting: jobs and education newest first (by end, then start; an open end counts as newest); hackathons newest first.

**Content** (EN shown; FR written alongside, drawn from the CV and Malt):
- **Sogeti, part of Capgemini**, Machine Learning & Computer Vision developer, 2025-07 → 2026-01, internship.
  - Built an automated experimentation workflow that improved a computer-vision model detecting and classifying underwater and satellite images, from training to evaluation.
  - Wrote a scientific paper.
  - Tech: PyTorch, Python, Computer Vision, Bash.
  - Quote, Herve Nikue, "R&D Project Manager, Sogeti (internship tutor)" / "Chef de projet R&D, Sogeti (tuteur de stage)": FR original *"Très bon collaborateur, sérieux et impliqué. Il maîtrise bien les sujets de Machine Learning et sait proposer des solutions pertinentes tout en restant pragmatique."* EN *"A very good collaborator, serious and committed. He has a solid grasp of Machine Learning and proposes relevant solutions while staying pragmatic."*
- **Y247 Group**, Full Stack developer, 2024-10 → 2025-04, internship.
  - Designed and built a web application for a private-sector client, from scratch.
  - Set up the dev environment, designed the database, and built the backend, API routes and authentication.
  - Built the frontend, integrating mock-ups from a designer.
  - Tech: SvelteKit, Node.js, Express.
  - Quote, Vincent Tamme, "President, Y247 Group" / "Président, Y247 Group": FR original *"Il a pleinement participé au développement de notre plateforme, aussi bien sur les sujets front-end que back-end. Il s'est montré sérieux, autonome et impliqué, avec une bonne capacité à comprendre rapidement les problématiques techniques et à proposer des solutions adaptées."* EN *"He took a full part in developing our platform, on both front-end and back-end. He proved serious, autonomous and committed, quick to grasp technical problems and propose suitable solutions."*
- **42 Lyon**, 2022 → 2026, title "Expert in computer architecture" / "Expert en architecture informatique". Points: "RNCP 7: information systems & networks" / "RNCP 7 : systèmes d'information et réseaux"; "RNCP 6: software solutions designer-developer, web & mobile" / "RNCP 6 : concepteur développeur de solutions informatiques, web et mobile".
- **Harvard**, CS50's Introduction to Computer Science, 2024, no points, `link: 'https://certificates.cs50.io/b9c16727-3912-4e88-ac47-07ed9a982bc5.pdf?size=letter'`.
- **Hackathons** (newest first, with dates): 🥉 CND 2025 (2025-11; `<abbr>` with the full name "Commissariat au Numérique de Défense" as tooltip) · "Firewall log triage" / "Tri de logs pare-feu" (the project's name is forgotten, so a description stands in for it; shortened after the PR review so the pill fits on one line); 🥉 Paris Blockchain Week 2025 (2025-04) · Bahapad; 🥈 H-W3B Super Finale 2024 (2024-11) · KAYP; 🥇 Paris Blockchain Week 2024 (2024-04) · KAYP; 🥇 H-W3B Paris 2024 (2024-03) · KAYP.

The recommendations were written in French (`original: 'fr'`): the FR page shows the original, and the EN page shows the translation followed by a muted "(translated from French)". The note appears whenever the page language differs from `original`.

**UI labels** live in the dicts under `experience`: column headings (Experience / Expérience, Education / Formation, Hackathons), "Present" / "Aujourd'hui", "Internship" / "Stage", "(translated from French)" / "(traduit de l'anglais)", "(opens in a new tab)" for the certificate link, and the screen-reader medal labels ("1st place", "2nd place", "3rd place" / "1re place", "2e place", "3e place").

**Component:** `sections/Experience.svelte` inside `Section`, props `{ lang, title, t: Dict['experience'] }`.
- Grid: two columns ≥ 900px, stacked below. Each column has an `h3` heading and an `<ol>` timeline: a 2px `--border` vertical line with an `--accent` dot per entry; each entry is an `<li>` holding an `<article>`.
- Entry: period line (muted, small, e.g. "Jul 2025 – Jan 2026 · Internship") → `h4` role (or diploma title; when `link` is set, the title is a link to the certificate, `target=_blank rel="noopener noreferrer"`) → company or school → bullet list → tech tags (project tech-tag style) → optional `<blockquote>` (3px `--accent` left border, italic) with a `<footer>`: "— author, role" and the translated note when relevant.
- Hackathons: under the Education timeline in the right column, `h3` + a compact `<ol>` timeline in the same style _(revised after the PR review; they were bordered pills)_: the medal emoji (`aria-hidden`, on a `--bg` background) replaces the dot on the line; each entry is the event + year in bold (visually hidden place label first; an acronym is an `<abbr>` with `fullName` as its title), then the project in muted smaller text; tighter spacing than the other timelines.
- `.sr-only` moves from `Hero.svelte` to `src/app.css` (this is its second user).

**Tests:** `experience.spec.ts` (`formatPeriod` in both languages: month range, open end, year range, single year; sort orders; `localize`); `data/experience.spec.ts` (valid `YYYY-MM` / `YYYY` dates, start ≤ end, every localized field non-empty in both languages, every job has at least one point, medals in 1–3, every `link` is `https`).

## Contact & Footer
_Settled during Milestone 6 brainstorming (2026-10-01)._

No form, no backend, no phone number, no location. The site's repo stays private, so nothing links to it and there is no license.

**Data:** `PROFILE` in `src/lib/data/profile.ts` gains `email: 'jocelynrenaultpro@gmail.com'`, `linkedin: 'https://www.linkedin.com/in/jocelyn-renault/'` and `malt: 'https://www.malt.fr/profile/jocelynrenault'` (next to `github` and `cv`). A pure helper in `src/lib/contact.ts` builds the tiles:
```ts
type ContactId = 'email' | 'linkedin' | 'github' | 'malt' | 'cv';
type ContactLink = { id: ContactId; label: string; href: string; external: boolean };
export function contactLinks(lang: Lang, base: string): ContactLink[];
```
Order and content:

| id | label | href |
|---|---|---|
| email | jocelynrenaultpro@gmail.com | `mailto:` + email |
| linkedin | jocelyn-renault | LinkedIn profile |
| github | LezardSC | GitHub profile |
| malt | Malt | Malt profile |
| cv | "CV (PDF)" (label from the dict, passed in or resolved by the component) | `assetHref(base, PROFILE.cv[lang])` |

`external` is true for everything except email.

**Component:** `sections/Contact.svelte` inside `Section`, props `{ lang, title, t: Dict['contact'], newTab }` (not the full `Dict`).
- A short muted intro line under the heading: "Open to opportunities. Email is the fastest way to reach me." / « Ouvert aux opportunités. Le plus rapide pour me joindre, c'est l'e-mail. »
- A centered, wrapping `<ul>` of tiles, **always expanded** (logo + label, no hover-to-reveal). Tile: 1px `--border`, rounded, 28px logo, label in `--text`. Hover / `:focus-visible`: border turns `--accent` and the tile lifts slightly. Under 640px the tiles stack as full-width rows.
- Link tiles (LinkedIn, GitHub, Malt, CV): the whole tile is the link, `target=_blank rel="noopener noreferrer"`, with the shared screen-reader new-tab text.
- Email tile: the envelope icon is the `mailto:` link (`aria-label` "Send me an email" / « M'envoyer un e-mail »); the address is plain selectable text; a copy button (`navigator.clipboard.writeText`) shows "Copied!" / « Copié ! » for 2 s, announced through an `aria-live="polite"` region. If the write fails, the address text is selected so the visitor can press Ctrl+C.
- Logos: GitHub and Malt from `simple-icons` (store only `{ path, hex }`), coloured with `logoColor` from `skills.ts` so a dark brand colour falls back to `--text`. LinkedIn is not in `simple-icons` (removed at LinkedIn's request): new `components/icons/LinkedInIcon.svelte`. Envelope and CV (document) are hand-drawn line icons in `--accent`, `DomainIcon` style. All logos `aria-hidden`.

**Footer:** new `components/Footer.svelte`, after `<main>` in `[lang=lang]/+page.svelte`, props `{ t: Dict['footer'] }`. One slim row with a 1px `--border` top: "© {year} Jocelyn Renault" on the left, "Back to top ↑" / « Retour en haut ↑ » (link to `#hero`) on the right. `year` is the build year (`new Date().getFullYear()`, prerendered, so it updates on each rebuild). Under 640px both parts stack and center.

**i18n:** new `contact` (intro, cv label, email aria-label, copy, copied) and `footer` (backToTop) keys in both dicts. The two "opens in a new tab" keys (`hero.newTab`, `experience.newTab`, whose French wording differed) merge into one top-level `newTab` ("(opens in a new tab)" / « (s’ouvre dans un nouvel onglet) ») used by Hero, Experience and Contact. The unused `placeholder` key is removed.

**Tests:** `contact.spec.ts` (tile order and ids, `mailto:` href, CV href follows `lang` and `base`, `external` flags); `profile.spec` (email is a valid address, LinkedIn and Malt are `https` URLs); i18n completeness covers the new keys. Visual check with Playwright: both themes, both languages, 1280px and 375px.


## Testing
- Vitest: `filterProjects` / counts / sort / tiers / `primaryLink`; project data integrity (unique ids, `YYYY-MM` dates, ≥1 project per context, media files exist); `skillName` and skill data integrity; `formatPeriod` / sorting and experience data integrity; i18n completeness (fr keys == en keys).
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
