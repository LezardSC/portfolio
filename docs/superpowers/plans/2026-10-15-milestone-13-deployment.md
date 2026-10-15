# Milestone 13 - Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the site online at `https://jocelynrenault.com` on the OVH free hosting, with absolute SEO URLs, a server config, a 404 page, mobile Lighthouse ≥ 95, CI on every PR, branch protection, and an automatic FTP deploy on merge to `master`.

**Architecture:** One site-origin constant (`src/lib/site.ts`) feeds canonical / hreflang / `og:*` / sitemap / robots. A static `.htaccess` handles redirects, caching, compression and headers on Apache. Deploy is a Node script (`basic-ftp`) driven by a pure, tested plan function; GitHub Actions runs CI on PRs and pushes, and a second workflow deploys after CI succeeds on `master`, then smoke-checks the live site.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, adapter-static, Vite 8, Vitest 4, Playwright 1.63, Lighthouse 13, TypeScript 6, Node 24, `basic-ftp` 6, GitHub Actions, Apache 2.4 (OVH shared hosting).

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section "Milestone 13 - Deployment".

## Global Constraints

- The domain `jocelynrenault.com` is written only in `src/lib/site.ts` (`SITE_ORIGIN`). `.htaccess` stays host-agnostic (captures the host from the request).
- Canonical host: bare domain; `http` and `www` → `https://jocelynrenault.com` (301).
- Build budget: **80 MB** (`80 * 1024 * 1024` bytes), enforced in CI and before every deploy.
- Lighthouse: accessibility, best-practices, SEO = 100 block (locally and in CI); performance ≥ 95 blocks locally, is report-only in CI (`--ci`).
- No HSTS in this milestone. No change to the contact email. Media stays in `static/projects/`.
- Every Apache directive that needs a module sits inside `<IfModule>`. No `Options` directive (OVH may forbid it and answer 500).
- Runes only; SvelteKit config stays in `vite.config.ts` (no `svelte.config.js`); build locale URLs with `localeHref(base, lang)` and `base` from `$app/paths` in Svelte code.
- UI text only in `src/lib/i18n/en.ts` / `fr.ts`, same keys in both; French uses `’` like the rest of `fr.ts`.
- Test rule (from M12): add a test only if it catches a breakage nobody would see while editing, or that the screenshot comparison cannot see.
- After every task: `npm test`, `npm run check`, `npm run lint`, `npm run build` clean, and `npm run screens -- --compare` with no difference (Task 4 may produce differences only if Jocelyn approves them). One commit per task, message ending with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Bpc1BL8RhHGNJ6NHg9ay54
  ```
- Work in the worktree `/home/lezard/portfolio/.claude/worktrees/milestone-13-deployment` (branch `worktree-milestone-13-deployment`; remote branch `milestone-13-deployment`, push with `git push origin worktree-milestone-13-deployment:milestone-13-deployment`). Run `source ~/.nvm/nvm.sh` first (Node 24). `node_modules` is a symlink to the main checkout's: after `npm install basic-ftp` (Task 5), run it in the worktree so `package.json` / `package-lock.json` change there, then check the symlink still resolves.
- The repo is public since 2026-10-15: never commit credentials; `.env.deploy` is covered by the existing `.env.*` ignore rule.

## Review Focus

1. **HTTPS detection behind OVH's front proxy:** `%{HTTPS}` may read `off` on every request and loop forever. Expected: the rule tests `%{SERVER_PORT}` (OVH's documented way) and the smoke check requests `https://host/en/` and expects 200, not 301 (Task 3, Task 5 smoke list).
2. **Accept-Language edge cases:** q-values, `*`, empty header, uppercase `FR`, a tag starting with `fr` that is another language (`fry`), French listed after an unsupported language. Expected: the `.htaccess` regex chooses exactly what `pickLang` chooses (Task 3, Step 1).
3. **A deploy interrupted halfway:** the next deploy must repair the server. Expected: the manifest is written only after all uploads, and a file missing on the server is uploaded again even if the old manifest lists it with the same hash (Task 5, Step 1).
4. **404 at depth:** `/a/b/c/` served with `404.html` must still load its CSS and font. Expected: no relative `./` or `../` URL in `build/404.html` (Task 2, Step 6), and the smoke check fetches a nested unknown URL (Task 5).
5. **First deploy on a non-empty `www/`:** OVH puts its own files there (`.ovhconfig`, a default `index.html`). Expected: `.ovhconfig` and the manifest are never deleted (Task 5, Step 1), and `--dry-run` prints the deletions for Jocelyn to read before the first real deploy (Task 7 checklist).

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `scripts/audit.ts`, `scripts/audit-report.ts` (+ spec) | JSON report, 404 axe checks, `--ci` report-only performance, no pending-domain | 0, 1, 2, 6 |
| `src/lib/site.ts` (+ spec, new) | `SITE_ORIGIN`, `absoluteUrl` | 1 |
| `src/lib/seo.ts` (+ spec, new) | `alternates`, `sitemapXml`, `robotsTxt` | 1 |
| `src/routes/sitemap.xml/+server.ts`, `src/routes/robots.txt/+server.ts` (new) | Prerendered sitemap and robots | 1 |
| `static/robots.txt` | deleted (now generated) | 1 |
| `src/routes/[lang=lang]/+page.svelte`, `src/routes/+page.svelte` | canonical, absolute alternates, `og:url`, absolute `og:image` | 1 |
| `src/routes/404/+page.ts`, `+page.svelte` (new) | Bilingual 404 → `build/404.html` | 2 |
| `vite.config.ts` | `paths.relative: false`; maybe `inlineStyleThreshold` | 2, 4 |
| `src/lib/i18n/en.ts`, `fr.ts` | `notFound` keys | 2 |
| `static/.htaccess` (new), `src/lib/htaccess.spec.ts` (new) | Server config; language rule agrees with `pickLang` | 3 |
| `scripts/budget.ts` (+ spec, new) | `listFiles`, `checkBudget`, CLI `npm run budget` | 5 |
| `scripts/deploy-plan.ts` (+ spec, new) | Pure `planDeploy` | 5 |
| `scripts/deploy.ts` (new) | FTP upload, `--dry-run` | 5 |
| `scripts/smoke.ts` (new) | Live checks after deploy | 5 |
| `.github/workflows/ci.yml`, `deploy.yml` (new) | CI and deploy | 6 |
| `docs/deploy.md` (new), `CLAUDE.md`, `README.md`, `docs/content-guide.md`, `docs/backlog.md`, `docs/reviews/milestone-13-review-guide.md` (new) | Docs | 7 |

---

### Task 0: Safety net and performance baseline

**Files:**
- Modify: `scripts/audit.ts` (Lighthouse also writes JSON)

**Interfaces:**
- Produces: `reports/lighthouse-mobile.json` and `reports/lighthouse-desktop.json` after `npm run audit` (used in Task 4).

- [ ] **Step 1: Screenshot baseline**

Run: `source ~/.nvm/nvm.sh && npm run screens`
Expected: 25 captures in `reports/screens-baseline/`. Then run `npm run screens -- --compare` once: expected 0 differences (proves captures are stable).

- [ ] **Step 2: Write the Lighthouse JSON next to the HTML**

