# Milestone 5 - Experience & Education Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Experience placeholder with two timelines, one for Experience (Sogeti, Y247 Group, each with a recommendation quote) and one for Education (42 Lyon, CS50 with a certificate link), plus a full-width row of hackathon results, in EN and FR.

**Architecture:** Types and pure helpers (`localize`, `formatPeriod`, `newestFirst`, `hackathonsNewestFirst`, `yearOf`) live in `src/lib/experience.ts`, and content lives in `src/lib/data/experience.ts` (same split as projects and skills). `sections/Experience.svelte` lays out the grid and the hackathon row. `components/experience/JobItem.svelte` and `EducationItem.svelte` render one timeline entry each. UI labels live in the dicts under `experience`.

**Tech Stack:** SvelteKit + Svelte 5 runes, adapter-static, TypeScript, Vitest, Prettier. `Intl.DateTimeFormat` handles month names. There are no new dependencies. Playwright is used from the scratchpad for screenshots only and is **not** a project dependency.

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section "Experience & Education".

## Global Constraints

- Runes only (`$props`, `$state`, `$derived`); no `export let`, no `$:`, no legacy stores.
- No `svelte.config.js`; SvelteKit config lives in `vite.config.ts`.
- UI text only in `src/lib/i18n/en.ts` and `fr.ts`; `fr` is typed `Dict`, so every key exists in both. Content lives in `src/lib/data/` with `{ en, fr }` fields. Components only render.
- `src/lib/i18n/lang.ts` must not import the dictionaries.
- Logic goes in pure functions with unit tests (`*.spec.ts` next to the file).
- No location is shown anywhere on the site (no "Lyon, France" under a job).
- The only link in the section is the CS50 certificate: `target="_blank" rel="noopener noreferrer"`, with a visually hidden "(opens in a new tab)". There are no company logos.
- Quotes are stored with `original: 'fr'`. The FR page shows the original, and the EN page shows the translation followed by a muted "(translated from French)".
- Sorting: jobs and education newest first (an entry with no `end` counts as newest); hackathons newest first by date.
- Grid: two columns at ≥ 900px (`min-width: 56.25rem`), one column below.
- Run commands from the worktree root: `/home/lezard/portfolio/.claude/worktrees/milestone-5-experience`. Run `npm install` once first (the fresh worktree has no `node_modules`).

## Review Focus

1. **Months shifted by a timezone.** `new Date('2025-07')` is parsed as UTC, then formatted in local time, which can print "Jun 2025" for a visitor west of UTC. `formatPeriod` must build dates with `Date.UTC` and format with `timeZone: 'UTC'`. Pinned by a test in Task 1 that formats January and December.
2. **The translation note in the wrong language or on the wrong page.** `/fr/` must show the French quotes with no note, and `/en/` the English quotes with "(translated from French)". Pinned by the build grep in Task 3.
3. **A future open-ended job** (the user adds a job with no `end`). It must read "Present" / "Aujourd'hui" and sort first. Pinned by tests in Task 1.
4. **Medals are unreadable to screen readers.** The emoji is `aria-hidden` and a visually hidden "1st place" / "1re place" carries the meaning. Pinned by the build grep in Task 3.
5. **Narrow phones (360px).** Long FR lines ("Développeur Machine Learning & IA Vision", "Commissariat au Numérique de Défense 2025 · Tri de logs pare-feu pour les armées") wrap instead of overflowing, and the timeline dots stay on the line. Checked with the Playwright screenshots in Task 3 and the manual checklist in Task 4.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/experience.ts` (create) | Types `Job`, `Education`, `Hackathon`, `Quote`, `Medal`; `MEDALS`, `MEDAL_EMOJI`; pure `localize`, `formatPeriod`, `newestFirst`, `hackathonsNewestFirst`, `yearOf` |
| `src/lib/experience.spec.ts` (create) | Unit tests for the helpers |
| `src/lib/data/experience.ts` (create) | `JOBS`, `EDUCATION`, `HACKATHONS` content |
| `src/lib/data/experience.spec.ts` (create) | Data integrity |
| `src/lib/i18n/en.ts`, `fr.ts` (modify) | `experience` labels (keep `placeholder`: Contact still uses it) |
| `src/lib/i18n/dicts.spec.ts` (modify) | Every medal has a place label |
| `src/app.css` (modify) | Global `.sr-only` |
| `src/lib/components/sections/Hero.svelte` (modify) | Drop its local `.sr-only` |
| `src/lib/components/experience/JobItem.svelte` (create) | One job entry, with its quote |
| `src/lib/components/experience/EducationItem.svelte` (create) | One education entry, with an optional certificate link |
| `src/lib/components/sections/Experience.svelte` (rewrite) | Grid, timelines, hackathon row |
| `src/routes/[lang=lang]/+page.svelte` (modify) | Pass `{ lang, title, t }` to Experience |
| `docs/reviews/milestone-5-review-guide.md` (create) | Review checklist |

---

### Task 1: Experience types and pure helpers

**Files:**
- Create: `src/lib/experience.ts`
- Test: `src/lib/experience.spec.ts`

**Interfaces:**
- Consumes: `Lang`, `Localized` from `$lib/i18n/lang`.
- Produces:
  - `type Month = string` ('YYYY-MM'), `type Year = string` ('YYYY')
  - `type Quote = { text: Localized; author: string; role: Localized; original: Lang }`
  - `type Job = { company: string; role: Localized; start: Month; end?: Month; internship: boolean; points: Localized[]; tech: string[]; quote?: Quote }`
  - `type Education = { school: string; title: Localized; start?: Year; end: Year; points: Localized[]; link?: string }`
  - `const MEDALS = [1, 2, 3] as const`, `type Medal = 1 | 2 | 3`, `const MEDAL_EMOJI: Record<Medal, string>`
  - `type Hackathon = { medal: Medal; event: string; date: Month; project?: string | Localized }`
  - `localize(value: string | Localized, lang: Lang): string`
  - `formatPeriod(start: string | undefined, end: string | undefined, lang: Lang, present: string): string`
  - `newestFirst<T extends { start?: string; end?: string }>(items: readonly T[]): T[]`
  - `hackathonsNewestFirst(list: readonly Hackathon[]): Hackathon[]`
  - `yearOf(date: string): string`

- [ ] **Step 1: Write the failing tests**

`src/lib/experience.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
	formatPeriod,
	hackathonsNewestFirst,
	localize,
	newestFirst,
	yearOf,
	type Hackathon
} from './experience';

