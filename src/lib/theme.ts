export type Theme = 'dark' | 'light';
export const THEME_KEY = 'theme';

/** Page background per theme (the browser bar colour). Equal to `--bg` in src/app.css (theme-tokens.spec.ts). */
export const THEME_BG = { dark: '#121210', light: '#faf8f4' } as const;

/** Keep in sync with the inline script in src/app.html. */
export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
	if (stored === 'dark' || stored === 'light') return stored;
	return prefersDark ? 'dark' : 'light';
}

export function nextTheme(t: Theme): Theme {
	return t === 'dark' ? 'light' : 'dark';
}

/** Theme to apply when the OS preference changes, or null when the visitor picked one (their choice wins). */
export function themeOnSystemChange(stored: string | null, prefersDark: boolean): Theme | null {
	return stored === 'dark' || stored === 'light' ? null : resolveTheme(null, prefersDark);
}
