/** Page sections after the hero, in display and nav order. */
export const SECTIONS = ['about', 'projects', 'skills', 'experience', 'contact'] as const;
export type SectionId = (typeof SECTIONS)[number];

/**
 * The section the reader is looking at: the last one whose top has scrolled up to the nav bar.
 * `tops` are viewport-relative (getBoundingClientRect().top). null means the hero (top of page).
 */
export function sectionInView(
	tops: Record<SectionId, number>,
	navHeight: number
): SectionId | null {
	let current: SectionId | null = null;
	for (const id of SECTIONS) if (tops[id] <= navHeight + 1) current = id;
	return current;
}
