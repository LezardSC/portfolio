import { describe, expect, it } from 'vitest';
import { LANGS } from './i18n/lang';
import { alternates, robotsTxt, sitemapXml } from './seo';
import { SITE_ORIGIN } from './site';

describe('alternates', () => {
	it('lists every locale, then x-default on the root', () => {
		expect(alternates('')).toEqual([
			...LANGS.map((lang) => ({ hreflang: lang, href: `${SITE_ORIGIN}/${lang}/` })),
			{ hreflang: 'x-default', href: `${SITE_ORIGIN}/` }
		]);
	});
});

describe('sitemapXml', () => {
	it('has one <url> per locale, each with every alternate', () => {
		const xml = sitemapXml('');
		expect(xml.match(/<url>/g)).toHaveLength(LANGS.length);
		for (const lang of LANGS) expect(xml).toContain(`<loc>${SITE_ORIGIN}/${lang}/</loc>`);
		expect(xml.match(/<xhtml:link /g)).toHaveLength(LANGS.length * (LANGS.length + 1));
	});
});

describe('robotsTxt', () => {
	it('allows everything and points to the sitemap', () => {
		expect(robotsTxt('')).toBe(`User-agent: *\nDisallow:\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
	});
});
