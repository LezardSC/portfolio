import type { Lang, Localized } from '$lib/i18n/lang';

/** One 24×24 SVG path, plus its brand colour as 6 hex digits without `#`. */
export type SkillIcon = { path: string; hex: string };

export type Skill = {
	/** A plain string for proper nouns (Rust, Docker), `{ en, fr }` when it translates. */
	name: string | Localized;
	icon: SkillIcon;
};

export type SkillGroupId = 'backend' | 'systems' | 'devops' | 'ai' | 'blockchain' | 'frontend';

export type SkillGroup = { id: SkillGroupId; title: Localized; skills: Skill[] };

export function skillName(skill: Skill, lang: Lang): string {
	return typeof skill.name === 'string' ? skill.name : skill.name[lang];
}

/** Page background per theme. Keep in sync with `--bg` in src/app.css (a test checks it). */
export const THEME_BG = { dark: '#0d1117', light: '#ffffff' } as const;

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
