export const LANGS = ['en', 'fr'] as const;
export type Lang = (typeof LANGS)[number];

/** Text available in every supported language. */
export type Localized = Record<Lang, string>;

export function isLang(v: string): v is Lang {
	return (LANGS as readonly string[]).includes(v);
}

/**
 * First supported language from the browser's preference list, else 'en'.
 * redirectScript() in redirect.ts duplicates this for the `/` page; redirect.spec.ts keeps them in sync.
 */
export function pickLang(prefs: readonly string[]): Lang {
	for (const pref of prefs) {
		const base = pref.toLowerCase().split('-')[0];
		if (isLang(base)) return base;
	}
	return 'en';
}

export function otherLang(lang: Lang): Lang {
	return lang === 'en' ? 'fr' : 'en';
}

/** Base-aware locale URL, e.g. localeHref('/portfolio', 'en') → '/portfolio/en/'. */
export function localeHref(base: string, lang: Lang): string {
	return `${base}/${lang}/`;
}
