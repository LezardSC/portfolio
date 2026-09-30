# Milestone 2 — Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Projects section: typed project data, Context × Domain chip filters with counts, a Featured/Newest sort, and a two-tier layout (6 large media cards, 2 per row, then small cards, 3 per row), with animations and tests.

**Architecture:** All logic lives in pure, unit-tested functions in `src/lib/projects.ts`: types, filter, sort, counts, tier split and primary link. Content lives in `src/lib/data/projects.ts`, and a data-integrity test guards it. Components in `src/lib/components/projects/` only render. `sections/Projects.svelte` holds the filter/sort `$state` and derives the visible tiers.

**Tech Stack:** Svelte 5 (runes), SvelteKit 2, TypeScript, Vitest 4 (node environment only, so there are no component tests), `svelte/animate` `flip`, `svelte/transition` `fade`, `svelte/motion` `prefersReducedMotion`.

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section "Projects (core feature)" (revised 2026-09-30). Read it together with `CLAUDE.md`.

## Global Constraints

- Runes only: `$props`, `$state`, `$derived`, `$effect`, `$bindable`. No `export let`, no `$:`, no legacy stores.
- `type Context = 'professional' | 'personal' | 'school' | 'hackathon'`; `type Domain = 'web' | 'blockchain' | 'ai' | 'low-level' | 'games'`.
- Filter chips: Context = All, Professional, Personal, School, Hackathon. Domain = All, Web, Blockchain, AI, Low-level, Games. One active chip per group; groups combine with AND; each chip's count is computed against the *other* group's current selection.
- Sort: `featured` (default; projects with `featured` first, ascending, then the rest newest first) | `newest`.
- Tiers: the first **6** results (after filtering and sorting) are large cards, **2 per row** (1 on narrow screens). The rest are small cards, **3 per row** (2, then 1, on narrower screens).
- Links: `links: { repo?: string; demo?: string }`. External links use `target="_blank" rel="noopener noreferrer"`. With no link at all, show a "Private" tag and make nothing clickable.
- Media paths are relative to `static/` with no leading slash (for example `projects/kayp.webp`) and are rendered as `` `${base}/${src}` `` with `base` from `$app/paths`, because the site must work under a sub-path.
- UI strings live only in `src/lib/i18n/en.ts` and `fr.ts`. Project text uses `Localized` (`{ en: string; fr: string }`) in the data file.
- Formatting: run `npm run format` before each commit.
- Every commit message ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A filter combination with zero results** (for example Professional × Games): chips whose count is 0 are disabled unless active, so the UI can't select an empty combination; the empty state and its "Reset filters" button are a safety net that must still render correctly. Pinned by `filterProjects`/`countFor` zero tests (Task 1), the `disabled` rule (Task 5) and a manual check (Task 6).
2. **Fewer than 6 results** (for example School × AI): every result renders large, with no "More projects" divider and no empty small grid. Pinned by the `splitTiers` short-list test (Task 1) and the `{#if tiers.small.length > 0}` guard (Task 5).
3. **A private project with no repo and no demo** (GoldenEye): no `<a>` anywhere on the card, "Private" tag shown. Pinned by the `primaryLink` undefined test (Task 1), the data test that at least one project has no link (Task 2), and a manual check (Task 6).
4. **Deploying under a sub-path, or a media path typo**: a media `src` with a leading slash or a missing file would 404 in production. Pinned by the data-integrity test (Task 2), which requires relative paths that exist in `static/`.
5. **Ties in sort order** (same `featured` value or same month): the order must be deterministic, so cards don't shuffle between renders. Pinned by the tie-break tests (Task 1).

---

## File Map

| File | Responsibility |
|---|---|
| `src/lib/i18n/lang.ts` | + `Localized` type |
| `src/lib/projects.ts` | Types (`Project`, `Context`, `Domain`, `SortKey`, `Filters`), constants (`CONTEXTS`, `DOMAINS`, `SORTS`, `LARGE_COUNT`, `NO_FILTERS`), and the pure functions `filterProjects`, `countFor`, `sortProjects`, `splitTiers`, `primaryLink` |
| `src/lib/projects.spec.ts` | Unit tests for the above |
| `src/lib/data/projects.ts` | `PROJECTS: Project[]`, the content |
| `src/lib/data/projects.spec.ts` | Data-integrity tests |
| `src/lib/i18n/en.ts`, `fr.ts`, `dicts.spec.ts` | + `projects` UI strings and a coverage test |
| `src/lib/components/projects/DomainIcon.svelte` | Inline SVG icon per domain |
| `src/lib/components/projects/ProjectLinks.svelte` | GitHub/demo icon links, or the "Private" tag |
| `src/lib/components/projects/TechTags.svelte` | Tech tag list |
| `src/lib/components/projects/ProjectMedia.svelte` | Image, in-view video, or gradient placeholder; clickable when a primary link exists |
| `src/lib/components/projects/ProjectCardLarge.svelte`, `ProjectCardSmall.svelte` | The two card tiers |
| `src/lib/components/projects/ProjectFilters.svelte` | Chip groups with counts, and the sort select |
| `src/lib/components/sections/Projects.svelte` | State, tiers, grids, empty state, animations |
| `src/routes/[lang=lang]/+page.svelte` | Passes narrowed props to `Projects` |

## Workspace

Execute in a worktree: `.claude/worktrees/milestone-2-projects`, local branch `worktree-milestone-2-projects`, based on local `master`. That base includes the spec revision and this plan. Run `npm install` in the worktree before Task 1. Push with `git push origin worktree-milestone-2-projects:milestone-2-projects`.

---

### Task 1: Project types and pure logic

**Files:**
- Modify: `src/lib/i18n/lang.ts` (append)
- Create: `src/lib/projects.ts`
- Test: `src/lib/projects.spec.ts`

**Interfaces:**
- Consumes: `Lang` from `src/lib/i18n/lang.ts`.
- Produces (all exported from `$lib/projects`):
  - `CONTEXTS`, `Context`, `DOMAINS`, `Domain`, `SORTS`, `SortKey`, `LARGE_COUNT = 6`
  - `type Project = { id; title; description: Localized; date: string; context: Context; domains: Domain[]; tech: string[]; links: { repo?: string; demo?: string }; media?: { kind: 'image' | 'video'; src: string; poster?: string }; award?: Localized; featured?: number }`
  - `type Filters = { context: Context | 'all'; domain: Domain | 'all' }`, `NO_FILTERS: Filters`
  - `filterProjects(list: readonly Project[], filters: Filters): Project[]`
  - `countFor<G extends keyof Filters>(list: readonly Project[], filters: Filters, group: G, value: Filters[G]): number`
  - `sortProjects(list: readonly Project[], sort: SortKey): Project[]` (returns a new array and never mutates)
  - `splitTiers(list: readonly Project[], n?: number): { large: Project[]; small: Project[] }`
  - `primaryLink(p: Project): string | undefined`
  - `Localized` exported from `$lib/i18n/lang` (and so from `$lib/i18n`).

