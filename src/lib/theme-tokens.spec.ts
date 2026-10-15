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
	return Object.fromEntries(
		[...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
	);
}
const dark = tokens(':root {');
const light = tokens(":root[data-theme='light'] {");
const noJsLight = tokens(':root:not([data-theme]) {');

/** CSS color-mix(in srgb, a w, b) for #rrggbb colours; `w` from 0 to 1. */
function mix(a: string, w: number, b: string): string {
	const ch = (h: string, i: number) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
	const out = [0, 1, 2].map((i) => Math.round(ch(a, i) * w + ch(b, i) * (1 - w)));
	return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
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
		for (const [theme, t] of [
			['dark', dark],
			['light', light]
		] as const) {
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
		for (const t of [
			'--on-photo',
			'--on-photo-body',
			'--on-photo-muted',
			'--on-photo-domain',
			'--on-photo-award'
		])
			expect(contrastRatio(dark[t], ground), t).toBeGreaterThanOrEqual(4.5);
		const tagAlpha = parseFloat(dark['--photo-tag'].match(/\/\s*([\d.]+)\)/)![1]);
		const tagGround = mix('#ffffff', tagAlpha, ground);
		expect(contrastRatio(dark['--on-photo-soft'], tagGround), 'tag').toBeGreaterThanOrEqual(4.5);
	});
});
