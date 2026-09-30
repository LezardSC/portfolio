import { describe, expect, it } from 'vitest';
import { assetHref } from './paths';

describe('assetHref', () => {
	it('joins an empty base into a root-relative URL', () => {
		expect(assetHref('', 'cv-en.pdf')).toBe('/cv-en.pdf');
	});

	it('prefixes a sub-path base', () => {
		expect(assetHref('/portfolio', 'photo.jpg')).toBe('/portfolio/photo.jpg');
	});

	it('never produces a double slash', () => {
		expect(assetHref('/portfolio/', '/photo.jpg')).toBe('/portfolio/photo.jpg');
		expect(assetHref('', '/photo.jpg')).toBe('/photo.jpg');
	});

	it('keeps nested paths', () => {
		expect(assetHref('/p', 'projects/kayp.png')).toBe('/p/projects/kayp.png');
	});
});
