# Milestone 7 - Fixes & Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing site solid before the visual/SEO milestone: a mobile menu, an active-section highlight, correct pre-hydration a11y, French typography, a pre-paint `/` redirect, the deferred review minors, and a repeatable `npm run audit` (axe + Lighthouse + overflow) that proves it.

**Architecture:** Every new rule is a pure, unit-tested function (`nav-menu.ts`, `themeOnSystemChange`, `periodPoints`, `frenchSpacingIssues`, `redirectScript`, `audit-report.ts`); components only wire DOM events to them. A tiny browser-only helper `currentSection()` shares the "which section is on screen" rule between the nav highlight and the language switch. The audit is a Node 24 TypeScript script (native type stripping, no `tsx`) that builds, serves `vite preview`, and drives Playwright's Chromium for axe, overflow, screenshots and Lighthouse.

**Tech Stack:** SvelteKit + Svelte 5 runes, TypeScript, Vitest, `adapter-static`; new dev deps `playwright@1.63.0`, `@axe-core/playwright`, `lighthouse`, `chrome-launcher`.

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section "Milestone 7 - Fixes & accessibility". Read it before starting any task.

## Global Constraints

- Runes only (`$props`, `$state`, `$derived`, `$effect`). No `export let`, no `$:`, no stores.
- UI text only in `src/lib/i18n/en.ts` and `fr.ts`; `fr` is typed `Dict`, so every key exists in both (`dicts.spec.ts` enforces it).
- Never hardcode `/en/`: build locale URLs with `localeHref(base, lang)` and `base` from `$app/paths`.
- `lang.ts` must not import the dictionaries.
- Mobile menu breakpoint: links collapse **below `47.5rem` (760px)**; `MENU_BREAKPOINT = '(min-width: 47.5rem)'`.
- French: U+00A0 (written ` ` in source) before `: ; ! ? %` and `»`, after `«`. U+202F is also accepted. No runtime transform.
- Tap targets on touch (`pointer: coarse`): at least `2.75rem` (44px), via the `--tap` token.
- Audit targets: axe **0 violations**; no horizontal scroll at 360px; Lighthouse Accessibility, Best Practices, SEO **= 100**, Performance **≥ 95** (mobile and desktop, `/en/`). SEO audits that need a real domain (`hreflang`, `canonical`) are reported as "pending domain", not faked.
- Keep the inline scripts in sync with their TS twins: `src/app.html` ↔ `resolveTheme`, `redirectScript` ↔ `pickLang` (a test enforces the second).
- Commands run from the worktree root `/home/lezard/portfolio/.claude/worktrees/milestone-7-fixes-a11y`: `npm test`, `npm run check`, `npm run lint`, `npm run build`, `npm run audit`.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Gotcha: `pkill -f <pattern>` kills the Bash tool's own shell when the pattern is in the command line. The audit script starts and kills its own preview server, so you should not need `pkill`.

## Review Focus

1. **Visitor without JS, or before hydration** (slow phone): section links must still be reachable, and the theme button must have the right accessible name on a light OS. Expected: links shown as the scrollable row, no menu button; exactly one label read. Pinned in Task 3 Step 6 (built-HTML check) and Task 8's `no-JS` axe run.
2. **Menu open, then the phone rotates to landscape past 760px** (or the window is widened): the panel must not stay stuck open when the button disappears. Expected: closes. Pinned in Task 1 (`nextMenu(true, 'wide')` test) and Task 1 Step 6 manual check.
3. **Keyboard user opens the menu and presses Escape**: focus must go back to the ☰ button, not to `<body>`. Escape with the menu closed must not steal focus. Pinned in Task 1 reducer tests and Step 6.
4. **Site served under a sub-path** (`base = '/portfolio'`): the `/` redirect must go to `/portfolio/fr/`, not `/fr/`. Pinned in Task 5 `redirect.spec.ts` (sub-path case).
5. **Visitor picked a theme, then the OS switches dark/light**: their choice must win. With no stored choice the page follows the OS live. Pinned in Task 3 `themeOnSystemChange` tests.

---

### Task 1: Mobile menu

**Files:**
- Create: `src/lib/nav-menu.ts`
- Create: `src/lib/nav-menu.spec.ts`
- Modify: `src/lib/components/Nav.svelte` (full rewrite below)
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts` (new `menu` key)
- Modify: `src/app.css` (new `--tap` token)

**Interfaces:**
- Consumes: `SECTIONS` (`src/lib/sections.ts`), `PROFILE`, `Dict`, `Lang`.
- Produces:
  - `type MenuEvent = 'toggle' | 'escape' | 'link' | 'outside' | 'wide'`
  - `type MenuState = { open: boolean; focusButton: boolean }`
  - `nextMenu(open: boolean, event: MenuEvent): MenuState`
  - `MENU_BREAKPOINT = '(min-width: 47.5rem)'`
  - dict key `menu: string` (top level)
  - CSS token `--tap` (`2.25rem`, `2.75rem` under `pointer: coarse`) in `src/app.css`
  - `Nav.svelte` keeps props `{ lang: Lang; t: Dict }`; its `<ul>` has `id="nav-links"`; the button has class `menu-btn` (the audit clicks `.menu-btn`).

- [ ] **Step 1: Install dependencies (the worktree has no `node_modules`)**

Run: `npm ci`
Expected: completes. Then `npm test` passes (baseline).

- [ ] **Step 2: Write the failing test** - `src/lib/nav-menu.spec.ts`

```ts
import { describe, expect, it } from 'vitest';
import { nextMenu } from './nav-menu';

