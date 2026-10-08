import { describe, expect, it } from 'vitest';
import type { Hackathon, Job } from './experience';
import { glanceRows, plural, type GlanceEntry, type GlanceItem, type GlanceText } from './glance';

const T: GlanceText = {
	tally: '{wins}, {podiums}',
	wins: { one: '{n} win', other: '{n} wins' },
	podiums: { one: '{n} podium', other: '{n} podiums' }
};
const L = (en: string, fr = en) => ({ en, fr });

const job = (start: string, end: string | undefined, extra: Partial<Job> = {}): Job => ({
	company: `Co ${start}`,
	role: L(`Role ${start}`),
	start,
	end,
	internship: false,
	points: [],
	tech: [],
	...extra
});
const medal = (m: 1 | 2 | 3): Hackathon => ({ medal: m, event: 'E', date: '2024-01' });
/** The rendered row with this English label (fails the test if it is missing). */
const row = (rows: GlanceItem[], label: string) => {
	const r = rows.find((x) => x.label === label);
	expect(r, label).toBeDefined();
	return r!;
};

const entries: GlanceEntry[] = [
	{ label: L('Education', 'Formation'), value: L('42'), short: L('42 L'), wide: true },
	{ label: L('Latest role'), auto: 'latestRole' },
	{ label: L('Hackathons'), auto: 'hackathons' }
];

describe('plural', () => {
	it('uses the language plural rules', () => {
		const f = { one: '{n} x', other: '{n} xs' };
		expect(plural(1, f, 'en')).toBe('1 x');
		expect(plural(0, f, 'en')).toBe('0 xs');
		expect(plural(0, f, 'fr')).toBe('0 x');
		expect(plural(2, f, 'fr')).toBe('2 xs');
	});
});

describe('glanceRows', () => {
	it('passes hand-written rows through in the page language', () => {
		const [first] = glanceRows(entries, { jobs: [], hackathons: [] }, 'fr', T);
		expect(first).toEqual({ label: 'Formation', value: '42', short: '42 L', wide: true });
	});

	it('derives the latest role from the newest job, short names first', () => {
		const jobs = [
			job('2024-10', '2025-04'),
			job('2025-07', '2026-01', { roleShort: L('ML dev'), companyShort: 'Sogeti (Capgemini)' })
		];
		expect(row(glanceRows(entries, { jobs, hackathons: [] }, 'en', T), 'Latest role')).toEqual({
			label: 'Latest role',
			value: 'ML dev — Sogeti (Capgemini)',
			short: 'Sogeti (Capgemini)',
			wide: false
		});
	});

	it('falls back to the full role and company, and treats a job with no end as the newest', () => {
		const jobs = [job('2025-07', '2026-01'), job('2020-01', undefined)];
		const r = row(glanceRows(entries, { jobs, hackathons: [] }, 'en', T), 'Latest role');
		expect(r.value).toBe('Role 2020-01 — Co 2020-01');
		expect(r.short).toBe('Co 2020-01');
	});

	it('counts wins and podiums', () => {
		const hackathons = [medal(1), medal(1), medal(2), medal(3), medal(3)];
		const r = row(glanceRows(entries, { jobs: [], hackathons }, 'en', T), 'Hackathons');
		expect(r.value).toBe('2 wins, 5 podiums');
	});

	it('shows only podiums when there is no win yet', () => {
		const r = row(glanceRows(entries, { jobs: [], hackathons: [medal(3)] }, 'en', T), 'Hackathons');
		expect(r.value).toBe('1 podium');
	});

	it('omits derived rows that have no data', () => {
		const rows = glanceRows(entries, { jobs: [], hackathons: [] }, 'en', T);
		expect(rows.map((r) => r.label)).toEqual(['Education']);
	});
});
