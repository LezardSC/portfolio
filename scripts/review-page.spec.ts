import { describe, expect, it } from 'vitest';
import { reviewPage, reviewSummary } from './review-page.ts';

describe('reviewSummary', () => {
	it('says how many screens changed, or that none did', () => {
		expect(reviewSummary(0, 25)).toBe('No visual change');
		expect(reviewSummary(4, 25)).toBe('4 of 25 screens changed');
	});
});

describe('reviewPage', () => {
	it('is a standalone, unindexed page with the summary as its heading', () => {
		const html = reviewPage([], 25);
		expect(html).toMatch(/^<!doctype html>/);
		expect(html).toContain('<meta name="robots" content="noindex">');
		expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
		expect(html).toContain('<h1>No visual change</h1>');
		expect(html).not.toContain('<section');
		expect(html).not.toContain('<script');
	});

	it('shows only the given captures, in order, each with before, after and diff', () => {
		const html = reviewPage(
			[
				{ name: 'en-dark-360', detail: '12 px in 4×3 at (10, 20)', sizeChanged: false },
				{ name: 'fr-light-1280', detail: '7 px in 1×7 at (0, 0)', sizeChanged: false }
			],
			25
		);
		expect(html).toContain('<h1>2 of 25 screens changed</h1>');
		expect(html.indexOf('en-dark-360')).toBeLessThan(html.indexOf('fr-light-1280'));
		for (const kind of ['before', 'after', 'diff'])
			expect(html).toContain(
				`<a href="en-dark-360-${kind}.jpg"><img src="en-dark-360-${kind}.jpg"`
			);
		expect(html).toContain('12 px in 4×3 at (10, 20)');
	});

	it('has no diff image when the page size changed', () => {
		const html = reviewPage(
			[{ name: 'en-dark-360', detail: 'page size 360×9000 → 360×9100', sizeChanged: true }],
			25
		);
		expect(html).toContain('en-dark-360-before.jpg');
		expect(html).toContain('en-dark-360-after.jpg');
		expect(html).not.toContain('en-dark-360-diff.jpg');
		expect(html).toContain('page size 360×9000 → 360×9100');
	});

	it('escapes names and details', () => {
		const html = reviewPage([{ name: `a<b>'"&`, detail: '<i>', sizeChanged: false }], 1);
		expect(html).not.toContain('<b>');
		expect(html).not.toContain('<i>');
		expect(html).toContain('a&#60;b&#62;&#39;&#34;&#38;');
	});
});
