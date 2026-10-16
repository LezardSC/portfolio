# Parallel work and PR previews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every PR gets a Cloudflare Pages preview and a before/after visual review page, linked in one PR comment; local `audit`/`screens` can run in several worktrees at once; CLAUDE.md documents the per-issue routine for terminal-per-issue and dispatched agents.

**Architecture:** `scripts/preview.ts` picks free ports. `scripts/screens.ts` gains `--out`, `--no-build` and a review mode (`--before/--after/--review`) that writes `build/_review/` from two capture folders, using a pure page builder (`scripts/review-page.ts`). A new workflow `.github/workflows/preview.yml` builds the PR, captures it and its merge base, deploys `build/` with `wrangler pages deploy --branch=pr-<n>`, then `scripts/post-preview-comment.ts` creates or edits the PR comment (body from the pure `scripts/preview-comment.ts`).

**Tech Stack:** Node 24 (TypeScript run directly by `node`), Playwright 1.63 (Chromium), Vitest, GitHub Actions, Cloudflare Pages via `wrangler` 4.146.0.

**Spec:** `docs/superpowers/specs/2026-10-16-parallel-work-previews-design.md`

## Global Constraints

- Work in the worktree `.claude/worktrees/parallel-previews` (local branch `worktree-parallel-previews`, remote branch `parallel-previews`). Push with `git push origin worktree-parallel-previews:parallel-previews`.
- Node scripts are plain `.ts` run by `node` (type stripping): no enums, no parameter properties, imports end in `.ts`. `npm run check` type-checks them (`tsc -p scripts`).
- Logic in pure functions with `*.spec.ts` next to them (Vitest picks up `scripts/**/*.spec.ts`). Runners (files that launch browsers, servers or call APIs) are not unit tested.
- `checks` (ci.yml) stays the only required status. The preview workflow must never block a merge or touch production.
- Cloudflare project name: `jocelynrenault-previews`. Preview address: `https://pr-<n>.<domain>`, `<domain>` = repo variable `CLOUDFLARE_PAGES_DOMAIN`, default `jocelynrenault-previews.pages.dev`.
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Never commit credentials (public repo).
- `wrangler` pinned exactly: `4.146.0` (newest 4.x at least two weeks old on 2026-10-16).
- `npm run screens` and `npm run screens -- --compare` keep their current behaviour and output folders (`reports/screens-baseline/`, `reports/screens-current/`, `reports/screens-diff/`).
- Before every commit: `npm run lint`, `npm run check`, `npm test` pass. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Docs (`docs/`) are not formatted by Prettier; keep their existing style (short sentences, no em dashes as separators in new text).

## Review Focus

1. **The PR changes markup that `openCollapsibles()` clicks** (e.g. renames `.read-more`): the base capture then fails. Expected: the site preview still deploys and the comment says the review page is unavailable, with the run link. Pinned by `continue-on-error` on the three review steps (Task 6) and the `review: null` comment test (Task 5).
2. **A page got taller or shorter** (most real layout changes): no pixel diff is possible. Expected: the review page shows before and after with both sizes, no broken diff image. Pinned by the `sizeChanged` test (Task 3).
3. **Two scripts start a preview server at the same moment:** expected: each gets its own port, or retries once the port is taken between `freePort()` and Vite. Pinned by the concurrent `freePort` test and the two-worktree run (Task 1).
4. **No Cloudflare secrets yet, or a PR from a fork:** expected: no failing run, a notice in the log, no comment. Pinned by the `secrets` job (Task 6) and observed on this feature's own PR before setup (Task 8).
5. **Someone else's comment quotes the marker** (e.g. a reply that pastes the bot's comment): expected: the bot never edits it. Pinned by the `findPreviewComment` author test (Task 5).

---

### Task 1: Free ports for the preview server

**Files:**
- Modify: `scripts/preview.ts`
- Modify: `scripts/preview.spec.ts`
- Modify: `scripts/audit.ts:25-29, 41-115, 119-186`
- Modify: `scripts/screens.ts:13-14, 19-28, 128-140`

**Interfaces:**
- Produces: `freePort(): Promise<number>`; `type Preview = { origin: string; stop: () => void }`; `startPreview(options?: { build?: boolean }): Promise<Preview>` (default `build: true`). `origin` has no trailing slash, e.g. `http://127.0.0.1:43512`.

- [ ] **Step 1: Write the failing test** (append to `scripts/preview.spec.ts`, and add `freePort` to its import)

```ts
import { createServer } from 'node:net';
import { freePort, previewReady } from './preview.ts';

function listen(port: number): Promise<() => void> {
	return new Promise((resolve, reject) => {
		const server = createServer();
		server.once('error', reject);
		server.listen(port, '127.0.0.1', () => resolve(() => server.close()));
	});
}

describe('freePort', () => {
	it('returns a port that can then be listened on', async () => {
		const port = await freePort();
		expect(port).toBeGreaterThan(0);
		const close = await listen(port);
		close();
	});

	it('gives different ports to calls made at the same time', async () => {
		const ports = await Promise.all([freePort(), freePort(), freePort()]);
		const closers = await Promise.all(ports.map(listen));
		closers.forEach((close) => close());
		expect(new Set(ports).size).toBe(3);
	});
});
```

(The second test listens on all three ports at once: if two were equal, `listen` would reject with `EADDRINUSE`. The OS gives distinct ephemeral ports to sockets open at the same time, but `freePort` closes its socket before resolving, so equal ports are theoretically possible; if this test is ever flaky, that is the cause and `startPreview`'s retry is what covers it in practice.)

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest --run scripts/preview.spec.ts`
Expected: FAIL, `freePort` is not exported.

- [ ] **Step 3: Implement** in `scripts/preview.ts`. Add the import `import { createServer, type AddressInfo } from 'node:net';`, add `freePort`, and replace `startPreview` with:

```ts
/**
 * A port nothing listens on right now, chosen by the OS. Another process could still take it
 * before vite does: startPreview() then tries again.
 */
export function freePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = createServer();
		server.once('error', reject);
		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address() as AddressInfo;
			server.close(() => resolve(port));
		});
	});
}

export type Preview = { origin: string; stop: () => void };

/**
 * Builds the site (unless `build` is false), serves it with `vite preview` on a free port and
 * returns its origin and the function that stops the server. Several worktrees can run this at
 * the same time. Serves the current directory's build: run it from the checkout to capture.
 */
