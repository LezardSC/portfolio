export type Theme = 'dark' | 'light';
export const THEME_KEY = 'theme';

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
