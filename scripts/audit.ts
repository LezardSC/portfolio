/**
 * npm run audit [-- --screens]
 * Builds the site, serves it with `vite preview`, then checks it: axe (both languages, both
 * themes, phone and desktop, no-JS), horizontal overflow at 360px, and Lighthouse
 * on /en/ (mobile and desktop). Prints a PASS/FAIL table, writes full reports to reports/,
 * and exits non-zero if anything failed. --screens also saves full-page screenshots.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
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
	type Category,
	type Check
} from './audit-report.ts';
import { openCollapsibles, startPreview } from './preview.ts';

const PORT = 4180;
const DEBUG_PORT = 9223;
const ORIGIN = `http://localhost:${PORT}`;
const OUT = 'reports';
const LANGS = ['en', 'fr'] as const;
const THEMES = ['dark', 'light'] as const;
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const SCREEN_WIDTHS = [360, 390, 768, 1024, 1440];

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
					colorScheme: theme,
					// Scroll reveal keeps off-screen sections at opacity 0, and axe skips invisible
					// text: reduced motion shows every section, so its contrast is checked too.
					reducedMotion: 'reduce'
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
					// Phone collapsibles: open each kind once, then check what they reveal.
					await openCollapsibles(page);
					checks.push(await axe(page, `${label} collapsibles open`, `${file}-open`));
				}
				await context.close();
			}
	// Before hydration: the prerendered markup alone must be accessible. The app bundles are
	// blocked (axe itself needs JS, so JS stays on; the inline theme script still runs).
	const noJs = await browser.newContext({
		viewport: { width: 360, height: 800 },
		colorScheme: 'light'
	});
	const page = await noJs.newPage();
	await page.route('**/_app/**/*.js', (route) => route.abort());
	await page.goto(`${ORIGIN}/en/`);
	checks.push(await axe(page, '/en/ before hydration light 360px', 'en-nojs-360'));
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
					colorScheme: theme,
					// Scroll reveal keeps off-screen sections at opacity 0, and axe skips invisible
					// text: reduced motion shows every section, so its contrast is checked too.
					reducedMotion: 'reduce'
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
	// Lighthouse attaches to Playwright's own Chromium through its debugging port.
	// (chrome-launcher is not used: under WSL it converts paths to Windows ones.)
	const chrome = await chromium.launch({ args: [`--remote-debugging-port=${DEBUG_PORT}`] });
	try {
		const checks: Check[] = [];
		const runs = [
			['mobile', undefined],
			['desktop', desktopConfig]
		] as const;
		for (const [label, config] of runs) {
			const result = await lighthouse(
				`${ORIGIN}/en/`,
				{
					port: DEBUG_PORT,
					output: ['html', 'json'],
					logLevel: 'error',
					onlyCategories: CATEGORIES
				},
				config
			);
			if (!result) throw new Error(`Lighthouse ${label} returned no result`);
			const [html, json] = result.report as string[];
			writeFileSync(`${OUT}/lighthouse-${label}.html`, html);
			writeFileSync(`${OUT}/lighthouse-${label}.json`, json);
			const { categories, audits } = result.lhr;
			checks.push(
				...lighthouseChecks(label, {
					scores: Object.fromEntries(
						CATEGORIES.map((c) => [c, categories[c]?.score ?? null])
					) as Record<Category, number | null>,
					failedSeoAudits: (categories.seo?.auditRefs ?? [])
						.filter((ref) => ref.weight > 0 && (audits[ref.id]?.score ?? 1) < 1)
						.map((ref) => ref.id)
				})
			);
		}
		return checks;
	} finally {
		await chrome.close();
	}
}

async function main(): Promise<void> {
	// Clear the previous audit, but keep the screenshot baseline of `npm run screens`.
	mkdirSync(OUT, { recursive: true });
	for (const entry of readdirSync(OUT))
		if (!entry.startsWith('screens-')) rmSync(`${OUT}/${entry}`, { recursive: true, force: true });
	const stop = await startPreview(PORT);
	let checks: Check[] = [];
	try {
		const browser = await chromium.launch();
		try {
			checks = await browserChecks(browser);
			if (process.argv.includes('--screens')) await screenshots(browser);
		} finally {
			await browser.close();
		}
		checks.push(...(await lighthouseChecksFor()));
	} finally {
		stop();
	}
	console.log(`\n${formatTable(checks)}\n\nFull reports in ${OUT}/`);
	process.exitCode = allPassed(checks) ? 0 : 1;
}

await main();