- [ ] **Step 1: Add `Localized` to `src/lib/i18n/lang.ts`**

Append after the `Lang` type (line 2):

```ts
/** Text available in every supported language. */
export type Localized = Record<Lang, string>;
```

- [ ] **Step 2: Write the failing tests** in `src/lib/projects.spec.ts`

```ts
import { describe, expect, it } from 'vitest';
import {
	countFor,
	filterProjects,
	NO_FILTERS,
	primaryLink,
	sortProjects,
	splitTiers,
	type Project
} from './projects';

function make(p: Partial<Project> & Pick<Project, 'id'>): Project {
	return {
		title: p.id,
		description: { en: 'en', fr: 'fr' },
		date: '2024-01',
		context: 'school',
		domains: ['web'],
		tech: ['TS'],
		links: {},
		...p
	};
}

const list: Project[] = [
	make({ id: 'a', context: 'school', domains: ['low-level'], date: '2022-11' }),
	make({ id: 'b', context: 'hackathon', domains: ['web', 'blockchain'], date: '2024-04', featured: 2 }),
	make({ id: 'c', context: 'personal', domains: ['ai'], date: '2026-05', featured: 1 }),
	make({ id: 'd', context: 'school', domains: ['blockchain'], date: '2024-12' }),
	make({ id: 'e', context: 'professional', domains: ['ai'], date: '2025-07' })
];
const ids = (ps: Project[]) => ps.map((p) => p.id);

describe('filterProjects', () => {
	it('returns everything with no filters', () => {
		expect(ids(filterProjects(list, NO_FILTERS))).toEqual(['a', 'b', 'c', 'd', 'e']);
	});
	it('filters by context', () => {
		expect(ids(filterProjects(list, { context: 'school', domain: 'all' }))).toEqual(['a', 'd']);
	});
	it('filters by domain, matching any of a project’s domains', () => {
		expect(ids(filterProjects(list, { context: 'all', domain: 'blockchain' }))).toEqual(['b', 'd']);
	});
	it('combines both groups with AND', () => {
		expect(ids(filterProjects(list, { context: 'school', domain: 'blockchain' }))).toEqual(['d']);
	});
	it('can return nothing', () => {
		expect(filterProjects(list, { context: 'professional', domain: 'games' })).toEqual([]);
	});
});

describe('countFor', () => {
	it('counts a context chip against the current domain', () => {
		const f = { context: 'all', domain: 'ai' } as const;
		expect(countFor(list, f, 'context', 'personal')).toBe(1);
		expect(countFor(list, f, 'context', 'school')).toBe(0);
		expect(countFor(list, f, 'context', 'all')).toBe(2);
	});
	it('counts a domain chip against the current context, ignoring the current domain', () => {
		const f = { context: 'school', domain: 'low-level' } as const;
		expect(countFor(list, f, 'domain', 'blockchain')).toBe(1);
		expect(countFor(list, f, 'domain', 'all')).toBe(2);
	});
});

describe('sortProjects', () => {
	it('newest: date descending', () => {
		expect(ids(sortProjects(list, 'newest'))).toEqual(['c', 'e', 'd', 'b', 'a']);
	});
	it('featured: featured ascending first, then the rest newest first', () => {
		expect(ids(sortProjects(list, 'featured'))).toEqual(['c', 'b', 'e', 'd', 'a']);
	});
	it('breaks ties deterministically by id', () => {
		const tied = [
			make({ id: 'z', date: '2024-01', featured: 1 }),
			make({ id: 'y', date: '2024-01', featured: 1 }),
			make({ id: 'x', date: '2024-01' }),
			make({ id: 'w', date: '2024-01' })
		];
		expect(ids(sortProjects(tied, 'featured'))).toEqual(['y', 'z', 'w', 'x']);
		expect(ids(sortProjects(tied, 'newest'))).toEqual(['w', 'x', 'y', 'z']);
	});
	it('does not mutate its input', () => {
		const copy = [...list];
		sortProjects(list, 'newest');
		expect(list).toEqual(copy);
	});
});

describe('splitTiers', () => {
	it('puts the first 6 in large and the rest in small by default', () => {
		const many = Array.from({ length: 8 }, (_, i) => make({ id: `p${i}` }));
		const { large, small } = splitTiers(many);
		expect(ids(large)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);
		expect(ids(small)).toEqual(['p6', 'p7']);
	});
	it('puts everything in large when there are fewer than n', () => {
		expect(splitTiers(list.slice(0, 3))).toEqual({ large: list.slice(0, 3), small: [] });
	});
	it('handles an empty list', () => {
		expect(splitTiers([])).toEqual({ large: [], small: [] });
	});
});

describe('primaryLink', () => {
	it('prefers the repo', () => {
		expect(primaryLink(make({ id: 'r', links: { repo: 'https://r', demo: 'https://d' } }))).toBe(
			'https://r'
		);
	});
	it('falls back to the demo', () => {
		expect(primaryLink(make({ id: 'd', links: { demo: 'https://d' } }))).toBe('https://d');
	});
	it('is undefined for a private project', () => {
		expect(primaryLink(make({ id: 'p', links: {} }))).toBeUndefined();
	});
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- src/lib/projects.spec.ts`
Expected: FAIL, because `./projects` cannot be resolved.

- [ ] **Step 4: Implement `src/lib/projects.ts`**

