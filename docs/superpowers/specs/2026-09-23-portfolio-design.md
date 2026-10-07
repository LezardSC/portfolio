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
| Hosting | Plain static output, host-agnostic. Plan (2026-10-01): OVH domain, self-hosted on the home server first, a real server later — its own milestone (M11) once the site is polished |
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
_Revised during Milestone 2 brainstorming (2026-09-30)._ Phone layout, media type and hover revised in Milestone 8 (see that section).
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
export function contactLinks(lang: Lang, base: string, cvLabel: string): ContactLink[];
```
Order and content:

| id | label | href |
|---|---|---|
| email | jocelynrenaultpro@gmail.com | `mailto:` + email |
| linkedin | jocelyn-renault | LinkedIn profile |
| github | LezardSC | GitHub profile |
| malt | Malt | Malt profile |
| cv | `cvLabel` ("CV (PDF)", from the dict) | `assetHref(base, PROFILE.cv[lang])` |

`external` is true for everything except email.

**Component:** `sections/Contact.svelte` inside `Section`, props `{ lang, title, t: Dict['contact'], newTab }` (not the full `Dict`).
- A short muted intro line under the heading: "Open to opportunities. Email is the fastest way to reach me." / « Ouvert aux opportunités. Le plus rapide pour me joindre, c'est l'e-mail. »
- A centered, wrapping `<ul>` of tiles, **always expanded** (logo + label, no hover-to-reveal). Tile: 1px `--border`, rounded, 28px logo, label in `--text`. Hover / `:focus-visible`: border turns `--accent` and the tile lifts slightly. Under 640px the tiles stack as full-width rows.
- Link tiles (LinkedIn, GitHub, Malt, CV): the whole tile is the link, `target=_blank rel="noopener noreferrer"`, with the shared screen-reader new-tab text.
- Email tile: the envelope icon is the `mailto:` link (`aria-label` "Send me an email" / « M'envoyer un e-mail »); the address is plain selectable text; a copy button (`navigator.clipboard.writeText`) shows "Copied!" / « Copié ! » for 2 s, announced through an `aria-live="polite"` region. If the write fails, the address text is selected so the visitor can press Ctrl+C.
- Logos: GitHub and Malt from `simple-icons` (store only `{ path, hex }`), coloured with `logoColor` from `skills.ts` so a dark brand colour falls back to `--text`. LinkedIn is not in `simple-icons` (removed at LinkedIn's request), so its path is inlined next to the others in `src/lib/data/contact-icons.ts` (`CONTACT_BRANDS`); `components/contact/ContactIcon.svelte` draws all five logos. Envelope and CV (document) are hand-drawn line icons in `--accent`, `DomainIcon` style. All logos `aria-hidden`.

**Footer:** new `components/Footer.svelte`, after `<main>` in `[lang=lang]/+page.svelte`, props `{ t: Dict['footer'] }`. One slim row with a 1px `--border` top: "© {year} Jocelyn Renault" on the left, "Back to top ↑" / « Retour en haut ↑ » (link to `#hero`) on the right. `year` is the build year (`new Date().getFullYear()`, prerendered, so it updates on each rebuild). Under 640px both parts stack and center.

**i18n:** new `contact` (intro, cv label, email aria-label, copy, copied) and `footer` (backToTop) keys in both dicts. The two "opens in a new tab" keys (`hero.newTab`, `experience.newTab`, whose French wording differed) merge into one top-level `newTab` ("(opens in a new tab)" / « (s’ouvre dans un nouvel onglet) ») used by Hero, Experience and Contact. The unused `placeholder` key is removed.

**Tests:** `contact.spec.ts` (tile order and ids, `mailto:` href, CV href follows `lang` and `base`, `external` flags); `profile.spec` (email is a valid address, LinkedIn and Malt are `https` URLs); i18n completeness covers the new keys. Visual check with Playwright: both themes, both languages, 1280px and 375px.


## Milestone 7 — Fixes & accessibility
_Settled during Milestone 7 brainstorming (2026-10-01)._ The original "Polish" milestone is split in two: M7 (this one: nav, a11y, fixes, audit tooling) and M8 (visual polish & SEO). No domain yet, so nothing here depends on one.

**Mobile nav.** Under ~760px the section links collapse behind a ☰ button (`aria-expanded`, `aria-controls`) that opens a panel below the bar with the links stacked. Brand, language switch and theme toggle stay in the bar at every width. The panel closes on Esc (focus returns to the button), on a link tap, on a tap outside, and resets to closed when the viewport grows past the breakpoint. Before hydration / without JS the links stay reachable: the menu button is hidden and the links stay the current horizontally scrollable row until the menu script takes over. Open/close rules live in a pure, unit-tested function; the component only wires events.

