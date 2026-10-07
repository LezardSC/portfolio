import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LANGS } from '$lib/i18n/lang';
import { PROFILE } from './profile';

/** static/ at the repo root, found from this file so the test works from any cwd. */
const staticFile = (src: string) =>
	resolve(fileURLToPath(new URL('../../../static', import.meta.url)), src);

describe('profile data', () => {
	it('has a name', () => {
		expect(PROFILE.name.trim()).not.toBe('');
	});

	it('has non-empty text in both languages', () => {
		const texts = [
			PROFILE.role,
			PROFILE.pitch,
			...PROFILE.bio,
			...PROFILE.glance.flatMap((r) => [r.label, r.value])
		];
		for (const text of texts)
			for (const lang of LANGS) expect(text[lang].trim(), JSON.stringify(text)).not.toBe('');
	});

	it('has three bio paragraphs and the five at-a-glance rows', () => {
		expect(PROFILE.bio).toHaveLength(3);
		expect(PROFILE.glance.map((r) => r.label.en)).toEqual([
			'Education',
			'Latest role',
			'Stack',
			'Hackathons',
			'Languages'
		]);
	});

	it('links GitHub over https', () => {
		expect(PROFILE.github).toMatch(/^https:\/\/github\.com\//);
	});

	it('has a plain email address', () => {
		expect(PROFILE.email).toMatch(/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i);
	});

	it('links LinkedIn and Malt profiles over https', () => {
		expect(PROFILE.linkedin).toMatch(/^https:\/\/www\.linkedin\.com\/in\/[^/]+\/?$/);
		expect(PROFILE.malt).toMatch(/^https:\/\/www\.malt\.fr\/profile\/[^/]+$/);
	});

	it('points the CV of every language and the photo at relative files in static/', () => {
		const paths = [...LANGS.map((l) => PROFILE.cv[l]), PROFILE.photo];
		const bad = paths.filter((p) => p.startsWith('/') || !existsSync(staticFile(p)));
		expect(bad).toEqual([]);
	});

	it('uses a distinct CV file per language', () => {
		expect(PROFILE.cv.en).not.toBe(PROFILE.cv.fr);
	});
});