```ts
import type { Localized } from '$lib/i18n/lang';

export const CONTEXTS = ['professional', 'personal', 'school', 'hackathon'] as const;
export type Context = (typeof CONTEXTS)[number];

export const DOMAINS = ['web', 'blockchain', 'ai', 'low-level', 'games'] as const;
export type Domain = (typeof DOMAINS)[number];

export const SORTS = ['featured', 'newest'] as const;
export type SortKey = (typeof SORTS)[number];

/** How many results get the large card layout. */
export const LARGE_COUNT = 6;

export type Project = {
	id: string;
	title: string;
	description: Localized;
	/** 'YYYY-MM' */
	date: string;
	context: Context;
	domains: Domain[];
	tech: string[];
	/** Both optional: a private project has neither. */
	links: { repo?: string; demo?: string };
	/** `src`/`poster` are relative to `static/`, without a leading slash. */
	media?: { kind: 'image' | 'video'; src: string; poster?: string };
	award?: Localized;
	/** Lower = earlier in the "Featured" sort. */
	featured?: number;
};

export type Filters = { context: Context | 'all'; domain: Domain | 'all' };
export const NO_FILTERS: Filters = { context: 'all', domain: 'all' };

export function filterProjects(list: readonly Project[], filters: Filters): Project[] {
	return list.filter(
		(p) =>
			(filters.context === 'all' || p.context === filters.context) &&
			(filters.domain === 'all' || p.domains.includes(filters.domain))
	);
}

/** Result count if `group` were set to `value`, keeping the other group as is. */
export function countFor<G extends keyof Filters>(
	list: readonly Project[],
	filters: Filters,
	group: G,
	value: Filters[G]
): number {
	return filterProjects(list, { ...filters, [group]: value } as Filters).length;
}

const byNewest = (a: Project, b: Project) =>
	b.date.localeCompare(a.date) || a.id.localeCompare(b.id);

const byFeatured = (a: Project, b: Project) => {
	const fa = a.featured ?? Infinity;
	const fb = b.featured ?? Infinity;
	return fa === fb ? byNewest(a, b) : fa - fb;
};

export function sortProjects(list: readonly Project[], sort: SortKey): Project[] {
	return [...list].sort(sort === 'featured' ? byFeatured : byNewest);
}

export function splitTiers(
	list: readonly Project[],
	n = LARGE_COUNT
): { large: Project[]; small: Project[] } {
	return { large: list.slice(0, n), small: list.slice(n) };
}

/** Where the media/title link points: the repo, else the demo, else nowhere. */
export function primaryLink(p: Project): string | undefined {
	return p.links.repo ?? p.links.demo;
}
```

Note that the featured tie test expects `['y', 'z', 'w', 'x']`: `y` and `z` share `featured: 1` and the same date, so `id` decides; the unfeatured `w` and `x` come after, also ordered by `id`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- src/lib/projects.spec.ts`
Expected: PASS (all tests in the file).

- [ ] **Step 6: Type check, format and commit**

```bash
npm run check && npm run format
git add src/lib/i18n/lang.ts src/lib/projects.ts src/lib/projects.spec.ts
git commit -m "feat: add project types with filter, sort, count and tier logic

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Project content and data-integrity tests

**Files:**
- Create: `src/lib/data/projects.ts`
- Create: `static/projects/.gitkeep` (empty; the folder for future media)
- Test: `src/lib/data/projects.spec.ts`

**Interfaces:**
- Consumes: `Project`, `CONTEXTS`, `DOMAINS` from `$lib/projects`.
- Produces: `PROJECTS: Project[]` from `$lib/data/projects`.

The descriptions are drafts from the repo READMEs. Jocelyn will edit them later, so implement them exactly as written below.

- [ ] **Step 1: Write the failing tests** in `src/lib/data/projects.spec.ts`

```ts
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONTEXTS, DOMAINS } from '$lib/projects';
import { PROJECTS } from './projects';

const staticFile = (src: string) => resolve('static', src);

describe('project data', () => {
	it('has unique kebab-case ids', () => {
		const ids = PROJECTS.map((p) => p.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});

	it('has YYYY-MM dates with a real month', () => {
		for (const p of PROJECTS) expect(p.date, p.id).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
	});

	it('has non-empty text in both languages', () => {
		for (const p of PROJECTS) {
			expect(p.title.trim(), p.id).not.toBe('');
			for (const text of [p.description, ...(p.award ? [p.award] : [])]) {
				expect(text.en.trim(), p.id).not.toBe('');
				expect(text.fr.trim(), p.id).not.toBe('');
			}
		}
	});

	it('has at least one valid, unique domain and one tech tag per project', () => {
		for (const p of PROJECTS) {
			expect(p.domains.length, p.id).toBeGreaterThan(0);
			expect(new Set(p.domains).size, p.id).toBe(p.domains.length);
			for (const d of p.domains) expect(DOMAINS, p.id).toContain(d);
			expect(p.tech.length, p.id).toBeGreaterThan(0);
		}
	});

	it('has at least one project in every context', () => {
		for (const c of CONTEXTS) expect(PROJECTS.some((p) => p.context === c), c).toBe(true);
	});

	it('has https links only', () => {
		for (const p of PROJECTS)
			for (const url of [p.links.repo, p.links.demo].filter(Boolean))
				expect(url, p.id).toMatch(/^https:\/\//);
	});

	it('includes at least one private project (no links)', () => {
		expect(PROJECTS.some((p) => !p.links.repo && !p.links.demo)).toBe(true);
	});

	it('has unique positive integer featured ranks', () => {
		const ranks = PROJECTS.flatMap((p) => (p.featured === undefined ? [] : [p.featured]));
		expect(new Set(ranks).size).toBe(ranks.length);
		for (const r of ranks) expect(Number.isInteger(r) && r > 0, String(r)).toBe(true);
	});

	it('points media at relative paths that exist in static/', () => {
		for (const p of PROJECTS) {
			if (!p.media) continue;
			for (const src of [p.media.src, ...(p.media.poster ? [p.media.poster] : [])]) {
				expect(src, p.id).not.toMatch(/^\//);
				expect(existsSync(staticFile(src)), `${p.id}: static/${src}`).toBe(true);
			}
		}
	});
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/lib/data/projects.spec.ts`
Expected: FAIL, because `./projects` cannot be resolved.

- [ ] **Step 3: Create `src/lib/data/projects.ts`**

```ts
import type { Project } from '$lib/projects';

const gh = (repo: string) => `https://github.com/LezardSC/${repo}`;