**Active-section highlight.** Reuses `sectionInView()` / `isAtBottom()` from `src/lib/sections.ts` (the same rule the language switch uses, so both always agree), recomputed on scroll behind `requestAnimationFrame`. The current link gets `aria-current="true"` and an `--accent` underline; on the hero no link is marked.

**Theme.** A `matchMedia('(prefers-color-scheme: dark)')` listener makes the page follow OS changes live, only while no theme is stored. ThemeToggle's accessible name is correct from first paint: both labels are rendered and the one for the current `data-theme` is shown by CSS (the other is `display: none`, so it is out of the accessibility tree), instead of an `aria-label` that is wrong until hydration on a light OS. The `title` tooltip is only set after hydration (it is not the accessible name, so a brief wrong tooltip is harmless).

**LangSwitch.** The modifier guard also lets `altKey` through to the browser.

**Page-wide a11y.**
- "Skip to content" link, first focusable element, visible on focus, targets `<main>`; text in both dicts.
- `role="list"` on every `list-style: none` list (Safari/VoiceOver drops list semantics otherwise).
- Experience periods wrapped in `<time datetime="YYYY-MM">`.
- One `:focus-visible` outline in `app.css`, visible in both themes.
- Interactive targets ≥ 44px on touch (`pointer: coarse`): nav buttons, filter chips, link icons.
- Anything else axe or Lighthouse reports is fixed in this milestone.

**French typography.** Non-breaking space (U+00A0) before `: ; ! ?` and inside « », written into `fr.ts` and the `fr` fields of the data files (no runtime transform). A unit test fails on a plain space before those characters (or after «, before ») in any French string; U+00A0 and U+202F are both accepted.

**`/` redirect.** Moves to an inline `<head>` script on `/` so it runs before first paint instead of after hydration; `/` gets a `<title>`; the `<noscript>` links stay. The inline copy duplicates `pickLang` on purpose, like the theme script duplicates `resolveTheme`; keep them in sync.

**Deferred review minors folded in.**
- About facts `{#each}` keyed on index, not emoji.
- Hero availability dot uses a new `--ok` theme token instead of `#2da44e`.
- `profile.spec` resolves `static/` from the test file's location, not the cwd; the experience timezone test actually runs under a non-UTC `TZ`.
- ~~Skill icons store only `{ path, hex }`~~ — dropped (checked 2026-10-01): the bundle keeps every referenced `simple-icons` object whole whatever fields are read, so the saving (a few KB of titles/URLs) would need an icon code generator; not worth it.
- Pills and chips use a `--pill: 1.25rem` radius token instead of `999px`: a full pill on one line, a rounded rectangle (not a lozenge) if one ever wraps.
- The Malt symbol's cropped path is inlined in `contact-icons.ts` instead of depending on `simple-icons` subpath order.
- Copy email: a repeat copy is re-announced; on failure a visible "press Ctrl+C" hint appears next to the selected address; the timer is cleared on destroy; the email tile text comes from the `contactLinks` label.

**Responsive pass.** Whole page checked at 360, 390, 768, 1024 and 1440px, both themes, both languages; fix overflow, crowding and bad wraps. No horizontal scroll at 360px (enforced by the audit).

