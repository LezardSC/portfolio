import { describe, expect, it } from 'vitest';
import { contrastRatio, THEME_BG } from '$lib/skills';
import { CONTACT_BRANDS } from './contact-icons';

describe('contact brand icons', () => {
	it.each(Object.entries(CONTACT_BRANDS))('%s has a path and a 6-digit hex colour', (_, icon) => {
		expect(icon.path).toMatch(/^M/);
		expect(icon.hex).toMatch(/^[0-9A-F]{6}$/i);
	});

	it.each(Object.entries(CONTACT_BRANDS))('%s is drawn in a square viewBox', (_, icon) => {
		const [, , w, h] = (icon.viewBox ?? '0 0 24 24').split(' ').map(Number);
		expect(w).toBeGreaterThan(0);
		expect(w).toBe(h);
	});

	it('gives LinkedIn a lighter blue on the dark theme', () => {
		const dark = CONTACT_BRANDS.linkedin.dark ?? '';
		expect(dark).toMatch(/^[0-9A-F]{6}$/i);
		expect(contrastRatio(dark, THEME_BG.dark)).toBeGreaterThanOrEqual(4.5);
	});
});
