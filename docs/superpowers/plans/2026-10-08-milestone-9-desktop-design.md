# Milestone 9 - Desktop design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the portfolio the visual identity validated on the Claude Design canvas (A1·M3 révisée, light + dark, skills as tabs) on desktop, plus favicon, share images, per-locale meta and scroll reveal.

**Architecture:** Restyle in place, foundations first: theme tokens + self-hosted font + shared button classes, then the numbered section grid and nav, then each section in page order, then favicon/OG/meta and scroll reveal. Logic stays in pure, tested functions (`sectionNumber`, `fill`, `nextTab`, `durationMonths`, `shouldReveal`, `icoFromPng`); components only render and wire. Phones keep their M8 layouts and only get a "nothing breaks" check.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, adapter-static (prerendered), TypeScript, Vitest, Playwright (screenshots, OG generation, audit), `@fontsource-variable/schibsted-grotesk`.

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section "Milestone 9 - Desktop design" (and the older sections it supersedes on desktop). Design sources: `docs/superpowers/designs/2026-10-07-m9-final/` (`A1M3b-Clair.dc.html`, `A1M3b-Sombre.dc.html`, `Skills-Idee4A.dc.html`; value reference only, they render only inside the canvas https://claude.ai/artifact/5rqhnCoS2tUFHpioTu8jZG).

## Global Constraints

- Work in the worktree `/home/lezard/portfolio/.claude/worktrees/milestone-9-desktop-design` (branch `worktree-milestone-9-desktop-design`, remote branch `milestone-9-desktop-design`). Node 24 (`node -v`; if not 24: `source ~/.nvm/nvm.sh && nvm use 24`).
- **Match the design.** Every colour, size, spacing, radius and text comes from the spec's M9 section / the design sources. Sizes are written in `rem` = design px ÷ 16 (borders, shadows and 1–2px lines stay in px). Any deliberate deviation goes into the review guide's "Deviations" list.
- Svelte 5 runes only (`$props`, `$state`, `$derived`, `$effect`); no `export let`, no `$:`, no stores. No `svelte.config.js` (config lives in `vite.config.ts`).
- UI text only in `src/lib/i18n/en.ts` and `fr.ts`; `fr` is typed `Dict`, so every key exists in both. Dict leaves are strings only (a test enforces it); templates use `{name}` placeholders filled by `fill()`.
- Content in typed data files under `src/lib/data/` with `{ en, fr }` fields.
- French typography: U+00A0 before `: ; ! ? %` and inside « », typographic apostrophe `’` (tests in `src/lib/i18n/typography.spec.ts` scan dicts and data).
- Asset URLs via `assetHref(base, path)` with `base` from `$app/paths`; locale URLs via `localeHref`. Never hardcode `/en/`.
- External links: `target="_blank" rel="noopener noreferrer"` plus the shared `<span class="sr-only">{newTab}</span>`.
- Hover effects only under `@media (hover: hover) and (pointer: fine)`, mirrored on `:focus-within` / `:focus-visible`; no movement under `prefers-reduced-motion: reduce`.
- Phones (`width < 48rem`) keep M8 layouts; only fix what breaks. No sideways-scrolling UI.
- Never commit `tmp/`, `reports/`, test media or `*:Zone.Identifier` files. Never `git add -A src` after running tools from a subdirectory (it can pick up `src/**/.svelte-kit`); add files by path.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- After each task: `npm run check`, `npm test`, `npm run lint` clean (run `npm run format` first if lint fails on formatting).

## Review Focus

- **Hero name at 768–1240px:** "Jocelyn Renault." is `nowrap`; on a 1024px or 800px window it must not overflow the page (expected: font scales down with `min(7.625rem, 9.6vw)`, no horizontal scroll). Pinned in Task 3 Step 6.
- **French filters with counts at 1024px:** the three segmented bars (longer French labels + counts) must wrap inside the section body, never overflow it. Pinned in Task 4 Step 8.
- **Content hidden by scroll reveal:** a section must never stay invisible - deep link `/fr/#contact`, reduced motion, no JS, or printing. Pinned by `shouldReveal` tests and Task 9 Step 5 (deep link + print checks).
- **Theme tokens in every theme block:** a token defined for dark but missing in the light or the no-JS light block would render with the dark value on a light page. Pinned in Task 1 Step 1 (`theme-tokens.spec.ts`).
- **Skills tabs with keyboard and without JS:** arrow keys must move focus and selection together with exactly one tab in the tab order; without JS all six groups must be readable. Pinned by `nextTab` tests and Task 5 Step 7.

---

### Task 0: Worktree setup

**Files:** none (install only).

- [ ] **Step 1: Install dependencies and confirm a green baseline**

```bash
cd /home/lezard/portfolio/.claude/worktrees/milestone-9-desktop-design
node -v            # must print v24.x
npm ci
npm test && npm run check && npm run lint
```

Expected: all pass (the M8 baseline).

---

### Task 1: Theme tokens, font and shared buttons

**Files:**
- Modify: `src/app.css` (whole token blocks; add button classes)
- Modify: `src/lib/skills.ts:22` (`THEME_BG`)
- Modify: `src/routes/+layout.svelte`
- Modify (`var(--pill)` → `var(--radius-sm)`): `src/lib/components/sections/Projects.svelte`, `src/lib/components/projects/ProjectCardLarge.svelte`, `src/lib/components/sections/Hero.svelte`, `src/lib/components/LangSwitch.svelte`, `src/lib/components/sections/Contact.svelte`, `src/lib/components/sections/About.svelte`, `src/lib/components/projects/ProjectLinks.svelte`, `src/lib/components/sections/Skills.svelte`, `src/lib/components/projects/ProjectFilters.svelte`
- Create: `src/lib/theme-tokens.spec.ts`
- Modify: `package.json` (dependency)

**Interfaces:**
- Produces: CSS custom properties `--bg --surface --text --on-text --body --muted --border --rule --tag --accent --on-accent --tint --ok --ok-dot --ok-ring --footer-bg --footer-text --malt-tile --radius --radius-sm --nav-h --font`; global classes `.btn`, `.btn-primary`; `THEME_BG = { dark: '#121210', light: '#faf8f4' }`.

- [ ] **Step 1: Write the failing token test**

Create `src/lib/theme-tokens.spec.ts`:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
	resolve(fileURLToPath(new URL('../app.css', import.meta.url))),
	'utf8'
);

