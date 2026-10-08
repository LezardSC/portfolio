/**
 * Phone featured cards (`ProjectCardLarge.svelte`): light text over a `veil` laid on the project
 * photo (`veilPhoto`) or, without one, on its domain colour (`veilPlain`). A test checks the text
 * contrast on every domain colour and keeps these values in sync with the component's CSS. Over
 * a photo the contrast depends on the image: checked by eye (see the review guide).
 */
export const OVERLAY = {
	veil: '#10100e',
	veilPhoto: 0.62,
	veilPlain: 0.35,
	text: '#ffffff',
	meta: '#d6d1c6',
	domain: '#ffa58c',
	award: '#ffb59f',
	desc: '#ece8df',
	tag: '#f3f0e8',
	/** White at this alpha behind each tech tag. */
	tagBg: 0.16
} as const;
