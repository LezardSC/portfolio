import { describe, expect, it } from 'vitest';
import { captures, formatResults, parseScreensArgs } from './screens-report.ts';

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
	it('names where the diff images are', () => {
		const out = formatResults([{ name: 'a', same: false, detail: 'x' }], 'build/_review/');
		expect(out).toContain('(images in build/_review/)');
	});
	it('says so when everything matches', () => {
		expect(formatResults([{ name: 'a', same: true, detail: 'identical' }])).toContain(
			'all 1 captures identical'
		);
	});
});

describe('parseScreensArgs', () => {
	it('captures a baseline by default, building first', () => {
		expect(parseScreensArgs([])).toEqual({
			mode: 'capture',
			out: 'reports/screens-baseline',
			build: true
		});
	});
	it('captures into --out, and skips the build with --no-build', () => {
		expect(parseScreensArgs(['--out', '/tmp/after', '--no-build'])).toEqual({
			mode: 'capture',
			out: '/tmp/after',
			build: false
		});
	});
	it('compares with the baseline', () => {
		expect(parseScreensArgs(['--compare'])).toEqual({ mode: 'compare', build: true });
	});
	it('builds a review page from two capture folders', () => {
		expect(parseScreensArgs(['--before', 'b', '--after', 'a', '--review', 'r'])).toEqual({
			mode: 'review',
			before: 'b',
			after: 'a',
			review: 'r'
		});
	});
	it('refuses an incomplete review, a path missing, mixed modes and unknown options', () => {
		expect(() => parseScreensArgs(['--before', 'b', '--after', 'a'])).toThrow('go together');
		expect(() => parseScreensArgs(['--out'])).toThrow('--out needs a path');
		expect(() => parseScreensArgs(['--out', '--no-build'])).toThrow('--out needs a path');
		expect(() => parseScreensArgs(['--compare', '--out', 'x'])).toThrow();
		expect(() =>
			parseScreensArgs(['--before', 'b', '--after', 'a', '--review', 'r', '--compare'])
		).toThrow();
		expect(() => parseScreensArgs(['--compar'])).toThrow('Unknown option: --compar');
	});
});
