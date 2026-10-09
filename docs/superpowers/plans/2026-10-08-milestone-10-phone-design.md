# Milestone 10 - Phone design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give phones (`width < 48rem`) the layouts validated on the Claude Design board "Mobile - clair / sombre": header with a Contact button, compact hero tiles, folded About, blurred-photo featured cards, domain-tinted project tiles with one-sentence summaries, skills accordion, collapsed recommendations, compact contact. Desktop stays exactly as M9.

**Architecture:** One set of markup per component, restyled by `@media (width < 48rem)` blocks that replace the M8 phone styles. Where phone and desktop need different controls, both exist and CSS shows one set per width. Everything the phone folds away is only folded after hydration. Decisions live in small pure, tested functions (`mainDomain`, `hiddenCount`, `panelHidden`, `mixHex`); components only render and wire.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, adapter-static (prerendered), TypeScript, Vitest, Playwright (screenshots, audit).

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section **"Milestone 10 - Phone design"** (it supersedes the M8 phone presentation and the M7 phone menu). Design sources: `docs/superpowers/designs/2026-10-08-m10-final/` (`Mobile-Clair.dc.html` holds every value; `README.md` lists the choice per section). They only render inside the canvas https://claude.ai/artifact/9N2zK35VungBsy2GnLcE59, so use them as a value reference.

## Global Constraints

- Work in the worktree `/home/lezard/portfolio/.claude/worktrees/milestone-10-phone-design` (local branch `worktree-milestone-10-phone-design`, remote branch `milestone-10-phone-design`). Node 24 (`node -v`; if not 24: `source ~/.nvm/nvm.sh && nvm use 24`).
- **Phone = `width < 48rem`** (same breakpoint as `DESKTOP_QUERY` in `src/lib/projects.ts`). Every phone change goes in a `@media (width < 48rem)` block. **Desktop (48rem and up) must not change**; Task 9 checks it against M9.
- **Match the board.** Every size, colour, spacing and text comes from the spec's M10 section / `Mobile-Clair.dc.html`. Sizes in `rem` = board px ÷ 16 (borders, shadows, 1–2px lines stay in px). Any deliberate deviation goes into the review guide's "Deviations" list.
- **Collapsibles rule:** content the phone folds (About paragraphs, recommendations, other projects beyond 6, closed skill groups) is folded **only after hydration** (`ready`/`enhanced` flag set in `onMount`). Without JS everything is visible and the toggle buttons don't exist. Toggles are `<button type="button">` with `aria-expanded` and `aria-controls`.
- Svelte 5 runes only (`$props`, `$state`, `$derived`, `$effect`); no `export let`, no `$:`, no stores. No `svelte.config.js`.
- UI text only in `src/lib/i18n/en.ts` and `fr.ts` (`fr` typed `Dict`, so every key exists in both; dict leaves are strings; templates use `{name}` filled by `fill()` from `$lib/i18n/format`).
- French typography: U+00A0 (` `) before `: ; ! ? %` and inside « », and in "48 h"; typographic apostrophe `’`. `src/lib/i18n/typography.spec.ts` scans dicts and data.
- External links keep `target="_blank" rel="noopener noreferrer"` plus `<span class="sr-only">{newTab}</span>`.
- Touch targets ≥ 44px (`min-height: 2.75rem`). Nothing scrolls sideways at 360px.
- Hover effects stay under `@media (hover: hover) and (pointer: fine)`.
- Never commit `tmp/`, `reports/`, stock photos or `*:Zone.Identifier` files. Add files by path (no `git add -A`).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- After each task: `npm run format && npm run lint && npm run check && npm test` all clean.
- **Visual check after each UI task:** `npm run build`, then `npx vite preview --port 4181 --strictPort` (restart it after every rebuild: it caches the file list). Screenshot the section with a scratchpad Playwright script at 390×900 and 360×900, both themes (`page.evaluate(t => document.documentElement.dataset.theme = t, 'light')`), FR and EN, with `reducedMotion: 'reduce'` (otherwise scroll reveal leaves sections at opacity 0). Scripts live in the session scratchpad, never in the repo. Compare against the values in `Mobile-Clair.dc.html`.

## Review Focus

- **Folded content without JS:** with JS disabled, every About paragraph, every recommendation, all small project tiles and all six skill groups must be visible, and no toggle button rendered. Pinned in Tasks 3, 5, 6 and 7 (a `javaScriptEnabled: false` Playwright check in each visual step) and by the audit's before-hydration axe pass.
- **Crossing the 48rem breakpoint with state:** close every skill group on a phone, or leave the other projects folded, then widen past 48rem → desktop must show the selected tab's panel and every project card; narrow back → the phone state returns. Pinned by `panelHidden` tests (Task 6) and a resize check in Tasks 5 and 6.
- **Narrowest phones (360px), French:** the selects ("Professionnel", "Bas niveau"), the hero buttons "Voir le CV" + "Malt ↗", tile titles like `ft_linear_regression`, "Voir les 5 autres projets", the e-mail address on one line and the three contact buttons must fit without clipping or sideways scroll. Pinned by measurement steps in Tasks 4, 5 and 8 and the audit overflow check.
- **Filters vs folded tiles:** expand the other projects, then change a filter or the sort → the list folds back; a filter leaving ≤ 6 small projects → no button at all; leaving exactly 7 → "Voir 1 autre projet". Pinned by `hiddenCount` tests and Task 5 Step 7.
- **Find-in-page and deep links into folded content:** Ctrl+F for a skill in a closed accordion group must open that group (`hidden="until-found"` + `beforematch`), on phone and desktop. Pinned in Task 6 Step 7.

---

### Task 0: Worktree setup

**Files:** none.

- [ ] **Step 1: Create the worktree from the design branch and confirm a green baseline**

```bash
cd /home/lezard/portfolio
git fetch origin
git worktree add .claude/worktrees/milestone-10-phone-design -b worktree-milestone-10-phone-design milestone-10-phone-design
cd .claude/worktrees/milestone-10-phone-design
git merge --no-edit origin/master   # picks up the PR #9 merge commit if master moved; otherwise "Already up to date"
node -v                             # must print v24.x
npm ci
npm test && npm run check && npm run lint
```

Expected: all pass (the M9 baseline). `tmp/` is not in the worktree: stock photos are read from `/home/lezard/portfolio/tmp/`.

---

### Task 1: Data - main domain, domain colours, summaries, pitch and glance

**Files:**
- Create: `src/lib/color.ts`, `src/lib/color.spec.ts`
- Modify: `src/lib/projects.ts` (type + helpers), `src/lib/projects.spec.ts`
- Modify: `src/lib/data/projects.ts` (a `summary` on all 17 projects), `src/lib/data/projects.spec.ts`
- Modify: `src/lib/data/profile.ts` (`pitch` split, glance `short`/`wide`), `src/lib/data/profile.spec.ts`
- Modify: `src/lib/components/sections/Hero.svelte` (render `pitchMore` so desktop text is unchanged)

**Interfaces:**
- Produces: `mixHex(a: string, b: string, weight: number): string` in `$lib/color`; in `$lib/projects`: `Project.summary: Localized`, `mainDomain(p: Project): Domain`, `DOMAIN_COLOR: Record<Domain, string>`, `DOMAIN_TILE: { light: { base: string; pct: number; fg: number }; dark: {…} }`, `PHONE_OTHERS = 6`, `hiddenCount(total: number, shown?: number): number`; in `$lib/data/profile`: `Profile.pitchMore: Localized`, `GlanceRow.short?: Localized`, `GlanceRow.wide?: true`.

- [ ] **Step 1: Write the failing tests for `mixHex`**

Create `src/lib/color.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mixHex } from './color';

describe('mixHex', () => {
	it('returns a at weight 1 and b at weight 0', () => {
		expect(mixHex('#c2391b', '#ffffff', 1)).toBe('#c2391b');
		expect(mixHex('#c2391b', '#ffffff', 0)).toBe('#ffffff');
	});
	it('mixes channel by channel, like color-mix(in srgb)', () => {
		expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
		expect(mixHex('#10100e', '#0b6e6e', 0.35)).toBe('#0d4d4c');
	});
	it('accepts colours without #', () => {
		expect(mixHex('000000', 'ffffff', 0.25)).toBe('#bfbfbf');
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/color.spec.ts`
Expected: FAIL (cannot find module `./color`).

- [ ] **Step 3: Implement `mixHex`**

Create `src/lib/color.ts`:

```ts
const channels = (hex: string) => {
	const h = hex.replace('#', '');
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

/** `a` mixed with `b`, `weight` (0–1) being the share of `a`: CSS `color-mix(in srgb, a w, b)`. */
export function mixHex(a: string, b: string, weight: number): string {
	const [x, y] = [channels(a), channels(b)];
	return (
		'#' +
		x
			.map((v, i) =>
				Math.round(v * weight + y[i] * (1 - weight))
					.toString(16)
					.padStart(2, '0')
			)
			.join('')
	);
}
```

Run: `npx vitest run src/lib/color.spec.ts` → PASS.

- [ ] **Step 4: Write the failing tests for the project helpers**

Append to `src/lib/projects.spec.ts` (add `DOMAIN_COLOR, DOMAIN_TILE, DOMAINS, hiddenCount, mainDomain, PHONE_OTHERS` to its import from `./projects`, plus these imports):

```ts
import { mixHex } from './color';
import { contrastRatio } from './skills';

describe('mainDomain', () => {
	it('is the first domain of the list', () => {
		const p = { domains: ['blockchain', 'web'] } as Project;
		expect(mainDomain(p)).toBe('blockchain');
	});
});

describe('hiddenCount', () => {
	it('counts the tiles past the first PHONE_OTHERS', () => {
		expect(PHONE_OTHERS).toBe(6);
		expect(hiddenCount(11)).toBe(5);
		expect(hiddenCount(7)).toBe(1);
	});
	it('is 0 when everything fits', () => {
		expect(hiddenCount(6)).toBe(0);
		expect(hiddenCount(3)).toBe(0);
		expect(hiddenCount(0)).toBe(0);
	});
	it('takes another number of shown tiles', () => {
		expect(hiddenCount(4, 2)).toBe(2);
	});
});

describe('domain tiles (phone)', () => {
	// Page text colours per theme (src/app.css).
	const TEXT = {
		light: { body: '#2b2a26', muted: '#56534c' },
		dark: { body: '#d9d5cb', muted: '#a9a498' }
	};
	it.each(DOMAINS)('%s has a colour whose tile reads at 4.5:1 in both themes', (d) => {
		for (const theme of ['light', 'dark'] as const) {
			const { base, pct, fg } = DOMAIN_TILE[theme];
			const bg = mixHex(DOMAIN_COLOR[d], base, pct);
			const label = mixHex(DOMAIN_COLOR[d], '#ffffff', fg);
			expect(contrastRatio(label, bg), `${theme} label`).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(TEXT[theme].body, bg), `${theme} body`).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(TEXT[theme].muted, bg), `${theme} muted`).toBeGreaterThanOrEqual(4.5);
		}
	});
	it('gives every domain its own colour', () => {
		expect(new Set(Object.values(DOMAIN_COLOR)).size).toBe(DOMAINS.length);
	});
});
```