export async function startPreview({ build = true }: { build?: boolean } = {}): Promise<Preview> {
	if (build) execSync('npm run build', { stdio: 'inherit' });
	for (let attempt = 1; ; attempt++) {
		const port = await freePort();
		const server = spawn(
			'./node_modules/.bin/vite',
			['preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
			{ stdio: ['ignore', 'pipe', 'pipe'] }
		);
		try {
			await waitForPreview(server, port);
			return { origin: `http://127.0.0.1:${port}`, stop: () => server.kill() };
		} catch (e) {
			server.kill();
			if (attempt === 3) throw e;
		}
	}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest --run scripts/preview.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Use the origin in `scripts/audit.ts`**

Delete the constants `PORT`, `DEBUG_PORT` and `ORIGIN` (lines 27-29). Change the import to `import { freePort, openCollapsibles, startPreview } from './preview.ts';`. Then:
- `browserChecks(browser: Browser)` → `browserChecks(browser: Browser, origin: string)`, and every `${ORIGIN}` inside it → `${origin}` (three places: `/${lang}/`, `/en/`, `/404.html`).
- `screenshots(browser: Browser)` → `screenshots(browser: Browser, origin: string)`, `${ORIGIN}` → `${origin}`.
- `lighthouseChecksFor()` → `lighthouseChecksFor(origin: string)`; at its start add `const debugPort = await freePort();`, launch with `` `--remote-debugging-port=${debugPort}` ``, pass `port: debugPort` to `lighthouse(...)`, and `` `${origin}/en/` `` as its URL.
- In `main()`: `const { origin, stop } = await startPreview();`, then `browserChecks(browser, origin)`, `screenshots(browser, origin)`, `lighthouseChecksFor(origin)`.

- [ ] **Step 6: Use the origin in `scripts/screens.ts`** (minimal change; Task 2 restructures this file)

Delete `PORT` and `ORIGIN` (lines 13-14). `shoot(browser: Browser, c: Capture)` → `shoot(browser: Browser, origin: string, c: Capture)` with `` `${origin}/${c.lang}/` ``. `capture(compare, dir, results)` gets a first parameter `origin: string` and calls `shoot(browser, origin, c)`. In `main()`: `const { origin, stop } = await startPreview();` and `await capture(origin, compare, dir, results);`.

- [ ] **Step 7: Check types, lint, tests**

Run: `npm run check && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add scripts/preview.ts scripts/preview.spec.ts scripts/audit.ts scripts/screens.ts
git commit -m "fix: audit and screens pick free ports, so worktrees can run them at once

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 9: Run two audits at the same time from two worktrees** (after the commit, so the second worktree has the change)

```bash
SCRATCH=/tmp/claude-1000/-home-lezard-portfolio/3edc1b78-4f62-462c-92ac-f703c84b9082/scratchpad
git worktree add --detach "$SCRATCH/pp-second" HEAD
(cd "$SCRATCH/pp-second" && npm ci)
```

Then start both in parallel (two background shell commands) and wait for both:

```bash
npm run audit -- --ci > "$SCRATCH/audit-1.log" 2>&1; echo "exit $?" >> "$SCRATCH/audit-1.log"
(cd "$SCRATCH/pp-second" && npm run audit -- --ci) > "$SCRATCH/audit-2.log" 2>&1; echo "exit $?" >> "$SCRATCH/audit-2.log"
```

Expected: both logs end with the PASS table and `exit 0`. (`--ci` because two Lighthouse runs at once slow each other down; performance is reported, not required.) Then `git worktree remove --force "$SCRATCH/pp-second"`.

---

### Task 2: `screens` options: `--out`, `--no-build` and a reusable comparison

**Files:**
- Modify: `scripts/screens-report.ts`
- Modify: `scripts/screens-report.spec.ts`
- Modify: `scripts/screens.ts` (header comment, `capture`, `main`; new `captureAll`, `compareDirs`, `fresh`)

**Interfaces:**
- Consumes: `startPreview({ build }): Promise<Preview>` (Task 1).
- Produces (in `screens-report.ts`):
  - `type Result = { name: string; same: boolean; detail: string; sizeChanged?: true }`
  - `type ScreensArgs = { mode: 'capture'; out: string; build: boolean } | { mode: 'compare'; build: boolean } | { mode: 'review'; before: string; after: string; review: string }`
  - `parseScreensArgs(argv: readonly string[]): ScreensArgs`
  - `formatResults(results: readonly Result[], diffs = 'reports/screens-diff/'): string`
- Produces (in `screens.ts`, used by Task 4): `compareDirs(before: string, after: string, out: { diffDir?: string; reviewDir?: string }): Promise<Result[]>`, `fresh(dir: string): void`.

- [ ] **Step 1: Write the failing tests** (append to `scripts/screens-report.spec.ts`, add `parseScreensArgs` to the import)

```ts
describe('parseScreensArgs', () => {
	it('captures a baseline by default, building first', () => {
		expect(parseScreensArgs([])).toEqual({
			mode: 'capture',
			out: 'reports/screens-baseline',
			build: true
		});
	});
	it('captures into --out, and skips the build with --no-build', () => {
		expect(parseScreensArgs(['--out', '/tmp/after', '--no-build'])).toEqual({
			mode: 'capture',
			out: '/tmp/after',
			build: false
		});
	});
	it('compares with the baseline', () => {
		expect(parseScreensArgs(['--compare'])).toEqual({ mode: 'compare', build: true });
	});
	it('builds a review page from two capture folders', () => {
		expect(parseScreensArgs(['--before', 'b', '--after', 'a', '--review', 'r'])).toEqual({
			mode: 'review',
			before: 'b',
			after: 'a',
			review: 'r'
		});
	});
	it('refuses an incomplete review, a path missing, mixed modes and unknown options', () => {
		expect(() => parseScreensArgs(['--before', 'b', '--after', 'a'])).toThrow('go together');
		expect(() => parseScreensArgs(['--out'])).toThrow('--out needs a path');
		expect(() => parseScreensArgs(['--out', '--no-build'])).toThrow('--out needs a path');
		expect(() => parseScreensArgs(['--compare', '--out', 'x'])).toThrow();
		expect(() =>
			parseScreensArgs(['--before', 'b', '--after', 'a', '--review', 'r', '--compare'])
		).toThrow();
		expect(() => parseScreensArgs(['--compar'])).toThrow('Unknown option: --compar');
	});
});
```

And in the existing `formatResults` describe:

```ts
	it('names where the diff images are', () => {
		const out = formatResults([{ name: 'a', same: false, detail: 'x' }], 'build/_review/');
		expect(out).toContain('(images in build/_review/)');
	});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest --run scripts/screens-report.spec.ts`
Expected: FAIL, `parseScreensArgs` is not exported; the `formatResults` test fails on the text.

- [ ] **Step 3: Implement** in `scripts/screens-report.ts`

Replace `Result` and `formatResults`' last lines, and add the parser:

```ts
/** `sizeChanged`: the page got taller or shorter, so there is no pixel diff. */
export type Result = { name: string; same: boolean; detail: string; sizeChanged?: true };
```

`formatResults` gets a second parameter `where` (its body already has a local called `diffs`), and its verdict line names it:

```ts
export function formatResults(results: readonly Result[], where = 'reports/screens-diff/'): string {
	// …unchanged…
			: `\n${diffs.length} of ${results.length} captures differ (images in ${where})`
```

```ts
const BASELINE = 'reports/screens-baseline';

/** What `npm run screens` was asked to do. */
export type ScreensArgs =
	| { mode: 'capture'; out: string; build: boolean }
	| { mode: 'compare'; build: boolean }
	| { mode: 'review'; before: string; after: string; review: string };

const PATH_OPTIONS = ['--out', '--before', '--after', '--review'];

/**
 * (none) or --out <dir>: capture (default reports/screens-baseline). --compare: capture again and
 * compare with the baseline. --no-build: serve the existing build. --before <dir> --after <dir>
 * --review <dir>: compare two capture folders and write the review page (CI, preview.yml).
 */
export function parseScreensArgs(argv: readonly string[]): ScreensArgs {
	const paths: Record<string, string> = {};
	let compare = false;
	let build = true;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--compare') compare = true;
		else if (arg === '--no-build') build = false;
		else if (PATH_OPTIONS.includes(arg)) {
			const value = argv[++i];
			if (!value || value.startsWith('--')) throw new Error(`${arg} needs a path`);
			paths[arg] = value;
		} else throw new Error(`Unknown option: ${arg}`);
	}
	const before = paths['--before'];
	const after = paths['--after'];
	const review = paths['--review'];
	if (before || after || review) {
		if (!before || !after || !review)
			throw new Error('--before, --after and --review go together');
		if (compare || !build || paths['--out'])
			throw new Error('--before/--after/--review compare existing captures: no other option');
		return { mode: 'review', before, after, review };
	}
	if (compare) {
		if (paths['--out']) throw new Error('--compare always captures into reports/screens-current/');
		return { mode: 'compare', build };
	}
	return { mode: 'capture', out: paths['--out'] ?? BASELINE, build };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest --run scripts/screens-report.spec.ts`
Expected: PASS.

- [ ] **Step 5: Before restructuring `screens.ts`, take a baseline with the current code**

Run: `npm run screens`
Expected: `Baseline: 25 captures in reports/screens-baseline/`.

- [ ] **Step 6: Restructure `scripts/screens.ts`**

Header comment:

```ts
/**
 * npm run screens               saves a baseline in reports/screens-baseline/
 * npm run screens -- --compare  captures again into reports/screens-current/, compares each
 *                               capture with the baseline (bytes, then pixels), writes diff
 *                               images to reports/screens-diff/ and exits 1 on any difference.
 * --out <dir>                   captures into <dir> instead of the baseline folder.
 * --no-build                    serves the existing build instead of building first.
 * --before <dir> --after <dir> --review <dir>
 *                               compares two capture folders and writes a review page
 *                               (index.html, JPEGs, summary.txt) into <dir>: used by preview.yml.
 * Captures serve the current directory's build: run from another checkout to capture it.
 * Full pages, reduced motion (no scroll reveal, no video), every image loaded eagerly.
 */
```

Imports: `import { captures, formatResults, parseScreensArgs, type Capture, type Result } from './screens-report.ts';` (`existsSync`, `mkdirSync`, `readFileSync`, `rmSync`, `writeFileSync` stay). Delete `BASELINE`'s duplicate if any; keep the three constants `BASELINE`, `CURRENT`, `DIFF`.

Replace the old `capture()` and `main()` with:

```ts
/** Empties `dir`, creating it if needed. */
function fresh(dir: string): void {
	rmSync(dir, { recursive: true, force: true });
	mkdirSync(dir, { recursive: true });
}

/** Serves the build and writes every capture into `dir` as <name>.png. */
async function captureInto(dir: string, build: boolean): Promise<void> {
	fresh(dir);
	const { origin, stop } = await startPreview({ build });
	try {
		const browser = await chromium.launch();
		try {
			for (const c of captures()) writeFileSync(`${dir}/${c.name}.png`, await shoot(browser, origin, c));
		} finally {
			await browser.close();
		}
	} finally {
		stop();
	}
}

type Output = { diffDir?: string; reviewDir?: string };

/**
 * Compares each capture in `before` with the one in `after` (bytes, then pixels). For each
 * difference: a diff PNG in `diffDir`, and before/after/diff JPEGs in `reviewDir`.
 */
async function compareDirs(before: string, after: string, out: Output): Promise<Result[]> {
	const results: Result[] = [];
	const browser = await chromium.launch();
	try {
		const page = await browser.newPage();
		for (const c of captures()) {
			const a = readFileSync(`${before}/${c.name}.png`);
			const b = readFileSync(`${after}/${c.name}.png`);
			if (a.equals(b)) {
				results.push({ name: c.name, same: true, detail: 'identical' });
				continue;
			}
			const d = await pixelDiff(page, a, b);
			if (d.count === 0) {
				results.push({ name: c.name, same: true, detail: 'same pixels' });
				continue;
			}
			const diff = d.count > 0 ? Buffer.from(d.image, 'base64') : undefined;
			results.push(
				diff
					? { name: c.name, same: false, detail: `${d.count} px in ${d.box}` }
					: { name: c.name, same: false, detail: `page size ${d.size}`, sizeChanged: true }
			);
			if (out.diffDir && diff) writeFileSync(`${out.diffDir}/${c.name}.png`, diff);
			// Task 4 adds the review JPEGs here.
		}
	} finally {
		await browser.close();
	}
	return results;
}

async function main(): Promise<void> {
	const args = parseScreensArgs(process.argv.slice(2));
	if (args.mode === 'capture') {
		await captureInto(args.out, args.build);
		console.log(`\n${captures().length} captures in ${args.out}/`);
		return;
	}
	if (args.mode === 'compare') {
		if (!existsSync(BASELINE)) throw new Error('No baseline: run npm run screens first.');
		await captureInto(CURRENT, args.build);
		fresh(DIFF);
		const results = await compareDirs(BASELINE, CURRENT, { diffDir: DIFF });
		console.log(`\n${formatResults(results)}`);
		process.exitCode = results.every((r) => r.same) ? 0 : 1;
		return;
	}
	throw new Error('Review mode: added in the next commit.');
}
```

(The `// Task 4 adds…` comment and the last `throw` are replaced in Task 4, which is the next commit; they are not left in the finished branch.) `shoot` keeps the `origin` parameter from Task 1.

- [ ] **Step 7: Check that nothing changed in the captures**

Run: `npm run check && npm run screens -- --compare`
Expected: `all 25 captures identical`, exit 0.

- [ ] **Step 8: Check `--out` and `--no-build`**

Run: `npm run screens -- --out reports/out-check --no-build && ls reports/out-check | wc -l && rm -r reports/out-check`
Expected: no `vite build` output in the log, then `25`.

- [ ] **Step 9: Lint, test, commit**

```bash
npm run lint && npm test
git add scripts/screens.ts scripts/screens-report.ts scripts/screens-report.spec.ts
git commit -m "feat: screens --out and --no-build, comparison of any two capture folders

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The review page builder

**Files:**
- Create: `scripts/review-page.ts`
- Create: `scripts/review-page.spec.ts`

**Interfaces:**
- Produces: `type ReviewEntry = { name: string; detail: string; sizeChanged: boolean }`; `reviewSummary(changed: number, total: number): string`; `reviewPage(entries: readonly ReviewEntry[], total: number): string`. Image files expected next to the page: `<name>-before.jpg`, `<name>-after.jpg`, `<name>-diff.jpg` (no diff when `sizeChanged`).

- [ ] **Step 1: Write the failing tests** in `scripts/review-page.spec.ts`

```ts
import { describe, expect, it } from 'vitest';
import { reviewPage, reviewSummary } from './review-page.ts';

describe('reviewSummary', () => {
	it('says how many screens changed, or that none did', () => {
		expect(reviewSummary(0, 25)).toBe('No visual change');
		expect(reviewSummary(4, 25)).toBe('4 of 25 screens changed');
	});
});

describe('reviewPage', () => {
	it('is a standalone, unindexed page with the summary as its heading', () => {
		const html = reviewPage([], 25);
		expect(html).toMatch(/^<!doctype html>/);
		expect(html).toContain('<meta name="robots" content="noindex">');
		expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
		expect(html).toContain('<h1>No visual change</h1>');
		expect(html).not.toContain('<section');
		expect(html).not.toContain('<script');
	});

	it('shows only the given captures, in order, each with before, after and diff', () => {
		const html = reviewPage(
			[
				{ name: 'en-dark-360', detail: '12 px in 4×3 at (10, 20)', sizeChanged: false },
				{ name: 'fr-light-1280', detail: '7 px in 1×7 at (0, 0)', sizeChanged: false }
			],
			25
		);
		expect(html).toContain('<h1>2 of 25 screens changed</h1>');
		expect(html.indexOf('en-dark-360')).toBeLessThan(html.indexOf('fr-light-1280'));
		for (const kind of ['before', 'after', 'diff'])
			expect(html).toContain(`<a href="en-dark-360-${kind}.jpg"><img src="en-dark-360-${kind}.jpg"`);
		expect(html).toContain('12 px in 4×3 at (10, 20)');
	});

	it('has no diff image when the page size changed', () => {
		const html = reviewPage(
			[{ name: 'en-dark-360', detail: 'page size 360×9000 → 360×9100', sizeChanged: true }],
			25
		);
		expect(html).toContain('en-dark-360-before.jpg');
		expect(html).toContain('en-dark-360-after.jpg');
		expect(html).not.toContain('en-dark-360-diff.jpg');
		expect(html).toContain('page size 360×9000 → 360×9100');
	});

	it('escapes names and details', () => {
		const html = reviewPage([{ name: `a<b>'"&`, detail: '<i>', sizeChanged: false }], 1);
		expect(html).not.toContain('<b>');
		expect(html).not.toContain('<i>');
		expect(html).toContain('a&#60;b&#62;&#39;&#34;&#38;');
	});
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest --run scripts/review-page.spec.ts`
Expected: FAIL, cannot find `./review-page.ts`.

- [ ] **Step 3: Implement** `scripts/review-page.ts`

```ts
/** One capture that differs between the PR's merge base (before) and the PR (after). */
export type ReviewEntry = { name: string; detail: string; sizeChanged: boolean };

/** One line: the review page's heading and the PR comment's link text. */
export function reviewSummary(changed: number, total: number): string {
	return changed === 0 ? 'No visual change' : `${changed} of ${total} screens changed`;
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** No media query: the grid goes from one column on a phone to three on a computer. */
const CSS = `
:root { color-scheme: light dark; font: 16px/1.5 system-ui, sans-serif; }
body { margin: 0 auto; padding: 16px; max-width: 1600px; }
h1 { font-size: 1.4rem; }
h2 { font-size: 1.1rem; margin: 2rem 0 0; font-family: ui-monospace, monospace; }
section > p { margin: 0 0 0.5rem; opacity: 0.8; }
.images { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr)); align-items: start; }
figure { margin: 0; }
figcaption { font-weight: 600; }
img { display: block; width: 100%; height: auto; border: 1px solid #8888; }
`;

function figure(file: string, label: string): string {
	return `<figure><figcaption>${label}</figcaption><a href="${file}"><img src="${file}" alt="${label}" loading="lazy"></a></figure>`;
}

/** The page CI publishes at /_review/ in each PR preview: the changed captures only. */
export function reviewPage(entries: readonly ReviewEntry[], total: number): string {
	const sections = entries.map((e) => {
		const file = escape(encodeURIComponent(e.name));
		const images = [figure(`${file}-before.jpg`, 'Before'), figure(`${file}-after.jpg`, 'After')];
		if (!e.sizeChanged) images.push(figure(`${file}-diff.jpg`, 'Diff (changes in red)'));
		return `<section><h2>${escape(e.name)}</h2><p>${escape(e.detail)}</p><div class="images">${images.join('')}</div></section>`;
	});
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Visual review</title>
<style>${CSS}</style>
</head>
<body>
<h1>${reviewSummary(entries.length, total)}</h1>
<p>Before: where this PR branched from master. After: this PR. Names are language, theme and width; "open" has the phone sections expanded, "nojs" is the page before JavaScript. A page that got taller or shorter has no diff image. Tap an image for full size.</p>
${sections.join('\n')}
</body>
</html>
`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest --run scripts/review-page.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Check, lint, commit**

```bash
npm run check && npm run lint && npm test
git add scripts/review-page.ts scripts/review-page.spec.ts
git commit -m "feat: review page listing the screens a PR changed

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: `screens` review mode

**Files:**
- Modify: `scripts/screens.ts` (`compareDirs`, `main`; new `toJpeg`)

**Interfaces:**
- Consumes: `compareDirs`, `fresh` (Task 2); `reviewPage`, `reviewSummary`, `ReviewEntry` (Task 3).
- Produces: `node scripts/screens.ts --before <dir> --after <dir> --review <dir>` writes `<dir>/index.html`, `<dir>/summary.txt` (the `reviewSummary` line, no newline) and the JPEGs. Exit 0 whether or not something changed (a change is not a failure in CI).

- [ ] **Step 1: Add `toJpeg`** in `scripts/screens.ts`, after `pixelDiff`

```ts
/** The same image as a JPEG (quality 0.8): the review page stays light on a phone connection. */
async function toJpeg(page: Page, png: Buffer): Promise<Buffer> {
	const b64 = await page.evaluate(async (src) => {
		const img = new Image();
		await new Promise((done) => {
			img.onload = done;
			img.src = `data:image/png;base64,${src}`;
		});
		const canvas = document.createElement('canvas');
		[canvas.width, canvas.height] = [img.width, img.height];
		canvas.getContext('2d')!.drawImage(img, 0, 0);
		return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
	}, png.toString('base64'));
	return Buffer.from(b64, 'base64');
}
```

- [ ] **Step 2: Write the review JPEGs** in `compareDirs`, replacing the line `// Task 4 adds the review JPEGs here.`

```ts
			if (out.reviewDir) {
				const dir = out.reviewDir;
				writeFileSync(`${dir}/${c.name}-before.jpg`, await toJpeg(page, a));
				writeFileSync(`${dir}/${c.name}-after.jpg`, await toJpeg(page, b));
				if (diff) writeFileSync(`${dir}/${c.name}-diff.jpg`, await toJpeg(page, diff));
			}
```

- [ ] **Step 3: Review mode** in `main()`, replacing `throw new Error('Review mode: added in the next commit.');`. Add `import { reviewPage, reviewSummary } from './review-page.ts';`.

```ts
	fresh(args.review);
	const results = await compareDirs(args.before, args.after, { reviewDir: args.review });
	const changed = results
		.filter((r) => !r.same)
		.map((r) => ({ name: r.name, detail: r.detail, sizeChanged: r.sizeChanged === true }));
	writeFileSync(`${args.review}/index.html`, reviewPage(changed, results.length));
	writeFileSync(`${args.review}/summary.txt`, reviewSummary(changed.length, results.length));
	console.log(`\n${formatResults(results, `${args.review}/`)}`);
```

- [ ] **Step 4: Try it with a real change**

```bash
npm run screens -- --out reports/before
# A visible, temporary change:
sed -i '0,/^body {/s//body { outline: 6px solid red;\n/' src/app.css   # check the edit landed: git diff src/app.css
npm run screens -- --out reports/after
git checkout src/app.css
node scripts/screens.ts --before reports/before --after reports/after --review reports/review
cat reports/review/summary.txt; echo; ls reports/review | head
```

Expected: the log lists DIFF lines, `summary.txt` reads `N of 25 screens changed` with N > 0, and the folder holds `index.html` plus `-before.jpg`/`-after.jpg`/`-diff.jpg` files. If the `sed` did not match (app.css has no line starting with `body {`), make the same temporary change by hand with the Edit tool on any rule that applies to the whole page, and revert it the same way.

Then look at the page at phone width:

```bash
node --input-type=module -e "
const { chromium } = await import('playwright');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 360, height: 800 } });
await p.goto('file://' + process.cwd() + '/reports/review/index.html');
await p.screenshot({ path: 'reports/review-360.png' });
await p.setViewportSize({ width: 1280, height: 900 });
await p.screenshot({ path: 'reports/review-1280.png' });
await b.close();
"
```

Read both PNGs (Read tool). Expected: heading with the count; at 360px images stacked one per row, no sideways scroll; at 1280px before/after/diff side by side.

Also check the no-change case: `node scripts/screens.ts --before reports/before --after reports/before --review reports/review-same && cat reports/review-same/summary.txt` → `No visual change`.

Clean up: `rm -r reports/before reports/after reports/review reports/review-same reports/review-*.png`.

- [ ] **Step 5: Check, lint, test, commit**

```bash
npm run check && npm run lint && npm test
git add scripts/screens.ts
git commit -m "feat: screens review mode writes the before/after page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The PR comment

**Files:**
- Create: `scripts/preview-comment.ts` (pure)
- Create: `scripts/preview-comment.spec.ts`
- Create: `scripts/post-preview-comment.ts` (runner, CI only)

**Interfaces:**
- Produces: `PREVIEW_MARKER = '<!-- preview -->'`; `previewComment(input: { url: string; sha: string; review: string | null; runUrl: string }): string`; `type IssueComment = { id: number; body?: string; user?: { login: string } | null }`; `findPreviewComment(comments: readonly IssueComment[]): number | undefined`.
- Runner env (Task 6 sets it): `GITHUB_TOKEN`, `GITHUB_API_URL`, `GITHUB_REPOSITORY` (from Actions), `PR`, `PREVIEW_URL`, `SHA`, `RUN_URL`, `REVIEW_SUMMARY_FILE` (empty or missing file: review unavailable).

- [ ] **Step 1: Write the failing tests** in `scripts/preview-comment.spec.ts`

```ts
import { describe, expect, it } from 'vitest';
import { findPreviewComment, previewComment, PREVIEW_MARKER } from './preview-comment.ts';

const input = {
	url: 'https://pr-52.jocelynrenault-previews.pages.dev/',
	sha: '0123456789abcdef',
	review: '4 of 25 screens changed',
	runUrl: 'https://github.com/LezardSC/portfolio/actions/runs/1'
};

describe('previewComment', () => {
	it('starts with the marker and names the short commit', () => {
		const body = previewComment(input);
		expect(body.startsWith(`${PREVIEW_MARKER}\n`)).toBe(true);
		expect(body).toContain('`0123456`');
	});
	it('links both languages and the review page, without double slashes', () => {
		const body = previewComment(input);
		expect(body).toContain('[English](https://pr-52.jocelynrenault-previews.pages.dev/en/)');
		expect(body).toContain('[Français](https://pr-52.jocelynrenault-previews.pages.dev/fr/)');
		expect(body).toContain(
			'[4 of 25 screens changed](https://pr-52.jocelynrenault-previews.pages.dev/_review/)'
		);
	});
	it('points to the workflow log when the review page could not be made', () => {
		const body = previewComment({ ...input, review: null });
		expect(body).not.toContain('/_review/');
		expect(body).toContain('[workflow log](https://github.com/LezardSC/portfolio/actions/runs/1)');
	});
	it('says what the preview does not test', () => {
		expect(previewComment(input)).toContain('.htaccess');
	});
});

describe('findPreviewComment', () => {
	const bot = { login: 'github-actions[bot]' };
	it("finds the bot's comment that starts with the marker", () => {
		expect(
			findPreviewComment([
				{ id: 1, body: 'LGTM', user: { login: 'LezardSC' } },
				{ id: 2, body: `${PREVIEW_MARKER}\n### Preview`, user: bot }
			])
		).toBe(2);
	});
	it("ignores someone else's comment quoting it, and the bot's other comments", () => {
		expect(
			findPreviewComment([
				{ id: 1, body: `${PREVIEW_MARKER}\nquoted`, user: { login: 'LezardSC' } },
				{ id: 2, body: `> ${PREVIEW_MARKER}`, user: bot },
				{ id: 3, body: undefined, user: null }
			])
		).toBeUndefined();
	});
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest --run scripts/preview-comment.spec.ts`
Expected: FAIL, cannot find `./preview-comment.ts`.

- [ ] **Step 3: Implement** `scripts/preview-comment.ts`

```ts
/** First line of the preview comment: how the workflow finds it again to edit it. */
export const PREVIEW_MARKER = '<!-- preview -->';

/** The PR comment linking the preview. `review` is the review page's summary, null if it failed. */
export function previewComment(input: {
	url: string;
	sha: string;
	review: string | null;
	runUrl: string;
}): string {
	const site = input.url.replace(/\/+$/, '');
	const review = input.review
		? `- Visual review: [${input.review}](${site}/_review/)`
		: `- Visual review unavailable (see the [workflow log](${input.runUrl}))`;
	return [
		PREVIEW_MARKER,
		`### Preview of \`${input.sha.slice(0, 7)}\``,
		'',
		`- Site: [English](${site}/en/) · [Français](${site}/fr/)`,
		review,
		'',
		"<sub>Cloudflare Pages preview, not indexed, updated on every push. Not tested here: `.htaccess` (so `/` does not pick a language) and OVH's caching and headers.</sub>",
		''
	].join('\n');
}

export type IssueComment = { id: number; body?: string; user?: { login: string } | null };

/** The workflow's own preview comment on the PR, if there is one. */
export function findPreviewComment(comments: readonly IssueComment[]): number | undefined {
	return comments.find(
		(c) => c.user?.login === 'github-actions[bot]' && c.body?.startsWith(PREVIEW_MARKER)
	)?.id;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest --run scripts/preview-comment.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Write the runner** `scripts/post-preview-comment.ts`

```ts
/**
 * CI only (preview.yml): posts the preview comment on the PR, or edits the one already there.
 * Env: GITHUB_TOKEN, GITHUB_API_URL, GITHUB_REPOSITORY (from Actions), PR, PREVIEW_URL, SHA,
 * RUN_URL, REVIEW_SUMMARY_FILE (empty, or a missing file: the review page is unavailable).
 */
import { existsSync, readFileSync } from 'node:fs';
import { findPreviewComment, previewComment, type IssueComment } from './preview-comment.ts';

function env(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
}

const issues = `${env('GITHUB_API_URL')}/repos/${env('GITHUB_REPOSITORY')}/issues`;
const headers = {
	Authorization: `Bearer ${env('GITHUB_TOKEN')}`,
	Accept: 'application/vnd.github+json',
	'Content-Type': 'application/json',
	'X-GitHub-Api-Version': '2022-11-28'
};

async function github(url: string, init: { method?: string; body?: string } = {}): Promise<unknown> {
	const res = await fetch(url, { ...init, headers });
	if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${url}: ${res.status} ${await res.text()}`);
	return res.json();
}

async function allComments(pr: string): Promise<IssueComment[]> {
	const all: IssueComment[] = [];
	for (let page = 1; ; page++) {
		const batch = (await github(`${issues}/${pr}/comments?per_page=100&page=${page}`)) as IssueComment[];
		all.push(...batch);
		if (batch.length < 100) return all;
	}
}

const pr = env('PR');
const file = process.env.REVIEW_SUMMARY_FILE;
const summary = file && existsSync(file) ? readFileSync(file, 'utf8').trim() : '';
const body = previewComment({
	url: env('PREVIEW_URL'),
	sha: env('SHA'),
	review: summary || null,
	runUrl: env('RUN_URL')
});
const id = findPreviewComment(await allComments(pr));
if (id === undefined)
	await github(`${issues}/${pr}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
else await github(`${issues}/comments/${id}`, { method: 'PATCH', body: JSON.stringify({ body }) });
console.log(`${id === undefined ? 'Posted' : 'Updated'} the preview comment on #${pr}.`);
```

- [ ] **Step 6: Check, lint, test, commit**

```bash
npm run check && npm run lint && npm test
git add scripts/preview-comment.ts scripts/preview-comment.spec.ts scripts/post-preview-comment.ts
git commit -m "feat: PR comment linking the preview and its review page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The preview workflow and its setup guide

**Files:**
- Modify: `package.json`, `package-lock.json` (wrangler)
- Create: `.github/workflows/preview.yml`
- Modify: `docs/deploy.md` (new section "PR previews", after "GitHub secrets")

**Interfaces:**
- Consumes: `screens.ts --out/--no-build/--before/--after/--review` (Tasks 2, 4); `post-preview-comment.ts` env (Task 5).

- [ ] **Step 1: Add wrangler, pinned**

Run: `npm install --save-dev --save-exact wrangler@4.146.0`
Expected: `package.json` has `"wrangler": "4.146.0"`. Then `npx wrangler --version` prints `4.146.0`.

- [ ] **Step 2: Write `.github/workflows/preview.yml`**

```yaml
# Every PR into master: a preview of the site on Cloudflare Pages and a before/after visual
# review page, linked in one PR comment that each push updates. Not a required check, and it
# never touches production (deploy.yml does, on merge). Setup: docs/deploy.md, "PR previews".
name: Preview

on:
  pull_request:
    branches: [master]

permissions:
  contents: read
  pull-requests: write

concurrency:
  group: preview-${{ github.event.pull_request.number }}
  cancel-in-progress: true

env:
  PROJECT: jocelynrenault-previews

jobs:
  secrets:
    # A fork's PR gets no secrets: nothing to deploy with.
    if: github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-24.04
    outputs:
      ok: ${{ steps.check.outputs.ok }}
    steps:
      - id: check
        env:
          TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          ACCOUNT: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          if [ -n "$TOKEN" ] && [ -n "$ACCOUNT" ]; then
            echo "ok=true" >> "$GITHUB_OUTPUT"
          else
            echo "::notice::No Cloudflare secrets, so no preview: see docs/deploy.md, PR previews."
          fi

  preview:
    needs: secrets
    if: needs.secrets.outputs.ok == 'true'
    runs-on: ubuntu-24.04
    timeout-minutes: 30
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      PR: ${{ github.event.pull_request.number }}
      SHA: ${{ github.event.pull_request.head.sha }}
    steps:
      - uses: actions/checkout@v7
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          fetch-depth: 0
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npx playwright install --with-deps chromium

      # The review page. A failure in these three steps still deploys the site; the comment says so.
      - name: Capture this PR
        id: after
        continue-on-error: true
        run: node scripts/screens.ts --no-build --out "$RUNNER_TEMP/after"
      - name: Build and capture the merge base
        id: before
        if: steps.after.outcome == 'success'
        continue-on-error: true
        # The PR's own capture script, run from the base checkout so it serves that build.
        run: |
          git worktree add "$RUNNER_TEMP/base" "$(git merge-base HEAD origin/master)"
          cd "$RUNNER_TEMP/base"
          npm ci
          npm run build
          node "$GITHUB_WORKSPACE/scripts/screens.ts" --no-build --out "$RUNNER_TEMP/before"
      - name: Review page
        id: review
        if: steps.before.outcome == 'success'
        continue-on-error: true
        run: >-
          node scripts/screens.ts --before "$RUNNER_TEMP/before" --after "$RUNNER_TEMP/after"
          --review build/_review

      - name: Deploy to Cloudflare Pages
        run: |
          printf '/*\n  X-Robots-Tag: noindex\n' > build/_headers
          npx wrangler pages deploy build --project-name="$PROJECT" --branch="pr-$PR" \
            --commit-hash="$SHA" --commit-dirty=true
      - name: Comment on the PR
        env:
          GITHUB_TOKEN: ${{ github.token }}
          PREVIEW_URL: https://pr-${{ github.event.pull_request.number }}.${{ vars.CLOUDFLARE_PAGES_DOMAIN || 'jocelynrenault-previews.pages.dev' }}
          RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
          REVIEW_SUMMARY_FILE: ${{ steps.review.outcome == 'success' && 'build/_review/summary.txt' || '' }}
        run: node scripts/post-preview-comment.ts
```

- [ ] **Step 3: Validate the YAML syntax**

Run: `node -e "const y=require('fs').readFileSync('.github/workflows/preview.yml','utf8'); if(/\t/.test(y)) throw 'tab'; console.log('ok')" && npx --yes @action-validator/cli@0.6.0 .github/workflows/preview.yml`
Expected: `ok`, then no errors from action-validator. (If `@action-validator/cli@0.6.0` cannot be fetched, run `npx --yes yaml-lint .github/workflows/preview.yml` for syntax only and say so in the task report; the real test is Task 8.)

- [ ] **Step 4: Add the "PR previews" section to `docs/deploy.md`** (after the "GitHub secrets" section, before "Manual deploy")

```markdown
## PR previews

Every PR into `master` also gets a **preview** on Cloudflare Pages (workflow **Preview**, `.github/workflows/preview.yml`). It is not production: OVH still only gets what is merged.

- Address: `https://pr-<n>.jocelynrenault-previews.pages.dev` (one per PR, updated on every push). The bot's comment on the PR links `/en/`, `/fr/` and the review page.
- `/_review/` in each preview: the screens (EN/FR × dark/light × 360–1440px, phone sections open, before JavaScript) that differ from where the PR branched from `master`, as before, after and diff. Readable on a phone.
- Not tested by a preview: `.htaccess` (so `/` does not redirect to a language) and OVH's caching and headers. The smoke test after a merge checks those on the live site.
- Every page is served with `X-Robots-Tag: noindex`.
- Not a required check: a failed preview never blocks a merge. Re-run it from the PR's *Checks* tab.
- Without the secrets below (or on a PR from a fork) the workflow does nothing and says so in its log.

### One-time setup

1. Create a free account at https://dash.cloudflare.com/sign-up.
2. *Workers & Pages* → *Create* → *Pages* → *Use direct upload* (not "Connect to Git"). Project name `jocelynrenault-previews`, then *Create project*. Skip the upload it then offers. In the project's *Settings*, the production branch should be `master` (nothing is ever deployed to it, so the production address stays empty).
3. If the project's address is not `jocelynrenault-previews.pages.dev` (the name may be taken), set it: `gh variable set CLOUDFLARE_PAGES_DOMAIN` and enter the address without `https://`.
4. *My Profile* → *API Tokens* → *Create Token* → *Create Custom Token*. Permissions: *Account* · *Cloudflare Pages* · *Edit*. Account resources: *Include* your account. Create it and copy the token (shown once).
5. Your account ID: on the *Workers & Pages* overview page, right column (*Account ID*).
6. In the repo directory:

   ```bash
   gh secret set CLOUDFLARE_API_TOKEN    # the token from step 4
   gh secret set CLOUDFLARE_ACCOUNT_ID   # the ID from step 5
   ```

7. Open any PR (or push to one): the **Preview** run should end with a comment on the PR.

To revoke: delete the token in Cloudflare, then `gh secret delete CLOUDFLARE_API_TOKEN`.
```

Also add one line to step 1 of "How the site goes online": after "...(performance is shown, not required, in CI)." add " The **Preview** workflow also deploys the PR to its own address (see [PR previews](#pr-previews))."

- [ ] **Step 5: Check, lint, test, commit**

```bash
npm run check && npm run lint && npm test
git add package.json package-lock.json .github/workflows/preview.yml docs/deploy.md
git commit -m "feat: preview of every PR on Cloudflare Pages, with its review page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: The per-issue routine in CLAUDE.md and the README

**Files:**
- Modify: `CLAUDE.md` (Commands; "Smaller work goes issue by issue" list)
- Modify: `README.md` (Stack; a new "Working on several issues at once" section before "Layout")

- [ ] **Step 1: CLAUDE.md, Commands.** Replace the `npm run screens` bullet with:

```markdown
- `npm run screens`: builds, then captures the site (EN/FR × dark/light × 360–1440px, phone collapsibles open, before hydration; 25 full pages) into `reports/screens-baseline/`. `npm run screens -- --compare` captures again and compares pixel by pixel, writing diff images to `reports/screens-diff/` (exit 1 on any difference). Take the baseline before a refactor, compare after each step. `--out <dir>` captures elsewhere, `--no-build` serves the existing build; `--before <dir> --after <dir> --review <dir>` writes the review page that CI publishes in each PR preview.
- `npm run audit` and `npm run screens` serve the build on a free port, so several worktrees can run them at once. `npm run dev` takes the next free port too: read the URL it prints.
```

And after the `npm run deploy` bullet:

```markdown
- PR previews: the **Preview** workflow deploys every PR to `https://pr-<n>.jocelynrenault-previews.pages.dev` with a before/after page at `/_review/`, and links both in a PR comment (`docs/deploy.md`, "PR previews").
```

- [ ] **Step 2: CLAUDE.md, issue workflow.** Replace the block from "Smaller work goes **issue by issue**" to its step 5 with:

```markdown
Smaller work goes **issue by issue**, without a plan file. The same routine works in a terminal opened for one issue (`claude --worktree issue-<n>-<slug>`) and for an agent dispatched from another session:

1. One worktree and branch per issue (`issue-<n>-<slug>`), then `npm ci` in it. Small related issues may share a PR.
2. Read the issue (`gh issue view <n>`) and check it still holds (the code may have moved on). Unclear, or a choice that is the user's to make: ask before writing code. A dispatched agent stops and reports the question instead of guessing.
3. Fix it, tests first when there is logic. Run `npm run check`, `npm test`, `npm run lint`; `npm run audit` when the UI changed.
4. Fetch and rebase on `origin/master` (Git notes), push, open the PR with `Closes #<n>` and a short "what to look at" list. A review guide in `docs/reviews/` only when the change is big enough to need one.
5. Wait for the **Preview** comment on the PR (`gh pr view <n> --comments`), open its `/_review/` page and check that only intended screens changed. If not, fix and push again.
6. Stop. The user reviews (often on the phone, from the preview) and merges. "Address the review on PR #<n>" means: read the comments (`gh pr view <n> --comments` and `gh api repos/LezardSC/portfolio/pulls/<n>/comments`), fix, push, and answer each one.

**Dispatching several issues** ("work on #47 #48 #50" in one session): read each issue and guess which files it touches. Issues likely to touch the same files run one after another; the others run in parallel, one background agent per issue (Agent tool, `isolation: "worktree"`), each told to follow the routine above and to stop at step 6. Report each PR with its preview link, and any question an agent stopped on.
```

- [ ] **Step 3: README.** In "Stack", after the CI bullet, add:

```markdown
- Every PR also gets a preview on Cloudflare Pages, with a before/after page of the screens it changes
```

And add before "## Layout":

```markdown
## Working on several issues at once

Each issue gets its own git worktree and branch, so several can be worked on in parallel (one terminal each with `claude --worktree issue-<n>-<slug>`, or dispatched from one session). `npm run audit` and `npm run screens` pick free ports, so they can run in several worktrees at the same time.

Each PR is then reviewed from its preview, linked in a comment on the PR: the site itself, and `/_review/`, which shows every screen the PR changed (both languages, both themes, phone to desktop) before and after. Both work on a phone. See [PR previews](docs/deploy.md#pr-previews).
```

- [ ] **Step 4: Lint, commit**

```bash
npm run lint
git add CLAUDE.md README.md
git commit -m "docs: routine for parallel issue work, reviewed from PR previews

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Try it on this feature's own PR (with Jocelyn's setup)

This task needs the Cloudflare setup, which only Jocelyn can do. Run it in the main session, not a subagent.

**Files:**
- Create: `docs/reviews/2026-10-16-parallel-work-previews.md`

- [ ] **Step 1: Open an issue and the PR**

```bash
git fetch && git log --oneline HEAD..origin/master   # empty, or rebase onto origin/master first (CLAUDE.md, Git notes)
gh issue create --title "Previews of each PR, parallel-safe scripts, routine for parallel issue work" \
  --label tooling --body "Spec: docs/superpowers/specs/2026-10-16-parallel-work-previews-design.md"
git push origin worktree-parallel-previews:parallel-previews
gh pr create --base master --head parallel-previews --title "PR previews on Cloudflare Pages and parallel issue work" \
  --body "Closes #<issue>. ... (summary, what to look at, setup needed, then the attribution line)"
```

- [ ] **Step 2: Check the no-secrets path.** `gh run list --workflow Preview --limit 1` then `gh run view <id>`: the `secrets` job passed with the notice "No Cloudflare secrets…", the `preview` job was skipped, the run is green, `checks` (CI) is green.

- [ ] **Step 3: Jocelyn does the one-time setup** (`docs/deploy.md`, "PR previews", steps 1 to 6). Wait for them to say it is done, then re-run: `gh run rerun <id>`.

- [ ] **Step 4: Check the preview.**
  - The run is green; the PR has one comment from `github-actions[bot]` starting with the marker.
  - `curl -sI https://pr-<n>.jocelynrenault-previews.pages.dev/en/ | grep -i -E '^(HTTP|x-robots-tag)'` → `200` and `x-robots-tag: noindex`.
  - `/fr/` answers 200. `/_review/` says "No visual change" (this PR changes no page).

- [ ] **Step 5: Check the review page with a real change.** Push a throwaway commit that changes something visible (`src/app.css`, as in Task 4 Step 4), wait for the run: the *same* comment is edited (not a second one), `/_review/` lists changed screens, open it at 360px and 1280px with Playwright and Read the screenshots. Then drop the commit: `git reset --hard HEAD~1` and `git push --force-with-lease=parallel-previews:<sha of the throwaway commit> origin worktree-parallel-previews:parallel-previews`. Wait for the run: back to "No visual change".

- [ ] **Step 6: Review guide** `docs/reviews/2026-10-16-parallel-work-previews.md`, in the style of the existing guides: what changed and why, what to try (open the preview from the phone, the review page, start two issues in parallel), the setup done, known limits (no `.htaccess` in previews, the review page is unavailable when the base cannot be captured). Commit, push.

- [ ] **Step 7: Before saying it is ready:** `git fetch`, `git log HEAD..origin/master` empty (else rebase, re-run checks, force-with-lease push), `gh pr view <n> --json mergeStateStatus` is `CLEAN`. Stop: Jocelyn reviews and merges.
