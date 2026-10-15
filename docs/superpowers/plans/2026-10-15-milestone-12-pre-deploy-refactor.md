# Milestone 12 - Pre-deploy refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove duplication, misplaced helpers, component-held logic and dead code before the first deployment, with the site rendering pixel for pixel as before except two approved icon fixes.

**Architecture:** Same architecture (typed data in `src/lib/data/`, types and pure logic in `src/lib/*.ts`, thin Svelte 5 components, two dictionaries). A new screenshot comparison script (`npm run screens`) guards every task against a baseline taken before any change. Shared values move into CSS tokens and `ICONS`; helpers move to the module that owns their concept.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, adapter-static, Vite 8, Vitest 4, Playwright 1.63 (Chromium), TypeScript 6, Node 24.

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section "Milestone 12 - Pre-deploy refactor".

## Global Constraints

- Invisible, with approved exceptions: only (1) the small project card's `💼` becomes the line briefcase icon, (2) one rounded CV document shape everywhere (Hero "View CV" icon corners slightly rounded). Any other screenshot difference stops the work until its cause is found.
- The light palette stays written twice in `src/app.css`; a test fails if the two blocks differ. No `light-dark()`.
- No new dependency (the pixel comparison runs in Playwright's Chromium with canvas `getImageData`).
- Runes only (`$props`, `$state`, `$derived`); SvelteKit config stays in `vite.config.ts`; never hardcode `/en/` (use `localeHref` / `assetHref` with `base`).
- UI text only in `src/lib/i18n/en.ts` / `fr.ts`, same keys in both (`fr: Dict`). `src/lib/i18n/lang.ts` must not import the dictionaries.
- Test rule: a test is added or restored only if it catches a breakage nobody would see while editing, or that the screenshot comparison cannot see. No test-only module in `src/`.
- After every task: `npm test`, `npm run check`, `npm run lint`, `npm run build` clean, and `npm run screens -- --compare` with no difference outside the approved exceptions. One commit per task, message ending with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Bpc1BL8RhHGNJ6NHg9ay54
  ```
- Work in the worktree `/home/lezard/portfolio/.claude/worktrees/milestone-12-refactor` (branch `worktree-milestone-12-refactor`). Run `source ~/.nvm/nvm.sh` first (Node 24).

## Review Focus

1. **Screenshot noise:** lazy images, the web font or the scroll reveal not settled when the capture is taken would make two captures of the same code differ. Expected: two baselines in a row compare equal (Task 0, Step 6).
2. **Scoped CSS lost when an `<svg>` moves into `<Icon>`:** a parent rule like Hero's `.cv svg { display: none }` (phone) no longer matches an svg rendered by a child component. Expected: every such rule becomes `:global(svg)`; the 360px captures show no CV icon in the Hero (Task 3, Step 5).
3. **`npm run audit` deleting the screenshot baseline:** it wipes `reports/` today. Expected: it keeps `reports/screens-*` (Task 0, Step 4 and Step 7).
4. **Before hydration:** `hydrated()` must stay false in the prerendered HTML, so no-JS visitors still see every paragraph, tile and panel and no toggle buttons. Expected: the no-JS capture is unchanged (capture `en-light-360-nojs`, Task 6).
5. **French plural for one folded tile:** `projects.showMore` with 1 must read "Voir 1 autre projet" (French `one` covers 0 and 1). Expected: a `plural` test over the real dictionaries (Task 4, Step 1).

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `scripts/preview.ts` (new) | Build + `vite preview` start/stop, phone collapsibles opener; shared by audit and screens | 0 |
| `scripts/screens.ts` (new) | Capture the site, save a baseline or compare with it | 0 |
| `scripts/screens-report.ts` (+ spec, new) | Pure: capture list, result table | 0 |
| `scripts/audit.ts` | Uses `preview.ts`; keeps `reports/screens-*` | 0 |
| `docs/backlog.md` (new) | Watch list | 0, 7 |
| `scripts/tsconfig.json` (new), `package.json`, `.nvmrc` (new) | Type-check scripts, Node version | 1 |
| `scripts/og.ts` | Loads data through Vite | 1 |
| `src/lib/color.ts` (+ spec, new) | `contrastRatio`, `logoColor` | 2 |
| `src/lib/theme.ts` | + `THEME_BG` | 2 |
| `src/lib/theme-tokens.spec.ts` (new) | Palette sync, `THEME_BG`, domain and photo contrast, read from CSS | 2 |
| `src/app.css` | + `--page-max`, `--gutter`, `--on-photo-*`, `--photo-*`, shared `.logo` | 2 |
| `src/lib/data/icons.ts` | + 9 icons | 3 |
| `src/lib/components/icons/*` | deleted | 3 |
| `src/lib/i18n/lang.ts`, `format.ts` | + `localize`, `plural`, `Plural` | 4 |
| `src/lib/breakpoints.ts` (+ spec, new) | `DESKTOP_QUERY`, `PHONE_QUERY`; known `@media` widths | 5 |
| `src/lib/projects.ts` | + `projectLayout`; − `splitTiers`, `hiddenCount`, queries | 6 |
| `src/lib/hydrated.svelte.ts` (new) | `hydrated()` | 6 |

---

### Task 0: Safety net (screenshot comparison, watch list, baseline)

**Files:**
- Create: `scripts/preview.ts`, `scripts/screens-report.ts`, `scripts/screens-report.spec.ts`, `scripts/screens.ts`, `docs/backlog.md`
- Modify: `scripts/audit.ts`, `package.json`

**Interfaces:**
- Produces: `npm run screens` (writes `reports/screens-baseline/*.png`), `npm run screens -- --compare` (writes `reports/screens-current/`, `reports/screens-diff/`, exits 1 on any difference). `startPreview(port): Promise<() => void>`, `openCollapsibles(page): Promise<void>` from `scripts/preview.ts`.

- [ ] **Step 1: Write the failing test for the pure report helpers**

`scripts/screens-report.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { captures, formatResults } from './screens-report.ts';

describe('captures', () => {
	it('covers both languages and themes at every width, plus the open and no-JS states', () => {
		const names = captures().map((c) => c.name);
		expect(names).toContain('en-dark-360');
		expect(names).toContain('fr-light-1440');
		expect(names).toContain('fr-dark-360-open');
		expect(names).toContain('en-light-360-nojs');
		expect(new Set(names).size).toBe(names.length);
		expect(names).toHaveLength(2 * 2 * 5 + 2 * 2 + 1);
	});
});

describe('formatResults', () => {
	it('lists differences first and ends with a verdict', () => {
		const out = formatResults([
			{ name: 'en-dark-360', same: true, detail: 'identical' },
			{ name: 'fr-light-1440', same: false, detail: '12 px in 4×3 at (10, 20)' }
		]);
		expect(out.split('\n')[0]).toContain('DIFF  fr-light-1440');
		expect(out).toContain('1 of 2 captures differ');
	});
	it('says so when everything matches', () => {
		expect(formatResults([{ name: 'a', same: true, detail: 'identical' }])).toContain(
			'all 1 captures identical'
		);
	});
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run scripts/screens-report.spec.ts`
Expected: FAIL, cannot find module `./screens-report.ts`.

- [ ] **Step 3: Implement `scripts/screens-report.ts`**

```ts
/** One page state to capture. */
export type Capture = {
	name: string;
	lang: 'en' | 'fr';
	theme: 'dark' | 'light';
	width: number;
	/** Open every phone collapsible first (About, projects, skills, recommendation). */
	open?: true;
	/** Block the app bundles: the prerendered markup before hydration. */
	noJs?: true;
};

export const WIDTHS = [360, 390, 768, 1280, 1440] as const;

/** Every capture, in a stable order. */
export function captures(): Capture[] {
	const list: Capture[] = [];
	for (const lang of ['en', 'fr'] as const)
		for (const theme of ['dark', 'light'] as const) {
			for (const width of WIDTHS) list.push({ name: `${lang}-${theme}-${width}`, lang, theme, width });
			list.push({ name: `${lang}-${theme}-360-open`, lang, theme, width: 360, open: true });
		}
	list.push({ name: 'en-light-360-nojs', lang: 'en', theme: 'light', width: 360, noJs: true });
	return list;
}

export type Result = { name: string; same: boolean; detail: string };

/** Differences first, then a one-line verdict. */
export function formatResults(results: readonly Result[]): string {
	const diffs = results.filter((r) => !r.same);
	const width = Math.max(...results.map((r) => r.name.length));
	const lines = [...diffs, ...results.filter((r) => r.same)].map(
		(r) => `${r.same ? 'SAME' : 'DIFF'}  ${r.name.padEnd(width)}  ${r.detail}`
	);
	lines.push(
		diffs.length === 0
			? `\nall ${results.length} captures identical`
			: `\n${diffs.length} of ${results.length} captures differ (diff images in reports/screens-diff/)`
	);
	return lines.join('\n');
}
```

- [ ] **Step 4: Extract the preview server and collapsibles into `scripts/preview.ts`, use it in `scripts/audit.ts`**

`scripts/preview.ts`:
```ts
import { execSync, spawn, type ChildProcess } from 'node:child_process';
import type { Page } from 'playwright';

/**
 * Resolves once `vite preview` itself prints its URL. Polling the port instead could get an
 * answer from another server already on it (vite then exits on --strictPort), and test that.
 */
function waitForPreview(server: ChildProcess, port: number, timeoutMs = 30_000): Promise<void> {
	return new Promise((resolve, reject) => {
		let output = '';
		const timer = setTimeout(
			() => reject(new Error('vite preview did not start in time')),
			timeoutMs
		);
		const onData = (chunk: Buffer) => {
			output += chunk.toString();
			if (output.includes(`:${port}`)) {
				clearTimeout(timer);
				resolve();
			}
		};
		server.stdout?.on('data', onData);
		server.stderr?.on('data', onData);
		server.on('exit', (code) => {
			clearTimeout(timer);
			reject(
				new Error(`vite preview exited (code ${code}); is port ${port} already in use?\n${output}`)
			);
		});
	});
}

/** Builds the site, serves build/ on `port` and returns the function that stops the server. */
export async function startPreview(port: number): Promise<() => void> {
	execSync('npm run build', { stdio: 'inherit' });
	const server = spawn('./node_modules/.bin/vite', ['preview', '--port', String(port), '--strictPort'], {
		stdio: ['ignore', 'pipe', 'pipe']
	});
	try {
		await waitForPreview(server, port);
	} catch (e) {
		server.kill();
		throw e;
	}
	return () => server.kill();
}

/** Phone (360px) collapsibles: open each kind once, so what they reveal is checked too. */
export async function openCollapsibles(page: Page): Promise<void> {
	await page.click('#about .read-more');
	await page.click('#projects .show-more');
	await page.locator('#skills .acc').nth(1).click();
	await page.locator('#experience .rec').first().click();
}
```

In `scripts/audit.ts`:
- Delete `waitForPreview` and the `execSync`/`spawn`/`ChildProcess` import; import `{ openCollapsibles, startPreview } from './preview.ts'`; keep `mkdirSync, readdirSync, rmSync, writeFileSync` from `node:fs`.
- Replace the four `page.click…` lines inside `if (width === 360)` with `await openCollapsibles(page);` (keep the comment line above them).
- Replace `rmSync(OUT, { recursive: true, force: true });` with:
  ```ts
  	// Clear the previous audit, but keep the screenshot baseline of `npm run screens`.
  	mkdirSync(OUT, { recursive: true });
  	for (const entry of readdirSync(OUT))
  		if (!entry.startsWith('screens-')) rmSync(`${OUT}/${entry}`, { recursive: true, force: true });
  ```
- Replace the `execSync('npm run build'…)` + `spawn(…)` + `await waitForPreview(server)` + `server.kill()` sequence with `const stop = await startPreview(PORT);` before the `try`, and `stop();` in its `finally`.

- [ ] **Step 5: Write `scripts/screens.ts` and the npm script**

```ts
/**
 * npm run screens               saves a baseline in reports/screens-baseline/
 * npm run screens -- --compare  captures again into reports/screens-current/, compares each
 *                               capture with the baseline (bytes, then pixels), writes diff
 *                               images to reports/screens-diff/ and exits 1 on any difference.
 * Full pages, reduced motion (no scroll reveal, no video), every image loaded eagerly.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { chromium, type Browser, type Page } from 'playwright';
import { openCollapsibles, startPreview } from './preview.ts';
import { captures, formatResults, type Capture, type Result } from './screens-report.ts';

const PORT = 4181;
const ORIGIN = `http://localhost:${PORT}`;
const BASELINE = 'reports/screens-baseline';
const CURRENT = 'reports/screens-current';
const DIFF = 'reports/screens-diff';

async function shoot(browser: Browser, c: Capture): Promise<Buffer> {
	const context = await browser.newContext({
		viewport: { width: c.width, height: 900 },
		colorScheme: c.theme,
		reducedMotion: 'reduce'
	});
	const page = await context.newPage();
	if (c.noJs) await page.route('**/_app/**/*.js', (route) => route.abort());
	await page.goto(`${ORIGIN}/${c.lang}/`, { waitUntil: 'networkidle' });
	if (c.open) await openCollapsibles(page);
	await settle(page);
	const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
	await context.close();
	return png;
}

