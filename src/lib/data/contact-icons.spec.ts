import { describe, expect, it } from 'vitest';
import { logoColor, THEME_BG } from '$lib/skills';
import { CONTACT_BRANDS } from './contact-icons';

describe('contact brand icons', () => {
	it('has a logo for LinkedIn, GitHub and Malt', () => {
		expect(Object.keys(CONTACT_BRANDS).sort()).toEqual(['github', 'linkedin', 'malt']);
	});

	it.each(Object.entries(CONTACT_BRANDS))('%s has a path and a 6-digit hex colour', (_, icon) => {
		expect(icon.path).toMatch(/^M/);
		expect(icon.hex).toMatch(/^[0-9A-F]{6}$/i);
	});

	it.each(Object.entries(CONTACT_BRANDS))(
		'%s shows its brand colour in at least one theme',
		(_, icon) => {
			const colours = [logoColor(icon.hex, THEME_BG.dark), logoColor(icon.hex, THEME_BG.light)];
			expect(colours).toContain(`#${icon.hex}`);
		}
	);
});
