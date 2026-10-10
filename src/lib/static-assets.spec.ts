import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LANGS } from '$lib/i18n/lang';

const staticFile = (name: string) =>
	resolve(fileURLToPath(new URL('../../static', import.meta.url)), name);

/** Width and height from a PNG's IHDR chunk. */
function pngSize(name: string): [number, number] {
	const buf = readFileSync(staticFile(name));
	expect(buf.subarray(1, 4).toString(), name).toBe('PNG');
	return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

describe('static icons and share images', () => {
	it('has the SVG favicon, the ICO fallback and the Apple touch icon', () => {
		for (const f of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png'])
			expect(existsSync(staticFile(f)), f).toBe(true);
		expect(pngSize('apple-touch-icon.png')).toEqual([180, 180]);
		expect(readFileSync(staticFile('favicon.ico')).readUInt16LE(2)).toBe(1);
	});

	it.each(LANGS)('has a 1200×630 share image for %s', (lang) => {
		expect(pngSize(`og-${lang}.png`)).toEqual([1200, 630]);
	});
});
