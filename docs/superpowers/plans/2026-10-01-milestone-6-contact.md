# Milestone 6 - Contact & Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Contact placeholder with a row of always-expanded contact tiles (email with copy button, LinkedIn, GitHub, Malt, CV) and add a slim site footer.

**Architecture:** Contact data lives in `PROFILE`; a pure helper `contactLinks()` in `src/lib/contact.ts` turns it into an ordered list of tiles, unit-tested. Brand logos are `{ path, hex }` data in `src/lib/data/contact-icons.ts`, drawn by a small `ContactIcon.svelte` that reuses `logoColor` from `skills.ts`. `Contact.svelte` and a new `Footer.svelte` only render. The two duplicated "opens in a new tab" dictionary keys merge into one top-level `newTab`.

**Tech Stack:** SvelteKit + Svelte 5 runes, TypeScript, Vitest, `simple-icons`, `adapter-static`.

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section "Contact & Footer". Read it before starting any task.

## Global Constraints

- Runes only (`$props`, `$state`, `$derived`). No `export let`, no `$:`, no stores.
- UI text only in `src/lib/i18n/en.ts` and `fr.ts`; `fr` is typed `Dict`, so every key exists in both.
- Never hardcode `/en/` or a leading `/` for assets: use `assetHref(base, …)` with `base` from `$app/paths`.
- Section components take only the dict slice they use (`Dict['contact']`, `Dict['footer']`), not the full `Dict`.
- No form, no backend, no phone number, no location, no link to the site's own repo, no license.
- Email: `jocelynrenaultpro@gmail.com`. LinkedIn: `https://www.linkedin.com/in/jocelyn-renault/`. Malt: `https://www.malt.fr/profile/jocelynrenault`.
- Tile order: email, linkedin, github, malt, cv. `external` is true for everything except email.
- External links: `target="_blank" rel="noopener noreferrer"` plus `<span class="sr-only">{newTab}</span>` (`.sr-only` is global in `src/app.css`).
- Under 640px (`40rem`): contact tiles stack as full-width rows; footer parts stack and center.
- Commands run from the worktree root: `npm test`, `npm run check`, `npm run lint`.

## Review Focus

1. **Clipboard unavailable** (site opened over plain `http://` on a LAN IP, or permission denied): `navigator.clipboard` is `undefined` or `writeText` rejects. Expected: no uncaught error; the address text gets selected so Ctrl+C works. Pinned in Task 3 Step 6 (manual check in the browser console with `navigator.clipboard` stubbed out).
2. **Site served under a sub-path** (`base = '/portfolio'`, with or without trailing slash): the CV tile must point at `/portfolio/cv-xx.pdf`. Pinned in Task 1 `contact.spec.ts`.
3. **Narrow phone (320–375px)**: the 27-character email plus icon plus copy button must not overflow the viewport. Expected: the address wraps, no horizontal scroll. Pinned in Task 5 visual check (375px and 320px scroll-width assertion).
4. **Copy clicked twice quickly**: the "Copied!" label must stay for 2 s after the *last* click, not flicker back early from the first timer. Pinned in Task 3 (`clearTimeout` before re-arming) and checked in Task 3 Step 6.
5. **Light theme brand colours**: GitHub's `#181717` vanishes on dark; LinkedIn / Malt must stay readable in both themes. Expected: `logoColor` falls back to `--text`. Pinned in Task 1 `contact-icons.spec.ts` (each icon readable in at least one theme via `logoColor`, i.e. never both fallbacks unexpectedly) and Task 5 screenshots.

---

### Task 1: Contact data, tile helper and brand icons

**Files:**
- Modify: `src/lib/data/profile.ts`
- Modify: `src/lib/data/profile.spec.ts`
- Create: `src/lib/contact.ts`
- Create: `src/lib/contact.spec.ts`
- Create: `src/lib/data/contact-icons.ts`
- Create: `src/lib/data/contact-icons.spec.ts`

