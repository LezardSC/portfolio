import type { Lang, Localized } from '$lib/i18n/lang';

/** One 24×24 SVG path, drawn with fill="currentColor". */
export type SkillIcon = { path: string };

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