In `scripts/audit.ts`, `lighthouseChecksFor()`: change `output: 'html'` to `output: ['html', 'json']`, and replace the `writeFileSync(... String(result.report))` line with:

```ts
			const [html, json] = result.report as string[];
			writeFileSync(`${OUT}/lighthouse-${label}.html`, html);
			writeFileSync(`${OUT}/lighthouse-${label}.json`, json);
```

- [ ] **Step 3: Record the baseline (3 runs)**

Run `npm run audit` three times. Each time, note the `Lighthouse mobile performance` line of the table (the audit exits 1 because of it until Task 4: expected), then print the metrics:

```bash
node -e "const r=require('./reports/lighthouse-mobile.json');for(const id of ['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index'])console.log(id,r.audits[id].displayValue)"
```

Expected: mobile performance 93–94 (known), SEO passing only as "pending domain". Write the three runs into a scratch note; they go into the review guide (Task 7).

- [ ] **Step 4: Check and commit**

Run: `npm run check && npm run lint && npm test`
```bash
git add scripts/audit.ts
git commit -m "chore: audit also writes the Lighthouse JSON reports"
```

---

### Task 1: Site origin, absolute SEO URLs, sitemap and robots

**Files:**
- Create: `src/lib/site.ts`, `src/lib/site.spec.ts`, `src/lib/seo.ts`, `src/lib/seo.spec.ts`, `src/routes/sitemap.xml/+server.ts`, `src/routes/robots.txt/+server.ts`
- Modify: `src/routes/[lang=lang]/+page.svelte`, `src/routes/+page.svelte`, `scripts/audit-report.ts`, `scripts/audit-report.spec.ts`
- Delete: `static/robots.txt`

**Interfaces:**
- Produces: `SITE_ORIGIN: string`, `absoluteUrl(base: string, path: string, origin?: string): string` (in `src/lib/site.ts`, **no imports**, so Node scripts can import it as `../src/lib/site.ts`); `type Alternate = { hreflang: string; href: string }`, `alternates(base: string): Alternate[]`, `sitemapXml(base: string): string`, `robotsTxt(base: string): string` (in `src/lib/seo.ts`).

- [ ] **Step 1: Write the failing tests**

`src/lib/site.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { absoluteUrl, SITE_ORIGIN } from './site';

describe('absoluteUrl', () => {
	it('joins the origin, the base and the path with single slashes', () => {
		expect(absoluteUrl('', '/en/')).toBe(`${SITE_ORIGIN}/en/`);
		expect(absoluteUrl('/portfolio', 'og-en.png')).toBe(`${SITE_ORIGIN}/portfolio/og-en.png`);
		expect(absoluteUrl('/portfolio/', '/en/')).toBe(`${SITE_ORIGIN}/portfolio/en/`);
	});

	it('gives the site root for an empty path', () => {
		expect(absoluteUrl('', '')).toBe(`${SITE_ORIGIN}/`);
	});

	it('is https without a trailing slash, so joins stay single-slashed', () => {
		expect(SITE_ORIGIN).toMatch(/^https:\/\/[^/]+$/);
	});
});
```

`src/lib/seo.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { LANGS } from './i18n/lang';
import { alternates, robotsTxt, sitemapXml } from './seo';
import { SITE_ORIGIN } from './site';

describe('alternates', () => {
	it('lists every locale, then x-default on the root', () => {
		expect(alternates('')).toEqual([
			...LANGS.map((lang) => ({ hreflang: lang, href: `${SITE_ORIGIN}/${lang}/` })),
			{ hreflang: 'x-default', href: `${SITE_ORIGIN}/` }
		]);
	});
});

describe('sitemapXml', () => {
	it('has one <url> per locale, each with every alternate', () => {
		const xml = sitemapXml('');
		expect(xml.match(/<url>/g)).toHaveLength(LANGS.length);
		for (const lang of LANGS) expect(xml).toContain(`<loc>${SITE_ORIGIN}/${lang}/</loc>`);
		expect(xml.match(/<xhtml:link /g)).toHaveLength(LANGS.length * (LANGS.length + 1));
	});
});

describe('robotsTxt', () => {
	it('allows everything and points to the sitemap', () => {
		expect(robotsTxt('')).toBe(`User-agent: *\nDisallow:\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
	});
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/lib/site.spec.ts src/lib/seo.spec.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement**