**Interfaces:**
- Consumes: `PROFILE` (`src/lib/data/profile.ts`), `assetHref(base: string, path: string): string` (`src/lib/paths.ts`), `SkillIcon = { path: string; hex: string }`, `logoColor(hex, bg)`, `THEME_BG` (`src/lib/skills.ts`).
- Produces:
  - `PROFILE.email: string`, `PROFILE.linkedin: string`, `PROFILE.malt: string`
  - `type ContactId = 'email' | 'linkedin' | 'github' | 'malt' | 'cv'`
  - `type BrandContactId = Exclude<ContactId, 'email' | 'cv'>`
  - `type ContactLink = { id: ContactId; label: string; href: string; external: boolean }`
  - `profileHandle(url: string): string`
  - `contactLinks(lang: Lang, base: string, cvLabel: string): ContactLink[]`
  - `CONTACT_BRANDS: Record<BrandContactId, SkillIcon>`

- [ ] **Step 1: Install dependencies (the worktree has no `node_modules`)**

Run: `npm ci`
Expected: completes without errors. Then `npm test` passes (baseline).

- [ ] **Step 2: Write the failing profile tests**

In `src/lib/data/profile.spec.ts`, add inside the `describe('profile data', …)` block, after the `links GitHub over https` test:

```ts
	it('has a plain email address', () => {
		expect(PROFILE.email).toMatch(/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i);
	});

	it('links LinkedIn and Malt profiles over https', () => {
		expect(PROFILE.linkedin).toMatch(/^https:\/\/www\.linkedin\.com\/in\/[^/]+\/?$/);
		expect(PROFILE.malt).toMatch(/^https:\/\/www\.malt\.fr\/profile\/[^/]+$/);
	});
```

- [ ] **Step 3: Write the failing helper tests**

Create `src/lib/contact.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PROFILE } from '$lib/data/profile';
import { LANGS } from '$lib/i18n/lang';
import { contactLinks, profileHandle, type ContactLink } from './contact';

const byId = (links: ContactLink[]) => Object.fromEntries(links.map((l) => [l.id, l]));

describe('profileHandle', () => {
	it('returns the last path segment, ignoring a trailing slash', () => {
		expect(profileHandle('https://www.linkedin.com/in/jocelyn-renault/')).toBe('jocelyn-renault');
		expect(profileHandle('https://github.com/LezardSC')).toBe('LezardSC');
	});
});

describe('contactLinks', () => {
	it('lists the tiles in order', () => {
		expect(contactLinks('en', '', 'CV (PDF)').map((l) => l.id)).toEqual([
			'email',
			'linkedin',
			'github',
			'malt',
			'cv'
		]);
	});

	it('shows the email address and links it with mailto:', () => {
		const email = byId(contactLinks('en', '', 'CV'))['email'];
		expect(email.label).toBe('jocelynrenaultpro@gmail.com');
		expect(email.href).toBe('mailto:jocelynrenaultpro@gmail.com');
	});

	it('labels profiles with their handle and links them', () => {
		const links = byId(contactLinks('en', '', 'CV'));
		expect(links['linkedin']).toMatchObject({ label: 'jocelyn-renault', href: PROFILE.linkedin });
		expect(links['github']).toMatchObject({ label: 'LezardSC', href: PROFILE.github });
		expect(links['malt']).toMatchObject({ label: 'Malt', href: PROFILE.malt });
	});

	it('opens everything but email in a new tab', () => {
		const external = contactLinks('en', '', 'CV').map((l) => [l.id, l.external]);
		expect(external).toEqual([
			['email', false],
			['linkedin', true],
			['github', true],
			['malt', true],
			['cv', true]
		]);
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

- [ ] **Step 4: Write the failing icon tests**

Create `src/lib/data/contact-icons.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { logoColor, THEME_BG } from '$lib/skills';
import { CONTACT_BRANDS } from './contact-icons';

