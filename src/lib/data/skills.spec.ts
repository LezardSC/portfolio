import { describe, expect, it } from 'vitest';
import { LANGS } from '$lib/i18n/lang';
import { skillName } from '$lib/skills';
import { isIconPath } from './icons';
import { SKILL_GROUPS } from './skills';

const allSkills = SKILL_GROUPS.flatMap((g) => g.skills);

describe('skill data', () => {
	it('has unique kebab-case group ids', () => {
		const ids = SKILL_GROUPS.map((g) => g.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});

	it('gives every group a well-formed icon path', () => {
		const bad = SKILL_GROUPS.filter((g) => !isIconPath(g.icon)).map((g) => g.id);
		expect(bad).toEqual([]);
	});

	it('has at least one skill in every group', () => {
		const empty = SKILL_GROUPS.filter((g) => g.skills.length === 0).map((g) => g.id);
		expect(empty).toEqual([]);
	});

	it('lists each skill at most once per group', () => {
		for (const group of SKILL_GROUPS) {
			const names = group.skills.map((s) => skillName(s, 'en').toLowerCase());
			const dupes = names.filter((n, i) => names.indexOf(n) !== i);
			expect(dupes, group.id).toEqual([]);
		}
	});

	it('has non-empty text in both languages', () => {
		for (const group of SKILL_GROUPS) {
			for (const lang of LANGS) {
				expect(group.title[lang].trim(), group.id).not.toBe('');
				expect(group.description[lang].trim(), `${group.id} description`).not.toBe('');
				for (const skill of group.skills)
					expect(skillName(skill, lang).trim(), JSON.stringify(skill.name)).not.toBe('');
			}
		}
	});

	it('gives every skill a well-formed SVG path', () => {
		const bad = allSkills.filter((s) => !isIconPath(s.icon.path)).map((s) => skillName(s, 'en'));
		expect(bad).toEqual([]);
	});

	it('gives every skill a brand colour as 6 hex digits without #', () => {
		const bad = allSkills
			.filter((s) => !/^[0-9A-F]{6}$/i.test(s.icon.hex))
			.map((s) => skillName(s, 'en'));
		expect(bad).toEqual([]);
	});
});
