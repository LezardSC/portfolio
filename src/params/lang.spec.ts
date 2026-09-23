import { expect, it } from 'vitest';
import { match } from './lang';

it('matches only en and fr', () => {
	expect(match('en')).toBe(true);
	expect(match('fr')).toBe(true);
	for (const v of ['de', 'EN', 'favicon.svg', '']) expect(match(v)).toBe(false);
});