describe('contact brand icons', () => {
	it('has a logo for LinkedIn, GitHub and Malt', () => {
		expect(Object.keys(CONTACT_BRANDS).sort()).toEqual(['github', 'linkedin', 'malt']);
	});

	it.each(Object.entries(CONTACT_BRANDS))('%s has a path and a 6-digit hex colour', (_, icon) => {
		expect(icon.path).toMatch(/^M/);
		expect(icon.hex).toMatch(/^[0-9A-F]{6}$/i);
	});

	it.each(Object.entries(CONTACT_BRANDS))('%s shows its brand colour in at least one theme', (_, icon) => {
		const colours = [logoColor(icon.hex, THEME_BG.dark), logoColor(icon.hex, THEME_BG.light)];
		expect(colours).toContain(`#${icon.hex}`);
	});
});
```

- [ ] **Step 5: Run the tests to see them fail**

Run: `npm test`
Expected: FAIL - `contact.spec.ts` and `contact-icons.spec.ts` cannot resolve `./contact` / `./contact-icons`; profile tests fail on `undefined` email / linkedin / malt.

- [ ] **Step 6: Add the profile fields**

In `src/lib/data/profile.ts`, in the `Profile` type replace `github: string;` with:

```ts
	email: string;
	linkedin: string;
	github: string;
	malt: string;
```

and in `PROFILE` replace `github: 'https://github.com/LezardSC',` with:

```ts
	email: 'jocelynrenaultpro@gmail.com',
	linkedin: 'https://www.linkedin.com/in/jocelyn-renault/',
	github: 'https://github.com/LezardSC',
	malt: 'https://www.malt.fr/profile/jocelynrenault',
```

- [ ] **Step 7: Write the helper**

Create `src/lib/contact.ts`:

```ts
import { PROFILE } from '$lib/data/profile';
import type { Lang } from '$lib/i18n/lang';
import { assetHref } from '$lib/paths';

export type ContactId = 'email' | 'linkedin' | 'github' | 'malt' | 'cv';

/** Contacts drawn with a brand logo (the others use line icons). */
export type BrandContactId = Exclude<ContactId, 'email' | 'cv'>;

export type ContactLink = { id: ContactId; label: string; href: string; external: boolean };

/** Last path segment of a profile URL, e.g. '…/in/jocelyn-renault/' → 'jocelyn-renault'. */
export function profileHandle(url: string): string {
	return new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? '';
}

/** Contact tiles in display order. `cvLabel` comes from the dictionary. */
export function contactLinks(lang: Lang, base: string, cvLabel: string): ContactLink[] {
	return [
		{ id: 'email', label: PROFILE.email, href: `mailto:${PROFILE.email}`, external: false },
		{
			id: 'linkedin',
			label: profileHandle(PROFILE.linkedin),
			href: PROFILE.linkedin,
			external: true
		},
		{ id: 'github', label: profileHandle(PROFILE.github), href: PROFILE.github, external: true },
		{ id: 'malt', label: 'Malt', href: PROFILE.malt, external: true },
		{ id: 'cv', label: cvLabel, href: assetHref(base, PROFILE.cv[lang]), external: true }
	];
}
```

- [ ] **Step 8: Write the brand icons**

Create `src/lib/data/contact-icons.ts`. LinkedIn was removed from `simple-icons` at LinkedIn's request, so its path is inlined (the official "in" square logo, 24×24):

```ts
import { siGithub, siMalt } from 'simple-icons';
import type { BrandContactId } from '$lib/contact';
import type { SkillIcon } from '$lib/skills';

/** Brand logos for the contact tiles, 24×24 paths. Only `{ path, hex }` is kept from simple-icons. */
export const CONTACT_BRANDS: Record<BrandContactId, SkillIcon> = {
	linkedin: {
		path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
		hex: '0A66C2'
	},
	github: { path: siGithub.path, hex: siGithub.hex },
	malt: { path: siMalt.path, hex: siMalt.hex }
};
```

- [ ] **Step 9: Run the tests to see them pass**

Run: `npm test && npm run check`
Expected: all tests PASS, svelte-check 0 errors.

- [ ] **Step 10: Commit**

```bash
npm run format
git add src/lib/data/profile.ts src/lib/data/profile.spec.ts src/lib/contact.ts src/lib/contact.spec.ts src/lib/data/contact-icons.ts src/lib/data/contact-icons.spec.ts
git commit -m "feat: add contact data, tile helper and brand icons"
```

---

### Task 2: One shared "opens in a new tab" key

The Hero (`hero.newTab`) and Experience (`experience.newTab`) each have their own copy, and the French wording differs. Merge them into a top-level `newTab`, passed to sections as a prop.

**Files:**
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`
- Modify: `src/lib/i18n/dicts.spec.ts`
- Modify: `src/lib/components/sections/Hero.svelte`
- Modify: `src/lib/components/sections/Experience.svelte`
- Modify: `src/lib/components/experience/EducationItem.svelte`
- Modify: `src/routes/[lang=lang]/+page.svelte`

