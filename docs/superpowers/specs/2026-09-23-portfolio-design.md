# Portfolio - Design Spec

## Context
Jocelyn (GitHub: LezardSC) wants a portfolio to show recruiters their work, built in **Svelte 5**. Inspiration (idea, not copy): angeluriot.com/portfolio - especially that a recruiter can **filter/sort projects** to quickly find what interests them. Positioning is **general software engineer** (C/ASM, Python/AI, web, blockchain, games). The project directory `/home/lezard/portfolio` is empty (not a git repo). Build happens **incrementally, one milestone at a time**.

**Success criteria:** a recruiter lands on the site in EN or FR, understands who Jocelyn is in seconds, and can narrow projects by context × domain to reach the relevant GitHub repos in a couple of clicks.

## Decisions
| Topic | Decision |
|---|---|
| Framework | SvelteKit (Svelte 5 runes) + `@sveltejs/adapter-static`, fully prerendered, TypeScript |
| Languages | EN + FR toggle; routes `/en`, `/fr` |
| Theme | Dark + light toggle, defaults to system preference |
| Hosting | Plain static output, host-agnostic. OVH free hosting (100 MB, Apache, FTP) at `jocelynrenault.com`, deployed by GitHub Actions on merge to `master` (M13) |
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
- **Filters:** group *Context* (All, Professional, Personal, School, Hackathon - game jams count as Hackathon) and group *Domain* (All, Web, Blockchain, AI, Low-level, Games). One active chip per group; groups combine with AND. Each chip shows a count computed against the other group's current selection.
- **Sort:** Highlights / Incontournables (key `featured`; default; projects with `featured` first, ascending, then the rest newest first) | Newest.
- **Empty state:** "No project matches" + reset button.
- **Two tiers (by position, after filter + sort):** the first **6** results render as **large cards, 2 per row** (1 on mobile); all remaining results render as **small cards, 3 per row** (1–2 on smaller screens).
  - *Large card:* 16:9 media on top (image, or muted looping video that autoplays only while in view and never under `prefers-reduced-motion`, showing the poster instead); below it date · context, title, award badge, description, tech tags, link icons.
  - *Small card:* domain icon (top-left, inline SVG), link icons (top-right), title, year · context, award line (if any), description clamped to 3 lines, tech tags. No media.
  - *No media yet:* a styled placeholder (domain-coloured gradient + title). Real media can be dropped into `static/projects/` later without code changes.
