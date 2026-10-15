import { describe, expect, it } from 'vitest';
import { isLang, localeHref, localize, pickLang } from './lang';

describe('isLang', () => {
	it('accepts supported locales', () => {
		expect(isLang('en')).toBe(true);
		expect(isLang('fr')).toBe(true);
	});
	it('rejects anything else, case-sensitively', () => {
		for (const v of ['de', 'EN', 'Fr', '', 'en-US']) expect(isLang(v)).toBe(false);
	});
});

describe('pickLang', () => {
	it('picks fr for any French regional variant', () => {
		expect(pickLang(['fr-FR'])).toBe('fr');
		expect(pickLang(['fr-CA', 'en-US'])).toBe('fr');
		expect(pickLang(['FR'])).toBe('fr');
	});
	it('skips unsupported languages to the first supported one', () => {
		expect(pickLang(['de-DE', 'fr-FR'])).toBe('fr');
		expect(pickLang(['es', 'en-GB', 'fr'])).toBe('en');
	});
	it('falls back to en', () => {
		expect(pickLang(['de-DE', 'ja'])).toBe('en');
		expect(pickLang([])).toBe('en');
	});
});

describe('localeHref', () => {
	it('builds a trailing-slash locale URL from an empty (domain-root) base', () => {
		expect(localeHref('', 'en')).toBe('/en/');
		expect(localeHref('', 'fr')).toBe('/fr/');
	});
	it('builds a locale URL from a relative base', () => {
		expect(localeHref('.', 'en')).toBe('./en/');
		expect(localeHref('..', 'fr')).toBe('../fr/');
	});
	it('builds a locale URL from an absolute sub-path base', () => {
		expect(localeHref('/portfolio', 'en')).toBe('/portfolio/en/');
		expect(localeHref('/portfolio', 'fr')).toBe('/portfolio/fr/');
	});
});

describe('localize', () => {
	it('keeps a plain string and picks the language of a { en, fr } text', () => {
		expect(localize('Rust', 'fr')).toBe('Rust');
		expect(localize({ en: 'Networks', fr: 'Réseaux' }, 'fr')).toBe('Réseaux');
	});
});
