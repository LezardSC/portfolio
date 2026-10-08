import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { mediaIssues } from '$lib/projects';
import { DOMAIN_IDS } from './categories';
import { ALL_PROJECTS, FEATURED } from './projects';

/** static/ at the repo root, found from this file so the test works from any cwd. */
const STATIC = fileURLToPath(new URL('../../../static', import.meta.url));

/**
 * Whether `src` exists under `root` spelled exactly, case included. macOS ignores case by
 * default, but the Linux server doesn't: `Shot.jpg` referenced as `shot.jpg` would 404 there.
 */
function existsExactly(root: string, src: string): boolean {
	let dir = root;
	for (const part of src.split('/')) {
		try {
			if (!readdirSync(dir).includes(part)) return false;
		} catch {
			return false;
		}
		dir = join(dir, part);
	}
	return true;
}

describe('existsExactly', () => {
	const root = mkdtempSync(join(tmpdir(), 'media-'));
	mkdirSync(join(root, 'projects'));
	writeFileSync(join(root, 'projects', 'Shot.jpg'), '');
	it('finds a file spelled exactly as on disk', () => {
		expect(existsExactly(root, 'projects/Shot.jpg')).toBe(true);
	});
	it('rejects a path whose case differs (it would 404 on the Linux server)', () => {
		expect(existsExactly(root, 'projects/shot.jpg')).toBe(false);
		expect(existsExactly(root, 'Projects/Shot.jpg')).toBe(false);
	});
	it('rejects a missing file', () => {
		expect(existsExactly(root, 'projects/none.jpg')).toBe(false);
	});
});

describe('project data', () => {
	it('has unique kebab-case ids', () => {
		const ids = ALL_PROJECTS.map((p) => p.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});

	it('has a one-sentence summary in both languages', () => {
		for (const p of ALL_PROJECTS)
			for (const lang of ['en', 'fr'] as const) {
				const s = p.summary[lang];
				expect(s.trim(), `${p.id} ${lang}`).not.toBe('');
				expect(s, `${p.id} ${lang}: one sentence ending with a full stop`).toMatch(/^[^.]+\.$/);
				expect(s.length, `${p.id} ${lang}: short enough for a tile`).toBeLessThanOrEqual(100);
			}
	});

	it('has YYYY-MM dates with a real month', () => {
		for (const p of ALL_PROJECTS) expect(p.date, p.id).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
	});

	it('has non-empty text in both languages', () => {
		for (const p of ALL_PROJECTS) {
			expect(p.title.trim(), p.id).not.toBe('');
			for (const text of [p.description, ...(p.award ? [p.award] : [])]) {
				expect(text.en.trim(), p.id).not.toBe('');
				expect(text.fr.trim(), p.id).not.toBe('');
			}
		}
	});

	it('has at least one valid, unique domain and one tech tag per project', () => {
		for (const p of ALL_PROJECTS) {
			expect(p.domains.length, p.id).toBeGreaterThan(0);
			expect(new Set(p.domains).size, p.id).toBe(p.domains.length);
			for (const d of p.domains) expect(DOMAIN_IDS, p.id).toContain(d);
			expect(p.tech.length, p.id).toBeGreaterThan(0);
		}
	});

	it('has https links only', () => {
		for (const p of ALL_PROJECTS)
			for (const url of [p.links.repo, p.links.demo].filter(Boolean))
				expect(url, p.id).toMatch(/^https:\/\//);
	});

	it('lists existing, visible, distinct projects in FEATURED', () => {
		const byId = new Map(ALL_PROJECTS.map((p) => [p.id, p]));
		const problems = FEATURED.flatMap((id, i) => {
			const p = byId.get(id);
			if (!p) return [`"${id}": no project has this id`];
			if (p.hidden) return [`"${id}": is hidden, remove it from FEATURED or unhide it`];
			if (FEATURED.indexOf(id) !== i) return [`"${id}": listed twice`];
			return [];
		});
		expect(problems).toEqual([]);
	});

	it('has valid media files that exist in static/', () => {
		const exists = (src: string) => existsExactly(STATIC, src);
		const issues = ALL_PROJECTS.flatMap((p) =>
			p.media ? mediaIssues(p.media, exists).map((issue) => `${p.id}: ${issue}`) : []
		);
		expect(issues).toEqual([]);
	});
});