- **Links:** GitHub and demo icons (`target=_blank rel=noopener noreferrer`) are the accessible links. The large card's media and the small card's title also link to the primary link (repo, else demo) - the media link is `tabindex=-1 aria-hidden` to avoid duplicate focus stops. No link at all → a "Private" tag, nothing clickable.
- **Logic:** pure, unit-tested functions in `src/lib/projects.ts`: `filterProjects`, `sortProjects`, `countFor`, `splitTiers(list, 6)`, `primaryLink`. Components only render; filter/sort state lives in `sections/Projects.svelte`.
- **Animation:** both tiers use `animate:flip` + fade-in (duration 0 under `prefers-reduced-motion`). Outgoing cards leave immediately (no fade-out: it would hold their grid cell and shove the others); a project moving between tiers fades into its new tier.
- **Initial content:** at least one project per context. Professional: GoldenEye data augmentation (SogetiLabs/Capgemini, private). Hackathon: KAYP (PBW 2024 winner; links to the backend repo), KAYP-H-WEB3PARIS (winner), Bahapad (PBW 2025 3rd), GameJam Confiture de jeu, Love_Takedown. School: libft, ft_printf, get_next_line, libasm, ft_linear_regression, DSLR (group project; repo is a teammate's), Leaffliction (added in M4), tokenizer, tokenizArt, ft_transcendence. Personal: microcode. Descriptions drafted from READMEs; Jocelyn edits the list freely afterwards.

## Hero + About
_Settled during Milestone 3 brainstorming (2026-09-30)._

**Positioning:** general software engineer with a backend & systems lean. Broader than the Malt profile ("Développeur Backend & Systèmes") so web, blockchain, AI and games projects stay on-message. No location is shown anywhere on the site.

**Content** lives in a new `src/lib/data/profile.ts` (content, `{ en, fr }` fields). UI labels (CTA texts, photo alt, availability text) live in the i18n dicts. `hero.name` / `hero.tagline` leave the dicts; `meta.title` becomes "Jocelyn Renault - Software Engineer" / "Jocelyn Renault - Ingénieur logiciel", and the meta description uses the full name.
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

**Assets** (`static/`): `cv-en.pdf`, `cv-fr.pdf` (phone number removed; `cv-en.pdf` is temporarily a copy of the French CV until the English one is re-exported - replacing the file needs no code change), `photo.jpg` (cropped once to a 480×480 square centred on Jocelyn, EXIF stripped; the original is not kept).

**Hero** (`sections/Hero.svelte`, props `{ lang, t: Dict['hero'] }`): full height (`100svh`), centred.
- Optional pill "● Available for work" / "● Disponible" (green dot) when `profile.available`.
- `h1` name, role line, pitch (muted, max ~60ch).
- CTAs, wrapping on narrow screens: **See projects** (primary, `#projects`), **Download CV** (opens `cv-{lang}.pdf` in a new tab, no forced download), **GitHub** (icon + label, new tab). External links use `target=_blank rel="noopener noreferrer"`.
- Pitch EN: *"I build the invisible part of products: APIs, services, data processing, automation and deployment. My field is backend and low-level - reliability and performance over UI."*
- Pitch FR: *"Je conçois la partie invisible des produits : APIs, services, traitement de données, automatisation et mise en production. Mon terrain, c'est le backend et le bas niveau - la fiabilité et la performance plutôt que l'interface."*

**About** (`sections/About.svelte` inside `Section`, props `{ lang, title, t: Dict['about'] }`, same pattern as Projects): two-column grid, round 200px photo left and bio right; under 640px it stacks with the photo centred on top. Photo has explicit `width`/`height`, `loading="lazy"`, localized alt ("Photo of Jocelyn Renault"). Below the bio, the facts render as chips in the project tech-tag style (🎓 42 Lyon (RNCP 7) · 🗣 French / English).

Bio draft (Jocelyn edits freely):
1. EN *"I got into programming for the money. I stayed because I found out I love understanding how things work underneath: memory, processes, the network, the machine itself."* - FR *"Je me suis mis à la programmation pour l'argent. J'y suis resté parce que j'ai découvert que j'adore comprendre comment les choses fonctionnent en dessous : la mémoire, les processus, le réseau, la machine elle-même."*
2. EN *"I trained at 42 Lyon (RNCP 7 - Expert in computer architecture), then worked as a full-stack developer at Y247 Group and as a machine-learning developer at Sogeti (Capgemini), and won several hackathons along the way."* - FR *"Je me suis formé à 42 Lyon (RNCP 7 - Expert en architecture informatique), puis j'ai travaillé comme développeur full stack chez Y247 Group et comme développeur machine learning chez Sogeti (Capgemini), en remportant plusieurs hackathons au passage."*
3. EN *"Today I focus on backend and systems work - APIs, services, Rust, infrastructure - while staying at home with Web3 and AI when a project needs them."* - FR *"Aujourd'hui je me concentre sur le backend et les systèmes - APIs, services, Rust, infrastructure - tout en restant à l'aise avec le Web3 et l'IA quand un projet en a besoin."*

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
- A skill may appear in several groups (e.g. Python in Backend and AI & ML), but only once per group.

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
- Entry: period line (muted, small, e.g. "Jul 2025 – Jan 2026 · Internship") → `h4` role (or diploma title; when `link` is set, the title is a link to the certificate, `target=_blank rel="noopener noreferrer"`) → company or school → bullet list → tech tags (project tech-tag style) → optional `<blockquote>` (3px `--accent` left border, italic) with a `<footer>`: "- author, role" and the translated note when relevant.
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


## Milestone 7 - Fixes & accessibility
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
- ~~Skill icons store only `{ path, hex }`~~ - dropped (checked 2026-10-01): the bundle keeps every referenced `simple-icons` object whole whatever fields are read, so the saving (a few KB of titles/URLs) would need an icon code generator; not worth it.
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

## Milestone 8 - Layout & media
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

## Milestone 9 - Desktop design
_Settled during Milestone 9 brainstorming (2026-10-07 → 2026-10-08), after a design exploration on a Claude Design canvas._

**Goal.** Give the site its new visual identity on desktop, in both themes, with the readability of the information first: the audience is recruiters and clients, often not developers. This section **supersedes the desktop presentation** described in the Hero + About, Projects, Skills, Experience & Education and Contact & Footer sections above; data, logic and accessibility rules from those sections still apply unless changed here.

**Source of truth.** The validated artboards on the canvas https://claude.ai/artifact/5rqhnCoS2tUFHpioTu8jZG (private to Jocelyn's claude.ai account): **A1·M3 révisée - clair** (`A1M3b-Clair`), **A1·M3 révisée - sombre** (`A1M3b-Sombre`) and **Compétences 4A** (`Skills-Idee4A`). Copies of their sources are in `docs/superpowers/designs/2026-10-07-m9-final/` (`.dc.html` design components: they only render inside the canvas, so use them as a value reference, not as code). Every value below comes from them; **the implementation must match them**, each section is screenshot-checked against them, and any deliberate deviation is listed in the review guide. Rejected directions (terminal/developer jokes, SaaS-style bento) stay rejected.

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

**Font.** Schibsted Grotesk (variable, weights 400–900) from `@fontsource-variable/schibsted-grotesk`, latin subset only, self-hosted (no Google request), `font-display: swap`, woff2 preloaded. It replaces the system stack everywhere. Body text 18px, line-height 1.6. The canvas used IBM Plex Mono for the small nav numbers; it is dropped (Schibsted 13px, one font file less) - a deliberate deviation.

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
| Education | 42 Lyon - RNCP 7, expert in computer architecture | Formation | 42 Lyon - RNCP 7, expert en architecture informatique |
| Latest role | ML & Computer Vision developer - Sogeti (Capgemini) | Dernier poste | Développeur ML & IA Vision - Sogeti (Capgemini) |
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
  - **Hackathons - {n} podiums** ({n} computed): rows grid `44px 1fr auto`, gap 14px, 12px vertical padding, 1px `--rule`: a 40px tile (4px radius) - trophy icon in `--accent` on `--tint` for a win, medal icon in `--muted` on `--tag` otherwise; event in bold with "project · year" below (15px `--muted`); the result right: **Winner / Vainqueur** (15px weight 800 `--accent`) or **2nd place / 2e place**, **3rd place / 3e place** (15px weight 700 `--body`). The labels come from a new `experience.results` dict entry (`{ 1: 'Winner', 2: '2nd place', 3: '3rd place' }` / `{ 1: 'Vainqueur', 2: '2e place', 3: '3e place' }`, typed `Record<Medal, string>`), replacing the `experience.places` "1st place:" keys; the title count comes from the hackathon data.

### Contact & Footer
- Intro 24px weight 600, max 40ch, 28px below.
- Two equal blocks, `repeat(auto-fit, minmax(min(100%, 380px), 1fr))`, gap 20px, each `--surface` with a 2px `--text` border, 6px radius, padding 28px 32px:
  - **Email:** label "By email / Par e-mail" (14px weight 600 `--muted`); the address as the `mailto:` link, 30px weight 800, letter-spacing −0.02em, `--text`; a primary **Copy address / Copier l’adresse** button. M7 copy behaviour kept (`aria-live` announcement, repeat re-announce, select-and-hint fallback).
  - **Malt:** Malt symbol (30px, `#FC5757`) in a 48px tile (`#FFEDEC` light, `rgba(252,87,87,.14)` dark), label "Freelance"; title "Working through Malt? / Vous passez par Malt ?" 26px weight 800; text 17px `--body` "My profile, recommendations and mission requests are on Malt too." / « Mon profil, mes recommandations et la prise de contact pour une mission sont aussi sur Malt. »; secondary button **See my Malt profile ↗ / Voir mon profil Malt ↗** (new tab).
- Below (20px), three tiles `repeat(auto-fit, minmax(min(100%, 200px), 1fr))`, gap 16px: **LinkedIn** (logo `#0A66C2` light, `#4A9FE8` dark), **GitHub** (logo `--text`), **CV (PDF)** (document line icon); 64px tall, padding 0 20px, `--surface`, 2px `--text` border, 6px radius, 18px weight 700, logo + label left, ↗ (↓ for the CV) right. Hover: `--text` fill, `--on-text` text, `6px 6px 0 var(--accent)` shadow, lift 4px. `contactLinks()` changes accordingly (email and Malt become their own blocks; the tiles are linkedin, github, cv) and its tests follow.
- **Footer:** a full-width band, `#141412` (light) / `#0D0D0B` (dark) with `#FFFFFF` / `#F3F0E8` text, 88px tall: "© {year} Jocelyn Renault" (weight 700) left - the © year is a small deviation kept by choice - and "Back to top ↑ / Retour en haut ↑" (weight 600) right.

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

## Milestone 10 - Phone design
_Settled during Milestone 10 brainstorming (2026-10-08), after a design session on a Claude Design canvas._

**Goal.** Give phones the M9 visual identity with layouts made for a 390px screen: less scrolling, information readable at a glance, nothing that scrolls sideways, touch targets ≥ 44px. This section **supersedes the phone presentation** of Milestone 8 ("Projects on phones", "Other sections on phones") and the phone menu of Milestone 7; data, logic and accessibility rules from earlier sections still apply unless changed here.

**Source of truth.** The validated boards on the canvas "Portfolio - Mobile" https://claude.ai/artifact/9N2zK35VungBsy2GnLcE59 (private to Jocelyn's claude.ai account): **Mobile - clair** (`Mix.dc.html`) and **Mobile - sombre** (`MixSombre.dc.html`, the same board with `theme="Sombre"`). A snapshot is in `docs/superpowers/designs/2026-10-08-m10-final/` (`Mobile-Clair.dc.html`, `Mobile-Sombre.dc.html`, `skill-logos.json`, and a `README.md` with the choice made for each section). Like the M9 boards they only render inside the canvas: use them as a value reference. Values below come from them; the implementation must match them, each section is screenshot-checked against them, and every deliberate deviation is listed in the review guide. Colours, font, borders and radii are the M9 tokens.

**Scope.** "Phone" = `width < 48rem` (the existing breakpoint, `DESKTOP_QUERY` in `src/lib/projects.ts`). At 48rem and up the M9 desktop layout is unchanged (it was checked down to 768px in M9); tablets get no design of their own. Desktop gets a no-regression check only.

**Approach.** As in M8: one set of markup per component, restyled for phones by `@media (width < 48rem)`. Where phone and desktop need different interactive controls (skills tabs vs accordion, filter segmented bars vs selects, the phone-only "Read more" and "See N other projects" buttons), both sets of controls exist and CSS shows one set per width with `display: none`, which also takes the hidden set out of the accessibility tree and tab order. Choosing components in JS by screen width was rejected (the prerendered page would flash the wrong layout and break without JS), and so was rendering two complete layouts (double HTML, every heading and link twice).

**Collapsibles (shared rule).** Everything the phone design folds away (About paragraphs, recommendation quotes, other projects beyond 6, closed skill groups) is folded **only after hydration**: without JS, before hydration and for crawlers everything is visible and the toggle buttons are absent. Toggle buttons are real `<button>`s with `aria-expanded` and `aria-controls`. The shared strings `experience.readMore` / `experience.showLess` move to a shared dict group (e.g. `common.readMore` / `common.showLess`), used by About and anywhere else they are needed.

### Foundations (phone)
- Side padding 20px; body text 17px, line-height 1.6.
- `Section`: 48px vertical padding, 2px `--text` top rule kept. Header on one line (`display: flex; align-items: flex-end; gap: 14px`): the outlined number 46px, weight 900, line-height 0.8, letter-spacing −0.05em, transparent fill with a **1.5px** `--accent` stroke; the `h2` 29px, weight 800, line-height 1.05, letter-spacing −0.03em. Lead 15px `--muted`, line-height 1.5, 10px above. Body starts ~20px below the header.
- Buttons on phones: `.btn` min-height 48px, padding 0 16px (M9 desktop keeps 22px).

### Header
- Sticky, min-height 60px, background `--bg` at **92%** opacity with a 14px backdrop blur, 1px `--rule` bottom border.
- Left: "Jocelyn Renault" 18px weight 800 (link to the top). Right, 6px apart: theme toggle and language switch as 44px square buttons (1px `--rule`, 4px radius), then a primary **Contact** button (44px tall, padding 0 14px, 15px; links to `#contact`). New key `nav.contact` ("Contact" in both languages).
- On phones the section links and the desktop **CV** button are hidden (the CV is in the hero). **The M7 phone menu goes:** burger button, panel, `src/lib/nav-menu.ts` and its tests, and the phone-only nav CSS. Desktop nav (links, active-section underline, CV button) is unchanged.

### Hero
- Padding 28px top, 40px bottom.
- "Available" badge as on desktop (14px below it), when `PROFILE.available`.
- `h1` on two lines, "Jocelyn" / "Renault" + accent full stop: 58px at 390px and above, scaling down below (`font-size: min(3.625rem, 14.8vw)`, ≈53px at 360px), weight 900, line-height 0.88, letter-spacing −0.055em. The line break is phone-only (desktop stays one line).
- Role 20px weight 800 `--accent`, line-height 1.25, 20px above, 8px below.
- Pitch 16px, line-height 1.55, `--body`, **first sentence only** on phones. Data: `PROFILE.pitch` is split into `pitch` (first sentence) and `pitchMore` (the rest); desktop shows both (no visible change there).

| | EN | FR |
|---|---|---|
| `pitch` | I build the invisible part of products: APIs, services, data processing, automation and deployment. | Je conçois la partie invisible des produits : APIs, services, traitement de données, automatisation et mise en production. |
| `pitchMore` | My field is backend and low-level - reliability and performance over UI. | Mon terrain, c’est le backend et le bas niveau - la fiabilité et la performance plutôt que l’interface. |

- **At a glance → tiles:** the same `<dl>`, restyled as a 2-column grid, gap 8px, 20px below. Tile: padding 12px 14px, `--surface`, 2px `--border`, 6px radius; `dt` 12px weight 600 uppercase, letter-spacing 0.05em, `--muted`; `dd` 15px weight 700, line-height 1.35, 2px above. Phone order: Education, Latest role, Hackathons, Languages, then **Stack across both columns** (CSS `order`). Data: `GlanceRow` gains `short?: Localized` (shown on phones instead of `value` when present; CSS shows one of the two) and `wide?: true` (full-width tile on phones):

| Row | `short` EN | `short` FR |
|---|---|---|
| Education | 42 Lyon · RNCP 7 | 42 Lyon · RNCP 7 |
| Latest role | Sogeti (Capgemini) | Sogeti (Capgemini) |
| Stack | - (`wide: true`) | - |

- **Buttons:** 2-column grid, gap 8px: **See projects / Voir les projets** + down-arrow icon (primary, both columns), then **View CV / Voir le CV** and **Malt ↗** (Malt symbol). The phone Malt label comes from a new key `hero.maltShort` ("Malt" in both languages); CSS shows one label per width.

### About
- Grid `88px 1fr`, gap 16px, aligned to the top: photo 88px wide, 4:5, 6px radius (same `photo.jpg`, `object-fit: cover`); first paragraph 16px, line-height 1.55.
- The other paragraphs (16px, line-height 1.6, 14px above) are folded behind a **Read more / Lire la suite** button that reads **Show less / Réduire** when open: 48px tall, inline (not full width), padding 0 14px, `--surface`, 1.5px `--text` border, 6px radius, 15px weight 600, 12px above. Collapsibles rule applies. Desktop: all paragraphs, no button.

### Projects
**Filters.** The M8 selects, laid out as on the board: grid of 2 columns, gap 12px, 20px above and 24px below; each a `<label>` with the label text above (13px weight 600 `--muted`, 6px gap): **Context** and **Domain** side by side, **Sort by** across both columns. Select: full width, min-height 48px, padding 0 40px 0 14px, 16px weight 600, `--surface`, 2px `--text` border, 6px radius, `appearance: none` with the board's two-triangle chevron. Options show plain labels, as on the board: **no result counts on phones** (decided while planning: with counts, "Professionnel (1)" or "Bas niveau (4)" can’t fit a half-width select at 16px, the minimum that stops iOS zooming on focus). Zero-result options stay disabled unless current (M8 behaviour). Desktop segmented bars keep their counts. If even a plain label is clipped at 360px, the select’s side padding shrinks below 390px rather than the font.

**Main domain.** A project's **main domain is `domains[0]`**: it sets the domain icon, label and colour on every card. Filtering still matches every domain in the list (KAYP stays under Blockchain and Web). This is already how the code reads it; the spec makes it a rule, the data order matters, and a test checks every project has at least one domain.

**Domain colours.** One typed map `DOMAIN_COLOR: Record<Domain, string>` in `src/lib/projects.ts`:

| Domain | Colour |
|---|---|
| AI / IA | `#0B6E6E` |
| Blockchain | `#24408E` |
| Low-level / Bas niveau | `#C2391B` |
| Games / Jeux | `#7A2E5E` |
| Web | `#5B3FA0` (new; the board reused the low-level red) |

Components pass it as `--dc`; the theme mix happens in CSS (light and dark values defined in every theme block, including the no-JS `prefers-color-scheme` one):
- tile background: light `color-mix(in srgb, var(--dc) 11%, #FFFFFF)`, dark `color-mix(in srgb, var(--dc) 24%, #121210)`;
- tile foreground (label, watermark, rule): light `var(--dc)`, dark `color-mix(in srgb, var(--dc) 45%, #FFFFFF)`.

Checked in brainstorming: label contrast ≥ 4.58:1 (light) and ≥ 7.18:1 (dark) for all five; a unit test recomputes it (pure contrast helper, ≥ 4.5:1 both themes).

**Featured cards** (the large tier; stacked, gap 14px):
- Card: `position: relative`, `isolation: isolate`, `overflow: hidden`, 2px `--text` border, 6px radius, min-height 300px, flex column justified to the end, gap 8px, padding 18px 18px 8px. Text is light on a dark ground **in both themes**.
- **With media:** the existing `ProjectMedia` element becomes the background (no second image): `position: absolute; inset: -16px` (so the blur has no soft edge), `object-fit: cover`, `filter: blur(6px)`, under a `#10100E` veil at **62%** opacity. It shows the image, or a video's poster (phones never play video, M8 rule unchanged). The media link stays decorative (`tabindex=-1`, `aria-hidden`). Blur and veil are CSS custom properties so they can be tuned once real photos exist.
- **Without media** (every project today): background = main domain colour under a `#10100E` veil at **35%**, plus the domain icon as a watermark, 160px, white at ~15% opacity, top right, partly off the card. With that veil every text colour below passes AA on all five domains (worst: `#FFA58C` on low-level, 4.73:1). The M8 gradient placeholder is not used on phones.
- Content, top to bottom: meta line 13px weight 500 `#D6D1C6`, gap 4px 10px = domain icon (16px) + domain name in `#FFA58C` weight 600, then "2024 · Hackathon"; title `h3` 23px weight 800, line-height 1.15, letter-spacing −0.02em, `#FFFFFF`; award 14px weight 700 `#FFB59F`, line-height 1.35, trophy icon 17px; description 15px, line-height 1.5, `#ECE8DF`, clamped to 3 lines (visual only, the full text stays in the DOM); footer with a 1px `rgba(255,255,255,.2)` top border, 6px padding top: tech tags (12px, padding 5px 8px, 4px radius, `rgba(255,255,255,.16)` background, `#F3F0E8`) left, **Code ↗** (15px weight 700 `#FFFFFF`, min-height 44px) or **Private code / Code privé** (13px `#D6D1C6`) right. New key `projects.code` ("Code" in both languages); the link's accessible name includes the project title (existing pattern).
- Desktop hover styles stay under `(hover: hover) and (pointer: fine)` and don't apply on phones.

**Other projects** (the small tier):
- Heading "More projects / Autres projets" 21px weight 800, 40px above, 2px below; lead 14px `--muted`, 8px below. Grid of **2 columns**, gap 10px, 14px above.
- Tile: `position: relative`, flex column, gap 6px, min-height 200px, padding 14px 12px 4px, tile background (above), 6px radius, no border, `overflow: hidden`. Watermark: domain icon 110px, stroke 1.2, tile foreground at 20% opacity, top right at −26px, `aria-hidden`. Then: label "AI · 2025" (main domain · year) 11px weight 700 uppercase, letter-spacing 0.07em, tile foreground; title 17px weight 800, line-height 1.15, letter-spacing −0.01em, `overflow-wrap: anywhere` (so `ft_linear_regression` never overflows); **summary** 13px, line-height 1.4, `--body`; footer (`margin-top: auto`) with a 1.5px top border in the tile foreground at 35%: context 12px weight 600 `--muted` left, **Code ↗** (13px weight 700, min-height 44px, accessible name with the title) or **Private / Privé** (12px `--muted`) right. No tech tags on phones.
- **6 shown, then a button:** full-width `.btn`, 12px above, **See the {n} other projects / Voir les {n} autres projets** (singular when n = 1: **See 1 other project / Voir 1 autre projet**), **Show fewer / Réduire la liste** when open. n is computed (small-tier count − 6); no button when the small tier has 6 or fewer. Any filter or sort change folds the list back. Collapsibles rule applies; folded tiles get `display: none` on phones only, so desktop always shows every card. The count is a pure, tested `hiddenCount(total, shown = 6)`. New keys `projects.showMore`, `projects.showMoreOne`, `projects.showFewer`.
- _Revised for issue #49 (2026-10-16), after tester feedback ("too many projects, you get lost"): every screen now shows the first **6** results as big cards (phones too, no longer 5), then the button, and "Other projects" (heading and small tiles) is folded behind it **on desktop as well**. The button sits right under the big cards, so the list unfolds below it. Same rules otherwise: folded only after hydration, any filter or sort change folds it back, no button with 6 results or fewer. `projectLayout` becomes `splitProjects(sorted, large = 6)`; `PHONE_LARGE_COUNT` and `PHONE_OTHERS` are removed._
- **Desktop small cards** keep the long description (3-line clamp); the summary is phone-only (CSS shows one of the two).

**Data: `summary`.** Every project gets `summary: Localized`, one sentence (any project can land in the small tier after filtering). Drafts below, to be reviewed by Jocelyn before implementation (FR for the small projects comes from the board):

| Project | EN | FR |
|---|---|---|
| KAYP | Maritime bills of lading as electronic documents, encrypted and anchored on the XRP Ledger. | Des connaissements maritimes électroniques, chiffrés et ancrés sur le XRP Ledger. |
| KAYP - H-W3B Paris | The weekend prototype of KAYP: bills of lading secured on the blockchain. | Le prototype de KAYP, en un week-end : des connaissements sécurisés sur la blockchain. |
| ft_transcendence | Online multiplayer Pong with tournaments, 3D rendering and an AI opponent. | Un Pong multijoueur en ligne avec tournois, rendu 3D et IA adverse. |
| microcode | An AI agent written from scratch on a local Ollama model. | Un agent IA écrit de zéro, sur un modèle Ollama local. |
| Bahapad | A launchpad to deploy your own ERC-20 token on Bahamut. | Un launchpad pour déployer son propre token ERC-20 sur Bahamut. |
| GoldenEye - data augmentation | Data augmentation for a SogetiLabs computer-vision project. | Augmentation de données pour un projet de vision par ordinateur de SogetiLabs. |
| Leaffliction | Leaf disease detection with a convolutional neural network. | Détection de maladies des feuilles par un réseau de neurones convolutif. |
| DSLR | A hand-coded one-vs-all logistic regression, Hogwarts sorting hat style. | Régression logistique one-vs-all recodée à la main, façon Choixpeau de Poudlard. |
| ft_linear_regression | A from-scratch linear regression that predicts a car’s price. | Régression linéaire écrite de zéro qui prédit le prix d’une voiture. |
| tokenizArt | A one-of-a-kind ERC-721 NFT on Sepolia, with its metadata on IPFS. | Un NFT ERC-721 unique sur Sepolia, avec ses métadonnées sur IPFS. |
| tokenizer | A multisig-approved ERC-20 token for 42’s wallet. | Un token ERC-20 à validation multisignature pour le porte-monnaie de 42. |
| libasm | Standard C functions rewritten in x86-64 assembly. | Des fonctions C standard réécrites en assembleur x86-64. |
| libft | My own C standard library, validated at 125%. | Ma propre bibliothèque standard C, validée à 125 %. |
| ft_printf | A re-implementation of printf, as a static library. | Une réimplémentation de printf, en bibliothèque statique. |
| get_next_line | Reading a file line by line, whatever the buffer size. | Lire un fichier ligne par ligne, quelle que soit la taille du buffer. |
| Confiture de Jeu #1 | A 48-hour platformer where a mask reveals hidden platforms. | Un jeu de plateforme en 48 h où un masque révèle des plateformes cachées. |
| Love Takedown | A game made as a team during a game jam. | Un jeu réalisé en équipe lors d’une game jam. |

(French text uses U+00A0 before `:` and `%` and in "48 h", and ’ apostrophes, per the typography tests.)

**Media.** No project has media in the repo yet; real photos come later from Jocelyn (a featured project with a video already has its photo: the poster). For visual checks, the stock photos in the gitignored `tmp/` are injected at screenshot time (Playwright `page.route`, as in M8) and never committed.

### Skills (accordion)
- Phones replace the tab list with an accordion; the six panels are shared with desktop.
- One `<button>` per group, stacked, gap 10px, 20px below the lead: full width, min-height 64px, padding 10px 14px 10px 10px, transparent, 2px `--border`, 6px radius, 17px weight 700, gap 14px: group icon in a 40px `--tint` tile (`--accent` icon, 4px radius), group title, count right-aligned (14px weight 600 `--muted`, `aria-hidden` as on desktop), chevron 18px (down when closed, up when open). Open: `--surface` background, 2px `--text` border, `5px 5px 0 var(--accent)` shadow.
- Open panel below its button: padding 18px 2px 8px; description 16px `--body`, 14px below; skills in 2 columns, gap 8px; skill item: flex, gap 10px, padding 12px, `--surface`, 1px `--border`, 6px radius, 15px weight 600, line-height 1.25, 24px logo (M4 `logoColor` logic, so black logos follow the text colour in dark mode). The panel's own `h3` is visually hidden on phones (the button names it) and the desktop `min-height` does not apply.
- **One group open at a time**; Backend open by default; tapping the open group closes it (all closed is allowed). Desktop tab selection and phone accordion state are separate.
- Buttons: `aria-expanded`, `aria-controls` → the panel. The tab list is `display: none` on phones and the accordion buttons on desktop, so each width has one consistent pattern. Which panels are hidden is a pure, unit-tested `panelHidden({ enhanced, desktop, selected, open }, index): boolean` in `src/lib/skills.ts`; `desktop` comes from `matchMedia(DESKTOP_QUERY)`. Before hydration / without JS all groups show, as today.

### Experience & Education
- Sub-headings ("Experience", "Education", "Hackathons - {n} podiums") 14px weight 600 `--accent`; 22px above the first, 32px above the others.
- **Job:** padding 20px 0, 1px `--rule` below. Dates on one line: "Jul 2025 → Jan 2026 · Internship · 7 months" 13px weight 500 `--muted` (`<time>` kept); title 20px weight 800, line-height 1.25; company 16px weight 700 `--accent`, 10px below; bullets 15px, line-height 1.55, `--body`, 18px indent; tags 12px (padding 5px 8px).
- **Recommendation:** a full-width button, min-height 48px, 12px above, padding 0 14px, `--surface`, 1.5px `--border`, 6px radius, 15px weight 600: a 30px weight 800 `--accent` opening quote mark (`aria-hidden`), **Recommendation - {name} / Recommandation - {name}** (new key `experience.recommendation`, filled with `fill()`), chevron right. Open: the quote below (8px above) in a box: padding 16px, `--surface`, 1.5px `--border`, 6px radius; quote 15px, line-height 1.55; caption 13px `--muted`, name bold `--text`; "(translated from French)" kept on the English page. Collapsibles rule applies. The whole quote shows when open (the board cut one quote with a "Read more" inside, for space).
- **This replaces the M8 quote clamp:** the 2-line clamp, its overflow measuring and its Read more button go. At 48rem and up the quote is always whole, with no button (so the 48–56.25rem clamp disappears too).
- **Education:** rows with 12px vertical padding and a 1px `--rule`: dates 13px `--muted`; school 18px weight 800 with the diploma inline after " · " (15px weight 600 `--body`); details 14px `--muted`, line-height 1.45. CS50 row: "Certificate ↗ / Certificat ↗" right (14px weight 600, min-height 44px).
- **Hackathons:** rows grid `36px 1fr auto`, gap 12px, 10px vertical padding, 1px `--rule`: 36px tile (trophy `--accent` on `--tint` for a win, medal `--muted` on `--tag` otherwise); event bold 15px with "project · year" below (13px `--muted`); result 13px weight 700 `--body`, `nowrap` (wins weight 800 `--accent`).

### Contact
- Intro 18px weight 600, line-height 1.4, 16px above, 18px below. Blocks stacked, gap 12px.
- **E-mail card:** flex column, gap 12px, padding 20px 18px, `--surface`, 2px `--text` border, 6px radius: label 13px weight 600 `--muted`; the address on **one line** (`white-space: nowrap`), 19px weight 800, letter-spacing −0.02em, line-height 1.2, scaled down below 390px so it still fits at 360px (`font-size: min(1.1875rem, Nvw)`, N chosen in the plan by measuring the rendered address at 360px); primary **Copy address** button full width. M7 copy behaviour unchanged.
- **Malt card:** the whole card is one link (new tab), row layout, gap 14px, same card style: 40px tile (`#FFEDEC` / `rgba(252,87,87,.14)`) with the 26px Malt symbol; title "Working through Malt? / Vous passez par Malt ?" 18px weight 800, line-height 1.25; short text 14px `--body` from a new key `contact.maltShort`: "Profile, recommendations and mission requests." / « Profil, recommandations et contact pour une mission. »; ↗ right (`aria-hidden`).
- **LinkedIn / GitHub / CV:** 3 equal columns, gap 8px; each a column-flex link, min-height 72px, gap 4px, centred, `--surface`, 2px `--text` border, 6px radius, 14px weight 700, 22px icon above the label (LinkedIn in `#0A66C2` / `#4A9FE8`). Desktop hover styles don't apply on phones.

### Footer
Min-height 76px, padding 0 20px, flex with wrap, gap 12px: "© {year} Jocelyn Renault" weight 700 left, "Back to top ↑ / Retour en haut ↑" weight 600 right (min-height 44px). **Deviation (kept by choice):** the © year stays, as on desktop; the board shows the name alone. It may wrap to two lines at 360px.

### Tests and verification
- **Unit:** every project has ≥ 1 domain and a non-empty `summary` in both languages (French typography tests cover it); `DOMAIN_COLOR` has all five domains and the tile label contrast is ≥ 4.5:1 in both themes; `hiddenCount`; `panelHidden`; glance `short` values non-empty when present and exactly one `wide` row; `pitch` + `pitchMore` non-empty; i18n completeness for every new key (`nav.contact`, `hero.maltShort`, `projects.code`, `projects.showMore`, `projects.showMoreOne`, `projects.showFewer`, `experience.recommendation`, `contact.maltShort`, the shared read more / show less); `nav-menu` tests removed with the module.
- `npm run check`, `npm test`, `npm run lint` clean. `npm run audit` passes: 0 axe violations in both themes and languages at 360px and 1280px, also with every collapsible opened (About, a skill group, a recommendation, all other projects); no horizontal scroll at 360px; Lighthouse as in M9.
- **Fidelity:** Playwright screenshots of every section at 390px and 360px, both themes, both languages, with and without the injected stock photos, checked against the board values; the review guide puts them next to the canvas link and lists every deviation. Desktop at 1280px and 1440px: no-regression screenshots against M9. Page height at 390px before and after goes in the review guide (an estimate, not a gate).
- **Manual (review guide):** real-phone feel (touch targets, sticky header, select pickers); featured-card text contrast over real photos once they exist (axe can't measure text over images).
- **Review guide:** `docs/reviews/milestone-10-review-guide.md`.

## Milestone 11 - Content-ready refactor
_Settled during Milestone 11 brainstorming (2026-10-08)._

**Goal.** Before deployment, Jocelyn rewrites the content: picks the projects worth showing (not everything on GitHub), records videos, makes phone images, rewrites descriptions and the About in their own words. This milestone makes every such edit **as convenient as possible, now and later**: each kind of change touches one place, mistakes are caught by the type checker or by a test whose message names the project and field, and a guide explains every edit. **No visible change:** the site renders exactly as before.

**Decisions.** Content stays in typed TypeScript data files (Markdown files and a CMS were considered and rejected: a loader and validation layer for little gain at this size). Phone images are optional per project, falling back to the poster. Media files are prepared by hand with ffmpeg commands given in the guide (no helper script). Writing the actual content is out of scope (Jocelyn's next step).

### Categories: one entry each
New `src/lib/data/categories.ts`. A project domain or context is **one entry holding everything about it**; key order is display order (filters):

```ts
export const DOMAINS = {
	web: { label: { en: 'Web', fr: 'Web' }, color: '#5b3fa0', icon: ICONS.code },
	blockchain: { label: { en: 'Blockchain', fr: 'Blockchain' }, color: '#24408e', icon: ICONS.cube },
	ai: { label: { en: 'AI', fr: 'IA' }, color: '#0b6e6e', icon: ICONS.sparkles },
	'low-level': { label: { en: 'Low-level', fr: 'Bas niveau' }, color: '#c2391b', icon: ICONS.chip },
	games: { label: { en: 'Games', fr: 'Jeux' }, color: '#7a2e5e', icon: ICONS.gamepad }
} satisfies Record<string, DomainDef>;
export type Domain = keyof typeof DOMAINS;

export const CONTEXTS = {
	professional: { label: { en: 'Professional', fr: 'Professionnel' } },
	/* personal, school, hackathon */
} satisfies Record<string, ContextDef>;
export type Context = keyof typeof CONTEXTS;
```

(Labels are today's dictionary values, copied exactly.)

- `Domain` and `Context` stay literal unions, so a project's `domains` / `context` keep autocomplete and type errors.
- **Icons:** the stroke icons of domains and skill groups become plain SVG path strings (24×24 viewBox, stroke-drawn) in `src/lib/data/icons.ts`, named by shape (`code`, `cube`, `sparkles`, `chip`, `gamepad`, `server`, `cycle`). Shapes made of `rect`/`circle` elements today are converted to equivalent path data; the rendered icons must look the same. `DomainIcon.svelte` and `SkillGroupIcon.svelte` are replaced by one generic `Icon.svelte` (`path`, `size`, `stroke` width props). A new category picks an existing icon or pastes a 24×24 stroke path (e.g. from Lucide, which uses the same viewBox and style).
- **Labels move out of the dictionaries:** `projects.contexts` and `projects.domains` leave `en.ts` / `fr.ts`; components read `DOMAINS[d].label[lang]` / `CONTEXTS[c].label[lang]`. CLAUDE.md's convention is updated: UI strings live in the dictionaries, **category labels are content** and live with their category.
- **Colours:** `DOMAIN_COLOR` is removed (the colour lives in the entry). The M8 desktop gradient placeholder (`HUE` table in `ProjectMedia.svelte`) derives from the main domain's colour instead of a separate hue table; the placeholder must keep a white title readable (the domain colours are all dark enough; the AA test below covers it).
- **Skill groups** get an `icon` field (a path from `icons.ts`). The `SkillGroupId` union, the icon branches of `SkillGroupIcon.svelte` and the test pinning the six-group order are removed; group `id` becomes a plain string (unique, kebab-case, tested), array order stays display order. Adding a group = one entry in `SKILL_GROUPS`.
- **Filters show only categories that have at least one visible project**, in category order (pure tested helper `usedCategories`). So removing projects never leaves an empty filter option, and a new category appears once a project uses it. The data tests "at least one project in every context" and "at least one private project" are removed (they constrained content, not integrity).

### Projects
- **Priority order is a list** at the top of `src/lib/data/projects.ts`: `export const PRIORITY: string[] = ['kayp-pbw-2024', 'kayp-h-web3-paris', 'ft-transcendence', 'microcode', 'bahapad', 'goldeneye-data-augmentation'];` (today's order). Reordering = moving a line. The `featured?: number` field is removed. The default sort, key `priority`, labelled **Relevance / Pertinence** (was Highlights / Incontournables), ranks by position in `PRIORITY`, then newest. Test: every id in `PRIORITY` exists, is not hidden, and appears once.
- **Priority, not a category** (decided after the first review of PR #11): there are no "featured" projects, only an order. The big cards are the first 6 (`LARGE_COUNT`) of whatever list is displayed: with more than 6 priority projects the rest lead the small cards, and a filter that leaves only school projects gives big cards to the best-ranked school projects. So nothing on the page names a number of special projects: the lead becomes "{total} projects, most important first." / « {total} projets, les plus importants d’abord. », and the line under "More projects / Autres projets" (« Projets d’école et de game jam, plus courts. ») is removed, its bottom spacing moving to the heading (supersedes the Milestone 9 and 10 values for these two texts).
- **`hidden?: true`** takes a project off the site while keeping its text in the file. Hidden projects are filtered out once, at the data boundary (`visibleProjects`), so nothing downstream (counts, lead "{total} projects", filters, tiers) sees them. Data checks still run on hidden projects.
- **Media:** `{ kind: 'image'; src; phone? }` | `{ kind: 'video'; src; poster; phone? }`. On phones (`width < 48rem`) the featured card's blurred background uses `phone` when present, else the image or poster (unchanged when absent). Implemented with `<picture>` + `<source media="(width < 48rem)">` so only one image is downloaded and the prerendered HTML is right before hydration. `mediaFiles` / `mediaIssues` include `phone` (same format, relative-path and exact-case existence checks).
- Unchanged: `summary` (one sentence, ≤ 100 chars), `links.repo` / `links.demo`, `award`, main domain = `domains[0]`.

### Experience and hero "At a glance"
- `PROFILE.glance` rows stay editable in order, but two rows can be **derived** instead of typed: `{ auto: 'latestRole' }` and `{ auto: 'hackathons' }`.
  - `latestRole`: the newest job (`newestFirst(JOBS)[0]`); value = `"{roleShort ?? role} - {companyShort ?? company}"`, phone `short` = `companyShort ?? company`. New optional `Job` fields `roleShort?: Localized` and `companyShort?: string`; the Sogeti job gets `roleShort` "ML & Computer Vision developer" / "Développeur ML & IA Vision" and `companyShort` "Sogeti (Capgemini)", so the text is identical to today.
  - `hackathons`: counted from `HACKATHONS` (wins = medal 1, podiums = all), with dictionary templates and one/other forms: EN "{wins} wins, {podiums} podiums", FR "{wins} victoires, {podiums} podiums" → "2 wins, 5 podiums" today. The "Hackathons - {n} podiums" heading already counts.
  - One pure tested function `glanceRows(profile, jobs, hackathons, lang, t)` returns `{ label, value, short?, wide? }` rows; `Hero.svelte` only renders them.
- Jobs, education, certificates and hackathons are otherwise unchanged (already one entry each, sorted by the page).

### French typography applied automatically
Content can be written with plain spaces and straight apostrophes (a string containing `'` goes in double quotes, or is escaped as `\'` and Prettier turns it into double quotes). A pure tested `typesetFrench(text)` turns a plain space before `: ; ! ? % »` and after `«` into U+00A0 and `'` into `’`; it never touches `://` or `12:30` (no space). A deep helper `typeset(data)` applies it to every string under an `fr` key; each data file wraps its export (`export const PROJECTS = typeset([...])`, same for skills, experience, profile, categories). The dictionaries `fr.ts` are already correct and not wrapped. The existing typography tests keep running on the exported data as a safety net. English text is left as written.

### The editing guide
`docs/content-guide.md`, linked from `README.md` (and from CLAUDE.md). One recipe per edit, each with the file, a copy-paste snippet and what to check:
- Projects: add, remove, hide, reorder the featured list; write the long description and the one-sentence summary; add a demo or repo link; mark an award; choose the main domain.
- Media: add an image; add a video + poster; add a phone image. **ffmpeg commands** to copy: compress a screen recording to a muted web mp4 (H.264, ~1280px wide, no audio, `+faststart`, target a few MB), extract a poster frame at a chosen second as `.webp`/`.jpg`, crop/resize a phone image. Recommended sizes and weights, file naming (`static/projects/<id>/…`), install note (`brew install ffmpeg` on the Mac).
- Categories: add/rename/remove a domain (label, colour + the contrast rule, icon) or a context.
- Skills: add a skill (finding its logo in simple-icons, or a custom path in `skill-icons.ts`), add/reorder a skill group.
- Experience: add a job (incl. `roleShort` / `companyShort`, recommendation quote), a school or certificate, a hackathon result.
- Profile: edit pitch, About paragraphs (the first one is what phones show before "Read more"), glance rows, availability pill, links; replace the CV PDFs and the photo.
- UI text: where button labels and headings live (`en.ts` / `fr.ts`, same keys in both).
- "Check your edit": `npm test` (what a red test means), `npm run check`, `npm run dev`, and `npm run audit` before a release.

### Tests and verification
- **Unit:** `typesetFrench` / `typeset`; `usedCategories`; `visibleProjects`; priority ranking by `PRIORITY`; `glanceRows` (derived latest role and counts, one/other forms, hand-written rows untouched); media with `phone` in `mediaFiles` / `mediaIssues`; category data: unique keys, non-empty EN/FR labels, well-formed icon paths, 6-digit colours, **tile label contrast ≥ 4.5:1 in both themes for every domain** (existing check, now over `DOMAINS`); skill group ids unique and kebab-case; i18n completeness after the key moves.
- `npm run check`, `npm test`, `npm run lint` clean; `npm run build` OK; `npm run audit`: 0 axe violations, Lighthouse as in M10.
- **No visible change:** Playwright full-page screenshots of `/en/` and `/fr/` at 360px and 1280px, both themes, taken on `master` before the work and on the branch after, compared pixel by pixel; any difference is explained in the review guide or fixed. Plus one check with an injected test phone image (from `tmp/`, never committed) showing phones use it and desktop doesn't.
- **Review guide:** `docs/reviews/milestone-11-review-guide.md`, including a walk-through of the content guide (try one recipe).

## Milestone 12 - Pre-deploy refactor
_Settled during Milestone 12 brainstorming (2026-10-15)._

**Goal.** The first deployable version is content-complete. Before it goes public, review the whole codebase and remove what makes it harder to maintain: duplicated values and drawings, helpers in the wrong module, logic left inside components, dead code. **Invisible, with approved exceptions:** the site must render pixel for pixel as before, except for the two changes listed below. Anything worth worrying about that is not fixed here goes on a tracked watch list, so it is handled in a later milestone.

**Decisions.**
- The overall architecture stays (typed data in `src/lib/data/`, types and pure logic in `src/lib/*.ts`, thin components, two dictionaries). No rewrite, no new dependency.
- **The light palette stays written twice** in `src/app.css` (`:root[data-theme='light']` for the theme the inline script picked, and `@media (prefers-color-scheme: light) :root:not([data-theme])` for visitors without JS): CSS cannot merge an attribute condition and a media query into one selector. A unit test fails if the two blocks ever differ. `light-dark()` was rejected for now: iOS < 17.5 would get an unstyled page (watch list).
- Execution: one milestone PR, one commit per task, each task verified by tests, type check, lint, build **and an automated screenshot comparison** against a baseline taken before any change. An unexplained difference stops the work until its cause is found.

### Approved visible exceptions
1. **Company line on small project cards (desktop):** the `💼` emoji becomes the line briefcase icon the big cards already use (only Goldeneye has a company today).
2. **CV document icon:** one rounded shape (today's Contact tile shape) everywhere; the Hero "View CV" button icon gets its corners slightly rounded. Each place keeps its stroke width and size.

### Tasks
0. **Safety net.** `scripts/screens.ts`, `npm run screens` (saves `reports/screens-baseline/`) and `npm run screens -- --compare` (captures again, compares byte for byte, then pixel by pixel inside Playwright's Chromium (canvas `getImageData`, so no image library is added), prints the differing captures with their changed-pixel count and bounding box, and writes diff images to `reports/screens-diff/`). Captures: `/en/` and `/fr/`, dark and light, at 360, 390, 768, 1280 and 1440px, full page, reduced motion (no reveal, no video), plus 360px with every phone collapsible open. New tracked watch list `docs/backlog.md`.
1. **Dead code and tooling.** Remove `formatPeriod` (only its tests use it; `Period.svelte` renders `periodPoints`) and the unreferenced `static/projects/so_long/so_long_phone.png` (775 KB). `package.json` gets `"engines": { "node": ">=24" }`, plus a `.nvmrc`. `scripts/*.ts` are type-checked by `npm run check`. `scripts/og.ts` imports `LANGS` and the theme colours instead of copying them.
2. **Colours and layout tokens.** `THEME_BG` moves to `src/lib/theme.ts`; `contrastRatio` and `logoColor` move from `skills.ts` to a new `src/lib/color.ts`. Tests: the two light blocks of `app.css` declare the same properties with the same values; `THEME_BG` equals `--bg` in both themes. The per-theme logo colour (today a `:global` dark/light/no-JS rule set repeated in `ContactIcon.svelte` and `Skills.svelte`) becomes one shared `.logo` rule in `app.css`, fed by the same `--logo-dark` / `--logo-light` inline properties. New tokens: `--page-max` (77.5rem) and `--gutter` (2.5rem, 1.25rem on phones), used by Nav, Footer, Section and Hero; `--on-photo-*` for the light text colours of phone photo cards (`ProjectCardLarge.svelte`, today 11 hardcoded values).
3. **Icons.** `ICONS` gains `briefcase`, `medal`, `trophy`, `chevronDown`, `chevronUp`, `arrowDown`, `document`, `mail` and `copy` (elements converted to equivalent path data), drawn by `Icon.svelte` with the caller's stroke width and size. `BriefcaseIcon`, `MedalIcon` and `TrophyIcon` are deleted; the inline SVGs of Hero, Contact, JobItem, Skills and ContactIcon (line icons) use `<Icon>`. Hero's Malt logo uses `ContactIcon` (same colour: the brand red passes `logoColor` on both backgrounds). `ResultMedals` keeps its own two-colour filled drawings.
4. **i18n helpers.** One `localize(value: string | Localized, lang)` in `src/lib/i18n/lang.ts` replaces `localize` (experience) and `skillName` (skills). One `plural(n, { one, other }, lang)` in `src/lib/i18n/format.ts` (Intl plural rules, `{n}` filled) replaces `glance.plural` and `durationLabel`; the `Plural` type lives there too. Dictionary reshapes (same text): `hero.glanceText: { tally, wins, podiums }` replaces `glanceTally` / `glanceWins` / `glancePodiums`; `projects.showMore: { one, other }` replaces `showMore` / `showMoreOne`.
5. **Breakpoints.** New `src/lib/breakpoints.ts` holds `DESKTOP_QUERY` / `PHONE_QUERY` (out of `projects.ts`). A test reads every `.svelte` and `.css` file under `src/` and fails on a `@media` width other than the known ones (48rem phone/desktop, 60rem skills tabs, 24.375rem narrow phones), and checks `DESKTOP_QUERY` uses 48rem, so CSS and JS cannot drift apart.
6. **Logic out of components.** The project grid rule now inside `Projects.svelte` (big cards on desktop vs phone, desktop-only big cards, phone-only small tiles, tiles folded behind "See N other projects", the hidden count) becomes a tested pure `projectLayout(sorted, counts)` in `projects.ts`; the component only renders it. `panelHidden` gets back its desktop and phone cases. A small `hydrated()` helper (`src/lib/hydrated.svelte.ts`) replaces the `ready` + `onMount` pattern copied in About, JobItem, Projects and Skills.
7. **Docs and final checks.** CLAUDE.md, `docs/content-guide.md` and `README.md` follow the moves (new modules, dictionary keys, `npm run screens`). Full `npm run audit`, final review, PR and review guide `docs/reviews/milestone-12-review-guide.md`.

### Watch list (`docs/backlog.md`)
Tracked in the repo (not only in session memory). Each entry says why it matters and the milestone that should handle it. First entries: `PRIORITY` empty so Relevance = Newest (known, Jocelyn handles it); mobile Lighthouse performance 93–94 < 95 (first render); absolute canonical / hreflang / `og:image` URLs (deployment); both languages shipped in each page's JS (66 KB gzipped); 32 MB of project videos in git (decide git, LFS or external hosting before deployment); `light-dark()` once iOS < 17.5 is negligible; the still-valid minors of earlier reviews (each re-checked against the code first). Anything found during this milestone is added.

### Restored tests (removed in 9eec576)
Commit 9eec576 removed about 400 lines of tests and the test-only helpers `mixHex`, `OVERLAY` and `DOMAIN_TILE`, on purpose: many were judged useless or overkill, and too many tests are a cost too. **Rule for this milestone:** a test comes back only if it catches a breakage nobody would see while editing, or that the screenshot comparison cannot see. Restored: the two light palettes identical; `THEME_BG` equals `--bg` (the browser bar colour); every domain colour readable at 4.5:1 on phone tiles (label, body and muted text, both themes) and under the photo-card veil (every `--on-photo-*` text); `sectionInView` / `isAtBottom`; the `panelHidden` desktop and phone cases; `contrastRatio` / `logoColor` (one test each). The colour checks read the values from `app.css` and the component CSS, so no test-only module comes back. Not restored: `sectionNumber`, `longestWordLength`, unique icons, contact icon shapes, and the content rules (summary length, event name length, one wide glance row).

**Also fixed:** `npm run og` fails since Milestone 11 (`profile.ts` imports `$lib/…` at runtime, which plain Node cannot resolve); `scripts/og.ts` loads the data through Vite (`ssrLoadModule`), and the regenerated images must equal the committed ones.

### Tests and verification
- **Unit:** palette blocks identical, `THEME_BG` = `--bg`; known breakpoints only; `localize`; `plural` (EN and FR, 0/1/2); `projectLayout` (fewer projects than the big-card count, exactly 5 and 6, more than 12, empty list); `panelHidden` desktop and phone; `sectionInView` / `isAtBottom`; domain and photo-card contrast; `contrastRatio` / `logoColor`; dictionary completeness after the reshapes.
- `npm test`, `npm run check` (now including `scripts/`), `npm run lint` clean; `npm run build` OK after every task.
- `npm run screens -- --compare` after every task: no difference except the two approved exceptions (only in the captures where they appear).
- `npm run audit` at the end: 0 axe violations, no overflow at 360px, Lighthouse as before (desktop 100; mobile performance unchanged, tracked on the watch list).

## Milestone 13 - Deployment
_Settled during Milestone 13 brainstorming (2026-10-15)._

**Goal.** Put the site online at `https://jocelynrenault.com`, so that only checked code can ever reach it: every PR is tested, `master` is protected, and a merge into `master` deploys automatically. Before the first deploy, mobile Lighthouse performance reaches 95 and the absolute SEO URLs are in place.

**Decisions.**
- **Hosting:** the OVH free hosting that comes with the domain (*Hébergement gratuit*, "start100M"): Apache with `.htaccess`, **100 MB** of disk, FTP access, free Let's Encrypt SSL. It replaces the earlier "home server first" plan. Exact options (FTPS, `mod_rewrite`, `mod_headers`, `mod_deflate`) are confirmed in the OVH docs and on the account during the setup; whatever is missing degrades as written below, never silently.
- **Canonical host:** the bare domain `jocelynrenault.com`; `www` and `http` redirect to it (301).
- **Media stays in git and on OVH** (32 MB of the 33 MB build today). A **80 MB build budget** is enforced by CI and the deploy; external media hosting is reconsidered only when the budget gets close.
- **Deploy is automatic on merge** (GitHub Actions), with a manual `npm run deploy` fallback using the same script.
- **Contact email unchanged:** `jocelynrenaultpro@gmail.com` (the CVs print it). The Zimbra box on the domain is not used by the site.
- **Lighthouse in CI:** accessibility, best-practices and SEO must be 100 and block the merge; performance is reported in the job summary only (CI machines are too noisy to block on it). The ≥ 95 performance target is checked locally (3 consecutive mobile runs) in this milestone.

### Site origin and SEO
- `src/lib/site.ts` exports `SITE_ORIGIN = 'https://jocelynrenault.com'`, the only place the domain is written; absolute URLs are `SITE_ORIGIN` + `base` + path, so a sub-path still works. CLAUDE.md gets the rule.
- `/en/` and `/fr/`: `<link rel="canonical">` to themselves; absolute `hreflang` alternates `en`, `fr` and `x-default` (→ `/`); absolute `og:url` and `og:image` (`og-en.png` / `og-fr.png`).
- A prerendered `sitemap.xml` (both locales, with `xhtml:link` alternates) and a `Sitemap:` line in `robots.txt`.
- `DOMAIN_PENDING_AUDITS` and its handling are removed from `scripts/audit-report.ts`: Lighthouse SEO must be 100.

### 404 page
A prerendered `404.html` at the build root, in the site's style, bilingual (English and French on the same page, since the URL gives no language), with links to `/en/` and `/fr/`, `noindex`. Served by `ErrorDocument 404` with absolute asset URLs, so it works at any depth.

### Server config (`static/.htaccess`)
- **Redirects:** `http` → `https` and `www` → bare domain, one 301 each (`mod_rewrite`).
- **Language on `/`:** a 302 to `/fr/` when `Accept-Language` prefers French, else `/en/`, with `Vary: Accept-Language`. The existing JS redirect page stays as the fallback if the rule does not run.
- **Caching:** `_app/immutable/*` one year, `immutable`; HTML `no-cache`; images, videos, PDFs and fonts outside `_app` one week.
- **Compression:** `mod_deflate` for HTML, CSS, JS, SVG, JSON, XML, text.
- **Security headers:** `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` and `Content-Security-Policy: frame-ancestors 'none'`. **HSTS is not set in this milestone** (hard to undo); it is added to the watch list for once HTTPS has run cleanly.
- Every directive that needs a module sits in `<IfModule>`, so a missing module drops that feature instead of returning 500.
- A unit test checks the language rule names exactly the locales of `lang.ts`.

### Performance (mobile ≥ 95)
Today FCP 2.1 s, LCP 2.9 s (simulated slow 4G, 4× CPU); TBT and CLS fine. Measure first, then try in order, keeping only what helps:
1. Render-blocking CSS (37 + 4 KB): inline it with SvelteKit's `inlineStyleThreshold`.
2. Font: the preloaded file is the one used above the fold; `font-display` and fallback metrics do not delay first paint.
3. The mobile LCP element does not wait on JS or a lazy image.
4. The audit server compresses like Apache, so the local score predicts production.

Done: 3 consecutive local mobile runs ≥ 95, desktop 100, `npm run screens -- --compare` unchanged (any difference shown to Jocelyn for approval). After the first deploy, a PageSpeed Insights run on the real URL goes into the review guide.

### CI (`.github/workflows/ci.yml`)
On every PR to `master` and every push to `master`: Node 24 (`.nvmrc`), `npm ci` (cached), `lint`, `check`, `test`, `build`, the **size budget** (`scripts/budget.ts`: fails over 80 MB and lists the ten largest files), then `npm run audit -- --ci`: axe and the 360px overflow check block; Lighthouse accessibility, best-practices and SEO = 100 block; performance scores go to the job summary. Reports are uploaded as a workflow artifact.

**Branch protection on `master`** (`gh api`): the CI check is required, changes go through PRs, no force-push, no deletion, administrators included; no required approvals (single author).

### Deploy (`.github/workflows/deploy.yml`, `scripts/deploy.ts`)
- Triggered by a successful CI run on `master` (`workflow_run`, checking the run's conclusion and commit) and by hand (`workflow_dispatch`, which runs lint, check, test and the budget first); one at a time (`concurrency`); builds the same commit again and checks the budget.
- `scripts/deploy.ts` (dependency `basic-ftp`, works on Linux and Mac): compares `build/` with the server (size + a manifest of hashes kept on the server), uploads new and changed files with **HTML last**, deletes stale files **at the end**, so no visitor gets a page pointing at a missing asset. FTPS if the hosting accepts it, else plain FTP (noted in `docs/deploy.md`). `--dry-run` prints the plan.
- Secrets `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD` in GitHub, entered by Jocelyn. `npm run deploy` reads the same names from an untracked `.env.deploy`.
- **Smoke check** after upload (`scripts/smoke.ts`): `/en/` and `/fr/` 200 with the right canonical, `/` 302 to a locale, `www` and `http` 301, one hashed asset 200 with the long cache header, an unknown URL 404 with the custom page. A failure turns the job red (GitHub emails).
- **Rollback:** revert the PR; the revert merge deploys the previous state.

### Setup done by Jocelyn (checklist in `docs/deploy.md`)
DNS of the apex and `www` pointing to the hosting; Let's Encrypt SSL turned on; FTP password set; the three GitHub secrets; branch protection applied (Claude can run the `gh api` call). The first real deploy is the merge of the M13 PR, after the review.

### Watch list and docs
- `docs/backlog.md`: remove the English CV entry (done in bc6e2f2), the absolute URLs entry and the mobile performance entry; replace the videos entry with "media in git and on OVH, 80 MB budget enforced; revisit near the limit"; add HSTS. `PRIORITY` stays (Jocelyn's, not blocking).
- `CLAUDE.md`: commands (`deploy`, CI, budget), the site-origin rule, "merging to `master` deploys", branch protection. `docs/content-guide.md`: how changes get published, the size budget. New `docs/deploy.md`: OVH and GitHub setup, manual deploy, rollback.

### Tests and verification
- **Unit:** absolute URL helper (with and without `base`); sitemap content; `.htaccess` locales = `LANGS`; budget (over / under, largest-files list); deploy plan (new, changed, stale files; HTML ordered last; stale deletes last).
- `npm test`, `npm run check`, `npm run lint`, `npm run build` clean; `npm run screens -- --compare` unchanged except approved performance-related differences.
- `npm run audit`: 0 axe violations, no 360px overflow, Lighthouse desktop 100, mobile ≥ 95 three runs in a row, SEO 100 with no pending audits.
- CI green on the M13 PR (it runs the new workflow on itself); `deploy.ts --dry-run` against the real server once the credentials exist; the smoke check after the first deploy.

## Testing
- Vitest: `filterProjects` / counts / sort / tiers / `primaryLink`; project data integrity (unique ids, `YYYY-MM` dates, ≥1 project per context, media files exist); `skillName` and skill data integrity; `formatPeriod` / sorting and experience data integrity; i18n completeness (fr keys == en keys).
- `svelte-check` clean.
- `npm run build` prerenders `/en` and `/fr` without errors; `npm run preview` manual check of theme toggle, language switch, filters.

## Milestones (each gets its own implementation plan, built one at a time)
1. **Foundation** - scaffold (sv create, TS, Vitest), adapter-static, lang routing + redirect, i18n dicts, theme toggle, nav, empty section placeholders.
2. **Projects** - data model, cards, two-group filters, sort, animations, tests.
3. **Hero + About**
4. **Skills**
5. **Experience / Education**
6. **Contact + footer**
7. **Fixes & accessibility** - mobile nav, active-section highlight, a11y, French typography, `/` redirect, deferred review minors, responsive pass, `npm run audit` (axe + Lighthouse).
8. **Layout & media** - compact phone layout (overlay project cards, compact rows, scrollable filters, tighter sections and skill chips, clamped quotes), video and poster media, desktop card hover.
9. **Desktop design** - the new visual identity from the Claude Design canvas on desktop, both themes (see "Milestone 9 - Desktop design"): tokens and font, numbered section grid, hero with the at-a-glance card, restyled projects, skills as tabs, experience, contact with email and Malt blocks, favicon, OG images, per-locale meta, scroll reveal.
10. **Phone design** - the same pass for phones, once the desktop version is settled (see "Milestone 10 - Phone design"): sticky header with a Contact button (no burger), compact hero tiles, folded About, blurred-photo featured cards, domain-tinted project tiles with one-sentence summaries, skills accordion, collapsed recommendations, compact contact.
11. **Content-ready refactor** - see "Milestone 11 - Content-ready refactor": each category (domain, context, skill group) defined in one entry, featured list, hidden projects, optional phone images, derived glance rows, automatic French typography, editing guide `docs/content-guide.md`. No visible change.
12. **Pre-deploy refactor** - see "Milestone 12 - Pre-deploy refactor": shared tokens and icons, helpers in their right module, grid logic tested outside the component, dead code removed, screenshot comparison script, watch list `docs/backlog.md`. Invisible except two approved icon fixes.
13. **Deployment** - see "Milestone 13 - Deployment": OVH free hosting at `jocelynrenault.com`, absolute canonical/hreflang/OG URLs from one site origin, `.htaccess`, 404 page, mobile performance ≥ 95, CI with branch protection, automatic FTP deploy on merge.

## Next steps after approval
1. `git init` in `/home/lezard/portfolio`, save this spec to `docs/superpowers/specs/2026-09-23-portfolio-design.md`, commit.
2. Jocelyn reviews the written spec.
3. Invoke writing-plans for **Milestone 1 only**.