**Interfaces:**
- Produces: `Dict['newTab']: string` (en `'(opens in a new tab)'`, fr `'(s’ouvre dans un nouvel onglet)'`). `Hero` props become `{ lang, t, newTab }`; `Experience` props become `{ lang, title, t, newTab }`; `EducationItem` props become `{ item, lang, t, newTab }`.

- [ ] **Step 1: Write the failing test**

In `src/lib/i18n/dicts.spec.ts`, add at the end of the `describe` block:

```ts
	it.each(LANGS)('%s has a single top-level "opens in a new tab" text', (lang) => {
		const newTabKeys = keys(dicts[lang]).filter((k) => k.endsWith('newTab'));
		expect(newTabKeys).toEqual(['newTab']);
	});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm test -- dicts`
Expected: FAIL - found `['experience.newTab', 'hero.newTab']`.

- [ ] **Step 3: Move the key in both dictionaries**

`src/lib/i18n/en.ts`: delete `newTab: '(opens in a new tab)'` from `hero` (and the trailing comma on `github: 'GitHub',` becomes the last entry) and from `experience`. Add after `navLabel: 'Main',`:

```ts
	/** Screen-reader suffix for links that open in a new tab. */
	newTab: '(opens in a new tab)',
```

`src/lib/i18n/fr.ts`: delete `newTab` from `hero` and `experience`. Add after `navLabel: 'Principale',`:

```ts
	newTab: '(s’ouvre dans un nouvel onglet)',
```

- [ ] **Step 4: Pass `newTab` down**

`src/lib/components/sections/Hero.svelte`: change the props line to

```ts
	let { lang, t, newTab }: { lang: Lang; t: Dict['hero']; newTab: string } = $props();
```

and replace both `{t.newTab}` with `{newTab}`.

`src/lib/components/experience/EducationItem.svelte`: change the props line to

```ts
	let {
		item,
		lang,
		t,
		newTab
	}: { item: Education; lang: Lang; t: Dict['experience']; newTab: string } = $props();
```

and replace `{t.newTab}` with `{newTab}`.

`src/lib/components/sections/Experience.svelte`: change the props line to

```ts
	let {
		lang,
		title,
		t,
		newTab
	}: { lang: Lang; title: string; t: Dict['experience']; newTab: string } = $props();
```

and change `<EducationItem {item} {lang} {t} />` to `<EducationItem {item} {lang} {t} {newTab} />`.

`src/routes/[lang=lang]/+page.svelte`: change

```svelte
	<Hero lang={data.lang} t={t.hero} />
```
to
```svelte
	<Hero lang={data.lang} t={t.hero} newTab={t.newTab} />
```

and

```svelte
	<Experience lang={data.lang} title={t.sections.experience} t={t.experience} />
```
to
```svelte
	<Experience
		lang={data.lang}
		title={t.sections.experience}
		t={t.experience}
		newTab={t.newTab}
	/>
```

- [ ] **Step 5: Verify**

Run: `npm test && npm run check`
Expected: all PASS, 0 errors. (`grep -rn "t.newTab" src/lib` prints nothing.)

- [ ] **Step 6: Commit**

```bash
npm run format
git add src/lib/i18n src/lib/components/sections/Hero.svelte src/lib/components/sections/Experience.svelte src/lib/components/experience/EducationItem.svelte "src/routes/[lang=lang]/+page.svelte"
git commit -m "refactor: share one new-tab screen-reader text across sections"
```

---

### Task 3: Contact section