**Audit script.** `npm run audit` → `scripts/audit.ts`. Dev dependencies: `playwright` (Chromium only), `@axe-core/playwright`, `lighthouse`. It builds, starts `vite preview`, then:
- axe on `/en/` and `/fr/` × dark/light × 360px/1280px: **0 violations**;
- no horizontal scroll at 360px;
- Lighthouse (Playwright's Chromium) on `/en/`, mobile and desktop: **Accessibility, Best Practices, SEO = 100; Performance ≥ 95**.
It prints a pass/fail table, exits non-zero on any failure, and writes full reports to a git-ignored `reports/`. SEO checks that need a real domain (absolute canonical/hreflang) are reported as "pending domain" and carried to M11 (deployment) rather than faked.

**Tests.** Unit tests for the menu state function, the active-link logic and the French typography check; existing tests, `npm run check` and `npm run lint` stay clean. The M7 review guide includes the audit table and screenshots at each width.

## Milestone 8 — Layout & media
_Settled during Milestone 8 brainstorming (2026-10-01 → 2026-10-02)._ After M7 the user found the site worked but needed visual work, mostly on phones: the phone page was ~13,600px tall against ~7,450px on desktop (Projects alone 7,263px; a large card ~600px, a small one ~300px). The old "Visual polish & SEO" milestone is split again: **M8 Layout & media** (this one), **M9 Finishing touches & SEO** (hero accent, section-heading accent, scroll-reveal, favicon, OG image, per-locale meta), **M10 Deployment**. A smaller About photo next to the title was considered and declined. _Revised after the M8 PR review (2026-10-02): the user's main concern is the readability of the information, so M9 becomes a desktop design pass, M10 the same for phones, M11 deployment (see "Milestones")._

**Approach.** One set of markup per component at every width; CSS media queries restyle it for phones, and scripts only decide whether a video plays. The site is prerendered without knowing the screen size, so choosing a phone or desktop component in JS would flash the wrong layout, and rendering both would duplicate content for screen readers. "Phone" below means under the existing `48rem` breakpoint (the one where both project grids drop to a single column).

### Projects on phones
- **Large cards → overlay cards.** The media fills the card (a 4:3 media area); a dark gradient (transparent → ~85% black) covers its lower part, and the text sits on it: year · context, title, award pill, description clamped to **2 lines**, tech tags, link icons. Overlay text is white on the gradient in both themes, so its contrast doesn't depend on the theme (axe checks it). Target height ~260px instead of ~600px. A card without media keeps the domain-coloured gradient placeholder as background, without the big placeholder title. The media stays a decorative link (`tabindex=-1 aria-hidden`) and the icon links stay the accessible ones. The clamp is visual only: the full description stays in the DOM.
- **Small cards → compact rows** (~120px instead of ~300px): first line = domain icon, title, then year · context (muted), link icons on the right; then the description clamped to 2 lines. No tech tags on phones. The award shows as 🏆 after the year (`aria-hidden`) with a visually hidden award text for screen readers.
- **Filters:** _revised after the PR review (2026-10-02); the first version, one sideways-scrolling row of chips per group, hid chips off-screen and was rejected._ On phones the two chip groups are replaced by two dropdowns, Context and Domain, styled like the sort select: three full-width rows, label on the left (fixed width) and the dropdown filling the rest. Each option shows its count, e.g. "Hackathon (5)"; an option that would give 0 results is disabled unless it is the current one. Chips and dropdowns share the same filter state; CSS shows the chips at 48rem and up and the dropdowns below (the hidden set is `display: none`, so it is out of the accessibility tree and the tab order). Nothing scrolls sideways.
- **Desktop** (48rem and up) keeps the current layout: media on top (16:9), text below.

### Media
- **Data.** `Project.media` becomes a discriminated union:
  ```ts
  media?: { kind: 'image'; src: string } | { kind: 'video'; src: string; poster: string };
  ```
  Files stay in `static/projects/`, paths relative to `static/`. Real videos are **MP4**, supplied by Jocelyn; there is no conversion script. Every video has a required still `poster` (the review guide gives a one-line `ffmpeg` command to extract a frame). The test GIFs in the gitignored `tmp/` are converted to MP4 by hand for visual checks only and never committed.
- **Rendering.** The card always renders an `<img>`: the image itself, or the video's poster (`loading="lazy"`, `decoding="async"`, `alt=""` since the title names the project). A `<video muted loop playsinline>` is added on top of it only while `shouldPlayVideo` is true, and once added it stays (paused when out of view, so scrolling back doesn't reload it). Phones, `prefers-reduced-motion`, and the prerendered HTML before hydration therefore never download video bytes. If the video fails, the poster stays visible.
- **Logic.** Pure, unit-tested `shouldPlayVideo({ desktop, reducedMotion, inView }): boolean` in `src/lib/projects.ts` (true only when desktop and in view and not reduced motion). `desktop` comes from `matchMedia('(min-width: 48rem)')`, `inView` from an `IntersectionObserver` (threshold 0.25), `reducedMotion` from `prefersReducedMotion`; `ProjectMedia.svelte` only wires them. Videos play **while on screen** (not on hover).

### Desktop hover
Only under `(hover: hover) and (pointer: fine)`, so touch screens never get a stuck hover state; the same styles apply on `:focus-within` for keyboard users.
- Large card: lifts 4px, soft shadow, border turns `--accent`, media zooms to 1.03×. The trigger is the whole card (today only the media zooms, on media hover).
- Small card: lifts 2px, border turns `--accent`.
- Under `prefers-reduced-motion`: no lift and no zoom, only the border colour.

