/** Page sections after the hero, in display and nav order. */
export const SECTIONS = ['about', 'projects', 'skills', 'experience', 'contact'] as const;
export type SectionId = (typeof SECTIONS)[number];

type SessionStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const PENDING_KEY = 'pending-section';

function isSectionId(v: string | null): v is SectionId {
	return (SECTIONS as readonly (string | null)[]).includes(v);
}

/**
 * Remembers which section to scroll to after the language switch reloads the page.
 * Takes an accessor because merely reading `sessionStorage` can throw when storage is blocked.
 */
export function savePendingSection(getStore: () => SessionStore, id: SectionId | null): void {
	try {
		const store = getStore();
		if (id) store.setItem(PENDING_KEY, id);
		else store.removeItem(PENDING_KEY);
	} catch {
		// Storage blocked (private mode, disabled cookies): the new page just stays at the top.
	}
}

/** Reads and clears the remembered section; null if none, invalid or storage is blocked. */
export function takePendingSection(getStore: () => SessionStore): SectionId | null {
	try {
		const store = getStore();
		const id = store.getItem(PENDING_KEY);
		store.removeItem(PENDING_KEY);
		return isSectionId(id) ? id : null;
	} catch {
		return null;
	}
}

/**
 * The section the reader is looking at: the last one whose top has scrolled up to the nav bar.
 * `tops` are viewport-relative (getBoundingClientRect().top). null means the hero (top of page).
 * At the bottom of the page it is the last section, whose top may never reach the nav if it is
 * shorter than the viewport.
 */
export function sectionInView(
	tops: Record<SectionId, number>,
	navHeight: number,
	atBottom = false
): SectionId | null {
	if (atBottom) return SECTIONS[SECTIONS.length - 1];
	let current: SectionId | null = null;
	for (const id of SECTIONS) if (tops[id] <= navHeight + 1) current = id;
	return current;
}

/** Whether the page is scrolled to its end, within 2px for sub-pixel and zoom rounding. */
export function isAtBottom(scrollY: number, viewportHeight: number, pageHeight: number): boolean {
	return scrollY + viewportHeight >= pageHeight - 2;
}

/**
 * Characters in the longest word of a title. Section titles shrink below their design size only
 * when this word wouldn't fit the narrow title column (see Section.svelte).
 */
export function longestWordLength(text: string): number {
	return Math.max(0, ...text.split(/\s+/).map((w) => [...w].length));
}