`src/lib/site.ts`:
```ts
/** Public address of the site: the only place the domain is written. No trailing slash. */
export const SITE_ORIGIN = 'https://jocelynrenault.com';

/**
 * Absolute URL of a path under `base`, e.g. absoluteUrl('/portfolio', 'en/') →
 * 'https://jocelynrenault.com/portfolio/en/'. No imports: Node scripts load this file directly.
 */
export function absoluteUrl(base: string, path: string, origin = SITE_ORIGIN): string {
	return `${origin}${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
```

`src/lib/seo.ts`:
```ts
import { LANGS, localeHref } from './i18n/lang';
import { absoluteUrl } from './site';

export type Alternate = { hreflang: string; href: string };

/** Absolute hreflang alternates: every locale, then x-default on `/` (the language redirect). */
export function alternates(base: string): Alternate[] {
	return [
		...LANGS.map((lang) => ({ hreflang: lang, href: absoluteUrl(base, localeHref('', lang)) })),
		{ hreflang: 'x-default', href: absoluteUrl(base, '') }
	];
}

export function sitemapXml(base: string): string {
	const links = alternates(base)
		.map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`)
		.join('');
	const urls = LANGS.map(
		(lang) => `<url><loc>${absoluteUrl(base, localeHref('', lang))}</loc>${links}</url>`
	).join('');
	return (
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
		`${urls}</urlset>\n`
	);
}

export function robotsTxt(base: string): string {
	return `User-agent: *\nDisallow:\n\nSitemap: ${absoluteUrl(base, 'sitemap.xml')}\n`;
}
```

`src/routes/sitemap.xml/+server.ts` (layout page options do not apply to endpoints, so `prerender` is set here):
```ts
import { base } from '$app/paths';
import { sitemapXml } from '$lib/seo';

export const prerender = true;

export const GET = () =>
	new Response(sitemapXml(base), { headers: { 'Content-Type': 'application/xml' } });
```

`src/routes/robots.txt/+server.ts`:
```ts
import { base } from '$app/paths';
import { robotsTxt } from '$lib/seo';

export const prerender = true;

export const GET = () => new Response(robotsTxt(base), { headers: { 'Content-Type': 'text/plain' } });
```

Delete `static/robots.txt` (`git rm static/robots.txt`).

- [ ] **Step 4: Use them in the page heads**

`src/routes/[lang=lang]/+page.svelte`: add the imports
```ts
	import { alternates } from '$lib/seo';
	import { absoluteUrl } from '$lib/site';
```
remove the `assetHref` import if it is no longer used, add `const canonical = $derived(absoluteUrl(base, localeHref('', data.lang)));` after `const t = ...`, and replace the two `<link rel="alternate" …>` lines, the M11 comment and the `og:image` line with:
```svelte
	<link rel="canonical" href={canonical} />
	{#each alternates(base) as alt (alt.hreflang)}
		<link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
	{/each}
```
then, after `<meta property="og:type" …>`:
```svelte
	<meta property="og:url" content={canonical} />
```
and in place of the old `og:image`:
```svelte
	<meta property="og:image" content={absoluteUrl(base, `og-${data.lang}.png`)} />
```

`src/routes/+page.svelte`: import `alternates` from `$lib/seo` and add inside `<svelte:head>`, after `<title>`:
```svelte
	{#each alternates(base) as alt (alt.hreflang)}
		<link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
	{/each}
```

- [ ] **Step 5: Remove "pending domain" from the audit**

`scripts/audit-report.ts`: delete `DOMAIN_PENDING_AUDITS` (and its comment) and the two lines starting `if (failed.length > 0 && failed.every(`. `scripts/audit-report.spec.ts`: delete the test `lets SEO pass as "pending domain" when only domain-bound audits fail`; change the next test to:
```ts
	it('fails SEO when an audit fails, and names it', () => {
		const c = byCategory('mobile', summary({ seo: 0.92 }, ['hreflang']));
		expect(c.seo.ok).toBe(false);
		expect(c.seo.detail).toBe('92 < 100 (failed: hreflang)');
	});
```

- [ ] **Step 6: Verify**

Run: `npm test && npm run check && npm run lint && npm run build`
Then: `ls build/sitemap.xml build/robots.txt && cat build/robots.txt && grep -o '<link rel="canonical"[^>]*>\|hreflang="[^"]*" href="[^"]*"\|og:image" content="[^"]*"' build/en/index.html`
Expected: both files exist (if the build wrote `build/sitemap.xml/index.html` instead, add `export const trailingSlash = 'never';` to both endpoints and rebuild); canonical `https://jocelynrenault.com/en/`, three absolute alternates, absolute `og:image`.
Then: `npm run audit` → Lighthouse SEO 100 on mobile and desktop, no "pending" (the run still exits 1 on mobile performance until Task 4). `npm run screens -- --compare` → 0 differences.

- [ ] **Step 7: Commit**
```bash
git add -A src/lib/site.ts src/lib/site.spec.ts src/lib/seo.ts src/lib/seo.spec.ts src/routes scripts/audit-report.ts scripts/audit-report.spec.ts static/robots.txt
git commit -m "feat: absolute canonical, hreflang and og URLs from one site origin; sitemap and robots"
```

---

### Task 2: 404 page and absolute asset paths

**Files:**
- Create: `src/routes/404/+page.ts`, `src/routes/404/+page.svelte`
- Modify: `vite.config.ts`, `src/lib/i18n/en.ts`, `src/lib/i18n/fr.ts`, `scripts/audit.ts`

**Interfaces:**
- Consumes: `localeHref` (`src/lib/i18n/lang.ts`), `en`, `fr` dictionaries.
- Produces: `build/404.html` (served by `ErrorDocument 404 /404.html` in Task 3); dictionary key `notFound: { title, text, home }`.

- [ ] **Step 1: Absolute asset URLs**

The 404 page is served at any depth (`/a/b/c/`), so the build must stop emitting `../_app/…`. In `vite.config.ts`, inside `sveltekit({ … })`, next to `adapter: adapter()`, add:
```ts
			// Absolute /_app/… URLs: 404.html is served at any depth, where relative ones break.
			paths: { relative: false },
```

- [ ] **Step 2: Dictionary keys**

`src/lib/i18n/en.ts`, add a top-level key (after `meta`):
```ts
	notFound: {
		title: 'Page not found',
		text: 'This page does not exist, or it has moved.',
		home: 'Go to the site in English'
	},
```
`src/lib/i18n/fr.ts`, same place:
```ts
	notFound: {
		title: 'Page introuvable',
		text: 'Cette page n’existe pas, ou elle a été déplacée.',
		home: 'Aller sur le site en français'
	},
```

- [ ] **Step 3: The page**

`src/routes/404/+page.ts` (`never` makes the file `build/404.html`; no JS on this page):
```ts
export const trailingSlash = 'never';
export const csr = false;
```

`src/routes/404/+page.svelte` (the URL tells no language, so both are shown; `<html lang>` is `en` via `hooks.server.ts`, the French block says so itself):
```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import { en } from '$lib/i18n/en';
	import { fr } from '$lib/i18n/fr';
	import { LANGS, localeHref } from '$lib/i18n/lang';

	const dicts = { en, fr };
</script>

<svelte:head>
	<title>{en.notFound.title} · {fr.notFound.title}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="not-found">
	<p class="code" aria-hidden="true">404</p>
	<h1>
		{en.notFound.title}<span class="sep" aria-hidden="true"> · </span><span lang="fr"
			>{fr.notFound.title}</span
		>
	</h1>
	{#each LANGS as lang (lang)}
		<p {lang}>
			{dicts[lang].notFound.text}
			<a href={localeHref(base, lang)} hreflang={lang}>{dicts[lang].notFound.home}</a>
		</p>
	{/each}
</main>

<style>
	.not-found {
		box-sizing: border-box;
		min-height: 100vh;
		max-width: 40rem;
		margin: 0 auto;
		padding: var(--gutter);
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 1rem;
		color: var(--body);
	}
	.code {
		margin: 0;
		font-size: 4rem;
		font-weight: 800;
		line-height: 1;
		color: var(--accent);
	}
	h1 {
		margin: 0;
		color: var(--text);
		font-size: 1.75rem;
		line-height: 1.2;
	}
	p {
		margin: 0;
		line-height: 1.5;
	}
	a {
		color: var(--text);
		font-weight: 600;
	}
</style>
```
Check `src/app.css` styles `body` (background, font); if `body` has no background there, add none here: the 404 must look like the site, not define its own theme. If `LANGS` order makes the French block come first, keep it: it follows `lang.ts`.

- [ ] **Step 4: Audit the 404 page**

`scripts/audit.ts`, at the end of `browserChecks` before `return checks;`:
```ts
	// The 404 page (no JS), both themes.
	for (const theme of THEMES) {
		const context = await browser.newContext({ viewport: { width: 360, height: 800 }, colorScheme: theme });
		const page = await context.newPage();
		await page.goto(`${ORIGIN}/404.html`);
		checks.push(await axe(page, `/404.html ${theme} 360px`, `404-${theme}`));
		await context.close();
	}
```

- [ ] **Step 5: Look at it**

Run `npm run build && npx vite preview --port 4182` in the background, then screenshot `http://localhost:4182/404.html` at 360 and 1280px, dark and light, with Playwright (headless Chromium, as in `scripts/screens.ts`), and look at the four images. Expected: centred block, accent `404`, both languages readable, the site font loaded. Stop the server.

- [ ] **Step 6: Verify no relative URL**

Run: `grep -o '\(href\|src\)="\.\{1,2\}/[^"]*"' build/404.html build/en/index.html | head`
Expected: no output. Also `grep -o 'url([^)]*)' build/_app/immutable/assets/*.css | grep -v '^.*url(/' | head` → no relative `url()` for the font (if Vite keeps CSS-relative font URLs inside the CSS file, that is fine: they resolve against the CSS file, not the page).
Then `npm test && npm run check && npm run lint && npm run audit` (0 axe violations including the 404 checks) and `npm run screens -- --compare` → 0 differences.

- [ ] **Step 7: Commit**
```bash
git add vite.config.ts src/routes/404 src/lib/i18n/en.ts src/lib/i18n/fr.ts scripts/audit.ts
git commit -m "feat: bilingual 404 page; absolute asset paths so it works at any depth"
```

---

### Task 3: Server config (`.htaccess`)

**Files:**
- Create: `static/.htaccess`, `src/lib/htaccess.spec.ts`

**Interfaces:**
- Consumes: `LANGS`, `pickLang` (`src/lib/i18n/lang.ts`); `build/404.html` (Task 2); `.deploy-manifest.json` name (Task 5 uses the same literal).

- [ ] **Step 1: Write the failing test**

`src/lib/htaccess.spec.ts`:
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LANGS, pickLang } from './i18n/lang';

const htaccess = readFileSync(new URL('../../static/.htaccess', import.meta.url), 'utf8');

/** The Accept-Language pattern of the `/` → /fr/ rule, as Apache (PCRE, [NC]) would apply it. */
function frenchRule(): RegExp {
	const line = htaccess.split('\n').find((l) => l.includes('RewriteCond %{HTTP:Accept-Language}'));
	if (!line) throw new Error('no Accept-Language rule in static/.htaccess');
	return new RegExp(line.trim().split(/\s+/)[2], 'i');
}

const headerPrefs = (h: string) =>
	h.split(',').map((part) => part.split(';')[0].trim()).filter(Boolean);

describe('static/.htaccess', () => {
	it('redirects exactly the locales of lang.ts (update the rules when one is added)', () => {
		expect(LANGS).toEqual(['en', 'fr']);
		expect(htaccess).toContain('RewriteRule ^$ /fr/ [R=302');
		expect(htaccess).toContain('RewriteRule ^$ /en/ [R=302');
	});

	it.each([
		'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
		'en-US,en;q=0.9,fr;q=0.8',
		'de-DE,de;q=0.9,fr;q=0.8',
		'de-DE,es;q=0.9',
		'FR',
		'fr-CA',
		'fry,fr;q=0.5',
		'fry',
		'*',
		'',
		'en-GB, fr'
	])('chooses what pickLang chooses for "%s"', (header) => {
		const htaccessLang = frenchRule().test(header) ? 'fr' : 'en';
		expect(htaccessLang).toBe(pickLang(headerPrefs(header)));
	});

	it('serves the 404 page and hides the deploy manifest', () => {
		expect(htaccess).toContain('ErrorDocument 404 /404.html');
		expect(htaccess).toContain('.deploy-manifest.json');
	});
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/lib/htaccess.spec.ts` → FAIL (file not found).

- [ ] **Step 3: Write `static/.htaccess`**

```apache
# Apache config for the OVH hosting (copied into build/ by the build).
# Every directive that needs a module is inside <IfModule>: a missing module drops that feature
# instead of failing every request with a 500. No "Options" line: OVH may not allow it.
# Locale paths (/en/, /fr/) are written here because this file has no access to base or LANGS;
# src/lib/htaccess.spec.ts fails when lang.ts changes.

ErrorDocument 404 /404.html

<IfModule mod_rewrite.c>
	RewriteEngine On

	# 1. One canonical address: https, no www (a single 301). The host is taken from the request.
	#    SERVER_PORT, not HTTPS: OVH's front proxy can hide HTTPS from Apache (OVH's own advice).
	RewriteCond %{SERVER_PORT} ^80$ [OR]
	RewriteCond %{HTTP_HOST} ^www\. [NC]
	RewriteCond %{HTTP_HOST} ^(?:www\.)?(.+)$ [NC]
	RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L]

	# 2. / → the visitor's language, like pickLang(): the first of en/fr in Accept-Language wins.
	#    302 and not cached, so a visitor changing language preferences is not stuck.
	#    The JS redirect page at / stays as the fallback when this does not run.
	RewriteCond %{HTTP:Accept-Language} ^(?:\s*(?!(?:en|fr)(?![a-z]))[a-z*]{1,8}(?:-[a-z0-9]{1,8})*(?:\s*;\s*q=[0-9.]+)?\s*,)*\s*fr(?![a-z]) [NC]
	RewriteRule ^$ /fr/ [R=302,L,E=LANGREDIRECT:1]
	RewriteRule ^$ /en/ [R=302,L,E=LANGREDIRECT:1]
</IfModule>

<IfModule mod_headers.c>
	# Caching: one week by default; HTML, sitemap and robots revalidate on every visit, so a
	# deploy shows at once; hashed files under _app/immutable never change, so one year.
	Header set Cache-Control "public, max-age=604800"
	<FilesMatch "\.(html|xml|txt)$">
		Header set Cache-Control "no-cache"
	</FilesMatch>
	<If "%{REQUEST_URI} =~ m#/_app/immutable/#">
		Header set Cache-Control "public, max-age=31536000, immutable"
	</If>
	Header always set Cache-Control "no-cache" env=LANGREDIRECT
	Header always merge Vary "Accept-Language" env=LANGREDIRECT

	# Security headers. HSTS comes later, once HTTPS has run cleanly (docs/backlog.md).
	Header always set X-Content-Type-Options "nosniff"
	Header always set Referrer-Policy "strict-origin-when-cross-origin"
	Header always set X-Frame-Options "DENY"
	Header always set Content-Security-Policy "frame-ancestors 'none'"
</IfModule>

<IfModule mod_deflate.c>
	<IfModule mod_filter.c>
		AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/xml application/javascript text/javascript application/json image/svg+xml
	</IfModule>
</IfModule>

<IfModule mod_mime.c>
	AddType font/woff2 .woff2
	AddType image/webp .webp
	AddType video/webm .webm
</IfModule>

# The deploy manifest (file hashes) is for the deploy script, not for visitors.
<IfModule mod_authz_core.c>
	<Files ".deploy-manifest.json">
		Require all denied
	</Files>
</IfModule>
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/lib/htaccess.spec.ts` → PASS. If one header case disagrees, fix the regex, not the case (the case encodes `pickLang`'s behaviour).

- [ ] **Step 5: The file reaches build/**

Run: `npm run build && ls -la build/.htaccess`
Expected: present. If the build skips dotfiles, stop and report (do not rename the file).

- [ ] **Step 6: Check and commit**

Run: `npm test && npm run check && npm run lint` (if Prettier complains about `.htaccess`, it should not: it has no parser for it; if it does, add `static/.htaccess` to `.prettierignore`).
```bash
git add static/.htaccess src/lib/htaccess.spec.ts
git commit -m "feat: Apache config: https and bare-domain redirects, language on /, caching, compression, headers"
```

---

### Task 4: Mobile performance ≥ 95

**Files:**
- Modify (depending on findings): `vite.config.ts`, `src/routes/+layout.svelte`, the component holding the mobile LCP element.

**Interfaces:**
- Consumes: `reports/lighthouse-mobile.json` (Task 0).

This task is measured, not guessed: each change is kept only if it improves the mobile score over 3 runs, and every kept change must leave `npm run screens -- --compare` at 0 differences (any visual difference is shown to Jocelyn and kept only if approved).

- [ ] **Step 1: Read what Lighthouse blames**

After `npm run audit`:
```bash
node -e "
const r=require('./reports/lighthouse-mobile.json');
const a=Object.values(r.audits).filter(x=>x.score!==null&&x.score<1&&x.scoreDisplayMode!=='informative'&&x.scoreDisplayMode!=='notApplicable');
for(const x of a)console.log(x.id,'|',x.title,'|',x.displayValue??'');
const lcp=r.audits['largest-contentful-paint-element']??r.audits['lcp-breakdown-insight'];
console.log(JSON.stringify(lcp?.details,null,1).slice(0,2000));"
```
Write down: the LCP element (selector and snippet), render-blocking resources and their savings, the LCP phases (TTFB, load delay, load time, render delay).

- [ ] **Step 2: Try 1 - inline the CSS**

In `vite.config.ts`, inside `sveltekit({ … })`, add `inlineStyleThreshold: 64 * 1024,` (all of the site's CSS, ~41 KB, goes into the HTML). Run `npm run audit` 3 times; note the mobile score and FCP/LCP. Keep it if the median rises; else remove it.

- [ ] **Step 3: Try 2 - the font**

Check in `build/en/index.html` that the preloaded woff2 is the latin file the hero text uses, and that `@font-face` in the built CSS has `font-display: swap`. If the LCP is text and Lighthouse reports a font-related render delay, test removing the preload (it competes with the CSS on a slow link): 3 runs, keep the better.

- [ ] **Step 4: Try 3 - the LCP element**

If the LCP element is an image (hero or About photo on phones), make sure it is not `loading="lazy"`, has `fetchpriority="high"` and explicit `width`/`height`. If it is text that starts hidden (scroll reveal at opacity 0 before hydration), make sure the hero is never hidden by the reveal (the first section must be visible in the prerendered HTML). 3 runs each, keep what helps.

- [ ] **Step 5: Compression parity**

Run: `npx vite preview --port 4183 &` then `curl -sI -H 'Accept-Encoding: gzip' http://localhost:4183/en/ | grep -i content-encoding` and the same for one `_app/immutable/**/*.js`. Expected: `gzip` (vite preview compresses, like `mod_deflate`). If not, report it in the review guide: the local score would then be pessimistic, not optimistic. Stop the server.

- [ ] **Step 6: Done criteria**

`npm run audit` three times in a row: mobile performance ≥ 95 each time, desktop 100, every other check PASS. `npm run screens -- --compare`: 0 differences (or only approved ones). If after Steps 2–4 the score is still < 95, **stop and report to Jocelyn** with the Step 1 notes and each try's numbers; do not try unlisted changes without asking.

- [ ] **Step 7: Commit**
```bash
git add -A vite.config.ts src
git commit -m "perf: <what was kept, e.g. inline CSS> - mobile Lighthouse ≥ 95"
```
(The commit body lists each try with its median score, kept or dropped.)

---

### Task 5: Size budget, deploy script and smoke check

**Files:**
- Create: `scripts/budget.ts`, `scripts/budget.spec.ts`, `scripts/deploy-plan.ts`, `scripts/deploy-plan.spec.ts`, `scripts/deploy.ts`, `scripts/smoke.ts`
- Modify: `package.json`, `package-lock.json` (dependency `basic-ftp`, scripts `budget`, `deploy`, `smoke`)

**Interfaces:**
- Consumes: `SITE_ORIGIN` from `../src/lib/site.ts` (no imports inside, so Node loads it).
- Produces: `BUDGET_BYTES = 80 * 1024 * 1024`; `type FileSize = { path: string; size: number }`; `listFiles(dir: string): FileSize[]` (POSIX paths relative to `dir`, sorted); `checkBudget(files: readonly FileSize[], limit?: number): { ok: boolean; total: number; largest: FileSize[] }`; `formatBudget(r): string`; `type Manifest = Record<string, string>`; `MANIFEST = '.deploy-manifest.json'`; `KEEP: readonly string[]`; `planDeploy(local: Manifest, remote: Manifest, remoteFiles: readonly string[]): { uploads: string[]; deletes: string[] }`. npm scripts `budget`, `deploy` (reads `.env.deploy` if present), `smoke`. Env: `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`, optional `FTP_DIR` (default `www`), optional `FTP_SECURE` (`false` for plain FTP; default FTPS).

- [ ] **Step 1: Write the failing tests**

`scripts/budget.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { BUDGET_BYTES, checkBudget } from './budget';

const MB = 1024 * 1024;

describe('checkBudget', () => {
	it('passes at the limit and fails one byte over', () => {
		expect(checkBudget([{ path: 'a', size: BUDGET_BYTES }]).ok).toBe(true);
		expect(checkBudget([{ path: 'a', size: BUDGET_BYTES }, { path: 'b', size: 1 }]).ok).toBe(false);
	});

	it('lists the ten largest files, largest first', () => {
		const files = Array.from({ length: 12 }, (_, i) => ({ path: `f${i}`, size: (i + 1) * MB }));
		const r = checkBudget(files);
		expect(r.total).toBe(78 * MB);
		expect(r.largest.map((f) => f.path)).toEqual(['f11', 'f10', 'f9', 'f8', 'f7', 'f6', 'f5', 'f4', 'f3', 'f2']);
	});
});
```

`scripts/deploy-plan.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { MANIFEST, planDeploy } from './deploy-plan';

describe('planDeploy', () => {
	it('uploads new and changed files, skips unchanged ones', () => {
		const plan = planDeploy({ 'a.js': '1', 'b.js': '2', 'c.js': '3' }, { 'a.js': '1', 'b.js': 'old' }, [
			'a.js',
			'b.js'
		]);
		expect(plan.uploads).toEqual(['b.js', 'c.js']);
	});

	it('uploads again a file the manifest lists but the server lacks (interrupted deploy)', () => {
		expect(planDeploy({ 'a.js': '1' }, { 'a.js': '1' }, []).uploads).toEqual(['a.js']);
	});

	it('uploads assets first, then .htaccess, then HTML pages', () => {
		const local = { 'en/index.html': 'h', '.htaccess': 'x', '_app/x.js': 'j', '404.html': 'n', 'cv.pdf': 'p' };
		expect(planDeploy(local, {}, []).uploads).toEqual([
			'_app/x.js',
			'cv.pdf',
			'.htaccess',
			'404.html',
			'en/index.html'
		]);
	});

	it('deletes stale files but never OVH config or the manifest', () => {
		const plan = planDeploy({ 'a.js': '1' }, {}, ['a.js', 'old.js', '.ovhconfig', MANIFEST, 'x/old.png']);
		expect(plan.deletes).toEqual(['old.js', 'x/old.png']);
	});
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run scripts/budget.spec.ts scripts/deploy-plan.spec.ts` → FAIL.

- [ ] **Step 3: Implement the pure parts**

`scripts/budget.ts`:
```ts
/**
 * npm run budget
 * Fails when build/ is over the hosting budget (the OVH free hosting has 100 MB; 80 leaves room
 * for the files OVH keeps there), and lists the largest files so you know what to shrink.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BUDGET_BYTES = 80 * 1024 * 1024;

export type FileSize = { path: string; size: number };

/** Every file under `dir`, as POSIX paths relative to it, sorted. */
export function listFiles(dir: string): FileSize[] {
	return readdirSync(dir, { recursive: true, withFileTypes: true })
		.filter((e) => e.isFile())
		.map((e) => {
			const full = join(e.parentPath, e.name);
			return { path: relative(dir, full).split(sep).join('/'), size: statSync(full).size };
		})
		.sort((a, b) => a.path.localeCompare(b.path));
}

export function checkBudget(files: readonly FileSize[], limit = BUDGET_BYTES) {
	const total = files.reduce((sum, f) => sum + f.size, 0);
	const largest = [...files].sort((a, b) => b.size - a.size).slice(0, 10);
	return { ok: total <= limit, total, largest };
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function formatBudget(r: ReturnType<typeof checkBudget>, limit = BUDGET_BYTES): string {
	const head = `${r.ok ? 'PASS' : 'FAIL'}  build/ is ${mb(r.total)} (budget ${mb(limit)})`;
	return [head, 'Largest files:', ...r.largest.map((f) => `  ${mb(f.size).padStart(8)}  ${f.path}`)].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const result = checkBudget(listFiles('build'));
	console.log(formatBudget(result));
	process.exitCode = result.ok ? 0 : 1;
}
```

`scripts/deploy-plan.ts`:
```ts
/** Path → SHA-256 of the file's content. */
export type Manifest = Record<string, string>;

/** Written on the server after each deploy: what is there, so the next deploy sends only changes. */
export const MANIFEST = '.deploy-manifest.json';

/** Remote files the deploy never deletes: OVH's hosting config and the manifest. */
export const KEEP: readonly string[] = ['.ovhconfig', MANIFEST];

/** Assets first, then .htaccess, then HTML: a page never points at a file not uploaded yet. */
const rank = (path: string) => (path.endsWith('.html') ? 2 : path.endsWith('.htaccess') ? 1 : 0);

export function planDeploy(
	local: Manifest,
	remote: Manifest,
	remoteFiles: readonly string[]
): { uploads: string[]; deletes: string[] } {
	const onServer = new Set(remoteFiles);
	const uploads = Object.keys(local)
		.filter((path) => local[path] !== remote[path] || !onServer.has(path))
		.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
	const deletes = remoteFiles.filter((path) => !(path in local) && !KEEP.includes(path)).sort();
	return { uploads, deletes };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run scripts/budget.spec.ts scripts/deploy-plan.spec.ts` → PASS.

- [ ] **Step 5: Add `basic-ftp` and the npm scripts**

Run (in the worktree): `npm install --save-dev basic-ftp@^6.2.3`. In `package.json` `scripts`, add:
```json
		"budget": "node scripts/budget.ts",
		"deploy": "node --env-file-if-exists=.env.deploy scripts/deploy.ts",
		"smoke": "node scripts/smoke.ts"
```
Check `git check-ignore .env.deploy` prints `.env.deploy` (ignored by `.env.*`).

- [ ] **Step 6: The deploy script**

`scripts/deploy.ts`:
```ts
/**
 * npm run deploy [-- --dry-run]
 * Uploads build/ to the hosting over FTPS (FTP_SECURE=false for plain FTP): only new and changed
 * files (hashes compared with the manifest left by the previous deploy), assets before .htaccess
 * before HTML, then the manifest, then deletes the files no longer in build/.
 * Needs FTP_HOST, FTP_USER, FTP_PASSWORD (GitHub secrets, or .env.deploy locally); FTP_DIR
 * defaults to www. Run `npm run build` first. --dry-run prints the plan and changes nothing.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { Client } from 'basic-ftp';
import { checkBudget, formatBudget, listFiles } from './budget.ts';
import { MANIFEST, planDeploy, type Manifest } from './deploy-plan.ts';

const BUILD = 'build';
const dryRun = process.argv.includes('--dry-run');

function env(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set (a GitHub secret, or a line in .env.deploy)`);
	return value;
}