/** Portfolio projects. Order here doesn't matter: the page sorts them. */
export const PROJECTS: Project[] = [
	{
		id: 'kayp-pbw-2024',
		title: 'KAYP',
		description: {
			en: 'Digitalizes maritime trade documents, starting with the bill of lading. The backend exposes DCSA-standard APIs that serialize, encrypt and hash each eBL, then anchor it on the XRP Ledger through smart contracts.',
			fr: 'Numérise les documents du commerce maritime, à commencer par le connaissement. Le backend expose des API au standard DCSA qui sérialisent, chiffrent et hachent chaque eBL, puis l’ancrent sur le XRP Ledger via des smart contracts.'
		},
		date: '2024-04',
		context: 'hackathon',
		domains: ['blockchain', 'web'],
		tech: ['Java', 'Spring Boot', 'Python', 'XRPL'],
		links: { repo: gh('KAYP-backend-PBW2024') },
		award: {
			en: 'Winner — Paris Blockchain Week 2024 (XRPL track)',
			fr: 'Vainqueur — Paris Blockchain Week 2024 (track XRPL)'
		},
		featured: 1
	},
	{
		id: 'kayp-h-web3-paris',
		title: 'KAYP — H-W3B Paris',
		description: {
			en: 'First version of KAYP, built in a weekend: a web app to generate, exchange and store maritime bills of lading, secured and audited on the blockchain.',
			fr: 'Première version de KAYP, construite en un week-end : une application web pour générer, échanger et stocker des connaissements maritimes, sécurisés et audités sur la blockchain.'
		},
		date: '2024-03',
		context: 'hackathon',
		domains: ['blockchain', 'web'],
		tech: ['TypeScript', 'React', 'Tailwind CSS', 'Python'],
		links: { repo: gh('KAYP-H-WEB3PARIS') },
		award: { en: 'Winner — H-W3B Paris 2024', fr: 'Vainqueur — H-W3B Paris 2024' },
		featured: 2
	},
	{
		id: 'ft-transcendence',
		title: 'ft_transcendence',
		description: {
			en: 'Final project of the 42 Common Core: a website for online multiplayer Pong with tournaments, e-mail-verified accounts, 3D rendering, an AI opponent and a blockchain module, in English, French and Spanish.',
			fr: 'Projet final du tronc commun de 42 : un site de Pong multijoueur en ligne avec tournois, comptes vérifiés par e-mail, rendu 3D, IA adverse et module blockchain, en anglais, français et espagnol.'
		},
		date: '2024-08',
		context: 'school',
		domains: ['web', 'games'],
		tech: ['Python', 'JavaScript', 'Bootstrap', 'Docker'],
		links: { repo: gh('42-ft_transcendence') },
		featured: 3
	},
	{
		id: 'microcode',
		title: 'microcode',
		description: {
			en: 'A small autonomous AI agent written from scratch in Python on top of a local Ollama model: raw API calls, tool schemas generated from docstrings, and a ReAct loop that chains web search, scraping, file reading and more.',
			fr: 'Un petit agent IA autonome écrit de zéro en Python sur un modèle Ollama local : appels API bruts, schémas d’outils générés depuis les docstrings et boucle ReAct qui enchaîne recherche web, scraping, lecture de fichiers, etc.'
		},
		date: '2026-05',
		context: 'personal',
		domains: ['ai'],
		tech: ['Python', 'Ollama', 'LLM agents'],
		links: { repo: gh('microcode') },
		featured: 4
	},
	{
		id: 'bahapad',
		title: 'Bahapad',
		description: {
			en: 'A token launchpad for the Bahamut blockchain: a factory contract lets anyone deploy a custom ERC-20 token with its metadata (name, symbol, supply, image, description).',
			fr: 'Un launchpad de tokens pour la blockchain Bahamut : un contrat factory permet à chacun de déployer son propre token ERC-20 avec ses métadonnées (nom, symbole, offre, image, description).'
		},
		date: '2025-04',
		context: 'hackathon',
		domains: ['blockchain'],
		tech: ['Solidity', 'TypeScript', 'Hardhat'],
		links: { repo: gh('Bahapad-Smart-Contract-PBW2025') },
		award: {
			en: '3rd place — Paris Blockchain Week 2025',
			fr: '3e place — Paris Blockchain Week 2025'
		},
		featured: 5
	},
	{
		id: 'goldeneye-data-augmentation',
		title: 'GoldenEye — data augmentation',
		description: {
			en: 'Data augmentation experiments for GoldenEye, a SogetiLabs (Capgemini) computer-vision project, to enlarge and diversify its training datasets.',
			fr: 'Expérimentations d’augmentation de données pour GoldenEye, un projet de vision par ordinateur de SogetiLabs (Capgemini), afin d’enrichir et de diversifier ses jeux d’entraînement.'
		},
		date: '2025-07',
		context: 'professional',
		domains: ['ai'],
		tech: ['Python'],
		links: {},
		featured: 6
	},
	{
		id: 'tokenizart',
		title: 'tokenizArt',
		description: {
			en: 'Girl42, a one-of-a-kind ERC-721 NFT deployed on Ethereum’s Sepolia testnet, with its image and metadata stored on IPFS and a small website to interact with it.',
			fr: 'Girl42, un NFT ERC-721 unique déployé sur le testnet Sepolia d’Ethereum, avec image et métadonnées stockées sur IPFS et un petit site pour interagir avec lui.'
		},
		date: '2024-12',
		context: 'school',
		domains: ['blockchain', 'web'],
		tech: ['Solidity', 'Hardhat', 'IPFS', 'JavaScript'],
		links: { repo: gh('42-tokenizArt') }
	},
	{
		id: 'tokenizer',
		title: 'tokenizer',
		description: {
			en: 'Altarian42, an ERC-20 token meant to modernize 42’s wallet system: capped and burnable supply, with multisignature approval of every reward.',
			fr: 'Altarian42, un token ERC-20 pensé pour moderniser le porte-monnaie de 42 : offre plafonnée et brûlable, avec validation multisignature de chaque récompense.'
		},
		date: '2024-06',
		context: 'school',
		domains: ['blockchain'],
		tech: ['Solidity', 'JavaScript'],
		links: { repo: gh('42-tokenizer') }
	},
	{
		id: 'ft-linear-regression',
		title: 'ft_linear_regression',
		description: {
			en: 'An introduction to machine learning: a linear regression written from scratch, with gradient descent and min–max normalization, predicting a car’s price from its mileage.',
			fr: 'Une introduction au machine learning : une régression linéaire écrite de zéro, avec descente de gradient et normalisation min–max, qui prédit le prix d’une voiture selon son kilométrage.'
		},
		date: '2025-07',
		context: 'school',
		domains: ['ai'],
		tech: ['Python'],
		links: { repo: gh('42-ft_linear_regression') }
	},
	{
		id: 'libasm',
		title: 'libasm',
		description: {
			en: 'Standard C functions (strlen, strcpy, strcmp, write, read, strdup) and linked-list helpers rewritten in x86-64 assembly with NASM, calling syscalls directly.',
			fr: 'Des fonctions C standard (strlen, strcpy, strcmp, write, read, strdup) et des utilitaires de listes chaînées réécrits en assembleur x86-64 avec NASM, en appelant directement les syscalls.'
		},
		date: '2024-06',
		context: 'school',
		domains: ['low-level'],
		tech: ['x86-64 Assembly', 'NASM', 'C'],
		links: { repo: gh('42-libasm') }
	},
	{
		id: 'libft',
		title: 'libft',
		description: {
			en: 'My own C standard library, the first 42 project, validated at 125%, and extended throughout the curriculum with extra functions.',
			fr: 'Ma propre bibliothèque standard C : premier projet de 42, validé à 125 %, puis enrichie de nouvelles fonctions tout au long du cursus.'
		},
		date: '2022-11',
		context: 'school',
		domains: ['low-level'],
		tech: ['C', 'Makefile'],
		links: { repo: gh('42-libft') }
	},
	{
		id: 'ft-printf',
		title: 'ft_printf',
		description: {
			en: 'A re-implementation of printf with variadic arguments, supporting the c, s, p, d, i, u, x and X conversions, packaged as a static library.',
			fr: 'Une réimplémentation de printf avec arguments variadiques, gérant les conversions c, s, p, d, i, u, x et X, livrée sous forme de bibliothèque statique.'
		},
		date: '2022-11',
		context: 'school',
		domains: ['low-level'],
		tech: ['C'],
		links: { repo: gh('42-ft_printf') }
	},
	{
		id: 'get-next-line',
		title: 'get_next_line',
		description: {
			en: 'A function that reads a file descriptor one line at a time, whatever the buffer size: careful buffer handling and memory management in C.',
			fr: 'Une fonction qui lit un descripteur de fichier ligne par ligne, quelle que soit la taille du buffer : gestion rigoureuse des buffers et de la mémoire en C.'
		},
		date: '2022-11',
		context: 'school',
		domains: ['low-level'],
		tech: ['C'],
		links: { repo: gh('42-get_next_line') }
	},
	{
		id: 'confiture-de-jeu',
		title: 'Confiture de Jeu #1',
		description: {
			en: 'A 48-hour game jam in Lyon on the theme “beware of appearances”: a platformer where the hero puts on a mask to reveal hidden platforms.',
			fr: 'Une game jam de 48 h à Lyon sur le thème « méfiez-vous des apparences » : un jeu de plateforme où le héros enfile un masque pour révéler des plateformes cachées.'
		},
		date: '2024-03',
		context: 'hackathon',
		domains: ['games'],
		tech: ['C#', 'Unity'],
		links: { repo: gh('GameJam-Confiture-de-jeu-1') }
	},
	{
		id: 'love-takedown',
		title: 'Love Takedown',
		description: {
			en: 'A game made as a team during a game jam.',
			fr: 'Un jeu réalisé en équipe lors d’une game jam.'
		},
		date: '2024-07',
		context: 'hackathon',
		domains: ['games'],
		tech: ['C#', 'Unity'],
		links: { repo: gh('Love_Takedown') }
	}
];
```

- [ ] **Step 4: Create the media folder**

```bash
mkdir -p static/projects && touch static/projects/.gitkeep
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS (the whole suite, including the M1 tests).

