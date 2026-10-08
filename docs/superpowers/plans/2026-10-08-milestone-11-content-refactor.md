# Milestone 11 — Content-ready refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every content edit (projects, categories, skills, experience, media, About) touch one place, with mistakes caught by the type checker or a test that names the culprit, and document every edit in `docs/content-guide.md`. The site must render exactly as before.

**Architecture:** Categories (project domains, contexts, skill groups) become self-contained data entries (label + colour + icon) instead of being spread across unions, dictionaries and component branches. Icons become path strings rendered by one generic `Icon.svelte`. New pure, tested helpers (`typesetFrench`/`typeset`, `usedCategories`, `visibleProjects`, featured ranking by list, `glanceRows`) carry the logic; components only render. Before/after full-page screenshots prove nothing visible changed.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, adapter-static (prerendered), TypeScript, Vitest, Playwright (screenshots, audit), ffmpeg (only in the guide and for the pixel diff).

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section **"Milestone 11 — Content-ready refactor"**.

## Global Constraints

- Work in the worktree `/home/lezard/portfolio/.claude/worktrees/milestone-11-content-refactor` (local branch `worktree-milestone-11-content-refactor`, remote branch `milestone-11-content-refactor`; push with `git push origin worktree-milestone-11-content-refactor:milestone-11-content-refactor`). Node 24 (`node -v`; if not 24: `source ~/.nvm/nvm.sh && nvm use 24`).
- **No visible change.** Every page must render pixel-identical to the baseline taken in Task 0, with one intended exception: the desktop gradient placeholder of project cards without media now derives from the domain colour (Task 3). Any other difference is a bug to fix, or must be explained in the review guide.
- Svelte 5 runes only (`$props`, `$state`, `$derived`, `$effect`); no `export let`, no `$:`, no stores. No `svelte.config.js`.
- UI strings only in `src/lib/i18n/en.ts` and `fr.ts` (`fr` typed `Dict`, same keys; leaves are strings; templates use `{name}` filled by `fill()` from `$lib/i18n/format`). **Category labels are content**: after Task 3 they live in `src/lib/data/categories.ts`, not in the dictionaries.
- Content data files wrap their exports in `typeset(...)` (Task 1), so French data can be written with plain spaces and straight apostrophes. `fr.ts` stays hand-typeset (U+00A0 before `: ; ! ? %` and inside « », `’`).
- Locale URLs via `localeHref(base, lang)`; static files via `assetHref` / `{base}/…`. Never hardcode `/en/`.
- Tests that only constrained **content** (not integrity) are removed when touched: the user will add and remove projects, groups and paragraphs freely. Integrity checks (ids unique, files exist, text non-empty in both languages, contrast) stay.
- Never commit `tmp/`, `reports/`, stock photos, `static/projects/test-*` or `*:Zone.Identifier`. Add files by path (no `git add -A`).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- After each task: `npm run format && npm run lint && npm run check && npm test` all clean.
- **Pixel check after each task that touches components (2, 3, 4, 5, 6):** `npm run build`, restart `npx vite preview --port 4181 --strictPort` (it caches the file list), then `node $SP/shot.mjs http://localhost:4181 $SP/after` and `node $SP/compare.mjs $SP/before $SP/after $SP/diff` (scripts from Task 0; `$SP` = the session scratchpad). Expected: `identical` for all 16 shots (except the desktop placeholder from Task 3 on). Scripts live in the scratchpad, never in the repo.

## Review Focus

- **A typo in `FEATURED`, or a featured project that is hidden:** the build must not silently drop it; a data test fails naming the id. Pinned in Task 4 Step 1 (data test).
- **Removing every project of a category:** the filter option disappears instead of showing a dead "(0)" option; a newly added category shows up only once a project uses it. Pinned by `usedCategories` tests (Task 3 Step 1) and the filter wiring (Task 3 Step 6).
- **An About with a single paragraph:** phones must not show a "Read more" button that opens nothing. Pinned in Task 6 (About wiring + visual check).
- **No job, no hackathon, or no win yet:** the derived glance rows are omitted instead of crashing or showing "0 wins, 0 podiums"; with podiums but no win the row reads "3 podiums". Pinned by `glanceRows` tests (Task 6 Step 1).
- **A phone image must cost desktop nothing:** desktop never downloads `media.phone`, phones without one fall back to the poster/image, and the prerendered HTML is right before hydration. Pinned by `<picture>` + `<source media>` (Task 5) and the request-log check in Task 5 Step 7.

---

### Task 0: Worktree, baseline screenshots, pixel-diff scripts

**Files:** none in the repo (scripts go to the scratchpad).

- [ ] **Step 1: Create the worktree from the spec branch and confirm a green baseline**

```bash
cd /home/lezard/portfolio
git worktree add .claude/worktrees/milestone-11-content-refactor -b worktree-milestone-11-content-refactor milestone-11-content-refactor
cd .claude/worktrees/milestone-11-content-refactor
node -v          # must print v24.x
npm ci
npm test && npm run check && npm run lint
```

Expected: all pass.

- [ ] **Step 2: Write the screenshot script** `$SP/shot.mjs` (`$SP` = session scratchpad directory)

```js
// Full-page screenshots of /en/ and /fr/ at 360 and 1280px, dark and light. Usage: node shot.mjs <baseUrl> <outDir>
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/lezard/portfolio/package.json')('playwright');
const [base, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const lang of ['en', 'fr'])
	for (const theme of ['dark', 'light'])
		for (const width of [360, 1280]) {
			const page = await browser.newPage({
				viewport: { width, height: 900 },
				colorScheme: theme,
				reducedMotion: 'reduce'
			});
			await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
			await page.goto(`${base}/${lang}/`, { waitUntil: 'networkidle' });
			await page.evaluate(() => document.fonts.ready);
			await page.screenshot({ path: `${out}/${lang}-${theme}-${width}.png`, fullPage: true });
			await page.close();
		}
await browser.close();
```

- [ ] **Step 3: Write the compare script** `$SP/compare.mjs`

```js
// Byte-compares same-named PNGs; writes an ffmpeg difference image for each mismatch. Usage: node compare.mjs <a> <b> <diffDir>
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
const [a, b, diff] = process.argv.slice(2);
mkdirSync(diff, { recursive: true });
let bad = 0;
for (const f of readdirSync(a).filter((f) => f.endsWith('.png'))) {
	const same = readFileSync(`${a}/${f}`).equals(readFileSync(`${b}/${f}`));
	console.log(`${same ? 'identical' : 'DIFFERENT'}  ${f}`);
	if (same) continue;
	bad++;
	try {
		execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', `${a}/${f}`, '-i', `${b}/${f}`, '-lavfi',
			'[0][1]scale2ref[x][y];[x][y]blend=all_mode=difference,eq=brightness=0.3', `${diff}/${f}`]);
	} catch {
		console.log(`   (sizes differ too much for a diff image: compare ${a}/${f} and ${b}/${f} by eye)`);
	}
}
console.log(bad ? `${bad} different` : 'all identical');
process.exitCode = bad ? 1 : 0;
```

- [ ] **Step 4: Take the baseline**

```bash
npm run build
npx vite preview --port 4181 --strictPort &   # keep running; restart after every rebuild
node $SP/shot.mjs http://localhost:4181 $SP/before
node $SP/shot.mjs http://localhost:4181 $SP/before2
node $SP/compare.mjs $SP/before $SP/before2 $SP/diff0
```

Expected: 16 PNGs, and `all identical` (proves the screenshots are deterministic). If some differ between two runs of the same build, find the source (e.g. a missing `document.fonts.ready`, an animation not covered by reduced motion) and fix the script before going on.

No commit (nothing in the repo changed).

---

### Task 1: French typography applied automatically

**Files:**
- Modify: `src/lib/i18n/typography.ts`
- Test: `src/lib/i18n/typography.spec.ts`
- Modify: `src/lib/data/projects.ts`, `src/lib/data/skills.ts`, `src/lib/data/experience.ts`, `src/lib/data/profile.ts` (wrap exports)

**Interfaces:**
- Produces: `typesetFrench(text: string): string`; `typeset<T>(data: T): T` (both in `$lib/i18n/typography`).

- [ ] **Step 1: Write the failing tests** (append to `src/lib/i18n/typography.spec.ts`; add `typeset, typesetFrench` to the existing import from `./typography`)

