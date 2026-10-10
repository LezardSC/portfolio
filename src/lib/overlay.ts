/**
 * Phone featured cards without a photo (`ProjectCardLarge.svelte`): light text over a `veil` laid
 * on the domain colour (`veilPlain`). A test checks the text contrast on every domain colour and
 * keeps these values in sync with the component's CSS.
 */
export const OVERLAY = {
	veil: '#10100e',
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
