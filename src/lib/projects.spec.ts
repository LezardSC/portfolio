import { describe, expect, it } from 'vitest';
import { mixHex } from './color';
import {
	countFor,
	DOMAIN_COLOR,
	DOMAIN_TILE,
	DOMAINS,
	filterProjects,
	hiddenCount,
	mainDomain,
	PHONE_OTHERS,
	mediaIssues,
	NO_FILTERS,
	primaryLink,
	shouldPlayVideo,
	sortProjects,
	splitTiers,
	type Project
} from './projects';
import { contrastRatio } from './skills';

function make(p: Partial<Project> & Pick<Project, 'id'>): Project {
	return {
		title: p.id,
		description: { en: 'en', fr: 'fr' },
		summary: { en: 'en.', fr: 'fr.' },
		date: '2024-01',
		context: 'school',
		domains: ['web'],
		tech: ['TS'],
		links: {},
		...p
	};
}

const list: Project[] = [
	make({ id: 'a', context: 'school', domains: ['low-level'], date: '2022-11' }),
	make({
		id: 'b',
		context: 'hackathon',
		domains: ['web', 'blockchain'],
		date: '2024-04',
		featured: 2
	}),
	make({ id: 'c', context: 'personal', domains: ['ai'], date: '2026-05', featured: 1 }),
	make({ id: 'd', context: 'school', domains: ['blockchain'], date: '2024-12' }),
	make({ id: 'e', context: 'professional', domains: ['ai'], date: '2025-07' })
];
const ids = (ps: Project[]) => ps.map((p) => p.id);

describe('filterProjects', () => {
	it('returns everything with no filters', () => {
		expect(ids(filterProjects(list, NO_FILTERS))).toEqual(['a', 'b', 'c', 'd', 'e']);
	});
	it('filters by context', () => {
		expect(ids(filterProjects(list, { context: 'school', domain: 'all' }))).toEqual(['a', 'd']);
	});
	it("filters by domain, matching any of a project's domains", () => {
		expect(ids(filterProjects(list, { context: 'all', domain: 'blockchain' }))).toEqual(['b', 'd']);
	});
	it('combines both groups with AND', () => {
		expect(ids(filterProjects(list, { context: 'school', domain: 'blockchain' }))).toEqual(['d']);
	});
	it('can return nothing', () => {
		expect(filterProjects(list, { context: 'professional', domain: 'games' })).toEqual([]);
	});
});

describe('countFor', () => {
	it('counts a context chip against the current domain', () => {
		const f = { context: 'all', domain: 'ai' } as const;
		expect(countFor(list, f, 'context', 'personal')).toBe(1);
		expect(countFor(list, f, 'context', 'school')).toBe(0);
		expect(countFor(list, f, 'context', 'all')).toBe(2);
	});
	it('counts a domain chip against the current context, ignoring the current domain', () => {
		const f = { context: 'school', domain: 'low-level' } as const;
		expect(countFor(list, f, 'domain', 'blockchain')).toBe(1);
		expect(countFor(list, f, 'domain', 'all')).toBe(2);
	});
});

describe('sortProjects', () => {
	it('newest: date descending', () => {
		expect(ids(sortProjects(list, 'newest'))).toEqual(['c', 'e', 'd', 'b', 'a']);
	});
	it('featured: featured ascending first, then the rest newest first', () => {
		expect(ids(sortProjects(list, 'featured'))).toEqual(['c', 'b', 'e', 'd', 'a']);
	});
	it('breaks ties deterministically by id', () => {
		const tied = [
			make({ id: 'z', date: '2024-01', featured: 1 }),
			make({ id: 'y', date: '2024-01', featured: 1 }),
			make({ id: 'x', date: '2024-01' }),
			make({ id: 'w', date: '2024-01' })
		];
		expect(ids(sortProjects(tied, 'featured'))).toEqual(['y', 'z', 'w', 'x']);
		expect(ids(sortProjects(tied, 'newest'))).toEqual(['w', 'x', 'y', 'z']);
	});
	it('does not mutate its input', () => {
		const copy = [...list];
		sortProjects(list, 'newest');
		expect(list).toEqual(copy);
	});
});

describe('splitTiers', () => {
	it('puts the first 6 in large and the rest in small by default', () => {
		const many = Array.from({ length: 8 }, (_, i) => make({ id: `p${i}` }));
		const { large, small } = splitTiers(many);
		expect(ids(large)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);
		expect(ids(small)).toEqual(['p6', 'p7']);
	});
	it('puts everything in large when there are fewer than n', () => {
		expect(splitTiers(list.slice(0, 3))).toEqual({ large: list.slice(0, 3), small: [] });
	});
	it('handles an empty list', () => {
		expect(splitTiers([])).toEqual({ large: [], small: [] });
	});
});

