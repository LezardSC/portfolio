import { describe, expect, it } from 'vitest';
import { skillName, type Skill } from './skills';

const icon = { path: 'M0 0h24v24H0z' };

describe('skillName', () => {
	it('returns a plain string name as-is in every language', () => {
		const skill: Skill = { name: 'Rust', icon };
		expect(skillName(skill, 'en')).toBe('Rust');
		expect(skillName(skill, 'fr')).toBe('Rust');
	});

	it('picks the requested language of a localized name', () => {
		const skill: Skill = {
			name: { en: 'Computer Vision', fr: 'Vision par ordinateur' },
			icon
		};
		expect(skillName(skill, 'en')).toBe('Computer Vision');
		expect(skillName(skill, 'fr')).toBe('Vision par ordinateur');
	});
});
