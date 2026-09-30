# Milestone 3 — Hero + About Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Hero and About placeholders with real content: full name, role, pitch, CTAs (See projects / Download CV / GitHub), optional availability pill, and an About section with a round photo, a 3-paragraph bio and fact chips — in EN and FR.

**Architecture:** Personal content goes in a typed data file `src/lib/data/profile.ts` (`{ en, fr }` fields); UI labels go in the i18n dicts. A pure `assetHref(base, path)` builds sub-path-safe URLs to `static/` files. `Hero.svelte` and `About.svelte` only render; their props are narrowed to the dict slice they use.

**Tech Stack:** SvelteKit + Svelte 5 runes, adapter-static, TypeScript, Vitest, Prettier. `sharp` is used once, from a temp dir, to crop the photo — it is **not** a project dependency.

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section "Hero + About".

## Global Constraints

- Runes only (`$props`, `$state`, `$derived`); no `export let`, no `$:`, no legacy stores.
- No `svelte.config.js`; SvelteKit config lives in `vite.config.ts`.
- UI text only in `src/lib/i18n/en.ts` and `fr.ts`; `fr` is typed `Dict`, so every key exists in both.
- `src/lib/i18n/lang.ts` must not import the dictionaries.
- Content goes in `src/lib/data/` with `{ en, fr }` text fields; components only render it.
- URLs to `static/` files and locale pages are built with `base` from `$app/paths`; never hardcode a leading `/`.
- External links: `target="_blank" rel="noopener noreferrer"`.
- No location is shown anywhere on the site.
- Name everywhere: "Jocelyn Renault". Role: "Software Engineer · Backend & Systems" / "Ingénieur logiciel · Backend & Systèmes".
- `available: false` by default.
- Photo: 480×480 JPEG, EXIF stripped, displayed as a 200px circle.
- Run commands from the worktree root: `/home/lezard/portfolio/.claude/worktrees/milestone-3-hero-about`.

## Review Focus

1. **Site served under a sub-path** (`base = '/portfolio'`): CV and photo URLs must include the base. Pinned by the `assetHref` tests (Task 1). `vite.config.ts` has no base-path hook, so no sub-path build is run.
2. **Narrow phones (360px):** the three CTAs wrap instead of overflowing, the name does not overflow, and the About photo stacks above the text. No automated test; manual check in the review guide (Task 5).
3. **Wrong CV per locale:** `/fr/` must link `cv-fr.pdf`, `/en/` must link `cv-en.pdf`. Pinned by the build grep in Task 5.
4. **A renamed or missing asset** (CV or photo) would give a 404 only in production. Pinned by `profile.spec.ts` (Task 2).
5. **Primary button contrast in both themes:** `--accent` background with `--bg` text. Manual check in the review guide (Task 5).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/paths.ts` (create) | `assetHref(base, path)`: joins `base` and a `static/` path |
| `src/lib/paths.spec.ts` (create) | Unit tests for `assetHref` |
| `src/lib/data/profile.ts` (create) | `Profile` type + `PROFILE` content |
| `src/lib/data/profile.spec.ts` (create) | Data integrity: assets exist, text non-empty, https GitHub |
| `static/photo.jpg`, `static/cv-en.pdf`, `static/cv-fr.pdf` (add) | Assets (already present untracked in the worktree) |
| `.gitignore` (modify) | Ignore Windows `*:Zone.Identifier` files |
| `src/lib/components/icons/GitHubIcon.svelte` (create) | GitHub mark SVG, shared by Hero and ProjectLinks |
| `src/lib/components/projects/ProjectLinks.svelte` (modify) | Use `GitHubIcon` |
| `src/lib/i18n/en.ts`, `fr.ts` (modify) | New `hero` and `about` labels, full-name meta |
| `src/lib/components/sections/Hero.svelte` (rewrite) | Hero rendering |
| `src/lib/components/sections/About.svelte` (rewrite) | About rendering |
| `src/lib/components/Nav.svelte` (modify) | Brand shows `PROFILE.name` |
| `src/routes/[lang=lang]/+page.svelte` (modify) | Pass narrowed props |
| `docs/superpowers/specs/2026-09-23-portfolio-design.md` (modify) | Record two small spec refinements (Task 2) |

---

### Task 1: `assetHref` helper

**Files:**
- Create: `src/lib/paths.ts`
- Test: `src/lib/paths.spec.ts`

**Interfaces:**
- Produces: `assetHref(base: string, path: string): string`, used by Hero (CV) and About (photo).

- [ ] **Step 1: Write the failing test**

`src/lib/paths.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { assetHref } from './paths';