```ts
describe('typesetFrench', () => {
	it('puts a no-break space before : ; ! ? % » and after «', () => {
		expect(typesetFrench('a : b ; c ! d ? 125 % « e »')).toBe(
			'a : b ; c ! d ? 125 % « e »'
		);
	});
	it('turns straight apostrophes into ’', () => {
		expect(typesetFrench("l'argent d'abord")).toBe('l’argent d’abord');
	});
	it('leaves clean text, URLs and times alone', () => {
		for (const text of ['Copié !', 'https://x.fr 12:30', 'l’argent', 'Copié !'])
			expect(typesetFrench(text), text).toBe(text);
	});
	it('produces text the checks accept', () => {
		const out = typesetFrench("Mon terrain : l'IA, à 100 % !");
		expect(frenchSpacingIssues(out)).toEqual([]);
		expect(straightApostrophes(out)).toEqual([]);
	});
});

describe('typeset', () => {
	it('fixes strings under fr keys at any depth and leaves everything else as written', () => {
		const data = [
			{ title: "l'a : b", text: { en: "it's : ok", fr: "l'a : b" }, list: [{ fr: 'x !' }] }
		];
		expect(typeset(data)).toEqual([
			{ title: "l'a : b", text: { en: "it's : ok", fr: 'l’a : b' }, list: [{ fr: 'x !' }] }
		]);
	});
	it('keeps numbers, booleans and undefined values', () => {
		expect(typeset({ n: 1, b: true, u: undefined, fr: 'a' })).toEqual({
			n: 1,
			b: true,
			u: undefined,
			fr: 'a'
		});
	});
	it('does not mutate its input', () => {
		const data = { fr: "l'a" };
		typeset(data);
		expect(data.fr).toBe("l'a");
	});
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/lib/i18n/typography.spec.ts`
Expected: FAIL (`typesetFrench` / `typeset` not exported).

- [ ] **Step 3: Implement** (append to `src/lib/i18n/typography.ts`)

```ts
/**
 * French typography for text typed with plain spaces and straight apostrophes: a no-break space
 * (U+00A0) before : ; ! ? % » and after «, and ’ for '. Clean text comes back unchanged.
 */
export function typesetFrench(text: string): string {
	return text.replace(BREAKABLE_SPACE, ' ').replace(/'/g, '’');
}

/**
 * A copy of `data` with `typesetFrench` applied to every string under an `fr` key, at any depth.
 * Content files wrap their exports in it, so French content can be written without U+00A0 or ’.
 */
export function typeset<T>(data: T): T {
	if (Array.isArray(data)) return data.map(typeset) as T;
	if (data === null || typeof data !== 'object') return data;
	return Object.fromEntries(
		Object.entries(data).map(([k, v]) => [
			k,
			k === 'fr' && typeof v === 'string' ? typesetFrench(v) : typeset(v)
		])
	) as T;
}
```

- [ ] **Step 4: Run them to see them pass**

Run: `npx vitest run src/lib/i18n/typography.spec.ts`
Expected: PASS.

- [ ] **Step 5: Wrap every content export**

Add `import { typeset } from '$lib/i18n/typography';` to each file and wrap the array/object literal, keeping the type annotation:

- `src/lib/data/projects.ts`: `export const PROJECTS: Project[] = typeset([ ... ]);`
- `src/lib/data/skills.ts`: `export const SKILL_GROUPS: SkillGroup[] = typeset([ ... ]);`
- `src/lib/data/experience.ts`: `JOBS`, `EDUCATION`, `HACKATHONS` each `= typeset([ ... ]);`
- `src/lib/data/profile.ts`: `export const PROFILE: Profile = typeset({ ... });`

Existing French text is already typeset, so the output is unchanged; the existing typography tests on the data keep passing. Add one line to each file's top doc comment where there is one, or above the export: `/** French text may use plain spaces and ' — typeset() fixes them (see docs/content-guide.md). */`.

- [ ] **Step 6: Full check and commit**

```bash
npm run format && npm run lint && npm run check && npm test
git add src/lib/i18n/typography.ts src/lib/i18n/typography.spec.ts src/lib/data/projects.ts src/lib/data/skills.ts src/lib/data/experience.ts src/lib/data/profile.ts
git commit -m "feat: French content typeset automatically (no-break spaces, apostrophes)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Icon library and one generic Icon component; skill groups carry their icon

**Files:**
- Create: `src/lib/data/icons.ts`, `src/lib/data/icons.spec.ts`, `src/lib/components/Icon.svelte`
- Modify: `src/lib/components/projects/DomainIcon.svelte` (thin wrapper until Task 3 deletes it)
- Delete: `src/lib/components/skills/SkillGroupIcon.svelte`
- Modify: `src/lib/skills.ts` (`SkillGroup`), `src/lib/data/skills.ts`, `src/lib/data/skills.spec.ts`, `src/lib/components/sections/Skills.svelte`

**Interfaces:**
- Produces: `ICONS` (`Record<'code'|'cube'|'sparkles'|'chip'|'gamepad'|'server'|'cycle', string>`) from `$lib/data/icons`; `isIconPath(path: string): boolean` from `$lib/data/icons`; `Icon.svelte` props `{ path: string; size?: number /* 24 */; stroke?: number /* 1.5 */ }`; `SkillGroup = { id: string; icon: string; title: Localized; description: Localized; skills: Skill[] }`. `SkillGroupId` is removed.

- [ ] **Step 1: Write the failing test** `src/lib/data/icons.spec.ts`

```ts
import { describe, expect, it } from 'vitest';
import { ICONS, isIconPath } from './icons';

describe('isIconPath', () => {
	it('accepts SVG path data', () => {
		expect(isIconPath('M8 7l-5 5 5 5M14 4l-4 16')).toBe(true);
		expect(isIconPath('M7.5 6h9a1.5 1.5 0 0 1 1.5 1.5z')).toBe(true);
	});
	it('rejects markup, empty strings and paths that do not start with a move', () => {
		for (const bad of ['', '<path d="M0 0"/>', 'L1 1', 'M0 0 url(x)'])
			expect(isIconPath(bad), bad).toBe(false);
	});
});

describe('icon library', () => {
	it.each(Object.entries(ICONS))('%s is well-formed path data', (_, path) => {
		expect(isIconPath(path)).toBe(true);
	});
	it('has no two identical icons', () => {
		const paths = Object.values(ICONS);
		expect(new Set(paths).size).toBe(paths.length);
	});
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/lib/data/icons.spec.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Create `src/lib/data/icons.ts`** (paths are today's `DomainIcon` / `SkillGroupIcon` shapes; `rect` and `circle` converted to equivalent path data)

```ts
/**
 * Stroke icons for categories (project domains, skill groups): SVG path data on a 24×24 grid,
 * drawn by `Icon.svelte` with no fill, a 1.5 stroke and round caps and joins. That is the
 * Lucide style: a Lucide icon's `d` attributes, joined into one string, fit as they are
 * (`<rect>` and `<circle>` elements must be converted to path data first).
 */
export const ICONS = {
	/** </> brackets (Web). */
	code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
	/** Isometric cube (Blockchain). */
	cube: 'M12 2l8.66 5v10L12 22l-8.66-5V7zM12 22V12M20.66 7L12 12 3.34 7',
	/** A big and a small four-pointed star (AI). */
	sparkles:
		'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
	/** Chip with two pins per side (Low-level, Systems). */
	chip:
		'M7.5 6h9a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 16.5v-9A1.5 1.5 0 0 1 7.5 6z' +
		'M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4',
	/** Game controller (Games). */
	gamepad:
		'M6 7h12a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-3a4 4 0 0 1 4-4z' +
		'M7 10.5v4M5 12.5h4' +
		'M15.2 11.5a.8.8 0 1 0 1.6 0a.8.8 0 1 0-1.6 0z' +
		'M17.2 13.5a.8.8 0 1 0 1.6 0a.8.8 0 1 0-1.6 0z',
	/** Two stacked server units (Backend). */
	server:
		'M4.5 4h15A1.5 1.5 0 0 1 21 5.5v4a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 9.5v-4A1.5 1.5 0 0 1 4.5 4z' +
		'M4.5 13h15a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-4A1.5 1.5 0 0 1 4.5 13z' +
		'M7 7.5h.01M7 16.5h.01',
	/** Two arrows in a circle (DevOps). */
	cycle: 'M20 12a8 8 0 0 1-13.66 5.66M4 12a8 8 0 0 1 13.66-5.66M18 3v4h-4M6 21v-4h4'
} as const;

/** Whether `path` looks like SVG path data: starts with a move, only path commands and numbers. */
export function isIconPath(path: string): boolean {
	return /^[Mm][MmLlHhVvCcSsQqTtAaZz0-9.,\s-]*$/.test(path);
}
```

- [ ] **Step 4: Run the test to see it pass**

Run: `npx vitest run src/lib/data/icons.spec.ts`
Expected: PASS.

- [ ] **Step 5: Create `src/lib/components/Icon.svelte`**

```svelte
<script lang="ts">
	/** A stroke icon from `$lib/data/icons` (or any 24×24 stroke path), decorative. */
	let { path, size = 24, stroke = 1.5 }: { path: string; size?: number; stroke?: number } =
		$props();
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path d={path} />
</svg>
```

(CSS rules such as `.icon :global(svg) { stroke-width: 1.2 }` in `ProjectCardSmall.svelte` still override the attribute, as before.)

- [ ] **Step 6: Make `DomainIcon.svelte` a thin wrapper** (replace the whole file; Task 3 deletes it)

```svelte
<script lang="ts">
	import { ICONS } from '$lib/data/icons';
	import type { Domain } from '$lib/projects';
	import Icon from '../Icon.svelte';

	let { domain, size = 32 }: { domain: Domain; size?: number } = $props();

	const PATH: Record<Domain, string> = {
		web: ICONS.code,
		blockchain: ICONS.cube,
		ai: ICONS.sparkles,
		'low-level': ICONS.chip,
		games: ICONS.gamepad
	};