### Other sections on phones
- **Spacing.** `Section` drops `min-height: 60vh` at every width (it only left a gap above the footer after Contact). On phones, section padding goes from `4rem` to `2.5rem` vertically and `h2` from `2rem` to `1.6rem`.
- **Skills.** On phones, chips get `0.3rem 0.65rem` padding, `0.9rem` text and 18px logos, with tighter chip and group gaps (~400px saved). Desktop unchanged.
- **Recommendation quotes.** Below `56.25rem` (where Experience is one column) a quote is clamped to 2 lines with a "Read more" / « Lire la suite » button below it, which reads "Show less" / « Réduire » when expanded (`aria-expanded`, `aria-controls` → the quote). The clamp is only applied after hydration, so visitors without JS read the whole quote. The button only appears when the quote actually overflows 2 lines (measured in the browser, re-measured on resize), so it never expands to nothing. At 56.25rem and up there is no clamp and no button. New keys `experience.readMore` / `experience.showLess` in both dicts. _2 lines rather than 3 since the PR review (2026-10-02): at 3 lines the button cost about as much height as the clamp saved._

### Deferred minors folded in
- The large-card placeholder title renders underlined (link default): remove the underline.
- French strings in `src/lib/data/profile.ts` (pitch, bio) use straight apostrophes (`c'est`, `l'argent`): use ’ like the rest of the French text. Any other straight apostrophe found in French text gets the same fix.

### Tests and verification
- Unit: `shouldPlayVideo` (each input alone turns it off; all three → true); `data/projects.spec.ts` checks images are `.jpg`/`.jpeg`/`.png`/`.webp`, videos are `.mp4` with a poster image, and every `src` and `poster` exists in `static/`; i18n completeness covers the new keys.
- `npm run check`, `npm test`, `npm run lint` clean; `npm run audit` passes (0 axe violations, no horizontal scroll at 360px, Lighthouse as in M7).
- Visual check with the test media injected (images and MP4s): 360, 390, 768, 1024 and 1440px, both themes, both languages, including a large card without media, the hover state and an expanded quote.
- The review guide reports page and section heights before and after. Expected: the phone page drops from ~13,600px to under ~9,000px (an estimate, not a gate).

## Milestone 9 — Desktop design
_Settled during Milestone 9 brainstorming (2026-10-07 → 2026-10-08), after a design exploration on a Claude Design canvas._

**Goal.** Give the site its new visual identity on desktop, in both themes, with the readability of the information first: the audience is recruiters and clients, often not developers. This section **supersedes the desktop presentation** described in the Hero + About, Projects, Skills, Experience & Education and Contact & Footer sections above; data, logic and accessibility rules from those sections still apply unless changed here.

**Source of truth.** The validated artboards on the canvas https://claude.ai/artifact/5rqhnCoS2tUFHpioTu8jZG (private to Jocelyn's claude.ai account): **A1·M3 révisée — clair** (`A1M3b-Clair`), **A1·M3 révisée — sombre** (`A1M3b-Sombre`) and **Compétences 4A** (`Skills-Idee4A`). Copies of their sources are in `docs/superpowers/designs/2026-10-07-m9-final/` (`.dc.html` design components: they only render inside the canvas, so use them as a value reference, not as code). Every value below comes from them; **the implementation must match them**, each section is screenshot-checked against them, and any deliberate deviation is listed in the review guide. Rejected directions (terminal/developer jokes, SaaS-style bento) stay rejected.

**Scope.** Desktop only (48rem and up). Colours, font and shared styles apply at every width, but phones keep the M8 layouts and only get a "nothing breaks" check (no horizontal scroll at 360px, no overlap); the phone design is M10.

### Foundations

**Tokens** in `src/app.css`, existing names kept:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#FAF8F4` | `#121210` | page ground |
| `--surface` | `#FFFFFF` | `#1A1916` | cards |
| `--text` | `#141412` | `#F3F0E8` | headings, 2px strong borders, primary button fill |
| `--on-text` (new) | `#FFFFFF` | `#121210` | text on a `--text` fill |
| `--body` (new) | `#2B2A26` | `#D9D5CB` | running text |
| `--muted` | `#56534C` | `#A9A498` | dates, captions, labels |
| `--border` | `#E0DBD0` | `#2B2924` | card borders |
| `--rule` (new) | `#DCD7CC` | `#2B2924` | separator lines |
| `--tag` (new) | `#ECE8E0` | `#25231F` | tech tags, neutral icon tiles |
| `--accent` | `#C2391B` | `#FF7F5E` | vermilion / coral |
| `--on-accent` (new) | `#FFFFFF` | `#121210` | text on an accent fill |
| `--tint` (new) | `color-mix(in srgb, var(--accent) 11%, var(--bg))` | same at 15% | icon tiles |
| `--ok` / `--ok-dot` / `--ok-ring` | `#1F6B3A` / `#2E8B4E` / `rgba(46,139,78,.16)` | `#86DDA5` / `#4CC377` / `rgba(76,195,119,.2)` | "Available" badge |