describe('localize', () => {
	it('returns a plain string as is', () => {
		expect(localize('KAYP', 'fr')).toBe('KAYP');
	});
	it('picks the language of a localized string', () => {
		expect(localize({ en: 'Internship', fr: 'Stage' }, 'fr')).toBe('Stage');
		expect(localize({ en: 'Internship', fr: 'Stage' }, 'en')).toBe('Internship');
	});
});

describe('formatPeriod', () => {
	it('formats a month range in English', () => {
		expect(formatPeriod('2025-07', '2026-01', 'en', 'Present')).toBe('Jul 2025 – Jan 2026');
	});
	it('formats a month range in French', () => {
		expect(formatPeriod('2025-07', '2026-01', 'fr', "Aujourd'hui")).toBe(
			'juil. 2025 – janv. 2026'
		);
	});
	it('keeps January and December in their own year whatever the timezone', () => {
		expect(formatPeriod('2024-01', '2024-12', 'en', 'Present')).toBe('Jan 2024 – Dec 2024');
	});
	it('uses the present label when there is no end', () => {
		expect(formatPeriod('2026-02', undefined, 'en', 'Present')).toBe('Feb 2026 – Present');
		expect(formatPeriod('2026-02', undefined, 'fr', "Aujourd'hui")).toBe(
			"févr. 2026 – Aujourd'hui"
		);
	});
	it('formats a year range', () => {
		expect(formatPeriod('2022', '2026', 'en', 'Present')).toBe('2022 – 2026');
	});
	it('shows the end alone when there is no start or start equals end', () => {
		expect(formatPeriod(undefined, '2024', 'fr', "Aujourd'hui")).toBe('2024');
		expect(formatPeriod('2024', '2024', 'en', 'Present')).toBe('2024');
	});
});

describe('newestFirst', () => {
	it('sorts by end, newest first, with an open end first', () => {
		const items = [
			{ id: 'old', start: '2024-10', end: '2025-04' },
			{ id: 'open', start: '2026-02' },
			{ id: 'recent', start: '2025-07', end: '2026-01' }
		];
		expect(newestFirst(items).map((i) => i.id)).toEqual(['open', 'recent', 'old']);
	});
	it('breaks ties on end with the newest start', () => {
		const items = [
			{ id: 'long', start: '2022', end: '2026' },
			{ id: 'short', start: '2025', end: '2026' }
		];
		expect(newestFirst(items).map((i) => i.id)).toEqual(['short', 'long']);
	});
	it('does not mutate its input', () => {
		const items = [{ end: '2024' }, { end: '2026' }];
		newestFirst(items);
		expect(items.map((i) => i.end)).toEqual(['2024', '2026']);
	});
});