</script>

<Icon path={PATH[domain]} {size} />
```

- [ ] **Step 7: Skill groups carry their icon**

In `src/lib/skills.ts`, delete `export type SkillGroupId = …` and change `SkillGroup`:

```ts
export type SkillGroup = {
	/** Unique, kebab-case; used in element ids. */
	id: string;
	/** Stroke icon path, usually one of `ICONS` in `$lib/data/icons`. */
	icon: string;
	title: Localized;
	/** One line shown under the title in the skills panel. */
	description: Localized;
	skills: Skill[];
};
```

In `src/lib/data/skills.ts`, `import { ICONS } from './icons';` and add `icon` right after each `id`: backend `ICONS.server`, systems `ICONS.chip`, devops `ICONS.cycle`, ai `ICONS.sparkles`, blockchain `ICONS.cube`, frontend `ICONS.code`.

In `src/lib/components/sections/Skills.svelte`, replace `import SkillGroupIcon from '../skills/SkillGroupIcon.svelte';` with `import Icon from '../Icon.svelte';`, and both `<SkillGroupIcon id={group.id} size={22} />` with `<Icon path={group.icon} size={22} />`. Delete `src/lib/components/skills/SkillGroupIcon.svelte` (`git rm`); remove the `skills/` folder if it is then empty.

- [ ] **Step 8: Update the skill data tests** (`src/lib/data/skills.spec.ts`)

Replace the test `'lists the groups in the positioning order'` (it pinned content) with:

```ts
	it('has unique kebab-case group ids', () => {
		const ids = SKILL_GROUPS.map((g) => g.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});

	it('gives every group a well-formed icon path', () => {
		const bad = SKILL_GROUPS.filter((g) => !isIconPath(g.icon)).map((g) => g.id);
		expect(bad).toEqual([]);
	});
```

with `import { isIconPath } from './icons';`. In the existing test `'gives every skill a well-formed SVG path'`, replace the inline regex with `!isIconPath(s.icon.path)`.

- [ ] **Step 9: Full check, pixel check, commit**

```bash
npm run format && npm run lint && npm run check && npm test
npm run build   # then restart the preview on 4181
node $SP/shot.mjs http://localhost:4181 $SP/after && node $SP/compare.mjs $SP/before $SP/after $SP/diff
```

Expected: all identical. If an icon differs, open `$SP/diff/<file>.png` with the Read tool, and fix the path conversion (compare against the `rect`/`circle` attributes in `git show HEAD~1:src/lib/components/projects/DomainIcon.svelte`).

```bash
git add src/lib/data/icons.ts src/lib/data/icons.spec.ts src/lib/components/Icon.svelte src/lib/components/projects/DomainIcon.svelte src/lib/skills.ts src/lib/data/skills.ts src/lib/data/skills.spec.ts src/lib/components/sections/Skills.svelte
git rm src/lib/components/skills/SkillGroupIcon.svelte
git commit -m "refactor: icon library and one Icon component; skill groups carry their icon

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Domains and contexts as self-contained entries; filters show used categories only

**Files:**
- Create: `src/lib/categories.ts`, `src/lib/categories.spec.ts`, `src/lib/data/categories.ts`, `src/lib/data/categories.spec.ts`
- Modify: `src/lib/projects.ts`, `src/lib/projects.spec.ts`, `src/lib/overlay.spec.ts`, `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`, `src/lib/i18n/dicts.spec.ts`, `src/lib/data/projects.spec.ts`
- Modify: `src/lib/components/sections/Projects.svelte`, `src/lib/components/projects/ProjectFilters.svelte`, `ProjectCardLarge.svelte`, `ProjectCardSmall.svelte`, `ProjectMedia.svelte`
- Delete: `src/lib/components/projects/DomainIcon.svelte`
- Modify: `CLAUDE.md` (convention line)

**Interfaces:**
- Consumes: `ICONS`, `isIconPath` (Task 2), `typeset` (Task 1), `Icon.svelte` (Task 2).
- Produces (`$lib/categories`): `type DomainDef = { label: Localized; color: string; icon: string }`, `type ContextDef = { label: Localized }`, `usedCategories<K extends string>(order: readonly K[], used: Iterable<K>): K[]`.
- Produces (`$lib/data/categories`): `DOMAINS`, `type Domain`, `DOMAIN_IDS: Domain[]`, `CONTEXTS`, `type Context`, `CONTEXT_IDS: Context[]`.
- `$lib/projects` keeps exporting `type Domain` and `type Context` (re-exported), `DOMAIN_TILE`, `mainDomain`, etc. **Removed:** `CONTEXTS` / `DOMAINS` arrays and `DOMAIN_COLOR` from `$lib/projects`; `projects.contexts` / `projects.domains` from the dictionaries.
- `ProjectFilters.svelte` gains a `lang: Lang` prop.

- [ ] **Step 1: Write the failing test** `src/lib/categories.spec.ts`

```ts
import { describe, expect, it } from 'vitest';
import { usedCategories } from './categories';

describe('usedCategories', () => {
	const order = ['web', 'ai', 'games'] as const;
	it('keeps the categories in use, in the given order', () => {
		expect(usedCategories(order, ['games', 'web', 'games'])).toEqual(['web', 'games']);
	});
	it('drops a category no project uses any more', () => {
		expect(usedCategories(order, ['ai'])).toEqual(['ai']);
	});
	it('is empty when nothing is used', () => {
		expect(usedCategories(order, [])).toEqual([]);
	});
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/lib/categories.spec.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Create `src/lib/categories.ts`**

```ts
import type { Localized } from '$lib/i18n/lang';

/** A project domain: everything about it lives in its entry in `$lib/data/categories`. */
export type DomainDef = {
	label: Localized;
	/** '#rrggbb'. Tints phone tiles and featured cards; must pass the contrast tests in both themes. */
	color: string;
	/** Stroke icon path, usually one of `ICONS` in `$lib/data/icons`. */
	icon: string;
};

/** A project context (professional, school…). */
export type ContextDef = { label: Localized };

/** The categories of `order` that occur in `used`, in `order`'s order (filters skip empty ones). */
export function usedCategories<K extends string>(order: readonly K[], used: Iterable<K>): K[] {
	const set = new Set(used);
	return order.filter((k) => set.has(k));
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `npx vitest run src/lib/categories.spec.ts`
Expected: PASS.

- [ ] **Step 5: Create `src/lib/data/categories.ts`** (labels copied exactly from today's `en.ts` / `fr.ts`)

```ts
import type { ContextDef, DomainDef } from '$lib/categories';
import { typeset } from '$lib/i18n/typography';
import { ICONS } from './icons';

/**
 * Project domains. Key order is filter order. A project's first domain is its main one (icon,
 * label and colour of its card). Add a line here and filters, cards and tiles follow.
 */
export const DOMAINS = typeset({
	web: { label: { en: 'Web', fr: 'Web' }, color: '#5b3fa0', icon: ICONS.code },
	blockchain: { label: { en: 'Blockchain', fr: 'Blockchain' }, color: '#24408e', icon: ICONS.cube },
	ai: { label: { en: 'AI', fr: 'IA' }, color: '#0b6e6e', icon: ICONS.sparkles },
	'low-level': { label: { en: 'Low-level', fr: 'Bas niveau' }, color: '#c2391b', icon: ICONS.chip },
	games: { label: { en: 'Games', fr: 'Jeux' }, color: '#7a2e5e', icon: ICONS.gamepad }
} satisfies Record<string, DomainDef>);
export type Domain = keyof typeof DOMAINS;
export const DOMAIN_IDS = Object.keys(DOMAINS) as Domain[];

/** Project contexts. Key order is filter order. */
export const CONTEXTS = typeset({
	professional: { label: { en: 'Professional', fr: 'Professionnel' } },
	personal: { label: { en: 'Personal', fr: 'Personnel' } },
	school: { label: { en: 'School', fr: 'École' } },
	hackathon: { label: { en: 'Hackathon', fr: 'Hackathon' } }
} satisfies Record<string, ContextDef>);
export type Context = keyof typeof CONTEXTS;
export const CONTEXT_IDS = Object.keys(CONTEXTS) as Context[];
```

- [ ] **Step 6: Point `$lib/projects` at the entries**

In `src/lib/projects.ts`: delete the `CONTEXTS`, `Context`, `DOMAINS`, `Domain` declarations at the top and the whole `DOMAIN_COLOR` constant with its comment. Add at the top:

```ts
import type { Context, Domain } from '$lib/data/categories';

export type { Context, Domain };
```

Keep `DOMAIN_TILE` and update its comment's first line to: `Phone tile colours per theme (the domain colour is \`DOMAINS[d].color\` in $lib/data/categories): …`.

- [ ] **Step 7: Move the colour tests to the category data, with new integrity tests**

Create `src/lib/data/categories.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mixHex } from '$lib/color';
import { LANGS } from '$lib/i18n/lang';
import { DOMAIN_TILE } from '$lib/projects';
import { contrastRatio } from '$lib/skills';
import { CONTEXT_IDS, CONTEXTS, DOMAIN_IDS, DOMAINS } from './categories';
import { isIconPath } from './icons';

/** Body and muted text colours per theme (src/app.css), checked against the phone tiles. */
const TEXT = {
	light: { body: '#2b2a26', muted: '#56534c' },
	dark: { body: '#d9d5cb', muted: '#a9a498' }
} as const;

describe('domains', () => {
	it.each(DOMAIN_IDS)('%s has a label in both languages, a #rrggbb colour and an icon', (d) => {
		for (const lang of LANGS) expect(DOMAINS[d].label[lang].trim(), lang).not.toBe('');
		expect(DOMAINS[d].color).toMatch(/^#[0-9a-f]{6}$/i);
		expect(isIconPath(DOMAINS[d].icon)).toBe(true);
	});

	it.each(DOMAIN_IDS)('%s has a colour whose phone tile reads at 4.5:1 in both themes', (d) => {
		for (const theme of ['light', 'dark'] as const) {
			const { base, pct, fg } = DOMAIN_TILE[theme];
			const bg = mixHex(DOMAINS[d].color, base, pct);
			const label = mixHex(DOMAINS[d].color, '#ffffff', fg);
			expect(contrastRatio(label, bg), `${theme} label`).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(TEXT[theme].body, bg), `${theme} body`).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(TEXT[theme].muted, bg), `${theme} muted`).toBeGreaterThanOrEqual(4.5);
		}
	});

	it('gives every domain its own colour', () => {
		const colors = DOMAIN_IDS.map((d) => DOMAINS[d].color.toLowerCase());
		expect(new Set(colors).size).toBe(colors.length);
	});

	it('has kebab-case keys', () => {
		for (const d of DOMAIN_IDS) expect(d).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});
});

describe('contexts', () => {
	it.each(CONTEXT_IDS)('%s has a label in both languages', (c) => {
		for (const lang of LANGS) expect(CONTEXTS[c].label[lang].trim(), lang).not.toBe('');
	});
});
```

(`TEXT` is copied from the current `describe('domain tiles (phone)', …)` block of `src/lib/projects.spec.ts`.) Then delete that `describe` block from `src/lib/projects.spec.ts` and remove `DOMAIN_COLOR`, `DOMAIN_TILE`, `DOMAINS`, `mixHex` and `contrastRatio` from its imports if no longer used.

In `src/lib/overlay.spec.ts`: replace `import { DOMAIN_COLOR, DOMAINS } from './projects';` with `import { DOMAIN_IDS, DOMAINS } from './data/categories';`, `it.each(DOMAINS)` with `it.each(DOMAIN_IDS)`, and `DOMAIN_COLOR[d]` with `DOMAINS[d].color`.

- [ ] **Step 8: Remove category labels from the dictionaries**

In `src/lib/i18n/en.ts` delete the `contexts: { … } satisfies Record<Context, string>,` and `domains: { … } satisfies Record<Domain, string>,` entries of `projects`, and change the import to `import type { SortKey } from '$lib/projects';`. In `src/lib/i18n/fr.ts` delete the same two entries. In `src/lib/i18n/dicts.spec.ts` change the import to `import { SORTS } from '$lib/projects';`, rename the test to `'%s labels every project sort'` and delete its two `for` lines over `CONTEXTS` and `DOMAINS`.

- [ ] **Step 9: Components read the entries**

`ProjectCardLarge.svelte` script:

```ts
	import { CONTEXTS, DOMAINS } from '$lib/data/categories';
	import type { Dict, Lang } from '$lib/i18n';
	import { mainDomain, type Project } from '$lib/projects';
	import Icon from '../Icon.svelte';
	import TrophyIcon from '../icons/TrophyIcon.svelte';
	import ProjectLinks from './ProjectLinks.svelte';
	import ProjectMedia from './ProjectMedia.svelte';
	import TechTags from './TechTags.svelte';

	let { project, lang, t }: { project: Project; lang: Lang; t: Dict['projects'] } = $props();

	const domain = $derived(DOMAINS[mainDomain(project)]);
```

Markup: `style:--dc={domain.color}`; `<span class="wm"><Icon path={domain.icon} size={160} /></span>`; `<span class="dom"><Icon path={domain.icon} size={18} />{domain.label[lang]}</span>`; `{CONTEXTS[project.context].label[lang]}` in place of `t.contexts[project.context]`.

`ProjectCardSmall.svelte`: same imports (no TrophyIcon/ProjectMedia), `const domain = $derived(DOMAINS[mainDomain(project)]);`, `style:--dc={domain.color}`, `<Icon path={domain.icon} size={22} />`, `{domain.label[lang]}` for every `t.domains[domain]`, `{CONTEXTS[project.context].label[lang]}` for every `t.contexts[project.context]`.

`ProjectMedia.svelte`: delete the `HUE` table and the `type Domain` import; add `import { DOMAINS } from '$lib/data/categories';` and `mainDomain` to the `$lib/projects` import. Placeholder: `<div class="placeholder" style:--dc={DOMAINS[mainDomain(project)].color}>`, and its CSS background becomes

```css
		/* From the main domain colour (the one intended visual change of M11). */
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--dc) 80%, #ffffff),
			color-mix(in srgb, var(--dc) 60%, #000000)
		);
```

`ProjectFilters.svelte`: add `lang` to the props (`lang: Lang`, `import type { Dict, Lang } from '$lib/i18n';`), replace the `CONTEXTS, DOMAINS` import with `import { CONTEXT_IDS, CONTEXTS, DOMAIN_IDS, DOMAINS } from '$lib/data/categories';` and `import { usedCategories } from '$lib/categories';`, and replace the two option constants:

```ts
	/** Only categories that at least one project uses, in category order. */
	const contextOptions = $derived([
		'all' as const,
		...usedCategories(CONTEXT_IDS, projects.map((p) => p.context))
	]);
	const domainOptions = $derived([
		'all' as const,
		...usedCategories(DOMAIN_IDS, projects.flatMap((p) => p.domains))
	]);
```

In the four label spots: `{value === 'all' ? t.all : CONTEXTS[value].label[lang]}` and `{value === 'all' ? t.all : DOMAINS[value].label[lang]}`.

`Projects.svelte`: `<ProjectFilters projects={PROJECTS} bind:filters bind:sort {lang} {t} />`.

Delete `src/lib/components/projects/DomainIcon.svelte` (`git rm`), then `grep -rn "DomainIcon\|DOMAIN_COLOR\|t\.domains\|t\.contexts" src` must print nothing.

- [ ] **Step 10: Drop the content-only project data tests**

In `src/lib/data/projects.spec.ts`: change the import to `import { mediaIssues } from '$lib/projects';` plus `import { DOMAIN_IDS } from './categories';`, use `expect(DOMAIN_IDS, p.id).toContain(d)` in the domain test, and delete the tests `'has at least one project in every context'` and `'includes at least one private project (no links)'`.

- [ ] **Step 11: CLAUDE.md convention**

Replace the line `- UI text lives only in \`src/lib/i18n/en.ts\` and \`fr.ts\`. …` with:

```
- UI text (buttons, headings, labels) lives only in `src/lib/i18n/en.ts` and `fr.ts`. `fr` is typed `Dict` (= `typeof en`), so every key must exist in both files. Category labels (project domains and contexts, skill groups) are content: they live with their entry in `src/lib/data/`.
```

- [ ] **Step 12: Full check, pixel check, commit**

```bash
npm run format && npm run lint && npm run check && npm test
npm run build   # then restart the preview on 4181
node $SP/shot.mjs http://localhost:4181 $SP/after && node $SP/compare.mjs $SP/before $SP/after $SP/diff
```

Expected: the 8 phone shots (`*-360.png`) identical. The 8 desktop shots differ **only** in the gradient placeholders of the project cards (check `$SP/diff/en-dark-1280.png` with Read: bright areas only inside the media boxes of the cards). Look at `$SP/after/en-light-1280.png` and confirm the placeholder titles read clearly in white on every domain. Then take the new desktop baseline for the next tasks: `cp $SP/after/*-1280.png $SP/before/`.

```bash
git add src/lib/categories.ts src/lib/categories.spec.ts src/lib/data/categories.ts src/lib/data/categories.spec.ts src/lib/projects.ts src/lib/projects.spec.ts src/lib/overlay.spec.ts src/lib/i18n/en.ts src/lib/i18n/fr.ts src/lib/i18n/dicts.spec.ts src/lib/data/projects.spec.ts src/lib/components/sections/Projects.svelte src/lib/components/projects/ProjectFilters.svelte src/lib/components/projects/ProjectCardLarge.svelte src/lib/components/projects/ProjectCardSmall.svelte src/lib/components/projects/ProjectMedia.svelte CLAUDE.md
git rm src/lib/components/projects/DomainIcon.svelte
git commit -m "refactor: domains and contexts as one entry each (label, colour, icon); filters list used categories only

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Featured list and hidden projects

**Files:**
- Modify: `src/lib/projects.ts`, `src/lib/projects.spec.ts`, `src/lib/data/projects.ts`, `src/lib/data/projects.spec.ts`, `src/lib/i18n/typography.spec.ts`, `src/lib/components/sections/Projects.svelte`

**Interfaces:**
- Produces: `visibleProjects(list: readonly Project[]): Project[]`; `sortProjects(list: readonly Project[], sort: SortKey, featured: readonly string[] = []): Project[]`; `Project.hidden?: true` (and `Project.featured` removed); `FEATURED: string[]`, `ALL_PROJECTS: Project[]`, `PROJECTS: Project[]` (visible only) from `$lib/data/projects`.

- [ ] **Step 1: Write the failing tests**

In `src/lib/projects.spec.ts`: remove `featured: 2` / `featured: 1` from the `list` fixture (projects `b` and `c`), add `visibleProjects` to the import, and replace the `sortProjects` `'featured: …'` and `'breaks ties deterministically by id'` tests with:

```ts
	it('featured: the FEATURED order first, then the rest newest first', () => {
		expect(ids(sortProjects(list, 'featured', ['c', 'b']))).toEqual(['c', 'b', 'e', 'd', 'a']);
	});
	it('featured: ignores ids that are not in the list', () => {
		expect(ids(sortProjects(list, 'featured', ['zzz', 'b']))).toEqual(['b', 'c', 'e', 'd', 'a']);
	});
	it('featured with no list is newest first', () => {
		expect(ids(sortProjects(list, 'featured'))).toEqual(ids(sortProjects(list, 'newest')));
	});
	it('breaks date ties deterministically by id', () => {
		const tied = [
			make({ id: 'z', date: '2024-01' }),
			make({ id: 'y', date: '2024-01' }),
			make({ id: 'x', date: '2023-01' })
		];
		expect(ids(sortProjects(tied, 'featured', []))).toEqual(['y', 'z', 'x']);
		expect(ids(sortProjects(tied, 'newest'))).toEqual(['y', 'z', 'x']);
	});
```

and add:

```ts
describe('visibleProjects', () => {
	it('drops hidden projects and keeps the order', () => {
		const withHidden = [list[0], make({ id: 'h', hidden: true }), list[1]];
		expect(ids(visibleProjects(withHidden))).toEqual(['a', 'b']);
	});
});
```

In `src/lib/data/projects.spec.ts`: import `{ ALL_PROJECTS, FEATURED }` instead of `PROJECTS`, rename every `PROJECTS` to `ALL_PROJECTS` (data checks run on hidden projects too), replace the test `'has unique positive integer featured ranks'` with:

```ts
	it('lists existing, visible, distinct projects in FEATURED', () => {
		const byId = new Map(ALL_PROJECTS.map((p) => [p.id, p]));
		const problems = FEATURED.flatMap((id, i) => {
			const p = byId.get(id);
			if (!p) return [`"${id}": no project has this id`];
			if (p.hidden) return [`"${id}": is hidden, remove it from FEATURED or unhide it`];
			if (FEATURED.indexOf(id) !== i) return [`"${id}": listed twice`];
			return [];
		});
		expect(problems).toEqual([]);
	});
```

In `src/lib/i18n/typography.spec.ts`: import `ALL_PROJECTS` instead of `PROJECTS` and use it in `frenchStrings(ALL_PROJECTS)`.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/lib/projects.spec.ts src/lib/data/projects.spec.ts`
Expected: FAIL (`visibleProjects`, `FEATURED`, `ALL_PROJECTS` missing; sort order wrong).

- [ ] **Step 3: Implement in `src/lib/projects.ts`**

In `Project`, delete the `featured?: number` field and its comment, and add:

```ts
	/** Takes the project off the site while keeping its text here. */
	hidden?: true;
```

Replace `byFeatured` and `sortProjects` with:

```ts
/**
 * `featured`: ids in "Highlights" order (FEATURED in $lib/data/projects), then everything else
 * newest first. Unknown ids are ignored.
 */
export function sortProjects(
	list: readonly Project[],
	sort: SortKey,
	featured: readonly string[] = []
): Project[] {
	if (sort === 'newest') return [...list].sort(byNewest);
	const rank = (p: Project) => {
		const i = featured.indexOf(p.id);
		return i < 0 ? Infinity : i;
	};
	return [...list].sort((a, b) => {
		const [ra, rb] = [rank(a), rank(b)];
		return ra === rb ? byNewest(a, b) : ra - rb;
	});
}

/** Projects shown on the site: everything not marked `hidden`. */
export function visibleProjects(list: readonly Project[]): Project[] {
	return list.filter((p) => !p.hidden);
}
```

- [ ] **Step 4: Data file**

In `src/lib/data/projects.ts`: add `visibleProjects` to the import from `$lib/projects`; delete every `featured: n,` line (six projects); rename `PROJECTS` to `ALL_PROJECTS` and update its comment; add above it and after it:

```ts
/**
 * "Highlights" order: these projects come first, in this order (the first 6 get the big cards).
 * Move a line to reorder. Every id must exist and not be hidden (a test checks it).
 */
export const FEATURED: string[] = [
	'kayp-pbw-2024',
	'kayp-h-web3-paris',
	'ft-transcendence',
	'microcode',
	'bahapad',
	'goldeneye-data-augmentation'
];

/** Every project, hidden ones included. Order here doesn't matter: the page sorts them. */
export const ALL_PROJECTS: Project[] = typeset([
	/* … unchanged entries … */
]);

/** What the site shows. */
export const PROJECTS = visibleProjects(ALL_PROJECTS);
```

`Projects.svelte`: `import { FEATURED, PROJECTS } from '$lib/data/projects';` and `sortProjects(filterProjects(PROJECTS, filters), sort, FEATURED)`.

- [ ] **Step 5: Run the tests to see them pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Full check, pixel check, commit**

```bash
npm run format && npm run lint && npm run check && npm test
npm run build   # then restart the preview on 4181
node $SP/shot.mjs http://localhost:4181 $SP/after && node $SP/compare.mjs $SP/before $SP/after $SP/diff
```

Expected: all identical.

```bash
git add src/lib/projects.ts src/lib/projects.spec.ts src/lib/data/projects.ts src/lib/data/projects.spec.ts src/lib/i18n/typography.spec.ts src/lib/components/sections/Projects.svelte
git commit -m "feat: featured order as a list of ids; hidden projects

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Check `hidden` works end to end** (temporary edit, never committed)

After the commit, add `hidden: true,` after `id: 'love-takedown',` in `src/lib/data/projects.ts`, `npm run build`, restart the preview:
- `curl -s http://localhost:4181/en/ | grep -c "Love Takedown"` → `0`;
- the projects lead reads "16 projects" (`curl -s http://localhost:4181/en/ | grep -o "16 projects"`).

Undo with `git checkout -- src/lib/data/projects.ts`, rebuild, restart the preview.

---

### Task 5: Optional phone image per project

**Files:**
- Modify: `src/lib/projects.ts`, `src/lib/projects.spec.ts`, `src/lib/components/projects/ProjectMedia.svelte`

**Interfaces:**
- Produces: `Media = { kind: 'image'; src: string; phone?: string } | { kind: 'video'; src: string; poster: string; phone?: string }`; `PHONE_QUERY = 'not all and (min-width: 48rem)'`; `mediaFiles` / `mediaIssues` cover `phone`.

- [ ] **Step 1: Write the failing tests** (in `src/lib/projects.spec.ts`, inside `describe('mediaIssues', …)`, plus a new `describe`; add `mediaFiles`, `PHONE_QUERY`, `DESKTOP_QUERY` to the import)

```ts
	it('checks the phone image like the others', () => {
		const exists = (src: string) => src !== 'projects/missing.jpg';
		expect(mediaIssues({ kind: 'image', src: 'projects/a.jpg', phone: 'projects/p.webp' }, exists)).toEqual([]);
		expect(mediaIssues({ kind: 'image', src: 'projects/a.jpg', phone: 'projects/p.gif' }, exists)).toEqual([
			'"projects/p.gif": phone image is not a .jpg, .jpeg, .png or .webp image'
		]);
		expect(mediaIssues({ kind: 'video', src: 'projects/v.mp4', poster: 'projects/a.jpg', phone: 'projects/missing.jpg' }, exists)).toEqual([
			'"projects/missing.jpg": missing from static/'
		]);
	});
```

```ts
describe('mediaFiles', () => {
	it('lists the phone image after the others', () => {
		expect(mediaFiles({ kind: 'video', src: 'v.mp4', poster: 'p.jpg', phone: 'm.jpg' })).toEqual(['v.mp4', 'p.jpg', 'm.jpg']);
		expect(mediaFiles({ kind: 'image', src: 'a.jpg' })).toEqual(['a.jpg']);
	});
});

describe('PHONE_QUERY', () => {
	it('is exactly the complement of DESKTOP_QUERY', () => {
		expect(PHONE_QUERY).toBe(`not all and ${DESKTOP_QUERY}`);
	});
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/lib/projects.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement in `src/lib/projects.ts`**

```ts
/**
 * Card media. Paths are relative to `static/`, without a leading slash. A video always has a
 * still `poster`: phones and reduced-motion visitors only ever get the poster. `phone` is an
 * optional image for phones only (the blurred card background); without it phones use the
 * image or poster. Desktop never downloads it.
 */
export type Media =
	| { kind: 'image'; src: string; phone?: string }
	| { kind: 'video'; src: string; poster: string; phone?: string };
```

Below `DESKTOP_QUERY`:

```ts
/** Phone screens, for `<source media>`: exactly the screens DESKTOP_QUERY doesn't match. */
export const PHONE_QUERY = `not all and ${DESKTOP_QUERY}`;
```

`mediaFiles`:

```ts
export function mediaFiles(media: Media): string[] {
	const main = media.kind === 'video' ? [media.src, media.poster] : [media.src];
	return media.phone === undefined ? main : [...main, media.phone];
}
```

In `mediaIssues`, after the video format check:

```ts
	if (media.phone !== undefined && !IMAGE_FILE.test(media.phone))
		issues.push(`"${media.phone}": phone image is not a .jpg, .jpeg, .png or .webp image`);
```

- [ ] **Step 4: Run them to see them pass**

Run: `npx vitest run src/lib/projects.spec.ts`
Expected: PASS.

- [ ] **Step 5: `ProjectMedia.svelte` serves the phone image through `<picture>`**

Add `PHONE_QUERY` to the `$lib/projects` import and replace the `<img …/>` in the `content` snippet with:

```svelte
			<picture>
				{#if media.phone}
					<source media={PHONE_QUERY} srcset="{base}/{media.phone}" />
				{/if}
				<img
					src="{base}/{media.kind === 'video' ? media.poster : media.src}"
					alt=""
					loading="lazy"
					decoding="async"
				/>
			</picture>
```

The `img` keeps its absolute positioning (`.frame` stays its containing block; `picture` is an unpositioned inline wrapper).

- [ ] **Step 6: Full check and pixel check** (no project has media, so all identical)

```bash
npm run format && npm run lint && npm run check && npm test
npm run build   # then restart the preview on 4181
node $SP/shot.mjs http://localhost:4181 $SP/after && node $SP/compare.mjs $SP/before $SP/after $SP/diff
```

- [ ] **Step 7: Check with test media** (temporary, never committed)

```bash
cp "/home/lezard/portfolio/tmp/pexels-photo-378442-2055502109.jpg" static/projects/test-desktop.jpg
cp "/home/lezard/portfolio/tmp/solitary-tree-on-a-green-hilltop-with-mountain-view-photo-4111566355.jpg" static/projects/test-phone.jpg
```

Temporarily add `media: { kind: 'image', src: 'projects/test-desktop.jpg', phone: 'projects/test-phone.jpg' },` to `kayp-pbw-2024` and `media: { kind: 'image', src: 'projects/test-desktop.jpg' },` to `microcode`. `npm run build`, restart the preview, and with a scratch Playwright script record `page.on('request')` URLs and screenshot the projects section:
- 390px: KAYP's card shows the tree photo (blurred), microcode's the desktop photo; requests include `test-phone.jpg`.
- 1280px: both cards show the desktop photo; requests **never** include `test-phone.jpg`.
- `curl -s http://localhost:4181/en/ | grep -o '<source[^>]*>'` shows the `<source media="not all and (min-width: 48rem)" …>` in the prerendered HTML.

Then undo: `git checkout -- src/lib/data/projects.ts && rm static/projects/test-*`, rebuild, restart the preview.

- [ ] **Step 8: Commit**

```bash
git add src/lib/projects.ts src/lib/projects.spec.ts src/lib/components/projects/ProjectMedia.svelte
git commit -m "feat: optional phone image per project, phones only

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Derived "At a glance" rows; About without a dead "Read more"

**Files:**
- Create: `src/lib/glance.ts`, `src/lib/glance.spec.ts`
- Modify: `src/lib/experience.ts` (`Job`), `src/lib/data/experience.ts`, `src/lib/data/profile.ts`, `src/lib/data/profile.spec.ts`, `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`, `src/lib/components/sections/Hero.svelte`, `src/lib/components/sections/About.svelte`

**Interfaces:**
- Consumes: `newestFirst`, `Job`, `Hackathon` from `$lib/experience`; `fill` from `$lib/i18n/format`.
- Produces (`$lib/glance`): `GlanceRow`, `GlanceAuto`, `GlanceEntry`, `GlanceItem = { label: string; value: string; short?: string; wide: boolean }`, `Plural = { one: string; other: string }`, `GlanceText = { tally: string; wins: Plural; podiums: Plural }`, `plural(n: number, forms: Plural, lang: Lang): string`, `glanceRows(entries: readonly GlanceEntry[], data: { jobs: readonly Job[]; hackathons: readonly Hackathon[] }, lang: Lang, t: GlanceText): GlanceItem[]`.
- `Job` gains `roleShort?: Localized; companyShort?: string`. Dict `hero` gains `glanceTally: string`, `glanceWins: Plural`, `glancePodiums: Plural`. `GlanceRow` moves from `$lib/data/profile` to `$lib/glance`.

- [ ] **Step 1: Write the failing test** `src/lib/glance.spec.ts`

```ts
import { describe, expect, it } from 'vitest';
import type { Hackathon, Job } from './experience';
import { glanceRows, plural, type GlanceEntry, type GlanceItem, type GlanceText } from './glance';

const T: GlanceText = {
	tally: '{wins}, {podiums}',
	wins: { one: '{n} win', other: '{n} wins' },
	podiums: { one: '{n} podium', other: '{n} podiums' }
};
const L = (en: string, fr = en) => ({ en, fr });

const job = (start: string, end: string | undefined, extra: Partial<Job> = {}): Job => ({
	company: `Co ${start}`,
	role: L(`Role ${start}`),
	start,
	end,
	internship: false,
	points: [],
	tech: [],
	...extra
});
const medal = (m: 1 | 2 | 3): Hackathon => ({ medal: m, event: 'E', date: '2024-01' });
/** The rendered row with this English label (fails the test if it is missing). */
const row = (rows: GlanceItem[], label: string) => {
	const r = rows.find((x) => x.label === label);
	expect(r, label).toBeDefined();
	return r!;
};

const entries: GlanceEntry[] = [
	{ label: L('Education', 'Formation'), value: L('42'), short: L('42 L'), wide: true },
	{ label: L('Latest role'), auto: 'latestRole' },
	{ label: L('Hackathons'), auto: 'hackathons' }
];

describe('plural', () => {
	it('uses the language plural rules', () => {
		const f = { one: '{n} x', other: '{n} xs' };
		expect(plural(1, f, 'en')).toBe('1 x');
		expect(plural(0, f, 'en')).toBe('0 xs');
		expect(plural(0, f, 'fr')).toBe('0 x');
		expect(plural(2, f, 'fr')).toBe('2 xs');
	});
});

describe('glanceRows', () => {
	it('passes hand-written rows through in the page language', () => {
		const [row] = glanceRows(entries, { jobs: [], hackathons: [] }, 'fr', T);
		expect(row).toEqual({ label: 'Formation', value: '42', short: '42 L', wide: true });
	});

	it('derives the latest role from the newest job, short names first', () => {
		const jobs = [
			job('2024-10', '2025-04'),
			job('2025-07', '2026-01', { roleShort: L('ML dev'), companyShort: 'Sogeti (Capgemini)' })
		];
		expect(row(glanceRows(entries, { jobs, hackathons: [] }, 'en', T), 'Latest role')).toEqual({
			label: 'Latest role',
			value: 'ML dev — Sogeti (Capgemini)',
			short: 'Sogeti (Capgemini)',
			wide: false
		});
	});

	it('falls back to the full role and company, and treats a job with no end as the newest', () => {
		const jobs = [job('2025-07', '2026-01'), job('2020-01', undefined)];
		const r = row(glanceRows(entries, { jobs, hackathons: [] }, 'en', T), 'Latest role');
		expect(r.value).toBe('Role 2020-01 — Co 2020-01');
		expect(r.short).toBe('Co 2020-01');
	});

	it('counts wins and podiums', () => {
		const hackathons = [medal(1), medal(1), medal(2), medal(3), medal(3)];
		const r = row(glanceRows(entries, { jobs: [], hackathons }, 'en', T), 'Hackathons');
		expect(r.value).toBe('2 wins, 5 podiums');
	});

	it('shows only podiums when there is no win yet', () => {
		const r = row(glanceRows(entries, { jobs: [], hackathons: [medal(3)] }, 'en', T), 'Hackathons');
		expect(r.value).toBe('1 podium');
	});

	it('omits derived rows that have no data', () => {
		const rows = glanceRows(entries, { jobs: [], hackathons: [] }, 'en', T);
		expect(rows.map((r) => r.label)).toEqual(['Education']);
	});
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/lib/glance.spec.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Create `src/lib/glance.ts`**

```ts
import { newestFirst, type Hackathon, type Job } from '$lib/experience';
import { fill } from '$lib/i18n/format';
import type { Lang, Localized } from '$lib/i18n/lang';

/** A hand-written row of the hero's "At a glance" card. */
export type GlanceRow = {
	label: Localized;
	value: Localized;
	/** Shorter value for the phone tiles. */
	short?: Localized;
	/** Full-width tile on phones. */
	wide?: true;
};

/**
 * A row computed from the data: `latestRole` = the newest job ("role — company", short =
 * company; `roleShort` / `companyShort` win when set), `hackathons` = "2 wins, 5 podiums".
 * Left out when there is no job / no hackathon.
 */
export type GlanceAuto = { label: Localized; auto: 'latestRole' | 'hackathons'; wide?: true };

export type GlanceEntry = GlanceRow | GlanceAuto;

/** A row ready to render. */
export type GlanceItem = { label: string; value: string; short?: string; wide: boolean };

export type Plural = { one: string; other: string };
export type GlanceText = { tally: string; wins: Plural; podiums: Plural };

/** `{n}` filled into the form the language's plural rules pick (French: 0 and 1 are singular). */
export function plural(n: number, forms: Plural, lang: Lang): string {
	return fill(new Intl.PluralRules(lang).select(n) === 'one' ? forms.one : forms.other, { n });
}

export function glanceRows(
	entries: readonly GlanceEntry[],
	data: { jobs: readonly Job[]; hackathons: readonly Hackathon[] },
	lang: Lang,
	t: GlanceText
): GlanceItem[] {
	return entries.flatMap((e): GlanceItem[] => {
		const label = e.label[lang];
		const wide = e.wide === true;
		if (!('auto' in e)) return [{ label, value: e.value[lang], short: e.short?.[lang], wide }];
		if (e.auto === 'latestRole') {
			const job = newestFirst(data.jobs)[0];
			if (!job) return [];
			const company = job.companyShort ?? job.company;
			const role = (job.roleShort ?? job.role)[lang];
			return [{ label, value: `${role} — ${company}`, short: company, wide }];
		}
		const podiums = data.hackathons.length;
		if (podiums === 0) return [];
		const wins = data.hackathons.filter((h) => h.medal === 1).length;
		const p = plural(podiums, t.podiums, lang);
		const value = wins === 0 ? p : fill(t.tally, { wins: plural(wins, t.wins, lang), podiums: p });
		return [{ label, value, wide }];
	});
}
```

Hand-written rows without `short` produce `short: undefined`; `toEqual` ignores undefined properties, and the Hero tests `row.short` for truthiness.

- [ ] **Step 4: Run it to see it pass**

Run: `npx vitest run src/lib/glance.spec.ts`
Expected: PASS.

- [ ] **Step 5: Data and dictionaries**

`src/lib/experience.ts`, in `Job` after `role`:

```ts
	/** Shorter role for the hero's "Latest role" (defaults to `role`). */
	roleShort?: Localized;
	/** Shorter company name for the hero's "Latest role" (defaults to `company`). */
	companyShort?: string;
```

`src/lib/data/experience.ts`, Sogeti job after `role`:

```ts
		roleShort: { en: 'ML & Computer Vision developer', fr: 'Développeur ML & IA Vision' },
		companyShort: 'Sogeti (Capgemini)',
```

`src/lib/data/profile.ts`: delete the `GlanceRow` type, `import type { GlanceEntry } from '$lib/glance';`, set `glance: GlanceEntry[];` in `Profile` (comment: `/** Hero "At a glance" rows, in order: hand-written, or { auto } computed from the data. */`), and replace the Latest role and Hackathons rows with:

```ts
		{ label: { en: 'Latest role', fr: 'Dernier poste' }, auto: 'latestRole' },
```

```ts
		{ label: { en: 'Hackathons', fr: 'Hackathons' }, auto: 'hackathons' },
```

`en.ts`, in `hero` after `glance`:

```ts
		/** "At a glance" hackathon tally, from the data. */
		glanceTally: '{wins}, {podiums}',
		glanceWins: { one: '{n} win', other: '{n} wins' },
		glancePodiums: { one: '{n} podium', other: '{n} podiums' }
```

`fr.ts`, same place:

```ts
		glanceTally: '{wins}, {podiums}',
		glanceWins: { one: '{n} victoire', other: '{n} victoires' },
		glancePodiums: { one: '{n} podium', other: '{n} podiums' }
```

- [ ] **Step 6: Profile data tests** (`src/lib/data/profile.spec.ts`)

Replace the `texts` list in `'has non-empty text in both languages'` with `[PROFILE.role, PROFILE.pitch, PROFILE.pitchMore, ...PROFILE.bio]` and add after it:

```ts
	it.each(LANGS)('renders every glance row with text (%s)', (lang) => {
		const h = dicts[lang].hero;
		const rows = glanceRows(PROFILE.glance, { jobs: JOBS, hackathons: HACKATHONS }, lang, {
			tally: h.glanceTally,
			wins: h.glanceWins,
			podiums: h.glancePodiums
		});
		for (const r of rows) {
			expect(r.label.trim(), JSON.stringify(r)).not.toBe('');
			expect(r.value.trim(), JSON.stringify(r)).not.toBe('');
			if (r.short !== undefined) expect(r.short.trim(), JSON.stringify(r)).not.toBe('');
		}
	});
```

(imports: `dicts` from `$lib/i18n`, `glanceRows` from `$lib/glance`, `HACKATHONS, JOBS` from `./experience`). Replace `'has three bio paragraphs and the five at-a-glance rows'`, `'has exactly one full-width glance row on phones: Stack'` and `'has phone short values for Education and Latest role'` (they pinned content) with:

```ts
	it('has at least one About paragraph and at most one full-width glance row', () => {
		expect(PROFILE.bio.length).toBeGreaterThan(0);
		expect(PROFILE.glance.filter((r) => r.wide).length).toBeLessThanOrEqual(1);
	});
```

- [ ] **Step 7: Hero renders the computed rows**

`Hero.svelte` script: add imports `import { HACKATHONS, JOBS } from '$lib/data/experience';` and `import { glanceRows } from '$lib/glance';`, then

```ts
	const glance = $derived(
		glanceRows(PROFILE.glance, { jobs: JOBS, hackathons: HACKATHONS }, lang, {
			tally: t.glanceTally,
			wins: t.glanceWins,
			podiums: t.glancePodiums
		})
	);
```

Markup: `{#each glance as row, i (i)}` and inside use `row.label`, `row.value`, `row.short` (plain strings now, no `[lang]`).

- [ ] **Step 8: About shows "Read more" only when there is more**

In `About.svelte`, change `{#if ready}` (around the read-more button) to `{#if ready && rest.length > 0}`.

- [ ] **Step 9: Full check, pixel check, one-paragraph check, commit**

```bash
npm run format && npm run lint && npm run check && npm test
npm run build   # then restart the preview on 4181
node $SP/shot.mjs http://localhost:4181 $SP/after && node $SP/compare.mjs $SP/before $SP/after $SP/diff
```

Expected: all identical (the glance text is the same string for string). Then temporarily keep only the first `bio` paragraph (`sed`/edit, never committed), rebuild, screenshot `/en/` at 390px: About shows one paragraph and **no** "Read more" button; revert, rebuild.

```bash
git add src/lib/glance.ts src/lib/glance.spec.ts src/lib/experience.ts src/lib/data/experience.ts src/lib/data/profile.ts src/lib/data/profile.spec.ts src/lib/i18n/en.ts src/lib/i18n/fr.ts src/lib/components/sections/Hero.svelte src/lib/components/sections/About.svelte
git commit -m "feat: hero glance derives latest role and hackathon tally from the data; no empty Read more

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: The content guide

**Files:**
- Create: `docs/content-guide.md`
- Modify: `README.md`, `CLAUDE.md`

- [ ] **Step 1: Write `docs/content-guide.md`**

Audience: Jocelyn, editing alone in an editor, months from now. Every recipe = **file**, **copy-paste snippet with today's real field names**, **what to check**. Before writing each recipe, re-read the file it describes so field names and comments match exactly. Required content, in this order:

1. **Intro (5 lines):** everything editable lives in `src/lib/data/` (table: file → what it holds: `projects.ts`, `categories.ts`, `skills.ts`, `skill-icons.ts`, `icons.ts`, `experience.ts`, `profile.ts`) plus `static/` (CV, photo, project media) and `src/lib/i18n/en.ts` / `fr.ts` (UI text only). Text is `{ en: '…', fr: '…' }`. French can be typed naturally: plain spaces before `: ; ! ? %` and straight apostrophes are fixed automatically; if a French string contains `'`, write it in double quotes (`"l'IA"`) — Prettier (`npm run format`) does this for you.
2. **Projects:** full annotated example entry (every field: `id` kebab-case and stable, `title`, `description` long text for the big cards, `summary` one sentence ≤ 100 chars ending with a full stop for the small tiles, `date` `'YYYY-MM'`, `context`, `domains` main one first, `tech`, `links: { repo?, demo? }` — none = shown as private, `award?`, `media?`, `hidden?`). Recipes: add; remove (delete the entry, and its id from `FEATURED`); hide/unhide; reorder or change the highlighted projects (`FEATURED`, the first 6 visible in "Highlights" order get big cards); add a live demo link; mark an award.
3. **Media:** formats (desktop 16:9, e.g. 1280×720; video `.mp4`; images `.jpg`/`.png`/`.webp`), folder convention `static/projects/<id>/`, the three `media` shapes (image; video + poster; either + `phone`), how each is shown (desktop video plays muted in view, never on phones or with reduced motion; phones show the phone image, else the poster/image, blurred under the text). ffmpeg, with a note "macOS: `brew install ffmpeg`":
   - compress and trim a recording:
     `ffmpeg -ss 3 -t 20 -i recording.mov -an -vf "scale=1280:-2,fps=30" -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart static/projects/<id>/demo.mp4` (explain `-ss` start second, `-t` duration, `-crf` quality 23 better/bigger … 32 smaller; aim ≤ 5 MB);
   - poster from second 5: `ffmpeg -ss 5 -i static/projects/<id>/demo.mp4 -frames:v 1 -c:v libwebp -quality 80 static/projects/<id>/poster.webp` (aim ≤ 200 KB);
   - 16:9 desktop image from a screenshot: `ffmpeg -i shot.png -vf "crop=iw:iw*9/16,scale=1280:-2" -c:v libwebp -quality 80 static/projects/<id>/cover.webp`;
   - 4:5 phone image (centre crop): `ffmpeg -i shot.png -vf "crop=ih*4/5:ih,scale=800:-2" -c:v libwebp -quality 80 static/projects/<id>/phone.webp`; tip: the text sits at the bottom of the card over a dark veil and blur, so pick an image whose interesting part is in the top half; blur/veil strength are `--blur` / veil variables in `ProjectCardLarge.svelte`.
   - file names are case-sensitive on the server (the test checks exact case).
4. **Categories** (`categories.ts`): add a domain (key, `label`, `color` — must pass the contrast test; if it fails, darken it; `icon` from `ICONS` or a new one); rename (label only; renaming the key means updating projects); remove (no project may still use it — the type checker lists them); add a context. Filters show a category only when a visible project uses it. Adding a new icon in `icons.ts`: copy a Lucide icon's `d` attributes (lucide.dev, 24×24, stroke), convert `<rect>`/`<circle>` to path data, join.
5. **Skills** (`skills.ts`): add a skill — find the logo in simple-icons (simpleicons.org, import `siName` from `'simple-icons'`), or add a custom `{ path, hex }` in `skill-icons.ts`; translated names `{ en, fr }`; add/reorder/remove a group (`id`, `icon`, `title`, `description`, `skills`).
6. **Experience** (`experience.ts`): add a job (all fields, `end` omitted = "Present", `roleShort`/`companyShort` for the hero, optional recommendation `quote` with `original` language); add a school or certificate (`link` makes the title a link); add a hackathon result (`medal` 1–3, `fullName` tooltip for acronyms, `project`). The hero's "Latest role" and hackathon tally update by themselves.
7. **Profile** (`profile.ts`): role, pitch (`pitch` first sentence shown on phones, `pitchMore` desktop only), About paragraphs `bio` (phones show the first, then "Read more"), glance rows (hand-written `{ label, value, short?, wide? }` or `{ label, auto }`), `available` pill, links, email. Replace the CV (`static/cv-en.pdf`, `static/cv-fr.pdf`, same names) and the photo (`static/photo.jpg`, portrait 4:5, e.g. 480×600).
8. **UI text** (`en.ts` / `fr.ts`): same keys in both files (a test checks it); `{name}` placeholders.
9. **Check your edit:** `npm run format`, `npm test` (a red test names the project/field and what is wrong — list the common messages: missing file in `static/`, summary too long, FEATURED id unknown or hidden, contrast too low), `npm run check` (typos in category names), `npm run dev` to look at it, `npm run audit` before publishing.

- [ ] **Step 2: Link it**

`README.md`, after the commands list: `Editing content (projects, media, skills, experience, About): see [docs/content-guide.md](docs/content-guide.md).` In `CLAUDE.md`, add under "Conventions": `- How to edit each kind of content is documented in \`docs/content-guide.md\`; keep it in sync when a data type or file changes.`

- [ ] **Step 3: Walk-through** — follow two recipes literally on a scratch edit (add a project with a demo link and a new domain "DevOps" with icon `cycle` and colour `#1f5f3a`; then hide it): `npm test`, `npm run check`, `npm run build`, check the filter shows "DevOps" and the card renders. Fix any step of the guide that was wrong or missing. Revert the scratch edit (`git checkout -- src/lib/data/`).

- [ ] **Step 4: Commit**

```bash
npm run lint
git add docs/content-guide.md README.md CLAUDE.md
git commit -m "docs: content guide for every kind of edit

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Final verification, review guide, PR

**Files:**
- Create: `docs/reviews/milestone-11-review-guide.md`

- [ ] **Step 1: Everything green**

```bash
npm run format && npm run lint && npm run check && npm test && npm run build
npm run audit
```

Expected: 0 axe violations; Lighthouse as in M10. Paste the summary lines into the review guide.

- [ ] **Step 2: Final pixel comparison against `master`**

Task 3 replaced the desktop baseline, so build `master` again in a throwaway worktree and compare the finished branch with it:

```bash
git worktree add $SP/base master
(cd $SP/base && npm ci && npm run build)
(cd $SP/base && npx vite preview --port 4182 --strictPort &)
node $SP/shot.mjs http://localhost:4182 $SP/master
node $SP/shot.mjs http://localhost:4181 $SP/final
node $SP/compare.mjs $SP/master $SP/final $SP/diff-final
# stop the 4182 preview, then:
git worktree remove --force $SP/base
```

Expected: the 8 `*-360.png` shots identical; the 8 `*-1280.png` shots differ only inside the project-card placeholders (check one diff image with Read). Describe the placeholder change in the review guide (don't commit images).

- [ ] **Step 3: Final review** — dispatch the whole-branch review (subagent-driven: per the skill; native: one reviewer on the most capable model) against the spec section. Fix Critical/Important findings; list deferred minors in the review guide.

- [ ] **Step 4: Review guide** `docs/reviews/milestone-11-review-guide.md`: what changed and why (one paragraph per task), the "where do I edit X" table (one line per kind of edit → file), the one visual change (placeholder gradient), verification results (tests count, check, audit summary, pixel comparison), what to try by hand (follow one recipe of the content guide; hide a project; reorder `FEATURED`), deferred minors.

- [ ] **Step 5: Push and open the PR**

```bash
git add docs/reviews/milestone-11-review-guide.md
git commit -m "docs: Milestone 11 review guide

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin worktree-milestone-11-content-refactor:milestone-11-content-refactor
gh pr create --base master --head milestone-11-content-refactor --title "Milestone 11 — Content-ready refactor" --body "<summary, link to the review guide and the content guide>

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

Stop there: Jocelyn reviews the PR before anything is merged.