/** Loads every lazy image and waits for fonts, so two captures of the same code are equal. */
async function settle(page: Page): Promise<void> {
	await page.evaluate(async () => {
		for (const img of document.images) img.loading = 'eager';
		await Promise.all(
			[...document.images].map((img) =>
				img.complete ? null : new Promise((done) => (img.onload = img.onerror = done))
			)
		);
		await document.fonts.ready;
	});
	await page.waitForLoadState('networkidle');
}

/** Pixel comparison in the browser: changed-pixel count, bounding box and a diff image. */
async function pixelDiff(page: Page, a: Buffer, b: Buffer) {
	return page.evaluate(
		async ([a64, b64]) => {
			const load = (src: string) =>
				new Promise<HTMLImageElement>((done) => {
					const img = new Image();
					img.onload = () => done(img);
					img.src = `data:image/png;base64,${src}`;
				});
			const [ia, ib] = await Promise.all([load(a64), load(b64)]);
			if (ia.width !== ib.width || ia.height !== ib.height)
				return { count: -1, size: `${ia.width}×${ia.height} → ${ib.width}×${ib.height}`, box: '', image: '' };
			const data = (img: HTMLImageElement) => {
				const c = document.createElement('canvas');
				[c.width, c.height] = [img.width, img.height];
				const ctx = c.getContext('2d')!;
				ctx.drawImage(img, 0, 0);
				return { c, ctx, d: ctx.getImageData(0, 0, c.width, c.height) };
			};
			const A = data(ia).d.data;
			const out = data(ib);
			const px = out.d.data;
			let count = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
			for (let i = 0; i < A.length; i += 4) {
				const same = A[i] === px[i] && A[i + 1] === px[i + 1] && A[i + 2] === px[i + 2] && A[i + 3] === px[i + 3];
				if (same) {
					// Dim unchanged pixels so the red changes stand out.
					px[i] = px[i] * 0.3 + 178; px[i + 1] = px[i + 1] * 0.3 + 178; px[i + 2] = px[i + 2] * 0.3 + 178;
					continue;
				}
				count++;
				const p = i / 4, x = p % ia.width, y = Math.floor(p / ia.width);
				[x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
				[px[i], px[i + 1], px[i + 2], px[i + 3]] = [255, 0, 0, 255];
			}
			out.ctx.putImageData(out.d, 0, 0);
			return {
				count,
				size: '',
				box: count ? `${x1 - x0 + 1}×${y1 - y0 + 1} at (${x0}, ${y0})` : '',
				image: count ? out.c.toDataURL('image/png').split(',')[1] : ''
			};
		},
		[a.toString('base64'), b.toString('base64')] as const
	);
}

async function main(): Promise<void> {
	const compare = process.argv.includes('--compare');
	if (compare && !existsSync(BASELINE)) throw new Error(`No baseline: run npm run screens first.`);
	const dir = compare ? CURRENT : BASELINE;
	rmSync(dir, { recursive: true, force: true });
	mkdirSync(dir, { recursive: true });
	if (compare) {
		rmSync(DIFF, { recursive: true, force: true });
		mkdirSync(DIFF, { recursive: true });
	}
	const stop = await startPreview(PORT);
	const browser = await chromium.launch();
	const results: Result[] = [];
	try {
		const diffPage = await browser.newPage();
		for (const c of captures()) {
			const png = await shoot(browser, c);
			writeFileSync(`${dir}/${c.name}.png`, png);
			if (!compare) continue;
			const base = readFileSync(`${BASELINE}/${c.name}.png`);
			if (base.equals(png)) {
				results.push({ name: c.name, same: true, detail: 'identical' });
				continue;
			}
			const d = await pixelDiff(diffPage, base, png);
			if (d.count === 0) results.push({ name: c.name, same: true, detail: 'same pixels' });
			else if (d.count < 0) results.push({ name: c.name, same: false, detail: `page size ${d.size}` });
			else {
				writeFileSync(`${DIFF}/${c.name}.png`, Buffer.from(d.image, 'base64'));
				results.push({ name: c.name, same: false, detail: `${d.count} px in ${d.box}` });
			}
		}
	} finally {
		await browser.close();
		stop();
	}
	if (!compare) return console.log(`\nBaseline: ${captures().length} captures in ${BASELINE}/`);
	console.log(`\n${formatResults(results)}`);
	process.exitCode = results.every((r) => r.same) ? 0 : 1;
}

await main();
```

`package.json` scripts: add `"screens": "node scripts/screens.ts"` after `"audit"`. Run `npm run format` (prettier will reflow the long lines above).

- [ ] **Step 6: Take the baseline twice and prove the capture is deterministic**

Run: `npm run screens && npm run screens -- --compare`
Expected: `all 25 captures identical` (or `same pixels`), exit 0. If any capture differs, find the unsettled thing (it is noise, not a code change) and fix `settle()` before going on. Leave this baseline in place: it is the reference for every later task.

- [ ] **Step 7: Check the audit keeps the baseline**

Run: `npm run audit; ls reports/screens-baseline | wc -l`
Expected: the audit table as before (Lighthouse mobile performance may read 93–94, known), and `25`.

- [ ] **Step 8: Write the watch list `docs/backlog.md`**

Re-check each "verify" line against the code first (a quick grep or a look); copy only the lines still true.

```markdown
# Watch list

Things worth worrying about that are not fixed yet. Each entry: what, why it matters, where it should be handled. Remove an entry when it is done.

## Before or at deployment (M13)

- **Absolute canonical / hreflang / `og:image` URLs.** Link previews and Lighthouse SEO need absolute URLs, which need the domain. One site-origin setting; `DOMAIN_PENDING_AUDITS` in `scripts/audit-report.ts` then goes.
- **32 MB of project videos in git.** Every re-encode adds its full size to the history forever. Decide before deployment: keep in git, Git LFS, or host media outside the repo.
- **`PRIORITY` is empty** (`src/lib/data/projects.ts`): "Relevance" sorts exactly like "Newest". Known; Jocelyn sets it with the final content.
- **`static/cv-en.pdf` is a copy of the French CV** until an English CV (without phone number) is exported. (verify)

## Performance (next milestone)

- **Lighthouse mobile performance 93–94 < 95** (desktop 100). FCP 2.1 s, LCP 2.9 s on simulated slow 4G + 4× CPU; TBT 10 ms, CLS 0. Look at render-blocking CSS and font (preload is in place; inline critical CSS?) and the LCP element. Report: `reports/lighthouse-mobile.html` after `npm run audit`.
- **Each page ships both languages' content in its JS** (page node about 66 KB gzipped, `{ en, fr }` everywhere). Fine at this size; revisit if content grows a lot.
- **simple-icons objects ship whole** (title, slug, svg getter) where only `{ path, hex }` is used: a few KB. (verify)

## Later

- **`light-dark()`** once iOS < 17.5 is negligible: the light palette in `src/app.css` could then be written once (today twice, kept equal by `theme-tokens.spec.ts`).
- **Copy announcement uses one `requestAnimationFrame`** (`Contact.svelte`): a ~100 ms timeout is more reliable for some screen readers. (verify)
- **Narrowing the window with focus on a desktop nav link** drops focus to `<body>` when the links hide at 48rem. (verify)
- **Experience timezone test** only proves UTC handling when run with `TZ` set. (verify)
```

- [ ] **Step 9: Run the checks and commit**

Run: `npm test && npm run check && npm run lint`
Expected: all pass (the new spec included).
```bash
git add scripts package.json docs/backlog.md
git commit -m "chore: screenshot comparison script, shared preview helper, watch list" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bpc1BL8RhHGNJ6NHg9ay54"
```

---

### Task 1: Dead code and tooling

**Files:**
- Modify: `src/lib/experience.ts`, `src/lib/experience.spec.ts`, `package.json`, `scripts/og.ts`
- Create: `.nvmrc`, `scripts/tsconfig.json`
- Delete: `static/projects/so_long/so_long_phone.png`

**Interfaces:**
- Produces: `npm run check` also type-checks `scripts/`; `npm run og` works again.

- [ ] **Step 1: Remove `formatPeriod`**

In `src/lib/experience.ts` delete the `formatPeriod` function and its doc comment ("Jul 2025 – Jan 2026", …). In `src/lib/experience.spec.ts` delete the whole `describe('formatPeriod', …)` block and `formatPeriod` from the import. The `periodPoints` tests stay (they cover the same formatting).

- [ ] **Step 2: Remove the unreferenced image**

Run: `grep -rn "so_long_phone" src docs/content-guide.md; git rm static/projects/so_long/so_long_phone.png`
Expected: grep prints nothing, then the file is removed.

- [ ] **Step 3: Node version**

`.nvmrc`:
```
24
```
`package.json`: add after `"type": "module",`:
```json
	"engines": {
		"node": ">=24"
	},
```

- [ ] **Step 4: Make `og.ts` load data through Vite and import the shared constants**

`npm run og` fails today: `Cannot find package '$lib' imported from src/lib/data/profile.ts` (profile.ts imports `typeset` from `$lib/i18n/typography` at runtime). Replace the top of `scripts/og.ts` (imports, `LANGS`, everything before `const font =`) with:

```ts
/**
 * Generates static/og-en.png, static/og-fr.png (1200×630 share images), static/apple-touch-icon.png
 * (180×180) and static/favicon.ico (32×32) from static/favicon.svg, with the site font and colours.
 * Run with `npm run og` after changing the favicon, the name or the role; commit the outputs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { icoFromPng } from './ico.ts';

// Through Vite, so the data's `$lib/…` imports resolve (plain Node cannot).
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const [{ PROFILE }, { LANGS }] = await Promise.all([
	vite.ssrLoadModule('/src/lib/data/profile.ts') as Promise<typeof import('../src/lib/data/profile.ts')>,
	vite.ssrLoadModule('/src/lib/i18n/lang.ts') as Promise<typeof import('../src/lib/i18n/lang.ts')>
]);
await vite.close();
```

Keep the rest; the hardcoded colours `#FAF8F4`, `#141412`, `#C2391B` stay until Task 2 adds `THEME_BG` (Task 2, Step 7 replaces them). Change `ogHtml(lang: (typeof LANGS)[number])` to `ogHtml(lang: Lang)` with `import type { Lang } from '../src/lib/i18n/lang.ts';`.

- [ ] **Step 5: Regenerate and confirm the images are unchanged**

Run: `npm run og && git status --short static/`
Expected: `Wrote static/og-en.png, …` and no modified file. If PNG bytes changed, open both versions (`git show HEAD:static/og-en.png > /tmp/…`) and check visually; Chromium may re-encode identical pixels differently. If the pixels match, `git checkout static/` and note it in the commit message; if they differ, stop and investigate.

- [ ] **Step 6: Type-check the scripts**

`scripts/tsconfig.json`:
```json
{
	"extends": "../tsconfig.json",
	"compilerOptions": {
		"noEmit": true,
		"allowImportingTsExtensions": true
	},
	"include": ["./**/*.ts"]
}
```
`package.json`: `"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json && tsc -p scripts"`.

Run: `npm run check`
Expected: 0 errors. Errors inside `scripts/` are real type bugs that were never checked: fix them in this task (smallest change, no behaviour change). The `$lib` paths come from the generated `.svelte-kit/tsconfig.json` (relative to that file), so they resolve from `scripts/` too; if they do not, report what fails before inventing a workaround.

- [ ] **Step 7: Verify and commit**

Run: `npm test && npm run lint && npm run build && npm run screens -- --compare`
Expected: all pass, `all 25 captures identical`.
```bash
git add -A
git commit -m "chore: drop dead code and an unused image, pin Node 24, type-check scripts, fix npm run og" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bpc1BL8RhHGNJ6NHg9ay54"
```

---

### Task 2: Colours and layout tokens

**Files:**
- Create: `src/lib/color.ts`, `src/lib/color.spec.ts`, `src/lib/theme-tokens.spec.ts`
- Modify: `src/lib/theme.ts`, `src/lib/skills.ts`, `src/app.css`, `src/routes/[lang=lang]/+page.svelte`, `src/lib/components/contact/ContactIcon.svelte`, `src/lib/components/sections/Skills.svelte`, `src/lib/components/Nav.svelte`, `src/lib/components/Footer.svelte`, `src/lib/components/Section.svelte`, `src/lib/components/sections/Hero.svelte`, `src/lib/components/projects/ProjectCardLarge.svelte`, `scripts/og.ts`

**Interfaces:**
- Produces: `THEME_BG` from `$lib/theme`; `contrastRatio(a, b): number`, `logoColor(hex, bg): string`, `MIN_LOGO_CONTRAST` from `$lib/color`; global `.logo` class (colour from inline `--logo-dark` / `--logo-light`); CSS tokens `--page-max`, `--gutter`, `--photo-veil`, `--photo-tag`, `--photo-rule`, `--on-photo`, `--on-photo-soft`, `--on-photo-body`, `--on-photo-muted`, `--on-photo-domain`, `--on-photo-award`.

- [ ] **Step 1: Write the failing colour tests**

`src/lib/color.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { contrastRatio, logoColor } from './color';
import { THEME_BG } from './theme';