function localManifest(): Manifest {
	return Object.fromEntries(
		listFiles(BUILD).map(({ path }) => [
			path,
			createHash('sha256').update(readFileSync(`${BUILD}/${path}`)).digest('hex')
		])
	);
}

async function remoteManifest(client: Client, root: string): Promise<Manifest> {
	const chunks: Buffer[] = [];
	const sink = new Writable({
		write(chunk, _encoding, done) {
			chunks.push(chunk);
			done();
		}
	});
	try {
		await client.downloadTo(sink, `${root}/${MANIFEST}`);
		return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Manifest;
	} catch {
		return {}; // first deploy, or an unreadable manifest: everything is sent again
	}
}

async function remoteFiles(client: Client, root: string, sub = ''): Promise<string[]> {
	const files: string[] = [];
	for (const entry of await client.list(sub ? `${root}/${sub}` : root)) {
		if (entry.name === '.' || entry.name === '..') continue;
		const path = sub ? `${sub}/${entry.name}` : entry.name;
		if (entry.isDirectory) files.push(...(await remoteFiles(client, root, path)));
		else files.push(path);
	}
	return files;
}

async function main(): Promise<void> {
	const budget = checkBudget(listFiles(BUILD));
	console.log(formatBudget(budget));
	if (!budget.ok) throw new Error('build/ is over budget: nothing uploaded');
	const local = localManifest();

	const client = new Client(60_000);
	try {
		await client.access({
			host: env('FTP_HOST'),
			user: env('FTP_USER'),
			password: env('FTP_PASSWORD'),
			secure: process.env.FTP_SECURE !== 'false'
		});
		await client.cd(process.env.FTP_DIR || 'www');
		const root = await client.pwd();
		const plan = planDeploy(local, await remoteManifest(client, root), await remoteFiles(client, root));
		console.log(`\n${plan.uploads.length} to upload, ${plan.deletes.length} to delete (${root})`);
		for (const path of plan.deletes) console.log(`  delete ${path}`);
		if (dryRun) {
			for (const path of plan.uploads) console.log(`  upload ${path}`);
			return;
		}
		const made = new Set<string>();
		for (const path of plan.uploads) {
			const dir = posix.dirname(path);
			if (dir !== '.' && !made.has(dir)) {
				await client.ensureDir(`${root}/${dir}`);
				made.add(dir);
			}
			await client.uploadFrom(`${BUILD}/${path}`, `${root}/${path}`);
			console.log(`  sent ${path}`);
		}
		await client.uploadFrom(Readable.from([JSON.stringify(local)]), `${root}/${MANIFEST}`);
		for (const path of plan.deletes) await client.remove(`${root}/${path}`);
		console.log('Deploy done.');
	} finally {
		client.close();
	}
}