describe('primaryLink', () => {
	it('prefers the repo', () => {
		expect(primaryLink(make({ id: 'r', links: { repo: 'https://r', demo: 'https://d' } }))).toBe(
			'https://r'
		);
	});
	it('falls back to the demo', () => {
		expect(primaryLink(make({ id: 'd', links: { demo: 'https://d' } }))).toBe('https://d');
	});
	it('is undefined for a private project', () => {
		expect(primaryLink(make({ id: 'p', links: {} }))).toBeUndefined();
	});
});

describe('shouldPlayVideo', () => {
	const on = { desktop: true, reducedMotion: false, inView: true };
	it('plays on desktop, in view, without reduced motion', () => {
		expect(shouldPlayVideo(on)).toBe(true);
	});
	it('never plays on a phone-width screen', () => {
		expect(shouldPlayVideo({ ...on, desktop: false })).toBe(false);
	});
	it('never plays under prefers-reduced-motion', () => {
		expect(shouldPlayVideo({ ...on, reducedMotion: true })).toBe(false);
	});
	it('does not play off-screen', () => {
		expect(shouldPlayVideo({ ...on, inView: false })).toBe(false);
	});
});

describe('mediaIssues', () => {
	const all = () => true;
	it('accepts an existing image and a video with an image poster', () => {
		expect(mediaIssues({ kind: 'image', src: 'projects/a.webp' }, all)).toEqual([]);
		expect(
			mediaIssues({ kind: 'video', src: 'projects/a.mp4', poster: 'projects/a.jpg' }, all)
		).toEqual([]);
	});
	it('rejects image formats it does not know, GIFs included', () => {
		expect(mediaIssues({ kind: 'image', src: 'projects/a.gif' }, all)).toHaveLength(1);
	});
	it('rejects a video that is not MP4 and a poster that is not an image', () => {
		const issues = mediaIssues(
			{ kind: 'video', src: 'projects/a.webm', poster: 'projects/a.mp4' },
			all
		);
		expect(issues).toHaveLength(2);
	});
	it('rejects an empty poster', () => {
		expect(
			mediaIssues({ kind: 'video', src: 'projects/a.mp4', poster: '' }, all).length
		).toBeGreaterThan(0);
	});
	it('rejects absolute paths and names missing files', () => {
		const exists = (src: string) => src !== 'projects/missing.jpg';
		expect(mediaIssues({ kind: 'image', src: '/projects/a.jpg' }, exists)[0]).toContain('relative');
		expect(
			mediaIssues(
				{ kind: 'video', src: 'projects/a.mp4', poster: 'projects/missing.jpg' },
				exists
			)[0]
		).toContain('projects/missing.jpg');
	});
});

describe('mainDomain', () => {
	it('is the first domain of the list', () => {
		const p = { domains: ['blockchain', 'web'] } as Project;
		expect(mainDomain(p)).toBe('blockchain');
	});
});

describe('hiddenCount', () => {
	it('counts the tiles past the first PHONE_OTHERS', () => {
		expect(PHONE_OTHERS).toBe(6);
		expect(hiddenCount(11)).toBe(5);
		expect(hiddenCount(7)).toBe(1);
	});
	it('is 0 when everything fits', () => {
		expect(hiddenCount(6)).toBe(0);
		expect(hiddenCount(3)).toBe(0);
		expect(hiddenCount(0)).toBe(0);
	});
	it('takes another number of shown tiles', () => {
		expect(hiddenCount(4, 2)).toBe(2);
	});
});

describe('domain tiles (phone)', () => {
	// Page text colours per theme (src/app.css).
	const TEXT = {
		light: { body: '#2b2a26', muted: '#56534c' },
		dark: { body: '#d9d5cb', muted: '#a9a498' }
	};
	it.each(DOMAINS)('%s has a colour whose tile reads at 4.5:1 in both themes', (d) => {
		for (const theme of ['light', 'dark'] as const) {
			const { base, pct, fg } = DOMAIN_TILE[theme];
			const bg = mixHex(DOMAIN_COLOR[d], base, pct);
			const label = mixHex(DOMAIN_COLOR[d], '#ffffff', fg);
			expect(contrastRatio(label, bg), `${theme} label`).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(TEXT[theme].body, bg), `${theme} body`).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(TEXT[theme].muted, bg), `${theme} muted`).toBeGreaterThanOrEqual(4.5);
		}
	});
	it('gives every domain its own colour', () => {
		expect(new Set(Object.values(DOMAIN_COLOR)).size).toBe(DOMAINS.length);
	});
});
