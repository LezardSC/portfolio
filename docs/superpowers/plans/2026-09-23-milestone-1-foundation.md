# Milestone 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A prerendered bilingual (EN/FR) SvelteKit skeleton with system-aware dark/light theme, a fixed nav with language switch and theme toggle, and empty placeholder sections — ready for Milestone 2 (Projects).

**Architecture:** SvelteKit + `adapter-static`, everything prerendered. One dynamic route `src/routes/[lang=lang]/` generates `/en/` and `/fr/`; `/` picks a language client-side and redirects. UI strings live in typed TS dictionaries (`fr` must match `en`'s shape). Theme is CSS custom properties switched by `data-theme` on `<html>`, set by an inline script before first paint.

**Tech Stack:** Node 24, npm, `sv` 0.17.1 scaffolder, Svelte 5 (runes), SvelteKit 2, `@sveltejs/adapter-static` 3, Vitest 4, Prettier, TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-design.md`

## Global Constraints

- Svelte 5 runes only (`$props`, `$state`, `$derived`) — no `export let`, no legacy stores.
- Fully static: `export const prerender = true` at root; no server runtime, no backend.
- Locales exactly `en` and `fr`; URLs `/en/` and `/fr/` (`trailingSlash = 'always'` so output is `en/index.html`, portable to any host).
- `fr` dictionary is typed as `Dict` (= `typeof en`); a missing key is a type error.
- Theme values exactly `'dark' | 'light'`; `localStorage` key `'theme'`; fallback `prefers-color-scheme`.
- The scaffold puts SvelteKit config inside `vite.config.ts` (`sveltekit({ adapter: adapter() })`) — there is **no** `svelte.config.js`. Do not create one.
- Formatting: run `npm run format` before each commit (tabs, single quotes — scaffold defaults).
- Every commit message ends with a blank line then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **French visitor with regional locale** (`fr-FR`, `fr-CA`, or `['de-DE','fr-FR']`) hitting `/` → lands on `/fr/`; any unsupported language → `/en/`. Pinned by `pickLang` tests (Task 2).
2. **Unknown or wrong-case locale URL** (`/de/`, `/EN/`) → 404, never renders a page with undefined strings. Pinned by matcher tests (Task 2) + preview curl check (Task 5).
3. **`localStorage` unavailable or holding garbage** (private mode throws, value `'blue'`) → theme falls back to system preference, toggle still works without throwing. Pinned by `resolveTheme` tests (Task 4) + try/catch in inline script and toggle.
4. **Switching language while scrolled to a section** (`/en/#projects`) → lands on `/fr/#projects` with `<html lang="fr">`; Ctrl/Cmd-click opens new tab normally. Pinned by `otherLang` test (Task 2) + manual check (Task 5).
5. **JavaScript disabled on `/`** → visitor still sees links to both languages (noscript), not a blank page. Pinned by build-output grep (Task 2).

---

## File Map

| File | Responsibility |
|---|---|
| `src/lib/i18n/lang.ts` | `LANGS`, `Lang`, `isLang`, `pickLang`, `otherLang` — no dictionary imports (keeps `/` and matcher tiny) |
| `src/lib/i18n/en.ts`, `fr.ts` | UI strings; `Dict` type exported from `en.ts` |
| `src/lib/i18n/index.ts` | `dicts: Record<Lang, Dict>`, re-exports |
| `src/lib/sections.ts` | `SECTIONS` id list (nav + page order) |
| `src/lib/theme.ts` | `Theme`, `THEME_KEY`, `resolveTheme`, `nextTheme` |
| `src/params/lang.ts` | Route param matcher |
| `src/hooks.server.ts` | Injects `<html lang>` at prerender |
| `src/app.html` | `%lang%` placeholder + no-flash theme script |
| `src/app.css` | Theme tokens + base styles |
| `src/routes/+layout.ts` / `+layout.svelte` | prerender/trailingSlash; global CSS + favicon |
| `src/routes/+page.svelte` | `/` language redirect |
| `src/routes/[lang=lang]/+page.ts` / `+page.svelte` | Locale page: load dict, compose Nav + sections |
| `src/lib/components/Nav.svelte`, `LangSwitch.svelte`, `ThemeToggle.svelte`, `Section.svelte` | Chrome |
| `src/lib/components/sections/{Hero,About,Projects,Skills,Experience,Contact}.svelte` | Placeholder sections, filled in later milestones |

---

### Task 1: Scaffold the project

**Files:**
- Create: whole scaffold in `/home/lezard/portfolio` (already contains `.git/` and `docs/`)
- Delete: `src/lib/vitest-examples/`, `src/lib/index.ts`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `check`, `lint`, `format`, `test` (`vitest --run`).

- [ ] **Step 1: Scaffold into the existing directory**

```bash
cd /home/lezard/portfolio
npx -y sv@0.17.1 create . --template minimal --types ts \
  --add prettier vitest="usages:unit" sveltekit-adapter="adapter:static" \
  --install npm --no-download-check --no-dir-check
```
Expected: ends with "You're all set!". `docs/` and `.git/` untouched.

- [ ] **Step 2: Remove example code**

```bash
rm -rf src/lib/vitest-examples src/lib/index.ts
```

- [ ] **Step 3: Verify the toolchain**

Run: `npm run check`
Expected: `0 ERRORS 0 WARNINGS`.
(Don't build yet — adapter-static needs `prerender = true`, added in Task 2. `npm test` fails with "No test files found" until Task 2.)

- [ ] **Step 4: Replace README**

`README.md`:
```markdown
# Portfolio

Personal portfolio — SvelteKit (Svelte 5), fully static, EN/FR.

- `npm run dev` — dev server
- `npm test` — unit tests
- `npm run check` — type check
- `npm run build` — static site in `build/`

Design: `docs/superpowers/specs/2026-09-23-portfolio-design.md`
```

- [ ] **Step 5: Commit**

```bash
npm run format
git add -A
git commit -m "chore: scaffold SvelteKit project with static adapter

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Language routing

**Files:**
- Create: `src/lib/i18n/lang.ts`, `src/lib/i18n/lang.spec.ts`, `src/params/lang.ts`, `src/params/lang.spec.ts`, `src/routes/+layout.ts`, `src/hooks.server.ts`, `src/routes/[lang=lang]/+page.ts`, `src/routes/[lang=lang]/+page.svelte`
- Modify: `src/app.html` (`lang` attribute), `src/routes/+page.svelte` (replace)

**Interfaces:**
- Produces (`$lib/i18n/lang`):
  - `LANGS: readonly ['en', 'fr']`, `type Lang = 'en' | 'fr'`
  - `isLang(v: string): v is Lang`
  - `pickLang(prefs: readonly string[]): Lang`
  - `otherLang(lang: Lang): Lang`
- Produces: `[lang=lang]/+page.ts` `load` returns `{ lang: Lang }` (Task 3 extends it with `t`).

- [ ] **Step 1: Write failing tests**

`src/lib/i18n/lang.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { isLang, otherLang, pickLang } from './lang';

describe('isLang', () => {
	it('accepts supported locales', () => {
		expect(isLang('en')).toBe(true);
		expect(isLang('fr')).toBe(true);
	});
	it('rejects anything else, case-sensitively', () => {
		for (const v of ['de', 'EN', 'Fr', '', 'en-US']) expect(isLang(v)).toBe(false);
	});
});

describe('pickLang', () => {
	it('picks fr for any French regional variant', () => {
		expect(pickLang(['fr-FR'])).toBe('fr');
		expect(pickLang(['fr-CA', 'en-US'])).toBe('fr');
		expect(pickLang(['FR'])).toBe('fr');
	});
	it('skips unsupported languages to the first supported one', () => {
		expect(pickLang(['de-DE', 'fr-FR'])).toBe('fr');
		expect(pickLang(['es', 'en-GB', 'fr'])).toBe('en');
	});
	it('falls back to en', () => {
		expect(pickLang(['de-DE', 'ja'])).toBe('en');
		expect(pickLang([])).toBe('en');
	});
});

describe('otherLang', () => {
	it('swaps en and fr', () => {
		expect(otherLang('en')).toBe('fr');
		expect(otherLang('fr')).toBe('en');
	});
});
```

`src/params/lang.spec.ts`:
```ts
import { expect, it } from 'vitest';
import { match } from './lang';

it('matches only en and fr', () => {
	expect(match('en')).toBe(true);
	expect(match('fr')).toBe(true);
	for (const v of ['de', 'EN', 'favicon.svg', '']) expect(match(v)).toBe(false);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./lang"` in both files.

- [ ] **Step 3: Implement `lang.ts` and the matcher**

`src/lib/i18n/lang.ts`:
```ts
export const LANGS = ['en', 'fr'] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(v: string): v is Lang {
	return (LANGS as readonly string[]).includes(v);
}

/** First supported language from the browser's preference list, else 'en'. */
export function pickLang(prefs: readonly string[]): Lang {
	for (const pref of prefs) {
		const base = pref.toLowerCase().split('-')[0];
		if (isLang(base)) return base;
	}
	return 'en';
}

export function otherLang(lang: Lang): Lang {
	return lang === 'en' ? 'fr' : 'en';
}
```

`src/params/lang.ts`:
```ts
import type { ParamMatcher } from '@sveltejs/kit';
import { isLang, type Lang } from '$lib/i18n/lang';

export const match = ((param: string): param is Lang => isLang(param)) satisfies ParamMatcher;
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS (all tests in both files).

- [ ] **Step 5: Wire routes**

`src/routes/+layout.ts`:
```ts
export const prerender = true;
export const trailingSlash = 'always';
```

`src/hooks.server.ts` (runs at prerender time; sets `<html lang>` per page):
```ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = ({ event, resolve }) =>
	resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.params.lang ?? 'en')
	});
```

In `src/app.html`, change `<html lang="en">` to `<html lang="%lang%">`.

`src/routes/[lang=lang]/+page.ts`:
```ts
import { error } from '@sveltejs/kit';
import { isLang } from '$lib/i18n/lang';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => [{ lang: 'en' }, { lang: 'fr' }];

export const load: PageLoad = ({ params }) => {
	if (!isLang(params.lang)) error(404);
	return { lang: params.lang };
};
```

`src/routes/[lang=lang]/+page.svelte` (temporary body, replaced in Task 5):
```svelte
<script lang="ts">
	let { data } = $props();
</script>

<h1>{data.lang}</h1>
```

`src/routes/+page.svelte` (replace entirely):
```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { pickLang } from '$lib/i18n/lang';

	onMount(() => {
		const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
		location.replace(`/${pickLang(prefs)}/`);
	});
</script>

<noscript>
	<p><a href="/en/" hreflang="en">English</a> · <a href="/fr/" hreflang="fr">Français</a></p>
</noscript>
```

- [ ] **Step 6: Verify build output**

Run:
```bash
npm run check && npm run build \
  && ls build/index.html build/en/index.html build/fr/index.html \
  && grep -o '<html lang="[a-z]*"' build/en/index.html build/fr/index.html \
  && grep -c 'href="/fr/"' build/index.html
```
Expected: 0 errors; three files listed; `lang="en"` and `lang="fr"` respectively; count `1` (noscript link present).

- [ ] **Step 7: Commit**

```bash
npm run format
git add -A
git commit -m "feat: add /en and /fr prerendered routes with language redirect

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Translation dictionaries

**Files:**
- Create: `src/lib/sections.ts`, `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`, `src/lib/i18n/index.ts`, `src/lib/i18n/dicts.spec.ts`
- Modify: `src/routes/[lang=lang]/+page.ts`, `src/routes/[lang=lang]/+page.svelte`

**Interfaces:**
- Consumes: `Lang`, `isLang` from `$lib/i18n/lang`.
- Produces:
  - `SECTIONS: readonly ['about','projects','skills','experience','contact']`, `type SectionId` (`$lib/sections`)
  - `type Dict` with keys `meta.{title,description}`, `hero.{name,tagline}`, `nav: Record<SectionId,string>`, `sections: Record<SectionId,string>`, `placeholder`, `theme.{toLight,toDark}`, `langSwitch.{label,short}` (`$lib/i18n`)
  - `dicts: Record<Lang, Dict>` (`$lib/i18n`)
  - page `load` returns `{ lang: Lang; t: Dict }`

- [ ] **Step 1: Write failing test**

`src/lib/i18n/dicts.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { SECTIONS } from '$lib/sections';
import { dicts } from './index';
import { LANGS } from './lang';

function leaves(obj: object, prefix = ''): [string, unknown][] {
	return Object.entries(obj).flatMap(([k, v]) =>
		v !== null && typeof v === 'object' ? leaves(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]
	);
}
const keys = (obj: object) => leaves(obj).map(([k]) => k).sort();

describe('dictionaries', () => {
	it('fr has exactly the same keys as en', () => {
		expect(keys(dicts.fr)).toEqual(keys(dicts.en));
	});

	it.each(LANGS)('%s has no empty strings', (lang) => {
		for (const [key, value] of leaves(dicts[lang])) {
			expect(typeof value, key).toBe('string');
			expect((value as string).trim(), key).not.toBe('');
		}
	});

	it.each(LANGS)('%s has a nav label and title for every section', (lang) => {
		for (const id of SECTIONS) {
			expect(dicts[lang].nav[id]).toBeTruthy();
			expect(dicts[lang].sections[id]).toBeTruthy();
		}
	});
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — cannot resolve `$lib/sections` / `./index`.

- [ ] **Step 3: Implement**

`src/lib/sections.ts`:
```ts
/** Page sections after the hero, in display and nav order. */
export const SECTIONS = ['about', 'projects', 'skills', 'experience', 'contact'] as const;
export type SectionId = (typeof SECTIONS)[number];
```

`src/lib/i18n/en.ts`:
```ts
import type { SectionId } from '$lib/sections';

export const en = {
	meta: {
		title: 'Jocelyn — Software Engineer',
		description:
			'Portfolio of Jocelyn, software engineer from 42 School: systems, web, blockchain and AI projects.'
	},
	hero: {
		name: 'Jocelyn',
		tagline: 'Software engineer — systems, web, blockchain & AI.'
	},
	nav: {
		about: 'About',
		projects: 'Projects',
		skills: 'Skills',
		experience: 'Experience',
		contact: 'Contact'
	} satisfies Record<SectionId, string>,
	sections: {
		about: 'About me',
		projects: 'Projects',
		skills: 'Skills',
		experience: 'Experience & Education',
		contact: 'Contact'
	} satisfies Record<SectionId, string>,
	placeholder: 'Coming soon.',
	theme: {
		toLight: 'Switch to light theme',
		toDark: 'Switch to dark theme'
	},
	langSwitch: {
		label: 'Version française',
		short: 'FR'
	}
};

export type Dict = typeof en;
```

`src/lib/i18n/fr.ts`:
```ts
import type { Dict } from './en';

export const fr: Dict = {
	meta: {
		title: 'Jocelyn — Ingénieur logiciel',
		description:
			'Portfolio de Jocelyn, ingénieur logiciel issu de 42 : projets systèmes, web, blockchain et IA.'
	},
	hero: {
		name: 'Jocelyn',
		tagline: 'Ingénieur logiciel — systèmes, web, blockchain & IA.'
	},
	nav: {
		about: 'À propos',
		projects: 'Projets',
		skills: 'Compétences',
		experience: 'Parcours',
		contact: 'Contact'
	},
	sections: {
		about: 'À propos de moi',
		projects: 'Projets',
		skills: 'Compétences',
		experience: 'Expérience & Formation',
		contact: 'Contact'
	},
	placeholder: 'Bientôt disponible.',
	theme: {
		toLight: 'Passer au thème clair',
		toDark: 'Passer au thème sombre'
	},
	langSwitch: {
		label: 'English version',
		short: 'EN'
	}
};
```

`src/lib/i18n/index.ts`:
```ts
import { en, type Dict } from './en';
import { fr } from './fr';
import type { Lang } from './lang';

export type { Dict };
export * from './lang';

export const dicts: Record<Lang, Dict> = { en, fr };
```

Update `src/routes/[lang=lang]/+page.ts` load:
```ts
import { error } from '@sveltejs/kit';
import { dicts, isLang } from '$lib/i18n';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => [{ lang: 'en' }, { lang: 'fr' }];

export const load: PageLoad = ({ params }) => {
	if (!isLang(params.lang)) error(404);
	return { lang: params.lang, t: dicts[params.lang] };
};
```

Update `src/routes/[lang=lang]/+page.svelte` (still temporary body; head is final):
```svelte
<script lang="ts">
	let { data } = $props();
	const t = $derived(data.t);
</script>

<svelte:head>
	<title>{t.meta.title}</title>
	<meta name="description" content={t.meta.description} />
	<link rel="alternate" hreflang="en" href="/en/" />
	<link rel="alternate" hreflang="fr" href="/fr/" />
</svelte:head>

<h1>{t.hero.name}</h1>
<p>{t.hero.tagline}</p>
```

- [ ] **Step 4: Run tests + checks**

Run: `npm test && npm run check && npm run build && grep -o '<title>[^<]*' build/fr/index.html`
Expected: all tests PASS; 0 errors; `<title>Jocelyn — Ingénieur logiciel`.

- [ ] **Step 5: Commit**

```bash
npm run format
git add -A
git commit -m "feat: add typed EN/FR dictionaries

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Theme tokens and no-flash theme

**Files:**
- Create: `src/lib/theme.ts`, `src/lib/theme.spec.ts`, `src/app.css`
- Modify: `src/app.html` (inline script), `src/routes/+layout.svelte` (import CSS)

**Interfaces:**
- Produces (`$lib/theme`): `type Theme = 'dark' | 'light'`, `THEME_KEY = 'theme'`, `resolveTheme(stored: string | null, prefersDark: boolean): Theme`, `nextTheme(t: Theme): Theme`.
- Produces CSS tokens on `:root`: `--bg`, `--surface`, `--text`, `--muted`, `--accent`, `--border`, `--nav-h`.

- [ ] **Step 1: Write failing test**

`src/lib/theme.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { nextTheme, resolveTheme } from './theme';

describe('resolveTheme', () => {
	it('uses a valid stored choice over the system preference', () => {
		expect(resolveTheme('light', true)).toBe('light');
		expect(resolveTheme('dark', false)).toBe('dark');
	});
	it('falls back to the system preference when nothing valid is stored', () => {
		expect(resolveTheme(null, true)).toBe('dark');
		expect(resolveTheme(null, false)).toBe('light');
		expect(resolveTheme('blue', true)).toBe('dark');
		expect(resolveTheme('', false)).toBe('light');
	});
});

describe('nextTheme', () => {
	it('toggles', () => {
		expect(nextTheme('dark')).toBe('light');
		expect(nextTheme('light')).toBe('dark');
	});
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — cannot resolve `./theme`.

- [ ] **Step 3: Implement `theme.ts`**

```ts
export type Theme = 'dark' | 'light';
export const THEME_KEY = 'theme';

/** Keep in sync with the inline script in src/app.html. */
export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
	if (stored === 'dark' || stored === 'light') return stored;
	return prefersDark ? 'dark' : 'light';
}