- [ ] **Step 6: Type check, format and commit**

```bash
npm run check && npm run format
git add src/lib/data static/projects/.gitkeep
git commit -m "feat: add project content with data-integrity tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Projects UI strings

**Files:**
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`
- Test: `src/lib/i18n/dicts.spec.ts`

**Interfaces:**
- Consumes: `Context`, `Domain`, `SortKey`, `CONTEXTS`, `DOMAINS`, `SORTS` from `$lib/projects`.
- Produces: `Dict['projects']` with keys `contextLabel`, `domainLabel`, `all`, `contexts: Record<Context, string>`, `domains: Record<Domain, string>`, `sortLabel`, `sort: Record<SortKey, string>`, `empty`, `reset`, `more`, `private`, `repo`, `demo`.

- [ ] **Step 1: Write the failing test.** Append inside the `describe('dictionaries', …)` block in `src/lib/i18n/dicts.spec.ts`, and add `import { CONTEXTS, DOMAINS, SORTS } from '$lib/projects';` to the imports:

```ts
	it.each(LANGS)('%s labels every project context, domain and sort', (lang) => {
		const p = dicts[lang].projects;
		for (const c of CONTEXTS) expect(p.contexts[c], c).toBeTruthy();
		for (const d of DOMAINS) expect(p.domains[d], d).toBeTruthy();
		for (const s of SORTS) expect(p.sort[s], s).toBeTruthy();
	});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/i18n/dicts.spec.ts`
Expected: FAIL with `Cannot read properties of undefined (reading 'contexts')`.

- [ ] **Step 3: Add the strings.** In `src/lib/i18n/en.ts`, add `import type { Context, Domain, SortKey } from '$lib/projects';` under the existing import, and add this block after `placeholder`:

```ts
	projects: {
		contextLabel: 'Context',
		domainLabel: 'Domain',
		all: 'All',
		contexts: {
			professional: 'Professional',
			personal: 'Personal',
			school: 'School',
			hackathon: 'Hackathon'
		} satisfies Record<Context, string>,
		domains: {
			web: 'Web',
			blockchain: 'Blockchain',
			ai: 'AI',
			'low-level': 'Low-level',
			games: 'Games'
		} satisfies Record<Domain, string>,
		sortLabel: 'Sort by',
		sort: { featured: 'Featured', newest: 'Newest' } satisfies Record<SortKey, string>,
		empty: 'No project matches these filters.',
		reset: 'Reset filters',
		more: 'More projects',
		private: 'Private',
		repo: 'Source code on GitHub',
		demo: 'Live demo'
	},
```

In `src/lib/i18n/fr.ts`, add after `placeholder`:

```ts
	projects: {
		contextLabel: 'Contexte',
		domainLabel: 'Domaine',
		all: 'Tous',
		contexts: {
			professional: 'Professionnel',
			personal: 'Personnel',
			school: 'École',
			hackathon: 'Hackathon'
		},
		domains: {
			web: 'Web',
			blockchain: 'Blockchain',
			ai: 'IA',
			'low-level': 'Bas niveau',
			games: 'Jeux'
		},
		sortLabel: 'Trier par',
		sort: { featured: 'À la une', newest: 'Plus récents' },
		empty: 'Aucun projet ne correspond à ces filtres.',
		reset: 'Réinitialiser les filtres',
		more: 'Autres projets',
		private: 'Privé',
		repo: 'Code source sur GitHub',
		demo: 'Démo en ligne'
	},
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, including the existing "fr has exactly the same keys as en" test.

- [ ] **Step 5: Type check, format and commit**

```bash
npm run check && npm run format
git add src/lib/i18n
git commit -m "feat: add EN/FR strings for project filters and cards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Card building blocks (icon, links, tags, media)

**Files:**
- Create: `src/lib/components/projects/DomainIcon.svelte`
- Create: `src/lib/components/projects/ProjectLinks.svelte`
- Create: `src/lib/components/projects/TechTags.svelte`
- Create: `src/lib/components/projects/ProjectMedia.svelte`

