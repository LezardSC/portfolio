import { describe, expect, it } from 'vitest';
import { LANGS } from '$lib/i18n/lang';
import { localize, MEDALS } from '$lib/experience';
import { EDUCATION, HACKATHONS, JOBS } from './experience';
import { ALL_PROJECTS } from './projects';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const YEAR = /^\d{4}$/;

describe('experience data', () => {
	it('has content in every list', () => {
		expect(JOBS.length).toBeGreaterThan(0);
		expect(EDUCATION.length).toBeGreaterThan(0);
		expect(HACKATHONS.length).toBeGreaterThan(0);
	});

	it('uses YYYY-MM for jobs and hackathons, YYYY for education', () => {
		for (const j of JOBS) {
			expect(j.start, j.company).toMatch(MONTH);
			if (j.end !== undefined) expect(j.end, j.company).toMatch(MONTH);
		}
		for (const e of EDUCATION) {
			if (e.start !== undefined) expect(e.start, e.school).toMatch(YEAR);
			expect(e.end, e.school).toMatch(YEAR);
		}
		for (const h of HACKATHONS) expect(h.date, h.event).toMatch(MONTH);
	});

	it('never ends before it starts', () => {
		for (const j of JOBS) if (j.end) expect(j.start <= j.end, j.company).toBe(true);
		for (const e of EDUCATION) if (e.start) expect(e.start <= e.end, e.school).toBe(true);
	});

	it('gives every job at least one point', () => {
		expect(JOBS.filter((j) => j.points.length === 0).map((j) => j.company)).toEqual([]);
	});

	it('uses medals 1 to 3', () => {
		for (const h of HACKATHONS) expect(MEDALS, h.event).toContain(h.medal);
	});

	it('keeps hackathon event names short enough for one pill line', () => {
		expect(HACKATHONS.filter((h) => h.event.length > 25).map((h) => h.event)).toEqual([]);
	});

	it('spells out every abbreviated event name', () => {
		for (const h of HACKATHONS)
			if (h.fullName !== undefined) expect(h.fullName.trim(), h.event).not.toBe('');
	});

	it('links results only to projects that exist and are shown', () => {
		const shown = new Set(ALL_PROJECTS.filter((p) => !p.hidden).map((p) => p.id));
		for (const h of HACKATHONS)
			if (h.projectId !== undefined) expect(shown.has(h.projectId), h.event).toBe(true);
	});

	it('uses https for every link', () => {
		for (const e of EDUCATION) if (e.link) expect(e.link, e.school).toMatch(/^https:\/\//);
	});

	it('has non-empty text in both languages', () => {
		for (const lang of LANGS) {
			const texts = [
				...JOBS.flatMap((j) => [
					j.company,
					j.role[lang],
					...j.points.map((p) => p[lang]),
					...j.tech,
					...(j.quote ? [j.quote.text[lang], j.quote.author, j.quote.role[lang]] : [])
				]),
				...EDUCATION.flatMap((e) => [e.school, e.title[lang], ...e.points.map((p) => p[lang])]),
				...HACKATHONS.flatMap((h) => [h.event, ...(h.project ? [localize(h.project, lang)] : [])])
			];
			expect(texts.filter((t) => t.trim() === '')).toEqual([]);
		}
	});
});
