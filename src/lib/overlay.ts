/**
 * Phone overlay on large project cards (`ProjectCardLarge.svelte`): the text colours, and the
 * gradient's alpha where text starts (it only gets darker below). A test keeps these in sync
 * with the component's CSS and checks their contrast over the worst case, a white image.
 */
export const OVERLAY = {
	alpha: 0.75,
	text: '#ffffff',
	muted: '#d0d7de',
	accent: '#79c0ff'
} as const;

/** The colour behind the overlay text when the image under it is pure white. */
export function overlayBackdrop(alpha: number): string {
	const v = Math.round(255 * (1 - alpha))
		.toString(16)
		.padStart(2, '0');
	return `#${v}${v}${v}`;
}
