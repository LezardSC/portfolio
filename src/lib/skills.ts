import type { Localized } from '$lib/i18n/lang';

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

/** What the page gets for a logo: its id in the sprite and its brand colour, not the drawing. */
export type ShownLogo = { id: string; hex: string };
export type ShownSkill = { name: string | Localized; logo: ShownLogo };
export type ShownSkillGroup = Omit<SkillGroup, 'skills'> & { skills: ShownSkill[] };

/** FNV-1a, 32 bits, base 36: short, stable across builds, enough for a few dozen drawings. */
function hash(text: string): string {
	let h = 0x811c9dc5;
	for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
	return (h >>> 0).toString(36);
}

/** Id of a logo in the sprite, from its drawing: the same logo in several groups is drawn once. */
export function logoId(icon: SkillIcon): string {
	return `l${hash(icon.path)}`;
}

/**
 * The skill logos as one SVG sprite (one <symbol> per drawing), served as skill-logos.svg: the
 * paths (most of the page's JS otherwise) download once, apart from the page and its scripts.
 */
export function logoSprite(groups: readonly SkillGroup[]): string {
	const symbols = new Map<string, string>();
	for (const skill of groups.flatMap((g) => g.skills))
		symbols.set(
			logoId(skill.icon),
			`<symbol id="${logoId(skill.icon)}" viewBox="0 0 24 24"><path d="${skill.icon.path}"/></symbol>`
		);
	return `<svg xmlns="http://www.w3.org/2000/svg">${[...symbols.values()].join('')}</svg>\n`;
}

/** Changes whenever a drawing does: added to the sprite URL, so browsers never use a stale copy. */
export function spriteVersion(groups: readonly SkillGroup[]): string {
	return hash(logoSprite(groups));
}

/** The skill groups as the page needs them: each logo by id and colour. */
export function shownGroups(groups: readonly SkillGroup[]): ShownSkillGroup[] {
	return groups.map((group) => ({
		...group,
		skills: group.skills.map(({ name, icon }) => ({
			name,
			logo: { id: logoId(icon), hex: icon.hex }
		}))
	}));
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