export function nextTheme(t: Theme): Theme {
	return t === 'dark' ? 'light' : 'dark';
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Inline no-flash script**

In `src/app.html`, insert as the first child of `<head>` (it cannot import modules, so it duplicates `resolveTheme`):
```html
<script>
	(function () {
		var s = null;
		try {
			s = localStorage.getItem('theme');
		} catch (e) {}
		var t =
			s === 'dark' || s === 'light'
				? s
				: matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light';
		document.documentElement.dataset.theme = t;
	})();
</script>
```

- [ ] **Step 6: Global CSS**

`src/app.css`:
```css
:root {
	--nav-h: 3.5rem;
	--radius: 0.75rem;
	--font: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	color-scheme: dark;
	--bg: #0d1117;
	--surface: #161b22;
	--text: #e6edf3;
	--muted: #8b949e;
	--accent: #58a6ff;
	--border: #30363d;
}

:root[data-theme='light'] {
	color-scheme: light;
	--bg: #ffffff;
	--surface: #f6f8fa;
	--text: #1f2328;
	--muted: #59636e;
	--accent: #0969da;
	--border: #d1d9e0;
}

*,
*::before,
*::after {
	box-sizing: border-box;
}

html {
	scroll-behavior: smooth;
	scroll-padding-top: var(--nav-h);
}

@media (prefers-reduced-motion: reduce) {
	html {
		scroll-behavior: auto;
	}
}

body {
	margin: 0;
	font-family: var(--font);
	line-height: 1.6;
	background: var(--bg);
	color: var(--text);
	transition:
		background-color 0.2s,
		color 0.2s;
}

a {
	color: var(--accent);
}

:focus-visible {
	outline: 2px solid var(--accent);
	outline-offset: 2px;
}
```

`src/routes/+layout.svelte` — add the import at the top of the `<script>`:
```svelte
<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
```

- [ ] **Step 7: Verify**

Run: `npm run check && npm run build && grep -c "localStorage.getItem('theme')" build/en/index.html`
Expected: 0 errors; count `1`.
Manual: `npm run preview`, open `http://localhost:4173/en/`, switch OS/devtools "prefers-color-scheme" (DevTools → Rendering) → background flips between dark and light.

- [ ] **Step 8: Commit**

```bash
npm run format
git add -A
git commit -m "feat: add dark/light theme tokens with no-flash init

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Nav, language switch, theme toggle and placeholder sections

**Files:**
- Create: `src/lib/components/Nav.svelte`, `LangSwitch.svelte`, `ThemeToggle.svelte`, `Section.svelte`, `src/lib/components/sections/{Hero,About,Projects,Skills,Experience,Contact}.svelte`
- Modify: `src/routes/[lang=lang]/+page.svelte` (final body)

**Interfaces:**
- Consumes: `Dict`, `Lang`, `otherLang` (`$lib/i18n`); `SECTIONS`, `SectionId` (`$lib/sections`); `Theme`, `THEME_KEY`, `nextTheme` (`$lib/theme`).
- Produces (props):
  - `Nav { lang: Lang; t: Dict }`
  - `LangSwitch { lang: Lang; t: Dict['langSwitch'] }`
  - `ThemeToggle { t: Dict['theme'] }`
  - `Section { id: SectionId; title: string; children?: Snippet }` → `<section id={id}>` with `<h2>`
  - Every section component: `{ t: Dict }` (Milestone 2+ adds props as needed)

No unit tests here: behaviour is DOM wiring over already-tested pure functions (`otherLang`, `nextTheme`). Verified by type check, build greps and the manual checklist.

- [ ] **Step 1: `ThemeToggle.svelte`**

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Dict } from '$lib/i18n';
	import { nextTheme, THEME_KEY, type Theme } from '$lib/theme';

	let { t }: { t: Dict['theme'] } = $props();

	let theme = $state<Theme>('dark');

	onMount(() => {
		theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
	});

	function toggle() {
		theme = nextTheme(theme);
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem(THEME_KEY, theme);
		} catch {
			// storage blocked (private mode): theme still applies for this page view
		}
	}
</script>

<button
	type="button"
	class="icon-btn"
	onclick={toggle}
	aria-label={theme === 'dark' ? t.toLight : t.toDark}
	title={theme === 'dark' ? t.toLight : t.toDark}
>
	{#if theme === 'dark'}
		<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
			<circle cx="12" cy="12" r="4" fill="currentColor" />
			<path
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
			/>
		</svg>
	{:else}
		<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
			<path fill="currentColor" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
		</svg>
	{/if}
</button>

<style>
	.icon-btn {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border: 1px solid var(--border);
		border-radius: 50%;
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
	}
	.icon-btn:hover {
		border-color: var(--accent);
	}
</style>
```

- [ ] **Step 2: `LangSwitch.svelte`**

Full page load (not client-side `goto`) so `<html lang>` comes from the prerendered file; keeps the current `#section`; modifier-clicks behave as normal links.
```svelte
<script lang="ts">
	import { otherLang, type Dict, type Lang } from '$lib/i18n';

	let { lang, t }: { lang: Lang; t: Dict['langSwitch'] } = $props();

	const target = $derived(otherLang(lang));

	function onclick(e: MouseEvent) {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
		e.preventDefault();
		location.assign(`/${target}/${location.hash}`);
	}
</script>

<a
	class="lang"
	href="/{target}/"
	hreflang={target}
	lang={target}
	aria-label={t.label}
	title={t.label}
	data-sveltekit-reload
	{onclick}
>
	{t.short}
</a>

<style>
	.lang {
		display: grid;
		place-items: center;
		height: 2.25rem;
		padding: 0 0.75rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text);
		font-weight: 600;
		font-size: 0.85rem;
		text-decoration: none;
	}
	.lang:hover {
		border-color: var(--accent);
	}
</style>
```

- [ ] **Step 3: `Nav.svelte`**

```svelte
<script lang="ts">
	import type { Dict, Lang } from '$lib/i18n';
	import { SECTIONS } from '$lib/sections';
	import LangSwitch from './LangSwitch.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { lang, t }: { lang: Lang; t: Dict } = $props();
</script>

<header class="nav">
	<a class="brand" href="#hero">{t.hero.name}</a>
	<nav aria-label="Main">
		<ul>
			{#each SECTIONS as id (id)}
				<li><a href="#{id}">{t.nav[id]}</a></li>
			{/each}
		</ul>
	</nav>
	<div class="actions">
		<LangSwitch {lang} t={t.langSwitch} />
		<ThemeToggle t={t.theme} />
	</div>
</header>

<style>
	.nav {
		position: fixed;
		inset: 0 0 auto 0;
		z-index: 10;
		height: var(--nav-h);
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 1rem;
		background: color-mix(in srgb, var(--bg) 85%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--border);
	}
	.brand {
		font-weight: 700;
		color: var(--text);
		text-decoration: none;
	}
	nav {
		flex: 1;
		min-width: 0;
		overflow-x: auto;
	}
	ul {
		display: flex;
		gap: 1.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
		white-space: nowrap;
	}
	nav a {
		color: var(--muted);
		text-decoration: none;
	}
	nav a:hover {
		color: var(--text);
	}
	.actions {
		display: flex;
		gap: 0.5rem;
	}
</style>
```

- [ ] **Step 4: `Section.svelte` and the six section components**

`src/lib/components/Section.svelte`:
```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { SectionId } from '$lib/sections';

	let { id, title, children }: { id: SectionId; title: string; children?: Snippet } = $props();
</script>

<section {id} aria-labelledby="{id}-title">
	<h2 id="{id}-title">{title}</h2>
	{@render children?.()}
</section>

<style>
	section {
		max-width: 72rem;
		margin: 0 auto;
		padding: 4rem 1rem;
		min-height: 60vh;
	}
	h2 {
		font-size: 2rem;
		margin: 0 0 1.5rem;
	}
</style>
```

`src/lib/components/sections/Hero.svelte`:
```svelte
<script lang="ts">
	import type { Dict } from '$lib/i18n';

	let { t }: { t: Dict } = $props();
</script>

<section id="hero" class="hero">
	<h1>{t.hero.name}</h1>
	<p>{t.hero.tagline}</p>
</section>

<style>
	.hero {
		min-height: 100vh;
		display: grid;
		place-content: center;
		text-align: center;
		padding: var(--nav-h) 1rem 0;
	}
	h1 {
		font-size: clamp(2.5rem, 8vw, 5rem);
		margin: 0;
	}
	p {
		color: var(--muted);
		font-size: 1.25rem;
	}
</style>
```

`src/lib/components/sections/About.svelte` — and the same pattern for `Projects.svelte` (`id="projects"`, `t.sections.projects`), `Skills.svelte` (`skills`), `Experience.svelte` (`experience`), `Contact.svelte` (`contact`); only the id and key change:
```svelte
<script lang="ts">
	import type { Dict } from '$lib/i18n';
	import Section from '../Section.svelte';

	let { t }: { t: Dict } = $props();
</script>

<Section id="about" title={t.sections.about}>
	<p class="placeholder">{t.placeholder}</p>
</Section>

<style>
	.placeholder {
		color: var(--muted);
	}
</style>
```
e.g. `Contact.svelte`:
```svelte
<script lang="ts">
	import type { Dict } from '$lib/i18n';
	import Section from '../Section.svelte';

	let { t }: { t: Dict } = $props();
</script>

<Section id="contact" title={t.sections.contact}>
	<p class="placeholder">{t.placeholder}</p>
</Section>

<style>
	.placeholder {
		color: var(--muted);
	}
</style>
```

- [ ] **Step 5: Compose the locale page**

`src/routes/[lang=lang]/+page.svelte` (final for this milestone):
```svelte
<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import About from '$lib/components/sections/About.svelte';
	import Contact from '$lib/components/sections/Contact.svelte';
	import Experience from '$lib/components/sections/Experience.svelte';
	import Hero from '$lib/components/sections/Hero.svelte';
	import Projects from '$lib/components/sections/Projects.svelte';
	import Skills from '$lib/components/sections/Skills.svelte';

	let { data } = $props();
	const t = $derived(data.t);
</script>

<svelte:head>
	<title>{t.meta.title}</title>
	<meta name="description" content={t.meta.description} />
	<link rel="alternate" hreflang="en" href="/en/" />
	<link rel="alternate" hreflang="fr" href="/fr/" />
</svelte:head>

<Nav lang={data.lang} {t} />

<main>
	<Hero {t} />
	<About {t} />
	<Projects {t} />
	<Skills {t} />
	<Experience {t} />
	<Contact {t} />
</main>
```

- [ ] **Step 6: Automated verification**

Run:
```bash
npm test && npm run check && npm run lint && npm run build \
  && for id in hero about projects skills experience contact; do grep -c "id=\"$id\"" build/fr/index.html; done \
  && grep -c 'hreflang="en" lang="en"' build/fr/index.html
```
Expected: tests PASS; 0 errors; lint clean; six lines of `1`; then `1` (the EN switch link in the FR page).

Then the 404 check:
```bash
npm run preview -- --port 4173 & sleep 3
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4173/de/
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4173/fr/
kill %1
```
Expected: `404` then `200`.

- [ ] **Step 7: Manual checklist** (`npm run preview`, open `http://localhost:4173/`)

- `/` redirects to `/fr/` with a French browser, `/en/` otherwise (DevTools → Sensors → Locale, or browser language setting).
- Click nav links → smooth scroll, heading not hidden under the fixed nav.
- Scroll to Projects, click `FR`/`EN` → other language, still on `#projects`; DevTools shows `<html lang>` updated.
- Ctrl/Cmd-click the language switch → opens in a new tab.
- Theme toggle flips theme; reload keeps choice; in a private window it still toggles (no console error).
- Hard reload in light mode → no dark flash.
- Narrow window to ~375px → nav links scroll horizontally, no page-wide horizontal scroll.

- [ ] **Step 8: Commit**

```bash
npm run format
git add -A
git commit -m "feat: add nav, language switch, theme toggle and placeholder sections

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