await main();
```
(`ensureDir` changes the working directory; every path above is absolute from `root`, so that does not matter.)

- [ ] **Step 7: The smoke check**

`scripts/smoke.ts`:
```ts
/**
 * npm run smoke
 * Checks the live site after a deploy: both locales with their canonical, the language redirect
 * on /, the https and www redirects, long caching on hashed files, the 404 page at depth.
 * Exits 1 on any failure.
 */
import { SITE_ORIGIN } from '../src/lib/site.ts';

type Check = { name: string; ok: boolean; detail: string };
const host = new URL(SITE_ORIGIN).host;

async function get(url: string): Promise<Response> {
	return fetch(url, { redirect: 'manual', headers: { 'Accept-Language': 'fr-FR,fr;q=0.9' } });
}

async function expectStatus(name: string, url: string, status: number, extra?: (r: Response, body: string) => string | null): Promise<Check> {
	try {
		const r = await get(url);
		const body = await r.text();
		if (r.status !== status) return { name, ok: false, detail: `${r.status}, expected ${status}` };
		const problem = extra?.(r, body) ?? null;
		return { name, ok: problem === null, detail: problem ?? String(r.status) };
	} catch (e) {
		return { name, ok: false, detail: String(e) };
	}
}

const location = (expected: string) => (r: Response) =>
	r.headers.get('location') === expected ? null : `location ${r.headers.get('location')}, expected ${expected}`;

