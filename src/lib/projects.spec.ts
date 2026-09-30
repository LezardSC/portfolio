import { describe, expect, it } from 'vitest';
import {
	countFor,
	filterProjects,
	NO_FILTERS,
	primaryLink,
	sortProjects,
	splitTiers,
	type Project
} from './projects';

function make(p: Partial<Project> & Pick<Project, 'id'>): Project {
	return {
		title: p.id,
		description: { en: 'en', fr: 'fr' },
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
