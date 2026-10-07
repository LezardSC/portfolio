/**
 * Whether a section gets the fade-in-on-scroll: only when the browser can tell us it scrolled
 * into view, the visitor accepts motion, and it isn't already on screen (that would flash).
 */
export function shouldReveal(s: {
	supported: boolean;
	reducedMotion: boolean;
	inViewAtStart: boolean;
}): boolean {
	return s.supported && !s.reducedMotion && !s.inViewAtStart;
}
