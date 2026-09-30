import { isAtBottom, sectionInView, SECTIONS, type SectionId } from './sections';

/**
 * The section on screen right now (browser only). One rule for the nav highlight and the
 * language switch, so they always agree. The nav height is the page's scroll-padding-top.
 */
export function currentSection(): SectionId | null {
	const tops = Object.fromEntries(
		SECTIONS.map((id) => [id, document.getElementById(id)?.getBoundingClientRect().top ?? Infinity])
	) as Record<SectionId, number>;
	const navHeight = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
	const atBottom = isAtBottom(scrollY, innerHeight, document.documentElement.scrollHeight);
	return sectionInView(tops, navHeight, atBottom);
}
