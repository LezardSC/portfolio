import { describe, expect, it } from 'vitest';
import { BUDGET_BYTES, checkBudget } from './budget';

const MB = 1024 * 1024;

describe('checkBudget', () => {
	it('passes at the limit and fails one byte over', () => {
		expect(checkBudget([{ path: 'a', size: BUDGET_BYTES }]).ok).toBe(true);
		expect(
			checkBudget([
				{ path: 'a', size: BUDGET_BYTES },
				{ path: 'b', size: 1 }
			]).ok
		).toBe(false);
	});

	it('lists the ten largest files, largest first', () => {
		const files = Array.from({ length: 12 }, (_, i) => ({ path: `f${i}`, size: (i + 1) * MB }));
		const r = checkBudget(files);
		expect(r.total).toBe(78 * MB);
		expect(r.largest.map((f) => f.path)).toEqual([
			'f11',
			'f10',
			'f9',
			'f8',
			'f7',
			'f6',
			'f5',
			'f4',
			'f3',
			'f2'
		]);
	});
});
