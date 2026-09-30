/** A plain (breakable) space where French typography wants a no-break one: before : ; ! ? % », after «. */
const BREAKABLE_SPACE = / (?=[:;!?%»])|(?<=«) /g;

/**
 * Each spot in a French text that uses a plain space where a no-break one (U+00A0 or U+202F)
 * belongs, with a little context around it. Empty when the text is clean.
 */
export function frenchSpacingIssues(text: string): string[] {
	return [...text.matchAll(BREAKABLE_SPACE)].map((m) =>
		text.slice(Math.max(0, m.index - 12), m.index + 12)
	);
}
