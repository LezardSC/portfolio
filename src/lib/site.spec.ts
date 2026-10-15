import { describe, expect, it } from 'vitest';
import { absoluteUrl, SITE_ORIGIN } from './site';

describe('absoluteUrl', () => {
	it('joins the origin, the base and the path with single slashes', () => {
		expect(absoluteUrl('', '/en/')).toBe(`${SITE_ORIGIN}/en/`);
		expect(absoluteUrl('/portfolio', 'og-en.png')).toBe(`${SITE_ORIGIN}/portfolio/og-en.png`);
		expect(absoluteUrl('/portfolio/', '/en/')).toBe(`${SITE_ORIGIN}/portfolio/en/`);
	});

	it('gives the site root for an empty path', () => {
		expect(absoluteUrl('', '')).toBe(`${SITE_ORIGIN}/`);
	});

	it('is https without a trailing slash, so joins stay single-slashed', () => {
		expect(SITE_ORIGIN).toMatch(/^https:\/\/[^/]+$/);
	});
});
