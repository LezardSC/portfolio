import { describe, expect, it } from 'vitest';
import { LANGS } from '$lib/i18n/lang';
import { skillName } from '$lib/skills';
import { SKILL_GROUPS } from './skills';

const allSkills = SKILL_GROUPS.flatMap((g) => g.skills);

describe('skill data', () => {
	it('lists the groups in the positioning order', () => {
		expect(SKILL_GROUPS.map((g) => g.id)).toEqual([
			'backend',
			'systems',
			'devops',
			'ai',
			'blockchain',
			'frontend'
		]);
	});

	it('has at least one skill in every group', () => {
		const empty = SKILL_GROUPS.filter((g) => g.skills.length === 0).map((g) => g.id);
		expect(empty).toEqual([]);
	});

	it('puts each skill in exactly one group', () => {
		const names = allSkills.map((s) => skillName(s, 'en').toLowerCase());
		const dupes = names.filter((n, i) => names.indexOf(n) !== i);
		expect(dupes).toEqual([]);
	});

	it('has non-empty text in both languages', () => {
		for (const group of SKILL_GROUPS) {
			for (const lang of LANGS) {
				expect(group.title[lang].trim(), group.id).not.toBe('');
				for (const skill of group.skills)
					expect(skillName(skill, lang).trim(), JSON.stringify(skill.name)).not.toBe('');
			}
		}
	});

	it('gives every skill a well-formed SVG path', () => {
		const bad = allSkills
			.filter((s) => !/^[Mm][MmLlHhVvCcSsQqTtAaZz0-9.,\s-]*$/.test(s.icon.path))
			.map((s) => skillName(s, 'en'));
		expect(bad).toEqual([]);
	});
});