(If `Project` is not yet imported as a type in that file, add `type Project` to the import.)

- [ ] **Step 5: Run them to verify they fail**

Run: `npx vitest run src/lib/projects.spec.ts`
Expected: FAIL (`mainDomain`, `DOMAIN_COLOR`… not exported).

- [ ] **Step 6: Implement the helpers in `src/lib/projects.ts`**

In the `Project` type, after `description: Localized;` add:

```ts
	/** One sentence for the phone tiles (any project can land in the small tier after filtering). */
	summary: Localized;
```

After the `Project` type, add:

```ts
/** A project's main domain: the first of its list. It sets the card icon, label and colour; filters still match every domain. */
export function mainDomain(p: Project): Domain {
	return p.domains[0];
}

/** Base colour per domain: phone project tiles, and phone featured cards without media. */
export const DOMAIN_COLOR: Record<Domain, string> = {
	web: '#5b3fa0',
	blockchain: '#24408e',
	ai: '#0b6e6e',
	'low-level': '#c2391b',
	games: '#7a2e5e'
};

/**
 * Phone tile colours per theme: background = domain colour at `pct` over `base`; label, rule and
 * watermark = domain colour mixed `fg` with white. Keep in sync with `--tile-*` in src/app.css
 * (theme-tokens.spec.ts checks it).
 */
export const DOMAIN_TILE = {
	light: { base: '#ffffff', pct: 0.11, fg: 1 },
	dark: { base: '#121210', pct: 0.24, fg: 0.45 }
} as const;

/** Small project tiles shown on phones before the "See N other projects" button. */
export const PHONE_OTHERS = 6;

/** How many small tiles the phone folds behind the button. */
export function hiddenCount(total: number, shown = PHONE_OTHERS): number {
	return Math.max(0, total - shown);
}
```

Run: `npx vitest run src/lib/projects.spec.ts` → PASS. (`npm run check` now fails until Step 8 adds the summaries.)

- [ ] **Step 7: Write the failing data tests**

In `src/lib/data/projects.spec.ts`, inside `describe('project data')`, add:

```ts
	it('has a one-sentence summary in both languages', () => {
		for (const p of PROJECTS)
			for (const lang of ['en', 'fr'] as const) {
				const s = p.summary[lang];
				expect(s.trim(), `${p.id} ${lang}`).not.toBe('');
				expect(s, `${p.id} ${lang}: one sentence ending with a full stop`).toMatch(/^[^.]+\.$/);
				expect(s.length, `${p.id} ${lang}: short enough for a tile`).toBeLessThanOrEqual(100);
			}
	});
```

In `src/lib/data/profile.spec.ts`: in "has non-empty text in both languages" change the `texts` array to

```ts
		const texts = [
			PROFILE.role,
			PROFILE.pitch,
			PROFILE.pitchMore,
			...PROFILE.bio,
			...PROFILE.glance.flatMap((r) => [r.label, r.value, ...(r.short ? [r.short] : [])])
		];
```

and add:

```ts
	it('has exactly one full-width glance row on phones: Stack', () => {
		expect(PROFILE.glance.filter((r) => r.wide).map((r) => r.label.en)).toEqual(['Stack']);
	});

	it('has phone short values for Education and Latest role', () => {
		expect(PROFILE.glance.filter((r) => r.short).map((r) => r.label.en)).toEqual([
			'Education',
			'Latest role'
		]);
	});
```

- [ ] **Step 8: Add the data**

`src/lib/data/profile.ts`:
- In `GlanceRow`: `export type GlanceRow = { label: Localized; value: Localized; /** Shorter value for the phone tiles. */ short?: Localized; /** Full-width tile on phones. */ wide?: true };`
- In `Profile`, after `pitch: Localized;`: `/** Rest of the pitch: desktop only (phones show the first sentence). */ pitchMore: Localized;`
- Replace `pitch` with:

```ts
	pitch: {
		en: 'I build the invisible part of products: APIs, services, data processing, automation and deployment.',
		fr: 'Je conçois la partie invisible des produits : APIs, services, traitement de données, automatisation et mise en production.'
	},
	pitchMore: {
		en: 'My field is backend and low-level - reliability and performance over UI.',
		fr: 'Mon terrain, c’est le backend et le bas niveau - la fiabilité et la performance plutôt que l’interface.'
	},
```

- In `glance`: Education row gets `short: { en: '42 Lyon · RNCP 7', fr: '42 Lyon · RNCP 7' }`; Latest role row gets `short: { en: 'Sogeti (Capgemini)', fr: 'Sogeti (Capgemini)' }`; Stack row gets `wide: true`.

`src/lib/data/projects.ts`: add `summary` right after each project's `description`, exactly:

| id | `en` | `fr` |
|---|---|---|
| `kayp-pbw-2024` | `Maritime bills of lading as electronic documents, encrypted and anchored on the XRP Ledger.` | `Des connaissements maritimes électroniques, chiffrés et ancrés sur le XRP Ledger.` |
| `kayp-h-web3-paris` | `The weekend prototype of KAYP: bills of lading secured on the blockchain.` | `Le prototype de KAYP, en un week-end : des connaissements sécurisés sur la blockchain.` |
| `ft-transcendence` | `Online multiplayer Pong with tournaments, 3D rendering and an AI opponent.` | `Un Pong multijoueur en ligne avec tournois, rendu 3D et IA adverse.` |
| `microcode` | `An AI agent written from scratch on a local Ollama model.` | `Un agent IA écrit de zéro, sur un modèle Ollama local.` |
| `bahapad` | `A launchpad to deploy your own ERC-20 token on Bahamut.` | `Un launchpad pour déployer son propre token ERC-20 sur Bahamut.` |
| `goldeneye-data-augmentation` | `Data augmentation for a SogetiLabs computer-vision project.` | `Augmentation de données pour un projet de vision par ordinateur de SogetiLabs.` |
| `tokenizart` | `A one-of-a-kind ERC-721 NFT on Sepolia, with its metadata on IPFS.` | `Un NFT ERC-721 unique sur Sepolia, avec ses métadonnées sur IPFS.` |
| `tokenizer` | `A multisig-approved ERC-20 token for 42’s wallet.` | `Un token ERC-20 à validation multisignature pour le porte-monnaie de 42.` |
| `ft-linear-regression` | `A from-scratch linear regression that predicts a car’s price.` | `Régression linéaire écrite de zéro qui prédit le prix d’une voiture.` |
| `dslr` | `A hand-coded one-vs-all logistic regression, Hogwarts sorting hat style.` | `Régression logistique one-vs-all recodée à la main, façon Choixpeau de Poudlard.` |
| `leaffliction` | `Leaf disease detection with a convolutional neural network.` | `Détection de maladies des feuilles par un réseau de neurones convolutif.` |
| `libasm` | `Standard C functions rewritten in x86-64 assembly.` | `Des fonctions C standard réécrites en assembleur x86-64.` |
| `libft` | `My own C standard library, validated at 125%.` | `Ma propre bibliothèque standard C, validée à 125 %.` |
| `ft-printf` | `A re-implementation of printf, as a static library.` | `Une réimplémentation de printf, en bibliothèque statique.` |
| `get-next-line` | `Reading a file line by line, whatever the buffer size.` | `Lire un fichier ligne par ligne, quelle que soit la taille du buffer.` |
| `confiture-de-jeu` | `A 48-hour platformer where a mask reveals hidden platforms.` | `Un jeu de plateforme en 48 h où un masque révèle des plateformes cachées.` |
| `love-takedown` | `A game made as a team during a game jam.` | `Un jeu réalisé en équipe lors d’une game jam.` |

Write ` ` literally in the source (as the file already does). Example of the shape:

```ts
		summary: {
			en: 'A 48-hour platformer where a mask reveals hidden platforms.',
			fr: 'Un jeu de plateforme en 48 h où un masque révèle des plateformes cachées.'
		},
```

- [ ] **Step 9: Keep the desktop pitch whole**

In `src/lib/components/sections/Hero.svelte` replace `<p class="pitch">{PROFILE.pitch[lang]}</p>` with:

```svelte
			<p class="pitch">
				{PROFILE.pitch[lang]}<span class="pitch-more"> {PROFILE.pitchMore[lang]}</span>
			</p>
```

- [ ] **Step 10: Run everything**

Run: `npm run format && npm run lint && npm run check && npm test`
Expected: all pass (typography tests now also scan the summaries and the split pitch).

- [ ] **Step 11: Commit**

```bash
git add src/lib/color.ts src/lib/color.spec.ts src/lib/projects.ts src/lib/projects.spec.ts src/lib/data/projects.ts src/lib/data/projects.spec.ts src/lib/data/profile.ts src/lib/data/profile.spec.ts src/lib/components/sections/Hero.svelte
git commit -m "feat: project summaries, main domain and domain colours; split pitch and short glance values

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Phone foundations, section header and header bar

**Files:**
- Modify: `src/app.css` (phone base block)
- Modify: `src/lib/components/Section.svelte` (phone block)
- Modify: `src/lib/components/Nav.svelte` (remove the menu; Contact button)
- Delete: `src/lib/nav-menu.ts`, `src/lib/nav-menu.spec.ts`
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts` (remove `menu`)
- Modify: `scripts/audit.ts` (no menu to open)

**Interfaces:**
- Consumes: `t.nav.contact` (exists: "Contact" in both dicts).
- Produces: `--nav-h: 3.75rem` on phones; header has no `.menu-btn` any more.

- [ ] **Step 1: Phone base styles**

In `src/app.css`, right after the `.btn-primary:hover { … }` rule, add:

```css
/* Phone (M10): shorter header bar, 17px text, narrower button padding. */
@media (width < 48rem) {
	:root {
		--nav-h: 3.75rem;
	}
	body {
		font-size: 1.0625rem;
	}
	.btn {
		padding: 0 1rem;
	}
}
```

- [ ] **Step 2: Section header on one line**

In `src/lib/components/Section.svelte`, replace the whole `@media (width < 48rem) { … }` block (comment included) with:

```css
	/* Phone: outlined number and title on one line, lead below. */
	@media (width < 48rem) {
		section {
			padding: 0 1.25rem;
		}
		.inner {
			display: block;
			padding: 3rem 0;
		}
		.head {
			display: flex;
			flex-wrap: wrap;
			align-items: flex-end;
			column-gap: 0.875rem;
			margin-bottom: 1.25rem;
		}
		.num {
			font-size: 2.875rem;
			line-height: 0.8;
			/* Half of it shows outside the fill: a 1.5px outline. */
			-webkit-text-stroke-width: 3px;
		}
		h2 {
			margin: 0;
			font-size: 1.8125rem;
			line-height: 1.05;
			letter-spacing: -0.03em;
		}
		.lead {
			flex-basis: 100%;
			margin-top: 0.625rem;
			font-size: 0.9375rem;
		}
	}
```

