import { describe, expect, it } from 'vitest';
import { LANGS } from '$lib/i18n/lang';
import { CONTEXT_IDS, CONTEXTS, DOMAIN_IDS, DOMAINS } from './categories';
import { isIconPath } from './icons';

describe('domains', () => {
	it.each(DOMAIN_IDS)('%s has a label in both languages, a #rrggbb colour and an icon', (d) => {
		for (const lang of LANGS) expect(DOMAINS[d].label[lang].trim(), lang).not.toBe('');
		expect(DOMAINS[d].color).toMatch(/^#[0-9a-f]{6}$/i);
		expect(isIconPath(DOMAINS[d].icon)).toBe(true);
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