describe('contrastRatio', () => {
	it('is 21 for black on white and 1 for a colour on itself, in any order, # optional', () => {
		expect(contrastRatio('000000', '#ffffff')).toBeCloseTo(21, 5);
		expect(contrastRatio('3776AB', '3776AB')).toBeCloseTo(1, 5);
		expect(contrastRatio('#0d1117', 'F7DF1E')).toBeCloseTo(contrastRatio('F7DF1E', '#0d1117'), 5);
	});
});

describe('logoColor', () => {
	it('keeps a brand colour that stands out, else falls back to the text colour', () => {
		expect(logoColor('F7DF1E', THEME_BG.dark)).toBe('#F7DF1E'); // JavaScript yellow on dark
		expect(logoColor('000000', THEME_BG.dark)).toBe('var(--text)'); // Rust black on dark
		expect(logoColor('F7DF1E', THEME_BG.light)).toBe('var(--text)'); // yellow on light
	});
});
```

`src/lib/theme-tokens.spec.ts`:
```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DOMAIN_IDS, DOMAINS } from './data/categories';
import { contrastRatio } from './color';
import { THEME_BG } from './theme';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const css = read('../app.css');
const cardCss = read('./components/projects/ProjectCardLarge.svelte');

/** Custom properties of the first block opened by `selector`. */
function tokens(selector: string): Record<string, string> {
	const start = css.indexOf(selector);
	if (start < 0) throw new Error(`no block ${selector} in app.css`);
	const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
	return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}
