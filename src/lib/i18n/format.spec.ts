import { describe, expect, it } from 'vitest';
import { fill } from './format';

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
