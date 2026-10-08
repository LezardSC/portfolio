import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DOMAIN_TILE } from './projects';

const css = readFileSync(resolve(fileURLToPath(new URL('../app.css', import.meta.url))), 'utf8');

/** Custom properties declared in the first block that starts with `selector`. */
function tokens(selector: string): Map<string, string> {
	const start = css.indexOf(selector);
	if (start < 0) throw new Error(`no block ${selector}`);
	const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
	return new Map([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

const dark = tokens(':root {');
const light = tokens(":root[data-theme='light'] {");
const noJsLight = tokens(':root:not([data-theme]) {');

const THEMED = [
	'--bg',
	'--surface',
	'--text',
	'--on-text',
	'--body',
	'--muted',
	'--border',
	'--rule',
	'--tag',
	'--accent',
	'--on-accent',
	'--tint',
	'--ok',
	'--ok-dot',
	'--ok-ring',
	'--footer-bg',
	'--footer-text',
	'--malt-tile',
	'--tile-base',
	'--tile-pct',
	'--tile-fg'
];

describe('theme tokens in src/app.css', () => {
	it('has the phone tile values of DOMAIN_TILE', () => {
		const pct = (n: number) => `${Math.round(n * 100)}%`;
		expect(light.get('--tile-base')).toBe(DOMAIN_TILE.light.base);
		expect(light.get('--tile-pct')).toBe(pct(DOMAIN_TILE.light.pct));
		expect(light.get('--tile-fg')).toBe(pct(DOMAIN_TILE.light.fg));
		expect(dark.get('--tile-base')).toBe(DOMAIN_TILE.dark.base);
		expect(dark.get('--tile-pct')).toBe(pct(DOMAIN_TILE.dark.pct));
		expect(dark.get('--tile-fg')).toBe(pct(DOMAIN_TILE.dark.fg));
	});

	it.each(THEMED)('%s is set in the dark, light and no-JS light blocks', (name) => {
		expect(dark.get(name), `dark ${name}`).toBeTruthy();
		expect(light.get(name), `light ${name}`).toBeTruthy();
		expect(noJsLight.get(name), `no-JS ${name}`).toBeTruthy();
	});

	it('uses the same light values with and without JS', () => {
		for (const name of THEMED) expect(noJsLight.get(name), name).toBe(light.get(name));
	});

	it('has the M9 palette', () => {
		expect(dark.get('--bg')).toBe('#121210');
		expect(dark.get('--accent')).toBe('#ff7f5e');
		expect(light.get('--bg')).toBe('#faf8f4');
		expect(light.get('--accent')).toBe('#c2391b');
	});
});