**Files:**
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`
- Create: `src/lib/components/contact/ContactIcon.svelte`
- Modify: `src/lib/components/sections/Contact.svelte` (full rewrite)
- Modify: `src/routes/[lang=lang]/+page.svelte`
- Modify: `docs/superpowers/specs/2026-09-23-portfolio-design.md` (LinkedIn logo line)

**Interfaces:**
- Consumes: `contactLinks`, `ContactId`, `BrandContactId` (`$lib/contact`); `CONTACT_BRANDS` (`$lib/data/contact-icons`); `logoColor`, `THEME_BG` (`$lib/skills`); `PROFILE.email`; `Dict['newTab']` (Task 2).
- Produces: `Dict['contact'] = { intro, cv, emailLabel, copy, copied }`; `Contact` props `{ lang: Lang; title: string; t: Dict['contact']; newTab: string }`; `ContactIcon` props `{ id: ContactId; size?: number }`. `Dict['placeholder']` is removed.

- [ ] **Step 1: Dictionary keys**

`src/lib/i18n/en.ts`: delete `placeholder: 'Coming soon.',` and add after the `experience` block:

```ts
	contact: {
		intro: 'Open to opportunities. Email is the fastest way to reach me.',
		cv: 'CV (PDF)',
		emailLabel: 'Send me an email',
		copy: 'Copy',
		copied: 'Copied!'
	},
```

`src/lib/i18n/fr.ts`: delete `placeholder: 'Bientôt disponible.',` and add after the `experience` block:

```ts
	contact: {
		intro: 'Ouvert aux opportunités. Le plus rapide pour me joindre, c’est l’e-mail.',
		cv: 'CV (PDF)',
		emailLabel: 'M’envoyer un e-mail',
		copy: 'Copier',
		copied: 'Copié !'
	},
```

(` ` is a no-break space so « ! » never wraps alone.)

- [ ] **Step 2: Icon component**

Create `src/lib/components/contact/ContactIcon.svelte`. Brand logos take their colour per theme from `logoColor` (same mechanism and selectors as `Skills.svelte`); email and CV are line icons in `--accent`, like `DomainIcon`.

```svelte
<script lang="ts">
	import type { ContactId } from '$lib/contact';
	import { CONTACT_BRANDS } from '$lib/data/contact-icons';
	import { logoColor, THEME_BG } from '$lib/skills';

	let { id, size = 28 }: { id: ContactId; size?: number } = $props();

	const brand = $derived(id === 'email' || id === 'cv' ? undefined : CONTACT_BRANDS[id]);
</script>

{#if brand}
	<svg
		class="brand"
		viewBox="0 0 24 24"
		width={size}
		height={size}
		fill="currentColor"
		aria-hidden="true"
		style:--logo-dark={logoColor(brand.hex, THEME_BG.dark)}
		style:--logo-light={logoColor(brand.hex, THEME_BG.light)}
	>
		<path d={brand.path} />
	</svg>
{:else}
	<svg
		class="line"
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
		{#if id === 'email'}
			<rect x="3" y="5" width="18" height="14" rx="2" />
			<path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
		{:else}
			<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
			<path d="M14 3v5h5M9 13h6M9 17h6" />
		{/if}
	</svg>
{/if}

<style>
	svg {
		flex-shrink: 0;
	}
	.line {
		color: var(--accent);
	}
	/* Brand colour per theme (computed by logoColor); same theme selectors as src/app.css. */
	.brand {
		color: var(--logo-dark);
	}
	:global(:root[data-theme='light']) .brand {
		color: var(--logo-light);
	}
	@media (prefers-color-scheme: light) {
		:global(:root:not([data-theme])) .brand {
			color: var(--logo-light);
		}
	}
</style>
```

- [ ] **Step 3: Contact section**

Replace `src/lib/components/sections/Contact.svelte` entirely:

```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import { contactLinks } from '$lib/contact';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import ContactIcon from '../contact/ContactIcon.svelte';
	import Section from '../Section.svelte';

	let {
		lang,
		title,
		t,
		newTab
	}: { lang: Lang; title: string; t: Dict['contact']; newTab: string } = $props();

	const links = $derived(contactLinks(lang, base, t.cv));

	let copied = $state(false);
	let address: HTMLElement | undefined = $state();
	let timer: ReturnType<typeof setTimeout> | undefined;

	/** Copy the address; if the clipboard is unavailable (plain http, denied), select it instead. */
	async function copy() {
		try {
			await navigator.clipboard.writeText(PROFILE.email);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 2000);
		} catch {
			if (!address) return;
			const range = document.createRange();
			range.selectNodeContents(address);
			const selection = getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);
		}
	}
</script>

