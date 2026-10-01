/**
 * npm run audit [-- --screens]
 * Builds the site, serves it with `vite preview`, then checks it: axe (both languages, both
 * themes, phone and desktop, menu open, no-JS), horizontal overflow at 360px, and Lighthouse
 * on /en/ (mobile and desktop). Prints a PASS/FAIL table, writes full reports to reports/,
 * and exits non-zero if anything failed. --screens also saves full-page screenshots.
 */
import { execSync, spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
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

const PORT = 4180;
const DEBUG_PORT = 9223;
const ORIGIN = `http://localhost:${PORT}`;
const OUT = 'reports';
const LANGS = ['en', 'fr'] as const;
const THEMES = ['dark', 'light'] as const;
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const SCREEN_WIDTHS = [360, 390, 768, 1024, 1440];

/**
 * Resolves once `vite preview` itself prints its URL. Polling the port instead could get an
 * answer from another server already on it (vite then exits on --strictPort), and audit that.
 */
function waitForPreview(server: ChildProcess, timeoutMs = 30_000): Promise<void> {
	return new Promise((resolve, reject) => {
		let output = '';
		const timer = setTimeout(
			() => reject(new Error('vite preview did not start in time')),
			timeoutMs
		);
		const onData = (chunk: Buffer) => {
			output += chunk.toString();
			if (output.includes(`:${PORT}`)) {
				clearTimeout(timer);
				resolve();
			}
		};
		server.stdout?.on('data', onData);
		server.stderr?.on('data', onData);
		server.on('exit', (code) => {
			clearTimeout(timer);
			reject(
				new Error(`vite preview exited (code ${code}); is port ${PORT} already in use?\n${output}`)
			);
		});
	});
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
				{ port: DEBUG_PORT, output: 'html', logLevel: 'error', onlyCategories: CATEGORIES },
				config
			);
			if (!result) throw new Error(`Lighthouse ${label} returned no result`);
			writeFileSync(`${OUT}/lighthouse-${label}.html`, String(result.report));
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
	rmSync(OUT, { recursive: true, force: true });
	mkdirSync(OUT, { recursive: true });
	execSync('npm run build', { stdio: 'inherit' });
	const server = spawn(
		'./node_modules/.bin/vite',
		['preview', '--port', String(PORT), '--strictPort'],
		{ stdio: ['ignore', 'pipe', 'pipe'] }
	);
	let checks: Check[] = [];
	try {
		await waitForPreview(server);
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