describe('assetHref', () => {
	it('joins an empty base into a root-relative URL', () => {
		expect(assetHref('', 'cv-en.pdf')).toBe('/cv-en.pdf');
	});

	it('prefixes a sub-path base', () => {
		expect(assetHref('/portfolio', 'photo.jpg')).toBe('/portfolio/photo.jpg');
	});

	it('never produces a double slash', () => {
		expect(assetHref('/portfolio/', '/photo.jpg')).toBe('/portfolio/photo.jpg');
		expect(assetHref('', '/photo.jpg')).toBe('/photo.jpg');
	});

	it('keeps nested paths', () => {
		expect(assetHref('/p', 'projects/kayp.png')).toBe('/p/projects/kayp.png');
	});
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run src/lib/paths.spec.ts`
Expected: FAIL, because `./paths` does not exist yet.

- [ ] **Step 3: Implement**

`src/lib/paths.ts`:
```ts
/** Base-aware URL of a file in static/, e.g. assetHref('/portfolio', 'cv-en.pdf') → '/portfolio/cv-en.pdf'. */
export function assetHref(base: string, path: string): string {
	return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run src/lib/paths.spec.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/paths.ts src/lib/paths.spec.ts
git commit -m "feat: add base-aware assetHref helper"
```

---

### Task 2: Profile data and assets

**Files:**
- Create: `src/lib/data/profile.ts`, `src/lib/data/profile.spec.ts`
- Modify: `static/photo.jpg` (crop), `.gitignore`, spec file
- Add: `static/cv-en.pdf`, `static/cv-fr.pdf`, `static/photo.jpg`

**Interfaces:**
- Consumes: `Lang`, `Localized` from `$lib/i18n/lang`.
- Produces:
  ```ts
  export type Fact = { icon: string; text: Localized };
  export type Profile = {
  	name: string; role: Localized; pitch: Localized; bio: Localized[]; facts: Fact[];
  	github: string; cv: Record<Lang, string>; photo: string; available: boolean;
  };
  export const PROFILE: Profile;
  ```

- [ ] **Step 1: Write the failing test**

`src/lib/data/profile.spec.ts`:
```ts
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANGS } from '$lib/i18n/lang';
import { PROFILE } from './profile';

const staticFile = (src: string) => resolve('static', src);

describe('profile data', () => {
	it('has a name', () => {
		expect(PROFILE.name.trim()).not.toBe('');
	});

	it('has non-empty text in both languages', () => {
		const texts = [
			PROFILE.role,
			PROFILE.pitch,
			...PROFILE.bio,
			...PROFILE.facts.map((f) => f.text)
		];
		for (const text of texts)
			for (const lang of LANGS) expect(text[lang].trim(), JSON.stringify(text)).not.toBe('');
	});

	it('has three bio paragraphs and at least one fact with an icon', () => {
		expect(PROFILE.bio).toHaveLength(3);
		expect(PROFILE.facts.length).toBeGreaterThan(0);
		for (const f of PROFILE.facts) expect(f.icon.trim()).not.toBe('');
	});

	it('links GitHub over https', () => {
		expect(PROFILE.github).toMatch(/^https:\/\/github\.com\//);
	});

	it('points the CV of every language and the photo at relative files in static/', () => {
		const paths = [...LANGS.map((l) => PROFILE.cv[l]), PROFILE.photo];
		const bad = paths.filter((p) => p.startsWith('/') || !existsSync(staticFile(p)));
		expect(bad).toEqual([]);
	});

	it('uses a distinct CV file per language', () => {
		expect(PROFILE.cv.en).not.toBe(PROFILE.cv.fr);
	});
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run src/lib/data/profile.spec.ts`
Expected: FAIL, because `./profile` does not exist yet.

- [ ] **Step 3: Write the profile data**

`src/lib/data/profile.ts`:
```ts
import type { Lang, Localized } from '$lib/i18n/lang';

export type Fact = { icon: string; text: Localized };

export type Profile = {
	name: string;
	role: Localized;
	pitch: Localized;
	/** About paragraphs, in order. */
	bio: Localized[];
	facts: Fact[];
	github: string;
	/** Paths relative to static/, resolved with assetHref. */
	cv: Record<Lang, string>;
	photo: string;
	/** Shows the "Available for work" pill in the Hero. */
	available: boolean;
};

export const PROFILE: Profile = {
	name: 'Jocelyn Renault',
	role: {
		en: 'Software Engineer · Backend & Systems',
		fr: 'Ingénieur logiciel · Backend & Systèmes'
	},
	pitch: {
		en: 'I build the invisible part of products: APIs, services, data processing, automation and deployment. My field is backend and low-level — reliability and performance over UI.',
		fr: "Je conçois la partie invisible des produits : APIs, services, traitement de données, automatisation et mise en production. Mon terrain, c'est le backend et le bas niveau — la fiabilité et la performance plutôt que l'interface."
	},
	bio: [
		{
			en: 'I got into programming for the money. I stayed because I found out I love understanding how things work underneath: memory, processes, the network, the machine itself.',
			fr: "Je me suis mis à la programmation pour l'argent. J'y suis resté parce que j'ai découvert que j'adore comprendre comment les choses fonctionnent en dessous : la mémoire, les processus, le réseau, la machine elle-même."
		},
		{
			en: 'I trained at 42 Lyon (RNCP 7 — Expert in computer architecture), then worked as a full-stack developer at Y247 Group and as a machine-learning developer at Sogeti (Capgemini), and won several hackathons along the way.',
			fr: "Je me suis formé à 42 Lyon (RNCP 7 — Expert en architecture informatique), puis j'ai travaillé comme développeur full stack chez Y247 Group et comme développeur machine learning chez Sogeti (Capgemini), en remportant plusieurs hackathons au passage."
		},
		{
			en: 'Today I focus on backend and systems work — APIs, services, Rust, infrastructure — while staying at home with Web3 and AI when a project needs them.',
			fr: "Aujourd'hui je me concentre sur le backend et les systèmes — APIs, services, Rust, infrastructure — tout en restant à l'aise avec le Web3 et l'IA quand un projet en a besoin."
		}
	],
	facts: [
		{ icon: '🎓', text: { en: '42 Lyon (RNCP 7)', fr: '42 Lyon (RNCP 7)' } },
		{ icon: '🗣', text: { en: 'French / English', fr: 'Français / Anglais' } }
	],
	github: 'https://github.com/LezardSC',
	cv: { en: 'cv-en.pdf', fr: 'cv-fr.pdf' },
	photo: 'photo.jpg',
	available: false
};
```

- [ ] **Step 4: Crop the photo** (one time, in a temp dir; never add `sharp` to `package.json`)

Check first: `static/photo.jpg` must currently be 792×616 (`file static/photo.jpg` shows `792x616`). If it is already 480×480, skip this step.

```bash
SHARP_DIR=$(mktemp -d)
npm i --silent --no-save --prefix "$SHARP_DIR" sharp
SHARP_DIR="$SHARP_DIR" node -e "
const sharp = require(process.env.SHARP_DIR + '/node_modules/sharp');
sharp('static/photo.jpg')
  .extract({ left: 170, top: 40, width: 420, height: 420 })
  .resize(480, 480)
  .jpeg({ quality: 82, mozjpeg: true })
  .toBuffer()
  .then((buf) => require('node:fs').writeFileSync('static/photo.jpg', buf))
  .then(() => console.log('ok'));"
file static/photo.jpg
```
Expected: `ok`, and `file` reports `480x480` with no `Exif` mention (sharp drops metadata by default). The crop is centred on Jocelyn; the person at the left edge of the original is out of frame once the circle mask is applied. Open the file and check this visually.

- [ ] **Step 5: Ignore Windows download leftovers**

Append to `.gitignore`, after the `# OS` block's `Thumbs.db` line:
```
*:Zone.Identifier
```

- [ ] **Step 6: Record two spec refinements**

In `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section "Hero + About":
- In the code block, replace the line `  facts: Localized[],      // '42 Lyon (RNCP 7)', 'French / English' | 'Français / Anglais'` with `  facts: { icon: string; text: Localized }[],  // 🎓 '42 Lyon (RNCP 7)', 🗣 'French / English' | 'Français / Anglais'; icon is aria-hidden`.
- Replace `**About** (\`sections/About.svelte\` inside \`Section\`, props \`{ lang, t: Dict['about'] }\`)` with `**About** (\`sections/About.svelte\` inside \`Section\`, props \`{ lang, title, t: Dict['about'] }\`, same pattern as Projects)`.

- [ ] **Step 7: Run the tests and confirm they pass**

Run: `npm test`
Expected: all suites PASS, including 6 new `profile data` tests.

- [ ] **Step 8: Commit**

```bash
git add src/lib/data/profile.ts src/lib/data/profile.spec.ts static/photo.jpg static/cv-en.pdf static/cv-fr.pdf .gitignore docs/superpowers/specs/2026-09-23-portfolio-design.md
git commit -m "feat: add profile content, CVs and cropped photo"
```

---

### Task 3: Hero, labels and nav brand

**Files:**
- Create: `src/lib/components/icons/GitHubIcon.svelte`
- Modify: `src/lib/components/projects/ProjectLinks.svelte`, `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`, `src/lib/components/Nav.svelte`, `src/routes/[lang=lang]/+page.svelte`
- Rewrite: `src/lib/components/sections/Hero.svelte`

**Interfaces:**
- Consumes: `assetHref` (Task 1), `PROFILE` (Task 2).
- Produces:
  - `Dict['hero'] = { available: string; projects: string; cv: string; github: string; newTab: string }`
  - `Dict['about'] = { photoAlt: string }` (used by Task 4)
  - `GitHubIcon` component with prop `size?: number` (default 20)
  - `Hero` props `{ lang: Lang; t: Dict['hero'] }`

- [ ] **Step 1: Update the English dict**

In `src/lib/i18n/en.ts`, replace the `meta` and `hero` blocks with:
```ts
	meta: {
		title: 'Jocelyn Renault — Software Engineer',
		description:
			'Portfolio of Jocelyn Renault, software engineer from 42 School: backend, systems, web, blockchain and AI projects.'
	},
	hero: {
		available: 'Available for work',
		projects: 'See projects',
		cv: 'Download CV',
		github: 'GitHub',
		newTab: '(opens in a new tab)'
	},
	about: {
		photoAlt: 'Photo of Jocelyn Renault'
	},
```

- [ ] **Step 2: Update the French dict**

In `src/lib/i18n/fr.ts`, replace the `meta` and `hero` blocks with:
```ts
	meta: {
		title: 'Jocelyn Renault — Ingénieur logiciel',
		description:
			'Portfolio de Jocelyn Renault, ingénieur logiciel issu de 42 : projets backend, systèmes, web, blockchain et IA.'
	},
	hero: {
		available: 'Disponible',
		projects: 'Voir les projets',
		cv: 'Télécharger le CV',
		github: 'GitHub',
		newTab: '(ouvre un nouvel onglet)'
	},
	about: {
		photoAlt: 'Photo de Jocelyn Renault'
	},
```

- [ ] **Step 3: Run the dict tests**

Run: `npx vitest run src/lib/i18n/dicts.spec.ts`
Expected: PASS (same keys in both, no empty strings).

- [ ] **Step 4: Extract the GitHub icon**

`src/lib/components/icons/GitHubIcon.svelte`:
```svelte
<script lang="ts">
	let { size = 20 }: { size?: number } = $props();
</script>

<svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
	<path
		fill="currentColor"
		d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
	/>
</svg>
```
This is the same path as the existing one in `ProjectLinks.svelte`.

In `ProjectLinks.svelte`, add `import GitHubIcon from '../icons/GitHubIcon.svelte';` to the script and replace the whole repo `<svg>…</svg>` element with `<GitHubIcon />`.

- [ ] **Step 5: Rewrite the Hero**

`src/lib/components/sections/Hero.svelte`:
```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import { assetHref } from '$lib/paths';
	import GitHubIcon from '../icons/GitHubIcon.svelte';

	let { lang, t }: { lang: Lang; t: Dict['hero'] } = $props();
</script>

<section id="hero" class="hero">
	{#if PROFILE.available}
		<p class="available"><span class="dot" aria-hidden="true"></span>{t.available}</p>
	{/if}
	<h1>{PROFILE.name}</h1>
	<p class="role">{PROFILE.role[lang]}</p>
	<p class="pitch">{PROFILE.pitch[lang]}</p>
	<div class="ctas">
		<a class="btn primary" href="#projects">{t.projects}</a>
		<a
			class="btn"
			href={assetHref(base, PROFILE.cv[lang])}
			target="_blank"
			rel="noopener noreferrer"
		>
			{t.cv} <span class="sr-only">{t.newTab}</span>
		</a>
		<a class="btn" href={PROFILE.github} target="_blank" rel="noopener noreferrer">
			<GitHubIcon size={18} />
			{t.github} <span class="sr-only">{t.newTab}</span>
		</a>
	</div>
</section>

<style>
	.hero {
		min-height: 100svh;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 0.75rem;
		text-align: center;
		padding: calc(var(--nav-h) + 2rem) 1rem 2rem;
	}
	h1 {
		font-size: clamp(2.25rem, 8vw, 4.5rem);
		line-height: 1.1;
		margin: 0;
		overflow-wrap: anywhere;
	}
	.role {
		margin: 0;
		font-size: clamp(1.1rem, 3vw, 1.4rem);
		font-weight: 600;
		color: var(--accent);
	}
	.pitch {
		margin: 0.5rem 0 1rem;
		max-width: 60ch;
		color: var(--muted);
		font-size: 1.05rem;
	}
	.available {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		padding: 0.2rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: #2da44e;
	}
	.ctas {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		color: var(--text);
		font-weight: 600;
		text-decoration: none;
		transition:
			border-color 0.15s,
			background-color 0.15s;
	}
	.btn:hover {
		border-color: var(--accent);
	}
	.primary {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--bg);
	}
	.primary:hover {
		background: color-mix(in srgb, var(--accent) 85%, var(--text));
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
```

- [ ] **Step 6: Nav brand uses the profile name**

In `src/lib/components/Nav.svelte`:
- add `import { PROFILE } from '$lib/data/profile';` to the script;
- replace `<a class="brand" href="#hero">{t.hero.name}</a>` with `<a class="brand" href="#hero">{PROFILE.name}</a>`;
- add `white-space: nowrap;` to the `.brand` rule.

- [ ] **Step 7: Pass narrowed props from the page**

In `src/routes/[lang=lang]/+page.svelte`, replace `<Hero {t} />` with `<Hero lang={data.lang} t={t.hero} />`. Leave `<About {t} />` as is for now: About still reads `t.sections` and `t.placeholder`, which both still exist.

- [ ] **Step 8: Confirm nothing else reads the removed keys**

Run: `grep -rn "hero\.name\|hero\.tagline" src`
Expected: no output.

- [ ] **Step 9: Type check, test and format**

Run: `npm run check && npm test && npm run format && npm run lint`
Expected: svelte-check 0 errors and 0 warnings, all tests PASS, and lint clean.

- [ ] **Step 10: Commit**

```bash
git add src/lib/components src/lib/i18n "src/routes/[lang=lang]/+page.svelte"
git commit -m "feat: render hero with role, pitch and CTAs"
```

---

### Task 4: About section

**Files:**
- Rewrite: `src/lib/components/sections/About.svelte`
- Modify: `src/routes/[lang=lang]/+page.svelte`

**Interfaces:**
- Consumes: `assetHref` (Task 1), `PROFILE` (Task 2), `Dict['about']` (Task 3), `Section` (`{ id: SectionId; title: string; children?: Snippet }`).
- Produces: `About` props `{ lang: Lang; title: string; t: Dict['about'] }`.

- [ ] **Step 1: Rewrite About**

`src/lib/components/sections/About.svelte`:
```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import { assetHref } from '$lib/paths';
	import Section from '../Section.svelte';

	let { lang, title, t }: { lang: Lang; title: string; t: Dict['about'] } = $props();
</script>

<Section id="about" {title}>
	<div class="about">
		<img
			class="photo"
			src={assetHref(base, PROFILE.photo)}
			alt={t.photoAlt}
			width="200"
			height="200"
			loading="lazy"
			decoding="async"
		/>
		<div class="text">
			{#each PROFILE.bio as paragraph, i (i)}
				<p>{paragraph[lang]}</p>
			{/each}
			<ul class="facts">
				{#each PROFILE.facts as fact (fact.icon)}
					<li><span aria-hidden="true">{fact.icon}</span> {fact.text[lang]}</li>
				{/each}
			</ul>
		</div>
	</div>
</Section>

<style>
	.about {
		display: grid;
		grid-template-columns: 200px minmax(0, 1fr);
		gap: 2.5rem;
		align-items: start;
	}
	.photo {
		width: 200px;
		height: 200px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--border);
	}
	.text {
		max-width: 65ch;
	}
	p {
		margin: 0 0 1rem;
	}
	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 1.5rem 0 0;
		padding: 0;
		list-style: none;
	}
	.facts li {
		padding: 0.2rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		font-size: 0.9rem;
		color: var(--muted);
	}
	@media (max-width: 40rem) {
		.about {
			grid-template-columns: minmax(0, 1fr);
			justify-items: center;
			gap: 1.5rem;
		}
	}
</style>
```

- [ ] **Step 2: Pass narrowed props from the page**

In `src/routes/[lang=lang]/+page.svelte`, replace `<About {t} />` with:
```svelte
	<About lang={data.lang} title={t.sections.about} t={t.about} />
```

- [ ] **Step 3: Type check, test and format**

Run: `npm run check && npm test && npm run format && npm run lint`
Expected: svelte-check 0 errors and 0 warnings, all tests PASS, and lint clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/sections/About.svelte "src/routes/[lang=lang]/+page.svelte"
git commit -m "feat: render about section with photo, bio and facts"
```

---

### Task 5: Build verification

**Files:** none changed (verification only), unless a check fails.

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: success, with `build/en/index.html` and `build/fr/index.html` written.

- [ ] **Step 2: Check the prerendered HTML and assets**

```bash
ls build/cv-en.pdf build/cv-fr.pdf build/photo.jpg
grep -o 'Jocelyn Renault — Software Engineer' build/en/index.html | head -1
grep -o 'href="[^"]*cv-en\.pdf"' build/en/index.html
grep -o 'href="[^"]*cv-fr\.pdf"' build/fr/index.html
grep -c 'cv-fr\.pdf' build/en/index.html
grep -o 'src="[^"]*photo\.jpg"' build/fr/index.html
grep -c 'Available for work' build/en/index.html
```
Expected:
- the three files are listed;
- the title is found;
- `/en/` links `cv-en.pdf` and `/fr/` links `cv-fr.pdf`;
- `grep -c 'cv-fr\.pdf' build/en/index.html` prints `0`;
- the photo `src` is found;
- `grep -c 'Available for work'` prints `0` (because `available: false`).

- [ ] **Step 3: Full suite**

Run: `npm run check && npm test && npm run lint`
Expected: all clean.

- [ ] **Step 4: Commit any fixes**

Commit only if a check forced a change, with a message that describes the fix.
