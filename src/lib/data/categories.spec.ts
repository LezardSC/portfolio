import { describe, expect, it } from 'vitest';
import { mixHex } from '$lib/color';
import { LANGS } from '$lib/i18n/lang';
import { DOMAIN_TILE } from '$lib/projects';
import { contrastRatio } from '$lib/skills';
import { CONTEXT_IDS, CONTEXTS, DOMAIN_IDS, DOMAINS } from './categories';
import { isIconPath } from './icons';

/** Page text colours per theme (src/app.css), checked against the phone tiles. */
const TEXT = {
	light: { body: '#2b2a26', muted: '#56534c' },
	dark: { body: '#d9d5cb', muted: '#a9a498' }
} as const;

describe('domains', () => {
	it.each(DOMAIN_IDS)('%s has a label in both languages, a #rrggbb colour and an icon', (d) => {
		for (const lang of LANGS) expect(DOMAINS[d].label[lang].trim(), lang).not.toBe('');
		expect(DOMAINS[d].color).toMatch(/^#[0-9a-f]{6}$/i);
		expect(isIconPath(DOMAINS[d].icon)).toBe(true);
	});

	it.each(DOMAIN_IDS)('%s has a colour whose phone tile reads at 4.5:1 in both themes', (d) => {
		for (const theme of ['light', 'dark'] as const) {
			const { base, pct, fg } = DOMAIN_TILE[theme];
			const bg = mixHex(DOMAINS[d].color, base, pct);
			const label = mixHex(DOMAINS[d].color, '#ffffff', fg);
			expect(contrastRatio(label, bg), `${theme} label`).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(TEXT[theme].body, bg), `${theme} body`).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(TEXT[theme].muted, bg), `${theme} muted`).toBeGreaterThanOrEqual(4.5);
		}
	});

	it('gives every domain its own colour', () => {
		const colors = DOMAIN_IDS.map((d) => DOMAINS[d].color.toLowerCase());
		expect(new Set(colors).size).toBe(colors.length);
	});

	it('has kebab-case keys', () => {
		for (const d of DOMAIN_IDS) expect(d).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});
});

describe('contexts', () => {
	it.each(CONTEXT_IDS)('%s has a label in both languages', (c) => {
		for (const lang of LANGS) expect(CONTEXTS[c].label[lang].trim(), lang).not.toBe('');
	});
});
