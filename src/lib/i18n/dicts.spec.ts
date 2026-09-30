import { describe, expect, it } from 'vitest';
import { SECTIONS } from '$lib/sections';
import { CONTEXTS, DOMAINS, SORTS } from '$lib/projects';
import { MEDALS } from '$lib/experience';
import { dicts } from './index';
import { LANGS } from './lang';

function leaves(obj: object, prefix = ''): [string, unknown][] {
	return Object.entries(obj).flatMap(([k, v]) =>
		v !== null && typeof v === 'object' ? leaves(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]
	);
}
const keys = (obj: object) =>
	leaves(obj)
		.map(([k]) => k)
		.sort();

describe('dictionaries', () => {
	it('fr has exactly the same keys as en', () => {
		expect(keys(dicts.fr)).toEqual(keys(dicts.en));
	});

	it.each(LANGS)('%s has no empty strings', (lang) => {
		for (const [key, value] of leaves(dicts[lang])) {
			expect(typeof value, key).toBe('string');
			expect((value as string).trim(), key).not.toBe('');
		}
	});

	it.each(LANGS)('%s has a nav label and title for every section', (lang) => {
		for (const id of SECTIONS) {
			expect(dicts[lang].nav[id]).toBeTruthy();
			expect(dicts[lang].sections[id]).toBeTruthy();
		}
	});

	it.each(LANGS)('%s labels every project context, domain and sort', (lang) => {
		const p = dicts[lang].projects;
		for (const c of CONTEXTS) expect(p.contexts[c], c).toBeTruthy();
		for (const d of DOMAINS) expect(p.domains[d], d).toBeTruthy();
		for (const s of SORTS) expect(p.sort[s], s).toBeTruthy();
	});

	it.each(LANGS)('%s labels every hackathon medal', (lang) => {
		for (const m of MEDALS) expect(dicts[lang].experience.places[m], String(m)).toBeTruthy();
	});

	it.each(LANGS)('%s has a single top-level "opens in a new tab" text', (lang) => {
		const newTabKeys = keys(dicts[lang]).filter((k) => k.endsWith('newTab'));
		expect(newTabKeys).toEqual(['newTab']);
	});
});