The same values go in the no-JS `prefers-color-scheme` block. `THEME_BG` in `src/lib/skills.ts` becomes `{ dark: '#121210', light: '#FAF8F4' }` (its sync test follows). Radii: `--radius: 6px` (cards, buttons), `--radius-sm: 4px` (tags, icon tiles); `--pill` goes. Hover effects stay under `(hover: hover) and (pointer: fine)`, mirrored on `:focus-within`/`:focus-visible`, and drop movement under `prefers-reduced-motion` (as in M8).

**Font.** Schibsted Grotesk (variable, weights 400–900) from `@fontsource-variable/schibsted-grotesk`, latin subset only, self-hosted (no Google request), `font-display: swap`, woff2 preloaded. It replaces the system stack everywhere. Body text 18px, line-height 1.6. The canvas used IBM Plex Mono for the small nav numbers; it is dropped (Schibsted 13px, one font file less) — a deliberate deviation.

**Page and sections.** Container max 1240px, 40px side padding. `Section.svelte` becomes a 12-column grid (column gap 32px, row gap 28px), 112px top and bottom padding, 2px `--text` top rule:
- header, 3 columns: the section number ("01"–"05", from the order in `src/lib/sections.ts`, `aria-hidden`) at 112px, weight 900, letter-spacing −0.05em, line-height 0.82, transparent fill with a 2px `--accent` text stroke; then the `h2` at 46px, weight 800, letter-spacing −0.035em, 14px above; then an optional lead line, 17px `--muted`;
- body, 9 columns.
Under 48rem the header stacks above the body and the M8 phone paddings and heading sizes stay.

**Nav.** Stays at the top while scrolling: 72px tall, background `--bg` at 86% opacity with a 14px backdrop blur, 1px `--rule` bottom border. Brand "Jocelyn Renault" 19px weight 800; links 16px weight 500, 24px apart, each prefixed by its number ("01 ") in `--accent` at 13px. Right side: theme toggle and language switch as 44px square buttons (1px `--rule`, 4px radius), then a new primary **CV** button (44px tall, opens `cv-{lang}.pdf` in a new tab). M7 behaviour (active-section underline, phone menu) is unchanged.

**Buttons.** Shared `.btn` / `.btn-primary` classes in `app.css` (used by Hero, Nav, Contact): min-height 48px, padding 0 22px, 2px `--text` border, 6px radius, 16px weight 600; primary = `--text` fill and `--on-text` text, hover → `--accent` fill and border with `--on-accent` text; secondary = transparent, hover → `--accent` text and border.

### Hero
- Padding 64px top, 96px bottom; no longer `100svh`.
- "Available" badge (when `PROFILE.available`, currently `false`): 15px weight 600 `--ok`, 10px dot `--ok-dot` with a 4px `--ok-ring` halo.
- `h1` "Jocelyn Renault" on one line: 122px, weight 900, line-height 0.9, letter-spacing −0.055em, `white-space: nowrap`, followed by a full stop in `--accent` (`aria-hidden`).
- Then a 2px `--text` rule (48px below the name, 32px above the content) and two columns (`repeat(auto-fit, minmax(min(100%, 460px), 1fr))`, gap 48px × 80px):
  - left: role 28px, weight 800, `--accent`, letter-spacing −0.01em; pitch 19px `--body`, max 52ch; three buttons in one row, 12px apart: **See projects / Voir les projets** (primary, `#projects`), **View CV / Voir le CV** (document icon, opens the PDF in a new tab), **Malt profile / Profil Malt ↗** (Malt symbol in `#FC5757`, new tab). GitHub leaves the hero (it stays in Contact).
  - right: the **At a glance / En bref** card: `--surface`, 2px `--text` border, 6px radius, padding 10px 28px; title 14px weight 600 `--accent`; a `<dl>` of 5 rows, grid `140px 1fr`, gap 16px, 13px vertical padding, 1px `--rule` between rows; `dt` 14px weight 600 `--muted`, `dd` weight 600.
- **Data:** `PROFILE.facts` is replaced by `PROFILE.glance: { label: Localized; value: Localized }[]`:

| EN label | EN value | FR label | FR value |
|---|---|---|---|
| Education | 42 Lyon — RNCP 7, expert in computer architecture | Formation | 42 Lyon — RNCP 7, expert en architecture informatique |
| Latest role | ML & Computer Vision developer — Sogeti (Capgemini) | Dernier poste | Développeur ML & IA Vision — Sogeti (Capgemini) |
| Stack | Python, Rust, C, Node.js, Docker | Stack | Python, Rust, C, Node.js, Docker |
| Hackathons | 2 wins, 5 podiums | Hackathons | 2 victoires, 5 podiums |
| Languages | French, English | Langues | Français, anglais |

