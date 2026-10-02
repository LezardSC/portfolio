import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OVERLAY, overlayBackdrop } from './overlay';
import { contrastRatio } from './skills';

describe('overlayBackdrop', () => {
	it('composites black at the given alpha over white', () => {
		expect(overlayBackdrop(0)).toBe('#ffffff');
		expect(overlayBackdrop(1)).toBe('#000000');
		expect(overlayBackdrop(0.75)).toBe('#404040');
	});
});

describe('phone overlay on large project cards', () => {
	// Worst case: a pure-white image under the lightest part of the gradient behind text.
	const backdrop = overlayBackdrop(OVERLAY.alpha);
	it.each(['text', 'muted', 'accent'] as const)('%s reaches 4.5:1 over a white image', (key) => {
		expect(contrastRatio(OVERLAY[key], backdrop)).toBeGreaterThanOrEqual(4.5);
	});

	it('matches the CSS of ProjectCardLarge.svelte', () => {
		const css = readFileSync(
			resolve('src/lib/components/projects/ProjectCardLarge.svelte'),
			'utf8'
		);
		expect(css).toContain(`rgb(0 0 0 / ${OVERLAY.alpha}) 2.5rem`);
		expect(css).toContain(`--text: ${OVERLAY.text};`);
		expect(css).toContain(`--muted: ${OVERLAY.muted};`);
		expect(css).toContain(`--accent: ${OVERLAY.accent};`);
	});
});
