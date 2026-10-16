/** A panel's open size: its border-box height and the vertical padding inside it, in px. */
export type SlideBox = { height: number; paddingTop: number; paddingBottom: number };

/** How long a phone collapsible takes to slide open or closed. */
export const SLIDE_MS = 200;

/**
 * Keyframes sliding a panel from `from` px tall to fully open (`full`) or closed (0). The padding
 * shrinks with the height, since with border-box sizing it would keep a "closed" panel open; an
 * interrupted slide starts again from where it stopped.
 */
export function slideKeyframes(full: SlideBox, from: number, opening: boolean) {
	const height = Math.min(from, full.height);
	const ratio = full.height > 0 ? height / full.height : 0;
	const frame = (h: number, r: number) => ({
		height: `${h}px`,
		paddingTop: `${full.paddingTop * r}px`,
		paddingBottom: `${full.paddingBottom * r}px`
	});
	return [frame(height, ratio), opening ? frame(full.height, 1) : frame(0, 0)];
}