### About
Photo left (240px wide, 4:5, 6px radius, `object-fit: cover` centred on the existing square `photo.jpg`, so the sides are cropped without editing the file), bio right (19px, line-height 1.65, max 62ch), 48px gap. The fact chips under the bio are removed (the hero card carries them).

### Projects
- **Lead:** "{total} projects, {featured} worth a look first" / « {total} projets, dont {featured} à voir en priorité », counts computed from the data.
- **Filters:** three labelled groups (label 14px weight 600 `--muted`, 8px above): Context, Domain, Sort by. Each is a segmented bar: `--surface`, 2px `--text` border, 6px radius; buttons 15px, 42px tall, padding 0 15px, 1px `--rule` between them; the active one filled `--text` with `--on-text` text. **Deviation (chosen by Jocelyn):** each Context/Domain button keeps its result count, small and `--muted` (`--on-text` at reduced opacity when active), right of the label. Sort becomes a segmented bar on desktop instead of the select. Behaviour unchanged (combinable filters, zero-result options disabled unless active, empty state with reset); the M8 phone dropdowns stay.
- **Featured cards:** grid `repeat(auto-fill, minmax(min(100%, 380px), 1fr))`, gap 56px × 32px. Top to bottom: media 16:9, 6px radius, zoom 1.05 on card hover (M8 video/poster logic unchanged); meta line 15px weight 500 `--muted` = domain icon + domain name in `--accent`, then "2024 · Hackathon"; title 32px weight 800, letter-spacing −0.025em, with a 3px `--accent` underline that grows from 0 to full width on hover (0.3s); award 16px weight 700 `--accent` with a trophy icon, no background; description 17px `--body`; footer above a 1px `--rule`: tech tags (14px, padding 7px 10px, 4px radius, `--tag`) left, **Source code ↗ / Code source ↗** link (15px weight 600) or "Private code / Code privé" (`--muted`) right. Icon links become these text links; **Live demo ↗ / Démo ↗** is added next to it when a project has a demo (none today).
- **Other projects:** heading "More projects / Autres projets" 26px weight 800 (80px above), lead "Shorter school and game-jam projects." / « Projets d’école et de game jam, plus courts. » 16px `--muted`. Grid `repeat(auto-fill, minmax(min(100%, 270px), 1fr))`, gap 16px. Card: `--surface`, 2px `--border`, 6px radius, padding 22px, gap 8px: top row = domain icon in a 40px `--tint` tile (icon `--accent`) and **Code ↗** / "Private" right; title 19px weight 800; "2025 · School · AI" 14px `--muted`; description 15px, line-height 1.5, clamped to 3 lines; tags 13px (padding 5px 8px). Hover: border `--text`, lift 4px, `6px 6px 0 var(--accent)` shadow.

