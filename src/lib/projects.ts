import type { Localized } from '$lib/i18n/lang';

export const CONTEXTS = ['professional', 'personal', 'school', 'hackathon'] as const;
export type Context = (typeof CONTEXTS)[number];

export const DOMAINS = ['web', 'blockchain', 'ai', 'low-level', 'games'] as const;
export type Domain = (typeof DOMAINS)[number];

export const SORTS = ['featured', 'newest'] as const;
export type SortKey = (typeof SORTS)[number];

/** How many results get the large card layout. */
export const LARGE_COUNT = 6;

/**
 * Card media. Paths are relative to `static/`, without a leading slash. A video always has a
 * still `poster`: phones and reduced-motion visitors only ever get the poster.
 */
export type Media = { kind: 'image'; src: string } | { kind: 'video'; src: string; poster: string };

/** At and above this width cards keep media on top and videos may play; below it is "phone". */
export const DESKTOP_QUERY = '(min-width: 48rem)';

export type Project = {
	id: string;
	title: string;
	description: Localized;
	/** 'YYYY-MM' */
	date: string;
	context: Context;
	domains: Domain[];
	tech: string[];
	/** Both optional: a private project has neither. */
	links: { repo?: string; demo?: string };
	media?: Media;
	award?: Localized;
	/** Lower = earlier in the "Highlights" sort (key `featured`). */
	featured?: number;
};

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

const byFeatured = (a: Project, b: Project) => {
	const fa = a.featured ?? Infinity;
	const fb = b.featured ?? Infinity;
	return fa === fb ? byNewest(a, b) : fa - fb;
};

export function sortProjects(list: readonly Project[], sort: SortKey): Project[] {
	return [...list].sort(sort === 'featured' ? byFeatured : byNewest);
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
	return media.kind === 'video' ? [media.src, media.poster] : [media.src];
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
	for (const src of mediaFiles(media)) {
		if (!src) continue;
		if (src.startsWith('/')) issues.push(`"${src}": must be relative to static/`);
		else if (!exists(src)) issues.push(`"${src}": missing from static/`);
	}
	return issues;
}