**Interfaces:**
- Consumes: `Project`, `Domain`, `primaryLink` from `$lib/projects`; `Dict` from `$lib/i18n`.
- Produces (props):
  - `DomainIcon`: `{ domain: Domain; size?: number }` (default size 32)
  - `ProjectLinks`: `{ project: Project; t: Dict['projects'] }`
  - `TechTags`: `{ tech: string[] }`
  - `ProjectMedia`: `{ project: Project }`

These are presentational components, and the project has no component test setup (Vitest runs in the node environment only). Verification is `npm run check` plus the visual check in Task 6.

- [ ] **Step 1: Create `DomainIcon.svelte`**

```svelte
<script lang="ts">
	import type { Domain } from '$lib/projects';

	let { domain, size = 32 }: { domain: Domain; size?: number } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if domain === 'web'}
		<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
	{:else if domain === 'blockchain'}
		<path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" />
		<path d="M12 22V12M20.66 7L12 12 3.34 7" />
	{:else if domain === 'ai'}
		<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
		<path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
	{:else if domain === 'low-level'}
		<rect x="6" y="6" width="12" height="12" rx="1.5" />
		<path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
	{:else}
		<rect x="2" y="7" width="20" height="11" rx="4" />
		<path d="M7 10.5v4M5 12.5h4" />
		<circle cx="16" cy="11.5" r="0.8" />
		<circle cx="18" cy="13.5" r="0.8" />
	{/if}
</svg>
```

- [ ] **Step 2: Create `ProjectLinks.svelte`**

```svelte
<script lang="ts">
	import type { Dict } from '$lib/i18n';
	import type { Project } from '$lib/projects';

	let { project, t }: { project: Project; t: Dict['projects'] } = $props();
</script>

<div class="links">
	{#if project.links.repo}
		<a
			href={project.links.repo}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="{t.repo}: {project.title}"
			title={t.repo}
		>
			<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
				<path
					fill="currentColor"
					d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
				/>
			</svg>
		</a>
	{/if}
	{#if project.links.demo}
		<a
			href={project.links.demo}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="{t.demo}: {project.title}"
			title={t.demo}
		>
			<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
				<path
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linejoin="round"
					d="M7 4v16l13-8z"
				/>
			</svg>
		</a>
	{/if}
	{#if !project.links.repo && !project.links.demo}
		<span class="private">
			<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
				<g fill="none" stroke="currentColor" stroke-width="2">
					<rect x="5" y="11" width="14" height="10" rx="2" />
					<path d="M8 11V7a4 4 0 0 1 8 0v4" />
				</g>
			</svg>
			{t.private}
		</span>
	{/if}
</div>

<style>
	.links {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	a {
		display: grid;
		place-items: center;
		color: var(--muted);
		transition: color 0.15s;
	}
	a:hover {
		color: var(--accent);
	}
	.private {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.8rem;
		color: var(--muted);
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0.1rem 0.6rem;
	}
</style>
```

- [ ] **Step 3: Create `TechTags.svelte`**

```svelte
<script lang="ts">
	let { tech }: { tech: string[] } = $props();
</script>

<ul>
	{#each tech as tag (tag)}
		<li>{tag}</li>
	{/each}
</ul>

<style>
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.9rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--accent);
	}
</style>
```

- [ ] **Step 4: Create `ProjectMedia.svelte`**

The video only plays while it is at least 25% in view, and it never autoplays when the user prefers reduced motion (the poster, or the first frame, stays visible). The media link is hidden from keyboard and screen readers because `ProjectLinks` already offers the same link. The `aria-label` is harmless, since the link is hidden, and it keeps svelte-check's "link without text" a11y warning quiet.

```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import { prefersReducedMotion } from 'svelte/motion';
	import { primaryLink, type Domain, type Project } from '$lib/projects';

	let { project }: { project: Project } = $props();

	/** Placeholder gradient hue per (first) domain. */
	const HUE: Record<Domain, number> = {
		web: 210,
		blockchain: 265,
		ai: 150,
		'low-level': 25,
		games: 330
	};

	const href = $derived(primaryLink(project));
	const media = $derived(project.media);
	let video = $state<HTMLVideoElement>();

	$effect(() => {
		const v = video;
		if (!v || prefersReducedMotion.current) return;
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) v.play().catch(() => {});
				else v.pause();
			},
			{ threshold: 0.25 }
		);
		io.observe(v);
		return () => {
			io.disconnect();
			v.pause();
		};
	});
</script>

{#snippet content()}
	{#if media?.kind === 'image'}
		<img src="{base}/{media.src}" alt="" loading="lazy" decoding="async" />
	{:else if media?.kind === 'video'}
		<video
			bind:this={video}
			src="{base}/{media.src}"
			poster={media.poster ? `${base}/${media.poster}` : undefined}
			muted
			loop
			playsinline
			preload="metadata"
		></video>
	{:else}
		<div class="placeholder" style:--hue={HUE[project.domains[0]]}>
			<span>{project.title}</span>
		</div>
	{/if}
{/snippet}

{#if href}
	<a
		class="media"
		{href}
		target="_blank"
		rel="noopener noreferrer"
		tabindex="-1"
		aria-hidden="true"
		aria-label={project.title}
	>
		{@render content()}
	</a>
{:else}
	<div class="media">{@render content()}</div>
{/if}

<style>
	.media {
		display: block;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--border);
	}
	img,
	video {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s;
	}
	a.media:hover img,
	a.media:hover video,
	a.media:hover .placeholder {
		transform: scale(1.03);
	}
	.placeholder {
		display: grid;
		place-items: center;
		height: 100%;
		padding: 1rem;
		background: linear-gradient(
			135deg,
			hsl(var(--hue) 65% 45%),
			hsl(calc(var(--hue) + 40) 65% 28%)
		);
		transition: transform 0.3s;
	}
	.placeholder span {
		color: #fff;
		font-size: clamp(1.25rem, 3vw, 2rem);
		font-weight: 700;
		text-align: center;
		text-shadow: 0 2px 12px rgb(0 0 0 / 0.35);
	}
	@media (prefers-reduced-motion: reduce) {
		img,
		video,
		.placeholder {
			transition: none;
		}
		a.media:hover img,
		a.media:hover video,
		a.media:hover .placeholder {
			transform: none;
		}
	}
</style>
```

- [ ] **Step 5: Type check**