<Section id="contact" {title}>
	<p class="intro">{t.intro}</p>
	<ul class="tiles">
		{#each links as link (link.id)}
			<li>
				{#if link.id === 'email'}
					<div class="tile">
						<a class="mail" href={link.href} aria-label={t.emailLabel}>
							<ContactIcon id="email" />
						</a>
						<span class="label" bind:this={address}>{link.label}</span>
						<button type="button" class="copy" onclick={copy}>
							{copied ? t.copied : t.copy}
						</button>
					</div>
				{:else}
					<a
						class="tile"
						href={link.href}
						target={link.external ? '_blank' : undefined}
						rel={link.external ? 'noopener noreferrer' : undefined}
					>
						<ContactIcon id={link.id} />
						<span class="label">{link.label}</span>
						{#if link.external}<span class="sr-only">{newTab}</span>{/if}
					</a>
				{/if}
			</li>
		{/each}
	</ul>
	<p class="sr-only" aria-live="polite">{copied ? t.copied : ''}</p>
</Section>

<style>
	.intro {
		margin: -0.5rem 0 2rem;
		text-align: center;
		color: var(--muted);
	}
	.tiles {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
	}
	.tile {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		height: 100%;
		padding: 0.75rem 1.1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		color: var(--text);
		font-weight: 500;
		text-decoration: none;
		transition:
			border-color 0.15s,
			transform 0.15s;
	}
	.tile:hover,
	a.tile:focus-visible,
	.tile:has(:focus-visible) {
		border-color: var(--accent);
		transform: translateY(-2px);
	}
	.mail {
		display: flex;
		border-radius: 0.25rem;
	}
	.label {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.copy {
		flex-shrink: 0;
		min-width: 4.5rem;
		margin-left: auto;
		padding: 0.2rem 0.7rem;
		font: inherit;
		font-size: 0.85rem;
		color: var(--muted);
		background: none;
		border: 1px solid var(--border);
		border-radius: 999px;
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.copy:hover {
		color: var(--accent);
		border-color: var(--accent);
	}
	@media (prefers-reduced-motion: reduce) {
		.tile {
			transition: border-color 0.15s;
		}
		.tile:hover,
		a.tile:focus-visible,
		.tile:has(:focus-visible) {
			transform: none;
		}
	}
	@media (max-width: 40rem) {
		.tiles {
			flex-direction: column;
		}
	}
</style>
```

- [ ] **Step 4: Wire it into the page**

In `src/routes/[lang=lang]/+page.svelte` replace `<Contact {t} />` with:

```svelte
	<Contact lang={data.lang} title={t.sections.contact} t={t.contact} newTab={t.newTab} />
```

- [ ] **Step 5: Verify**

Run: `npm test && npm run check && npm run lint`
Expected: all PASS, 0 errors, Prettier clean (run `npm run format` first if lint complains). `grep -rn "placeholder" src/lib/i18n` prints nothing.

- [ ] **Step 6: Manual behaviour check (dev server)**

Run `npm run dev`, open `/en/#contact`, and in the browser (or a Playwright script from the scratchpad, see Task 5):
- Click **Copy**: label turns "Copied!", back to "Copy" after 2 s. Click twice 1 s apart: it stays "Copied!" until 2 s after the second click.
- In the console run `Object.defineProperty(navigator, 'clipboard', { value: undefined })`, click **Copy**: no error in the console, the address text is selected.
- Tab through the tiles: every tile shows the accent border on focus; the envelope and the Copy button are separate focus stops in the email tile.

- [ ] **Step 7: Update the spec's LinkedIn logo line**

In `docs/superpowers/specs/2026-09-23-portfolio-design.md`, "Contact & Footer" section, replace the sentence
`LinkedIn is not in \`simple-icons\` (removed at LinkedIn's request): new \`components/icons/LinkedInIcon.svelte\`.`
with
`LinkedIn is not in \`simple-icons\` (removed at LinkedIn's request), so its path is inlined next to the others in \`src/lib/data/contact-icons.ts\` (\`CONTACT_BRANDS\`); \`components/contact/ContactIcon.svelte\` draws all five logos.`

- [ ] **Step 8: Commit**

```bash
npm run format
git add src/lib/i18n src/lib/components/contact src/lib/components/sections/Contact.svelte "src/routes/[lang=lang]/+page.svelte" docs/superpowers/specs/2026-09-23-portfolio-design.md
git commit -m "feat: add contact tiles with copyable email"
```

---

### Task 4: Footer

**Files:**
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`
- Create: `src/lib/components/Footer.svelte`
- Modify: `src/routes/[lang=lang]/+page.svelte`

**Interfaces:**
- Consumes: `PROFILE.name`; `#hero` id on the Hero `<section>`.
- Produces: `Dict['footer'] = { backToTop }`; `Footer` props `{ t: Dict['footer'] }`.

- [ ] **Step 1: Dictionary keys**

`src/lib/i18n/en.ts`, after the `contact` block:

```ts
	footer: {
		backToTop: 'Back to top'
	},
```

`src/lib/i18n/fr.ts`, after the `contact` block:

```ts
	footer: {
		backToTop: 'Retour en haut'
	},
```

- [ ] **Step 2: Component**

Create `src/lib/components/Footer.svelte`. The year is computed at build time (prerendered), so it updates on every rebuild.

```svelte
<script lang="ts">
	import { PROFILE } from '$lib/data/profile';
	import type { Dict } from '$lib/i18n';

	let { t }: { t: Dict['footer'] } = $props();

	const year = new Date().getFullYear();
</script>

<footer>
	<div class="inner">
		<p>© {year} {PROFILE.name}</p>
		<a href="#hero">{t.backToTop} <span aria-hidden="true">↑</span></a>
	</div>
</footer>

<style>
	footer {
		border-top: 1px solid var(--border);
	}
	.inner {
		max-width: 72rem;
		margin: 0 auto;
		padding: 1.5rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem 1rem;
		font-size: 0.9rem;
		color: var(--muted);
	}
	p {
		margin: 0;
	}
	a {
		color: var(--muted);
		text-decoration: none;
	}
	a:hover {
		color: var(--accent);
	}
	@media (max-width: 40rem) {
		.inner {
			flex-direction: column;
			text-align: center;
		}
	}
</style>
```

- [ ] **Step 3: Wire it into the page**

In `src/routes/[lang=lang]/+page.svelte`, add the import next to the others:

```ts
	import Footer from '$lib/components/Footer.svelte';
```

and after `</main>` add:

```svelte

<Footer t={t.footer} />
```

- [ ] **Step 4: Verify**

Run: `npm test && npm run check && npm run lint`
Expected: all PASS (the dicts completeness test now covers `footer.backToTop`), 0 errors.

- [ ] **Step 5: Commit**

```bash
npm run format
git add src/lib/i18n src/lib/components/Footer.svelte "src/routes/[lang=lang]/+page.svelte"
git commit -m "feat: add site footer with back-to-top link"
```

---

### Task 5: Build and visual check

**Files:** none in the repo (scripts and screenshots go in the session scratchpad).

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: succeeds; `build/en/index.html` and `build/fr/index.html` contain `jocelynrenaultpro@gmail.com` and `mailto:`.

Run: `grep -c 'mailto:jocelynrenaultpro@gmail.com' build/en/index.html build/fr/index.html`
Expected: each ≥ 1.

- [ ] **Step 2: Screenshots**

Install `playwright` in the scratchpad (never in the project; Chromium is cached in `~/.cache/ms-playwright`). Start `npx vite preview --port 4317 --strictPort` from the worktree (restart it after any rebuild). For `en` and `fr`, dark and light (`colorScheme` on `newPage` + `document.documentElement.dataset.theme = <theme>`), at widths 1280 and 375, screenshot the `#contact` section and the `footer`.

Also, at widths 375 and 320, assert no horizontal scroll:

```js
const overflow = await page.evaluate(
	() => document.documentElement.scrollWidth - document.documentElement.clientWidth
);
if (overflow > 0) throw new Error(`horizontal overflow of ${overflow}px`);
```

- [ ] **Step 3: Look at the screenshots**

Check: tiles centered and wrapping at 1280 (stacked full-width at 375); GitHub logo visible in dark (falls back to text colour); LinkedIn and Malt in brand colour in both themes; envelope and CV icons in accent; email wraps rather than overflowing at 320; footer on one row at 1280, stacked and centered at 375. Fix anything off, rerun `npm test && npm run check && npm run lint`, and commit with a `fix:` or `style:` message.
