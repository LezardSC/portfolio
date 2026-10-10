import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LANGS } from '$lib/i18n/lang';
import { glanceRows } from '$lib/glance';
import { dicts } from '$lib/i18n';
import { HACKATHONS, JOBS } from './experience';
import { PROFILE } from './profile';

/** static/ at the repo root, found from this file so the test works from any cwd. */
const staticFile = (src: string) =>
	resolve(fileURLToPath(new URL('../../../static', import.meta.url)), src);

describe('profile data', () => {
	it('has a name', () => {
		expect(PROFILE.name.trim()).not.toBe('');
	});

	it('has non-empty text in both languages', () => {
		const texts = [PROFILE.role, PROFILE.pitch, PROFILE.pitchMore, ...PROFILE.bio];
		for (const text of texts)
			for (const lang of LANGS) expect(text[lang].trim(), JSON.stringify(text)).not.toBe('');
	});

	it.each(LANGS)('renders every glance row with text (%s)', (lang) => {
		const h = dicts[lang].hero;
		const rows = glanceRows(PROFILE.glance, { jobs: JOBS, hackathons: HACKATHONS }, lang, {
			tally: h.glanceTally,
			wins: h.glanceWins,
			podiums: h.glancePodiums
		});
		for (const r of rows) {
			expect(r.label.trim(), JSON.stringify(r)).not.toBe('');
			expect(r.value.trim(), JSON.stringify(r)).not.toBe('');
			if (r.short !== undefined) expect(r.short.trim(), JSON.stringify(r)).not.toBe('');
		}
	});

	it('has at least one About paragraph and at most one full-width glance row', () => {
		expect(PROFILE.bio.length).toBeGreaterThan(0);
		expect(PROFILE.glance.filter((r) => r.wide).length).toBeLessThanOrEqual(1);
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
});