Run: `npm run check`
Expected: `0 errors and 0 warnings`. If svelte-check still reports an a11y warning on the hidden media link, fix it in place with the smallest change and don't remove `tabindex="-1"`/`aria-hidden="true"`. Note what you did in the task report.

- [ ] **Step 6: Format and commit**

```bash
npm run format
git add src/lib/components/projects
git commit -m "feat: add project card building blocks (icon, links, tags, media)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Cards, filters and the Projects section

**Files:**
- Create: `src/lib/components/projects/ProjectCardLarge.svelte`
- Create: `src/lib/components/projects/ProjectCardSmall.svelte`
- Create: `src/lib/components/projects/ProjectFilters.svelte`
- Modify: `src/lib/components/sections/Projects.svelte` (full rewrite)
- Modify: `src/routes/[lang=lang]/+page.svelte:30` (the `<Projects {t} />` line)

**Interfaces:**
- Consumes: everything from Tasks 1–4; `Section` (`{ id, title, children }`) from `src/lib/components/Section.svelte`.
- Produces (props):
  - `ProjectCardLarge` / `ProjectCardSmall`: `{ project: Project; lang: Lang; t: Dict['projects'] }`
  - `ProjectFilters`: `{ projects: readonly Project[]; filters: Filters (bindable); sort: SortKey (bindable); t: Dict['projects'] }`
  - `Projects`: `{ lang: Lang; title: string; t: Dict['projects'] }`. This narrows the props from the full `Dict`, per the deferred-backlog item.

- [ ] **Step 1: Create `ProjectCardLarge.svelte`**

```svelte
<script lang="ts">
	import type { Dict, Lang } from '$lib/i18n';
	import type { Project } from '$lib/projects';
	import ProjectLinks from './ProjectLinks.svelte';
	import ProjectMedia from './ProjectMedia.svelte';
	import TechTags from './TechTags.svelte';

	let { project, lang, t }: { project: Project; lang: Lang; t: Dict['projects'] } = $props();
</script>