describe('nextMenu', () => {
	it('toggle opens a closed menu and closes an open one, without moving focus', () => {
		expect(nextMenu(false, 'toggle')).toEqual({ open: true, focusButton: false });
		expect(nextMenu(true, 'toggle')).toEqual({ open: false, focusButton: false });
	});

	it('escape closes an open menu and sends focus back to the button', () => {
		expect(nextMenu(true, 'escape')).toEqual({ open: false, focusButton: true });
	});

	it('escape on a closed menu does nothing, so it never steals focus', () => {
		expect(nextMenu(false, 'escape')).toEqual({ open: false, focusButton: false });
	});

	it.each(['link', 'outside', 'wide'] as const)('%s closes the menu without moving focus', (e) => {
		expect(nextMenu(true, e)).toEqual({ open: false, focusButton: false });
		expect(nextMenu(false, e)).toEqual({ open: false, focusButton: false });
	});
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/lib/nav-menu.spec.ts`
Expected: FAIL, cannot resolve `./nav-menu`.

- [ ] **Step 4: Implement** - `src/lib/nav-menu.ts`

```ts
/** What can happen to the mobile nav menu. */
export type MenuEvent = 'toggle' | 'escape' | 'link' | 'outside' | 'wide';

/** `focusButton`: move focus back to the menu button (after Escape closed the menu). */
export type MenuState = { open: boolean; focusButton: boolean };

/** At and above this width the links show inline and the menu button is hidden. Keep in sync with Nav.svelte's CSS. */
export const MENU_BREAKPOINT = '(min-width: 47.5rem)';

/**
 * Next menu state. Everything but the button closes the menu; Escape also returns focus to
 * the button, but only when it actually closed the menu.
 */
export function nextMenu(open: boolean, event: MenuEvent): MenuState {
	if (event === 'toggle') return { open: !open, focusButton: false };
	return { open: false, focusButton: event === 'escape' && open };
}
```

Run: `npx vitest run src/lib/nav-menu.spec.ts`
Expected: PASS.

- [ ] **Step 5: Add the `menu` key, the `--tap` token, and rewrite the nav**

In `src/lib/i18n/en.ts`, right after `navLabel: 'Main',` add:

```ts
	/** Accessible name of the mobile menu button; its open/closed state comes from aria-expanded. */
	menu: 'Menu',
```

In `src/lib/i18n/fr.ts`, right after `navLabel: 'Principale',` add:

```ts
	menu: 'Menu',
```

In `src/app.css`, inside the first `:root { … }` block, after `--radius: 0.75rem;` add `--tap: 2.25rem;`, and after that whole block add:

```css
/* Touch screens: controls at least 44px so they are easy to hit. */
@media (pointer: coarse) {
	:root {
		--tap: 2.75rem;
	}
}
```

Replace `src/lib/components/Nav.svelte` with:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import { MENU_BREAKPOINT, nextMenu, type MenuEvent } from '$lib/nav-menu';
	import { SECTIONS } from '$lib/sections';
	import LangSwitch from './LangSwitch.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { lang, t }: { lang: Lang; t: Dict } = $props();

	let open = $state(false);
	/** False until hydration: without JS the button stays hidden and the links stay a scrollable row. */
	let enhanced = $state(false);
	let header: HTMLElement | undefined = $state();
	let button: HTMLButtonElement | undefined = $state();

	function send(event: MenuEvent) {
		const next = nextMenu(open, event);
		open = next.open;
		if (next.focusButton) button?.focus();
	}

	onMount(() => {
		enhanced = true;
		const wide = matchMedia(MENU_BREAKPOINT);
		const onWide = () => {
			if (wide.matches) send('wide');
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') send('escape');
		};
		const onPointer = (e: PointerEvent) => {
			if (open && !header?.contains(e.target as Node)) send('outside');
		};
		wide.addEventListener('change', onWide);
		document.addEventListener('keydown', onKey);
		document.addEventListener('pointerdown', onPointer);
		return () => {
			wide.removeEventListener('change', onWide);
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('pointerdown', onPointer);
		};
	});
</script>

<header class="nav" class:enhanced bind:this={header}>
	<a class="brand" href="#hero">{PROFILE.name}</a>
	<nav aria-label={t.navLabel}>
		<button
			bind:this={button}
			type="button"
			class="menu-btn"
			aria-expanded={open}
			aria-controls="nav-links"
			aria-label={t.menu}
			onclick={() => send('toggle')}
		>
			<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
				<path
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					d={open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'}
				/>
			</svg>
		</button>
		<ul id="nav-links" role="list" class:open>
			{#each SECTIONS as id (id)}
				<li><a href="#{id}" onclick={() => send('link')}>{t.nav[id]}</a></li>
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
		white-space: nowrap;
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
	.menu-btn {
		display: none;
		place-items: center;
		width: var(--tap);
		height: var(--tap);
		border: 1px solid var(--border);
		border-radius: 50%;
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
	}
	.menu-btn:hover {
		border-color: var(--accent);
	}
	/* Below 47.5rem (MENU_BREAKPOINT), once hydrated: links collapse into a panel under the bar. */
	@media (max-width: 47.49rem) {
		.enhanced nav {
			display: flex;
			justify-content: flex-end;
			overflow: visible;
		}
		.enhanced .menu-btn {
			display: grid;
		}
		.enhanced ul {
			display: none;
			position: absolute;
			top: var(--nav-h);
			left: 0;
			right: 0;
			flex-direction: column;
			gap: 0;
			padding: 0.5rem 1rem 1rem;
			background: var(--bg);
			border-bottom: 1px solid var(--border);
		}
		.enhanced ul.open {
			display: flex;
		}
		.enhanced ul a {
			display: flex;
			align-items: center;
			min-height: 2.75rem;
		}
	}
</style>
```

Run: `npm test && npm run check`
Expected: all tests pass (including `dicts.spec.ts` with the new key); 0 errors, 0 warnings.

- [ ] **Step 6: Check it in the browser**

Run `npm run build`, then in the background: `bash -c 'cd /home/lezard/portfolio/.claude/worktrees/milestone-7-fixes-a11y && exec ./node_modules/.bin/vite preview --port 4181 --strictPort'`. With Playwright (`import { chromium } from 'playwright'` from a scratchpad script; the dependency lands in Task 8, so until then use the scratchpad install described in the `visual-check-playwright` memory), at 360×800 on `/en/`:
- the bar shows brand, ☰, FR, theme; no link row;
- click `.menu-btn` → `aria-expanded="true"`, 5 links visible stacked; screenshot it;
- press Escape → panel hidden, `document.activeElement` is the `.menu-btn`;
- open again, click a link → panel hidden, page scrolled to that section;
- open again, `page.setViewportSize({ width: 1024, height: 800 })` → links inline, `aria-expanded="false"`;
- with `javaScriptEnabled: false` at 360px: no ☰, the links row is present (scrollable).

Stop the preview server afterwards (kill the background task).

- [ ] **Step 7: Commit**

```bash
git add src/lib/nav-menu.ts src/lib/nav-menu.spec.ts src/lib/components/Nav.svelte src/lib/i18n/en.ts src/lib/i18n/fr.ts src/app.css
git commit -m "feat: collapse nav links behind a menu button on small screens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Active-section highlight and LangSwitch modifier guard

**Files:**
- Create: `src/lib/sections-dom.ts`
- Modify: `src/lib/components/LangSwitch.svelte`
- Modify: `src/lib/components/Nav.svelte`

**Interfaces:**
- Consumes: `sectionInView(tops, navHeight, atBottom)`, `isAtBottom(scrollY, viewportHeight, pageHeight)`, `SECTIONS`, `SectionId` (`src/lib/sections.ts`, already tested in `sections.spec.ts`); `Nav.svelte` from Task 1.
- Produces: `currentSection(): SectionId | null` (browser only).

No new unit test: `currentSection()` only reads the DOM and delegates to the already-tested `sectionInView` / `isAtBottom`. It is checked in the browser in Step 4.

- [ ] **Step 1: Extract the shared helper** - `src/lib/sections-dom.ts`

```ts
import { isAtBottom, sectionInView, SECTIONS, type SectionId } from './sections';

/**
 * The section on screen right now (browser only). One rule for the nav highlight and the
 * language switch, so they always agree. The nav height is the page's scroll-padding-top.
 */
export function currentSection(): SectionId | null {
	const tops = Object.fromEntries(
		SECTIONS.map((id) => [id, document.getElementById(id)?.getBoundingClientRect().top ?? Infinity])
	) as Record<SectionId, number>;
	const navHeight = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
	const atBottom = isAtBottom(scrollY, innerHeight, document.documentElement.scrollHeight);
	return sectionInView(tops, navHeight, atBottom);
}
```

- [ ] **Step 2: Use it in LangSwitch, and let Alt-clicks through**

In `src/lib/components/LangSwitch.svelte`, replace the `$lib/sections` import with:

```ts
	import { savePendingSection, takePendingSection } from '$lib/sections';
	import { currentSection } from '$lib/sections-dom';
```

and replace the whole `onclick` function (with its comment) with:

```ts
	// Remember the section on screen (not the stale #hash left by the last nav click).
	// Modified clicks (new tab, new window, download) keep their normal browser behaviour.
	function onclick(e: MouseEvent) {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
		e.preventDefault();
		savePendingSection(() => sessionStorage, currentSection());
		location.assign(href);
	}
```

- [ ] **Step 3: Highlight the current link in the nav**

In `src/lib/components/Nav.svelte`:

Replace `import { SECTIONS } from '$lib/sections';` with:

```ts
	import { SECTIONS, type SectionId } from '$lib/sections';
	import { currentSection } from '$lib/sections-dom';
```

After `let button: HTMLButtonElement | undefined = $state();` add:

```ts
	/** Section on screen; null on the hero. */
	let active = $state<SectionId | null>(null);
```

Inside `onMount`, right after `enhanced = true;` add:

```ts
		// Recompute at most once per frame while scrolling or resizing.
		let frame = 0;
		const track = () => {
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				active = currentSection();
			});
		};
		active = currentSection();
		addEventListener('scroll', track, { passive: true });
		addEventListener('resize', track);
```

and inside the returned cleanup function add, before its closing brace:

```ts
			removeEventListener('scroll', track);
			removeEventListener('resize', track);
			cancelAnimationFrame(frame);
