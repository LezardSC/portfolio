import { describe, expect, it } from 'vitest';
import { usedCategories } from './categories';

describe('usedCategories', () => {
	const order = ['web', 'ai', 'games'] as const;
	it('keeps the categories in use, in the given order', () => {
		expect(usedCategories(order, ['games', 'web', 'games'])).toEqual(['web', 'games']);
	});
	it('drops a category no project uses any more', () => {
		expect(usedCategories(order, ['ai'])).toEqual(['ai']);
	});
	it('is empty when nothing is used', () => {
		expect(usedCategories(order, [])).toEqual([]);
	});
});
