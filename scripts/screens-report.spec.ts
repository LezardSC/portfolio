import { describe, expect, it } from 'vitest';
import { captures, formatResults } from './screens-report.ts';

describe('captures', () => {
	it('covers both languages and themes at every width, plus the open and no-JS states', () => {
		const names = captures().map((c) => c.name);
		expect(names).toContain('en-dark-360');
		expect(names).toContain('fr-light-1440');
		expect(names).toContain('fr-dark-360-open');
		expect(names).toContain('en-light-360-nojs');
		expect(new Set(names).size).toBe(names.length);
		expect(names).toHaveLength(2 * 2 * 5 + 2 * 2 + 1);
	});
});

describe('formatResults', () => {
	it('lists differences first and ends with a verdict', () => {
		const out = formatResults([
			{ name: 'en-dark-360', same: true, detail: 'identical' },
			{ name: 'fr-light-1440', same: false, detail: '12 px in 4×3 at (10, 20)' }
		]);
		expect(out.split('\n')[0]).toContain('DIFF  fr-light-1440');
		expect(out).toContain('1 of 2 captures differ');
	});
	it('says so when everything matches', () => {
		expect(formatResults([{ name: 'a', same: true, detail: 'identical' }])).toContain(
			'all 1 captures identical'
		);
	});
});