- [ ] **Step 3: Header without the menu, with a Contact button**

Replace `src/lib/components/Nav.svelte` with:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import { assetHref } from '$lib/paths';
	import { SECTIONS, sectionNumber, type SectionId } from '$lib/sections';
	import { currentSection } from '$lib/sections-dom';
	import LangSwitch from './LangSwitch.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { lang, t }: { lang: Lang; t: Dict } = $props();

	/** Section on screen; null on the hero. */
	let active = $state<SectionId | null>(null);

	onMount(() => {
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
		return () => {
			removeEventListener('scroll', track);
			removeEventListener('resize', track);
			cancelAnimationFrame(frame);
		};
	});
</script>

<header class="nav">
	<a class="brand" href="#hero">{PROFILE.name}</a>
	<nav aria-label={t.navLabel}>
		<ul role="list">
			{#each SECTIONS as id (id)}
				<li>
					<a href="#{id}" aria-current={active === id ? 'true' : undefined}
						><span class="n" aria-hidden="true">{sectionNumber(id)}</span>{t.nav[id]}</a
					>
				</li>
			{/each}
		</ul>
	</nav>
	<div class="actions">
		<ThemeToggle t={t.theme} />
		<LangSwitch {lang} t={t.langSwitch} />
		<a
			class="btn btn-primary cv"
			href={assetHref(base, PROFILE.cv[lang])}
			target="_blank"
			rel="noopener noreferrer">{t.navCv} <span class="sr-only">{t.newTab}</span></a
		>
		<a class="btn btn-primary contact" href="#contact">{t.nav.contact}</a>
	</div>
</header>
```

In its `<style>`: keep every rule from `.nav` to `.cv` unchanged; delete `.menu-btn`, `.menu-btn:hover` and the whole `@media (max-width: 47.49rem)` block; then add:

```css
	.contact {
		display: none;
		min-height: 2.75rem;
		padding: 0 0.875rem;
		font-size: 0.9375rem;
	}
	/* Phone: name, theme, language and a Contact button; no section links (no menu). */
	@media (width < 48rem) {
		.nav {
			justify-content: space-between;
			gap: 0.5rem;
			padding: 0 1.25rem;
			background: color-mix(in srgb, var(--bg) 92%, transparent);
		}
		.brand {
			font-size: 1.125rem;
		}
		nav,
		.cv {
			display: none;
		}
		.actions {
			gap: 0.375rem;
		}
		.contact {
			display: inline-flex;
		}
	}
```

- [ ] **Step 4: Remove the menu module, key and audit step**

```bash
git rm src/lib/nav-menu.ts src/lib/nav-menu.spec.ts
grep -rn "nav-menu\|menu-btn\|t\.menu\b" src scripts
```

Expected after the edits below: no output.
- `src/lib/i18n/en.ts`: delete the `menu: 'Menu',` line and its comment above. `fr.ts`: delete `menu: 'Menu',`.
- `scripts/audit.ts`: delete the two lines `await page.click('.menu-btn');` and `checks.push(await axe(page, \`${label} menu open\`, \`${file}-menu\`));`; in the header comment (line ~4) remove "menu open, ".

- [ ] **Step 5: Run the checks**

Run: `npm run format && npm run lint && npm run check && npm test`
Expected: all pass.

- [ ] **Step 6: Visual check**

Build and preview (see Global Constraints). At 390px: header 60px tall, name left, theme + EN + filled "Contact" right; tapping Contact scrolls to Contact with its title not hidden under the bar (`scroll-padding-top` follows `--nav-h`). Section headers: "01" outlined (thin 1.5px line) and "À propos" on one line, bottom-aligned. At 360px FR: the header fits (no overlap). At 1280px: nav unchanged from M9 (links, CV button, no Contact button).

- [ ] **Step 7: Commit**

```bash
git add src/app.css src/lib/components/Section.svelte src/lib/components/Nav.svelte src/lib/i18n/en.ts src/lib/i18n/fr.ts scripts/audit.ts
git commit -m "feat: phone header with a Contact button instead of the menu; one-line section headers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(`git rm` already staged the deleted files.)

---

### Task 3: Hero tiles and folded About

**Files:**
- Modify: `src/lib/components/sections/Hero.svelte`
- Modify: `src/lib/components/sections/About.svelte`
- Modify: `src/routes/[lang=lang]/+page.svelte` (pass `common` to About)
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`

**Interfaces:**
- Consumes: `PROFILE.pitchMore`, `GlanceRow.short`, `GlanceRow.wide` (Task 1).
- Produces: dict keys `hero.maltShort`, `common.readMore`, `common.showLess`; About prop `common: Dict['common']`; About toggle button class `.read-more` (the audit clicks it in Task 9).

- [ ] **Step 1: Strings**

`en.ts`: in `hero` add `maltShort: 'Malt',`; add a top-level group after `skipToContent`/`newTab` lines:

```ts
	/** Shared toggle labels for folded text. */
	common: {
		readMore: 'Read more',
		showLess: 'Show less'
	},
```

`fr.ts`: `hero.maltShort: 'Malt',` and

```ts
	common: {
		readMore: 'Lire la suite',
		showLess: 'Réduire'
	},
```

(`experience.readMore/showLess` stay until Task 7 removes their last use.)

- [ ] **Step 2: Hero markup**

In `Hero.svelte` script, after `const malt = …` add:

```ts
	/** First name and the rest: two lines on phones, one on desktop. */
	const [first, ...others] = PROFILE.name.split(' ');
	const last = others.join(' ');
```

Replace the markup from `<h1>` to the end of the section with:

```svelte
	<h1>
		<span class="line">{first}</span>
		<span class="line">{last}<span class="stop" aria-hidden="true">.</span></span>
	</h1>
	<div class="grid">
		<div class="intro">
			<p class="role">{PROFILE.role[lang]}</p>
			<p class="pitch">
				{PROFILE.pitch[lang]}<span class="pitch-more"> {PROFILE.pitchMore[lang]}</span>
			</p>
			<div class="ctas">
				<a class="btn btn-primary see" href="#projects">
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
					class="btn cv"
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
				<a class="btn malt" href={PROFILE.malt} target="_blank" rel="noopener noreferrer">
					<svg viewBox={malt.viewBox} width="18" height="18" fill="#{malt.hex}" aria-hidden="true">
						<path d={malt.path} />
					</svg>
					<span class="long">{t.malt}</span><span class="short">{t.maltShort}</span>
					<span aria-hidden="true">↗</span>
					<span class="sr-only">{newTab}</span>
				</a>
			</div>
		</div>
		<div class="glance">
			<p class="glance-title">{t.glance}</p>
			<dl>
				{#each PROFILE.glance as row, i (i)}
					<div class="row" class:wide={row.wide}>
						<dt>{row.label[lang]}</dt>
						<dd>
							{#if row.short}<span class="full">{row.value[lang]}</span><span class="short"
									>{row.short[lang]}</span
								>{:else}{row.value[lang]}{/if}
						</dd>
					</div>
				{/each}
			</dl>
		</div>
	</div>
</section>
```

- [ ] **Step 3: Hero styles**

In `Hero.svelte` `<style>`, add after the `dd` rule:

```css
	.short {
		display: none;
	}
```

Replace the `/* Phone (M10 will design it) … */ @media (width < 48rem) { … }` block with:

```css
	/* Phone: name on two lines, then role, first pitch sentence, glance tiles, buttons. */
	@media (width < 48rem) {
		.hero {
			padding: calc(var(--nav-h) + 1.75rem) 1.25rem 2.5rem;
		}
		.available {
			margin-bottom: 0.875rem;
		}
		h1 {
			/* 58px from 390px wide, smaller below so "Renault." always fits. */
			font-size: min(3.625rem, 14.8vw);
			line-height: 0.88;
			white-space: normal;
		}
		.line {
			display: block;
		}
		.grid {
			display: flex;
			flex-direction: column;
			gap: 0;
			margin-top: 0;
			padding-top: 0;
			border-top: 0;
		}
		.intro {
			display: contents;
		}
		.role {
			order: 1;
			margin: 1.25rem 0 0.5rem;
			font-size: 1.25rem;
		}
		.pitch {
			order: 2;
			margin: 0 0 1.25rem;
			font-size: 1rem;
			line-height: 1.55;
		}
		.pitch-more,
		.glance-title,
		.full,
		.long,
		.cv svg {
			display: none;
		}
		.short {
			display: inline;
		}
		.glance {
			order: 3;
			margin-bottom: 1.25rem;
			padding: 0;
			background: none;
			border: 0;
		}
		dl {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.5rem;
		}
		.row,
		.row:last-child {
			display: block;
			min-width: 0;
			padding: 0.75rem 0.875rem;
			background: var(--surface);
			border: 2px solid var(--border);
			border-radius: var(--radius);
		}
		.row.wide {
			grid-column: 1 / -1;
			order: 1;
		}
		dt {
			padding: 0;
			font-size: 0.75rem;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		dd {
			margin-top: 0.125rem;
			font-size: 0.9375rem;
			font-weight: 700;
			line-height: 1.35;
		}
		.ctas {
			order: 4;
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.5rem;
		}
		.ctas .btn {
			justify-content: center;
			padding: 0 1rem;
		}
		.see {
			grid-column: 1 / -1;
		}
	}
```

- [ ] **Step 4: About with a Read more button**

Replace the `<script>` and markup of `About.svelte` with:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import { assetHref } from '$lib/paths';
	import Section from '../Section.svelte';

	let {
		lang,
		title,
		t,
		common
	}: { lang: Lang; title: string; t: Dict['about']; common: Dict['common'] } = $props();

	const [first, ...rest] = PROFILE.bio;
	/** False in the prerendered HTML: without JS every paragraph shows and there is no button. */
	let ready = $state(false);
	let open = $state(false);

	onMount(() => {
		ready = true;
	});
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
			<p>{first[lang]}</p>
			<!-- Folded on phones only (CSS), and only once hydrated. -->
			<div id="about-more" class="rest" class:folded={ready && !open}>
				{#each rest as paragraph, i (i)}
					<p>{paragraph[lang]}</p>
				{/each}
			</div>
			{#if ready}
				<button
					type="button"
					class="read-more"
					aria-expanded={open}
					aria-controls="about-more"
					onclick={() => (open = !open)}>{open ? common.showLess : common.readMore}</button
				>
			{/if}
		</div>
	</div>
</Section>
```

In its `<style>`: keep `.about`, `.photo`, `.text`, `p`, `p:last-child`; add `.rest p:last-child { margin-bottom: 0; }` and `.read-more { display: none; }`; replace the `@media (max-width: 40rem) { … }` block with:

```css
	/* Phone: small photo beside the first paragraph; the rest behind "Read more". */
	@media (width < 48rem) {
		.about {
			grid-template-columns: 5.5rem minmax(0, 1fr);
			gap: 0.875rem 1rem;
		}
		.photo {
			width: 5.5rem;
		}
		.text {
			display: contents;
			font-size: 1rem;
			line-height: 1.55;
		}
		.text > p {
			grid-column: 2;
			margin: 0;
		}
		.rest {
			grid-column: 1 / -1;
			line-height: 1.6;
		}
		.rest p {
			margin: 0 0 0.875rem;
		}
		.rest.folded {
			display: none;
		}
		.read-more {
			grid-column: 1 / -1;
			justify-self: start;
			display: inline-flex;
			align-items: center;
			min-height: 3rem;
			padding: 0 0.875rem;
			background: var(--surface);
			border: 1.5px solid var(--text);
			border-radius: var(--radius);
			color: var(--text);
			font: inherit;
			font-size: 0.9375rem;
			font-weight: 600;
			cursor: pointer;
		}
		.read-more:hover {
			border-color: var(--accent);
			color: var(--accent);
		}
	}
```

In `src/routes/[lang=lang]/+page.svelte`: `<About lang={data.lang} title={t.sections.about} t={t.about} common={t.common} />`.

- [ ] **Step 5: Run the checks**

Run: `npm run format && npm run lint && npm run check && npm test`
Expected: all pass.

- [ ] **Step 6: Visual check**

At 390px FR light/dark: "Jocelyn" / "Renault." on two lines at 58px; role 20px accent; only the first pitch sentence; tiles in 2 columns (Formation "42 Lyon · RNCP 7", Dernier poste "Sogeti (Capgemini)", Hackathons, Langues), Stack full width last; "Voir les projets ↓" full width, then "Voir le CV" / "Malt ↗" side by side. At 360px: name ≈53px and no overflow; buttons don't wrap their text. About: 88px photo beside the first paragraph, "Lire la suite" below; clicking shows two paragraphs and "Réduire". With `javaScriptEnabled: false`: all three paragraphs, no button. At 1280px: hero and About identical to M9 (one-line name, glance card with full values, CV icon, "Profil Malt ↗", whole pitch, no button).

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/sections/Hero.svelte src/lib/components/sections/About.svelte "src/routes/[lang=lang]/+page.svelte" src/lib/i18n/en.ts src/lib/i18n/fr.ts
git commit -m "feat: phone hero with glance tiles and an About folded behind Read more

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Phone filters and featured cards

**Files:**
- Modify: `src/lib/components/projects/ProjectFilters.svelte`
- Modify: `src/lib/components/projects/ProjectCardLarge.svelte`
- Modify: `src/lib/components/projects/ProjectLinks.svelte`
- Modify: `src/lib/components/projects/TechTags.svelte`
- Modify: `src/lib/components/sections/Projects.svelte` (phone grid gap)
- Modify: `src/lib/overlay.ts`, `src/lib/overlay.spec.ts` (rewritten)

**Interfaces:**
- Consumes: `mainDomain`, `DOMAIN_COLOR` (Task 1), `mixHex`, `contrastRatio`.
- Produces: `OVERLAY` (new shape below); `ProjectCardLarge` root gets `class:has-media` and `--dc` (Task 9's photo injection relies on `.has-media` and `.frame`).

- [ ] **Step 1: Rewrite the overlay test (failing)**

Replace `src/lib/overlay.spec.ts` with:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mixHex } from './color';
import { OVERLAY } from './overlay';
import { DOMAIN_COLOR, DOMAINS } from './projects';
import { contrastRatio } from './skills';

const TEXTS = ['text', 'meta', 'domain', 'award', 'desc'] as const;

describe('phone featured cards without media', () => {
	it.each(DOMAINS)('%s: every text colour reaches 4.5:1 on the veiled domain colour', (d) => {
		const ground = mixHex(OVERLAY.veil, DOMAIN_COLOR[d], OVERLAY.veilPlain);
		for (const key of TEXTS)
			expect(contrastRatio(OVERLAY[key], ground), key).toBeGreaterThanOrEqual(4.5);
		const tagGround = mixHex('#ffffff', ground, OVERLAY.tagBg);
		expect(contrastRatio(OVERLAY.tag, tagGround), 'tag').toBeGreaterThanOrEqual(4.5);
	});
});

describe('OVERLAY', () => {
	it('matches the CSS of ProjectCardLarge.svelte', () => {
		const css = readFileSync(
			resolve('src/lib/components/projects/ProjectCardLarge.svelte'),
			'utf8'
		);
		expect(css).toContain(`--veil: ${OVERLAY.veilPlain};`);
		expect(css).toContain(`--veil: ${OVERLAY.veilPhoto};`);
		expect(css).toContain(`background: ${OVERLAY.veil};`);
		expect(css).toContain(`rgb(255 255 255 / ${OVERLAY.tagBg})`);
		for (const key of [...TEXTS, 'tag'] as const) expect(css, key).toContain(OVERLAY[key]);
	});
});
```

Run: `npx vitest run src/lib/overlay.spec.ts` → FAIL (`OVERLAY.veil` undefined).

- [ ] **Step 2: New `OVERLAY`**

Replace `src/lib/overlay.ts` with:

```ts
/**
 * Phone featured cards (`ProjectCardLarge.svelte`): light text over a `veil` laid on the project
 * photo (`veilPhoto`) or, without one, on its domain colour (`veilPlain`). A test checks the text
 * contrast on every domain colour and keeps these values in sync with the component's CSS. Over
 * a photo the contrast depends on the image: checked by eye (see the review guide).
 */
export const OVERLAY = {
	veil: '#10100e',
	veilPhoto: 0.62,
	veilPlain: 0.35,
	text: '#ffffff',
	meta: '#d6d1c6',
	domain: '#ffa58c',
	award: '#ffb59f',
	desc: '#ece8df',
	tag: '#f3f0e8',
	/** White at this alpha behind each tech tag. */
	tagBg: 0.16
} as const;
```

- [ ] **Step 3: Featured card markup**

In `ProjectCardLarge.svelte` script: import `DOMAIN_COLOR, mainDomain, type Project` from `$lib/projects` (replacing the `type Project` import) and add `const domain = $derived(mainDomain(project));`. Replace the markup with:

```svelte
<article class="card" class:has-media={!!project.media} style:--dc={DOMAIN_COLOR[domain]}>
	<ProjectMedia {project} />
	{#if !project.media}
		<span class="wm"><DomainIcon {domain} size={160} /></span>
	{/if}
	<div class="body">
		<p class="meta">
			<span class="dom"><DomainIcon {domain} size={18} />{t.domains[domain]}</span>
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

- [ ] **Step 4: Featured card styles**

In its `<style>` add `.wm { display: none; }` after `.card > :global(.media)`, and replace the whole `/* Phone: the media fills the card … */ @media (width < 48rem) { … }` block with:

```css
	/* Phone: the photo (or the domain colour) fills the card under a dark veil; text at the bottom.
	   Light text in both themes; colours mirror OVERLAY in src/lib/overlay.ts (tested). */
	@media (width < 48rem) {
		.card {
			--veil: 0.35;
			position: relative;
			isolation: isolate;
			overflow: hidden;
			justify-content: flex-end;
			gap: 0;
			height: auto;
			min-height: 18.75rem;
			padding: 1.125rem 1.125rem 0.5rem;
			border: 2px solid var(--text);
			border-radius: var(--radius);
			background: var(--dc);
			color: #f3f0e8;
		}
		.card.has-media {
			--veil: 0.62;
		}
		.card::before {
			content: '';
			position: absolute;
			inset: 0;
			z-index: -1;
			background: #10100e;
			opacity: var(--veil);
		}
		/* Bigger than the card so the blur has no soft edge. */
		.card > :global(.media) {
			position: absolute;
			inset: -1rem;
			z-index: -2;
			aspect-ratio: auto;
			border-radius: 0;
			filter: blur(var(--blur, 6px));
		}
		.card :global(.placeholder) {
			display: none;
		}
		.wm {
			display: block;
			position: absolute;
			top: -1.75rem;
			right: -1.75rem;
			z-index: -1;
			color: #ffffff;
			opacity: 0.15;
			pointer-events: none;
		}
		.body {
			--text: #ffffff;
			--muted: #d6d1c6;
			flex: none;
			gap: 0.5rem;
		}
		.meta {
			gap: 0.25rem 0.625rem;
			font-size: 0.8125rem;
			color: #d6d1c6;
		}
		.dom {
			font-weight: 600;
			color: #ffa58c;
		}
		.dom :global(svg) {
			width: 1rem;
			height: 1rem;
		}
		h3 {
			font-size: 1.4375rem;
			letter-spacing: -0.02em;
			color: #ffffff;
		}
		.title {
			background: none;
		}
		.award {
			align-items: flex-start;
			font-size: 0.875rem;
			line-height: 1.35;
			color: #ffb59f;
		}
		.award :global(svg) {
			flex: none;
		}
		.desc {
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 3;
			line-clamp: 3;
			overflow: hidden;
			font-size: 0.9375rem;
			line-height: 1.5;
			color: #ece8df;
		}
		.footer {
			flex-wrap: wrap;
			align-items: center;
			gap: 0.375rem;
			min-height: 0;
			margin-top: 0.125rem;
			padding-top: 0.375rem;
			border-top: 1px solid rgb(255 255 255 / 0.2);
		}
		.footer > :global(ul) {
			padding-top: 0;
		}
		.footer :global(li) {
			background: rgb(255 255 255 / 0.16);
			color: #f3f0e8;
		}
		.footer :global(a) {
			font-weight: 700;
			color: #ffffff;
		}
		.footer :global(.private) {
			font-size: 0.8125rem;
			color: #d6d1c6;
		}
	}
```

Run: `npx vitest run src/lib/overlay.spec.ts` → PASS.

- [ ] **Step 5: "Code ↗" on phones, 12px tags**

`ProjectLinks.svelte`: replace the repo link's text `{compact ? t.code : t.sourceCode}` with

```svelte
{#if compact}{t.code}{:else}<span class="long">{t.sourceCode}</span><span class="short"
							>{t.code}</span
						>{/if}
```

and add to its style:

```css
	.short {
		display: none;
	}
	@media (width < 48rem) {
		.long {
			display: none;
		}
		.short {
			display: inline;
		}
	}
```

(The `aria-label` "Source code on GitHub: {title}" is unchanged, so the accessible name doesn't change.)

`TechTags.svelte`: add at the end of its style:

```css
	@media (width < 48rem) {
		li,
		.small li {
			padding: 0.3125rem 0.5rem;
			font-size: 0.75rem;
		}
	}
```

`Projects.svelte` phone block: change it to

```css
	@media (width < 48rem) {
		.large {
			grid-template-columns: minmax(0, 1fr);
			grid-auto-rows: auto;
			gap: 0.875rem;
		}
	}
```

(Task 5 adds the small-tile rules.)

- [ ] **Step 6: Filters as on the board**

In `ProjectFilters.svelte`: the context and domain `<option>`s lose their count - `{value === 'all' ? t.all : t.contexts[value]}` (and `t.domains[value]`), keeping `disabled={count === 0 && filters.context !== value}` (the `{@const count}` stays). Give the sort label a class: `<label class="pick phone sort">`. Replace the `/* Phone: one full-width row per filter … */ @media (width < 48rem) { … }` block with:

```css
	/* Phone: Context and Domain side by side, Sort by below; labels above the selects. */
	@media (width < 48rem) {
		.filters {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.75rem;
			margin: 0 0 1.5rem;
		}
		.group {
			display: none;
		}
		.phone {
			display: flex;
		}
		.pick {
			flex-direction: column;
			align-items: stretch;
			gap: 0.375rem;
			min-width: 0;
		}
		.sort {
			grid-column: 1 / -1;
		}
		.pick .label {
			margin: 0;
			font-size: 0.8125rem;
		}
		/* 16px text: smaller makes iOS zoom in on focus. */
		select {
			width: 100%;
			min-height: 3rem;
			padding: 0 2.5rem 0 0.875rem;
			border: 2px solid var(--text);
			border-radius: var(--radius);
			font-size: 1rem;
			font-weight: 600;
			appearance: none;
			background-image:
				linear-gradient(45deg, transparent 50%, currentColor 50%),
				linear-gradient(135deg, currentColor 50%, transparent 50%);
			background-position:
				calc(100% - 20px) 21px,
				calc(100% - 14px) 21px;
			background-size: 6px 6px;
			background-repeat: no-repeat;
		}
	}
```

- [ ] **Step 7: Measure the selects at 360px**

Run the checks (`npm run format && npm run lint && npm run check && npm test` → pass), build, preview, then with a scratchpad Playwright script at 360×800 on `/fr/`, for each value of the Context and Domain selects: `select.selectOption(value)` then `select.evaluate(el => el.scrollWidth > el.clientWidth)` - that doesn't catch clipped text in a select, so instead measure the text: create a hidden span with the select's computed font, put the selected option's text in it, compare its width with `select.clientWidth - 14 - 40` (padding). Expected: every label fits ("Professionnel" is the longest). **If one is clipped**, add inside the phone block:

```css
		@media (width < 24.375rem) {
			select {
				padding: 0 2rem 0 0.625rem;
				background-position:
					calc(100% - 16px) 21px,
					calc(100% - 10px) 21px;
			}
		}
```

and re-measure (spec: shrink the padding below 390px, never the font).

- [ ] **Step 8: Visual check**

At 390px both themes: selects as on the board; six featured cards stacked 14px apart, each ≥300px, domain-coloured (KAYP navy, ft_transcendence violet, microcode teal…) under a dark veil with a faint large domain icon top-right; meta 13px with the domain name in salmon, title 23px white, award in light salmon with the trophy, description 3 lines, tags + "Code ↗" (or "Code privé" on GoldenEye) under a faint white rule. Then inject a stock photo (Task 9 Step 3 has the script) into the first two cards: blurred photo, darker veil, no watermark. At 1280px: filters with counts, cards exactly as M9 ("Code source ↗", media on top).

- [ ] **Step 9: Commit**

```bash
git add src/lib/overlay.ts src/lib/overlay.spec.ts src/lib/components/projects/ProjectCardLarge.svelte src/lib/components/projects/ProjectLinks.svelte src/lib/components/projects/TechTags.svelte src/lib/components/projects/ProjectFilters.svelte src/lib/components/sections/Projects.svelte
git commit -m "feat: phone featured cards on a veiled photo or domain colour; board-style filter selects

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Other projects as domain tiles, 6 then "See N other projects"

**Files:**
- Modify: `src/app.css` (`--tile-*` tokens in the three theme blocks)
- Modify: `src/lib/theme-tokens.spec.ts`
- Modify: `src/lib/components/projects/ProjectCardSmall.svelte`
- Modify: `src/lib/components/sections/Projects.svelte`
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`

**Interfaces:**
- Consumes: `mainDomain`, `DOMAIN_COLOR`, `DOMAIN_TILE`, `PHONE_OTHERS`, `hiddenCount` (Task 1).
- Produces: tokens `--tile-base`, `--tile-pct`, `--tile-fg`; keys `projects.showMore` (`{n}`), `projects.showMoreOne`, `projects.showFewer`; button class `.show-more` (Task 9 clicks it).

- [ ] **Step 1: Failing token test**

In `src/lib/theme-tokens.spec.ts`: add `'--tile-base', '--tile-pct', '--tile-fg'` to `THEMED`, import `DOMAIN_TILE` from `./projects`, and add inside the `describe`:

```ts
	it('has the phone tile values of DOMAIN_TILE', () => {
		const pct = (n: number) => `${Math.round(n * 100)}%`;
		expect(light.get('--tile-base')).toBe(DOMAIN_TILE.light.base);
		expect(light.get('--tile-pct')).toBe(pct(DOMAIN_TILE.light.pct));
		expect(light.get('--tile-fg')).toBe(pct(DOMAIN_TILE.light.fg));
		expect(dark.get('--tile-base')).toBe(DOMAIN_TILE.dark.base);
		expect(dark.get('--tile-pct')).toBe(pct(DOMAIN_TILE.dark.pct));
		expect(dark.get('--tile-fg')).toBe(pct(DOMAIN_TILE.dark.fg));
	});
```

Run: `npx vitest run src/lib/theme-tokens.spec.ts` → FAIL.

- [ ] **Step 2: Tokens**

In `src/app.css`: in `:root {` (dark) after `--malt-tile` add

```css
	/* Phone project tiles (DOMAIN_TILE in src/lib/projects.ts). */
	--tile-base: #121210;
	--tile-pct: 24%;
	--tile-fg: 45%;
```

and in both `:root[data-theme='light'] {` and the no-JS `:root:not([data-theme]) {` block:

```css
	--tile-base: #ffffff;
	--tile-pct: 11%;
	--tile-fg: 100%;
```

Run: `npx vitest run src/lib/theme-tokens.spec.ts` → PASS.

- [ ] **Step 3: Strings**

`en.ts` `projects`: `showMore: 'See the {n} other projects', showMoreOne: 'See 1 other project', showFewer: 'Show fewer',`
`fr.ts` `projects`: `showMore: 'Voir les {n} autres projets', showMoreOne: 'Voir 1 autre projet', showFewer: 'Réduire la liste',`

- [ ] **Step 4: Tile markup**

In `ProjectCardSmall.svelte` script: import `DOMAIN_COLOR, mainDomain, primaryLink, type Project` from `$lib/projects`; add `const domain = $derived(mainDomain(project));` and `const year = $derived(project.date.slice(0, 4));`. Replace the markup with:

```svelte
<article class="card" style:--dc={DOMAIN_COLOR[domain]}>
	<div class="top">
		<span class="icon"><DomainIcon {domain} size={22} /></span>
		<ProjectLinks {project} {t} compact />
	</div>
	<!-- Phone only: label, summary and context (CSS shows one set of texts per width). -->
	<p class="label">{t.domains[domain]} · {year}</p>
	<h4>
		{#if href}
			<a {href} target="_blank" rel="noopener noreferrer">{project.title}</a>
		{:else}
			{project.title}
		{/if}
	</h4>
	<p class="meta">{year} · {t.contexts[project.context]} · {t.domains[domain]}</p>
	{#if project.award}
		<p class="award"><span aria-hidden="true">🏆</span> {project.award[lang]}</p>
	{/if}
	<p class="desc">{project.description[lang]}</p>
	<p class="summary">{project.summary[lang]}</p>
	<TechTags tech={project.tech} small />
	<p class="ctx">{t.contexts[project.context]}</p>
</article>
```

(The M8 phone-only `.trophy` and `.dom-name` spans go: the desktop meta line keeps "2025 · School · AI".)

- [ ] **Step 5: Tile styles**

In its `<style>`: delete the `.trophy { display: none; }` rule; add after `.desc`:

```css
	.label,
	.summary,
	.ctx {
		display: none;
	}
```

Replace the `/* Phone: one compact row … */ @media (width < 48rem) { … }` block with:

```css
	/* Phone: tile tinted by the main domain, big domain icon as a watermark, one-sentence summary,
	   context and link at the bottom. Colours from the --tile-* tokens (DOMAIN_TILE, tested). */
	@media (width < 48rem) {
		.card {
			--dfg: color-mix(in srgb, var(--dc) var(--tile-fg), #ffffff);
			position: relative;
			overflow: hidden;
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-rows: auto auto auto 1fr;
			grid-template-areas:
				'label label'
				'title title'
				'summary summary'
				'ctx links';
			gap: 0.375rem 0;
			min-height: 12.5rem;
			padding: 0.875rem 0.75rem 0.25rem;
			border: 0;
			background: color-mix(in srgb, var(--dc) var(--tile-pct), var(--tile-base));
		}
		.top {
			display: contents;
		}
		.icon {
			position: absolute;
			top: -1.625rem;
			right: -1.625rem;
			width: auto;
			height: auto;
			background: none;
			color: var(--dfg);
			opacity: 0.2;
			pointer-events: none;
		}
		.icon :global(svg) {
			width: 6.875rem;
			height: 6.875rem;
			stroke-width: 1.2;
		}
		/* Positioned so they paint above the (positioned) watermark. */
		.label,
		h4,
		.summary,
		.ctx,
		.card :global(.links) {
			position: relative;
		}
		.label {
			grid-area: label;
			display: block;
			margin: 0;
			font-size: 0.6875rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.07em;
			color: var(--dfg);
		}
		h4 {
			grid-area: title;
			margin: 0.25rem 0 0;
			font-size: 1.0625rem;
			line-height: 1.15;
			letter-spacing: -0.01em;
			overflow-wrap: anywhere;
		}
		.summary {
			grid-area: summary;
			display: block;
			margin: 0;
			font-size: 0.8125rem;
			line-height: 1.4;
			color: var(--body);
		}
		.meta,
		.award,
		.desc,
		.card > :global(ul) {
			display: none;
		}
		.ctx,
		.card :global(.links) {
			align-self: end;
			border-top: 1.5px solid color-mix(in srgb, var(--dfg) 35%, transparent);
		}
		.ctx {
			grid-area: ctx;
			display: flex;
			align-items: center;
			min-height: 2.75rem;
			margin: 0;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--muted);
		}
		.card :global(.links) {
			grid-area: links;
			padding-left: 0.375rem;
		}
		.card :global(.links a) {
			font-size: 0.8125rem;
			font-weight: 700;
		}
		.card :global(.private) {
			font-size: 0.75rem;
		}
	}
```

- [ ] **Step 6: Two-column grid and the show-more button**

In `Projects.svelte` script: add `import { onMount } from 'svelte';`, add `hiddenCount, PHONE_OTHERS` to the `$lib/projects` import, and after `const ms = …`:

```ts
	/** False in the prerendered HTML: without JS every tile shows and there is no button. */
	let ready = $state(false);
	let showAll = $state(false);
	const hidden = $derived(hiddenCount(tiers.small.length));

	onMount(() => {
		ready = true;
	});

	// Any filter or sort change folds the phone list back.
	$effect(() => {
		void filters.context;
		void filters.domain;
		void sort;
		showAll = false;
	});
```

Replace the small-tier block (`{#if tiers.small.length > 0} … {/if}`) with:

```svelte
		{#if tiers.small.length > 0}
			<h3 class="more">{t.more}</h3>
			<p class="more-lead">{t.moreLead}</p>
			<ul id="more-projects" class="grid small" role="list">
				{#each tiers.small as project, i (project.id)}
					<li
						class:folded={ready && !showAll && i >= PHONE_OTHERS}
						animate:flip={{ duration: ms }}
						in:fade={{ duration: ms }}
					>
						<ProjectCardSmall {project} {lang} {t} />
					</li>
				{/each}
			</ul>
			{#if ready && hidden > 0}
				<button
					type="button"
					class="btn show-more"
					aria-expanded={showAll}
					aria-controls="more-projects"
					onclick={() => (showAll = !showAll)}
				>
					{showAll ? t.showFewer : hidden === 1 ? t.showMoreOne : fill(t.showMore, { n: hidden })}
				</button>
			{/if}
		{/if}
```

Styles: add `.show-more { display: none; }` and extend the phone block to:

```css
	@media (width < 48rem) {
		.large {
			grid-template-columns: minmax(0, 1fr);
			grid-auto-rows: auto;
			gap: 0.875rem;
		}
		.small {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.625rem;
		}
		.more {
			margin: 2.5rem 0 0.125rem;
			font-size: 1.3125rem;
		}
		.more-lead {
			margin: 0 0 1.375rem;
			font-size: 0.875rem;
		}
		.folded {
			display: none;
		}
		.show-more {
			display: flex;
			justify-content: center;
			width: 100%;
			margin-top: 0.75rem;
		}
	}
```

- [ ] **Step 7: Checks and behaviour**

Run: `npm run format && npm run lint && npm run check && npm test` → pass. Build, preview, then with Playwright at 390px on `/fr/`:
1. 6 tiles in 2 columns + "Voir les 5 autres projets"; click → 11 tiles + "Réduire la liste" (`aria-expanded="true"`); click → back to 6.
2. Expand, then change "Trier par" to "Plus récents" → folded again (6 tiles).
3. Domaine = "Bas niveau" → small tier has 0 or few tiles → no button. Contexte = "École" → check the label matches `hiddenCount` (e.g. "Voir 1 autre projet" if 7 small).
4. Folded at 390px, resize the viewport to 1024px → every small card visible, no button; back to 390px → folded again.
5. `javaScriptEnabled: false` → all 11 tiles, no button.
6. At 360px FR: no tile title overflows (`ft_linear_regression` wraps), the button label fits on one line.
Both themes: tile colours (light: pale tint, label in the domain colour; dark: deep tint, lighter label).

- [ ] **Step 8: Commit**

```bash
git add src/app.css src/lib/theme-tokens.spec.ts src/lib/components/projects/ProjectCardSmall.svelte src/lib/components/sections/Projects.svelte src/lib/i18n/en.ts src/lib/i18n/fr.ts
git commit -m "feat: other projects as domain-tinted phone tiles with summaries, six then See N more

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Skills accordion on phones

**Files:**
- Modify: `src/lib/skills.ts`, `src/lib/skills.spec.ts`
- Modify: `src/lib/components/sections/Skills.svelte`

**Interfaces:**
- Consumes: `DESKTOP_QUERY` from `$lib/projects`.
- Produces: `panelHidden(s: { enhanced: boolean; desktop: boolean; selected: number; open: number }, index: number): boolean`; accordion button class `.acc` (Task 9 clicks one).

- [ ] **Step 1: Failing tests**

Append to `src/lib/skills.spec.ts` (add `panelHidden` to the import):

```ts
describe('panelHidden', () => {
	const base = { enhanced: true, desktop: true, selected: 2, open: 0 };
	it('hides nothing before hydration', () => {
		for (const i of [0, 1, 2]) expect(panelHidden({ ...base, enhanced: false }, i)).toBe(false);
	});
	it('shows only the selected tab on desktop, whatever the accordion state', () => {
		expect(panelHidden(base, 2)).toBe(false);
		expect(panelHidden(base, 0)).toBe(true);
		expect(panelHidden({ ...base, open: -1 }, 2)).toBe(false);
	});
	it('shows only the open group on phones', () => {
		const phone = { ...base, desktop: false };
		expect(panelHidden(phone, 0)).toBe(false);
		expect(panelHidden(phone, 2)).toBe(true);
	});
	it('hides every group on phones when all are closed', () => {
		const closed = { ...base, desktop: false, open: -1 };
		for (const i of [0, 1, 2]) expect(panelHidden(closed, i)).toBe(true);
	});
});
```

Run: `npx vitest run src/lib/skills.spec.ts` → FAIL.

- [ ] **Step 2: Implement**

Append to `src/lib/skills.ts`:

```ts
/**
 * Whether a skills panel is hidden. Before hydration (and without JS) none is. On desktop the
 * selected tab shows its panel; on phones the open accordion group does (`open` -1: all closed).
 * The two states are separate, so crossing the breakpoint never loses either.
 */
export function panelHidden(
	s: { enhanced: boolean; desktop: boolean; selected: number; open: number },
	index: number
): boolean {
	if (!s.enhanced) return false;
	return (s.desktop ? s.selected : s.open) !== index;
}
```

Run: `npx vitest run src/lib/skills.spec.ts` → PASS.

- [ ] **Step 3: Accordion markup**

In `Skills.svelte` script: `import { MediaQuery } from 'svelte/reactivity';`, `import { DESKTOP_QUERY } from '$lib/projects';`, add `panelHidden` to the `$lib/skills` import, and after `let selected = $state(0);`:

```ts
	/** Phone accordion: the open group (Backend first), -1 when all are closed. */
	let open = $state(0);
	/** False on the server; before hydration nothing is hidden anyway. */
	const desktop = new MediaQuery(DESKTOP_QUERY, false);
```

Replace the `<div class="panels"> … </div>` block with:

```svelte
		<div class="panels">
			{#each SKILL_GROUPS as group, i (group.id)}
				{@const hidden = panelHidden(
					{ enhanced, desktop: desktop.current, selected, open },
					i
				)}
				{#if enhanced}
					<!-- Phone only (CSS): the tab list is hidden there, these buttons on desktop. -->
					<button
						type="button"
						class="acc"
						id="skills-acc-{group.id}"
						aria-expanded={open === i}
						aria-controls="skills-panel-{group.id}"
						onclick={() => (open = open === i ? -1 : i)}
					>
						<span class="ic"><SkillGroupIcon id={group.id} size={22} /></span>
						<span>{group.title[lang]}</span>
						<span class="count" aria-hidden="true">{group.skills.length}</span>
						<svg class="chev" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
							<path
								d={open === i ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}
								fill="none"
								stroke="currentColor"
								stroke-width="2.2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				{/if}
				<div
					class="panel"
					id="skills-panel-{group.id}"
					role={enhanced && desktop.current ? 'tabpanel' : undefined}
					aria-labelledby={!enhanced
						? undefined
						: desktop.current
							? `skills-tab-${group.id}`
							: `skills-acc-${group.id}`}
					hidden={hidden ? 'until-found' : undefined}
					onbeforematch={() => {
						selected = i;
						open = i;
					}}
				>
					<!-- the h3, .desc and .tiles list stay exactly as they are -->
				</div>
			{/each}
		</div>
```

(Keep the panel's existing children - `<h3>`, `<p class="desc">`, `<ul role="list" class="tiles">…</ul>` - unchanged inside the new `<div class="panel">`.)

- [ ] **Step 4: Accordion styles**

In the `<style>`: add `.acc { display: none; }` after `.count`; in the `@media print` block add `.acc` next to `.tablist` in the `display: none` rule. Replace the `/* Phone (M10 will design it): smaller tiles. */ @media (width < 48rem) { … }` block with:

```css
	/* Phone: an accordion (one group open at a time) instead of the tabs. */
	@media (width < 48rem) {
		.tablist {
			display: none;
		}
		.acc {
			display: flex;
			align-items: center;
			gap: 0.875rem;
			width: 100%;
			min-height: 4rem;
			margin-top: 0.625rem;
			padding: 0.625rem 0.875rem 0.625rem 0.625rem;
			border: 2px solid var(--border);
			border-radius: var(--radius);
			background: transparent;
			color: var(--text);
			font: inherit;
			font-size: 1.0625rem;
			font-weight: 700;
			text-align: left;
			cursor: pointer;
		}
		.acc:first-child {
			margin-top: 0;
		}
		.acc[aria-expanded='true'] {
			background: var(--surface);
			border-color: var(--text);
			box-shadow: 5px 5px 0 var(--accent);
		}
		.acc .ic {
			width: 2.5rem;
			height: 2.5rem;
		}
		.chev {
			flex: none;
		}
		.panel {
			padding: 1.25rem;
		}
		.enhanced .panel {
			min-height: 0;
			padding: 1.125rem 0.125rem 0.5rem;
			background: none;
			border: 0;
		}
		.enhanced .panel[hidden] {
			padding: 0;
		}
		/* The accordion button names the group; the heading stays for screen readers. */
		.enhanced h3 {
			position: absolute;
			width: 1px;
			height: 1px;
			margin: -1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
		.desc {
			margin: 0 0 0.875rem;
			font-size: 1rem;
		}
		.tiles {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.5rem;
		}
		.tiles li {
			gap: 0.625rem;
			padding: 0.75rem;
			background: var(--surface);
			border: 1px solid var(--border);
			font-size: 0.9375rem;
			line-height: 1.25;
		}
		.tiles svg {
			width: 24px;
			height: 24px;
		}
	}
```

- [ ] **Step 5: Run the checks**

Run: `npm run format && npm run lint && npm run check && npm test`
Expected: all pass.

- [ ] **Step 6: Visual check**

At 390px both themes: six 64px rows (icon tile, name, count, chevron), Backend open with the ink border + coral/vermilion offset shadow, its description and logos in 2 columns below; tapping another row opens it and closes Backend; tapping the open row closes it (all closed). Black logos (Express, Rust, Django) readable in dark mode. At 1280px: tabs exactly as M9.

- [ ] **Step 7: Behaviour checks**

With Playwright: (1) at 390px close all groups, resize to 1280px → the Backend tab panel shows; select "DevOps" tab, resize to 390px → accordion state as left (all closed). (2) Desktop keyboard: ArrowDown/Up/Home/End still move tabs (M9 behaviour). (3) `javaScriptEnabled: false` at 390px → six groups stacked with titles, no accordion buttons. (4) Find-in-page: at 390px with Backend open, `await page.evaluate(() => window.find('Kubernetes'))` → the DevOps group opens (its `aria-expanded="true"`). (5) axe on the page at 390px with a group open (quick run with `@axe-core/playwright`, as in `scripts/audit.ts`): 0 violations.

- [ ] **Step 8: Commit**

```bash
git add src/lib/skills.ts src/lib/skills.spec.ts src/lib/components/sections/Skills.svelte
git commit -m "feat: skills accordion on phones, one group open at a time

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Experience - collapsed recommendations, compact rows

**Files:**
- Modify: `src/lib/experience.ts`, `src/lib/experience.spec.ts` (remove `quoteView`, `ONE_COLUMN_QUERY`)
- Modify: `src/lib/components/experience/JobItem.svelte`
- Modify: `src/lib/components/experience/EducationItem.svelte`
- Modify: `src/lib/components/sections/Experience.svelte`
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`

**Interfaces:**
- Produces: key `experience.recommendation` (`{name}`); keys `experience.readMore/showLess` removed; recommendation button class `.rec` (Task 9 clicks one).

- [ ] **Step 1: Strings**

`en.ts` `experience`: delete `readMore` and `showLess`; add `recommendation: 'Recommendation - {name}',`.
`fr.ts` `experience`: delete `readMore` and `showLess`; add `recommendation: 'Recommandation - {name}',`.

- [ ] **Step 2: Remove the M8 quote clamp logic**

In `src/lib/experience.ts` delete `ONE_COLUMN_QUERY` and `quoteView` (with their doc comments). In `src/lib/experience.spec.ts` delete the `describe('quoteView', …)` block and `quoteView` from the import. Check: `grep -rn "quoteView\|ONE_COLUMN_QUERY" src` → only JobItem until Step 3.

- [ ] **Step 3: JobItem**

Replace the `<script>` and markup of `JobItem.svelte` with:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Dict, Lang } from '$lib/i18n';
	import { fill } from '$lib/i18n/format';
	import { durationLabel, durationMonths, periodPoints, type Job } from '$lib/experience';
	import TechTags from '../projects/TechTags.svelte';
	import Period from './Period.svelte';

	let { job, lang, t }: { job: Job; lang: Lang; t: Dict['experience'] } = $props();

	const uid = $props.id();
	const quoteId = `${uid}-quote`;
	/** False in the prerendered HTML: without JS the quote shows and there is no button. */
	let ready = $state(false);
	let open = $state(false);
	const months = $derived(
		job.end ? durationLabel(durationMonths(job.start, job.end), t.months) : ''
	);

	onMount(() => {
		ready = true;
	});
</script>

<article class="job">
	<p class="when">
		<Period points={periodPoints(job.start, job.end, lang, t.present)} />
		{#if job.internship || months}
			<br /><span class="dur"
				>{[job.internship ? t.internship : '', months].filter(Boolean).join(' · ')}</span
			>
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
			{#if ready}
				<!-- Phone only (CSS): on desktop the quote is always shown. -->
				<button
					type="button"
					class="rec"
					aria-expanded={open}
					aria-controls={quoteId}
					onclick={() => (open = !open)}
				>
					<span class="rec-mark" aria-hidden="true">“</span>
					<span class="rec-label">{fill(t.recommendation, { name: job.quote.author })}</span>
					<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
						<path
							d={open ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}
							fill="none"
							stroke="currentColor"
							stroke-width="2.2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			{/if}
			<figure id={quoteId} class="quote" class:folded={ready && !open}>
				<span class="mark" aria-hidden="true">“</span>
				<blockquote>
					<p>{job.quote.text[lang]}</p>
				</blockquote>
				<figcaption>
					<strong>{job.quote.author}</strong> - {job.quote.role[lang]}
					{#if job.quote.original !== lang}<span class="note">{t.translated}</span>{/if}
				</figcaption>
			</figure>
		{/if}
	</div>
</article>
```

In its `<style>`: delete `.clamp`, `.more` and `.more:hover`; add `.rec { display: none; }`; replace the `@media (width < 48rem) { … }` block with:

```css
	/* Phone: dates on one line; the recommendation folded behind a button. */
	@media (width < 48rem) {
		.job {
			grid-template-columns: minmax(0, 1fr);
			gap: 0;
			padding: 1.25rem 0;
		}
		.when {
			font-size: 0.8125rem;
		}
		.when br {
			display: none;
		}
		.dur::before {
			content: ' · ';
		}
		h4 {
			margin-top: 0.25rem;
			font-size: 1.25rem;
		}
		.org {
			margin: 0 0 0.625rem;
			font-size: 1rem;
		}
		.points {
			margin: 0 0 0.75rem;
			padding-left: 1.125rem;
			font-size: 0.9375rem;
			line-height: 1.55;
		}
		.rec {
			display: flex;
			align-items: center;
			gap: 0.625rem;
			width: 100%;
			min-height: 3rem;
			margin-top: 0.75rem;
			padding: 0 0.875rem;
			background: var(--surface);
			border: 1.5px solid var(--border);
			border-radius: var(--radius);
			color: var(--text);
			font: inherit;
			font-size: 0.9375rem;
			font-weight: 600;
			text-align: left;
			cursor: pointer;
		}
		.rec:hover {
			border-color: var(--text);
		}
		.rec-mark {
			height: 1.25rem;
			font-size: 1.875rem;
			line-height: 1;
			font-weight: 800;
			color: var(--accent);
		}
		.rec-label {
			flex: 1;
		}
		.quote {
			display: block;
			margin: 0.5rem 0 0;
			padding: 1rem;
			border-width: 1.5px;
		}
		.quote.folded,
		.mark {
			display: none;
		}
		blockquote p {
			font-size: 0.9375rem;
		}
		figcaption {
			margin-top: 0.5rem;
			font-size: 0.8125rem;
		}
	}
```

- [ ] **Step 4: EducationItem**

Wrap the school and diploma: replace `<h4>{item.school}</h4>\n\t<p class="title">{item.title[lang]}</p>` with

```svelte
	<div class="name">
		<h4>{item.school}</h4>
		<p class="title">{item.title[lang]}</p>
	</div>
```

and add to its style:

```css
	/* Phone: school and diploma on one line, details joined by dots, certificate link on the right. */
	@media (width < 48rem) {
		.edu {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			column-gap: 0.75rem;
			align-items: center;
			padding: 0.75rem 0;
		}
		.edu > * {
			grid-column: 1;
		}
		.when {
			font-size: 0.8125rem;
		}
		h4,
		.title {
			display: inline;
		}
		h4 {
			font-size: 1.125rem;
		}
		.title {
			font-size: 0.9375rem;
			font-weight: 600;
			color: var(--body);
		}
		.title::before {
			content: ' · ';
		}
		.points {
			margin-top: 0.125rem;
			font-size: 0.875rem;
			line-height: 1.45;
			color: var(--muted);
		}
		.points li {
			display: inline;
		}
		.points li + li::before {
			content: ' · ';
		}
		.edu > .cert {
			grid-column: 2;
			grid-row: 1 / span 2;
			min-height: 2.75rem;
			font-size: 0.875rem;
		}
	}
```

- [ ] **Step 5: Experience section**

In `Experience.svelte` replace the `@media (width < 48rem) { … }` block with:

```css
	@media (width < 48rem) {
		.sub {
			margin: 2rem 0 0.25rem;
			font-size: 0.875rem;
		}
		.sub:first-child {
			margin-top: 0;
		}
		.lower {
			gap: 0;
			margin-top: 0;
		}
		.hk {
			grid-template-columns: 2.25rem minmax(0, 1fr) auto;
			gap: 0.75rem;
			padding: 0.625rem 0;
		}
		.tile {
			width: 2.25rem;
			height: 2.25rem;
		}
		.tile :global(svg) {
			width: 18px;
			height: 18px;
		}
		.event {
			font-size: 0.9375rem;
			line-height: 1.3;
		}
		.detail,
		.res {
			font-size: 0.8125rem;
		}
	}
```

- [ ] **Step 6: Run the checks**

Run: `npm run format && npm run lint && npm run check && npm test`
Expected: all pass; `grep -rn "quoteView\|ONE_COLUMN_QUERY\|experience\.readMore\|t\.readMore" src` → no output.

- [ ] **Step 7: Visual check**

At 390px FR both themes: each job = "juil. 2025 → janv. 2026 · Stage · 7 mois" on one line (13px), title 20px, company accent, bullets, 12px tags, then "“ Recommandation - Herve Nikue ⌄" full width; tap → the whole quote in a box below, chevron up. Education: "42 Lyon · Expert en architecture informatique" then the RNCP details joined by " · "; CS50 row with the certificate link on the right. Hackathons: 36px tiles, results right. `javaScriptEnabled: false` → both quotes visible, no buttons. At 900px and 1280px: quotes whole with the big quote mark, no button (the old 48–56rem clamp is gone), layout as M9.

- [ ] **Step 8: Commit**

```bash
git add src/lib/experience.ts src/lib/experience.spec.ts src/lib/components/experience/JobItem.svelte src/lib/components/experience/EducationItem.svelte src/lib/components/sections/Experience.svelte src/lib/i18n/en.ts src/lib/i18n/fr.ts
git commit -m "feat: phone experience with recommendations behind a button; compact education and hackathons

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Contact and footer

**Files:**
- Modify: `src/lib/components/sections/Contact.svelte`
- Modify: `src/lib/components/Footer.svelte`
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`

**Interfaces:**
- Produces: key `contact.maltShort`.

- [ ] **Step 1: Strings**

`en.ts` `contact`: `maltShort: 'Profile, recommendations and mission requests.',`
`fr.ts` `contact`: `maltShort: 'Profil, recommandations et contact pour une mission.',`

- [ ] **Step 2: Markup**

In `Contact.svelte`:
- In the Malt block, after `<p class="malt-text">{t.maltText}</p>` add `<p class="malt-short">{t.maltShort}</p>`.
- Replace the Malt link with:

```svelte
			<a class="btn malt-cta" href={PROFILE.malt} target="_blank" rel="noopener noreferrer">
				<span class="cta-text">{t.maltCta}</span> <span aria-hidden="true">↗</span>
				<span class="sr-only">{newTab}</span>
			</a>
```

- In the tiles, give the arrow a class: `<span class="arrow" aria-hidden="true">{link.id === 'cv' ? '↓' : '↗'}</span>`.

- [ ] **Step 3: Styles**

Add `.malt-short { display: none; }` after `.malt-text`. Replace the `@media (width < 48rem) { … }` block with:

```css
	/* Phone: compact e-mail card, the Malt card as one tappable row, three equal buttons. */
	@media (width < 48rem) {
		.intro {
			margin: 0 0 1.125rem;
			font-size: 1.125rem;
		}
		.blocks {
			gap: 0.75rem;
		}
		.block {
			padding: 1.25rem 1.125rem;
		}
		.mail {
			align-items: stretch;
			gap: 0.75rem;
		}
		.label {
			font-size: 0.8125rem;
		}
		/* One line; 19px from 390px wide, smaller below (divisor measured in Task 8 Step 4). */
		.address {
			font-size: min(1.1875rem, calc((100vw - 5rem) / 16.3));
			line-height: 1.2;
			white-space: nowrap;
			overflow-wrap: normal;
		}
		.mail .btn {
			justify-content: center;
		}
		.malt {
			position: relative;
			display: grid;
			grid-template-columns: 2.5rem minmax(0, 1fr) auto;
			column-gap: 0.875rem;
			row-gap: 0;
			align-items: center;
		}
		.malt-head {
			grid-column: 1;
			grid-row: 1 / span 2;
		}
		.malt-head .label,
		.malt-text {
			display: none;
		}
		.malt-ic {
			width: 2.5rem;
			height: 2.5rem;
		}
		.malt-ic :global(svg) {
			width: 26px;
			height: 26px;
		}
		.malt-title {
			grid-column: 2;
			grid-row: 1;
			font-size: 1.125rem;
			line-height: 1.25;
			letter-spacing: 0;
		}
		.malt-short {
			grid-column: 2;
			grid-row: 2;
			display: block;
			margin: 0;
			font-size: 0.875rem;
			line-height: 1.45;
			color: var(--body);
		}
		.malt-cta {
			grid-column: 3;
			grid-row: 1 / span 2;
			min-height: 0;
			padding: 0;
			border: 0;
			background: none;
			font-weight: 700;
		}
		/* The link's text stays its accessible name; only ↗ shows. */
		.cta-text {
			position: absolute;
			width: 1px;
			height: 1px;
			margin: -1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
		/* The whole card is the link. */
		.malt-cta::after {
			content: '';
			position: absolute;
			inset: 0;
		}
		.malt:has(.malt-cta:focus-visible) {
			outline: 2px solid var(--accent);
			outline-offset: 2px;
		}
		.malt-cta:focus-visible {
			outline: none;
		}
		.tiles {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.5rem;
			margin-top: 0.75rem;
		}
		.tile {
			flex-direction: column;
			justify-content: center;
			gap: 0.25rem;
			min-height: 4.5rem;
			padding: 0 0.25rem;
			font-size: 0.875rem;
		}
		.tile-label {
			flex-direction: column;
			gap: 0.25rem;
		}
		.arrow {
			display: none;
		}
	}
```

- [ ] **Step 4: Measure the e-mail divisor**

Build, preview; Playwright at 390×800 on `/fr/`: set `#contact .address` to `font-size: 19px` via `page.addStyleTag`, read its `getBoundingClientRect().width` = `w19`. The divisor is `D = (w19 / 19) × 1.03`, rounded up to one decimal; available width is `100vw − 5rem` (20px page padding + 18px card padding + 2px border, each side). If `w19 ≤ 310` (fits at 390px), replace `16.3` with `D`; otherwise also replace `D` so 390px gets a smaller size and note "e-mail below 19px at 390px" in the review guide's deviations. Then verify at 360, 375 and 390px: `scrollWidth <= clientWidth` for the card and the page, address on one line.

- [ ] **Step 5: Footer**

In `Footer.svelte` replace the `@media (max-width: 40rem) { … }` block with:

```css
	/* Phone: name left, back-to-top right; may wrap to two lines at 360px. */
	@media (width < 48rem) {
		.inner {
			flex-wrap: wrap;
			min-height: 4.75rem;
			padding: 0.5rem 1.25rem;
			gap: 0 0.75rem;
		}
	}
```

- [ ] **Step 6: Run the checks**

Run: `npm run format && npm run lint && npm run check && npm test`
Expected: all pass.

- [ ] **Step 7: Visual check**

At 390px FR both themes: intro 18px; e-mail card with the address on one line (19px) and a full-width "Copier l’adresse"; Malt card as one row (tile, "Vous passez par Malt ?" + short line, ↗), tapping anywhere on it opens Malt in a new tab; LinkedIn / GitHub / CV (PDF) as three equal 72px buttons, icon above label. Copy still works (button label changes to "Copié !"). Keyboard: Tab onto the Malt link draws the focus ring around the whole card. Footer: "© 2026 Jocelyn Renault" left, "Retour en haut ↑" right; at 360px it may wrap without overflow. At 1280px: contact and footer as M9 (Malt block with its button text, arrows on the tiles).

- [ ] **Step 8: Commit**

```bash
git add src/lib/components/sections/Contact.svelte src/lib/components/Footer.svelte src/lib/i18n/en.ts src/lib/i18n/fr.ts
git commit -m "feat: compact phone contact with a one-row Malt card and three equal buttons; phone footer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Audit, fidelity check, review guide, PR

**Files:**
- Modify: `scripts/audit.ts` (axe pass with phone collapsibles open)
- Create: `docs/reviews/milestone-10-review-guide.md`, `docs/reviews/milestone-10/*.png`
- Modify: `docs/superpowers/specs/2026-09-23-portfolio-design.md` (only if a deviation was taken during the tasks)

- [ ] **Step 1: Audit the opened collapsibles**

In `scripts/audit.ts`, inside `if (width === 360) { … }` after the overflow check, add:

```ts
					// Phone collapsibles: open each kind once, then check what they reveal.
					await page.click('#about .read-more');
					await page.click('#projects .show-more');
					await page.locator('#skills .acc').nth(1).click();
					await page.locator('#experience .rec').first().click();
					checks.push(await axe(page, `${label} collapsibles open`, `${file}-open`));
```

- [ ] **Step 2: Full checks and audit**

```bash
npm run format && npm run lint && npm run check && npm test
npm run audit -- --screens
```

Expected: 0 axe violations (EN/FR × dark/light × 360/1280, collapsibles open, before hydration), no horizontal scroll at 360px, Lighthouse as in M9 (Accessibility / Best Practices / SEO 100 except the "pending domain" items; Performance ≥ 95). Fix failures in the component that causes them (commit as `fix: …`) and re-run.

- [ ] **Step 3: Fidelity check with stock photos**

Scratchpad Playwright script against `vite preview` at 390×900, `reducedMotion: 'reduce'`, each theme and language:

1. Computed styles vs the board (print mismatches; expected none):

| Selector | Property | Expected |
|---|---|---|
| `.nav` | `height` | `60px` |
| `.nav .contact` | `display` | `inline-flex` |
| `#hero h1` | `font-size` | `58px` |
| `#hero .role` | `font-size` | `20px` |
| `#hero .row` | `border-top-width` | `2px` |
| `#about .num` | `font-size` | `46px` |
| `#about h2` | `font-size` | `29px` |
| `#about .photo` | `width` | `88px` |
| `#projects select` | `min-height`, `font-size` | `48px`, `16px` |
| `#projects .large article` | `min-height`, `border-top-width` | `300px`, `2px` |
| `#projects .large h3` | `font-size` | `23px` |
| `#projects .small article` | `min-height` | `200px` |
| `#projects .small h4` | `font-size` | `17px` |
| `#skills .acc` | `min-height` | `64px` |
| `#experience .job h4` | `font-size` | `20px` |
| `#experience .rec` | `min-height` | `48px` |
| `#contact .address` | `white-space` | `nowrap` |
| `#contact .tile` | `min-height` | `72px` |
| `footer .inner` | `min-height` | `76px` |

2. Stock photos: serve `/home/lezard/portfolio/tmp/` on a fake route and swap them into the featured cards:

```ts
import { readFileSync } from 'node:fs';
await page.route('**/__tmp/**', (route) =>
	route.fulfill({
		body: readFileSync('/home/lezard/portfolio/tmp/' + decodeURIComponent(route.request().url().split('/__tmp/')[1])),
		contentType: 'image/jpeg'
	})
);
const photos = [
	'pexels-photo-27786307-2669278228.jpg',
	'pexels-photo-378442-2055502109.jpg',
	'negative-space-sunflowers-field-sunset-1536x1023-3463019637.jpg',
	'solitary-tree-on-a-green-hilltop-with-mountain-view-photo-4111566355.jpg',
	'pexels-photo-440731-4176238789.jpg',
	'ai-generated-tranquil-meadow-green-trees-sunset-sky-nature-serene-beauty-generated-by-ai-free-photo-1091754462.jpg'
];
await page.evaluate((files) => {
	document.querySelectorAll('#projects .large article').forEach((card, i) => {
		card.classList.add('has-media');
		card.querySelector('.wm')?.remove();
		const frame = card.querySelector('.frame');
		if (frame)
			frame.innerHTML = `<img src="/__tmp/${encodeURIComponent(files[i % files.length])}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`;
	});
}, photos);
```

Screenshot the featured cards with and without photos, both themes, at 390 and 360px. Then screenshot every section at 390 and 360px, both themes, FR and EN, and at 1280/1440px for the no-regression check against M9 (compare with `docs/reviews/milestone-9/` screenshots). Record the page height at 390px before (on `master`) and after.

- [ ] **Step 4: Review guide**

Copy a selection of screenshots into `docs/reviews/milestone-10/` (hero, projects without and with stock photos, skills with a group open, experience with a quote open, contact - 390px FR light and dark; one 360px FR full page; one 1280px no-regression) and write `docs/reviews/milestone-10-review-guide.md` in the style of `docs/reviews/milestone-9-review-guide.md`: what changed per section; how to run (`npm run dev`, then a 390px window / device mode; `npm run audit -- --screens`); the audit table; the screenshots next to the canvas link https://claude.ai/artifact/9N2zK35VungBsy2GnLcE59 for a side-by-side check; page height before/after; **Deviations** (footer keeps "© {year}"; certificate link keeps "View certificate / Voir le certificat"; Vincent's quote shown whole when opened; e-mail size if Step 4 of Task 8 needed it; select padding if Task 4 Step 7 needed it; anything else taken); **For Jocelyn to review** (the 17 summaries in `src/lib/data/projects.ts`; real photos still to supply: one image per featured project in `static/projects/`, a still `poster` for videos); manual checks (real phone: touch targets, sticky header, native select pickers, find-in-page, featured-card text over real photos once added - axe can't measure text over images); removed code (M7 phone menu, M8 quote clamp).

- [ ] **Step 5: Commit, push, open the PR**

```bash
git add scripts/audit.ts docs/reviews/milestone-10-review-guide.md docs/reviews/milestone-10
git commit -m "docs: add Milestone 10 review guide; audit opens the phone collapsibles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin worktree-milestone-10-phone-design:milestone-10-phone-design
gh pr create --base master --head milestone-10-phone-design \
  --title "Milestone 10: phone design" \
  --body "$(cat <<'EOF'
Phone layouts from the validated Claude Design board (Mobile - clair / sombre), both themes: header with a Contact button (no menu), compact hero with glance tiles, About behind Read more, select filters, featured cards on a veiled photo or domain colour, other projects as domain-tinted tiles with one-sentence summaries (6, then See N more), skills accordion, recommendations behind a button, compact contact. Desktop unchanged.

Review guide: docs/reviews/milestone-10-review-guide.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: Stop**

Tell Jocelyn the PR link and the review guide, and that the summaries and the real photos are the two things waiting on them. Do not merge; the user reviews first.
