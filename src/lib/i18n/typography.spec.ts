import { describe, expect, it } from 'vitest';
import { EDUCATION, HACKATHONS, JOBS } from '$lib/data/experience';
import { PROFILE } from '$lib/data/profile';
import { PROJECTS } from '$lib/data/projects';
import { SKILL_GROUPS } from '$lib/data/skills';
import { dicts } from './index';
import { frenchSpacingIssues, straightApostrophes } from './typography';

/** Every string under an `fr` key, at any depth. */
function frenchStrings(value: unknown): string[] {
	if (Array.isArray(value)) return value.flatMap(frenchStrings);
	if (value === null || typeof value !== 'object') return [];
	return Object.entries(value).flatMap(([k, v]) =>
		k === 'fr' && typeof v === 'string' ? [v] : frenchStrings(v)
	);
}

/** Every string leaf of an object (the French dictionary). */
function leaves(value: unknown): string[] {
	if (typeof value === 'string') return [value];
	if (value === null || typeof value !== 'object') return [];
	return Object.values(value).flatMap(leaves);
}

describe('frenchSpacingIssues', () => {
	it('flags a plain space before : ; ! ? % and »', () => {
		for (const text of ['a :', 'a ;', 'a !', 'a ?', '125 %', '« a »'])
			expect(frenchSpacingIssues(text), text).not.toEqual([]);
	});
	it('flags a plain space after «', () => {
		expect(frenchSpacingIssues('« a »')).toHaveLength(1);
	});
	it('accepts no-break and narrow no-break spaces', () => {
		expect(frenchSpacingIssues('Copié ! 125 % « a » x ;')).toEqual([]);
	});
	it('ignores colons without a space (URLs, times)', () => {
		expect(frenchSpacingIssues('https://x.fr 12:30')).toEqual([]);
	});
	it('returns the spot with some context', () => {
		expect(frenchSpacingIssues('les systèmes : mémoire')[0]).toContain('systèmes :');
	});
});

describe('straightApostrophes', () => {
	it('flags a straight apostrophe with some context', () => {
		expect(straightApostrophes("pour l'argent")).toEqual(["pour l'argent"]);
	});
	it('accepts the typographic apostrophe', () => {
		expect(straightApostrophes('pour l’argent')).toEqual([]);
	});
});

describe('French content', () => {
	const sources = {
		dictionary: leaves(dicts.fr),
		profile: frenchStrings(PROFILE),
		projects: frenchStrings(PROJECTS),
		experience: frenchStrings([JOBS, EDUCATION, HACKATHONS]),
		skills: frenchStrings(SKILL_GROUPS)
	};
	it.each(Object.entries(sources))(
		'%s uses no-break spaces where French needs them',
		(_, texts) => {
			expect(texts.length).toBeGreaterThan(0);
			expect(texts.flatMap(frenchSpacingIssues)).toEqual([]);
		}
	);
	it.each(Object.entries(sources))('%s uses ’ rather than a straight apostrophe', (_, texts) => {
		expect(texts.flatMap(straightApostrophes)).toEqual([]);
	});
});