<article class="card">
	<ProjectMedia {project} />
	<div class="body">
		<p class="meta">{project.date.slice(0, 4)} · {t.contexts[project.context]}</p>
		<h3>{project.title}</h3>
		{#if project.award}
			<p class="award"><span aria-hidden="true">🏆</span> {project.award[lang]}</p>
		{/if}
		<p class="desc">{project.description[lang]}</p>
		<div class="footer">
			<TechTags tech={project.tech} />
			<ProjectLinks {project} {t} />
		</div>
	</div>
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.body {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.5rem;
		padding: 1.25rem 1.5rem 1.5rem;
	}
	.meta {
		margin: 0;
		font-size: 0.85rem;
		color: var(--accent);
	}
	h3 {
		margin: 0;
		font-size: 1.4rem;
	}
	.award {
		align-self: flex-start;
		margin: 0;
		padding: 0.15rem 0.7rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		background: color-mix(in srgb, #e3b341 18%, transparent);
		color: var(--text);
	}
	.desc {
		flex: 1;
		margin: 0;
		color: var(--muted);
	}
	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.5rem;
	}
</style>
```

- [ ] **Step 2: Create `ProjectCardSmall.svelte`**

```svelte
<script lang="ts">
	import type { Dict, Lang } from '$lib/i18n';
	import { primaryLink, type Project } from '$lib/projects';
	import DomainIcon from './DomainIcon.svelte';
	import ProjectLinks from './ProjectLinks.svelte';
	import TechTags from './TechTags.svelte';

	let { project, lang, t }: { project: Project; lang: Lang; t: Dict['projects'] } = $props();

	const href = $derived(primaryLink(project));
</script>

<article class="card">
	<div class="top">
		<span class="icon"><DomainIcon domain={project.domains[0]} /></span>
		<ProjectLinks {project} {t} />
	</div>
	<h3>
		{#if href}
			<a {href} target="_blank" rel="noopener noreferrer">{project.title}</a>
		{:else}
			{project.title}
		{/if}
	</h3>
	<p class="meta">{project.date.slice(0, 4)} · {t.contexts[project.context]}</p>
	{#if project.award}
		<p class="award"><span aria-hidden="true">🏆</span> {project.award[lang]}</p>
	{/if}
	<p class="desc">{project.description[lang]}</p>
	<TechTags tech={project.tech} />
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: 100%;
		padding: 1.5rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}
	.icon {
		color: var(--accent);
	}
	h3 {
		margin: 0;
		font-size: 1.15rem;
	}
	h3 a {
		color: inherit;
		text-decoration: none;
	}
	h3 a:hover {
		color: var(--accent);
	}
	.meta,
	.award {
		margin: 0;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.desc {
		flex: 1;
		margin: 0;
		color: var(--muted);
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
	}
</style>
```

- [ ] **Step 3: Create `ProjectFilters.svelte`**

Zero-count chips are disabled unless they are the active chip, so a visitor can never select an empty combination from a non-empty one. The active chip stays enabled so it can still be seen and changed.

```svelte
<script lang="ts">
	import type { Dict } from '$lib/i18n';
	import {
		CONTEXTS,
		DOMAINS,
		SORTS,
		countFor,
		type Filters,
		type Project,
		type SortKey
	} from '$lib/projects';

	let {
		projects,
		filters = $bindable(),
		sort = $bindable(),
		t
	}: { projects: readonly Project[]; filters: Filters; sort: SortKey; t: Dict['projects'] } =
		$props();

	const contextOptions = ['all', ...CONTEXTS] as const;
	const domainOptions = ['all', ...DOMAINS] as const;
</script>

<div class="filters">
	<div class="group" role="group" aria-labelledby="filter-context-label">
		<span id="filter-context-label" class="label">{t.contextLabel}</span>
		{#each contextOptions as value (value)}
			{@const count = countFor(projects, filters, 'context', value)}
			{@const active = filters.context === value}
			<button
				type="button"
				class="chip"
				aria-pressed={active}
				disabled={count === 0 && !active}
				onclick={() => (filters = { ...filters, context: value })}
			>
				{value === 'all' ? t.all : t.contexts[value]}
				<span class="count">{count}</span>
			</button>
		{/each}
	</div>

	<div class="group" role="group" aria-labelledby="filter-domain-label">
		<span id="filter-domain-label" class="label">{t.domainLabel}</span>
		{#each domainOptions as value (value)}
			{@const count = countFor(projects, filters, 'domain', value)}
			{@const active = filters.domain === value}
			<button
				type="button"
				class="chip"
				aria-pressed={active}
				disabled={count === 0 && !active}
				onclick={() => (filters = { ...filters, domain: value })}
			>
				{value === 'all' ? t.all : t.domains[value]}
				<span class="count">{count}</span>
			</button>
		{/each}
	</div>

	<label class="sort">
		<span class="label">{t.sortLabel}</span>
		<select bind:value={sort}>
			{#each SORTS as s (s)}
				<option value={s}>{t.sort[s]}</option>
			{/each}
		</select>
	</label>
</div>

<style>
	.filters {
		display: grid;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}
	.group {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	.label {
		min-width: 5.5rem;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		transition:
			border-color 0.15s,
			background-color 0.15s;
	}
	.chip:hover:not(:disabled) {
		border-color: var(--accent);
	}
	.chip[aria-pressed='true'] {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 18%, var(--surface));
	}
	.chip:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.count {
		font-size: 0.75rem;
		color: var(--muted);
	}
	.sort {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	select {
		padding: 0.3rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.9rem;
	}
</style>
```

- [ ] **Step 4: Rewrite `src/lib/components/sections/Projects.svelte`**

Items animate in with a fade, and the ones that stay slide into place with `flip`. There is no `out:` transition on purpose: an outgoing card would keep its grid cell during the fade and push the others around. Both durations drop to 0 under reduced motion.

```svelte
<script lang="ts">
	import { flip } from 'svelte/animate';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { PROJECTS } from '$lib/data/projects';
	import type { Dict, Lang } from '$lib/i18n';
	import {
		filterProjects,
		NO_FILTERS,
		sortProjects,
		splitTiers,
		type Filters,
		type SortKey
	} from '$lib/projects';
	import ProjectCardLarge from '../projects/ProjectCardLarge.svelte';
	import ProjectCardSmall from '../projects/ProjectCardSmall.svelte';
	import ProjectFilters from '../projects/ProjectFilters.svelte';
	import Section from '../Section.svelte';

	let { lang, title, t }: { lang: Lang; title: string; t: Dict['projects'] } = $props();

	let filters = $state<Filters>({ ...NO_FILTERS });
	let sort = $state<SortKey>('featured');

	const tiers = $derived(splitTiers(sortProjects(filterProjects(PROJECTS, filters), sort)));
	const ms = $derived(prefersReducedMotion.current ? 0 : 300);
</script>

<Section id="projects" {title}>
	<ProjectFilters projects={PROJECTS} bind:filters bind:sort {t} />

	{#if tiers.large.length === 0}
		<div class="empty">
			<p>{t.empty}</p>
			<button type="button" onclick={() => (filters = { ...NO_FILTERS })}>{t.reset}</button>
		</div>
	{:else}
		<ul class="grid large">
			{#each tiers.large as project (project.id)}
				<li animate:flip={{ duration: ms }} in:fade={{ duration: ms }}>
					<ProjectCardLarge {project} {lang} {t} />
				</li>
			{/each}
		</ul>

		{#if tiers.small.length > 0}
			<p class="divider">{t.more}</p>
			<ul class="grid small">
				{#each tiers.small as project (project.id)}
					<li animate:flip={{ duration: ms }} in:fade={{ duration: ms }}>
						<ProjectCardSmall {project} {lang} {t} />
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</Section>

<style>
	.grid {
		display: grid;
		gap: 1.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.large {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.small {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
	@media (max-width: 64rem) {
		.small {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 48rem) {
		.large,
		.small {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	.divider {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 3rem 0 1.5rem;
		color: var(--muted);
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		border-top: 1px solid var(--border);
	}
	.empty {
		display: grid;
		justify-items: center;
		gap: 1rem;
		padding: 3rem 1rem;
		border: 1px dashed var(--border);
		border-radius: var(--radius);
		color: var(--muted);
	}
	.empty p {
		margin: 0;
	}
	.empty button {
		padding: 0.4rem 1rem;
		border: 1px solid var(--accent);
		border-radius: 999px;
		background: transparent;
		color: var(--accent);
		font: inherit;
		cursor: pointer;
	}
</style>
```

- [ ] **Step 5: Pass narrowed props from the page.** In `src/routes/[lang=lang]/+page.svelte`, replace `<Projects {t} />` with:

```svelte
	<Projects lang={data.lang} title={t.sections.projects} t={t.projects} />
```

- [ ] **Step 6: Type check and test**

Run: `npm run check && npm test`
Expected: `0 errors and 0 warnings`, and all tests PASS.

- [ ] **Step 7: Format and commit**

```bash
npm run format
git add src/lib/components src/routes
git commit -m "feat: render projects with filters, sort and two card tiers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Build and manual verification

**Files:** none (a fix-ups commit only if a check fails)

- [ ] **Step 1: Full automated gate**

Run: `npm run lint && npm run check && npm test && npm run build`
Expected: every command succeeds, and the build prerenders `/en/` and `/fr/`.

- [ ] **Step 2: Prerendered HTML contains the projects**

```bash
grep -c 'class="card' build/en/index.html
grep -o 'Vainqueur — H-W3B Paris 2024' build/fr/index.html | head -1
grep -c 'GoldenEye' build/en/index.html
```
Expected: the first count is at least 15 (it counts 15 cards and possibly other `card` classes), the French award string is found, and GoldenEye appears (count ≥ 1).

- [ ] **Step 3: Manual checks** with `npm run preview` (http://localhost:4173/en/). Record each result in the task report.
  1. Default view: 6 large cards (KAYP first), 2 per row, then a "More projects" divider and 9 small cards, 3 per row.
  2. Click Context "Professional": the GoldenEye card is large, shows a "Private" tag, and has no link anywhere (its media isn't clickable).
  3. Pick "School", then "AI": 1 large card (ft_linear_regression), no divider. Chips with a count of 0 are disabled.
  4. Pick "Hackathon", then try "Games": the counts update against the other group's selection.
  5. Empty state: temporarily initialise `filters` in `Projects.svelte` to `{ context: 'professional', domain: 'games' }`, reload, and check that the "No project matches these filters." message appears, that "Reset filters" brings back all 15 projects, and that the Professional/Games chips show 0. Revert the edit, and confirm with `git diff` that nothing is left.
  6. Sort "Newest": microcode is first, and the cards animate into place.
  7. Media click: a large card's placeholder opens its GitHub repo in a new tab. Tab through a card: focus goes to the GitHub icon, not the media.
  8. Theme toggle and `/fr/`: chips, sort, divider and "Privé" are translated, and both themes are legible.
  9. Narrow the window below 768px: 1 column for both tiers.
  10. With reduced motion enabled in the OS or DevTools, filtering changes the grid instantly.

- [ ] **Step 4: Commit any fixes** found in Steps 1–3 (each with a clear message and the Co-Authored-By line). If nothing needed fixing, there is no commit.