const dark = tokens(':root {');
const light = tokens(":root[data-theme='light'] {");
const noJsLight = tokens(':root:not([data-theme]) {');

/** CSS color-mix(in srgb, a w, b) for #rrggbb colours; `w` from 0 to 1. */
function mix(a: string, w: number, b: string): string {
	const ch = (h: string, i: number) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
	return '#' + [0, 1, 2].map((i) => Math.round(ch(a, i) * w + ch(b, i) * (1 - w)).toString(16).padStart(2, '0')).join('');
}
const pct = (v: string) => parseFloat(v) / 100;

describe('theme tokens (src/app.css)', () => {
	it('uses the same light palette with and without JS', () => {
		expect(noJsLight).toEqual(light);
	});
	it('has THEME_BG (the browser bar colour) equal to --bg', () => {
		expect(dark['--bg'].toLowerCase()).toBe(THEME_BG.dark);
		expect(light['--bg'].toLowerCase()).toBe(THEME_BG.light);
	});
});

describe('domain colours', () => {
	it.each(DOMAIN_IDS)('%s: phone tile text reads at 4.5:1 in both themes', (d) => {
		const c = DOMAINS[d].color;
		for (const [theme, t] of [['dark', dark], ['light', light]] as const) {
			const bg = mix(c, pct(t['--tile-pct']), t['--tile-base']);
			const label = mix(c, pct(t['--tile-fg']), '#ffffff');
			expect(contrastRatio(label, bg), `${theme} label`).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(t['--body'], bg), `${theme} body`).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(t['--muted'], bg), `${theme} muted`).toBeGreaterThanOrEqual(4.5);
		}
	});

	it.each(DOMAIN_IDS)('%s: phone featured card without photo reads at 4.5:1', (d) => {
		const veil = parseFloat(cardCss.match(/--veil:\s*([\d.]+);/)![1]);
		const ground = mix(dark['--photo-veil'], veil, DOMAINS[d].color);
		for (const t of ['--on-photo', '--on-photo-body', '--on-photo-muted', '--on-photo-domain', '--on-photo-award'])
			expect(contrastRatio(dark[t], ground), t).toBeGreaterThanOrEqual(4.5);
		const tagAlpha = parseFloat(dark['--photo-tag'].match(/\/\s*([\d.]+)\)/)![1]);
		const tagGround = mix('#ffffff', tagAlpha, ground);
		expect(contrastRatio(dark['--on-photo-soft'], tagGround), 'tag').toBeGreaterThanOrEqual(4.5);
	});
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/lib/color.spec.ts src/lib/theme-tokens.spec.ts`
Expected: FAIL, `./color` not found and `THEME_BG` not exported from `./theme`.

- [ ] **Step 3: Move the colour helpers**

`src/lib/color.ts`:
```ts
/** Below this contrast with the page background, a brand colour is replaced by the text colour. */
export const MIN_LOGO_CONTRAST = 2.2;

