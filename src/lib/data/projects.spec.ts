import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CONTEXTS, DOMAINS } from '$lib/projects';
import { PROJECTS } from './projects';

/** static/ at the repo root, found from this file so the test works from any cwd. */
const staticFile = (src: string) =>
	resolve(fileURLToPath(new URL('../../../static', import.meta.url)), src);

describe('project data', () => {
	it('has unique kebab-case ids', () => {
		const ids = PROJECTS.map((p) => p.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});

	it('has YYYY-MM dates with a real month', () => {
		for (const p of PROJECTS) expect(p.date, p.id).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
	});

	it('has non-empty text in both languages', () => {
		for (const p of PROJECTS) {
			expect(p.title.trim(), p.id).not.toBe('');
			for (const text of [p.description, ...(p.award ? [p.award] : [])]) {
				expect(text.en.trim(), p.id).not.toBe('');
				expect(text.fr.trim(), p.id).not.toBe('');
			}
		}
	});

	it('has at least one valid, unique domain and one tech tag per project', () => {
		for (const p of PROJECTS) {
			expect(p.domains.length, p.id).toBeGreaterThan(0);
			expect(new Set(p.domains).size, p.id).toBe(p.domains.length);
			for (const d of p.domains) expect(DOMAINS, p.id).toContain(d);
			expect(p.tech.length, p.id).toBeGreaterThan(0);
		}
	});

	it('has at least one project in every context', () => {
		for (const c of CONTEXTS)
			expect(
				PROJECTS.some((p) => p.context === c),
				c
			).toBe(true);
	});

	it('has https links only', () => {
		for (const p of PROJECTS)
			for (const url of [p.links.repo, p.links.demo].filter(Boolean))
				expect(url, p.id).toMatch(/^https:\/\//);
	});

	it('includes at least one private project (no links)', () => {
		expect(PROJECTS.some((p) => !p.links.repo && !p.links.demo)).toBe(true);
	});

	it('has unique positive integer featured ranks', () => {
		const ranks = PROJECTS.flatMap((p) => (p.featured === undefined ? [] : [p.featured]));
		expect(new Set(ranks).size).toBe(ranks.length);
		for (const r of ranks) expect(Number.isInteger(r) && r > 0, String(r)).toBe(true);
	});

	it('points media at relative paths that exist in static/', () => {
		const bad = PROJECTS.flatMap((p) =>
			p.media
				? [p.media.src, ...(p.media.poster ? [p.media.poster] : [])].map((src) => ({
						id: p.id,
						src
					}))
				: []
		).filter(({ src }) => src.startsWith('/') || !existsSync(staticFile(src)));
		expect(bad).toEqual([]);
	});
});
