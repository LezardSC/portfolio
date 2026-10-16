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

const BASELINE = 'reports/screens-baseline';
const CURRENT = 'reports/screens-current';
const DIFF = 'reports/screens-diff';

async function shoot(browser: Browser, origin: string, c: Capture): Promise<Buffer> {
	const context = await browser.newContext({
		viewport: { width: c.width, height: 900 },
		colorScheme: c.theme,
		reducedMotion: 'reduce'
	});
	const page = await context.newPage();
	if (c.noJs) await page.route('**/_app/**/*.js', (route) => route.abort());
	await page.goto(`${origin}/${c.lang}/`, { waitUntil: 'networkidle' });
	if (c.open) await openCollapsibles(page);
	await settle(page);
	const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
	await context.close();
	return png;
}

/**
 * Loads every lazy image and waits for fonts, so two captures of the same code are equal.
 * Lazy images only start loading near the viewport: scroll through the page first.
 */
async function settle(page: Page): Promise<void> {
	await page.evaluate(async () => {
		for (const img of document.images) img.loading = 'eager';
		for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
			scrollTo(0, y);
			await new Promise(requestAnimationFrame);
		}
		scrollTo(0, 0);
	});
	await page.waitForFunction(() =>
		[...document.images].every((img) => img.complete && img.naturalWidth > 0)
	);
	await page.evaluate(async () => {
		await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
		await document.fonts.ready;
	});
	await page.waitForLoadState('networkidle');
}

type PixelDiff = { count: number; size: string; box: string; image: string };

/** Pixel comparison in the browser: changed-pixel count, bounding box and a diff image. */
function pixelDiff(page: Page, a: Buffer, b: Buffer): Promise<PixelDiff> {
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
				return {
					count: -1,
					size: `${ia.width}×${ia.height} → ${ib.width}×${ib.height}`,
					box: '',
					image: ''
				};
			const draw = (img: HTMLImageElement) => {
				const canvas = document.createElement('canvas');
				[canvas.width, canvas.height] = [img.width, img.height];
				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(img, 0, 0);
				return { canvas, ctx, data: ctx.getImageData(0, 0, img.width, img.height) };
			};
			const before = draw(ia).data.data;
			const out = draw(ib);
			const px = out.data.data;
			let count = 0;
			let [x0, y0, x1, y1] = [Infinity, Infinity, -1, -1];
			for (let i = 0; i < px.length; i += 4) {
				if (
					before[i] === px[i] &&
					before[i + 1] === px[i + 1] &&
					before[i + 2] === px[i + 2] &&
					before[i + 3] === px[i + 3]
				) {
					// Fade unchanged pixels so the red changes stand out.
					for (let k = 0; k < 3; k++) px[i + k] = px[i + k] * 0.3 + 178;
					continue;
				}
				count++;
				const x = (i / 4) % ia.width;
				const y = Math.floor(i / 4 / ia.width);
				[x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
				[px[i], px[i + 1], px[i + 2], px[i + 3]] = [255, 0, 0, 255];
			}
			out.ctx.putImageData(out.data, 0, 0);
			return {
				count,
				size: '',
				box: count ? `${x1 - x0 + 1}×${y1 - y0 + 1} at (${x0}, ${y0})` : '',
				image: count ? out.canvas.toDataURL('image/png').split(',')[1] : ''
			};
		},
		[a.toString('base64'), b.toString('base64')] as const
	);
}

async function main(): Promise<void> {
	const compare = process.argv.includes('--compare');
	if (compare && !existsSync(BASELINE)) throw new Error('No baseline: run npm run screens first.');
	const dir = compare ? CURRENT : BASELINE;
	for (const d of compare ? [dir, DIFF] : [dir]) {
		rmSync(d, { recursive: true, force: true });
		mkdirSync(d, { recursive: true });
	}
	const { origin, stop } = await startPreview();
	const results: Result[] = [];
	try {
		await capture(origin, compare, dir, results);
	} finally {
		stop();
	}
	if (!compare) {
		console.log(`\nBaseline: ${captures().length} captures in ${BASELINE}/`);
		return;
	}
	console.log(`\n${formatResults(results)}`);
	process.exitCode = results.every((r) => r.same) ? 0 : 1;
}

async function capture(
	origin: string,
	compare: boolean,
	dir: string,
	results: Result[]
): Promise<void> {
	const browser = await chromium.launch();
	try {
		const diffPage = await browser.newPage();
		for (const c of captures()) {
			const png = await shoot(browser, origin, c);
			writeFileSync(`${dir}/${c.name}.png`, png);
			if (!compare) continue;
			const base = readFileSync(`${BASELINE}/${c.name}.png`);
			if (base.equals(png)) {
				results.push({ name: c.name, same: true, detail: 'identical' });
				continue;
			}
			const d = await pixelDiff(diffPage, base, png);
			if (d.count === 0) results.push({ name: c.name, same: true, detail: 'same pixels' });
			else if (d.count < 0)
				results.push({ name: c.name, same: false, detail: `page size ${d.size}` });
			else {
				writeFileSync(`${DIFF}/${c.name}.png`, Buffer.from(d.image, 'base64'));
				results.push({ name: c.name, same: false, detail: `${d.count} px in ${d.box}` });
			}
		}
	} finally {
		await browser.close();
	}
}

await main();
