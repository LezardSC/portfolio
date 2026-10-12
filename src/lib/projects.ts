import type { Context, Domain } from '$lib/data/categories';
import type { Localized } from '$lib/i18n/lang';

export type { Context, Domain };

export const SORTS = ['priority', 'newest'] as const;
export type SortKey = (typeof SORTS)[number];

/** How many results get the large card layout: the first ones of the displayed list, whatever they are. */
export const LARGE_COUNT = 6;
/** Same on phones, which have room for fewer: the next ones lead the small tiles. */
export const PHONE_LARGE_COUNT = 5;

/**
 * Card media. Paths are relative to `static/`, without a leading slash. A video always has a
 * still `poster`: phones and reduced-motion visitors only ever get the poster. `phone` is an
 * optional image for phones only (the blurred card background); without it phones use the
 * image or poster. Desktop never downloads it.
 */
export type Media =
	| { kind: 'image'; src: string; phone?: string }
	| { kind: 'video'; src: string; poster: string; phone?: string };

/** At and above this width cards keep media on top and videos may play; below it is "phone". */
export const DESKTOP_QUERY = '(min-width: 48rem)';

/** Phone screens, for `<source media>`: exactly the screens DESKTOP_QUERY doesn't match. */
export const PHONE_QUERY = `not all and ${DESKTOP_QUERY}`;

export type Project = {
	id: string;
	title: string;
	description: Localized;
	/** One sentence for the small cards on desktop, and every cards on phones (instead of the description). */
	summary: Localized;
	/** 'YYYY-MM' */
	date: string;
	context: Context;
	domains: Domain[];
	tech: string[];
	/** Both optional: a private project has neither. */
	links: { repo?: string; demo?: string };
	media?: Media;
	award?: Localized;
	/** Takes the project off the site while keeping its text here. */
	hidden?: true;
};

/** A project's main domain: the first of its list. It sets the card icon, label and colour; filters still match every domain. */
export function mainDomain(p: Project): Domain {
	return p.domains[0];
}

/**
 * Phone tile colours per theme (the domain colour is `DOMAINS[d].color` in $lib/data/categories): background = domain colour at `pct` over `base`; label, rule and
 * watermark = domain colour mixed `fg` with white. Keep in sync with `--tile-*` in src/app.css
 * (theme-tokens.spec.ts checks it).
 */
export const DOMAIN_TILE = {
	light: { base: '#ffffff', pct: 0.11, fg: 1 },
	dark: { base: '#121210', pct: 0.24, fg: 0.45 }
} as const;

/** Small project tiles shown on phones before the "See N other projects" button. */
export const PHONE_OTHERS = 6;

/** How many small tiles the phone folds behind the button. */
export function hiddenCount(total: number, shown = PHONE_OTHERS): number {
	return Math.max(0, total - shown);
}

export type Filters = { context: Context | 'all'; domain: Domain | 'all' };
export const NO_FILTERS: Filters = { context: 'all', domain: 'all' };

export function filterProjects(list: readonly Project[], filters: Filters): Project[] {
	return list.filter(
		(p) =>
			(filters.context === 'all' || p.context === filters.context) &&
			(filters.domain === 'all' || p.domains.includes(filters.domain))
	);
}

/** Result count if `group` were set to `value`, keeping the other group as is. */
export function countFor<G extends keyof Filters>(
	list: readonly Project[],
	filters: Filters,
	group: G,
	value: Filters[G]
): number {
	return filterProjects(list, { ...filters, [group]: value } as Filters).length;
}

const byNewest = (a: Project, b: Project) =>
	b.date.localeCompare(a.date) || a.id.localeCompare(b.id);

/**
 * `priority`: the `priority` ids first, in that order (PRIORITY in $lib/data/projects), then
 * everything else newest first. Unknown ids are ignored.
 */
export function sortProjects(
	list: readonly Project[],
	sort: SortKey,
	priority: readonly string[] = []
): Project[] {
	if (sort === 'newest') return [...list].sort(byNewest);
	const rank = (p: Project) => {
		const i = priority.indexOf(p.id);
		return i < 0 ? Infinity : i;
	};
	return [...list].sort((a, b) => {
		const [ra, rb] = [rank(a), rank(b)];
		return ra === rb ? byNewest(a, b) : ra - rb;
	});
}

/** Projects shown on the site: everything not marked `hidden`. */
export function visibleProjects(list: readonly Project[]): Project[] {
	return list.filter((p) => !p.hidden);
}

export function splitTiers(
	list: readonly Project[],
	n = LARGE_COUNT
): { large: Project[]; small: Project[] } {
	return { large: list.slice(0, n), small: list.slice(n) };
}

/** Where the media/title link points: the repo, else the demo, else nowhere. */
export function primaryLink(p: Project): string | undefined {
	return p.links.repo ?? p.links.demo;
}

/** A video plays only on a desktop-width screen, while in view, and never under reduced motion. */
export function shouldPlayVideo(s: {
	desktop: boolean;
	reducedMotion: boolean;
	inView: boolean;
}): boolean {
	return s.desktop && s.inView && !s.reducedMotion;
}

/** Every `static/` file a media entry needs, the poster included. */
export function mediaFiles(media: Media): string[] {
	const main = media.kind === 'video' ? [media.src, media.poster] : [media.src];
	return media.phone === undefined ? main : [...main, media.phone];
}

const IMAGE_FILE = /\.(jpe?g|png|webp)$/i;
const VIDEO_FILE = /\.mp4$/i;

/** What is wrong with a media entry (formats, paths, missing files). Empty when it is fine. */
export function mediaIssues(media: Media, exists: (src: string) => boolean): string[] {
	const issues: string[] = [];
	const image = media.kind === 'image' ? media.src : media.poster;
	if (!IMAGE_FILE.test(image)) issues.push(`"${image}": not a .jpg, .jpeg, .png or .webp image`);
	if (media.kind === 'video' && !VIDEO_FILE.test(media.src))
		issues.push(`"${media.src}": not an .mp4 video`);
	if (media.phone !== undefined && !IMAGE_FILE.test(media.phone))
		issues.push(`"${media.phone}": phone image is not a .jpg, .jpeg, .png or .webp image`);
	for (const src of mediaFiles(media)) {
		if (!src) continue;
		if (src.startsWith('/')) issues.push(`"${src}": must be relative to static/`);
		else if (!exists(src)) issues.push(`"${src}": missing from static/`);
	}
	return issues;
}