```

Replace the link line inside `{#each SECTIONS …}` with:

```svelte
				<li>
					<a
						href="#{id}"
						aria-current={active === id ? 'true' : undefined}
						onclick={() => send('link')}>{t.nav[id]}</a
					>
				</li>
```

In the `<style>` block, after the `nav a:hover { … }` rule add:

```css
	nav a[aria-current] {
		color: var(--text);
		text-decoration: underline 2px var(--accent);
		text-underline-offset: 0.4em;
	}
```

Run: `npm test && npm run check`
Expected: all pass; 0 errors, 0 warnings.

- [ ] **Step 4: Check it in the browser**

Build and preview as in Task 1 Step 6. At 1280px on `/en/`:
- at the top (hero): no link has `aria-current`;
- `page.click('a[href="#skills"]')`, wait 800 ms → only the Skills link has `aria-current="true"` and is underlined (screenshot the nav);
- scroll to the very bottom → Contact is current;
- scroll to the middle of Projects, click FR → the French page glides to Projects (language switch still works through `currentSection`).
- at 360px with the menu open, the current section's link is underlined in the panel.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sections-dom.ts src/lib/components/LangSwitch.svelte src/lib/components/Nav.svelte
git commit -m "feat: highlight the section in view in the nav

Share the on-screen section rule between the nav and the language
switch, and let Alt-clicks on the language switch through.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Theme follows the OS live; correct label from first paint

**Files:**
- Modify: `src/lib/theme.ts`
- Modify: `src/lib/theme.spec.ts`
- Modify: `src/lib/components/ThemeToggle.svelte` (full rewrite below)

**Interfaces:**
- Consumes: `resolveTheme`, `nextTheme`, `THEME_KEY`, `Theme` (`src/lib/theme.ts`); `--tap` token (Task 1).
- Produces: `themeOnSystemChange(stored: string | null, prefersDark: boolean): Theme | null`.

- [ ] **Step 1: Write the failing test** - append to `src/lib/theme.spec.ts` (and add `themeOnSystemChange` to its import from `./theme`)

```ts
describe('themeOnSystemChange', () => {
	it('follows the OS when the visitor never picked a theme', () => {
		expect(themeOnSystemChange(null, true)).toBe('dark');
		expect(themeOnSystemChange(null, false)).toBe('light');
	});
	it('treats an invalid stored value as no choice', () => {
		expect(themeOnSystemChange('blue', false)).toBe('light');
	});
	it("keeps the visitor's own choice (returns null: nothing to change)", () => {
		expect(themeOnSystemChange('dark', false)).toBeNull();
		expect(themeOnSystemChange('light', true)).toBeNull();
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/theme.spec.ts`
Expected: FAIL, `themeOnSystemChange` is not exported.

- [ ] **Step 3: Implement** - append to `src/lib/theme.ts`

```ts
/** Theme to apply when the OS preference changes, or null when the visitor picked one (their choice wins). */
export function themeOnSystemChange(stored: string | null, prefersDark: boolean): Theme | null {
	return stored === 'dark' || stored === 'light' ? null : resolveTheme(null, prefersDark);
}
```

Run: `npx vitest run src/lib/theme.spec.ts`
Expected: PASS.

- [ ] **Step 4: Rewrite the toggle** - `src/lib/components/ThemeToggle.svelte`

The accessible name now comes from two visually hidden spans, one of them `display: none` per theme (so it is out of the accessibility tree), chosen by the same CSS selectors as the icons. That is correct from the first paint; the old `aria-label` was wrong until hydration on a light OS. The `title` tooltip is only set after hydration.

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Dict } from '$lib/i18n';
	import { nextTheme, THEME_KEY, themeOnSystemChange, type Theme } from '$lib/theme';

	let { t }: { t: Dict['theme'] } = $props();

	let theme = $state<Theme>('dark');
	let mounted = $state(false);

	function apply(next: Theme) {
		theme = next;
		document.documentElement.dataset.theme = next;
	}

	function stored(): string | null {
		try {
			return localStorage.getItem(THEME_KEY);
		} catch {
			return null; // storage blocked: behave as if nothing was chosen
		}
	}

	onMount(() => {
		theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
		mounted = true;
		const dark = matchMedia('(prefers-color-scheme: dark)');
		const onSystemChange = () => {
			const next = themeOnSystemChange(stored(), dark.matches);
			if (next) apply(next);
		};
		dark.addEventListener('change', onSystemChange);
		return () => dark.removeEventListener('change', onSystemChange);
	});

	function toggle() {
		apply(nextTheme(theme));
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
	title={mounted ? (theme === 'dark' ? t.toLight : t.toDark) : undefined}
>
	<span class="sr-only to-light">{t.toLight}</span>
	<span class="sr-only to-dark">{t.toDark}</span>
	<svg class="icon-sun" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
		<circle cx="12" cy="12" r="4" fill="currentColor" />
		<path
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
		/>
	</svg>
	<svg class="icon-moon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
		<path fill="currentColor" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
	</svg>
</button>

<style>
	.icon-btn {
		display: grid;
		place-items: center;
		width: var(--tap);
		height: var(--tap);
		border: 1px solid var(--border);
		border-radius: 50%;
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
	}
	.icon-btn:hover {
		border-color: var(--accent);
	}
	/* Correct icon and label from first paint: keyed on the html[data-theme] the inline
	   no-flash script sets, with a prefers-color-scheme fallback for no-JS.
	   Dark theme (default): sun icon, "switch to light" label. */
	.icon-moon,
	.to-dark {
		display: none;
	}
	:global(:root[data-theme='light']) .icon-sun,
	:global(:root[data-theme='light']) .to-light {
		display: none;
	}
	:global(:root[data-theme='light']) .icon-moon {
		display: block;
	}
	:global(:root[data-theme='light']) .to-dark {
		display: inline;
	}
	@media (prefers-color-scheme: light) {
		:global(:root:not([data-theme])) .icon-sun,
		:global(:root:not([data-theme])) .to-light {
			display: none;
		}
		:global(:root:not([data-theme])) .icon-moon {
			display: block;
		}
		:global(:root:not([data-theme])) .to-dark {
			display: inline;
		}
	}
</style>
```

Run: `npm test && npm run check`
Expected: all pass; 0 errors, 0 warnings.

- [ ] **Step 5: Check live OS switching in the browser**

Build and preview. In Playwright at 1280px on `/en/` with `colorScheme: 'dark'`:
- `page.emulateMedia({ colorScheme: 'light' })` → `document.documentElement.dataset.theme === 'light'` without reload;
- click the toggle (stores `dark`), then `emulateMedia({ colorScheme: 'light' })` → theme stays `dark`.
- In both themes, `page.getByRole('button', { name: 'Switch to light theme' })` / `'Switch to dark theme'` matches exactly one button (the right one for the theme).

- [ ] **Step 6: Check the pre-hydration HTML**

Run: `grep -o '<button[^>]*class="icon-btn[^"]*"[^>]*>' build/en/index.html`
Expected: no `aria-label` and no `title` on the button. Then in Playwright with `javaScriptEnabled: false` and `colorScheme: 'light'`: `page.getByRole('button', { name: 'Switch to dark theme' })` has count 1 and `'Switch to light theme'` has count 0.

- [ ] **Step 7: Commit**

```bash
git add src/lib/theme.ts src/lib/theme.spec.ts src/lib/components/ThemeToggle.svelte
git commit -m "fix: follow OS theme changes live and label the toggle from first paint

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Skip link, list semantics, `<time>` dates

**Files:**
- Modify: `src/lib/experience.ts`, `src/lib/experience.spec.ts`
- Create: `src/lib/components/experience/Period.svelte`
- Modify: `src/lib/components/experience/JobItem.svelte`, `EducationItem.svelte`
- Modify: `src/lib/components/sections/Experience.svelte`, `About.svelte`, `Contact.svelte`, `Projects.svelte`, `Skills.svelte`
- Modify: `src/lib/components/projects/TechTags.svelte`
- Modify: `src/routes/[lang=lang]/+page.svelte`
- Modify: `src/lib/i18n/en.ts`, `fr.ts` (new `skipToContent` key)
- Modify: `src/app.css`

**Interfaces:**
- Consumes: `formatPoint` (private) and `formatPeriod` (`src/lib/experience.ts`).
- Produces:
  - `type PeriodPoint = { text: string; datetime?: string }`
  - `periodPoints(start: string | undefined, end: string | undefined, lang: Lang, present: string): PeriodPoint[]`
  - `formatPeriod` unchanged in signature and output.
  - `Period.svelte` props `{ points: PeriodPoint[] }`.
  - dict key `skipToContent: string` (top level); `<main id="main" tabindex="-1">`.

- [ ] **Step 1: Write the failing test** - in `src/lib/experience.spec.ts`, add `periodPoints` to the import and add:

```ts
describe('periodPoints', () => {
	it('gives each end of a range its text and machine-readable date', () => {
		expect(periodPoints('2025-07', '2026-01', 'en', 'Present')).toEqual([
			{ text: 'Jul 2025', datetime: '2025-07' },
			{ text: 'Jan 2026', datetime: '2026-01' }
		]);
	});
	it('gives "present" no date', () => {
		expect(periodPoints('2026-02', undefined, 'fr', 'Aujourd’hui')).toEqual([
			{ text: 'févr. 2026', datetime: '2026-02' },
			{ text: 'Aujourd’hui' }
		]);
	});
	it('collapses to one point when there is no start or start equals end', () => {
		expect(periodPoints(undefined, '2024', 'en', 'Present')).toEqual([
			{ text: '2024', datetime: '2024' }
		]);
		expect(periodPoints('2024', '2024', 'en', 'Present')).toEqual([
			{ text: '2024', datetime: '2024' }
		]);
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/experience.spec.ts`
Expected: FAIL, `periodPoints` is not exported.

- [ ] **Step 3: Implement** - in `src/lib/experience.ts`, replace the whole `formatPeriod` function (with its comment) with:

```ts
/** One end of a period: display text, plus a `<time datetime>` value unless it is "present". */
export type PeriodPoint = { text: string; datetime?: string };

/** The one or two ends of a period, in order; a missing end reads as `present`. */
export function periodPoints(
	start: string | undefined,
	end: string | undefined,
	lang: Lang,
	present: string
): PeriodPoint[] {
	const to: PeriodPoint =
		end === undefined ? { text: present } : { text: formatPoint(end, lang), datetime: end };
	if (start === undefined || start === end) return [to];
	return [{ text: formatPoint(start, lang), datetime: start }, to];
}

/** "Jul 2025 – Jan 2026", "2022 – 2026", "2024"; a missing end reads as `present`. */
export function formatPeriod(
	start: string | undefined,
	end: string | undefined,
	lang: Lang,
	present: string
): string {
	return periodPoints(start, end, lang, present)
		.map((p) => p.text)
		.join(' – ');
}
```

Run: `npx vitest run src/lib/experience.spec.ts`
Expected: PASS (the existing `formatPeriod` tests still pass unchanged).

- [ ] **Step 4: Render periods with `<time>`**

Create `src/lib/components/experience/Period.svelte`:

```svelte
<script lang="ts">
	import type { PeriodPoint } from '$lib/experience';

	let { points }: { points: PeriodPoint[] } = $props();
</script>

{#each points as point, i (i)}{#if i > 0}{' – '}{/if}{#if point.datetime}<time
			datetime={point.datetime}>{point.text}</time
		>{:else}{point.text}{/if}{/each}
```

In `src/lib/components/experience/JobItem.svelte`:
- replace `import { formatPeriod, quoted, type Job } from '$lib/experience';` with `import { periodPoints, quoted, type Job } from '$lib/experience';` and add `import Period from './Period.svelte';`
- replace the `const period = $derived(…);` statement with nothing (delete it);
- replace `<p class="period">{period}</p>` with:

```svelte
	<p class="period">
		<Period points={periodPoints(job.start, job.end, lang, t.present)} />{#if job.internship}{' · '}{t.internship}{/if}
	</p>
```

In `src/lib/components/experience/EducationItem.svelte`:
- replace `import { formatPeriod, type Education } from '$lib/experience';` with `import { periodPoints, type Education } from '$lib/experience';` and add `import Period from './Period.svelte';`
- replace `<p class="period">{formatPeriod(item.start, item.end, lang, t.present)}</p>` with `<p class="period"><Period points={periodPoints(item.start, item.end, lang, t.present)} /></p>`.

In `src/lib/components/sections/Experience.svelte`, replace the line `{yearOf(h.date)}` inside `.event` with `<time datetime={h.date}>{yearOf(h.date)}</time>`.

- [ ] **Step 5: Keep list semantics on unstyled lists**

Add `role="list"` (Safari/VoiceOver drops list semantics on `list-style: none`) to each of these elements:
- `src/lib/components/sections/About.svelte`: `<ul class="facts">` → `<ul class="facts" role="list">`
- `src/lib/components/sections/Contact.svelte`: `<ul class="tiles">` → `<ul class="tiles" role="list">`
- `src/lib/components/sections/Projects.svelte`: `<ul class="grid large">` and `<ul class="grid small">` → add `role="list"` to both
- `src/lib/components/sections/Skills.svelte`: the `<ul>` inside each group → `<ul role="list">`
- `src/lib/components/projects/TechTags.svelte`: `<ul>` → `<ul role="list">`
- `src/lib/components/sections/Experience.svelte`: the three `<ol class="timeline …"` → add `role="list"` to each

(The nav `<ul>` already got it in Task 1.) Then confirm none is missing:

Run: `grep -rl "list-style: none" src --include='*.svelte' | xargs grep -L 'role="list"'`
Expected: no output.

- [ ] **Step 6: Add the skip link**

In `src/lib/i18n/en.ts`, right after `navLabel: 'Main',` add `skipToContent: 'Skip to content',`. In `fr.ts`, right after `navLabel: 'Principale',` add `skipToContent: 'Aller au contenu',`.

In `src/routes/[lang=lang]/+page.svelte`, put this line right before `<Nav lang={data.lang} {t} />`:

```svelte
<a class="skip-link" href="#main">{t.skipToContent}</a>
```

and replace `<main>` with `<main id="main" tabindex="-1">`.

In `src/app.css`, after the `.sr-only` rule add:

```css
/* First focusable element: hidden until a keyboard user tabs to it. */
.skip-link {
	position: fixed;
	top: 0.5rem;
	left: 0.5rem;
	z-index: 20;
	padding: 0.5rem 1rem;
	border-radius: var(--radius);
	background: var(--accent);
	color: var(--bg);
	font-weight: 600;
	transform: translateY(-200%);
}
.skip-link:focus {
	transform: none;
}

/* <main> takes focus from the skip link; the outline would frame the whole page. */
main:focus {
	outline: none;
}
```

Run: `npm test && npm run check && npm run build`
Expected: all pass; build succeeds. Then: `grep -o '<time datetime="[^"]*">[^<]*</time>' build/en/index.html | head -3` shows e.g. `<time datetime="2025-07">Jul 2025</time>`, and `grep -c 'role="list"' build/en/index.html` is at least 12.

- [ ] **Step 7: Check in the browser**

Preview; at 1280px on `/en/`: press Tab once → the skip link is visible at top-left (screenshot); press Enter → `document.activeElement.id === 'main'`; press Tab again → focus lands on the first focusable element inside `<main>` (the "See projects" button), not on the nav. The Experience periods read the same as before ("Jul 2025 – Jan 2026 · Internship").

- [ ] **Step 8: Commit**

```bash
git add -A src
git commit -m "feat: add a skip link, keep list semantics and mark up dates with time

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: `/` redirect before first paint

**Files:**
- Create: `src/lib/i18n/redirect.ts`
- Create: `src/lib/i18n/redirect.spec.ts`
- Modify: `src/lib/i18n/lang.ts` (comment only)
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: `LANGS`, `pickLang`, `localeHref` (`src/lib/i18n/lang.ts`); `en.meta.title`.
- Produces: `redirectScript(base: string): string` - the body of an inline `<script>` (no tags).

- [ ] **Step 1: Write the failing test** - `src/lib/i18n/redirect.spec.ts`

The script is plain ES5 run before any bundle; the test runs it against fake `navigator`/`location` and requires the same result as the tested `pickLang`, so the two cannot drift.

```ts
import { describe, expect, it } from 'vitest';
import { localeHref, pickLang } from './lang';
import { redirectScript } from './redirect';

/** Runs the inline script with a fake browser and returns the URL it redirected to. */
function run(base: string, languages: string[] | undefined, language: string): string {
	let target = '';
	const navigator = { languages, language };
	const location = { replace: (url: string) => (target = url) };
	new Function('navigator', 'location', redirectScript(base))(navigator, location);
	return target;
}

const cases: [string[] | undefined, string][] = [
	[['fr-FR', 'en-US'], 'fr-FR'],
	[['en-GB', 'fr'], 'en-GB'],
	[['de-DE', 'fr-CA'], 'de-DE'],
	[['de-DE', 'es'], 'de-DE'],
	[['FR'], 'FR'],
	[[], 'fr-BE'],
	[undefined, 'fr']
];

describe('redirectScript', () => {
	it.each(cases)('agrees with pickLang for languages %j (language %s)', (languages, language) => {
		const prefs = languages?.length ? languages : [language];
		expect(run('', languages, language)).toBe(localeHref('', pickLang(prefs)));
	});

	it('keeps a sub-path base', () => {
		expect(run('/portfolio', ['fr-FR'], 'fr-FR')).toBe('/portfolio/fr/');
	});

	it('keeps a relative base (prerendered pages use relative paths)', () => {
		expect(run('.', ['en'], 'en')).toBe('./en/');
	});

	it('cannot break out of the script tag or the string', () => {
		expect(redirectScript('</script><x>"\'')).not.toContain('</script>');
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/i18n/redirect.spec.ts`
Expected: FAIL, cannot resolve `./redirect`.

- [ ] **Step 3: Implement** - `src/lib/i18n/redirect.ts`

```ts
import { LANGS } from './lang';

/** JSON for a JS literal inside an HTML <script>: `<` escaped so the text can't close the tag. */
const literal = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

/**
 * Body of the inline script on `/`: sends the visitor to their language before first paint.
 * Duplicates pickLang() on purpose, because it runs before any bundle loads; redirect.spec.ts
 * runs it against pickLang so the two stay in sync.
 */
export function redirectScript(base: string): string {
	return (
		`(function(){var L=${literal(LANGS)},n=navigator,` +
		`p=n.languages&&n.languages.length?n.languages:[n.language],l='en';` +
		`for(var i=0;i<p.length;i++){var b=String(p[i]).toLowerCase().split('-')[0];` +
		`if(L.indexOf(b)>=0){l=b;break}}` +
		`location.replace(${literal(base)}+'/'+l+'/')})()`
	);
}
```

Run: `npx vitest run src/lib/i18n/redirect.spec.ts`
Expected: PASS.

- [ ] **Step 4: Point `pickLang` at its twin**

In `src/lib/i18n/lang.ts`, replace the comment above `pickLang` with:

```ts
/**
 * First supported language from the browser's preference list, else 'en'.
 * redirectScript() in redirect.ts duplicates this for the `/` page; redirect.spec.ts keeps them in sync.
 */
```

- [ ] **Step 5: Use it on `/`** - replace `src/routes/+page.svelte` with:

```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import { en } from '$lib/i18n/en';
	import { localeHref } from '$lib/i18n/lang';
	import { redirectScript } from '$lib/i18n/redirect';
</script>

<svelte:head>
	<title>{en.meta.title}</title>
	<!-- Inline so the redirect runs before first paint, not after hydration. -->
	{@html `<script>${redirectScript(base)}</script>`}
</svelte:head>

<noscript>
	<p>
		<a href={localeHref(base, 'en')} hreflang="en">English</a> ·
		<a href={localeHref(base, 'fr')} hreflang="fr">Français</a>
	</p>
</noscript>
```

(If the Svelte compiler rejects the `<script>` string inside `{@html}` in the markup, move the tag text into the `<script lang="ts">` block as `const redirect = '<scr' + 'ipt>' + redirectScript(base) + '</scr' + 'ipt>';` and render `{@html redirect}`.)

Run: `npm test && npm run check && npm run build`
Expected: pass. `grep -o '<title>[^<]*</title>' build/index.html` shows `<title>Jocelyn Renault - Software Engineer</title>`, and `grep -c 'location.replace' build/index.html` is `1`.

- [ ] **Step 6: Check in the browser**

Preview. In Playwright with `locale: 'fr-FR'`, `page.goto(ORIGIN + '/')` → `page.url()` ends with `/fr/`; with `locale: 'de-DE'` → `/en/`. With `javaScriptEnabled: false` → stays on `/` and shows the two links.

- [ ] **Step 7: Commit**

```bash
git add src/lib/i18n/redirect.ts src/lib/i18n/redirect.spec.ts src/lib/i18n/lang.ts src/routes/+page.svelte
git commit -m "feat: redirect / to the visitor's language before first paint

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: French typography

**Files:**
- Create: `src/lib/i18n/typography.ts`
- Create: `src/lib/i18n/typography.spec.ts`
- Modify: `src/lib/i18n/fr.ts`, `src/lib/i18n/en.ts` (medal labels)
- Modify: `src/lib/components/sections/Experience.svelte`
- Modify: French strings in `src/lib/data/profile.ts`, `projects.ts`, `experience.ts` (whatever the test lists)

**Interfaces:**
- Consumes: `dicts` (`src/lib/i18n/index.ts`), `PROFILE`, `PROJECTS`, `JOBS`, `EDUCATION`, `HACKATHONS`, `SKILL_GROUPS`.
- Produces: `frenchSpacingIssues(text: string): string[]`; dict `experience.places` values now end with their own colon (`'1st place:'`, `'1re place :'`).

- [ ] **Step 1: Write the failing test** - `src/lib/i18n/typography.spec.ts`

```ts
import { describe, expect, it } from 'vitest';
import { EDUCATION, HACKATHONS, JOBS } from '$lib/data/experience';
import { PROFILE } from '$lib/data/profile';
import { PROJECTS } from '$lib/data/projects';
import { SKILL_GROUPS } from '$lib/data/skills';
import { dicts } from './index';
import { frenchSpacingIssues } from './typography';

/** Every string under an `fr` key, at any depth. */
function frenchStrings(value: unknown): string[] {
	if (Array.isArray(value)) return value.flatMap(frenchStrings);
	if (value === null || typeof value !== 'object') return [];
	return Object.entries(value).flatMap(([k, v]) =>
		k === 'fr' && typeof v === 'string' ? [v] : frenchStrings(v)
	);
}

/** Every string leaf of an object (the French dictionary). */
function leaves(value: unknown): string[] {
	if (typeof value === 'string') return [value];
	if (value === null || typeof value !== 'object') return [];
	return Object.values(value).flatMap(leaves);
}

describe('frenchSpacingIssues', () => {
	it('flags a plain space before : ; ! ? % and »', () => {
		for (const text of ['a :', 'a ;', 'a !', 'a ?', '125 %', '« a »'])
			expect(frenchSpacingIssues(text), text).not.toEqual([]);
	});
	it('flags a plain space after «', () => {
		expect(frenchSpacingIssues('« a »')).toHaveLength(1);
	});
	it('accepts no-break and narrow no-break spaces', () => {
		expect(frenchSpacingIssues('Copié ! 125 % « a » x ;')).toEqual([]);
	});
	it('ignores colons without a space (URLs, times)', () => {
		expect(frenchSpacingIssues('https://x.fr 12:30')).toEqual([]);
	});
	it('returns the spot with some context', () => {
		expect(frenchSpacingIssues('les systèmes : mémoire')[0]).toContain('systèmes :');
	});
});

describe('French content', () => {
	const sources = {
		dictionary: leaves(dicts.fr),
		profile: frenchStrings(PROFILE),
		projects: frenchStrings(PROJECTS),
		experience: frenchStrings([JOBS, EDUCATION, HACKATHONS]),
		skills: frenchStrings(SKILL_GROUPS)
	};
	it.each(Object.entries(sources))('%s uses no-break spaces where French needs them', (_, texts) => {
		expect(texts.length).toBeGreaterThan(0);
		expect(texts.flatMap(frenchSpacingIssues)).toEqual([]);
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/i18n/typography.spec.ts`
Expected: FAIL, cannot resolve `./typography`.

- [ ] **Step 3: Implement** - `src/lib/i18n/typography.ts`

```ts
/** A plain (breakable) space where French typography wants a no-break one: before : ; ! ? % », after «. */
const BREAKABLE_SPACE = / (?=[:;!?%»])|(?<=«) /g;

/**
 * Each spot in a French text that uses a plain space where a no-break one (U+00A0 or U+202F)
 * belongs, with a little context around it. Empty when the text is clean.
 */
export function frenchSpacingIssues(text: string): string[] {
	return [...text.matchAll(BREAKABLE_SPACE)].map((m) =>
		text.slice(Math.max(0, m.index - 12), m.index + 12)
	);
}
```

Run: `npx vitest run src/lib/i18n/typography.spec.ts`
Expected: the `frenchSpacingIssues` tests PASS; the `French content` tests FAIL, listing the offending spots (in `dictionary`: the meta description `42 : projets`; in `profile`: `produits : APIs`, `dessous : la mémoire`; in `projects`: several ` : `, ` %`, `« méfiez-vous des apparences »`; in `experience`: two `RNCP n : …`).

- [ ] **Step 4: Fix every listed string**

Replace each plain space the test lists with ` `, e.g. in `src/lib/data/profile.ts`: `"Je conçois la partie invisible des produits : APIs, …"`; in `projects.ts`: `'… validé à 125 %, …'`, `'… thème « méfiez-vous des apparences » : …'` (only the plain spaces the test reports; leave everything else as is). In `fr.ts`: `'… ingénieur logiciel issu de 42 : projets …'`.

Then move the medal colon into the dictionary so French gets its own spacing. In `src/lib/i18n/en.ts`:

```ts
		places: { 1: '1st place:', 2: '2nd place:', 3: '3rd place:' } satisfies Record<Medal, string>
```

In `src/lib/i18n/fr.ts`:

```ts
		places: { 1: '1re place :', 2: '2e place :', 3: '3e place :' }
```

In `src/lib/components/sections/Experience.svelte`, replace `<span class="sr-only">{t.places[h.medal]}:</span>` with `<span class="sr-only">{t.places[h.medal]}</span>`.

Run: `npm test && npm run check`
Expected: all pass (the whole `typography.spec.ts` included); 0 errors.

- [ ] **Step 5: Check a wrap in the browser**

Build and preview `/fr/` at 360px; screenshot the About paragraph with "dessous : la mémoire" and the Projects small card for "Confiture de jeu": no line starts with `:`, `%` or `»`.

- [ ] **Step 6: Commit**

```bash
git add -A src
git commit -m "fix: use no-break spaces before French punctuation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Deferred review minors

**Files:**
- Modify: `src/app.css` (`--ok`, `--pill` tokens)
- Modify: `src/lib/components/sections/Hero.svelte`, `About.svelte`, `Projects.svelte`, `Skills.svelte`, `Contact.svelte`
- Modify: `src/lib/components/projects/ProjectCardLarge.svelte`, `ProjectFilters.svelte`, `ProjectLinks.svelte`
- Modify: `src/lib/components/LangSwitch.svelte`
- Modify: `src/lib/data/contact-icons.ts`
- Modify: `src/lib/data/profile.spec.ts`, `src/lib/data/projects.spec.ts`, `src/lib/experience.spec.ts`
- Modify: `src/lib/i18n/en.ts`, `fr.ts` (new `contact.copyHint`)

**Interfaces:**
- Consumes: `contactLinks()` (`src/lib/contact.ts`), `--tap` (Task 1).
- Produces: CSS tokens `--ok`, `--pill`; dict key `contact.copyHint`.

- [ ] **Step 1: Prove the timezone test really runs off-UTC (failing first)**

In `src/lib/experience.spec.ts`, inside `describe('formatPeriod', …)`, replace the test `'keeps January and December in their own year whatever the timezone'` with:

```ts
	it.each(['Pacific/Kiritimati', 'Pacific/Pago_Pago'])(
		'keeps January and December in their own year under TZ=%s',
		(tz) => {
			const saved = process.env.TZ;
			process.env.TZ = tz; // Node applies a TZ change immediately
			try {
				expect(new Date(2024, 0, 1).getTimezoneOffset(), 'TZ did not apply').not.toBe(0);
				expect(formatPeriod('2024-01', '2024-12', 'en', 'Present')).toBe('Jan 2024 – Dec 2024');
			} finally {
				if (saved === undefined) delete process.env.TZ;
				else process.env.TZ = saved;
			}
		}
	);
```

Run: `npx vitest run src/lib/experience.spec.ts`
Expected: PASS (UTC+14 and UTC−11). Sanity check that it can fail: temporarily delete `timeZone: 'UTC'` from `formatPoint` in `src/lib/experience.ts`, re-run → at least one of the two cases FAILS; restore the line, re-run → PASS.

- [ ] **Step 2: Resolve `static/` from the spec file, not the cwd**

In both `src/lib/data/profile.spec.ts` and `src/lib/data/projects.spec.ts`, replace

```ts
const staticFile = (src: string) => resolve('static', src);
```

with

```ts
/** static/ at the repo root, found from this file so the test works from any cwd. */
const staticFile = (src: string) => resolve(fileURLToPath(new URL('../../../static', import.meta.url)), src);
```

and add `import { fileURLToPath } from 'node:url';` to the imports.

Run: `(cd src/lib && ../../node_modules/.bin/vitest run --root ../.. src/lib/data)`
Expected: PASS (run from a different cwd).

- [ ] **Step 3: Theme tokens for the availability dot and pill radius**

In `src/app.css` add `--ok` to each of the three colour blocks and `--pill` to the first `:root`:
- first `:root` block: after `--tap: 2.25rem;` add `--pill: 1.25rem;`, and after `--border: #30363d;` add `--ok: #3fb950;`
- `:root[data-theme='light']` block: after `--border: #d1d9e0;` add `--ok: #1a7f37;`
- the `@media (prefers-color-scheme: light)` `:root:not([data-theme])` block: after `--border: #d1d9e0;` add `--ok: #1a7f37;`

Add this comment right above `--pill`: `/* Pill radius: a full pill up to ~40px tall; a rounded rectangle (not a lozenge) if the content ever wraps. */`

In `src/lib/components/sections/Hero.svelte`, replace `background: #2da44e;` with `background: var(--ok);`.

Replace `border-radius: 999px;` with `border-radius: var(--pill);` in every file that has it:

Run: `grep -rln "border-radius: 999px" src | xargs sed -i 's/border-radius: 999px;/border-radius: var(--pill);/'`
Then: `grep -rn "999px" src`
Expected: no output.

- [ ] **Step 4: Touch-sized targets**

Using the `--tap` token from Task 1:
- `src/lib/components/LangSwitch.svelte`: in `.lang`, replace `height: 2.25rem;` with `height: var(--tap);`
- `src/lib/components/projects/ProjectFilters.svelte`: in `.chip` add `min-height: var(--tap);`; in `select` add `min-height: var(--tap);`
- `src/lib/components/projects/ProjectLinks.svelte`: in `a` add `min-width: var(--tap); min-height: var(--tap);`
- `src/lib/components/sections/Contact.svelte`: in `.copy` add `min-height: var(--tap);`; in `.mail` add `min-width: var(--tap); min-height: var(--tap); align-items: center; justify-content: center;`
- `src/lib/components/sections/Projects.svelte`: in `.empty button` add `min-height: var(--tap);`

- [ ] **Step 5: Key About facts on their index**

In `src/lib/components/sections/About.svelte`, replace `{#each PROFILE.facts as fact (fact.icon)}` with `{#each PROFILE.facts as fact, i (i)}`.

- [ ] **Step 6: Inline the Malt symbol**

In `src/lib/data/contact-icons.ts`, change the import to `import { siGithub } from 'simple-icons';` and replace the `malt` entry with:

```ts
	/**
	 * The simple-icons Malt icon is its wordmark, unreadable at 28px: this is only its symbol
	 * (the icon's last subpaths, copied from simple-icons 16.33), cropped by the viewBox.
	 * Inlined so a simple-icons update can't reorder the subpaths under us.
	 */
	malt: {
		path: 'M3.499 13.563l-.21.21.619.618c.304.304.79.598 1.244.144.339-.34.26-.695.073-.98-.06.004-1.726.008-1.726.008zm-.963-2.325.21-.21-.608-.607c-.304-.303-.765-.621-1.243-.143-.351.35-.273.692-.087.97Zm2.86.416c-.037.043-1.511 1.524-1.511 1.524h1.154c.43 0 .981-.101.981-.777 0-.496-.296-.683-.624-.747zm-3.244-.031H.981c-.43 0-.981.135-.981.778 0 .479.307.676.641.745.04-.046 1.511-1.523 1.511-1.523zm1.484 3.04-.618-.618-.608.607a2.613 2.613 0 0 1-.137.128c.07.333.266.639.745.639s.676-.307.745-.641c-.043-.037-.085-.073-.127-.115zM2.41 10.15l.608.607.618-.618a2.25 2.25 0 0 1 .128-.118c-.065-.327-.251-.623-.747-.623s-.682.297-.746.625c.046.04.092.08.14.127zm2.742.117c-.455-.454-.94-.16-1.244.144l-2.87 2.87c-.303.303-.621.765-.143 1.243.478.478.94.16 1.243-.143l2.87-2.87c.304-.304.598-.79.144-1.244Z',
		hex: 'FC5757',
		viewBox: '-0.3 9.1 6.62 6.62'
	}
```

Run: `npx vitest run src/lib/data/contact-icons.spec.ts`
Expected: PASS (the existing "keeps only the Malt symbol" test still holds).

- [ ] **Step 7: Copy email: re-announce, visible hint on failure, timer cleanup, label from the tile**

In `src/lib/i18n/en.ts`, in `contact`, after `copied: 'Copied!'` add `,` and `copyHint: 'Press Ctrl+C (⌘C on Mac) to copy.'`. In `fr.ts`, after `copied: 'Copié !'` add `,` and `copyHint: 'Appuyez sur Ctrl+C (⌘C sur Mac) pour copier.'`.

In `src/lib/components/sections/Contact.svelte`:

Replace the `<script>` block's body from `const links = …` to the end of the `copy` function with:

```ts
	const links = $derived(contactLinks(lang, base, t.cv));

	let copied = $state(false);
	/** Copy failed: show the keyboard hint next to the selected address. */
	let failed = $state(false);
	/** Text of the polite live region. */
	let announcement = $state('');
	let address: HTMLElement | undefined = $state();
	let timer: ReturnType<typeof setTimeout> | undefined;

	onDestroy(() => clearTimeout(timer));

	/** Clearing first, then setting on the next frame, makes screen readers repeat an identical message. */
	function announce(text: string) {
		announcement = '';
		requestAnimationFrame(() => (announcement = text));
	}

	/** Copy the address; if the clipboard is unavailable (plain http, denied), select it and show a hint. */
	async function copy() {
		try {
			await navigator.clipboard.writeText(PROFILE.email);
			failed = false;
			copied = true;
			announce(t.copied);
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 2000);
		} catch {
			failed = true;
			announce(t.copyHint);
			if (!address) return;
			const range = document.createRange();
			range.selectNodeContents(address);
			const selection = getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);
		}
	}
```

Add `import { onDestroy } from 'svelte';` at the top of the script. The `const [local, domain] = PROFILE.email.split('@');` line is gone; in the markup, replace the email `<li>` content's opening so the address comes from the tile label:

```svelte
				{#if link.id === 'email'}
					{@const [local, domain] = link.label.split('@')}
					<div class="tile">
```

After the email tile's closing `</div>` (still inside the `{#if link.id === 'email'}` branch) add:

```svelte
					{#if failed}<p class="hint">{t.copyHint}</p>{/if}
```

Replace `<p class="sr-only" aria-live="polite">{copied ? t.copied : ''}</p>` with `<p class="sr-only" aria-live="polite">{announcement}</p>`.

In the `<style>` block add:

```css
	.hint {
		margin: 0.4rem 0 0;
		font-size: 0.85rem;
		color: var(--muted);
		text-align: center;
	}
```

`PROFILE` is still imported (used by `copy`).

Run: `npm test && npm run check && npm run lint`
Expected: all pass; 0 errors. (If `lint` fails, run `npm run format` and re-check.)

- [ ] **Step 8: Check in the browser**

Build and preview `/en/` at 1280px:
- dark and light: the Hero dot is green (set `PROFILE.available` to `true` locally for the screenshot, then revert);
- in the page, `Object.defineProperty(navigator, 'clipboard', { value: undefined })` via `page.addInitScript`, click Copy → the address is selected and "Press Ctrl+C (⌘C on Mac) to copy." shows under the tile;
- without the stub (grant `clipboard-write` with `context.grantPermissions`), click Copy twice 500 ms apart → the live region's text is `Copied!` after each click;
- at 360px with `hasTouch: true` and `isMobile: true` (so `pointer: coarse` matches): the filter chips, theme button and link icons measure ≥ 44px (`locator.boundingBox()`).

- [ ] **Step 9: Commit**

```bash
git add -A src
git commit -m "fix: fold in deferred review minors

Theme tokens for the availability dot and pill radius, touch-sized
targets, a TZ test that really runs off-UTC, cwd-independent static
paths, an inlined Malt symbol, and a copy button that re-announces,
hints on failure and cleans up its timer.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: `npm run audit`

**Files:**
- Modify: `package.json` (dev deps, `audit` script)
- Modify: `vite.config.ts` (Vitest also picks up `scripts/**/*.spec.ts`)
- Modify: `.gitignore`, `.prettierignore` (`/reports`)
- Create: `scripts/audit-report.ts`
- Create: `scripts/audit-report.spec.ts`
- Create: `scripts/audit.ts`
- Modify: `CLAUDE.md` (Commands)

**Interfaces:**
- Consumes: the built site; `.menu-btn` (Task 1).
- Produces:
  - `type Check = { name: string; ok: boolean; detail: string }`
  - `CATEGORY_TARGETS`, `type Category`, `DOMAIN_PENDING_AUDITS`
  - `type LighthouseSummary = { scores: Record<Category, number | null>; failedSeoAudits: string[] }`
  - `lighthouseChecks(label: string, summary: LighthouseSummary): Check[]`
  - `axeCheck(label: string, violations: readonly { id: string; nodes: readonly unknown[] }[]): Check`
  - `overflowCheck(label: string, overflowPx: number): Check`
  - `formatTable(checks: readonly Check[]): string`, `allPassed(checks: readonly Check[]): boolean`
  - `npm run audit` (add `-- --screens` for screenshots in `reports/screens/`)

- [ ] **Step 1: Install the tools**

`playwright@1.63.0` matches the Chromium already cached in `~/.cache/ms-playwright` (`chromium-1243`), so nothing is downloaded.

Run: `npm install --save-dev --save-exact playwright@1.63.0 && npm install --save-dev @axe-core/playwright lighthouse chrome-launcher`
Expected: installs; `node -e "console.log(require('playwright').chromium.executablePath())"` prints a path under `~/.cache/ms-playwright/chromium-1243/`, and that file exists (`ls -l <path>`). If it does not exist, run `npx playwright install chromium`.

- [ ] **Step 2: Wire config**

In `package.json` `scripts`, after `"test": …` add `"audit": "node scripts/audit.ts"` (Node 24 runs TypeScript directly).

In `vite.config.ts`, in the `server` project, change `include` to:

```ts
					include: ['src/**/*.{test,spec}.{js,ts}', 'scripts/**/*.{test,spec}.{js,ts}'],
```

Append `/reports` to both `.gitignore` (under a `# Audit output` comment) and `.prettierignore`.

- [ ] **Step 3: Write the failing test** - `scripts/audit-report.spec.ts`

```ts
import { describe, expect, it } from 'vitest';
import {
	allPassed,
	axeCheck,
	formatTable,
	lighthouseChecks,
	overflowCheck,
	type LighthouseSummary
} from './audit-report';

const perfect = { performance: 1, accessibility: 1, 'best-practices': 1, seo: 1 };
const summary = (scores: Partial<LighthouseSummary['scores']>, failedSeoAudits: string[] = []) => ({
	scores: { ...perfect, ...scores },
	failedSeoAudits
});
const byCategory = (label: string, s: LighthouseSummary) =>
	Object.fromEntries(lighthouseChecks(label, s).map((c) => [c.name.split(' ').at(-1), c]));

describe('lighthouseChecks', () => {
	it('passes every category at its target', () => {
		const checks = lighthouseChecks('mobile', summary({ performance: 0.95 }));
		expect(checks).toHaveLength(4);
		expect(checks.every((c) => c.ok)).toBe(true);
		expect(checks[0].name).toBe('Lighthouse mobile performance');
	});

	it('fails a category under its target and says by how much', () => {
		const c = byCategory('mobile', summary({ performance: 0.94, accessibility: 0.98 }));
		expect(c.performance).toMatchObject({ ok: false, detail: '94 < 95' });
		expect(c.accessibility).toMatchObject({ ok: false, detail: '98 < 100' });
	});

	it('fails a missing score', () => {
		expect(byCategory('desktop', summary({ seo: null })).seo.ok).toBe(false);
	});

	it('lets SEO pass as "pending domain" when only domain-bound audits fail', () => {
		const c = byCategory('mobile', summary({ seo: 0.92 }, ['hreflang']));
		expect(c.seo.ok).toBe(true);
		expect(c.seo.detail).toBe('92 (pending domain: hreflang)');
	});

	it('fails SEO when any other audit fails too, and names them', () => {
		const c = byCategory('mobile', summary({ seo: 0.83 }, ['hreflang', 'meta-description']));
		expect(c.seo.ok).toBe(false);
		expect(c.seo.detail).toBe('83 < 100 (failed: hreflang, meta-description)');
	});
});

describe('axeCheck', () => {
	it('passes with no violations', () => {
		expect(axeCheck('/en/ dark 360px', [])).toEqual({
			name: 'axe /en/ dark 360px',
			ok: true,
			detail: '0 violations'
		});
	});
	it('lists each rule with its node count', () => {
		const c = axeCheck('x', [
			{ id: 'color-contrast', nodes: [1, 2] },
			{ id: 'list', nodes: [1] }
		]);
		expect(c).toMatchObject({ ok: false, detail: 'color-contrast (2), list (1)' });
	});
});

describe('overflowCheck', () => {
	it('passes when the page is not wider than the viewport', () => {
		expect(overflowCheck('/fr/ 360px', 0).ok).toBe(true);
	});
	it('fails and reports the overflow in px', () => {
		expect(overflowCheck('/fr/ 360px', 23)).toEqual({
			name: 'no horizontal scroll /fr/ 360px',
			ok: false,
			detail: '23px wider than the viewport'
		});
	});
});

describe('formatTable / allPassed', () => {
	const checks = [
		{ name: 'a', ok: true, detail: 'fine' },
		{ name: 'longer name', ok: false, detail: 'broken' }
	];
	it('prints one aligned PASS/FAIL line per check', () => {
		expect(formatTable(checks).split('\n')).toEqual([
			'PASS  a            fine',
			'FAIL  longer name  broken'
		]);
	});
	it('is true only when every check passed', () => {
		expect(allPassed(checks)).toBe(false);
		expect(allPassed(checks.slice(0, 1))).toBe(true);
		expect(allPassed([])).toBe(false);
	});
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npx vitest run scripts/audit-report.spec.ts`
Expected: FAIL, cannot resolve `./audit-report`.

- [ ] **Step 5: Implement** - `scripts/audit-report.ts`

Plain, erasable TypeScript only (no enums, no parameter properties): Node runs this file directly.

```ts
/** One line of the audit result. */
export type Check = { name: string; ok: boolean; detail: string };

/** Lighthouse category targets, as scores from 0 to 1. */
export const CATEGORY_TARGETS = {
	performance: 0.95,
	accessibility: 1,
	'best-practices': 1,
	seo: 1
} as const;
export type Category = keyof typeof CATEGORY_TARGETS;
export const CATEGORIES = Object.keys(CATEGORY_TARGETS) as Category[];

/** SEO audits that need absolute URLs, so a real domain (M9); they don't fail the audit before that. */
export const DOMAIN_PENDING_AUDITS: readonly string[] = ['hreflang', 'canonical'];

export type LighthouseSummary = {
	scores: Record<Category, number | null>;
	/** Ids of the weighted SEO audits that did not fully pass. */
	failedSeoAudits: string[];
};

const pct = (score: number) => String(Math.round(score * 100));

export function lighthouseChecks(label: string, summary: LighthouseSummary): Check[] {
	return CATEGORIES.map((category) => {
		const name = `Lighthouse ${label} ${category}`;
		const score = summary.scores[category];
		const target = CATEGORY_TARGETS[category];
		if (score === null) return { name, ok: false, detail: 'no score' };
		if (score >= target) return { name, ok: true, detail: pct(score) };
		const failed = category === 'seo' ? summary.failedSeoAudits : [];
		if (failed.length > 0 && failed.every((id) => DOMAIN_PENDING_AUDITS.includes(id)))
			return { name, ok: true, detail: `${pct(score)} (pending domain: ${failed.join(', ')})` };
		const suffix = failed.length > 0 ? ` (failed: ${failed.join(', ')})` : '';
		return { name, ok: false, detail: `${pct(score)} < ${pct(target)}${suffix}` };
	});
}

export function axeCheck(
	label: string,
	violations: readonly { id: string; nodes: readonly unknown[] }[]
): Check {
	return {
		name: `axe ${label}`,
		ok: violations.length === 0,
		detail:
			violations.length === 0
				? '0 violations'
				: violations.map((v) => `${v.id} (${v.nodes.length})`).join(', ')
	};
}

export function overflowCheck(label: string, overflowPx: number): Check {
	return {
		name: `no horizontal scroll ${label}`,
		ok: overflowPx <= 0,
		detail: overflowPx <= 0 ? 'fits' : `${overflowPx}px wider than the viewport`
	};
}

export function formatTable(checks: readonly Check[]): string {
	const width = Math.max(...checks.map((c) => c.name.length));
	return checks
		.map((c) => `${c.ok ? 'PASS' : 'FAIL'}  ${c.name.padEnd(width)}  ${c.detail}`)
		.join('\n');
}

/** False for an empty list: an audit that checked nothing did not pass. */
export function allPassed(checks: readonly Check[]): boolean {
	return checks.length > 0 && checks.every((c) => c.ok);
}
```

Run: `npx vitest run scripts/audit-report.spec.ts`
Expected: PASS.

- [ ] **Step 6: Write the runner** - `scripts/audit.ts`

```ts
/**
 * npm run audit [-- --screens]
 * Builds the site, serves it with `vite preview`, then checks it: axe (both languages, both
 * themes, phone and desktop, menu open, no-JS), horizontal overflow at 360px, and Lighthouse
 * on /en/ (mobile and desktop). Prints a PASS/FAIL table, writes full reports to reports/,
 * and exits non-zero if anything failed. --screens also saves full-page screenshots.
 */
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { chromium, type Browser, type Page } from 'playwright';
import {
	allPassed,
	axeCheck,
	CATEGORIES,
	formatTable,
	lighthouseChecks,
	overflowCheck,
	type Check
} from './audit-report.ts';

const PORT = 4180;
const ORIGIN = `http://localhost:${PORT}`;
const OUT = 'reports';
const LANGS = ['en', 'fr'] as const;
const THEMES = ['dark', 'light'] as const;
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const SCREEN_WIDTHS = [360, 390, 768, 1024, 1440];

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			if ((await fetch(url)).ok) return;
		} catch {
			// not up yet
		}
		await new Promise((r) => setTimeout(r, 250));
	}
	throw new Error(`preview server did not answer at ${url}`);
}

async function axe(page: Page, label: string, file: string): Promise<Check> {
	const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
	if (violations.length > 0)
		writeFileSync(`${OUT}/axe-${file}.json`, JSON.stringify(violations, null, 2));
	return axeCheck(label, violations);
}

async function browserChecks(browser: Browser): Promise<Check[]> {
	const checks: Check[] = [];
	for (const lang of LANGS)
		for (const theme of THEMES)
			for (const width of [360, 1280]) {
				const context = await browser.newContext({
					viewport: { width, height: 800 },
					colorScheme: theme
				});
				const page = await context.newPage();
				await page.goto(`${ORIGIN}/${lang}/`, { waitUntil: 'networkidle' });
				const label = `/${lang}/ ${theme} ${width}px`;
				const file = `${lang}-${theme}-${width}`;
				checks.push(await axe(page, label, file));
				if (width === 360) {
					const overflow = await page.evaluate(
						() => document.documentElement.scrollWidth - window.innerWidth
					);
					checks.push(overflowCheck(label, overflow));
					await page.click('.menu-btn');
					checks.push(await axe(page, `${label} menu open`, `${file}-menu`));
				}
				await context.close();
			}
	// Before hydration / without JS: the markup alone must be accessible.
	const noJs = await browser.newContext({
		viewport: { width: 360, height: 800 },
		colorScheme: 'light',
		javaScriptEnabled: false
	});
	const page = await noJs.newPage();
	await page.goto(`${ORIGIN}/en/`);
	checks.push(await axe(page, '/en/ no-JS light 360px', 'en-nojs-360'));
	await noJs.close();
	return checks;
}

async function screenshots(browser: Browser): Promise<void> {
	mkdirSync(`${OUT}/screens`, { recursive: true });
	for (const lang of LANGS)
		for (const theme of THEMES)
			for (const width of SCREEN_WIDTHS) {
				const context = await browser.newContext({
					viewport: { width, height: 900 },
					colorScheme: theme
				});
				const page = await context.newPage();
				await page.goto(`${ORIGIN}/${lang}/`, { waitUntil: 'networkidle' });
				await page.screenshot({
					path: `${OUT}/screens/${lang}-${theme}-${width}.png`,
					fullPage: true
				});
				await context.close();
			}
}

async function lighthouseChecksFor(): Promise<Check[]> {
	const chrome = await launch({
		chromePath: chromium.executablePath(),
		chromeFlags: ['--headless=new', '--no-sandbox']
	});
	try {
		const checks: Check[] = [];
		const runs = [
			['mobile', undefined],
			['desktop', desktopConfig]
		] as const;
		for (const [label, config] of runs) {
			const result = await lighthouse(
				`${ORIGIN}/en/`,
				{ port: chrome.port, output: 'html', logLevel: 'error', onlyCategories: CATEGORIES },
				config
			);
			if (!result) throw new Error(`Lighthouse ${label} returned no result`);
			writeFileSync(`${OUT}/lighthouse-${label}.html`, String(result.report));
			const { categories, audits } = result.lhr;
			checks.push(
				...lighthouseChecks(label, {
					scores: Object.fromEntries(
						CATEGORIES.map((c) => [c, categories[c]?.score ?? null])
					) as Record<(typeof CATEGORIES)[number], number | null>,
					failedSeoAudits: (categories.seo?.auditRefs ?? [])
						.filter((ref) => ref.weight > 0 && (audits[ref.id]?.score ?? 1) < 1)
						.map((ref) => ref.id)
				})
			);
		}
		return checks;
	} finally {
		chrome.kill();
	}
}

async function main(): Promise<void> {
	rmSync(OUT, { recursive: true, force: true });
	mkdirSync(OUT, { recursive: true });
	execSync('npm run build', { stdio: 'inherit' });
	const server = spawn(
		'./node_modules/.bin/vite',
		['preview', '--port', String(PORT), '--strictPort'],
		{ stdio: 'ignore' }
	);
	let checks: Check[] = [];
	try {
		await waitForServer(`${ORIGIN}/en/`);
		const browser = await chromium.launch();
		try {
			checks = await browserChecks(browser);
			if (process.argv.includes('--screens')) await screenshots(browser);
		} finally {
			await browser.close();
		}
		checks.push(...(await lighthouseChecksFor()));
	} finally {
		server.kill();
	}
	console.log(`\n${formatTable(checks)}\n\nFull reports in ${OUT}/`);
	process.exitCode = allPassed(checks) ? 0 : 1;
}

await main();
```

Run: `npm run audit`
Expected: the build runs, then a table of 25 lines (8 axe + 4 menu-open axe + 1 no-JS axe + 4 overflow + 8 Lighthouse). Failures are expected at this point; they are fixed in Task 9. What matters here: the script completes, prints the table, writes `reports/lighthouse-mobile.html`, and the preview server is gone afterwards (`curl -s localhost:4180 || echo down` prints `down`).

If Lighthouse cannot connect to Chrome in this environment (WSL), check the error: `--no-sandbox` is already passed; if `chromium.executablePath()` points at a missing file, run `npx playwright install chromium`. Do not remove the Lighthouse part.

- [ ] **Step 7: Document the command**

In `CLAUDE.md`, under `## Commands`, after the `npm run build` line add:

```markdown
- `npm run audit`: builds, serves, then runs axe (EN/FR × dark/light × 360/1280px, menu open, no-JS), a 360px overflow check and Lighthouse (mobile + desktop). Targets: 0 axe violations, Lighthouse 100 (Performance ≥ 95). Reports in `reports/` (git-ignored); `npm run audit -- --screens` also saves screenshots at 360–1440px.
```

- [ ] **Step 8: Commit**

```bash
npm run lint || npm run format
git add package.json package-lock.json vite.config.ts .gitignore .prettierignore scripts CLAUDE.md
git commit -m "feat: add npm run audit (axe, overflow and Lighthouse)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(`package-lock.json` is committed even though Prettier ignores it.)

---

### Task 9: Responsive pass and audit fixes

**Files:** whatever the audit and the screenshots point at (components under `src/lib/components/`, `src/app.css`).

**Interfaces:**
- Consumes: `npm run audit` (Task 8).
- Produces: a green audit, and the screenshots the review guide uses.

This task fixes what the audit and the screenshots actually find, so its code cannot be written in advance. Keep each fix inside the component that has the problem, follow the existing patterns (theme tokens, `--tap`, `--pill`, `40rem`/`48rem`/`64rem` breakpoints), and do not change the design beyond what a finding needs.

- [ ] **Step 1: Run the full audit with screenshots**

Run: `npm run audit -- --screens`
Record the table in the scratchpad (`audit-before.txt`) for the review guide.

- [ ] **Step 2: Look at every screenshot**

Open each `reports/screens/*.png` with the Read tool (20 images: EN/FR × dark/light × 360/390/768/1024/1440). For each width, list anything that overflows, overlaps, crowds, wraps badly (a single word on a line, a button text split), or leaves an odd gap. Note: the fixed nav may overlap full-page screenshots mid-page; that is an artifact, not a bug.

- [ ] **Step 3: Fix one finding at a time**

For each axe violation (details in `reports/axe-*.json`), failing Lighthouse audit (open `reports/lighthouse-*.html` to see which audits failed), overflow, or visual problem:
1. find the cause in the component;
2. make the smallest fix;
3. if the fix involves logic (not only CSS/markup), add a unit test next to the pure function first;
4. `npm test && npm run check`;
5. commit it on its own: `git commit -m "fix: <what was wrong, in words>"` with the `Co-Authored-By` line.

Known places to look first:
- the nav at 360px: brand + ☰ + FR + theme must fit without overflow;
- Projects filters at 360px: the "Context"/"Domain" labels have `min-width: 5.5rem`; chips must wrap cleanly;
- the Contact email tile at 360px (address + copy button);
- colour contrast of `--muted` text on `--surface` in both themes (axe `color-contrast`).

If Lighthouse Performance on mobile is below 95: open the report and fix what it names (render-blocking, image size, layout shift). If the score changes by more than 5 points between two runs with no code change, record both runs and flag it in the review guide instead of lowering the target.

- [ ] **Step 4: Re-run until green**

Run: `npm run audit -- --screens`
Expected: every line PASS (SEO may read `… (pending domain: hreflang)`), exit code 0. Re-check the screenshots of anything you changed.

- [ ] **Step 5: Full verification**

Run: `npm test && npm run check && npm run lint && npm run build`
Expected: all pass. Save the final audit table to the scratchpad (`audit-after.txt`).

---

### Task 10: Review guide and PR

**Files:**
- Create: `docs/reviews/milestone-7-review-guide.md`

- [ ] **Step 1: Write the review guide**

Follow the structure of `docs/reviews/milestone-6-review-guide.md` (read it first). Include:
- what changed, task by task, with the commit list (`git log --oneline master..HEAD`);
- the final `npm run audit` table (and the "before" table from Task 9 Step 1);
- screenshots: copy the 360px and 1440px ones for `en` (dark and light) plus `fr` light 360px and the mobile menu open into `docs/reviews/milestone-7/` and link them;
- the Review Focus list from this plan, each with how it was verified;
- manual checks for the reviewer: on a real phone, open/close the menu, rotate to landscape, try the skip link with a keyboard, switch the OS theme with the page open, open `/` with a French browser;
- what moved to M8 (visual polish & SEO: scroll-reveal, favicon, OG image and per-locale meta, project screenshots) and M9 (deployment, absolute canonical/hreflang URLs), and the dropped `simple-icons` trimming item with its reason.

- [ ] **Step 2: Commit and push**

```bash
git add docs/reviews
git commit -m "docs: add Milestone 7 review guide

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin worktree-milestone-7-fixes-a11y:milestone-7-fixes-a11y
```

- [ ] **Step 3: Open the PR**

```bash
gh pr create --base master --head milestone-7-fixes-a11y --title "Milestone 7: fixes & accessibility" --body "<summary, audit table, link to docs/reviews/milestone-7-review-guide.md>

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

Then stop: the user reviews the PR before anything is merged.
