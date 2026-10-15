/** Public address of the site: the only place the domain is written. No trailing slash. */
export const SITE_ORIGIN = 'https://jocelynrenault.com';

/**
 * Absolute URL of a path under `base`, e.g. absoluteUrl('/portfolio', 'en/') →
 * 'https://jocelynrenault.com/portfolio/en/'. No imports: Node scripts load this file directly.
 */
export function absoluteUrl(base: string, path: string, origin = SITE_ORIGIN): string {
	return `${origin}${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
