/**
 * Generates static/og-en.png, static/og-fr.png (1200×630 share images), static/apple-touch-icon.png
 * (180×180) and static/favicon.ico (32×32) from static/favicon.svg, with the site font and colours.
 * Run with `npm run og` after changing the favicon, the name or the role; commit the outputs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import type { Lang } from '../src/lib/i18n/lang.ts';
import { icoFromPng } from './ico.ts';

// Through Vite, so the data's `$lib/…` imports resolve (plain Node cannot).
const vite = await createServer({
	server: { middlewareMode: true },
	appType: 'custom',
	logLevel: 'error'
});
const [{ PROFILE }, { LANGS }] = await Promise.all([
	vite.ssrLoadModule('/src/lib/data/profile.ts') as Promise<
		typeof import('../src/lib/data/profile.ts')
	>,
	vite.ssrLoadModule('/src/lib/i18n/lang.ts') as Promise<typeof import('../src/lib/i18n/lang.ts')>
]);
await vite.close();

const font = readFileSync(
	'node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2'
).toString('base64');
const favicon = readFileSync('static/favicon.svg', 'utf8');
const svgData = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const FONT_CSS = `@font-face{font-family:S;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:400 900}
*{margin:0;box-sizing:border-box}body{font-family:S,sans-serif}`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function ogHtml(lang: Lang): string {
	return `<!doctype html><html><head><style>${FONT_CSS}</style></head><body>
<div style="width:1200px;height:630px;background:#FAF8F4;color:#141412;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between">
  <img src="${svgData(favicon)}" width="72" height="72" alt="">
  <div>
    <div style="font-size:118px;font-weight:900;line-height:.9;letter-spacing:-.055em;white-space:nowrap">${esc(PROFILE.name)}<span style="color:#C2391B">.</span></div>
    <div style="margin-top:32px;padding-top:28px;border-top:4px solid #141412;font-size:40px;font-weight:800;color:#C2391B">${esc(PROFILE.role[lang])}</div>
  </div>
</div></body></html>`;
}

const iconHtml = (svg: string, size: number) =>
	`<!doctype html><html><head><style>*{margin:0}</style></head><body><img src="${svgData(svg)}" width="${size}" height="${size}" alt=""></body></html>`;

const browser = await chromium.launch();
try {
	const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
	for (const lang of LANGS) {
		await page.setContent(ogHtml(lang));
		await page.evaluate(() => document.fonts.ready);
		writeFileSync(`static/og-${lang}.png`, await page.screenshot({ type: 'png' }));
	}
	// iOS rounds the corners itself: the touch icon is a full square.
	await page.setViewportSize({ width: 180, height: 180 });
	await page.setContent(iconHtml(favicon.replace('rx="12"', 'rx="0"'), 180));
	writeFileSync('static/apple-touch-icon.png', await page.screenshot({ type: 'png' }));
	await page.setViewportSize({ width: 32, height: 32 });
	await page.setContent(iconHtml(favicon, 32));
	const png32 = await page.screenshot({ type: 'png', omitBackground: true });
	writeFileSync('static/favicon.ico', icoFromPng(png32, 32));
} finally {
	await browser.close();
}
console.log('Wrote static/og-en.png, og-fr.png, apple-touch-icon.png, favicon.ico');
