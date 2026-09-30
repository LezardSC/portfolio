/** Base-aware URL of a file in static/, e.g. assetHref('/portfolio', 'cv-en.pdf') → '/portfolio/cv-en.pdf'. */
export function assetHref(base: string, path: string): string {
	return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
