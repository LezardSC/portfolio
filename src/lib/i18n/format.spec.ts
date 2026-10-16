import { describe, expect, it } from 'vitest';
import { en } from './en';
import { fill, plural } from './format';
import { fr } from './fr';

describe('fill', () => {
	it('replaces every {name} placeholder', () => {
		expect(fill('{total} projects, {featured} first', { total: 17, featured: 6 })).toBe(
			'17 projects, 6 first'
		);
	});
	it('replaces a placeholder used twice', () => {
		expect(fill('{n}/{n}', { n: 2 })).toBe('2/2');
	});
	it('leaves unknown placeholders as they are', () => {
		expect(fill('{a} {b}', { a: 'x' })).toBe('x {b}');
	});
});

describe('plural', () => {
	const f = { one: '{n} x', other: '{n} xs' };
	it('uses the language plural rules (French: 0 and 1 are singular)', () => {
		expect(plural(1, f, 'en')).toBe('1 x');
		expect(plural(0, f, 'en')).toBe('0 xs');
		expect(plural(0, f, 'fr')).toBe('0 x');
		expect(plural(2, f, 'fr')).toBe('2 xs');
	});
	it('reads the real "other projects" button in both languages', () => {
		expect(plural(1, fr.projects.showMore, 'fr')).toBe('Voir 1 autre projet');
		expect(plural(5, en.projects.showMore, 'en')).toBe('See the 5 other projects');
	});
	it('reads the real hackathons heading with one podium', () => {
		expect(plural(1, en.experience.hackathonsTitle, 'en')).toBe('Hackathons - 1 podium');
		expect(plural(1, fr.experience.hackathonsTitle, 'fr')).toBe('Hackathons - 1 podium');
		expect(plural(5, en.experience.hackathonsTitle, 'en')).toBe('Hackathons - 5 podiums');
	});
});