describe('hackathonsNewestFirst', () => {
	it('sorts by date, newest first, ignoring the medal', () => {
		const list: Hackathon[] = [
			{ medal: 1, event: 'A', date: '2024-03' },
			{ medal: 3, event: 'B', date: '2025-11' },
			{ medal: 2, event: 'C', date: '2024-11' }
		];
		expect(hackathonsNewestFirst(list).map((h) => h.event)).toEqual(['B', 'C', 'A']);
	});
});

describe('yearOf', () => {
	it('returns the year of a month or a year', () => {
		expect(yearOf('2025-11')).toBe('2025');
		expect(yearOf('2024')).toBe('2024');
	});
});
```

- [ ] **Step 2: Run the tests to check they fail**

Run: `npx vitest run src/lib/experience.spec.ts`
Expected: FAIL, "Failed to resolve import './experience'".

- [ ] **Step 3: Implement**

`src/lib/experience.ts`:
```ts
import type { Lang, Localized } from '$lib/i18n/lang';

/** 'YYYY-MM' */
export type Month = string;
/** 'YYYY' */
export type Year = string;

export type Quote = {
	text: Localized;
	author: string;
	role: Localized;
	/** Language the quote was written in; the other page marks its text as a translation. */
	original: Lang;
};

export type Job = {
	company: string;
	role: Localized;
	start: Month;
	/** No end = ongoing, shown as "Present". */
	end?: Month;
	internship: boolean;
	points: Localized[];
	tech: string[];
	quote?: Quote;
};

export type Education = {
	school: string;
	title: Localized;
	start?: Year;
	end: Year;
	points: Localized[];
	/** Certificate URL; makes the title a link. */
	link?: string;
};

export const MEDALS = [1, 2, 3] as const;
export type Medal = (typeof MEDALS)[number];
export const MEDAL_EMOJI: Record<Medal, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export type Hackathon = {
	medal: Medal;
	event: string;
	date: Month;
	/** Project name, or a description when it has no name. */
	project?: string | Localized;
};

export function localize(value: string | Localized, lang: Lang): string {
	return typeof value === 'string' ? value : value[lang];
}

/** 'YYYY' stays as is; 'YYYY-MM' becomes "Jul 2025" / "juil. 2025". UTC, so the month never shifts. */
function formatPoint(point: string, lang: Lang): string {
	if (/^\d{4}$/.test(point)) return point;
	const [year, month] = point.split('-').map(Number);
	return new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
		new Date(Date.UTC(year, month - 1))
	);
}

/** "Jul 2025 – Jan 2026", "2022 – 2026", "2024"; a missing end reads as `present`. */
export function formatPeriod(
	start: string | undefined,
	end: string | undefined,
	lang: Lang,
	present: string
): string {
	const to = end === undefined ? present : formatPoint(end, lang);
	if (start === undefined || start === end) return to;
	return `${formatPoint(start, lang)} – ${to}`;
}

/** Newest first: by end (no end = ongoing = newest), then by start. For 'YYYY' or 'YYYY-MM' dates. */
export function newestFirst<T extends { start?: string; end?: string }>(items: readonly T[]): T[] {
	const end = (x: T) => x.end ?? '9999';
	return [...items].sort(
		(a, b) => end(b).localeCompare(end(a)) || (b.start ?? '').localeCompare(a.start ?? '')
	);
}

