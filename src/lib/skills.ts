import type { Lang, Localized } from '$lib/i18n/lang';

/** One 24×24 SVG path, plus its brand colour as 6 hex digits without `#`. */
export type SkillIcon = { path: string; hex: string };

export type Skill = {
	/** A plain string for proper nouns (Rust, Docker), `{ en, fr }` when it translates. */
	name: string | Localized;
	icon: SkillIcon;
};

export type SkillGroup = {
	/** Unique, kebab-case; used in element ids. */
	id: string;
	/** Stroke icon path, usually one of `ICONS` in `$lib/data/icons`. */
	icon: string;
	title: Localized;
	/** One line shown under the title in the skills panel. */
	description: Localized;
	skills: Skill[];
};

export function skillName(skill: Skill, lang: Lang): string {
	return typeof skill.name === 'string' ? skill.name : skill.name[lang];
}

/** Page background per theme. Keep in sync with `--bg` in src/app.css (a test checks it). */
export const THEME_BG = { dark: '#121210', light: '#faf8f4' } as const;

/** Below this contrast with the page background, a brand colour is replaced by the text colour. */
export const MIN_LOGO_CONTRAST = 2.2;

function luminance(hex: string): number {
	const h = hex.replace('#', '');
	const [r, g, b] = [0, 2, 4].map((i) => {
		const c = parseInt(h.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours (with or without `#`), from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

/** CSS colour for a logo on `bg`: its brand colour, or the theme text colour if it would vanish. */
export function logoColor(hex: string, bg: string): string {
	return contrastRatio(hex, bg) >= MIN_LOGO_CONTRAST ? `#${hex}` : 'var(--text)';
}

/**
 * Keyboard rule of the vertical skills tab list: the tab to select and focus after `key`, or
 * null when the key isn't handled. Arrows wrap around; Home/End go to the ends.
 */
export function nextTab(index: number, key: string, count: number): number | null {
	switch (key) {
		case 'ArrowDown':
			return (index + 1) % count;
		case 'ArrowUp':
			return (index - 1 + count) % count;
		case 'Home':
			return 0;
		case 'End':
			return count - 1;
		default:
			return null;
	}
}

/**
 * Whether a skills panel is hidden. Before hydration (and without JS) none is. On desktop the
 * selected tab shows its panel; on phones the open accordion group does (`open` -1: all closed).
 * The two states are separate, so crossing the breakpoint never loses either.
 */
export function panelHidden(
	s: { enhanced: boolean; desktop: boolean; selected: number; open: number },
	index: number
): boolean {
	if (!s.enhanced) return false;
	return (s.desktop ? s.selected : s.open) !== index;
}