### Skills (tabs)
- **Lead:** "My core: backend, systems and tooling." / « Mon cœur de métier : backend, systèmes et outillage. »
- **Layout** inside the section body: tab list 300px wide, then the panel (gap 28px).
- **Tab:** a `<button>` 64px min-height, padding 10px 16px 10px 10px, 2px transparent border, 6px radius, 18px weight 700, gap 14px: group icon in a 44px `--tint` tile, group title, skill count right-aligned (14px weight 600 `--muted`). Hover: `--surface` background, `--border` border. Selected: `--surface`, 2px `--text` border, `5px 5px 0 var(--accent)` shadow.
- **Panel:** `--surface`, 2px `--border`, 6px radius, padding 32px 34px, min-height 480px (so the page doesn't jump between tabs); group title 32px weight 800, letter-spacing −0.02em; description 18px `--body` (8px above, 24px below); skills as tiles in `repeat(auto-fill, minmax(200px, 1fr))`, gap 10px: `--bg` background, 6px radius, padding 16px 18px, gap 14px, 30px logo in its theme brand colour (M4 `logoColor` logic), name 18px weight 600. No "used in" line (tried and dropped: 14 of 32 skills have no project to point to).
- **Default tab:** Backend.
- **Data:** each `SKILL_GROUPS` entry gains `description: Localized`:

| Group | EN | FR |
|---|---|---|
| Backend | APIs, databases, authentication and services. | APIs, bases de données, authentification et services. |
| Systems & Low-level | Code close to the machine: memory, processes, performance. | Du code proche de la machine : mémoire, processus, performance. |
| DevOps & Tools | Containers, deployment and continuous integration. | Conteneurs, déploiement et intégration continue. |
| AI & ML | Vision models, training and LLM agents. | Modèles de vision, entraînement et agents LLM. |
| Blockchain | Smart contracts, tokens and data anchored on-chain. | Smart contracts, tokens et données ancrées on-chain. |
| Frontend | Web interfaces when a project calls for them. | Des interfaces web quand le projet le demande. |

- **Accessibility:** ARIA tabs, vertical: `role="tablist"` (`aria-orientation="vertical"`, labelled), `role="tab"` with `aria-selected` / `aria-controls`, `role="tabpanel"` with `aria-labelledby`; roving `tabindex` (only the selected tab is in the tab order); ArrowDown/ArrowUp move and select (wrapping), Home/End go to the first/last. The key rule is a pure, unit-tested `nextTab(index: number, key: string, count: number): number | null` in `src/lib/skills.ts`; the component only wires it.
- **No JS / before hydration (and for crawlers):** the prerendered HTML shows all six groups stacked, each with its title, description and tiles; the tab list only appears after hydration, which is also when non-selected panels get `hidden`. Nothing is lost without JS.
- Under 48rem (until M10) the tab list stacks above the panel.

### Experience & Education
- Sub-heading "Experience / Expérience" 15px weight 600 `--accent`. One row per job: grid `190px 1fr`, gap 8px × 32px, 28px vertical padding, 1px `--rule` below. Left: dates 15px weight 500 `--muted`, "Jul 2025 → Jan 2026" then "Internship · 7 months" / « juil. 2025 → janv. 2026 », « Stage · 7 mois » (`<time>` elements kept). Right: title 24px weight 800; company weight 700 `--accent`; bullets `--body`; tech tags; the recommendation in a box: grid `36px 1fr`, gap 8px, padding 20px 24px 20px 16px, `--surface`, 2px `--border`, 6px radius; a 52px weight 800 `--accent` opening quote mark (`aria-hidden`); quote 17px, line-height 1.55; caption 15px `--muted` with the name in `--text` bold. "(translated from French)" stays on the English page.
- **Quotes stay whole on desktop** (deviation from the canvas, which cut one for space); the M8 2-line clamp with Read more stays below 56.25rem.
- Below the jobs (56px above), two columns `repeat(auto-fit, minmax(min(100%, 320px), 1fr))`, gap 48px:
  - **Education / Formation:** rows with 18px vertical padding and a 1px `--rule`: dates 14px `--muted`, school 20px weight 800, diploma weight 600, details 16px `--body`; the CS50 certificate link.
  - **Hackathons — {n} podiums** ({n} computed): rows grid `44px 1fr auto`, gap 14px, 12px vertical padding, 1px `--rule`: a 40px tile (4px radius) — trophy icon in `--accent` on `--tint` for a win, medal icon in `--muted` on `--tag` otherwise; event in bold with "project · year" below (15px `--muted`); the result right: **Winner / Vainqueur** (15px weight 800 `--accent`) or **2nd place / 2e place**, **3rd place / 3e place** (15px weight 700 `--body`). The labels come from a new `experience.results` dict entry (`{ 1: 'Winner', 2: '2nd place', 3: '3rd place' }` / `{ 1: 'Vainqueur', 2: '2e place', 3: '3e place' }`, typed `Record<Medal, string>`), replacing the `experience.places` "1st place:" keys; the title count comes from the hackathon data.

### Contact & Footer
- Intro 24px weight 600, max 40ch, 28px below.
- Two equal blocks, `repeat(auto-fit, minmax(min(100%, 380px), 1fr))`, gap 20px, each `--surface` with a 2px `--text` border, 6px radius, padding 28px 32px:
  - **Email:** label "By email / Par e-mail" (14px weight 600 `--muted`); the address as the `mailto:` link, 30px weight 800, letter-spacing −0.02em, `--text`; a primary **Copy address / Copier l’adresse** button. M7 copy behaviour kept (`aria-live` announcement, repeat re-announce, select-and-hint fallback).
  - **Malt:** Malt symbol (30px, `#FC5757`) in a 48px tile (`#FFEDEC` light, `rgba(252,87,87,.14)` dark), label "Freelance"; title "Working through Malt? / Vous passez par Malt ?" 26px weight 800; text 17px `--body` "My profile, recommendations and mission requests are on Malt too." / « Mon profil, mes recommandations et la prise de contact pour une mission sont aussi sur Malt. »; secondary button **See my Malt profile ↗ / Voir mon profil Malt ↗** (new tab).
- Below (20px), three tiles `repeat(auto-fit, minmax(min(100%, 200px), 1fr))`, gap 16px: **LinkedIn** (logo `#0A66C2` light, `#4A9FE8` dark), **GitHub** (logo `--text`), **CV (PDF)** (document line icon); 64px tall, padding 0 20px, `--surface`, 2px `--text` border, 6px radius, 18px weight 700, logo + label left, ↗ (↓ for the CV) right. Hover: `--text` fill, `--on-text` text, `6px 6px 0 var(--accent)` shadow, lift 4px. `contactLinks()` changes accordingly (email and Malt become their own blocks; the tiles are linkedin, github, cv) and its tests follow.
- **Footer:** a full-width band, `#141412` (light) / `#0D0D0B` (dark) with `#FFFFFF` / `#F3F0E8` text, 88px tall: "© {year} Jocelyn Renault" (weight 700) left — the © year is a small deviation kept by choice — and "Back to top ↑ / Retour en haut ↑" (weight 600) right.

### Favicon, share image, meta
- **Favicon:** `static/favicon.svg`, white "JR" on `#C2391B`, rounded square (radius 12 on a 64 grid); the letters are outlined paths (an SVG favicon can't load a web font). Also `static/favicon.ico` (32px) and `static/apple-touch-icon.png` (180px). The `$lib/assets/favicon.svg` import in `+layout.svelte` and the downloaded icons8 files in `src/lib/assets/` are removed.
- **Share (OG) image:** 1200×630, one per language (`static/og-en.png`, `static/og-fr.png`): `--bg` ground, the name with the accent full stop, the role in `--accent`, the JR mark. Generated, together with the favicon PNG/ICO, by `npm run og` (`scripts/og.ts`, Playwright rendering an HTML template with the site font and tokens); outputs are committed.
- **Per-locale meta** in `[lang=lang]/+page.svelte` from the dicts: existing title and description, plus `og:title`, `og:description`, `og:image`, `og:type=website`, `og:locale` (`en_US` / `fr_FR`) and `og:locale:alternate`, `twitter:card=summary_large_image`, and `theme-color` for light and dark (`media` queries). `og:image` is relative until M11: link previews (LinkedIn, Malt, Slack) need an absolute URL and only work once the domain exists; the audit keeps reporting it as "pending domain".

### Scroll reveal
Each section except the hero fades in once, rising 16px, over ~500ms, when it enters the viewport: a `reveal` Svelte action using `IntersectionObserver`, unobserved after the first reveal. Nothing is ever hidden without JS, before hydration, under `prefers-reduced-motion`, or for a section already in view at hydration (so nothing flashes). The decision is a pure, unit-tested `shouldReveal({ supported, reducedMotion, inViewAtStart }): boolean` in `src/lib/reveal.ts` (true only when supported, not reduced motion and not in view at start).

### Tests and verification
- **Unit:** `nextTab`; `experience.results` labels for places 1–3; `PROFILE.glance` and skill-group descriptions non-empty in both languages (and French typography rules); `contactLinks` new shape; `THEME_BG` matches `app.css`; favicon, apple-touch-icon and both OG images exist in `static/`; i18n completeness for every new key; `shouldReveal`.
- `npm run check`, `npm test`, `npm run lint` clean; `npm run audit` passes (0 axe violations in both themes and languages, no horizontal scroll at 360px, Lighthouse Accessibility / Best Practices / SEO 100 except the pending-domain items, Performance ≥ 95 with the web font).
- **Fidelity:** Playwright screenshots of every section at 1440px and 1280px, both themes, both languages, checked against the artboard values; the canvas can't be rendered outside claude.ai, so the review guide puts the screenshots next to the canvas link for Jocelyn's own side-by-side check and lists every deviation. Quick check at 360px and 390px that nothing breaks.
- **Review guide:** `docs/reviews/milestone-9-review-guide.md`.

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
7. **Fixes & accessibility** — mobile nav, active-section highlight, a11y, French typography, `/` redirect, deferred review minors, responsive pass, `npm run audit` (axe + Lighthouse).
8. **Layout & media** — compact phone layout (overlay project cards, compact rows, scrollable filters, tighter sections and skill chips, clamped quotes), video and poster media, desktop card hover.
9. **Desktop design** — the new visual identity from the Claude Design canvas on desktop, both themes (see "Milestone 9 — Desktop design"): tokens and font, numbered section grid, hero with the at-a-glance card, restyled projects, skills as tabs, experience, contact with email and Malt blocks, favicon, OG images, per-locale meta, scroll reveal.
10. **Phone design** — the same pass for phones, once the desktop version is settled (not both at once).
11. **Deployment** — OVH domain, self-hosted on the home server; absolute canonical/hreflang/OG URLs from one site-origin setting.

## Next steps after approval
1. `git init` in `/home/lezard/portfolio`, save this spec to `docs/superpowers/specs/2026-09-23-portfolio-design.md`, commit.
2. Jocelyn reviews the written spec.
3. Invoke writing-plans for **Milestone 1 only**.
