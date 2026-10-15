import { LANGS, localeHref } from './i18n/lang';
import { absoluteUrl } from './site';

export type Alternate = { hreflang: string; href: string };

/** Absolute hreflang alternates: every locale, then x-default on `/` (the language redirect). */
export function alternates(base: string): Alternate[] {
	return [
		...LANGS.map((lang) => ({ hreflang: lang, href: absoluteUrl(base, localeHref('', lang)) })),
		{ hreflang: 'x-default', href: absoluteUrl(base, '') }
	];
}

export function sitemapXml(base: string): string {
	const links = alternates(base)
		.map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`)
		.join('');
	const urls = LANGS.map(
		(lang) => `<url><loc>${absoluteUrl(base, localeHref('', lang))}</loc>${links}</url>`
	).join('');
	return (
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
		`${urls}</urlset>\n`
	);
}

export function robotsTxt(base: string): string {
	return `User-agent: *\nDisallow:\n\nSitemap: ${absoluteUrl(base, 'sitemap.xml')}\n`;
}