function luminance(hex: string): number {
	const h = hex.replace('#', '');
	const [r, g, b] = [0, 2, 4].map((i) => {
		const c = parseInt(h.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours (with or without `#`), from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

/** CSS colour for a logo on `bg`: its brand colour, or the theme text colour if it would vanish. */
export function logoColor(hex: string, bg: string): string {
	return contrastRatio(hex, bg) >= MIN_LOGO_CONTRAST ? `#${hex}` : 'var(--text)';
}
```
Delete `THEME_BG`, `MIN_LOGO_CONTRAST`, `luminance`, `contrastRatio`, `logoColor` from `src/lib/skills.ts`. Add to `src/lib/theme.ts`:
```ts
/** Page background per theme (the browser bar colour). Equal to `--bg` in src/app.css (theme-tokens.spec.ts). */
export const THEME_BG = { dark: '#121210', light: '#faf8f4' } as const;
```
Update imports: `+page.svelte` → `import { THEME_BG } from '$lib/theme';`; `ContactIcon.svelte` → `import { logoColor } from '$lib/color'; import { THEME_BG } from '$lib/theme';`; `Skills.svelte` → `import { nextTab, panelHidden, skillName } from '$lib/skills'; import { logoColor } from '$lib/color'; import { THEME_BG } from '$lib/theme';`.

- [ ] **Step 4: Add the tokens to `src/app.css`**

In the first `:root {` block, after `--font: …;`:
```css
	/* Page column: content width and side padding (1.25rem on phones). */
	--page-max: 77.5rem;
	--gutter: 2.5rem;
	/* Phone photo cards (ProjectCardLarge): light text over a dark veil, in both themes. */
	--photo-veil: #10100e;
	--photo-tag: rgb(255 255 255 / 0.16);
	--photo-rule: rgb(255 255 255 / 0.2);
	--on-photo: #ffffff;
	--on-photo-soft: #f3f0e8;
	--on-photo-body: #ece8df;
	--on-photo-muted: #d6d1c6;
	--on-photo-domain: #ffa58c;
	--on-photo-award: #ffb59f;
```
In the phone block `@media (width < 48rem) { :root { --nav-h: 3.75rem; } … }` add `--gutter: 1.25rem;` next to `--nav-h`.

After the `.btn-primary:hover` rule add the shared logo rule:
```css
/* Brand logos (skills, contact): colour per theme, computed by logoColor into the inline
   --logo-dark / --logo-light. Same theme selectors as the palette above. */
.logo {
	color: var(--logo-dark);
}
:root[data-theme='light'] .logo {
	color: var(--logo-light);
}
@media (prefers-color-scheme: light) {
	:root:not([data-theme]) .logo {
		color: var(--logo-light);
	}
}
```

- [ ] **Step 5: Use `.logo` in ContactIcon and Skills**

`ContactIcon.svelte`: `class="brand"` → `class="brand logo"`; in `<style>` delete the comment and the three rules that set `color` on `.brand` (`.brand {…}`, `:global(:root[data-theme='light']) .brand {…}`, the `@media (prefers-color-scheme: light)` block).

`Skills.svelte`: on the logo `<svg viewBox="0 0 24 24" width="30" …>` add `class="logo"`. In `<style>`: `.tiles svg { flex-shrink: 0; color: var(--logo-dark); }` → `.tiles svg { flex-shrink: 0; }`; delete the comment above it, the `:global(:root[data-theme='light']) .tiles svg` rule and its `@media (prefers-color-scheme: light)` block.

Specificity check: `Contact.svelte`'s `.tile:hover :global(svg) { color: var(--on-text) !important; }` still wins (`!important`).

- [ ] **Step 6: Use the layout and photo tokens**

- `Footer.svelte`: `.inner` `max-width: 77.5rem;` → `max-width: var(--page-max);`, `padding: 0 2.5rem;` → `padding: 0 var(--gutter);`; phone `.inner` `padding: 0.5rem 1.25rem;` → `padding: 0.5rem var(--gutter);`.
- `Section.svelte`: `section` → `max-width: var(--page-max); padding: 0 var(--gutter);`; delete the phone `section { padding: 0 1.25rem; }` rule (the token changes instead).
- `Hero.svelte`: `.hero` → `max-width: var(--page-max); padding: calc(var(--nav-h) + 4rem) var(--gutter) 6rem;`; phone `padding: calc(var(--nav-h) + 1.75rem) 1.25rem 2.5rem;` → `padding: calc(var(--nav-h) + 1.75rem) var(--gutter) 2.5rem;`.
- `Nav.svelte`: `padding: 0 max(2.5rem, calc((100% - 77.5rem) / 2 + 2.5rem));` → `padding: 0 max(var(--gutter), calc((100% - var(--page-max)) / 2 + var(--gutter)));`; phone `padding: 0 1.25rem;` → `padding: 0 var(--gutter);`.
- `ProjectCardLarge.svelte`, phone block only, value by value:
  `color: #f3f0e8;` (`.card`) → `var(--on-photo-soft)`; `background: #10100e;` (`.card::before`) → `var(--photo-veil)`; `.wm` `color: #ffffff;` → `var(--on-photo)`; `.body` `--text: #ffffff;` → `--text: var(--on-photo);`, `--muted: #d6d1c6;` → `--muted: var(--on-photo-muted);`; `.meta` `color: #d6d1c6;` → `var(--on-photo-muted)`; `.dom` `color: #ffa58c;` → `var(--on-photo-domain)`; `h3` `color: #ffffff;` → `var(--on-photo)`; `.award` `color: #ffb59f;` → `var(--on-photo-award)`; `.summary` `color: #ece8df;` → `var(--on-photo-body)`; `.footer` `border-top: 1px solid rgb(255 255 255 / 0.2);` → `border-top: 1px solid var(--photo-rule);`; `.footer :global(li)` → `background: var(--photo-tag); color: var(--on-photo-soft);`; `.footer :global(a)` `color: #ffffff;` → `var(--on-photo)`; `.footer :global(.private)` `color: #d6d1c6;` → `var(--on-photo-muted)`.

Run: `grep -n "#[0-9a-fA-F]\{6\}\|rgb(" src/lib/components/projects/ProjectCardLarge.svelte`
Expected: nothing in the phone block (the desktop gradient lives in ProjectMedia).

- [ ] **Step 7: `og.ts` uses the theme colours**

In the `Promise.all` of `scripts/og.ts` add `vite.ssrLoadModule('/src/lib/theme.ts') as Promise<typeof import('../src/lib/theme.ts')>` and destructure `{ THEME_BG }`. In `ogHtml`: `background:#FAF8F4` → `background:${THEME_BG.light}`. The text `#141412` and accent `#C2391B` are `--text` / `--accent` of the light block, not exported to TS: keep them, with a comment `/* light --text and --accent of src/app.css */`. Run `npm run og && git status --short static/` → no change (same handling as Task 1, Step 5).

- [ ] **Step 8: Verify and commit**

Run: `npm test && npm run check && npm run lint && npm run build && npm run screens -- --compare`
Expected: all pass; `all 25 captures identical`.
```bash
git add -A
git commit -m "refactor: colour helpers in color.ts, THEME_BG in theme.ts, layout and photo-card tokens, one logo colour rule; restore palette and contrast tests" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bpc1BL8RhHGNJ6NHg9ay54"
```

---

### Task 3: Icons

**Files:**
- Modify: `src/lib/data/icons.ts`, `src/lib/components/Icon.svelte` (unchanged API), `src/lib/components/projects/ProjectCardLarge.svelte`, `ProjectCardSmall.svelte`, `ResultChips.svelte`, `src/lib/components/sections/Experience.svelte`, `Hero.svelte`, `Contact.svelte`, `Skills.svelte`, `src/lib/components/experience/JobItem.svelte`, `src/lib/components/contact/ContactIcon.svelte`
- Delete: `src/lib/components/icons/BriefcaseIcon.svelte`, `MedalIcon.svelte`, `TrophyIcon.svelte`

**Interfaces:**
- Consumes: `Icon.svelte` props `{ path: string; size?: number; stroke?: number }` (decorative, `aria-hidden`).
- Produces: `ICONS.briefcase`, `.medal`, `.trophy`, `.chevronDown`, `.chevronUp`, `.arrowDown`, `.document`, `.mail`, `.copy`.

Rule: where a parent's scoped CSS selects the `<svg>`, either change the selector to `:global(svg)` (when it moves into `<Icon>`) or keep the component's own `<svg>` and take only the `d` from `ICONS` (ContactIcon's `.line`).

- [ ] **Step 1: Add the icons**

Append to `ICONS` in `src/lib/data/icons.ts` (shapes copied from today's inline SVGs; `rect` / `circle` converted to path data):
```ts
	/** Briefcase (company of a professional project). */
	briefcase:
		'M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18',
	/** Medal on a ribbon (hackathon podium). */
	medal: 'M6 9a6 6 0 1 0 12 0a6 6 0 1 0-12 0zM8.5 14 7 22l5-3 5 3-1.5-8',
	/** Trophy cup (hackathon win). */
	trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3',
	/** Chevrons of the phone disclosures (closed, open). */
	chevronDown: 'M6 9l6 6 6-6',
	chevronUp: 'M6 15l6-6 6 6',
	/** Arrow pointing down ("See projects"). */
	arrowDown: 'M12 5v14M5 12l7 7 7-7',
	/** Page with a folded corner and two lines (CV). */
	document: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6',
	/** Envelope (e-mail). */
	mail: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3.5 6.5l8.5 6.5 8.5-6.5',
	/** Two overlapping sheets (copy). */
	copy: 'M11 9h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM5 15V3h12'
```
The existing `icons.spec.ts` checks every entry is well-formed path data; no new test.

- [ ] **Step 2: Replace the three icon components**

- `ProjectCardLarge.svelte`: drop the `BriefcaseIcon` import, add `import { ICONS } from '$lib/data/icons';`; `<BriefcaseIcon />` → `<Icon path={ICONS.briefcase} size={18} stroke={2} />`.
- `ResultChips.svelte`: imports → `import Icon from '../Icon.svelte'; import { ICONS } from '$lib/data/icons';`; `{#if chip.medal === 1}<TrophyIcon size={14} />{:else}<MedalIcon size={14} />{/if}` → `<Icon path={chip.medal === 1 ? ICONS.trophy : ICONS.medal} size={14} stroke={2} />`.
- `Experience.svelte`: same imports; `{#if h.medal === 1}<TrophyIcon size={20} />{:else}<MedalIcon />{/if}` → `<Icon path={h.medal === 1 ? ICONS.trophy : ICONS.medal} size={20} stroke={2} />` (MedalIcon's default size was 20).
- `git rm -r src/lib/components/icons`.

- [ ] **Step 3: Approved exception 1, the small card's company line**

`ProjectCardSmall.svelte`: add `import { ICONS } from '$lib/data/icons';`; `<p class="award"><span aria-hidden="true">💼</span> {project.company}</p>` → `<p class="award"><Icon path={ICONS.briefcase} size={16} stroke={2} />{project.company}</p>`; in `<style>` add:
```css
	.award {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
	}
```
(placed after the shared `.meta, .award` rule; the phone block hides `.award` as before).

- [ ] **Step 4: Inline SVGs → `<Icon>`**

- `Hero.svelte`: add `import Icon from '../Icon.svelte'; import { ICONS } from '$lib/data/icons';` and `import ContactIcon from '../contact/ContactIcon.svelte';`, drop `CONTACT_BRANDS` and `const malt = CONTACT_BRANDS.malt;`.
  - "See projects" `<svg …><path d="M12 5v14M5 12l7 7 7-7" …/></svg>` → `<Icon path={ICONS.arrowDown} size={16} stroke={2.2} />`.
  - "View CV" `<svg …><path d="M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h6" …/></svg>` → `<Icon path={ICONS.document} size={16} stroke={2.2} />` (**approved exception 2**: rounded shape).
  - Malt `<svg viewBox={malt.viewBox} width="18" height="18" fill="#{malt.hex}" aria-hidden="true"><path d={malt.path} /></svg>` → `<ContactIcon id="malt" size={18} />`.
  - Style: the phone rule list `… .long, .cv svg { display: none; }` → `.cv :global(svg)` in place of `.cv svg`.
- `Contact.svelte`: copy button `<svg …><g …><rect …/><path d="M5 15V3h12" /></g></svg>` → `<Icon path={ICONS.copy} size={16} stroke={2} />` (+ the two imports).
- `JobItem.svelte`: `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d={open ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} … /></svg>` → `<Icon path={open ? ICONS.chevronUp : ICONS.chevronDown} size={16} stroke={2.2} />` (+ imports).
- `Skills.svelte`: `<svg class="chev" …><path d={open === i ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} … /></svg>` → `<Icon path={open === i ? ICONS.chevronUp : ICONS.chevronDown} size={18} stroke={2.2} />` (+ `import { ICONS } from '$lib/data/icons';`); style `.chev { flex: none; }` → `.acc > :global(svg) { flex: none; }`.
- `ContactIcon.svelte` (keeps its own svg for the scoped `.line` colour): replace the `{#if id === 'email'}…{:else}…{/if}` children with `<path d={id === 'email' ? ICONS.mail : ICONS.document} />` and add `import { ICONS } from '$lib/data/icons';`.

- [ ] **Step 5: Verify, including the expected differences**

Run: `npm test && npm run check && npm run lint && npm run build && npm run screens -- --compare`
Expected: tests pass; screens differ **only** where the exceptions show:
- the Hero "View CV" icon at 768, 1280 and 1440px (it is hidden on phones: if a 360/390 capture differs in the Hero, the `.cv :global(svg)` rule is missing);
- small project cards with a company (Goldeneye) at 768+px, if Goldeneye is on a small card.
Open each diff image in `reports/screens-diff/` and check the red area sits on one of these icons. Any other difference (for example sub-pixel changes from the `rect`/`circle` → path conversion of the medal, mail or copy icons) stops the task: report it with the diff image rather than accepting it.

- [ ] **Step 6: Re-baseline after the approved exceptions, then commit**

Once the differences are confirmed as exactly the exceptions: `npm run screens` (new baseline), then `npm run screens -- --compare` → identical.
```bash
git add -A
git commit -m "refactor: every line icon in ICONS, drawn by Icon; delete the three one-off icon components" -m "Visible, approved: briefcase icon instead of the emoji on small cards; one rounded CV icon.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bpc1BL8RhHGNJ6NHg9ay54"
```

---

### Task 4: i18n helpers and dictionary shapes

**Files:**
- Modify: `src/lib/i18n/lang.ts`, `lang.spec.ts`, `format.ts`, `format.spec.ts`, `en.ts`, `fr.ts`, `src/lib/glance.ts`, `glance.spec.ts`, `src/lib/experience.ts`, `experience.spec.ts`, `src/lib/skills.ts`, `src/lib/data/skills.spec.ts`, `src/lib/data/experience.spec.ts`, `src/lib/data/profile.spec.ts`, `src/lib/components/sections/Hero.svelte`, `Projects.svelte`, `Skills.svelte`, `Experience.svelte`, `src/lib/components/experience/JobItem.svelte`

**Interfaces:**
- Produces: `localize(value: string | Localized, lang: Lang): string` from `$lib/i18n/lang`; `type Plural = { one: string; other: string }` and `plural(n: number, forms: Plural, lang: Lang): string` from `$lib/i18n/format`; `Dict['hero']['glanceText']: { tally: string; wins: Plural; podiums: Plural }`; `Dict['projects']['showMore']: Plural`. `GlanceText` stays exported from `$lib/glance` as `Dict['hero']['glanceText']`'s shape.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/i18n/lang.spec.ts` (import `localize` too):
```ts
describe('localize', () => {
	it('keeps a plain string and picks the language of a { en, fr } text', () => {
		expect(localize('Rust', 'fr')).toBe('Rust');
		expect(localize({ en: 'Networks', fr: 'Réseaux' }, 'fr')).toBe('Réseaux');
	});
});
```
Append to `src/lib/i18n/format.spec.ts` (imports: `plural` from `./format`, `en` from `./en`, `fr` from `./fr`):
```ts
describe('plural', () => {
	const f = { one: '{n} x', other: '{n} xs' };
	it('uses the language plural rules (French: 0 and 1 are singular)', () => {
		expect(plural(1, f, 'en')).toBe('1 x');
		expect(plural(0, f, 'en')).toBe('0 xs');
		expect(plural(0, f, 'fr')).toBe('0 x');
		expect(plural(2, f, 'fr')).toBe('2 xs');
	});
	it('reads the real "other projects" button in both languages', () => {
		expect(plural(1, fr.projects.showMore, 'fr')).toBe('Voir 1 autre projet');
		expect(plural(5, en.projects.showMore, 'en')).toBe('See the 5 other projects');
	});
});
```
Delete the `describe('plural', …)` block from `src/lib/glance.spec.ts` and the `describe('durationLabel', …)` block from `src/lib/experience.spec.ts` (with their imports).

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/lib/i18n`
Expected: FAIL, `localize` / `plural` not exported, `showMore` is a string.

- [ ] **Step 3: Implement**

`src/lib/i18n/lang.ts`, after `type Localized`:
```ts
/** A plain string (proper nouns) as is, or the `lang` text of a `{ en, fr }` pair. */
export function localize(value: string | Localized, lang: Lang): string {
	return typeof value === 'string' ? value : value[lang];
}
```
`src/lib/i18n/format.ts`:
```ts
import type { Lang } from './lang';

/** Singular and plural dictionary templates, each with an `{n}` placeholder. */
export type Plural = { one: string; other: string };

/** Fills `{name}` placeholders of a dictionary template; unknown names stay as written. */
export function fill(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in values ? String(values[name]) : match
	);
}

/** `{n}` filled into the form the language's plural rules pick (French: 0 and 1 are singular). */
export function plural(n: number, forms: Plural, lang: Lang): string {
	return fill(new Intl.PluralRules(lang).select(n) === 'one' ? forms.one : forms.other, { n });
}
```
`src/lib/glance.ts`: delete `Plural` and `plural`; `import { fill, plural, type Plural } from '$lib/i18n/format';`; keep `export type GlanceText = { tally: string; wins: Plural; podiums: Plural };`.
`src/lib/experience.ts`: delete `localize` and `durationLabel` (and the now unused `fill` import if nothing else uses it).
`src/lib/skills.ts`: delete `skillName` (and the `Lang` import if unused).

Dictionaries, `en.ts` `hero`: replace the three `glance*` template lines and their comment with
```ts
		/** "At a glance" hackathon tally, counted from the data. */
		glanceText: {
			tally: '{wins}, {podiums}',
			wins: { one: '{n} win', other: '{n} wins' },
			podiums: { one: '{n} podium', other: '{n} podiums' }
		}
```
`fr.ts` `hero`: `glanceText: { tally: '{wins}, {podiums}', wins: { one: '{n} victoire', other: '{n} victoires' }, podiums: { one: '{n} podium', other: '{n} podiums' } }`.
`en.ts` `projects`: `showMore` + `showMoreOne` → `showMore: { one: 'See {n} other project', other: 'See the {n} other projects' },`; `fr.ts`: `showMore: { one: 'Voir {n} autre projet', other: 'Voir les {n} autres projets' },`.

Callers:
- `Hero.svelte`: `glanceRows(PROFILE.glance, { jobs: JOBS, hackathons: HACKATHONS }, lang, t.glanceText)`.
- `profile.spec.ts`: same call with `dicts[lang].hero.glanceText` (drop the `h` object).
- `Projects.svelte`: `import { fill } …` → `import { plural } from '$lib/i18n/format';`; the button text → `{showAll ? t.showFewer : plural(hidden, t.showMore, lang)}`.
- `JobItem.svelte`: `import { plural } from '$lib/i18n/format';`, import `durationMonths, periodPoints, type Job` only; `months` → `job.end ? plural(durationMonths(job.start, job.end), t.months, lang) : ''`.
- `Experience.svelte`: `localize` from `$lib/i18n/lang` (keep `fill` for the hackathons title).
- `Skills.svelte`: `import { localize } from '$lib/i18n/lang';`; `skillName(skill, 'en')` → `localize(skill.name, 'en')`, `skillName(skill, lang)` → `localize(skill.name, lang)`.
- `src/lib/data/skills.spec.ts`: `import { localize } from '$lib/i18n/lang';`, every `skillName(s, x)` → `localize(s.name, x)`.
- `src/lib/data/experience.spec.ts`: `localize` from `$lib/i18n/lang`, `MEDALS` stays from `$lib/experience`.

Run: `grep -rn "skillName\|durationLabel\|showMoreOne\|glanceTally\|glanceWins\|glancePodiums" src docs/content-guide.md`
Expected: nothing.

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run check && npm run lint && npm run build && npm run screens -- --compare`
Expected: all pass; `all 25 captures identical` (the 360px open captures show "Réduire la liste" / "Show fewer", the closed ones the "See N other projects" text: same text as before).
```bash
git add -A
git commit -m "refactor: one localize and one plural helper in i18n; glance and show-more texts as dictionary shapes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bpc1BL8RhHGNJ6NHg9ay54"
```

---

### Task 5: Breakpoints

**Files:**
- Create: `src/lib/breakpoints.ts`, `src/lib/breakpoints.spec.ts`
- Modify: `src/lib/projects.ts`, `src/lib/components/projects/ProjectMedia.svelte`, `src/lib/components/sections/Skills.svelte`

**Interfaces:**
- Produces: `DESKTOP_QUERY`, `PHONE_QUERY`, `BREAKPOINTS_REM` from `$lib/breakpoints`.

- [ ] **Step 1: Write the failing test**

`src/lib/breakpoints.spec.ts`:
```ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BREAKPOINTS_REM, DESKTOP_QUERY } from './breakpoints';

const SRC = fileURLToPath(new URL('..', import.meta.url));
const styleFiles = (readdirSync(SRC, { recursive: true }) as string[])
	.filter((f) => f.endsWith('.svelte') || f.endsWith('.css'))
	.map((f) => join(SRC, f));

describe('breakpoints', () => {
	it('uses the desktop breakpoint in DESKTOP_QUERY', () => {
		expect(DESKTOP_QUERY).toBe(`(min-width: ${BREAKPOINTS_REM.desktop}rem)`);
	});

	it('only uses known widths in @media rules (CSS and JS agree)', () => {
		const known = new Set(Object.values(BREAKPOINTS_REM).map(String));
		const unknown = styleFiles.flatMap((file) =>
			[...readFileSync(file, 'utf8').matchAll(/@media[^{]*/g)].flatMap((m) =>
				[...m[0].matchAll(/width\s*(?:[<>]=?|:)\s*([\d.]+)(\w+)/g)]
					.filter(([, n, unit]) => unit !== 'rem' || !known.has(n))
					.map(([w]) => `${file.slice(SRC.length)}: ${w}`)
			)
		);
		expect(unknown).toEqual([]);
	});
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/lib/breakpoints.spec.ts`
Expected: FAIL, `./breakpoints` not found.

- [ ] **Step 3: Implement and move the queries**

`src/lib/breakpoints.ts`:
```ts
/**
 * Every width a `@media` rule may use, in rem (breakpoints.spec.ts rejects any other). CSS
 * writes them as `(width < 48rem)`; JS uses the queries below.
 */
export const BREAKPOINTS_REM = {
	/** Phone below, desktop at and above: cards, nav, every phone layout. */
	desktop: 48,
	/** Skills tabs beside the panel at and above, above it below. */
	skillsTabs: 60,
	/** Narrow phones (360px): tighter header and selects. */
	narrow: 24.375
} as const;

/** At and above this width cards keep media on top and videos may play; below it is "phone". */
export const DESKTOP_QUERY = `(min-width: ${BREAKPOINTS_REM.desktop}rem)`;

/** Phone screens, for `<source media>`: exactly the screens DESKTOP_QUERY doesn't match. */
export const PHONE_QUERY = `not all and ${DESKTOP_QUERY}`;
```
Delete `DESKTOP_QUERY`, `PHONE_QUERY` and their comments from `src/lib/projects.ts`. `ProjectMedia.svelte`: import them from `$lib/breakpoints` (keep `mainDomain, primaryLink, shouldPlayVideo, type Project` from `$lib/projects`). `Skills.svelte`: `import { DESKTOP_QUERY } from '$lib/breakpoints';`.

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run check && npm run lint && npm run build && npm run screens -- --compare`
Expected: all pass (the spec finds no unknown width: today's widths are 48, 60, 24.375rem); identical captures.
```bash
git add -A
git commit -m "refactor: breakpoints module, and a test that CSS media widths match it" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bpc1BL8RhHGNJ6NHg9ay54"
```

---

### Task 6: Logic out of components

**Files:**
- Create: `src/lib/hydrated.svelte.ts`
- Modify: `src/lib/projects.ts`, `src/lib/projects.spec.ts`, `src/lib/skills.spec.ts`, `src/lib/sections.spec.ts`, `src/lib/components/sections/Projects.svelte`, `About.svelte`, `Skills.svelte`, `src/lib/components/experience/JobItem.svelte`

**Interfaces:**
- Produces: `projectLayout(sorted: readonly Project[], counts?: LayoutCounts): ProjectLayout` and the types below from `$lib/projects`; `hydrated(): { readonly current: boolean }` from `$lib/hydrated.svelte`. Removes `splitTiers`, `hiddenCount`.

- [ ] **Step 1: Write the failing tests**

In `src/lib/projects.spec.ts` add `projectLayout` to the imports (the file already has a `make({ id })` project factory and an `ids()` helper; use them) and append:
```ts
describe('projectLayout', () => {
	const counts = { large: 6, phoneLarge: 5, phoneOthers: 6 };
	const n = (len: number) => Array.from({ length: len }, (_, i) => make({ id: `p${i}` }));
	const layoutIds = (len: number) => {
		const l = projectLayout(n(len), counts);
		return {
			large: l.large.map((c) => c.project.id + (c.desktopOnly ? '*' : '')),
			small: l.small.map((c) => c.project.id + (c.phoneOnly ? '^' : '') + (c.foldable ? '~' : '')),
			folded: l.folded,
			smallOnDesktop: l.smallOnDesktop
		};
	};

	it('is empty for no project', () => {
		expect(layoutIds(0)).toEqual({ large: [], small: [], folded: 0, smallOnDesktop: false });
	});
	it('gives big cards to everything when there are 5 or fewer', () => {
		expect(layoutIds(3)).toEqual({ large: ['p0', 'p1', 'p2'], small: [], folded: 0, smallOnDesktop: false });
	});
	it('with exactly 6, the 6th is a big card on desktop and the only (phone-only) tile on phones', () => {
		expect(layoutIds(6)).toEqual({
			large: ['p0', 'p1', 'p2', 'p3', 'p4', 'p5*'],
			small: ['p5^'],
			folded: 0,
			smallOnDesktop: false
		});
	});
	it('folds the phone tiles past 6 behind the button', () => {
		const l = layoutIds(13);
		expect(l.large.at(-1)).toBe('p5*');
		expect(l.small).toEqual(['p5^', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11~', 'p12~']);
		expect(l.folded).toBe(2);
		expect(l.smallOnDesktop).toBe(true);
	});
});
```
In `src/lib/skills.spec.ts`, inside `describe('panelHidden', …)` after the existing case:
```ts
	it('shows only the selected tab on desktop, whatever the accordion state', () => {
		expect(panelHidden(base, 2)).toBe(false);
		expect(panelHidden(base, 0)).toBe(true);
		expect(panelHidden({ ...base, open: -1 }, 2)).toBe(false);
	});
	it('shows only the open group on phones, none when all are closed', () => {
		const phone = { ...base, desktop: false };
		expect(panelHidden(phone, 0)).toBe(false);
		expect(panelHidden(phone, 2)).toBe(true);
		for (const i of [0, 1, 2]) expect(panelHidden({ ...phone, open: -1 }, i)).toBe(true);
	});
```
In `src/lib/sections.spec.ts` add `isAtBottom, sectionInView` to the import and append:
```ts
// Viewport-relative tops of each section, as getBoundingClientRect().top reports them.
const tops = (about: number) => ({
	about,
	projects: about + 800,
	skills: about + 3000,
	experience: about + 3600,
	contact: about + 4200
});

describe('sectionInView', () => {
	it('is null on the hero, before About reaches the nav', () => {
		expect(sectionInView(tops(300), 56)).toBeNull();
	});
	it('is the last section whose top reached the nav, sub-pixel offsets included', () => {
		expect(sectionInView(tops(56.5), 56)).toBe('about');
		expect(sectionInView(tops(-1000), 56)).toBe('projects');
	});
	it('is the last section at the bottom of the page, where a short Contact never reaches the nav', () => {
		expect(sectionInView(tops(-3700), 56, true)).toBe('contact');
		expect(sectionInView(tops(-3700), 56, false)).toBe('experience');
	});
});

describe('isAtBottom', () => {
	it('is true at the end of the page, within rounding, false higher up', () => {
		expect(isAtBottom(4100, 900, 5000)).toBe(true);
		expect(isAtBottom(4098.5, 900, 5000)).toBe(true);
		expect(isAtBottom(3900, 900, 5000)).toBe(false);
	});
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/lib/projects.spec.ts src/lib/skills.spec.ts src/lib/sections.spec.ts`
Expected: `projectLayout` FAILs (not exported); the restored `panelHidden`, `sectionInView`, `isAtBottom` cases PASS already (they pin existing behaviour).

- [ ] **Step 3: Implement `projectLayout`**

In `src/lib/projects.ts`, delete `hiddenCount` and `splitTiers`, keep `LARGE_COUNT`, `PHONE_LARGE_COUNT`, `PHONE_OTHERS`, and add:
```ts
export type LayoutCounts = { large: number; phoneLarge: number; phoneOthers: number };

/** The projects grid for both screens: the page renders both and CSS shows one. */
export type ProjectLayout = {
	/** Big cards; `desktopOnly` past the phone's count (a small tile there instead). */
	large: { project: Project; desktopOnly: boolean }[];
	/** Small tiles; `phoneOnly` = a big card on desktop; `foldable` = behind the phone's button. */
	small: { project: Project; phoneOnly: boolean; foldable: boolean }[];
	/** How many tiles the phone folds behind "See N other projects". */
	folded: number;
	/** Whether desktop has small tiles at all (else the "More projects" heading is phone-only). */
	smallOnDesktop: boolean;
};

/**
 * Desktop gives big cards to the first `large`, phones to the first `phoneLarge` (fewer); the
 * projects in between are big on desktop and lead the small tiles on phones, which show
 * `phoneOthers` tiles before the button. Assumes `phoneLarge <= large`.
 */
export function projectLayout(
	sorted: readonly Project[],
	counts: LayoutCounts = { large: LARGE_COUNT, phoneLarge: PHONE_LARGE_COUNT, phoneOthers: PHONE_OTHERS }
): ProjectLayout {
	const between = Math.min(counts.large, sorted.length) - Math.min(counts.phoneLarge, sorted.length);
	const tiles = sorted.slice(counts.phoneLarge);
	return {
		large: sorted.slice(0, counts.large).map((project, i) => ({ project, desktopOnly: i >= counts.phoneLarge })),
		small: tiles.map((project, i) => ({ project, phoneOnly: i < between, foldable: i >= counts.phoneOthers })),
		folded: Math.max(0, tiles.length - counts.phoneOthers),
		smallOnDesktop: sorted.length > counts.large
	};
}
```
Delete the `splitTiers` / `hiddenCount` imports from `projects.spec.ts` if any remain.

- [ ] **Step 4: Implement `hydrated()`**

`src/lib/hydrated.svelte.ts`:
```ts
import { onMount } from 'svelte';

/**
 * False in the prerendered HTML and until the component mounts, then true: lets a component
 * show everything without JS and add its toggles once hydrated. Call during component init.
 */
export function hydrated(): { readonly current: boolean } {
	let current = $state(false);
	onMount(() => {
		current = true;
	});
	return {
		get current() {
			return current;
		}
	};
}
```

- [ ] **Step 5: Thin the components**

`Projects.svelte` script: imports from `$lib/projects` → `filterProjects, NO_FILTERS, projectLayout, sortProjects, type Filters, type SortKey`; drop `onMount`; add `import { hydrated } from '$lib/hydrated.svelte';`. Replace `tiers`, `phone`, `phoneOnly`, `ready`, `onMount`, `hidden` with:
```ts
	const sorted = $derived(sortProjects(filterProjects(PROJECTS, filters), sort, PRIORITY));
	/** Both layouts are in the HTML and CSS picks one, so the prerendered page is right before JS runs. */
	const layout = $derived(projectLayout(sorted));
	const ms = $derived(prefersReducedMotion.current ? 0 : 300);
	const ready = hydrated();
	let showAll = $state(false);
```
Markup:
- `{#if tiers.large.length === 0}` → `{#if layout.large.length === 0}`.
- big cards: `{#each layout.large as card (card.project.id)}<li class:desktop-only={card.desktopOnly} animate:flip={{ duration: ms }} in:fade={{ duration: ms }}><ProjectCardLarge project={card.project} {lang} {t} /></li>{/each}`.
- `{#if phone.small.length > 0}` → `{#if layout.small.length > 0}`; heading `class:phone-only={!layout.smallOnDesktop}`.
- tiles: `{#each layout.small as tile (tile.project.id)}<li class:phone-only={tile.phoneOnly} class:folded={ready.current && !showAll && tile.foldable} …><ProjectCardSmall project={tile.project} {lang} {t} /></li>{/each}`.
- `{#if ready && hidden > 0}` → `{#if ready.current && layout.folded > 0}`; text `plural(layout.folded, t.showMore, lang)`.

`About.svelte`: drop `onMount`; `let ready = $state(false);` + `onMount(…)` → `const ready = hydrated();`; `ready` → `ready.current` in `class:folded` and `{#if}`.
`JobItem.svelte`: same (`onMount` import goes); `class:folded={ready.current && !open}`, `{#if ready.current}`.
`Skills.svelte`: `let enhanced = $state(false);` + `onMount` → `const enhanced = hydrated();`; `onMount` leaves the `svelte` import (`tick` stays); every `enhanced` in the markup and in `panelHidden({ enhanced: enhanced.current, … })` → `enhanced.current` (`class:enhanced={enhanced.current}`, `{#if enhanced.current}` twice, the `role` and `aria-labelledby` ternaries).

Run: `grep -rn "onMount" src/lib/components/sections/About.svelte src/lib/components/sections/Projects.svelte src/lib/components/experience/JobItem.svelte src/lib/components/sections/Skills.svelte`
Expected: nothing.

- [ ] **Step 6: Verify (before hydration included) and commit**

Run: `npm test && npm run check && npm run lint && npm run build && npm run screens -- --compare`
Expected: all pass; identical captures, `en-light-360-nojs` included (every paragraph, tile and panel shown, no toggle buttons).
```bash
git add -A
git commit -m "refactor: projects grid as a tested projectLayout(), one hydrated() helper; restore section and panel tests" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bpc1BL8RhHGNJ6NHg9ay54"
```

---

### Task 7: Docs, final checks, PR

**Files:**
- Modify: `CLAUDE.md`, `docs/content-guide.md`, `README.md`, `docs/backlog.md`
- Create: `docs/reviews/milestone-12-review-guide.md`

- [ ] **Step 1: Bring the docs in line**

- `CLAUDE.md`, Commands: add `- `npm run screens`: captures the built site (EN/FR × dark/light × 360–1440px, phone collapsibles open, before hydration) into `reports/screens-baseline/`; `npm run screens -- --compare` compares a new capture with it and writes diff images to `reports/screens-diff/`. Take the baseline before a refactor, compare after each step.` Conventions: add `- Watch list: `docs/backlog.md` holds known issues not fixed yet; add to it rather than leaving a note in a session.` and `- Breakpoints live in `src/lib/breakpoints.ts`; a `@media` width must be one of them (a test checks).` Mention `npm run check` also type-checks `scripts/`.
- `docs/content-guide.md`: grep for every moved name and key (`skillName`, `glanceTally`, `showMore`, `THEME_BG`, `skills.ts`, `ICONS`, `icons/`) and update; in "Add an icon" list the new icon names; in "Tune the blur and darkening on phones" check the `--veil` / `--blur` text still matches `ProjectCardLarge.svelte`.
- `README.md`: add `npm run screens` and a link to `docs/backlog.md`.

- [ ] **Step 2: Full audit**

Run: `npm run audit`
Expected: 0 axe violations everywhere, no overflow at 360px, Lighthouse desktop 100 ×4, mobile accessibility / best practices / SEO as before; mobile performance 93–94 is known (watch list) and is not a regression if it matches the Task 0, Step 7 run.

- [ ] **Step 3: Update the watch list**

Add anything found during the tasks to `docs/backlog.md`.

- [ ] **Step 4: Final whole-branch review**

Request a review of `master..HEAD` (superpowers:requesting-code-review). Fix Critical and Important findings in new commits (re-running the Task checks); list the deferred minors in the review guide and in `docs/backlog.md`.

- [ ] **Step 5: Review guide, push, PR**

`docs/reviews/milestone-12-review-guide.md`: what changed per task (one paragraph each), the two visible changes with where to see them (desktop small card of Goldeneye; Hero "View CV" icon), the restored tests and why, the `npm run og` fix, how to run `npm run screens`, the deferred minors, and a manual checklist (theme toggle, language switch landing on the section, filters, phone collapsibles, copy e-mail).
```bash
git add -A && git commit -m "docs: m12 docs, watch list and review guide" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bpc1BL8RhHGNJ6NHg9ay54"
git push origin worktree-milestone-12-refactor:milestone-12-refactor
gh pr create --base master --head milestone-12-refactor --title "Milestone 12: pre-deploy refactor" --body-file - <<'EOF'
(summary of the review guide: tasks, the two visible changes, restored tests, og fix, how to verify with npm run screens)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Bpc1BL8RhHGNJ6NHg9ay54
EOF
```
Then stop: the user reviews the PR before anything is merged.
