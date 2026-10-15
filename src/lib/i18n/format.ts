import type { Lang } from './lang';

/** Singular and plural dictionary templates, each with an `{n}` placeholder. */
export type Plural = { one: string; other: string };

/** Fills `{name}` placeholders of a dictionary template; unknown names stay as written. */
export function fill(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in values ? String(values[name]) : match
	);
}

/** `{n}` filled into the form the language's plural rules pick (French: 0 and 1 are singular). */
export function plural(n: number, forms: Plural, lang: Lang): string {
	return fill(new Intl.PluralRules(lang).select(n) === 'one' ? forms.one : forms.other, { n });
}