async function main(): Promise<void> {
	const checks: Check[] = [];
	for (const lang of ['en', 'fr'])
		checks.push(
			await expectStatus(`/${lang}/ with its canonical`, `${SITE_ORIGIN}/${lang}/`, 200, (_r, body) =>
				body.includes(`<link rel="canonical" href="${SITE_ORIGIN}/${lang}/"`) ? null : 'canonical missing'
			)
		);
	checks.push(
		await expectStatus('/ redirects to the language', `${SITE_ORIGIN}/`, 302, (r) =>
			/\/fr\/$/.test(r.headers.get('location') ?? '') ? null : `location ${r.headers.get('location')}`
		),
		await expectStatus('http → https', `http://${host}/en/`, 301, location(`${SITE_ORIGIN}/en/`)),
		await expectStatus('www → bare domain', `https://www.${host}/en/`, 301, location(`${SITE_ORIGIN}/en/`)),
		await expectStatus('sitemap', `${SITE_ORIGIN}/sitemap.xml`, 200),
		await expectStatus('404 page at depth', `${SITE_ORIGIN}/no/such/page/`, 404, (_r, body) =>
			body.includes('noindex') && body.includes('/_app/immutable/') ? null : 'not the custom 404 page'
		)
	);
	const page = await (await get(`${SITE_ORIGIN}/en/`)).text();
	const asset = page.match(/\/_app\/immutable\/[^"']+\.(?:js|css)/)?.[0];
	checks.push(
		asset
			? await expectStatus('hashed asset cached one year', `${SITE_ORIGIN}${asset}`, 200, (r) =>
					(r.headers.get('cache-control') ?? '').includes('immutable') ? null : `cache-control ${r.headers.get('cache-control')}`
				)
			: { name: 'hashed asset cached one year', ok: false, detail: 'no /_app/immutable/ URL in /en/' }
	);
	for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}  ${c.detail}`);
	process.exitCode = checks.every((c) => c.ok) ? 0 : 1;
}

await main();
```

- [ ] **Step 8: Verify**

Run: `npm run build && npm run budget` → `PASS  build/ is 33.x MB (budget 80.0 MB)` and the list. Run `npm run deploy -- --dry-run` without credentials → it prints the budget, then fails with `FTP_HOST is not set (…)` (expected; the real dry run is Jocelyn's, Task 7). `npm test && npm run check && npm run lint` (run `npm run format` first if lint fails on the new files).

- [ ] **Step 9: Commit**
```bash
git add scripts/budget.ts scripts/budget.spec.ts scripts/deploy-plan.ts scripts/deploy-plan.spec.ts scripts/deploy.ts scripts/smoke.ts package.json package-lock.json
git commit -m "feat: size budget, FTP deploy script and live smoke check"
```

---

### Task 6: CI and deploy workflows

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
- Modify: `scripts/audit.ts`, `scripts/audit-report.ts`, `scripts/audit-report.spec.ts`

**Interfaces:**
- Consumes: npm scripts `lint`, `check`, `test`, `build`, `budget`, `audit`, `deploy`, `smoke`.
- Produces: CI job named **`checks`** (the required status check of Task 7); `npm run audit -- --ci`; `lighthouseChecks(label, summary, reportOnly?: readonly Category[])`.

- [ ] **Step 1: Failing test for report-only categories**

Add to `scripts/audit-report.spec.ts` inside `describe('lighthouseChecks')`:
```ts
	it('passes a report-only category under its target, showing the score', () => {
		const checks = lighthouseChecks('mobile', summary({ performance: 0.9 }), ['performance']);
		expect(checks[0]).toMatchObject({ ok: true, detail: '90 (report only, target 95)' });
		expect(lighthouseChecks('mobile', summary({ seo: 0.9 }), ['performance'])[3].ok).toBe(false);
	});
```
Run: `npx vitest run scripts/audit-report.spec.ts` → FAIL.

- [ ] **Step 2: Implement**

`scripts/audit-report.ts`: change the signature to `export function lighthouseChecks(label: string, summary: LighthouseSummary, reportOnly: readonly Category[] = []): Check[]` and, right after the `if (score >= target)` line, add:
```ts
		if (reportOnly.includes(category))
			return { name, ok: true, detail: `${pct(score)} (report only, target ${pct(target)})` };
```
`scripts/audit.ts`: update the header comment (add `--ci: Lighthouse performance is reported, not required (CI machines are too noisy); the table also goes to the GitHub job summary`), add `import { appendFileSync } from 'node:fs'` (merge into the existing `node:fs` import), and:
```ts
const CI = process.argv.includes('--ci');
```
pass `CI ? ['performance'] : []` as the third argument of `lighthouseChecks(...)`, and at the end of `main()`, after the `console.log`:
```ts
	if (process.env.GITHUB_STEP_SUMMARY)
		appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Audit\n\n\`\`\`\n${formatTable(checks)}\n\`\`\`\n`);
```
Run the test → PASS.

- [ ] **Step 3: Current action versions**

Run: `for a in checkout setup-node upload-artifact; do gh api repos/actions/$a/releases/latest --jq .tag_name; done`
Use the major of each (e.g. `v5`) below in place of `vN`.

- [ ] **Step 4: `.github/workflows/ci.yml`**

```yaml
# Every PR to master and every push to master: the same checks as locally.
# The job name "checks" is the required status check of master's branch protection.
name: CI

on:
  pull_request:
    branches: [master]
  push:
    branches: [master]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  checks:
    runs-on: ubuntu-24.04
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@vN
      - uses: actions/setup-node@vN
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run check
      - run: npm test
      - run: npm run build
      - run: npm run budget
      - run: npx playwright install --with-deps chromium
      - run: npm run audit -- --ci
      - uses: actions/upload-artifact@vN
        if: always()
        with:
          name: audit-reports
          path: reports/
          retention-days: 14
```

- [ ] **Step 5: `.github/workflows/deploy.yml`**

```yaml
# Deploys master to the OVH hosting once CI has passed on it (or by hand, from master only).
# A manual run repeats lint, check and test first, since no CI run vouches for it.
name: Deploy

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: deploy
  cancel-in-progress: false

jobs:
  deploy:
    if: >-
      (github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/master') ||
      (github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'push')
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@vN
        with:
          ref: ${{ github.event.workflow_run.head_sha || github.sha }}
      - uses: actions/setup-node@vN
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - if: github.event_name == 'workflow_dispatch'
        run: npm run lint && npm run check && npm test
      - run: npm run build
      - run: npm run budget
      - run: npm run deploy
        env:
          FTP_HOST: ${{ secrets.FTP_HOST }}
          FTP_USER: ${{ secrets.FTP_USER }}
          FTP_PASSWORD: ${{ secrets.FTP_PASSWORD }}
          FTP_SECURE: ${{ vars.FTP_SECURE }}
      - run: npm run smoke
```
(`vars.FTP_SECURE` is empty unless Jocelyn sets the repository variable to `false`, so FTPS is the default.)

- [ ] **Step 6: Verify locally**

Run: `npm run format && npm run lint && npm run check && npm test`. Run `npm run audit -- --ci` → the performance lines read `(report only, target 95)` only when under 95; everything else unchanged. `npm run screens -- --compare` → 0 differences.

- [ ] **Step 7: Commit**
```bash
git add .github scripts/audit.ts scripts/audit-report.ts scripts/audit-report.spec.ts
git commit -m "ci: checks on every PR and push to master; deploy after CI passes on master"
```

---

### Task 7: Docs, watch list, final checks, PR and branch protection

**Files:**
- Create: `docs/deploy.md`, `docs/reviews/milestone-13-review-guide.md`
- Modify: `CLAUDE.md`, `README.md`, `docs/content-guide.md`, `docs/backlog.md`

- [ ] **Step 1: `docs/deploy.md`**

Write it with these sections (plain, step by step, for Jocelyn on either machine):
1. **How the site goes online** - merge a PR into `master` → CI (`checks`) runs on `master` → the Deploy workflow builds, checks the budget, uploads over FTPS, runs `npm run smoke`. A red Deploy run emails GitHub's notification. Rollback: revert the PR on GitHub and merge the revert.
2. **One-time OVH setup** (OVH control panel, *Web Cloud*):
   - *Hébergements → jocelynrenault.com → Multisite*: both `jocelynrenault.com` and `www.jocelynrenault.com` point to the folder `www`, with SSL ticked (add `www` if missing).
   - *Informations générales → Certificat SSL*: order/enable the free Let's Encrypt certificate (it covers the multisite domains ticked above); wait until it shows active.
   - *Domaines → jocelynrenault.com → Zone DNS*: the `A` (and `AAAA`) records of the apex and `www` point to the hosting IP shown in *Hébergements → Informations générales* (OVH sets them when the hosting comes with the domain; check them).
   - *FTP - SSH*: note the server (`ftp.clusterNNN.hosting.ovh.net`) and login; set a password.
   - Note what the free hosting does not offer, as found during setup (FTPS, modules), here.
3. **GitHub secrets** - run, in the repo: `gh secret set FTP_HOST`, `gh secret set FTP_USER`, `gh secret set FTP_PASSWORD` (each prompts; the value is never shown). If FTPS is refused: `gh variable set FTP_SECURE --body false`.
4. **Manual deploy** - create `.env.deploy` (git-ignored) with `FTP_HOST=…`, `FTP_USER=…`, `FTP_PASSWORD=…`, then `npm run build && npm run deploy -- --dry-run` (prints uploads and deletions, changes nothing) and `npm run deploy`. Or GitHub → Actions → Deploy → *Run workflow* (master only).
5. **The size budget** - 80 MB, `npm run budget` lists the largest files; what to do near the limit (re-encode videos, see `docs/content-guide.md`; then external media hosting).
6. **Branch protection** - what it enforces (PR + green `checks`, no force-push, admins included) and the `gh api` command of Step 6 to re-apply it.

- [ ] **Step 2: CLAUDE.md, README, content guide**

- `CLAUDE.md` **Commands**: add `npm run budget` (80 MB build budget), `npm run deploy [-- --dry-run]` (FTP deploy, reads `.env.deploy`; normally CI does it), `npm run smoke` (checks the live site), `npm run audit -- --ci` (performance report-only). **Conventions**: "The domain lives only in `src/lib/site.ts` (`SITE_ORIGIN`); absolute URLs via `absoluteUrl(base, path)`." and "`static/.htaccess` is the Apache config; it hardcodes the locale paths, and `htaccess.spec.ts` fails when `lang.ts` changes." **Git notes**: "`master` is protected: changes go through a PR with green `checks`; merging deploys the site (see `docs/deploy.md`)."
- `README.md`: add the three commands and a link to `docs/deploy.md`; mention the live URL.
- `docs/content-guide.md` → section **Check your edit**: add "Publishing: open a PR; when it is merged, the site updates within minutes. `npm run budget` must pass (80 MB, media included)."

- [ ] **Step 3: Watch list**

`docs/backlog.md`: delete the English CV entry (done in bc6e2f2), the absolute URLs entry, the mobile performance entry (if Task 4 reached ≥ 95); replace the 32 MB videos entry with: "**Media in git and on OVH.** 33 MB of 100 MB hosting; `npm run budget` fails over 80 MB (CI and deploy). Near the limit: re-encode, then consider external media hosting." Add under *Later*: "**HSTS** (`Strict-Transport-Security`) in `static/.htaccess` once HTTPS has run cleanly for a few weeks: hard to undo, so not in M13." and "**FTPS**" if the hosting only allowed plain FTP. Rename the section *Before or at deployment (M13)* to *Before going public* if only `PRIORITY` is left there.

- [ ] **Step 4: Final checks**

Run: `npm test && npm run check && npm run lint && npm run build && npm run budget`, `npm run audit` three times (mobile ≥ 95 each, all PASS), `npm run screens -- --compare` (0 differences, or the approved ones).
Then the final review (superpowers:requesting-code-review on the whole branch, most capable model); fix Critical/Important findings, put deferred minors in `docs/backlog.md`.

- [ ] **Step 5: Review guide and PR**

`docs/reviews/milestone-13-review-guide.md`: what changed per task; the audit table (Task 0 baseline vs final, 3 runs each); the Task 4 tries with their scores; the 404 screenshots; **the merge checklist**, in order: (1) OVH setup (`docs/deploy.md` §2), (2) GitHub secrets (§3), (3) `npm run deploy -- --dry-run` from your machine with `.env.deploy`: read the deletions list, (4) merge the PR, (5) watch Actions → Deploy go green (smoke check included), (6) open the site, test a link preview (e.g. paste the URL in a LinkedIn draft), (7) run PageSpeed Insights on `https://jocelynrenault.com/en/` and send the scores to Claude for the guide.
Commit, push (`git push origin worktree-milestone-13-deployment:milestone-13-deployment`), open the PR with `gh pr create --base master --head milestone-13-deployment` (body: summary, link to the review guide, the merge checklist, ending with the PR attribution lines). Wait for the `checks` run on the PR; fix until green.

- [ ] **Step 6: Branch protection (after `checks` has run once on the PR)**

```bash
gh api -X PUT repos/LezardSC/portfolio/branches/master/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["checks"] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
gh api repos/LezardSC/portfolio/branches/master/protection --jq '{checks: .required_status_checks.contexts, admins: .enforce_admins.enabled, force: .allow_force_pushes.enabled}'
```
Expected: `{"checks":["checks"],"admins":true,"force":false}`. Tell Jocelyn it is on (it is an outward change to the repo settings: confirm with them before running it).

- [ ] **Step 7: Stop**

Do not merge. The merge is the first deploy and needs the checklist above done by Jocelyn.
