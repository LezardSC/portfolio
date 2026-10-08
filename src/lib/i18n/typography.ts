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

/** Each straight apostrophe (U+0027) in a French text, with a little context; French uses ’ (U+2019). */
export function straightApostrophes(text: string): string[] {
	return [...text.matchAll(/'/g)].map((m) => text.slice(Math.max(0, m.index - 12), m.index + 12));
}

/**
 * French typography for text typed with plain spaces and straight apostrophes: a no-break space
 * (U+00A0) before : ; ! ? % » and after «, and ’ for '. Clean text comes back unchanged.
 */
export function typesetFrench(text: string): string {
	return text.replace(BREAKABLE_SPACE, ' ').replace(/'/g, '’');
}

/**
 * A copy of `data` with `typesetFrench` applied to every string under an `fr` key, at any depth.
 * Content files wrap their exports in it, so French content can be written without U+00A0 or ’.
 */
export function typeset<T>(data: T): T {
	if (Array.isArray(data)) return data.map(typeset) as T;
	if (data === null || typeof data !== 'object') return data;
	return Object.fromEntries(
		Object.entries(data).map(([k, v]) => [
			k,
			k === 'fr' && typeof v === 'string' ? typesetFrench(v) : typeset(v)
		])
	) as T;
}