export function hackathonsNewestFirst(list: readonly Hackathon[]): Hackathon[] {
	return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

export function yearOf(date: string): string {
	return date.slice(0, 4);
}
```

- [ ] **Step 4: Run the tests to check they pass**

Run: `npx vitest run src/lib/experience.spec.ts`, then `TZ=America/Los_Angeles npx vitest run src/lib/experience.spec.ts` (a timezone west of UTC, where a non-UTC implementation would print "Dec 2023 – Nov 2024").
Expected: PASS both times. Then `npm run check` → 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/experience.ts src/lib/experience.spec.ts
git commit -m "feat: add experience types and period/sort helpers"
```

---

### Task 2: Experience content and UI labels

**Files:**
- Create: `src/lib/data/experience.ts`
- Test: `src/lib/data/experience.spec.ts`
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`, `src/lib/i18n/dicts.spec.ts`

**Interfaces:**
- Consumes: types, `MEDALS`, `localize` from `$lib/experience` (Task 1); `LANGS` from `$lib/i18n/lang`.
- Produces:
  - `JOBS: Job[]`, `EDUCATION: Education[]`, `HACKATHONS: Hackathon[]` from `$lib/data/experience`
  - `Dict['experience']` = `{ work: string; education: string; hackathons: string; present: string; internship: string; translated: string; newTab: string; places: Record<Medal, string> }`

- [ ] **Step 1: Write the failing data tests**

`src/lib/data/experience.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { LANGS } from '$lib/i18n/lang';
import { localize, MEDALS } from '$lib/experience';
import { EDUCATION, HACKATHONS, JOBS } from './experience';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const YEAR = /^\d{4}$/;

describe('experience data', () => {
	it('has content in every list', () => {
		expect(JOBS.length).toBeGreaterThan(0);
		expect(EDUCATION.length).toBeGreaterThan(0);
		expect(HACKATHONS.length).toBeGreaterThan(0);
	});

	it('uses YYYY-MM for jobs and hackathons, YYYY for education', () => {
		for (const j of JOBS) {
			expect(j.start, j.company).toMatch(MONTH);
			if (j.end !== undefined) expect(j.end, j.company).toMatch(MONTH);
		}
		for (const e of EDUCATION) {
			if (e.start !== undefined) expect(e.start, e.school).toMatch(YEAR);
			expect(e.end, e.school).toMatch(YEAR);
		}
		for (const h of HACKATHONS) expect(h.date, h.event).toMatch(MONTH);
	});

	it('never ends before it starts', () => {
		for (const j of JOBS) if (j.end) expect(j.start <= j.end, j.company).toBe(true);
		for (const e of EDUCATION) if (e.start) expect(e.start <= e.end, e.school).toBe(true);
	});

	it('gives every job at least one point', () => {
		expect(JOBS.filter((j) => j.points.length === 0).map((j) => j.company)).toEqual([]);
	});

	it('uses medals 1 to 3', () => {
		for (const h of HACKATHONS) expect(MEDALS, h.event).toContain(h.medal);
	});

	it('uses https for every link', () => {
		for (const e of EDUCATION) if (e.link) expect(e.link, e.school).toMatch(/^https:\/\//);
	});

	it('has non-empty text in both languages', () => {
		for (const lang of LANGS) {
			const texts = [
				...JOBS.flatMap((j) => [
					j.company,
					j.role[lang],
					...j.points.map((p) => p[lang]),
					...j.tech,
					...(j.quote ? [j.quote.text[lang], j.quote.author, j.quote.role[lang]] : [])
				]),
				...EDUCATION.flatMap((e) => [e.school, e.title[lang], ...e.points.map((p) => p[lang])]),
				...HACKATHONS.flatMap((h) => [h.event, ...(h.project ? [localize(h.project, lang)] : [])])
			];
			expect(texts.filter((t) => t.trim() === '')).toEqual([]);
		}
	});
});
```

Add to `src/lib/i18n/dicts.spec.ts` (import `MEDALS` from `$lib/experience` at the top):
```ts
	it.each(LANGS)('%s labels every hackathon medal', (lang) => {
		for (const m of MEDALS) expect(dicts[lang].experience.places[m], String(m)).toBeTruthy();
	});
```

- [ ] **Step 2: Run the tests to check they fail**

Run: `npx vitest run src/lib/data/experience.spec.ts src/lib/i18n/dicts.spec.ts`
Expected: FAIL. The data file doesn't resolve, and `dicts[lang].experience` is undefined.

- [ ] **Step 3: Write the content**

`src/lib/data/experience.ts`:
```ts
import type { Education, Hackathon, Job } from '$lib/experience';

/** Work experience. Order here doesn't matter: the page sorts newest first. */
export const JOBS: Job[] = [
	{
		company: 'Sogeti, part of Capgemini',
		role: {
			en: 'Machine Learning & Computer Vision developer',
			fr: 'Développeur Machine Learning & IA Vision'
		},
		start: '2025-07',
		end: '2026-01',
		internship: true,
		points: [
			{
				en: 'Built an automated experimentation workflow that improved a computer-vision model detecting and classifying underwater and satellite images, from training to evaluation.',
				fr: 'Mise en place d’un workflow d’automatisation d’expérimentations qui a amélioré un modèle d’IA de vision détectant et classifiant des images sous-marines et satellites, de l’entraînement à l’évaluation.'
			},
			{ en: 'Wrote a scientific paper.', fr: 'Rédaction d’un article scientifique.' }
		],
		tech: ['PyTorch', 'Python', 'Computer Vision', 'Bash'],
		quote: {
			text: {
				en: 'A very good collaborator, serious and committed. He has a solid grasp of Machine Learning and proposes relevant solutions while staying pragmatic.',
				fr: 'Très bon collaborateur, sérieux et impliqué. Il maîtrise bien les sujets de Machine Learning et sait proposer des solutions pertinentes tout en restant pragmatique.'
			},
			author: 'Herve Nikue',
			role: {
				en: 'R&D Project Manager, Sogeti (internship tutor)',
				fr: 'Chef de projet R&D, Sogeti (tuteur de stage)'
			},
			original: 'fr'
		}
	},
	{
		company: 'Y247 Group',
		role: { en: 'Full Stack developer', fr: 'Développeur Full Stack' },
		start: '2024-10',
		end: '2025-04',
		internship: true,
		points: [
			{
				en: 'Designed and built a web application for a private-sector client, from scratch.',
				fr: 'Conception et développement d’une application web pour un client du secteur privé, en partant de zéro.'
			},
			{
				en: 'Set up the dev environment, designed the database, and built the backend, API routes and authentication.',
				fr: 'Mise en place de l’environnement de développement, architecture de la base de données, développement du backend, des routes API et de l’authentification.'
			},
			{
				en: 'Built the frontend, integrating mock-ups from a designer.',
				fr: 'Développement du frontend avec intégration de maquettes fournies par un designer.'
			}
		],
		tech: ['SvelteKit', 'Node.js', 'Express'],
		quote: {
			text: {
				en: 'He took a full part in developing our platform, on both front-end and back-end. He proved serious, autonomous and committed, quick to grasp technical problems and propose suitable solutions.',
				fr: 'Il a pleinement participé au développement de notre plateforme, aussi bien sur les sujets front-end que back-end. Il s’est montré sérieux, autonome et impliqué, avec une bonne capacité à comprendre rapidement les problématiques techniques et à proposer des solutions adaptées.'
			},
			author: 'Vincent Tamme',
			role: { en: 'President, Y247 Group', fr: 'Président, Y247 Group' },
			original: 'fr'
		}
	}
];

/** Education. Order here doesn't matter: the page sorts newest first. */
export const EDUCATION: Education[] = [
	{
		school: '42 Lyon',
		title: { en: 'Expert in computer architecture', fr: 'Expert en architecture informatique' },
		start: '2022',
		end: '2026',
		points: [
			{
				en: 'RNCP 7: information systems & networks',
				fr: 'RNCP 7 : systèmes d’information et réseaux'
			},
			{
				en: 'RNCP 6: software solutions designer-developer, web & mobile',
				fr: 'RNCP 6 : concepteur développeur de solutions informatiques, web et mobile'
			}
		]
	},
	{
		school: 'Harvard',
		title: {
			en: 'CS50’s Introduction to Computer Science',
			fr: 'CS50’s Introduction to Computer Science'
		},
		end: '2024',
		points: [],
		link: 'https://certificates.cs50.io/b9c16727-3912-4e88-ac47-07ed9a982bc5.pdf?size=letter'
	}
];

/** Hackathon results. Order here doesn't matter: the page sorts newest first. */
export const HACKATHONS: Hackathon[] = [
	{ medal: 1, event: 'Paris Blockchain Week', date: '2024-04', project: 'KAYP' },
	{ medal: 1, event: 'H-W3B Paris', date: '2024-03', project: 'KAYP' },
	{ medal: 2, event: 'H-W3B Super Finale', date: '2024-11', project: 'KAYP' },
	{ medal: 3, event: 'Paris Blockchain Week', date: '2025-04', project: 'Bahapad' },
	{
		medal: 3,
		event: 'Commissariat au Numérique de Défense',
		date: '2025-11',
		project: {
			en: 'Firewall log triage for the armed forces',
			fr: 'Tri de logs pare-feu pour les armées'
		}
	}
];
```

In `src/lib/i18n/en.ts`, add `import type { Medal } from '$lib/experience';` next to the other type imports, and add this block after `projects: { ... },`:
```ts
	experience: {
		work: 'Experience',
		education: 'Education',
		hackathons: 'Hackathons',
		present: 'Present',
		internship: 'Internship',
		translated: '(translated from French)',
		newTab: '(opens in a new tab)',
		places: { 1: '1st place', 2: '2nd place', 3: '3rd place' } satisfies Record<Medal, string>
	},
```

In `src/lib/i18n/fr.ts`, same position:
```ts
	experience: {
		work: 'Expérience',
		education: 'Formation',
		hackathons: 'Hackathons',
		present: 'Aujourd’hui',
		internship: 'Stage',
		translated: '(traduit de l’anglais)',
		newTab: '(s’ouvre dans un nouvel onglet)',
		places: { 1: '1re place', 2: '2e place', 3: '3e place' }
	},
```
(Match the apostrophe style already used in `fr.ts`: check whether it uses `’` or `'` and follow it. Keep `placeholder`, since Contact still uses it.)

- [ ] **Step 4: Run the tests to check they pass**

Run: `npm test`
Expected: every test passes. Then `npm run check` → 0 errors, and `npm run lint` is clean (run `npm run format` first if needed).

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/experience.ts src/lib/data/experience.spec.ts src/lib/i18n/en.ts src/lib/i18n/fr.ts src/lib/i18n/dicts.spec.ts
git commit -m "feat: add experience, education and hackathon content"
```

---

### Task 3: Experience section

**Files:**
- Modify: `src/app.css`, `src/lib/components/sections/Hero.svelte`
- Create: `src/lib/components/experience/JobItem.svelte`, `src/lib/components/experience/EducationItem.svelte`
- Rewrite: `src/lib/components/sections/Experience.svelte`
- Modify: `src/routes/[lang=lang]/+page.svelte`

**Interfaces:**
- Consumes: `JOBS`, `EDUCATION`, `HACKATHONS` (Task 2); `formatPeriod`, `localize`, `newestFirst`, `hackathonsNewestFirst`, `yearOf`, `MEDAL_EMOJI`, `Job`, `Education` (Task 1); `Dict['experience']` (Task 2); `TechTags` from `$lib/components/projects/TechTags.svelte` (existing, props `{ tech: string[] }`); `Section` (existing, props `{ id, title, children }`).
- Produces: `<Experience lang title t />` with `t: Dict['experience']`.

- [ ] **Step 1: Move `.sr-only` to the global stylesheet**

Delete the `.sr-only { ... }` rule at the end of the `<style>` block in `src/lib/components/sections/Hero.svelte`, and append it to `src/app.css`:
```css
/* Visually hidden, still read by screen readers. */
.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	margin: -1px;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
}
```

- [ ] **Step 2: Write `JobItem.svelte`**

`src/lib/components/experience/JobItem.svelte`:
```svelte
<script lang="ts">
	import type { Dict, Lang } from '$lib/i18n';
	import { formatPeriod, type Job } from '$lib/experience';
	import TechTags from '../projects/TechTags.svelte';

	let { job, lang, t }: { job: Job; lang: Lang; t: Dict['experience'] } = $props();

	const period = $derived(
		formatPeriod(job.start, job.end, lang, t.present) + (job.internship ? ` · ${t.internship}` : '')
	);
</script>

<article>
	<p class="period">{period}</p>
	<h4>{job.role[lang]}</h4>
	<p class="org">{job.company}</p>
	<ul class="points">
		{#each job.points as point, i (i)}
			<li>{point[lang]}</li>
		{/each}
	</ul>
	<TechTags tech={job.tech} />
	{#if job.quote}
		<blockquote>
			<p>“{job.quote.text[lang]}”</p>
			<footer>
				- {job.quote.author}, {job.quote.role[lang]}
				{#if job.quote.original !== lang}<span class="note">{t.translated}</span>{/if}
			</footer>
		</blockquote>
	{/if}
</article>

<style>
	.period {
		margin: 0;
		font-size: 0.85rem;
		color: var(--muted);
	}
	h4 {
		margin: 0.15rem 0 0;
		font-size: 1.1rem;
	}
	.org {
		margin: 0 0 0.5rem;
		font-weight: 500;
	}
	.points {
		margin: 0 0 0.75rem;
		padding-left: 1.1rem;
	}
	.points li + li {
		margin-top: 0.25rem;
	}
	blockquote {
		margin: 1rem 0 0;
		padding: 0.25rem 0 0.25rem 1rem;
		border-left: 3px solid var(--accent);
	}
	blockquote p {
		margin: 0;
		font-style: italic;
	}
	footer {
		margin-top: 0.4rem;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.note {
		display: block;
	}
</style>
```

- [ ] **Step 3: Write `EducationItem.svelte`**

`src/lib/components/experience/EducationItem.svelte`:
```svelte
<script lang="ts">
	import type { Dict, Lang } from '$lib/i18n';
	import { formatPeriod, type Education } from '$lib/experience';

	let { item, lang, t }: { item: Education; lang: Lang; t: Dict['experience'] } = $props();
</script>

<article>
	<p class="period">{formatPeriod(item.start, item.end, lang, t.present)}</p>
	<h4>
		{#if item.link}
			<a href={item.link} target="_blank" rel="noopener noreferrer"
				>{item.title[lang]} <span class="sr-only">{t.newTab}</span></a
			>
		{:else}
			{item.title[lang]}
		{/if}
	</h4>
	<p class="org">{item.school}</p>
	{#if item.points.length > 0}
		<ul class="points">
			{#each item.points as point, i (i)}
				<li>{point[lang]}</li>
			{/each}
		</ul>
	{/if}
</article>

<style>
	.period {
		margin: 0;
		font-size: 0.85rem;
		color: var(--muted);
	}
	h4 {
		margin: 0.15rem 0 0;
		font-size: 1.1rem;
	}
	.org {
		margin: 0 0 0.5rem;
		font-weight: 500;
	}
	.points {
		margin: 0;
		padding-left: 1.1rem;
	}
</style>
```

- [ ] **Step 4: Rewrite `Experience.svelte` and update the page**

`src/lib/components/sections/Experience.svelte`:
```svelte
<script lang="ts">
	import { EDUCATION, HACKATHONS, JOBS } from '$lib/data/experience';
	import {
		hackathonsNewestFirst,
		localize,
		MEDAL_EMOJI,
		newestFirst,
		yearOf
	} from '$lib/experience';
	import type { Dict, Lang } from '$lib/i18n';
	import EducationItem from '../experience/EducationItem.svelte';
	import JobItem from '../experience/JobItem.svelte';
	import Section from '../Section.svelte';

	let { lang, title, t }: { lang: Lang; title: string; t: Dict['experience'] } = $props();

	const jobs = newestFirst(JOBS);
	const education = newestFirst(EDUCATION);
	const hackathons = hackathonsNewestFirst(HACKATHONS);
</script>

<Section id="experience" {title}>
	<div class="columns">
		<div>
			<h3 id="experience-work">{t.work}</h3>
			<ol class="timeline" aria-labelledby="experience-work">
				{#each jobs as job (job.company + job.start)}
					<li><JobItem {job} {lang} {t} /></li>
				{/each}
			</ol>
		</div>
		<div>
			<h3 id="experience-education">{t.education}</h3>
			<ol class="timeline" aria-labelledby="experience-education">
				{#each education as item (item.school + item.end)}
					<li><EducationItem {item} {lang} {t} /></li>
				{/each}
			</ol>
		</div>
	</div>

	<h3 id="experience-hackathons">{t.hackathons}</h3>
	<ul class="hackathons" aria-labelledby="experience-hackathons">
		{#each hackathons as h (h.event + h.date)}
			<li>
				<span aria-hidden="true">{MEDAL_EMOJI[h.medal]}</span>
				<span class="sr-only">{t.places[h.medal]}:</span>
				{h.event}
				{yearOf(h.date)}{#if h.project}
					<span class="project">· {localize(h.project, lang)}</span>{/if}
			</li>
		{/each}
	</ul>
</Section>

<style>
	.columns {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 2.5rem;
		margin-bottom: 3rem;
	}
	@media (min-width: 56.25rem) {
		.columns {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 3rem;
		}
	}
	h3 {
		margin: 0 0 1.25rem;
		font-size: 1.3rem;
	}
	.timeline {
		margin: 0;
		padding: 0;
		list-style: none;
		border-left: 2px solid var(--border);
	}
	.timeline > li {
		position: relative;
		padding: 0 0 2rem 1.5rem;
	}
	.timeline > li:last-child {
		padding-bottom: 0;
	}
	/* Dot centred on the 2px line: 12px dot, shifted left by half its width plus half the line. */
	.timeline > li::before {
		content: '';
		position: absolute;
		left: -7px;
		top: 0.35rem;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 3px var(--bg);
	}
	.hackathons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.hackathons li {
		max-width: 100%;
		padding: 0.45rem 0.9rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		font-weight: 500;
	}
	.project {
		color: var(--muted);
		font-weight: 400;
	}
</style>
```
(Pills use `--radius`, not `999px`, so a pill that wraps onto two lines on a phone stays a rounded rectangle instead of a lozenge.)

In `src/routes/[lang=lang]/+page.svelte`, replace `<Experience {t} />` with:
```svelte
	<Experience lang={data.lang} title={t.sections.experience} t={t.experience} />
```

- [ ] **Step 5: Check, build and grep the output**

Run: `npm test && npm run check && npm run lint && npm run build`
Expected: tests pass, 0 errors/warnings, lint clean, build succeeds.

Then pin the Review Focus items in the built HTML:
```bash
grep -c 'translated from French' build/en/index.html      # expect 2
grep -c 'traduit de' build/fr/index.html                 # expect 0
grep -c 'Très bon collaborateur' build/fr/index.html      # expect 1
grep -c 'A very good collaborator' build/en/index.html    # expect 1
grep -o '1st place' build/en/index.html | wc -l           # expect 2
grep -o '1re place' build/fr/index.html | wc -l           # expect 2
grep -c 'Jul 2025 – Jan 2026 · Internship' build/en/index.html   # expect 1
grep -c 'juil. 2025 – janv. 2026 · Stage' build/fr/index.html     # expect 1
grep -c 'Lyon, France' build/en/index.html               # expect 0
```
If a count is off because Svelte split the text with comment nodes (`<!---->`), search for the pieces instead and note that in the report. Don't change the markup just to satisfy grep.

- [ ] **Step 6: Screenshot it**

Following the memory note on Playwright: install `playwright` in the scratchpad (never in the project), run `npx vite preview --port 4179 --strictPort` against the new build, and screenshot `#experience` on `/en/` and `/fr/` in dark and light, at 1280px and 375px. Check:
- two columns at 1280px and one at 375px,
- the dots sit centred on the line,
- quotes are readable in both themes,
- the FR hackathon pills wrap cleanly at 375px with no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`),
- the Hero CTAs still hide their "(opens in a new tab)" text (the `.sr-only` move worked).

Fix anything that looks wrong before committing.

- [ ] **Step 7: Commit**

```bash
git add src/app.css src/lib/components/sections/Hero.svelte src/lib/components/experience src/lib/components/sections/Experience.svelte "src/routes/[lang=lang]/+page.svelte"
git commit -m "feat: render experience and education timelines with hackathon results"
```

---

### Task 4: Review guide and PR

**Files:**
- Create: `docs/reviews/milestone-5-review-guide.md`

**Interfaces:**
- Consumes: everything above.
- Produces: a pushed branch `milestone-5-experience` and an open PR to `master`.

- [ ] **Step 1: Write the review guide**

Follow the structure of `docs/reviews/milestone-4-review-guide.md`: what changed, how to run it, then a checklist. The checklist must include:
- `npm run dev`, open `/en/#experience` and `/fr/#experience`: Experience column (Sogeti first, then Y247 Group), Education column (42 Lyon, then CS50), hackathon row newest first (CND 2025, PBW 2025, H-W3B Super Finale 2024, PBW 2024, H-W3B Paris 2024).
- Period lines read "Jul 2025 – Jan 2026 · Internship" / "juil. 2025 – janv. 2026 · Stage". No location anywhere.
- Quotes: French original with no note on `/fr/`; English translation plus "(translated from French)" on `/en/`. Check that the translations read well to you.
- The CS50 title opens the certificate PDF in a new tab. Nothing else in the section is a link.
- Toggle the theme: dots, line, quote bar and pills are visible in both themes.
- Resize: two columns ≥ 900px, one below. At 360px nothing overflows and the long FR hackathon pill wraps.
- Hero buttons still look the same (the `.sr-only` rule moved to `app.css`).
- Content is yours to edit in `src/lib/data/experience.ts`. A job with no `end` shows "Present" and sorts first.
- Attach the Task 3 screenshots, or say where they are.

- [ ] **Step 2: Commit, push, open the PR**

```bash
git add docs/reviews/milestone-5-review-guide.md
git commit -m "docs: add Milestone 5 review guide"
git push -u origin worktree-milestone-5-experience:milestone-5-experience
gh pr create --base master --head milestone-5-experience --title "Milestone 5: Experience & Education" --body "<summary of the four tasks, link to docs/reviews/milestone-5-review-guide.md, test/check/build results>"
```
Then stop: the user reviews the PR before anything is merged.
