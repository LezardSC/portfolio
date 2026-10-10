import { describe, expect, it } from 'vitest';
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
});