/** Custom properties declared in the first block that starts with `selector`. */
function tokens(selector: string): Map<string, string> {
	const start = css.indexOf(selector);
	expect(start, selector).toBeGreaterThanOrEqual(0);
	const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
	return new Map([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

const dark = tokens(':root {');
const light = tokens(":root[data-theme='light'] {");
const noJsLight = tokens(':root:not([data-theme]) {');

const THEMED = [
	'--bg',
	'--surface',
	'--text',
	'--on-text',
	'--body',
	'--muted',
	'--border',
	'--rule',
	'--tag',
	'--accent',
	'--on-accent',
	'--tint',
	'--ok',
	'--ok-dot',
	'--ok-ring',
	'--footer-bg',
	'--footer-text',
	'--malt-tile'
];

describe('theme tokens in src/app.css', () => {
	it.each(THEMED)('%s is set in the dark, light and no-JS light blocks', (name) => {
		expect(dark.get(name), `dark ${name}`).toBeTruthy();
		expect(light.get(name), `light ${name}`).toBeTruthy();
		expect(noJsLight.get(name), `no-JS ${name}`).toBeTruthy();
	});

	it('uses the same light values with and without JS', () => {
		for (const name of THEMED) expect(noJsLight.get(name), name).toBe(light.get(name));
	});

	it('has the M9 palette', () => {
		expect(dark.get('--bg')).toBe('#121210');
		expect(dark.get('--accent')).toBe('#ff7f5e');
		expect(light.get('--bg')).toBe('#faf8f4');
		expect(light.get('--accent')).toBe('#c2391b');
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/theme-tokens.spec.ts`
Expected: FAIL (`--on-text` etc. missing, `--bg` is `#0d1117`).

- [ ] **Step 3: Install the font**

```bash
npm install -D @fontsource-variable/schibsted-grotesk@^5.3.0
```

- [ ] **Step 4: Rewrite the token blocks of `src/app.css`**

Replace everything from the top of `src/app.css` down to (not including) `*,\n*::before,` with:

```css
:root {
	--nav-h: 4.5rem;
	--radius: 6px;
	--radius-sm: 4px;
	--tap: 2.25rem;
	--font:
		'Schibsted Grotesk Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	color-scheme: dark;
	--bg: #121210;
	--surface: #1a1916;
	--text: #f3f0e8;
	--on-text: #121210;
	--body: #d9d5cb;
	--muted: #a9a498;
	--border: #2b2924;
	--rule: #2b2924;
	--tag: #25231f;
	--accent: #ff7f5e;
	--on-accent: #121210;
	--tint: color-mix(in srgb, var(--accent) 15%, var(--bg));
	--ok: #86dda5;
	--ok-dot: #4cc377;
	--ok-ring: rgb(76 195 119 / 0.2);
	--footer-bg: #0d0d0b;
	--footer-text: #f3f0e8;
	--malt-tile: rgb(252 87 87 / 0.14);
}

/* Touch screens: controls at least 44px so they are easy to hit. */
@media (pointer: coarse) {
	:root {
		--tap: 2.75rem;
	}
}

:root[data-theme='light'] {
	color-scheme: light;
	--bg: #faf8f4;
	--surface: #ffffff;
	--text: #141412;
	--on-text: #ffffff;
	--body: #2b2a26;
	--muted: #56534c;
	--border: #e0dbd0;
	--rule: #dcd7cc;
	--tag: #ece8e0;
	--accent: #c2391b;
	--on-accent: #ffffff;
	--tint: color-mix(in srgb, var(--accent) 11%, var(--bg));
	--ok: #1f6b3a;
	--ok-dot: #2e8b4e;
	--ok-ring: rgb(46 139 78 / 0.16);
	--footer-bg: #141412;
	--footer-text: #ffffff;
	--malt-tile: #ffedec;
}

/* No-JS visitors: default tokens are dark, so follow the system preference
   for light before any script (or the theme attribute it sets) runs. */
@media (prefers-color-scheme: light) {
	:root:not([data-theme]) {
		color-scheme: light;
		--bg: #faf8f4;
		--surface: #ffffff;
		--text: #141412;
		--on-text: #ffffff;
		--body: #2b2a26;
		--muted: #56534c;
		--border: #e0dbd0;
		--rule: #dcd7cc;
		--tag: #ece8e0;
		--accent: #c2391b;
		--on-accent: #ffffff;
		--tint: color-mix(in srgb, var(--accent) 11%, var(--bg));
		--ok: #1f6b3a;
		--ok-dot: #2e8b4e;
		--ok-ring: rgb(46 139 78 / 0.16);
		--footer-bg: #141412;
		--footer-text: #ffffff;
		--malt-tile: #ffedec;
	}
}

```

In the same file: change `body { … }` to add `font-size: 1.125rem;` (18px body text), and in `.skip-link` change `color: var(--bg);` to `color: var(--on-accent);`. Then append at the end of the file:

```css
/* Shared buttons (Hero, Nav, Contact, empty states). */
.btn {
	display: inline-flex;
	align-items: center;
	gap: 0.625rem;
	min-height: 3rem;
	padding: 0 1.375rem;
	border: 2px solid var(--text);
	border-radius: var(--radius);
	background: transparent;
	color: var(--text);
	font: inherit;
	font-size: 1rem;
	font-weight: 600;
	line-height: 1.2;
	text-decoration: none;
	cursor: pointer;
	transition:
		color 0.2s,
		background-color 0.2s,
		border-color 0.2s;
}
.btn:hover {
	color: var(--accent);
	border-color: var(--accent);
}
.btn-primary {
	background: var(--text);
	color: var(--on-text);
}
.btn-primary:hover {
	background: var(--accent);
	border-color: var(--accent);
	color: var(--on-accent);
}
```

- [ ] **Step 5: Update `THEME_BG`**

In `src/lib/skills.ts` replace the `THEME_BG` line with:

```ts
export const THEME_BG = { dark: '#121210', light: '#faf8f4' } as const;
```

- [ ] **Step 6: Load and preload the font**

Replace `src/routes/+layout.svelte` with:

```svelte
<script lang="ts">
	import '@fontsource-variable/schibsted-grotesk';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	// The package's exports map only exposes CSS, so the woff2 is imported by path to preload it
	// (Vite emits one file: the same asset the @font-face rule points to).
	import fontLatin from '../../node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2?url';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preload" href={fontLatin} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
```

- [ ] **Step 7: Replace the removed `--pill` token**

```bash
sed -i 's/var(--pill)/var(--radius-sm)/g' \
  src/lib/components/sections/Projects.svelte src/lib/components/projects/ProjectCardLarge.svelte \
  src/lib/components/sections/Hero.svelte src/lib/components/LangSwitch.svelte \
  src/lib/components/sections/Contact.svelte src/lib/components/sections/About.svelte \
  src/lib/components/projects/ProjectLinks.svelte src/lib/components/sections/Skills.svelte \
  src/lib/components/projects/ProjectFilters.svelte
grep -rn -e '--pill' src || echo "no --pill left"
```

Expected: `no --pill left`.

- [ ] **Step 8: Run tests, check, build**

```bash
npx vitest run src/lib/theme-tokens.spec.ts src/lib/skills.spec.ts src/lib/data/contact-icons.spec.ts
npm test && npm run check && npm run build
ls build/_app/immutable/assets | grep -c 'schibsted-grotesk-latin-wght-normal'
grep -o 'rel="preload"[^>]*woff2[^>]*' build/fr/index.html | head -1
```

Expected: tests PASS; exactly `1` latin-normal woff2 emitted; the preload link is in the prerendered HTML. If `contact-icons.spec.ts` fails because a brand colour now falls below 2.2 against both new grounds, report it (don't change the threshold).

- [ ] **Step 9: Commit**

```bash
git add src/app.css src/lib/skills.ts src/routes/+layout.svelte src/lib/theme-tokens.spec.ts package.json package-lock.json src/lib/components
git commit -m "feat: M9 theme tokens, Schibsted Grotesk and shared buttons

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Numbered section grid, `fill()` and nav

**Files:**
- Create: `src/lib/i18n/format.ts`, `src/lib/i18n/format.spec.ts`
- Modify: `src/lib/sections.ts`, `src/lib/sections.spec.ts`
- Modify: `src/lib/components/Section.svelte` (rewrite)
- Modify: `src/lib/components/Nav.svelte`, `src/lib/components/ThemeToggle.svelte` (style only), `src/lib/components/LangSwitch.svelte` (style only)
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts` (key `navCv`)

**Interfaces:**
- Produces: `sectionNumber(id: SectionId): string` ("01"…"05"); `fill(template: string, values: Record<string, string | number>): string`; `Section` props `{ id: SectionId; title: string; lead?: string; children?: Snippet }`; dict key `navCv`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/i18n/format.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fill } from './format';

describe('fill', () => {
	it('replaces every {name} placeholder', () => {
		expect(fill('{total} projects, {featured} first', { total: 17, featured: 6 })).toBe(
			'17 projects, 6 first'
		);
	});
	it('replaces a placeholder used twice', () => {
		expect(fill('{n}/{n}', { n: 2 })).toBe('2/2');
	});
	it('leaves unknown placeholders as they are', () => {
		expect(fill('{a} {b}', { a: 'x' })).toBe('x {b}');
	});
});
```

Append to `src/lib/sections.spec.ts` (keep its existing imports; add `sectionNumber` to the import from `./sections`):

```ts
describe('sectionNumber', () => {
	it('numbers sections from 01 in nav order', () => {
		expect(sectionNumber('about')).toBe('01');
		expect(sectionNumber('projects')).toBe('02');
		expect(sectionNumber('contact')).toBe('05');
	});
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/lib/i18n/format.spec.ts src/lib/sections.spec.ts`
Expected: FAIL (`fill` / `sectionNumber` not exported).

- [ ] **Step 3: Implement**

Create `src/lib/i18n/format.ts`:

```ts
/** Fills `{name}` placeholders of a dictionary template; unknown names stay as written. */
export function fill(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in values ? String(values[name]) : match
	);
}
```

Append to `src/lib/sections.ts`:

```ts
/** Two-digit number shown before a section title and its nav link: 'about' → '01'. */
export function sectionNumber(id: SectionId): string {
	return String(SECTIONS.indexOf(id) + 1).padStart(2, '0');
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/i18n/format.spec.ts src/lib/sections.spec.ts`
Expected: PASS.

- [ ] **Step 5: Rewrite `src/lib/components/Section.svelte`**

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { sectionNumber, type SectionId } from '$lib/sections';

	let {
		id,
		title,
		lead,
		children
	}: { id: SectionId; title: string; lead?: string; children?: Snippet } = $props();
</script>

<section {id} aria-labelledby="{id}-title">
	<div class="inner">
		<div class="head">
			<p class="num" aria-hidden="true">{sectionNumber(id)}</p>
			<h2 id="{id}-title">{title}</h2>
			{#if lead}<p class="lead">{lead}</p>{/if}
		</div>
		<div class="body">
			{@render children?.()}
		</div>
	</div>
</section>

<style>
	section {
		max-width: 77.5rem;
		margin: 0 auto;
		padding: 0 2.5rem;
	}
	.inner {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		column-gap: 2rem;
		row-gap: 1.75rem;
		padding: 7rem 0;
		border-top: 2px solid var(--text);
	}
	.head {
		grid-column: span 3;
	}
	.body {
		grid-column: span 9;
		min-width: 0;
	}
	.num {
		margin: 0;
		font-size: 7rem;
		line-height: 0.82;
		font-weight: 900;
		letter-spacing: -0.05em;
		color: transparent;
		-webkit-text-stroke: 2px var(--accent);
	}
	h2 {
		margin: 0.875rem 0 0;
		font-size: 2.875rem;
		line-height: 1.08;
		font-weight: 800;
		letter-spacing: -0.035em;
	}
	.lead {
		margin: 0.875rem 0 0;
		font-size: 1.0625rem;
		line-height: 1.5;
		color: var(--muted);
	}
	/* Phone (M10 will design it): heading block above the content, M8 sizes. */
	@media (width < 48rem) {
		section {
			padding: 0 1rem;
		}
		.inner {
			display: block;
			padding: 2.5rem 0;
		}
		.num {
			font-size: 3.5rem;
		}
		h2 {
			margin: 0.5rem 0 0;
			font-size: 1.6rem;
		}
		.lead {
			margin-top: 0.5rem;
		}
		.head {
			margin-bottom: 1.25rem;
		}
	}
</style>
```

- [ ] **Step 6: Nav markup and styles**

In `src/lib/components/Nav.svelte`:

1. Add imports: `import { base } from '$app/paths';`, `import { assetHref } from '$lib/paths';`, and change the sections import to `import { SECTIONS, sectionNumber, type SectionId } from '$lib/sections';`.
2. Replace the link inside `{#each SECTIONS …}` with:

```svelte
					<a
						href="#{id}"
						aria-current={active === id ? 'true' : undefined}
						onclick={() => send('link')}
						><span class="n" aria-hidden="true">{sectionNumber(id)}</span>{t.nav[id]}</a
					>
```

3. Replace the `.actions` div with:

```svelte
	<div class="actions">
		<ThemeToggle t={t.theme} />
		<LangSwitch {lang} t={t.langSwitch} />
		<a
			class="btn btn-primary cv"
			href={assetHref(base, PROFILE.cv[lang])}
			target="_blank"
			rel="noopener noreferrer">{t.navCv} <span class="sr-only">{t.newTab}</span></a
		>
	</div>
```

4. Replace these rules in the `<style>` block (keep the phone `@media (max-width: 47.49rem)` block as is):

```css
	.nav {
		position: fixed;
		inset: 0 0 auto 0;
		z-index: 10;
		height: var(--nav-h);
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 max(2.5rem, calc((100% - 77.5rem) / 2 + 2.5rem));
		background: color-mix(in srgb, var(--bg) 86%, transparent);
		backdrop-filter: blur(14px);
		border-bottom: 1px solid var(--rule);
	}
	.brand {
		font-size: 1.1875rem;
		font-weight: 800;
		color: var(--text);
		text-decoration: none;
		white-space: nowrap;
	}
	nav {
		flex: 1;
		min-width: 0;
		overflow-x: auto;
		display: flex;
		justify-content: center;
	}
	ul {
		display: flex;
		gap: 1.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
		white-space: nowrap;
	}
	nav a {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		min-height: 2.5rem;
		color: var(--text);
		font-size: 1rem;
		font-weight: 500;
		text-decoration: none;
	}
	nav a:hover {
		color: var(--accent);
	}
	nav a[aria-current] {
		text-decoration: underline 2px var(--accent);
		text-underline-offset: 0.4em;
	}
	.n {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--accent);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.cv {
		min-height: 2.75rem;
		padding: 0 1.125rem;
		font-size: 0.9375rem;
	}
```

and inside the existing phone block add:

```css
		.nav {
			padding: 0 1rem;
		}
		.cv {
			display: none;
		}
```

5. In `ThemeToggle.svelte` `.icon-btn` and `LangSwitch.svelte` `.lang`: set `width/height: 2.75rem` (LangSwitch: `min-width: 2.75rem; height: 2.75rem; padding: 0 0.5rem;`), `border: 1px solid var(--rule)`, `border-radius: var(--radius-sm)`, `background: transparent`. Hover stays `border-color: var(--accent)`.

- [ ] **Step 7: Dict key**

`en.ts`: add `navCv: 'CV',` after `navLabel`. `fr.ts`: add `navCv: 'CV',` after `navLabel`.

- [ ] **Step 8: Build, look, and check nav fit**

```bash
npm run check && npm test && npm run build
npx vite preview --port 4191 --strictPort &   # kill it when done
```

With a scratchpad Playwright script (pattern: memory `visual-check-playwright.md`; scripts live in the session scratchpad, never in the repo), load `http://localhost:4191/fr/` and `/en/` at 1440, 1280 and 1024px, both themes (`page.evaluate(t => document.documentElement.dataset.theme = t, 'light')`), screenshot the nav and the About heading block, and evaluate:

```js
() => { const ul = document.querySelector('#nav-links'); return { overflow: ul.scrollWidth > ul.clientWidth, page: document.documentElement.scrollWidth > innerWidth }; }
```

Expected: `{ overflow: false, page: false }` at 1440 and 1280. If `overflow` is true at 1024px only, add to `Nav.svelte` `<style>`:

```css
	@media (47.5rem <= width < 64rem) {
		.n {
			display: none;
		}
	}
```

and note it in the review guide's Deviations. Compare the screenshots with the design values (number outline 112px, title 46px, 2px rule, nav 72px).

- [ ] **Step 9: Commit**

```bash
git add src/lib/i18n/format.ts src/lib/i18n/format.spec.ts src/lib/sections.ts src/lib/sections.spec.ts src/lib/components/Section.svelte src/lib/components/Nav.svelte src/lib/components/ThemeToggle.svelte src/lib/components/LangSwitch.svelte src/lib/i18n/en.ts src/lib/i18n/fr.ts
git commit -m "feat: numbered section grid, nav numbers and CV button

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Hero with the at-a-glance card, and About

**Files:**
- Modify: `src/lib/data/profile.ts` (`facts` → `glance`), `src/lib/data/profile.spec.ts`
- Modify: `src/lib/components/sections/Hero.svelte` (rewrite), `src/lib/components/sections/About.svelte` (rewrite)
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts` (`hero` keys)

**Interfaces:**
- Consumes: `.btn`, `.btn-primary`, tokens (Task 1); `CONTACT_BRANDS.malt` from `src/lib/data/contact-icons.ts` (`{ path, hex, viewBox }`).
- Produces: `PROFILE.glance: GlanceRow[]`, `type GlanceRow = { label: Localized; value: Localized }`; `Dict['hero']` = `{ available, projects, cv, malt, glance }`.

- [ ] **Step 1: Update the profile test (failing)**

In `src/lib/data/profile.spec.ts` replace `...PROFILE.facts.map((f) => f.text)` with `...PROFILE.glance.flatMap((r) => [r.label, r.value])`, and replace the test `'has three bio paragraphs and at least one fact with an icon'` with:

```ts
	it('has three bio paragraphs and the five at-a-glance rows', () => {
		expect(PROFILE.bio).toHaveLength(3);
		expect(PROFILE.glance.map((r) => r.label.en)).toEqual([
			'Education',
			'Latest role',
			'Stack',
			'Hackathons',
			'Languages'
		]);
	});
```

Run: `npx vitest run src/lib/data/profile.spec.ts` → FAIL (`glance` undefined).

- [ ] **Step 2: Profile data**

In `src/lib/data/profile.ts`: replace `export type Fact = { icon: string; text: Localized };` with

```ts
/** One row of the hero's "At a glance" card. */
export type GlanceRow = { label: Localized; value: Localized };
```

replace `facts: Fact[];` with `glance: GlanceRow[];`, and replace the `facts: [...]` entry with:

```ts
	glance: [
		{
			label: { en: 'Education', fr: 'Formation' },
			value: {
				en: '42 Lyon - RNCP 7, expert in computer architecture',
				fr: '42 Lyon - RNCP 7, expert en architecture informatique'
			}
		},
		{
			label: { en: 'Latest role', fr: 'Dernier poste' },
			value: {
				en: 'ML & Computer Vision developer - Sogeti (Capgemini)',
				fr: 'Développeur ML & IA Vision - Sogeti (Capgemini)'
			}
		},
		{
			label: { en: 'Stack', fr: 'Stack' },
			value: { en: 'Python, Rust, C, Node.js, Docker', fr: 'Python, Rust, C, Node.js, Docker' }
		},
		{
			label: { en: 'Hackathons', fr: 'Hackathons' },
			value: { en: '2 wins, 5 podiums', fr: '2 victoires, 5 podiums' }
		},
		{
			label: { en: 'Languages', fr: 'Langues' },
			value: { en: 'French, English', fr: 'Français, anglais' }
		}
	],
```

Run: `npx vitest run src/lib/data/profile.spec.ts src/lib/i18n/typography.spec.ts` → PASS.

- [ ] **Step 3: Hero dict keys**

`en.ts` `hero`:

```ts
	hero: {
		available: 'Available for work',
		projects: 'See projects',
		cv: 'View CV',
		malt: 'Malt profile',
		glance: 'At a glance'
	},
```

`fr.ts` `hero`:

```ts
	hero: {
		available: 'Disponible',
		projects: 'Voir les projets',
		cv: 'Voir le CV',
		malt: 'Profil Malt',
		glance: 'En bref'
	},
```

- [ ] **Step 4: Rewrite `src/lib/components/sections/Hero.svelte`**

```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import { CONTACT_BRANDS } from '$lib/data/contact-icons';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import { assetHref } from '$lib/paths';

	let { lang, t, newTab }: { lang: Lang; t: Dict['hero']; newTab: string } = $props();

	const malt = CONTACT_BRANDS.malt;
</script>

<section id="hero" class="hero">
	{#if PROFILE.available}
		<p class="available"><span class="dot" aria-hidden="true"></span>{t.available}</p>
	{/if}
	<h1>{PROFILE.name}<span class="stop" aria-hidden="true">.</span></h1>
	<div class="grid">
		<div>
			<p class="role">{PROFILE.role[lang]}</p>
			<p class="pitch">{PROFILE.pitch[lang]}</p>
			<div class="ctas">
				<a class="btn btn-primary" href="#projects">
					{t.projects}
					<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
						<path
							d="M12 5v14M5 12l7 7 7-7"
							fill="none"
							stroke="currentColor"
							stroke-width="2.2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</a>
				<a
					class="btn"
					href={assetHref(base, PROFILE.cv[lang])}
					target="_blank"
					rel="noopener noreferrer"
				>
					<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
						<path
							d="M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h6"
							fill="none"
							stroke="currentColor"
							stroke-width="2.2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					{t.cv} <span class="sr-only">{newTab}</span>
				</a>
				<a class="btn" href={PROFILE.malt} target="_blank" rel="noopener noreferrer">
					<svg viewBox={malt.viewBox} width="18" height="18" fill="#{malt.hex}" aria-hidden="true">
						<path d={malt.path} />
					</svg>
					{t.malt} <span aria-hidden="true">↗</span>
					<span class="sr-only">{newTab}</span>
				</a>
			</div>
		</div>
		<div class="glance">
			<p class="glance-title">{t.glance}</p>
			<dl>
				{#each PROFILE.glance as row, i (i)}
					<div class="row">
						<dt>{row.label[lang]}</dt>
						<dd>{row.value[lang]}</dd>
					</div>
				{/each}
			</dl>
		</div>
	</div>
</section>

<style>
	.hero {
		max-width: 77.5rem;
		margin: 0 auto;
		padding: calc(var(--nav-h) + 4rem) 2.5rem 6rem;
	}
	.available {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
		margin: 0 0 1.125rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--ok);
	}
	.dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 50%;
		background: var(--ok-dot);
		box-shadow: 0 0 0 4px var(--ok-ring);
	}
	h1 {
		margin: 0;
		/* 122px from 1271px wide; scales down on narrower desktops so it never overflows. */
		font-size: min(7.625rem, 9.6vw);
		line-height: 0.9;
		font-weight: 900;
		letter-spacing: -0.055em;
		white-space: nowrap;
	}
	.stop {
		color: var(--accent);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 28.75rem), 1fr));
		gap: 3rem 5rem;
		align-items: start;
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 2px solid var(--text);
	}
	.role {
		margin: 0 0 0.875rem;
		font-size: 1.75rem;
		font-weight: 800;
		line-height: 1.25;
		letter-spacing: -0.01em;
		color: var(--accent);
	}
	.pitch {
		margin: 0 0 1.875rem;
		max-width: 52ch;
		font-size: 1.1875rem;
		line-height: 1.6;
		color: var(--body);
	}
	.ctas {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	.glance {
		padding: 0.625rem 1.75rem;
		background: var(--surface);
		border: 2px solid var(--text);
		border-radius: var(--radius);
	}
	.glance-title {
		margin: 0.875rem 0 0.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--accent);
	}
	dl {
		margin: 0;
	}
	.row {
		display: grid;
		grid-template-columns: 8.75rem minmax(0, 1fr);
		gap: 1rem;
		padding: 0.8125rem 0;
		border-bottom: 1px solid var(--rule);
	}
	.row:last-child {
		border-bottom: 0;
	}
	dt {
		padding-top: 2px;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--muted);
	}
	dd {
		margin: 0;
		font-weight: 600;
	}
	/* Phone (M10 will design it): the name wraps and shrinks. */
	@media (width < 48rem) {
		.hero {
			padding: calc(var(--nav-h) + 2rem) 1rem 2.5rem;
		}
		h1 {
			font-size: clamp(2.75rem, 13vw, 4rem);
			white-space: normal;
		}
		.row {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.125rem;
		}
	}
</style>
```

- [ ] **Step 5: Rewrite `src/lib/components/sections/About.svelte`**

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
			width="240"
			height="300"
			loading="lazy"
			decoding="async"
		/>
		<div class="text">
			{#each PROFILE.bio as paragraph, i (i)}
				<p>{paragraph[lang]}</p>
			{/each}
		</div>
	</div>
</Section>

<style>
	.about {
		display: grid;
		grid-template-columns: 15rem minmax(0, 1fr);
		gap: 3rem;
		align-items: start;
	}
	.photo {
		width: 15rem;
		height: auto;
		aspect-ratio: 4 / 5;
		object-fit: cover;
		border-radius: var(--radius);
	}
	.text {
		max-width: 62ch;
		font-size: 1.1875rem;
		line-height: 1.65;
	}
	p {
		margin: 0 0 1.125rem;
	}
	p:last-child {
		margin-bottom: 0;
	}
	@media (max-width: 40rem) {
		.about {
			grid-template-columns: minmax(0, 1fr);
			justify-items: center;
			gap: 1.5rem;
		}
		.photo {
			width: 12rem;
		}
		.text {
			font-size: 1.0625rem;
		}
	}
</style>
```

- [ ] **Step 6: Check, look, and pin the hero overflow (Review Focus)**

```bash
npm run check && npm test && npm run build
```

Restart `vite preview` (it caches the file list), then with the scratchpad Playwright script: screenshot `#hero` and `#about` at 1440 and 1280, both themes, both languages; and at widths 800, 1024 and 1280 evaluate `document.documentElement.scrollWidth <= innerWidth` → must be `true` for every width and both languages. At 1440 check `getComputedStyle(document.querySelector('#hero h1')).fontSize === '122px'`. At 360 confirm the hero has no horizontal scroll.

- [ ] **Step 7: Commit**

```bash
git add src/lib/data/profile.ts src/lib/data/profile.spec.ts src/lib/components/sections/Hero.svelte src/lib/components/sections/About.svelte src/lib/i18n/en.ts src/lib/i18n/fr.ts
git commit -m "feat: hero with the at-a-glance card and Malt button; About photo 4:5

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Projects - segmented filters, featured cards, more projects

**Files:**
- Create: `src/lib/components/icons/TrophyIcon.svelte`
- Delete: `src/lib/components/icons/GitHubIcon.svelte` (unused after this task)
- Modify: `src/lib/components/sections/Projects.svelte`, `src/lib/components/projects/ProjectFilters.svelte`, `ProjectCardLarge.svelte`, `ProjectCardSmall.svelte`, `ProjectLinks.svelte`, `TechTags.svelte`
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts` (`projects` keys)

**Interfaces:**
- Consumes: `fill` (Task 2), `Section` `lead` prop (Task 2), `LARGE_COUNT` from `$lib/projects`.
- Produces: `TrophyIcon` (props `{ size?: number }`, line icon, `aria-hidden`); `ProjectLinks` props `{ project; t; compact?: boolean }`; `TechTags` props `{ tech: string[]; small?: boolean }`; dict keys `projects.lead`, `projects.moreLead`, `projects.sourceCode`, `projects.code`, `projects.privateCode`, `projects.demoLink`.

- [ ] **Step 1: Dict keys (the dicts test is the failing test)**

Add to `en.ts` `projects` (keep the existing keys):

```ts
		lead: '{total} projects, {featured} worth a look first.',
		moreLead: 'Shorter school and game-jam projects.',
		sourceCode: 'Source code',
		code: 'Code',
		privateCode: 'Private code',
		demoLink: 'Live demo',
```

Run `npx vitest run src/lib/i18n/dicts.spec.ts` → FAIL (fr lacks the keys). Then add to `fr.ts` `projects`:

```ts
		lead: '{total} projets, dont {featured} à voir en priorité.',
		moreLead: 'Projets d’école et de game jam, plus courts.',
		sourceCode: 'Code source',
		code: 'Code',
		privateCode: 'Code privé',
		demoLink: 'Démo',
```

Run again → PASS.

- [ ] **Step 2: TrophyIcon**

Create `src/lib/components/icons/TrophyIcon.svelte`:

```svelte
<script lang="ts">
	let { size = 18 }: { size?: number } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
</svg>
```

- [ ] **Step 3: TechTags and ProjectLinks**

Replace `src/lib/components/projects/TechTags.svelte`:

```svelte
<script lang="ts">
	let { tech, small = false }: { tech: string[]; small?: boolean } = $props();
</script>

<ul role="list" class:small>
	{#each tech as tag (tag)}
		<li>{tag}</li>
	{/each}
</ul>

<style>
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		padding: 0.4375rem 0.625rem;
		border-radius: var(--radius-sm);
		background: var(--tag);
		color: var(--body);
		font-size: 0.875rem;
		font-weight: 500;
		line-height: 1;
	}
	.small li {
		padding: 0.3125rem 0.5rem;
		font-size: 0.8125rem;
	}
</style>
```

Replace `src/lib/components/projects/ProjectLinks.svelte`:

```svelte
<script lang="ts">
	import type { Dict } from '$lib/i18n';
	import type { Project } from '$lib/projects';

	let {
		project,
		t,
		compact = false
	}: { project: Project; t: Dict['projects']; compact?: boolean } = $props();
</script>

<div class="links">
	{#if project.links.repo}
		<a
			href={project.links.repo}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="{t.repo}: {project.title}"
			>{compact ? t.code : t.sourceCode} <span aria-hidden="true">↗</span></a
		>
	{/if}
	{#if project.links.demo}
		<a
			href={project.links.demo}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="{t.demo}: {project.title}"
			>{t.demoLink} <span aria-hidden="true">↗</span></a
		>
	{/if}
	{#if !project.links.repo && !project.links.demo}
		<span class="private">{compact ? t.private : t.privateCode}</span>
	{/if}
</div>

<style>
	.links {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	a {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		min-height: 2.75rem;
		color: var(--text);
		font-size: 0.9375rem;
		font-weight: 600;
	}
	a:hover {
		color: var(--accent);
	}
	.private {
		font-size: 0.875rem;
		color: var(--muted);
	}
</style>
```

(`aria-label` contains the visible text - "Source code on GitHub" ⊃ "Source code", "Code source sur GitHub" ⊃ "Code source"/"Code", "Démo en ligne" ⊃ "Démo" - so label-in-name holds.)

- [ ] **Step 4: Segmented filters**

In `src/lib/components/projects/ProjectFilters.svelte` replace the two chip groups and the sort `<label class="pick">` with:

```svelte
	<div class="group" role="group" aria-labelledby="filter-context-label">
		<span id="filter-context-label" class="label">{t.contextLabel}</span>
		<div class="seg">
			{#each contextOptions as value (value)}
				{@const count = countFor(projects, filters, 'context', value)}
				{@const active = filters.context === value}
				<button
					type="button"
					class="opt"
					aria-pressed={active}
					disabled={count === 0 && !active}
					onclick={() => (filters = { ...filters, context: value })}
				>
					{value === 'all' ? t.all : t.contexts[value]}
					<span class="count">{count}</span>
				</button>
			{/each}
		</div>
	</div>

	<div class="group" role="group" aria-labelledby="filter-domain-label">
		<span id="filter-domain-label" class="label">{t.domainLabel}</span>
		<div class="seg">
			{#each domainOptions as value (value)}
				{@const count = countFor(projects, filters, 'domain', value)}
				{@const active = filters.domain === value}
				<button
					type="button"
					class="opt"
					aria-pressed={active}
					disabled={count === 0 && !active}
					onclick={() => (filters = { ...filters, domain: value })}
				>
					{value === 'all' ? t.all : t.domains[value]}
					<span class="count">{count}</span>
				</button>
			{/each}
		</div>
	</div>

	<div class="group" role="group" aria-labelledby="filter-sort-label">
		<span id="filter-sort-label" class="label">{t.sortLabel}</span>
		<div class="seg">
			{#each SORTS as s (s)}
				<button type="button" class="opt" aria-pressed={sort === s} onclick={() => (sort = s)}>
					{t.sort[s]}
				</button>
			{/each}
		</div>
	</div>
```

Keep the two phone `<label class="pick phone">` selects, and add a third phone select for sort right after them:

```svelte
	<label class="pick phone">
		<span class="label">{t.sortLabel}</span>
		<select bind:value={sort}>
			{#each SORTS as s (s)}
				<option value={s}>{t.sort[s]}</option>
			{/each}
		</select>
	</label>
```

Replace the `<style>` block with:

```css
	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 1.25rem 1.75rem;
		margin-bottom: 2.5rem;
	}
	.group {
		display: flex;
		flex-direction: column;
		min-width: 0;
		max-width: 100%;
	}
	.label {
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--muted);
	}
	.seg {
		display: flex;
		flex-wrap: wrap;
		max-width: 100%;
		overflow: hidden;
		background: var(--surface);
		border: 2px solid var(--text);
		border-radius: var(--radius);
	}
	.opt {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 2.625rem;
		padding: 0 0.9375rem;
		border: 0;
		border-right: 1px solid var(--rule);
		background: transparent;
		color: var(--text);
		font: inherit;
		font-size: 0.9375rem;
		cursor: pointer;
	}
	.opt:last-child {
		border-right: 0;
	}
	.opt:hover:not(:disabled):not([aria-pressed='true']) {
		color: var(--accent);
	}
	.opt:focus-visible {
		outline-offset: -4px;
	}
	.opt[aria-pressed='true'] {
		background: var(--text);
		color: var(--on-text);
	}
	.opt:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.count {
		font-size: 0.75rem;
		color: var(--muted);
	}
	.opt[aria-pressed='true'] .count {
		color: var(--on-text);
		opacity: 0.75;
	}
	.pick {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	select {
		min-height: var(--tap);
		padding: 0.3rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.9rem;
	}
	.phone {
		display: none;
	}
	/* Phone: one full-width row per filter (label, then a dropdown) instead of segmented bars. */
	@media (width < 48rem) {
		.filters {
			display: grid;
			gap: 0.75rem;
			margin-bottom: 2rem;
		}
		.group {
			display: none;
		}
		.phone {
			display: flex;
		}
		.pick .label {
			flex-shrink: 0;
			width: 5.5rem;
			margin: 0;
			font-weight: 400;
		}
		.pick select {
			flex: 1;
			min-width: 0;
		}
	}
```

- [ ] **Step 5: Featured (large) card**

Replace `src/lib/components/projects/ProjectCardLarge.svelte` markup and the non-phone styles:

```svelte
<script lang="ts">
	import type { Dict, Lang } from '$lib/i18n';
	import type { Project } from '$lib/projects';
	import TrophyIcon from '../icons/TrophyIcon.svelte';
	import DomainIcon from './DomainIcon.svelte';
	import ProjectLinks from './ProjectLinks.svelte';
	import ProjectMedia from './ProjectMedia.svelte';
	import TechTags from './TechTags.svelte';

	let { project, lang, t }: { project: Project; lang: Lang; t: Dict['projects'] } = $props();
</script>

<article class="card">
	<ProjectMedia {project} />
	<div class="body">
		<p class="meta">
			<span class="dom"
				><DomainIcon domain={project.domains[0]} size={18} />{t.domains[project.domains[0]]}</span
			>
			<span>{project.date.slice(0, 4)} · {t.contexts[project.context]}</span>
		</p>
		<h3><span class="title">{project.title}</span></h3>
		{#if project.award}
			<p class="award"><TrophyIcon /> {project.award[lang]}</p>
		{/if}
		<p class="desc">{project.description[lang]}</p>
		<div class="footer">
			<TechTags tech={project.tech} />
			<ProjectLinks {project} {t} />
		</div>
	</div>
</article>
```

Style block - desktop base, then the M8 phone block kept with the additions marked `/* M9 */`:

```css
	.card {
		display: flex;
		flex-direction: column;
		gap: 1.125rem;
		height: 100%;
	}
	.card > :global(.media) {
		border-radius: var(--radius);
	}
	.body {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.75rem;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.875rem;
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--muted);
	}
	.dom {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--accent);
	}
	h3 {
		margin: 0;
		font-size: 2rem;
		line-height: 1.15;
		font-weight: 800;
		letter-spacing: -0.025em;
	}
	.title {
		background-image: linear-gradient(var(--accent), var(--accent));
		background-size: 0 3px;
		background-repeat: no-repeat;
		background-position: 0 100%;
		transition: background-size 0.3s;
	}
	.award {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		color: var(--accent);
	}
	.desc {
		margin: 0;
		font-size: 1.0625rem;
		color: var(--body);
	}
	.footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-top: auto;
		padding-top: 0.625rem;
		border-top: 1px solid var(--rule);
	}
```

Keep the existing `@media (width < 48rem) { … }` block unchanged and add inside it (M9 - restore the M8 phone card look the desktop base no longer gives):

```css
		.card {
			gap: 0;
			border: 1px solid var(--border);
			border-radius: var(--radius);
			background: var(--surface);
		}
		.dom {
			display: none;
		}
		.desc {
			font-size: inherit;
			color: var(--muted);
		}
		.footer {
			padding-top: 0;
			border-top: 0;
		}
		.title {
			background: none;
		}
```

Replace the two hover blocks at the end with:

```css
	@media (hover: hover) and (pointer: fine) {
		.card:hover .title,
		.card:focus-within .title {
			background-size: 100% 3px;
		}
		.card:hover :global(.frame),
		.card:focus-within :global(.frame) {
			transform: scale(1.05);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.title {
			transition: none;
		}
		.card:hover :global(.frame),
		.card:focus-within :global(.frame) {
			transform: none;
		}
	}
```

- [ ] **Step 6: Small card**

In `src/lib/components/projects/ProjectCardSmall.svelte`: change `<ProjectLinks {project} {t} />` to `<ProjectLinks {project} {t} compact />`, `<DomainIcon domain={project.domains[0]} />` to `<DomainIcon domain={project.domains[0]} size={22} />`, the title `h3` → `h4` (markup and CSS selectors), `<TechTags tech={project.tech} />` → `<TechTags tech={project.tech} small />`, and in the `.meta` paragraph insert after `{t.contexts[project.context]}`: `<span class="dom-name"> · {t.domains[project.domains[0]]}</span>`. Replace the non-phone rules:

```css
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: 100%;
		padding: 1.375rem;
		border: 2px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.icon {
		display: inline-grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		flex: none;
		border-radius: var(--radius-sm);
		background: var(--tint);
		color: var(--accent);
	}
	h4 {
		margin: 0.25rem 0 0;
		font-size: 1.1875rem;
		font-weight: 800;
		line-height: 1.25;
	}
	h4 a {
		color: inherit;
		text-decoration: none;
	}
	h4 a:hover {
		color: var(--accent);
	}
	.meta,
	.award {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--muted);
	}
	.trophy {
		display: none;
	}
	.desc {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--body);
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
	}
	.card > :global(ul) {
		margin-top: auto;
		padding-top: 0.375rem;
	}
```

In the phone block: change `h3` → `h4`, and add `.card { border-width: 1px; } .dom-name { display: none; } .icon { width: auto; height: auto; background: none; }`. Replace the hover blocks with:

```css
	@media (hover: hover) and (pointer: fine) {
		.card {
			transition:
				transform 0.2s,
				border-color 0.2s,
				box-shadow 0.2s;
		}
		.card:hover,
		.card:focus-within {
			transform: translateY(-4px);
			border-color: var(--text);
			box-shadow: 6px 6px 0 var(--accent);
		}
	}
	@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: reduce) {
		.card:hover,
		.card:focus-within {
			transform: none;
		}
	}
```

- [ ] **Step 7: Projects section**

In `src/lib/components/sections/Projects.svelte`: import `fill` from `$lib/i18n/format` and `LARGE_COUNT` from `$lib/projects`; add

```ts
	const lead = $derived(
		fill(t.lead, { total: PROJECTS.length, featured: Math.min(LARGE_COUNT, PROJECTS.length) })
	);
```

change `<Section id="projects" {title}>` to `<Section id="projects" {title} {lead}>`, the empty-state button to `<button type="button" class="btn" onclick=…>`, and replace `<p class="divider">{t.more}</p>` with:

```svelte
			<h3 class="more">{t.more}</h3>
			<p class="more-lead">{t.moreLead}</p>
```

Style changes: `.large { grid-template-columns: repeat(auto-fill, minmax(min(100%, 23.75rem), 1fr)); gap: 3.5rem 2rem; }`, `.small { grid-template-columns: repeat(auto-fill, minmax(min(100%, 16.875rem), 1fr)); gap: 1rem; }`, delete the `max-width: 64rem` rule and the `.divider` rules, keep the phone rule (single column) and add `gap: 1.5rem` to it; add:

```css
	.more {
		margin: 5rem 0 0.375rem;
		font-size: 1.625rem;
		font-weight: 800;
	}
	.more-lead {
		margin: 0 0 1.5rem;
		font-size: 1rem;
		color: var(--muted);
	}
	@media (width < 48rem) {
		.more {
			margin-top: 2.5rem;
		}
	}
```

and in `.empty button` delete the old border/colour rules (the `.btn` class styles it). Delete `src/lib/components/icons/GitHubIcon.svelte` (`git rm`); `grep -rn GitHubIcon src` must print nothing.

- [ ] **Step 8: Check, look, pin the French filters (Review Focus)**

```bash
npm run check && npm test && npm run lint && npm run build
```

Restart preview. Screenshots of `#projects` at 1440/1280, both themes, both languages; a hovered large card and a hovered small card. At 1024px on `/fr/` evaluate:

```js
() => [...document.querySelectorAll('.seg')].every((s) => s.scrollWidth <= s.clientWidth + 1) && document.documentElement.scrollWidth <= innerWidth
```

→ `true`. Click "Hackathon" then "Bas niveau" and check the empty state shows and the reset button works. At 360px: the phone cards and dropdowns look as in M8 (now with three dropdowns).

- [ ] **Step 9: Commit**

```bash
git add src/lib/components/icons/TrophyIcon.svelte src/lib/components/sections/Projects.svelte src/lib/components/projects src/lib/i18n/en.ts src/lib/i18n/fr.ts
git rm src/lib/components/icons/GitHubIcon.svelte
git commit -m "feat: segmented project filters, restyled featured and more-project cards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Skills as tabs

**Files:**
- Modify: `src/lib/skills.ts` (`SkillGroup.description`, `nextTab`), `src/lib/skills.spec.ts`
- Modify: `src/lib/data/skills.ts` (descriptions), `src/lib/data/skills.spec.ts`
- Modify: `src/lib/components/sections/Skills.svelte` (rewrite)
- Modify: `src/routes/[lang=lang]/+page.svelte` (pass `t={t.skills}`)
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts` (`skills` keys)

**Interfaces:**
- Produces: `nextTab(index: number, key: string, count: number): number | null`; `SkillGroup = { id; title: Localized; description: Localized; skills: Skill[] }`; `Dict['skills'] = { lead: string; tabsLabel: string }`; `Skills` props `{ lang; title; t: Dict['skills'] }`.

- [ ] **Step 1: Failing tests**

Append to `src/lib/skills.spec.ts` (add `nextTab` to the import):

```ts
describe('nextTab', () => {
	it('moves down and up, wrapping at both ends', () => {
		expect(nextTab(0, 'ArrowDown', 6)).toBe(1);
		expect(nextTab(5, 'ArrowDown', 6)).toBe(0);
		expect(nextTab(0, 'ArrowUp', 6)).toBe(5);
		expect(nextTab(3, 'ArrowUp', 6)).toBe(2);
	});
	it('jumps to the first and last tab', () => {
		expect(nextTab(3, 'Home', 6)).toBe(0);
		expect(nextTab(3, 'End', 6)).toBe(5);
	});
	it('ignores other keys', () => {
		for (const key of ['ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'a']) expect(nextTab(2, key, 6)).toBeNull();
	});
});
```

In `src/lib/data/skills.spec.ts`, inside `'has non-empty text in both languages'`, after the title assertion add:

```ts
				expect(group.description[lang].trim(), `${group.id} description`).not.toBe('');
```

Run: `npx vitest run src/lib/skills.spec.ts src/lib/data/skills.spec.ts` → FAIL.

- [ ] **Step 2: Implement `nextTab` and the type**

In `src/lib/skills.ts` change the group type to

```ts
export type SkillGroup = {
	id: SkillGroupId;
	title: Localized;
	/** One line shown under the title in the skills panel. */
	description: Localized;
	skills: Skill[];
};
```

and append:

```ts
/**
 * Keyboard rule of the vertical skills tab list: the tab to select and focus after `key`, or
 * null when the key isn't handled. Arrows wrap around; Home/End go to the ends.
 */
export function nextTab(index: number, key: string, count: number): number | null {
	switch (key) {
		case 'ArrowDown':
			return (index + 1) % count;
		case 'ArrowUp':
			return (index - 1 + count) % count;
		case 'Home':
			return 0;
		case 'End':
			return count - 1;
		default:
			return null;
	}
}
```

- [ ] **Step 3: Descriptions in `src/lib/data/skills.ts`**

Add a `description` after each group's `title`:

```ts
		description: {
			en: 'APIs, databases, authentication and services.',
			fr: 'APIs, bases de données, authentification et services.'
		},
```

(backend)

```ts
		description: {
			en: 'Code close to the machine: memory, processes, performance.',
			fr: 'Du code proche de la machine : mémoire, processus, performance.'
		},
```

(systems)

```ts
		description: {
			en: 'Containers, deployment and continuous integration.',
			fr: 'Conteneurs, déploiement et intégration continue.'
		},
```

(devops)

```ts
		description: {
			en: 'Vision models, training and LLM agents.',
			fr: 'Modèles de vision, entraînement et agents LLM.'
		},
```

(ai)

```ts
		description: {
			en: 'Smart contracts, tokens and data anchored on-chain.',
			fr: 'Smart contracts, tokens et données ancrées on-chain.'
		},
```

(blockchain)

```ts
		description: {
			en: 'Web interfaces when a project calls for them.',
			fr: 'Des interfaces web quand le projet le demande.'
		},
```

(frontend). Run the two spec files and `src/lib/i18n/typography.spec.ts` → PASS.

- [ ] **Step 4: Dict keys**

`en.ts`, new top-level entry after `projects`:

```ts
	skills: {
		lead: 'My core: backend, systems and tooling.',
		tabsLabel: 'Skill areas'
	},
```

`fr.ts`:

```ts
	skills: {
		lead: 'Mon cœur de métier : backend, systèmes et outillage.',
		tabsLabel: 'Domaines de compétences'
	},
```

In `src/routes/[lang=lang]/+page.svelte` change `<Skills lang={data.lang} title={t.sections.skills} />` to `<Skills lang={data.lang} title={t.sections.skills} t={t.skills} />`.

- [ ] **Step 5: Rewrite `src/lib/components/sections/Skills.svelte`**

```svelte
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { SKILL_GROUPS } from '$lib/data/skills';
	import type { Dict, Lang } from '$lib/i18n';
	import { logoColor, nextTab, skillName, THEME_BG } from '$lib/skills';
	import Section from '../Section.svelte';
	import SkillGroupIcon from '../skills/SkillGroupIcon.svelte';

	let { lang, title, t }: { lang: Lang; title: string; t: Dict['skills'] } = $props();

	/** False in the prerendered HTML: without JS every group shows, stacked, and there are no tabs. */
	let enhanced = $state(false);
	let selected = $state(0);
	const tabs: HTMLButtonElement[] = [];

	onMount(() => {
		enhanced = true;
	});

	async function onKeydown(event: KeyboardEvent, index: number) {
		const next = nextTab(index, event.key, SKILL_GROUPS.length);
		if (next === null) return;
		event.preventDefault();
		selected = next;
		await tick();
		tabs[next]?.focus();
	}
</script>

<Section id="skills" {title} lead={t.lead}>
	<div class="skills" class:enhanced>
		{#if enhanced}
			<div class="tablist" role="tablist" aria-orientation="vertical" aria-label={t.tabsLabel}>
				{#each SKILL_GROUPS as group, i (group.id)}
					<button
						bind:this={tabs[i]}
						type="button"
						role="tab"
						id="skills-tab-{group.id}"
						class="tab"
						aria-selected={selected === i}
						aria-controls="skills-panel-{group.id}"
						tabindex={selected === i ? 0 : -1}
						onclick={() => (selected = i)}
						onkeydown={(e) => onKeydown(e, i)}
					>
						<span class="ic"><SkillGroupIcon id={group.id} size={22} /></span>
						<span>{group.title[lang]}</span>
						<span class="count" aria-hidden="true">{group.skills.length}</span>
					</button>
				{/each}
			</div>
		{/if}
		<div class="panels">
			{#each SKILL_GROUPS as group, i (group.id)}
				<div
					class="panel"
					id="skills-panel-{group.id}"
					role={enhanced ? 'tabpanel' : undefined}
					aria-labelledby={enhanced ? `skills-tab-${group.id}` : undefined}
					tabindex={enhanced ? 0 : undefined}
					hidden={enhanced && selected !== i}
				>
					<h3 id="skills-{group.id}">{group.title[lang]}</h3>
					<p class="desc">{group.description[lang]}</p>
					<ul role="list" class="tiles">
						{#each group.skills as skill (skillName(skill, 'en'))}
							<li
								style:--logo-dark={logoColor(skill.icon.hex, THEME_BG.dark)}
								style:--logo-light={logoColor(skill.icon.hex, THEME_BG.light)}
							>
								<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
									<path d={skill.icon.path} />
								</svg>
								{skillName(skill, lang)}
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
</Section>

<style>
	.skills.enhanced {
		display: grid;
		grid-template-columns: 18.75rem minmax(0, 1fr);
		gap: 1.75rem;
		align-items: start;
	}
	.panels {
		display: grid;
		gap: 1.25rem;
	}
	.tablist {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.tab {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		width: 100%;
		min-height: 4rem;
		padding: 0.625rem 1rem 0.625rem 0.625rem;
		border: 2px solid transparent;
		border-radius: var(--radius);
		background: transparent;
		color: var(--text);
		font: inherit;
		font-size: 1.125rem;
		font-weight: 700;
		text-align: left;
		cursor: pointer;
		transition:
			background-color 0.2s,
			border-color 0.2s;
	}
	.tab:hover {
		background: var(--surface);
		border-color: var(--border);
	}
	.tab[aria-selected='true'] {
		background: var(--surface);
		border-color: var(--text);
		box-shadow: 5px 5px 0 var(--accent);
	}
	.ic {
		display: inline-grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		flex: none;
		border-radius: var(--radius-sm);
		background: var(--tint);
		color: var(--accent);
	}
	.count {
		margin-left: auto;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--muted);
	}
	.panel {
		padding: 2rem 2.125rem;
		background: var(--surface);
		border: 2px solid var(--border);
		border-radius: var(--radius);
	}
	.enhanced .panel {
		min-height: 30rem;
	}
	h3 {
		margin: 0;
		font-size: 2rem;
		line-height: 1.15;
		font-weight: 800;
		letter-spacing: -0.02em;
	}
	.desc {
		margin: 0.5rem 0 1.5rem;
		font-size: 1.125rem;
		color: var(--body);
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
		gap: 0.625rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.tiles li {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 1rem 1.125rem;
		border-radius: var(--radius);
		background: var(--bg);
		font-size: 1.125rem;
		font-weight: 600;
	}
	/* Brand colour per theme (computed by logoColor); same theme selectors as src/app.css. */
	.tiles svg {
		flex-shrink: 0;
		color: var(--logo-dark);
	}
	:global(:root[data-theme='light']) .tiles svg {
		color: var(--logo-light);
	}
	@media (prefers-color-scheme: light) {
		:global(:root:not([data-theme])) .tiles svg {
			color: var(--logo-light);
		}
	}
	/* Phone (M10 will design it): tabs above the panel, smaller tiles. */
	@media (width < 48rem) {
		.skills.enhanced {
			grid-template-columns: minmax(0, 1fr);
		}
		.enhanced .panel {
			min-height: 0;
		}
		.panel {
			padding: 1.25rem;
		}
		.tiles {
			grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
			gap: 0.5rem;
		}
		.tiles li {
			gap: 0.5rem;
			padding: 0.625rem 0.75rem;
			font-size: 1rem;
		}
		.tiles svg {
			width: 22px;
			height: 22px;
		}
	}
</style>
```

- [ ] **Step 6: Run the unit tests**

Run: `npx vitest run src/lib/skills.spec.ts src/lib/data/skills.spec.ts src/lib/i18n` → PASS; then `npm run check`.

- [ ] **Step 7: Pin keyboard and no-JS behaviour (Review Focus)**

`npm run build`, restart preview. Playwright (scratchpad):
1. `browser.newContext({ javaScriptEnabled: false })` on `/en/`: `await page.locator('#skills .panel').count()` → 6 and none has the `hidden` attribute; no `[role=tablist]`.
2. With JS on `/fr/` at 1440px: focus `#skills-tab-backend` (`.focus()`), press `ArrowDown` → `document.activeElement.id === 'skills-tab-systems'`, its `aria-selected` is `"true"`, `#skills-panel-systems` visible, `#skills-panel-backend` hidden; press `End` → focus on `skills-tab-frontend` (the last tab); press `ArrowDown` → wraps to `skills-tab-backend`; press `ArrowUp` → back to `skills-tab-frontend`. After each key there is exactly one `[role=tab][tabindex="0"]`, and it is the focused one.
3. Screenshots of `#skills` at 1440/1280, both themes and languages, with Backend and Blockchain selected; compare with `Skills-Idee4A` values (tab 64px, selected shadow 5px, panel min-height 480px, tiles min 200px).

- [ ] **Step 8: Commit**

```bash
git add src/lib/skills.ts src/lib/skills.spec.ts src/lib/data/skills.ts src/lib/data/skills.spec.ts src/lib/components/sections/Skills.svelte "src/routes/[lang=lang]/+page.svelte" src/lib/i18n/en.ts src/lib/i18n/fr.ts
git commit -m "feat: skills as vertical tabs with a description per area

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Experience, education and hackathons

**Files:**
- Create: `src/lib/components/icons/MedalIcon.svelte`
- Modify: `src/lib/experience.ts` (`durationMonths`, `durationLabel`; remove `MEDAL_EMOJI`, `quoted`), `src/lib/experience.spec.ts`
- Modify: `src/lib/components/sections/Experience.svelte`, `src/lib/components/experience/JobItem.svelte`, `EducationItem.svelte`, `Period.svelte`
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`, `src/lib/i18n/dicts.spec.ts`

**Interfaces:**
- Consumes: `fill` (Task 2), `TrophyIcon` (Task 4), `TechTags` (Task 4).
- Produces: `durationMonths(start: Month, end: Month): number` (inclusive month count); `durationLabel(months: number, forms: { one: string; other: string }): string`; `MedalIcon` (`{ size?: number }`); dict `experience` = `{ work, education, hackathonsTitle, present, internship, translated, readMore, showLess, results: Record<Medal,string>, months: { one, other }, certificate }`.

- [ ] **Step 1: Failing tests**

In `src/lib/experience.spec.ts`: delete the `describe` block(s) testing `quoted` (and the `quoted` import); add `durationMonths, durationLabel` to the import and append:

```ts
describe('durationMonths', () => {
	it('counts both end months', () => {
		expect(durationMonths('2025-07', '2026-01')).toBe(7);
		expect(durationMonths('2024-10', '2025-04')).toBe(7);
	});
	it('is 1 for a single month', () => {
		expect(durationMonths('2024-03', '2024-03')).toBe(1);
	});
});

describe('durationLabel', () => {
	const forms = { one: '{n} month', other: '{n} months' };
	it('uses the singular for 1 and the plural otherwise', () => {
		expect(durationLabel(1, forms)).toBe('1 month');
		expect(durationLabel(7, forms)).toBe('7 months');
	});
});
```

In `src/lib/i18n/dicts.spec.ts` replace the medal test with:

```ts
	it.each(LANGS)('%s labels every hackathon result', (lang) => {
		for (const m of MEDALS) expect(dicts[lang].experience.results[m], String(m)).toBeTruthy();
	});
```

Run: `npx vitest run src/lib/experience.spec.ts src/lib/i18n/dicts.spec.ts` → FAIL.

- [ ] **Step 2: Implement**

In `src/lib/experience.ts`: delete `MEDAL_EMOJI` and `quoted` (and their doc comments); add `import { fill } from '$lib/i18n/format';` and append:

```ts
/** Months covered by a period, both ends included: 2025-07 → 2026-01 is 7. */
export function durationMonths(start: Month, end: Month): number {
	const [y1, m1] = start.split('-').map(Number);
	const [y2, m2] = end.split('-').map(Number);
	return (y2 - y1) * 12 + (m2 - m1) + 1;
}

/** "1 month" / "7 months" from the dictionary's `{n}` templates. */
export function durationLabel(months: number, forms: { one: string; other: string }): string {
	return fill(months === 1 ? forms.one : forms.other, { n: months });
}
```

`en.ts` `experience`:

```ts
	experience: {
		work: 'Experience',
		education: 'Education',
		hackathonsTitle: 'Hackathons - {n} podiums',
		present: 'Present',
		internship: 'Internship',
		translated: '(translated from French)',
		readMore: 'Read more',
		showLess: 'Show less',
		results: { 1: 'Winner', 2: '2nd place', 3: '3rd place' } satisfies Record<Medal, string>,
		months: { one: '{n} month', other: '{n} months' },
		certificate: 'View certificate'
	},
```

`fr.ts` `experience`:

```ts
	experience: {
		work: 'Expérience',
		education: 'Formation',
		hackathonsTitle: 'Hackathons - {n} podiums',
		present: 'Aujourd’hui',
		internship: 'Stage',
		translated: '(traduit de l’anglais)',
		readMore: 'Lire la suite',
		showLess: 'Réduire',
		results: { 1: 'Vainqueur', 2: '2e place', 3: '3e place' },
		months: { one: '{n} mois', other: '{n} mois' },
		certificate: 'Voir le certificat'
	},
```

(Keep the existing FR `translated` value as it is in the file if it differs.) Run the two specs → PASS.

- [ ] **Step 3: MedalIcon and Period**

Create `src/lib/components/icons/MedalIcon.svelte`:

```svelte
<script lang="ts">
	let { size = 20 }: { size?: number } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<circle cx="12" cy="9" r="6" />
	<path d="M8.5 14 7 22l5-3 5 3-1.5-8" />
</svg>
```

In `Period.svelte` change `{' – '}` to `{' → '}`.

- [ ] **Step 4: JobItem**

Replace the markup of `src/lib/components/experience/JobItem.svelte` (script: remove `quoted` from the import, add `durationLabel, durationMonths`; add `const months = $derived(job.end ? durationLabel(durationMonths(job.start, job.end), t.months) : '');`):

```svelte
<article class="job">
	<p class="when">
		<Period points={periodPoints(job.start, job.end, lang, t.present)} />
		{#if job.internship || months}
			<br />{[job.internship ? t.internship : '', months].filter(Boolean).join(' · ')}
		{/if}
	</p>
	<div class="what">
		<h4>{job.role[lang]}</h4>
		<p class="org">{job.company}</p>
		<ul class="points">
			{#each job.points as point, i (i)}
				<li>{point[lang]}</li>
			{/each}
		</ul>
		<TechTags tech={job.tech} />
		{#if job.quote}
			<figure class="quote">
				<span class="mark" aria-hidden="true">“</span>
				<div>
					<blockquote>
						<p id={quoteId} class:clamp bind:this={quoteEl}>{job.quote.text[lang]}</p>
					</blockquote>
					<figcaption>
						<strong>{job.quote.author}</strong> - {job.quote.role[lang]}
						{#if job.quote.original !== lang}<span class="note">{t.translated}</span>{/if}
					</figcaption>
				</div>
			</figure>
			{#if ready && view.button}
				<button
					type="button"
					class="more"
					aria-expanded={expanded}
					aria-controls={quoteId}
					onclick={() => (expanded = !expanded)}
				>
					{expanded ? t.showLess : t.readMore}
				</button>
			{/if}
		{/if}
	</div>
</article>
```

Style block:

```css
	.job {
		display: grid;
		grid-template-columns: 11.875rem minmax(0, 1fr);
		gap: 0.5rem 2rem;
		padding: 1.75rem 0;
		border-bottom: 1px solid var(--rule);
	}
	.when {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--muted);
	}
	.what {
		min-width: 0;
	}
	h4 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 800;
		line-height: 1.25;
	}
	.org {
		margin: 0.125rem 0 0.75rem;
		font-weight: 700;
		color: var(--accent);
	}
	.points {
		margin: 0 0 0.875rem;
		padding-left: 1.25rem;
		color: var(--body);
	}
	.points li + li {
		margin-top: 0.25rem;
	}
	.quote {
		display: grid;
		grid-template-columns: 2.25rem minmax(0, 1fr);
		gap: 0.5rem;
		margin: 1.25rem 0 0;
		padding: 1.25rem 1.5rem 1.25rem 1rem;
		background: var(--surface);
		border: 2px solid var(--border);
		border-radius: var(--radius);
	}
	.mark {
		font-size: 3.25rem;
		line-height: 0.8;
		font-weight: 800;
		color: var(--accent);
	}
	blockquote {
		margin: 0;
	}
	blockquote p {
		margin: 0;
		font-size: 1.0625rem;
		line-height: 1.55;
	}
	figcaption {
		margin-top: 0.625rem;
		font-size: 0.9375rem;
		color: var(--muted);
	}
	figcaption strong {
		color: var(--text);
	}
	.note {
		display: block;
	}
	.clamp {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}
	.more {
		min-height: var(--tap);
		padding: 0;
		border: none;
		background: none;
		color: var(--accent);
		font: inherit;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
	}
	.more:hover {
		text-decoration: underline;
	}
	@media (width < 48rem) {
		.job {
			grid-template-columns: minmax(0, 1fr);
		}
		.quote {
			padding: 1rem;
		}
	}
```

- [ ] **Step 5: EducationItem**

Replace the markup of `EducationItem.svelte`:

```svelte
<article class="edu">
	<p class="when"><Period points={periodPoints(item.start, item.end, lang, t.present)} /></p>
	<h4>{item.school}</h4>
	<p class="title">{item.title[lang]}</p>
	{#if item.points.length > 0}
		<ul class="points">
			{#each item.points as point, i (i)}
				<li>{point[lang]}</li>
			{/each}
		</ul>
	{/if}
	{#if item.link}
		<a class="cert" href={item.link} target="_blank" rel="noopener noreferrer"
			>{t.certificate} <span aria-hidden="true">↗</span> <span class="sr-only">{newTab}</span></a
		>
	{/if}
</article>
```

Style:

```css
	.edu {
		padding: 1.125rem 0;
		border-bottom: 1px solid var(--rule);
	}
	.when {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--muted);
	}
	h4 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 800;
	}
	.title {
		margin: 0;
		font-weight: 600;
	}
	.points {
		margin: 0.25rem 0 0;
		padding: 0;
		list-style: none;
		font-size: 1rem;
		color: var(--body);
	}
	.cert {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		min-height: 2.25rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text);
	}
	.cert:hover {
		color: var(--accent);
	}
```

- [ ] **Step 6: Experience section**

Replace `src/lib/components/sections/Experience.svelte`:

```svelte
<script lang="ts">
	import { EDUCATION, HACKATHONS, JOBS } from '$lib/data/experience';
	import { hackathonsNewestFirst, localize, newestFirst, yearOf } from '$lib/experience';
	import type { Dict, Lang } from '$lib/i18n';
	import { fill } from '$lib/i18n/format';
	import EducationItem from '../experience/EducationItem.svelte';
	import JobItem from '../experience/JobItem.svelte';
	import MedalIcon from '../icons/MedalIcon.svelte';
	import TrophyIcon from '../icons/TrophyIcon.svelte';
	import Section from '../Section.svelte';

	let {
		lang,
		title,
		t,
		newTab
	}: { lang: Lang; title: string; t: Dict['experience']; newTab: string } = $props();

	const jobs = newestFirst(JOBS);
	const education = newestFirst(EDUCATION);
	const hackathons = hackathonsNewestFirst(HACKATHONS);
</script>

<Section id="experience" {title}>
	<h3 id="experience-work" class="sub">{t.work}</h3>
	<ol role="list" class="list" aria-labelledby="experience-work">
		{#each jobs as job (job.company + job.start)}
			<li><JobItem {job} {lang} {t} /></li>
		{/each}
	</ol>
	<div class="lower">
		<div>
			<h3 id="experience-education" class="sub">{t.education}</h3>
			<ol role="list" class="list" aria-labelledby="experience-education">
				{#each education as item (item.school + item.end)}
					<li><EducationItem {item} {lang} {t} {newTab} /></li>
				{/each}
			</ol>
		</div>
		<div>
			<h3 id="experience-hackathons" class="sub">
				{fill(t.hackathonsTitle, { n: hackathons.length })}
			</h3>
			<ol role="list" class="list" aria-labelledby="experience-hackathons">
				{#each hackathons as h (h.event + h.date)}
					<li class="hk">
						<span class="tile" class:win={h.medal === 1}>
							{#if h.medal === 1}<TrophyIcon size={20} />{:else}<MedalIcon />{/if}
						</span>
						<p class="event">
							<strong
								>{#if h.fullName}<abbr title={h.fullName}>{h.event}</abbr>{:else}{h.event}{/if}</strong
							>
							<span class="detail"
								>{#if h.project}{localize(h.project, lang)} · {/if}<time datetime={h.date}
									>{yearOf(h.date)}</time
								></span
							>
						</p>
						<span class="res" class:win={h.medal === 1}>{t.results[h.medal]}</span>
					</li>
				{/each}
			</ol>
		</div>
	</div>
</Section>

<style>
	.sub {
		margin: 0 0 0.25rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--accent);
	}
	.list {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.lower {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
		gap: 3rem;
		margin-top: 3.5rem;
	}
	.hk {
		display: grid;
		grid-template-columns: 2.75rem minmax(0, 1fr) auto;
		gap: 0.875rem;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--rule);
	}
	.tile {
		display: inline-grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-sm);
		background: var(--tag);
		color: var(--muted);
	}
	.tile.win {
		background: var(--tint);
		color: var(--accent);
	}
	.event {
		margin: 0;
		min-width: 0;
		line-height: 1.35;
	}
	.event strong,
	.detail {
		display: block;
	}
	.detail {
		font-size: 0.9375rem;
		color: var(--muted);
	}
	abbr {
		text-decoration: none;
	}
	.res {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--body);
		white-space: nowrap;
	}
	.res.win {
		font-weight: 800;
		color: var(--accent);
	}
	@media (width < 48rem) {
		.lower {
			margin-top: 2rem;
		}
	}
</style>
```

- [ ] **Step 7: Check and look**

```bash
grep -rn 'MEDAL_EMOJI\|quoted(' src && echo "LEFTOVER" || echo ok
npm run check && npm test && npm run lint && npm run build
```

Expected `ok`. Restart preview; screenshots of `#experience` at 1440/1280, both themes, both languages, and at 800px (below 56.25rem) to check the quote clamp + "Read more" still works; at 1440 both quotes are whole. Check durations read "Internship · 7 months" / « Stage · 7 mois » and periods "Jul 2025 → Jan 2026".

- [ ] **Step 8: Commit**

```bash
git add src/lib/components/icons/MedalIcon.svelte src/lib/experience.ts src/lib/experience.spec.ts src/lib/components/sections/Experience.svelte src/lib/components/experience src/lib/i18n/en.ts src/lib/i18n/fr.ts src/lib/i18n/dicts.spec.ts
git commit -m "feat: experience rows with durations, boxed quotes and hackathon results

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Contact blocks and footer band

**Files:**
- Modify: `src/lib/contact.ts`, `src/lib/contact.spec.ts`
- Modify: `src/lib/data/contact-icons.ts`, `src/lib/data/contact-icons.spec.ts`
- Modify: `src/lib/components/contact/ContactIcon.svelte`, `src/lib/components/sections/Contact.svelte` (rewrite), `src/lib/components/Footer.svelte`
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts` (`contact` keys)

**Interfaces:**
- Consumes: `.btn`, `.btn-primary`, `--malt-tile`, `--footer-bg`, `--footer-text` (Task 1).
- Produces: `contactLinks(lang: Lang, base: string, cvLabel: string): ContactLink[]` returning ids `linkedin`, `github`, `cv` with labels `'LinkedIn'`, `'GitHub'`, `cvLabel`; `BrandIcon.dark?: string` (hex without `#`, used as the dark-theme colour); dict `contact` = `{ intro, cv, byEmail, copy, copied, copyHint, maltLabel, maltTitle, maltText, maltCta }`.

- [ ] **Step 1: Failing tests**

Replace `src/lib/contact.spec.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { PROFILE } from '$lib/data/profile';
import { LANGS } from '$lib/i18n/lang';
import { contactLinks, type ContactLink } from './contact';

const byId = (links: ContactLink[]) => Object.fromEntries(links.map((l) => [l.id, l]));

describe('contactLinks', () => {
	it('lists the tiles under the email and Malt blocks, in order', () => {
		expect(contactLinks('en', '', 'CV (PDF)').map((l) => l.id)).toEqual([
			'linkedin',
			'github',
			'cv'
		]);
	});

	it('labels profiles with their brand name and links them', () => {
		const links = byId(contactLinks('en', '', 'CV'));
		expect(links['linkedin']).toMatchObject({ label: 'LinkedIn', href: PROFILE.linkedin });
		expect(links['github']).toMatchObject({ label: 'GitHub', href: PROFILE.github });
	});

	it('opens every tile in a new tab', () => {
		expect(contactLinks('en', '', 'CV').every((l) => l.external)).toBe(true);
	});

	it('points the CV tile at the file for the language, under base', () => {
		expect(byId(contactLinks('en', '', 'CV (PDF)'))['cv']).toMatchObject({
			label: 'CV (PDF)',
			href: '/cv-en.pdf'
		});
		expect(byId(contactLinks('fr', '/portfolio', 'CV'))['cv'].href).toBe('/portfolio/cv-fr.pdf');
		expect(byId(contactLinks('en', '/portfolio/', 'CV'))['cv'].href).toBe('/portfolio/cv-en.pdf');
	});

	it.each(LANGS)('%s: never has an empty label or href', (lang) => {
		for (const l of contactLinks(lang, '', 'CV')) {
			expect(l.label.trim(), l.id).not.toBe('');
			expect(l.href.trim(), l.id).not.toBe('');
		}
	});
});
```

Append to `src/lib/data/contact-icons.spec.ts` (add `contrastRatio` to the `$lib/skills` import):

```ts
	it('gives LinkedIn a lighter blue on the dark theme', () => {
		const dark = CONTACT_BRANDS.linkedin.dark;
		expect(dark).toMatch(/^[0-9A-F]{6}$/i);
		expect(contrastRatio(dark!, THEME_BG.dark)).toBeGreaterThanOrEqual(4.5);
	});
```

Run: `npx vitest run src/lib/contact.spec.ts src/lib/data/contact-icons.spec.ts` → FAIL.

- [ ] **Step 2: Implement**

`src/lib/contact.ts`: delete `profileHandle`; replace `contactLinks` with:

```ts
/** Tiles under the email and Malt blocks, in display order. `cvLabel` comes from the dictionary. */
export function contactLinks(lang: Lang, base: string, cvLabel: string): ContactLink[] {
	return [
		{ id: 'linkedin', label: 'LinkedIn', href: PROFILE.linkedin, external: true },
		{ id: 'github', label: 'GitHub', href: PROFILE.github, external: true },
		{ id: 'cv', label: cvLabel, href: assetHref(base, PROFILE.cv[lang]), external: true }
	];
}
```

`src/lib/data/contact-icons.ts`: change the type to

```ts
/** A brand logo; `viewBox` crops it when only part of the 24×24 icon is shown (default `0 0 24 24`);
 *  `dark` overrides the colour on the dark theme. */
export type BrandIcon = SkillIcon & { viewBox?: string; dark?: string };
```

and add `dark: '4A9FE8',` to the `linkedin` entry (after `hex`).

`ContactIcon.svelte`: change the `--logo-dark` line to

```svelte
		style:--logo-dark={brand.dark ? `#${brand.dark}` : logoColor(brand.hex, THEME_BG.dark)}
```

Run the two specs → PASS.

- [ ] **Step 3: Dict keys**

`en.ts` `contact`:

```ts
	contact: {
		intro: 'Open to opportunities. Email is the fastest way to reach me.',
		cv: 'CV (PDF)',
		byEmail: 'By email',
		copy: 'Copy address',
		copied: 'Copied!',
		copyHint: 'Press Ctrl+C (⌘C on Mac) to copy.',
		maltLabel: 'Freelance',
		maltTitle: 'Working through Malt?',
		maltText: 'My profile, recommendations and mission requests are on Malt too.',
		maltCta: 'See my Malt profile'
	},
```

`fr.ts` `contact`:

```ts
	contact: {
		intro: 'Ouvert aux opportunités. Le plus rapide pour me joindre, c’est l’e-mail.',
		cv: 'CV (PDF)',
		byEmail: 'Par e-mail',
		copy: 'Copier l’adresse',
		copied: 'Copié !',
		copyHint: 'Appuyez sur Ctrl+C (⌘C sur Mac) pour copier.',
		maltLabel: 'Freelance',
		maltTitle: 'Vous passez par Malt ?',
		maltText:
			'Mon profil, mes recommandations et la prise de contact pour une mission sont aussi sur Malt.',
		maltCta: 'Voir mon profil Malt'
	},
```

- [ ] **Step 4: Rewrite `src/lib/components/sections/Contact.svelte`**

Keep the whole `<script>` (copy/announce logic, `links`, the `ContactIcon` import) and add after `const links = …`:

```ts
	const [local, domain] = PROFILE.email.split('@');
```

Replace the markup and styles:

```svelte
<Section id="contact" {title}>
	<p class="intro">{t.intro}</p>
	<div class="blocks">
		<div class="block mail">
			<p class="label">{t.byEmail}</p>
			<!-- <wbr> lets a narrow screen break the address after the @, not mid-word. -->
			<a class="address" href="mailto:{PROFILE.email}" bind:this={address}
				>{local}@<wbr />{domain}</a
			>
			<button type="button" class="btn btn-primary" onclick={copy}>
				<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
					<g
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="9" y="9" width="12" height="12" rx="2" />
						<path d="M5 15V3h12" />
					</g>
				</svg>
				{copied ? t.copied : t.copy}
			</button>
			{#if failed}<p class="hint">{t.copyHint}</p>{/if}
		</div>
		<div class="block malt">
			<div class="malt-head">
				<span class="malt-ic"><ContactIcon id="malt" size={30} /></span>
				<span class="label">{t.maltLabel}</span>
			</div>
			<p class="malt-title">{t.maltTitle}</p>
			<p class="malt-text">{t.maltText}</p>
			<a class="btn" href={PROFILE.malt} target="_blank" rel="noopener noreferrer">
				{t.maltCta} <span aria-hidden="true">↗</span>
				<span class="sr-only">{newTab}</span>
			</a>
		</div>
	</div>
	<ul class="tiles" role="list">
		{#each links as link (link.id)}
			<li>
				<a class="tile" href={link.href} target="_blank" rel="noopener noreferrer">
					<span class="tile-label"><ContactIcon id={link.id} size={22} />{link.label}</span>
					<span aria-hidden="true">{link.id === 'cv' ? '↓' : '↗'}</span>
					<span class="sr-only">{newTab}</span>
				</a>
			</li>
		{/each}
	</ul>
	<p class="sr-only" aria-live="polite">{announcement}</p>
</Section>

<style>
	.intro {
		margin: 0 0 1.75rem;
		max-width: 40ch;
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.4;
	}
	.blocks {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 23.75rem), 1fr));
		gap: 1.25rem;
	}
	.block {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 1.75rem 2rem;
		background: var(--surface);
		border: 2px solid var(--text);
		border-radius: var(--radius);
	}
	.mail {
		justify-content: space-between;
		gap: 1.125rem;
	}
	.malt {
		gap: 0.875rem;
	}
	.label {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--muted);
	}
	.address {
		max-width: 100%;
		font-size: 1.875rem;
		font-weight: 800;
		line-height: 1.15;
		letter-spacing: -0.02em;
		color: var(--text);
		text-decoration: none;
		overflow-wrap: anywhere;
	}
	.address:hover {
		color: var(--accent);
	}
	.hint {
		margin: 0;
		font-size: 0.875rem;
		color: var(--muted);
	}
	.malt-head {
		display: flex;
		align-items: center;
		gap: 0.875rem;
	}
	.malt-ic {
		display: inline-grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		border-radius: var(--radius-sm);
		background: var(--malt-tile);
	}
	.malt-title {
		margin: 0;
		font-size: 1.625rem;
		font-weight: 800;
		line-height: 1.2;
		letter-spacing: -0.015em;
	}
	.malt-text {
		margin: 0;
		font-size: 1.0625rem;
		color: var(--body);
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 12.5rem), 1fr));
		gap: 1rem;
		margin: 1.25rem 0 0;
		padding: 0;
		list-style: none;
	}
	.tile {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		min-height: 4rem;
		padding: 0 1.25rem;
		background: var(--surface);
		border: 2px solid var(--text);
		border-radius: var(--radius);
		color: var(--text);
		font-size: 1.125rem;
		font-weight: 700;
		text-decoration: none;
	}
	.tile-label {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
	}
	@media (hover: hover) and (pointer: fine) {
		.tile {
			transition:
				background-color 0.2s,
				color 0.2s,
				transform 0.2s,
				box-shadow 0.2s;
		}
		.tile:hover,
		.tile:focus-visible {
			background: var(--text);
			color: var(--on-text);
			transform: translateY(-4px);
			box-shadow: 6px 6px 0 var(--accent);
		}
		/* Logos take the tile's text colour on the dark fill (a --text logo would vanish). */
		.tile:hover :global(svg),
		.tile:focus-visible :global(svg) {
			color: var(--on-text);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tile:hover,
		.tile:focus-visible {
			transform: none;
		}
	}
	@media (width < 48rem) {
		.intro {
			font-size: 1.125rem;
		}
		.block {
			padding: 1.25rem;
		}
		.address {
			font-size: 1.375rem;
		}
	}
</style>
```

In the script, the copy failure branch selects `address` - it is now the `<a>`; `range.selectNodeContents(address)` still works. The old `emailLabel` key is gone; `grep -rn emailLabel src` must print nothing.

- [ ] **Step 5: Footer band**

Replace the `<style>` of `src/lib/components/Footer.svelte` (markup unchanged):

```css
	footer {
		background: var(--footer-bg);
		color: var(--footer-text);
	}
	.inner {
		max-width: 77.5rem;
		min-height: 5.5rem;
		margin: 0 auto;
		padding: 0 2.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem 1rem;
	}
	p {
		margin: 0;
		font-weight: 700;
	}
	a {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		color: var(--footer-text);
		font-weight: 600;
	}
	a:hover {
		opacity: 0.8;
	}
	@media (max-width: 40rem) {
		.inner {
			flex-direction: column;
			justify-content: center;
			padding: 1.5rem 1rem;
			text-align: center;
		}
	}
```

- [ ] **Step 6: Check and look**

```bash
npm run check && npm test && npm run lint && npm run build
```

Restart preview; screenshots of `#contact` + footer at 1440/1280, both themes, both languages, plus a hovered tile in each theme (GitHub logo must stay visible on the filled tile). Click "Copy address" in Chromium with clipboard permission granted (`context.grantPermissions(['clipboard-write'])`) → label turns "Copied!" and the live region text updates.

- [ ] **Step 7: Commit**

```bash
git add src/lib/contact.ts src/lib/contact.spec.ts src/lib/data/contact-icons.ts src/lib/data/contact-icons.spec.ts src/lib/components/contact/ContactIcon.svelte src/lib/components/sections/Contact.svelte src/lib/components/Footer.svelte src/lib/i18n/en.ts src/lib/i18n/fr.ts
git commit -m "feat: email and Malt contact blocks, brand tiles and footer band

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Favicon, share images and per-locale meta

**Files:**
- Create: `static/favicon.svg`, `scripts/ico.ts`, `scripts/ico.spec.ts`, `scripts/og.ts`, `src/lib/static-assets.spec.ts`
- Create (generated, committed): `static/favicon.ico`, `static/apple-touch-icon.png`, `static/og-en.png`, `static/og-fr.png`
- Delete: `src/lib/assets/favicon.svg`
- Modify: `src/routes/+layout.svelte`, `src/routes/[lang=lang]/+page.svelte`, `package.json` (script `og`)
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts` (`meta.locale`, `meta.altLocale`)

**Interfaces:**
- Produces: `icoFromPng(png: Buffer, size: number): Buffer`; `npm run og`; dict `meta.locale` / `meta.altLocale`.

- [ ] **Step 1: Failing tests**

Create `scripts/ico.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { icoFromPng } from './ico.ts';

describe('icoFromPng', () => {
	const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
	const ico = icoFromPng(png, 32);

	it('writes a one-image ICO header', () => {
		expect(ico.readUInt16LE(0)).toBe(0); // reserved
		expect(ico.readUInt16LE(2)).toBe(1); // type: icon
		expect(ico.readUInt16LE(4)).toBe(1); // one image
	});
	it('describes the image and points at the PNG bytes', () => {
		expect(ico.readUInt8(6)).toBe(32);
		expect(ico.readUInt8(7)).toBe(32);
		expect(ico.readUInt32LE(14)).toBe(png.length);
		expect(ico.readUInt32LE(18)).toBe(22);
		expect(ico.subarray(22)).toEqual(png);
	});
});
```

Create `src/lib/static-assets.spec.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LANGS } from '$lib/i18n/lang';

const staticFile = (name: string) =>
	resolve(fileURLToPath(new URL('../../static', import.meta.url)), name);

/** Width and height from a PNG's IHDR chunk. */
function pngSize(name: string): [number, number] {
	const buf = readFileSync(staticFile(name));
	expect(buf.subarray(1, 4).toString(), name).toBe('PNG');
	return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

describe('static icons and share images', () => {
	it('has the SVG favicon, the ICO fallback and the Apple touch icon', () => {
		for (const f of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png'])
			expect(existsSync(staticFile(f)), f).toBe(true);
		expect(pngSize('apple-touch-icon.png')).toEqual([180, 180]);
		expect(readFileSync(staticFile('favicon.ico')).readUInt16LE(2)).toBe(1);
	});

	it('draws the favicon without a web font', () => {
		const svg = readFileSync(staticFile('favicon.svg'), 'utf8');
		expect(svg).not.toMatch(/<text|font-family/);
		expect(svg).toContain('#C2391B');
	});

	it.each(LANGS)('has a 1200×630 share image for %s', (lang) => {
		expect(pngSize(`og-${lang}.png`)).toEqual([1200, 630]);
	});
});
```

Run: `npx vitest run scripts/ico.spec.ts src/lib/static-assets.spec.ts` → FAIL.

- [ ] **Step 2: ICO writer**

Create `scripts/ico.ts`:

```ts
/** Wraps one PNG in an ICO container (ICO files may hold PNG data since Windows Vista). */
export function icoFromPng(png: Buffer, size: number): Buffer {
	const head = Buffer.alloc(22);
	head.writeUInt16LE(0, 0); // reserved
	head.writeUInt16LE(1, 2); // type: icon
	head.writeUInt16LE(1, 4); // image count
	head.writeUInt8(size % 256, 6); // width (0 means 256)
	head.writeUInt8(size % 256, 7); // height
	head.writeUInt8(0, 8); // palette size
	head.writeUInt8(0, 9); // reserved
	head.writeUInt16LE(1, 10); // colour planes
	head.writeUInt16LE(32, 12); // bits per pixel
	head.writeUInt32LE(png.length, 14); // image size
	head.writeUInt32LE(22, 18); // image offset
	return Buffer.concat([head, png]);
}
```

- [ ] **Step 3: The favicon**

Create `static/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
	<rect width="64" height="64" rx="12" fill="#C2391B"/>
	<g fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linejoin="round">
		<path d="M25 15v22a9 9 0 0 1-9 9h-5"/>
		<path d="M37 49V15h8.5a8.5 8.5 0 0 1 0 17H37M44 32l9 17"/>
	</g>
</svg>
```

- [ ] **Step 4: The generator script**

Create `scripts/og.ts`:

```ts
/**
 * Generates static/og-en.png, static/og-fr.png (1200×630 share images), static/apple-touch-icon.png
 * (180×180) and static/favicon.ico (32×32) from static/favicon.svg, with the site font and colours.
 * Run with `npm run og` after changing the favicon, the name or the role; commit the outputs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { PROFILE } from '../src/lib/data/profile.ts';
import { icoFromPng } from './ico.ts';

const LANGS = ['en', 'fr'] as const;
const font = readFileSync(
	'node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2'
).toString('base64');
const favicon = readFileSync('static/favicon.svg', 'utf8');
const svgData = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const FONT_CSS = `@font-face{font-family:S;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:400 900}
*{margin:0;box-sizing:border-box}body{font-family:S,sans-serif}`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function ogHtml(lang: (typeof LANGS)[number]): string {
	return `<!doctype html><html><head><style>${FONT_CSS}</style></head><body>
<div style="width:1200px;height:630px;background:#FAF8F4;color:#141412;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between">
  <img src="${svgData(favicon)}" width="72" height="72" alt="">
  <div>
    <div style="font-size:118px;font-weight:900;line-height:.9;letter-spacing:-.055em;white-space:nowrap">${esc(PROFILE.name)}<span style="color:#C2391B">.</span></div>
    <div style="margin-top:32px;padding-top:28px;border-top:4px solid #141412;font-size:40px;font-weight:800;color:#C2391B">${esc(PROFILE.role[lang])}</div>
  </div>
</div></body></html>`;
}

const iconHtml = (svg: string, size: number) =>
	`<!doctype html><html><head><style>*{margin:0}</style></head><body><img src="${svgData(svg)}" width="${size}" height="${size}" alt=""></body></html>`;

const browser = await chromium.launch();
try {
	const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
	for (const lang of LANGS) {
		await page.setContent(ogHtml(lang));
		await page.evaluate(() => document.fonts.ready);
		writeFileSync(`static/og-${lang}.png`, await page.screenshot({ type: 'png' }));
	}
	// iOS rounds the corners itself: the touch icon is a full square.
	await page.setViewportSize({ width: 180, height: 180 });
	await page.setContent(iconHtml(favicon.replace('rx="12"', 'rx="0"'), 180));
	writeFileSync('static/apple-touch-icon.png', await page.screenshot({ type: 'png' }));
	await page.setViewportSize({ width: 32, height: 32 });
	await page.setContent(iconHtml(favicon, 32));
	const png32 = await page.screenshot({ type: 'png', omitBackground: true });
	writeFileSync('static/favicon.ico', icoFromPng(png32, 32));
} finally {
	await browser.close();
}
console.log('Wrote static/og-en.png, og-fr.png, apple-touch-icon.png, favicon.ico');
```

Add to `package.json` scripts: `"og": "node scripts/og.ts",`.

- [ ] **Step 5: Generate and look**

```bash
npm run og
npx vitest run scripts/ico.spec.ts src/lib/static-assets.spec.ts
```

Expected: PASS. Open (Read tool) `static/og-fr.png`, `static/og-en.png`, `static/apple-touch-icon.png`, and a 16px + 32px rendering of `favicon.svg` on a light and a dark tab background (scratchpad Playwright page, like the brainstorming comparison). Check: "JR" reads as J and R at 16px; letters don't touch; the English role fits on one line in the OG image (if it wraps, reduce its `font-size` to 36px and regenerate). If the letterforms need adjusting, change only the two `<path>` lines of `favicon.svg`, keep white on `#C2391B`, re-run `npm run og`.

- [ ] **Step 6: Wire icons and meta**

`src/routes/+layout.svelte`: remove the `$lib/assets/favicon.svg` import and its `<link>`; add `import { base } from '$app/paths';` and `import { assetHref } from '$lib/paths';`, and in `<svelte:head>`:

```svelte
	<link rel="icon" href={assetHref(base, 'favicon.svg')} type="image/svg+xml" />
	<link rel="icon" href={assetHref(base, 'favicon.ico')} sizes="32x32" />
	<link rel="apple-touch-icon" href={assetHref(base, 'apple-touch-icon.png')} />
```

`git rm src/lib/assets/favicon.svg` (remove the folder if empty).

Dicts: `en.ts` `meta` gains `locale: 'en_US', altLocale: 'fr_FR'`; `fr.ts` `meta` gains `locale: 'fr_FR', altLocale: 'en_US'`.

`src/routes/[lang=lang]/+page.svelte`: add imports `import { assetHref } from '$lib/paths';` and `import { THEME_BG } from '$lib/skills';`, and append to `<svelte:head>`:

```svelte
	<meta property="og:type" content="website" />
	<meta property="og:title" content={t.meta.title} />
	<meta property="og:description" content={t.meta.description} />
	<!-- Relative until M11: link previews need an absolute URL, which needs the domain. -->
	<meta property="og:image" content={assetHref(base, `og-${data.lang}.png`)} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={t.meta.title} />
	<meta property="og:locale" content={t.meta.locale} />
	<meta property="og:locale:alternate" content={t.meta.altLocale} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" media="(prefers-color-scheme: light)" content={THEME_BG.light} />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content={THEME_BG.dark} />
```

- [ ] **Step 7: Check**

```bash
npm run check && npm test && npm run lint && npm run build
grep -o '<meta property="og:[^>]*>' build/fr/index.html
grep -o 'rel="icon"[^>]*' build/en/index.html
```

Expected: the og tags (with `fr_FR`, `og-fr.png`) and both icon links in the prerendered HTML.

- [ ] **Step 8: Commit**

```bash
git add static/favicon.svg static/favicon.ico static/apple-touch-icon.png static/og-en.png static/og-fr.png scripts/ico.ts scripts/ico.spec.ts scripts/og.ts src/lib/static-assets.spec.ts src/routes/+layout.svelte "src/routes/[lang=lang]/+page.svelte" src/lib/i18n/en.ts src/lib/i18n/fr.ts package.json
git rm src/lib/assets/favicon.svg
git commit -m "feat: JR favicon, generated share images and per-locale meta

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Scroll reveal

**Files:**
- Create: `src/lib/reveal.ts`, `src/lib/reveal.spec.ts`, `src/lib/reveal-dom.ts`
- Modify: `src/lib/components/Section.svelte` (`use:reveal`), `src/app.css`

**Interfaces:**
- Consumes: `Section.svelte` (Task 2).
- Produces: `shouldReveal(s: { supported: boolean; reducedMotion: boolean; inViewAtStart: boolean }): boolean`; Svelte action `reveal` (`src/lib/reveal-dom.ts`); CSS classes `.reveal`, `.reveal-pending`.

- [ ] **Step 1: Failing test**

Create `src/lib/reveal.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { shouldReveal } from './reveal';

const ok = { supported: true, reducedMotion: false, inViewAtStart: false };

describe('shouldReveal', () => {
	it('animates a supported, below-the-fold section', () => {
		expect(shouldReveal(ok)).toBe(true);
	});
	it('never hides anything without IntersectionObserver', () => {
		expect(shouldReveal({ ...ok, supported: false })).toBe(false);
	});
	it('respects reduced motion', () => {
		expect(shouldReveal({ ...ok, reducedMotion: true })).toBe(false);
	});
	it('leaves a section already on screen alone (no flash)', () => {
		expect(shouldReveal({ ...ok, inViewAtStart: true })).toBe(false);
	});
});
```

Run: `npx vitest run src/lib/reveal.spec.ts` → FAIL.

- [ ] **Step 2: Implement**

Create `src/lib/reveal.ts`:

```ts
/**
 * Whether a section gets the fade-in-on-scroll: only when the browser can tell us it scrolled
 * into view, the visitor accepts motion, and it isn't already on screen (that would flash).
 */
export function shouldReveal(s: {
	supported: boolean;
	reducedMotion: boolean;
	inViewAtStart: boolean;
}): boolean {
	return s.supported && !s.reducedMotion && !s.inViewAtStart;
}
```

Create `src/lib/reveal-dom.ts`:

```ts
import type { Action } from 'svelte/action';
import { shouldReveal } from './reveal';

/** Fades a section in once, the first time it scrolls into view (see shouldReveal). */
export const reveal: Action<HTMLElement> = (node) => {
	const rect = node.getBoundingClientRect();
	const animate = shouldReveal({
		supported: 'IntersectionObserver' in window,
		reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
		inViewAtStart: rect.top < innerHeight && rect.bottom > 0
	});
	if (!animate) return;
	node.classList.add('reveal', 'reveal-pending');
	const observer = new IntersectionObserver(
		(entries) => {
			if (!entries.some((e) => e.isIntersecting)) return;
			node.classList.remove('reveal-pending');
			observer.disconnect();
		},
		{ rootMargin: '0px 0px -10% 0px' }
	);
	observer.observe(node);
	return {
		destroy() {
			observer.disconnect();
		}
	};
};
```

Append to `src/app.css`:

```css
/* Scroll reveal (src/lib/reveal-dom.ts): only ever added after hydration, never on the hero. */
.reveal {
	transition:
		opacity 0.5s ease-out,
		transform 0.5s ease-out;
}
.reveal-pending {
	opacity: 0;
	transform: translateY(1rem);
}
@media print {
	.reveal-pending {
		opacity: 1;
		transform: none;
	}
}
```

In `Section.svelte` add `import { reveal } from '$lib/reveal-dom';` and change `<section {id} aria-labelledby="{id}-title">` to `<section {id} aria-labelledby="{id}-title" use:reveal>`.

- [ ] **Step 3: Run tests and check**

Run: `npx vitest run src/lib/reveal.spec.ts && npm run check && npm test && npm run build` → PASS.

- [ ] **Step 4: Verify the animation**

Restart preview. Playwright at 1440: on `/en/` scroll section by section (`scrollIntoView`) and screenshot mid-transition and after 700ms: each section ends at `opacity: 1`.

- [ ] **Step 5: Pin "never stays hidden" (Review Focus)**

Playwright:
1. Load `/fr/#contact` directly → after 1s, `getComputedStyle(document.querySelector('#contact')).opacity === '1'`.
2. `page.emulateMedia({ reducedMotion: 'reduce' })` then load `/en/` → no element has `.reveal-pending`.
3. `page.emulateMedia({ media: 'print' })` on `/en/` without scrolling → every `section` has computed opacity `1`.
4. JS disabled (`javaScriptEnabled: false`) → no `.reveal-pending` in the DOM.
5. Click each nav link from the top of the page → the target section is fully visible (opacity 1) within 700ms.

- [ ] **Step 6: Commit**

```bash
git add src/lib/reveal.ts src/lib/reveal.spec.ts src/lib/reveal-dom.ts src/lib/components/Section.svelte src/app.css
git commit -m "feat: fade sections in once as they scroll into view

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Audit, design fidelity check, review guide, PR

**Files:**
- Create: `docs/reviews/milestone-9-review-guide.md`, `docs/reviews/milestone-9/*.png` (selected screenshots)
- Modify: `docs/superpowers/specs/2026-09-23-portfolio-design.md` (only if a deviation was taken during the tasks: record it in the M9 section)

- [ ] **Step 1: Full checks and audit**

```bash
npm run format && npm run lint && npm run check && npm test
npm run audit -- --screens
```

Expected: 0 axe violations (EN/FR × dark/light × 360/1280, menu open, before hydration), no horizontal scroll at 360px, Lighthouse Accessibility / Best Practices / SEO 100 except the existing "pending domain" items, Performance ≥ 95 mobile and desktop. Fix any failure in the component that causes it and re-run (commit fixes as `fix: …`).

- [ ] **Step 2: Computed-style fidelity check**

In the scratchpad, a Playwright script against `vite preview` at 1440×900 that, for each theme (`light`, `dark`) and each language, reads computed styles and compares them with the design values; it prints a table of mismatches (expected: none):

| Selector | Property | Expected |
|---|---|---|
| `body` | `background-color` | light `rgb(250, 248, 244)` / dark `rgb(18, 18, 16)` |
| `#hero h1` | `font-size`, `font-weight` | `122px`, `900` |
| `#hero .role` | `color` | light `rgb(194, 57, 27)` / dark `rgb(255, 127, 94)` |
| `#hero .glance` | `border-top-width`, `background-color` | `2px`, light `rgb(255, 255, 255)` / dark `rgb(26, 25, 22)` |
| `#about .num` | `font-size`, `-webkit-text-stroke-width` | `112px`, `2px` |
| `#about h2` | `font-size`, `font-weight` | `46px`, `800` |
| `.nav` | `height` | `72px` |
| `#projects .large h3` | `font-size` | `32px` |
| `#projects .small h4` | `font-size` | `19px` |
| `#skills .tab[aria-selected=true]` | `box-shadow` | contains `5px 5px 0px` |
| `#skills .panel:not([hidden])` | `min-height` | `480px` |
| `#experience .job h4` | `font-size` | `24px` |
| `#contact .address` | `font-size`, `font-weight` | `30px`, `800` |
| `footer` | `background-color` | light `rgb(20, 20, 18)` / dark `rgb(13, 13, 11)` |
| `body` | `font-family` | starts with `"Schibsted Grotesk Variable"` |

Then screenshot every section at 1440 and 1280, both themes, both languages, and view them next to the artboard values; at 360 and 390px confirm nothing overlaps or overflows (screens from `--screens`).

- [ ] **Step 3: Review guide**

Copy a selection of screenshots (hero light/dark FR, projects, skills with a tab selected, experience, contact, 360px FR light) into `docs/reviews/milestone-9/` and write `docs/reviews/milestone-9-review-guide.md` following the style of `docs/reviews/milestone-8-review-guide.md`: what changed per section; how to run (`npm run dev`, `npm run og`, `npm run audit -- --screens`); the audit table; screenshots; the canvas link for a side-by-side comparison; **Deviations** (counts in filters, whole quotes on desktop, © year in the footer, Schibsted instead of IBM Plex Mono for nav numbers, `min(122px, 9.6vw)` hero name below 1271px, nav numbers hidden at 768–1024px if Task 2 needed it, hackathons newest first, OG images only previewable once the domain exists in M11); manual checks for Jocelyn (real-device feel, theme toggle, keyboard on the skills tabs, copy email, share images in `static/`); and a note that phones are untouched by design until M10.

- [ ] **Step 4: Commit and push, open the PR**

```bash
git add docs/reviews/milestone-9-review-guide.md docs/reviews/milestone-9
git commit -m "docs: add Milestone 9 review guide

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin worktree-milestone-9-desktop-design:milestone-9-desktop-design
gh pr create --base master --head milestone-9-desktop-design \
  --title "Milestone 9: desktop design" \
  --body "$(cat <<'EOF'
New visual identity on desktop, both themes, from the validated Claude Design canvas: tokens and Schibsted Grotesk, numbered section grid, hero with the at-a-glance card and Malt button, segmented project filters, skills as tabs, experience rows, email and Malt contact blocks, JR favicon, share images, per-locale meta, scroll reveal. Phones keep their M8 layouts (M10).

Review guide: docs/reviews/milestone-9-review-guide.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Stop**

Tell Jocelyn the PR link and the review guide, and remind them that their main checkout still has the downloaded icons8 files and a deleted `src/lib/assets/favicon.svg` (not part of the branch): `git restore src/lib/assets/favicon.svg` and delete the icons8 files there, or simply let the merge replace them. Do not merge; the user reviews first.
