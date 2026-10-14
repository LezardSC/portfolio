import { describe, expect, it } from 'vitest';
import {
	durationLabel,
	durationMonths,
	formatPeriod,
	hackathonsNewestFirst,
	newestFirst,
	periodPoints,
	placements,
	projectResults,
	type Hackathon
} from './experience';

describe('formatPeriod', () => {
	it('formats a month range in English', () => {
		expect(formatPeriod('2025-07', '2026-01', 'en', 'Present')).toBe('Jul 2025 – Jan 2026');
	});
	it('formats a month range in French', () => {
		expect(formatPeriod('2025-07', '2026-01', 'fr', "Aujourd'hui")).toBe('juil. 2025 – janv. 2026');
	});
	it.each(['Pacific/Kiritimati', 'Pacific/Pago_Pago'])(
		'keeps January and December in their own year under TZ=%s',
		(tz) => {
			const saved = process.env.TZ;
			process.env.TZ = tz; // Node applies a TZ change immediately
			try {
				expect(new Date(2024, 0, 1).getTimezoneOffset(), 'TZ did not apply').not.toBe(0);
				expect(formatPeriod('2024-01', '2024-12', 'en', 'Present')).toBe('Jan 2024 – Dec 2024');
			} finally {
				if (saved === undefined) delete process.env.TZ;
				else process.env.TZ = saved;
			}
		}
	);
	it('uses the present label when there is no end', () => {
		expect(formatPeriod('2026-02', undefined, 'en', 'Present')).toBe('Feb 2026 – Present');
		expect(formatPeriod('2026-02', undefined, 'fr', "Aujourd'hui")).toBe(
			"févr. 2026 – Aujourd'hui"
		);
	});
	it('formats a year range', () => {
		expect(formatPeriod('2022', '2026', 'en', 'Present')).toBe('2022 – 2026');
	});
	it('shows the end alone when there is no start or start equals end', () => {
		expect(formatPeriod(undefined, '2024', 'fr', "Aujourd'hui")).toBe('2024');
		expect(formatPeriod('2024', '2024', 'en', 'Present')).toBe('2024');
	});
});

describe('periodPoints', () => {
	it('gives each end of a range its text and machine-readable date', () => {
		expect(periodPoints('2025-07', '2026-01', 'en', 'Present')).toEqual([
			{ text: 'Jul 2025', datetime: '2025-07' },
			{ text: 'Jan 2026', datetime: '2026-01' }
		]);
	});
	it('gives "present" no date', () => {
		expect(periodPoints('2026-02', undefined, 'fr', 'Aujourd’hui')).toEqual([
			{ text: 'févr. 2026', datetime: '2026-02' },
			{ text: 'Aujourd’hui' }
		]);
	});
	it('collapses to one point when there is no start or start equals end', () => {
		expect(periodPoints(undefined, '2024', 'en', 'Present')).toEqual([
			{ text: '2024', datetime: '2024' }
		]);
		expect(periodPoints('2024', '2024', 'en', 'Present')).toEqual([
			{ text: '2024', datetime: '2024' }
		]);
	});
});

describe('newestFirst', () => {
	it('sorts by end, newest first, with an open end first', () => {
		const items = [
			{ id: 'old', start: '2024-10', end: '2025-04' },
			{ id: 'open', start: '2026-02' },
			{ id: 'recent', start: '2025-07', end: '2026-01' }
		];
		expect(newestFirst(items).map((i) => i.id)).toEqual(['open', 'recent', 'old']);
	});
	it('breaks ties on end with the newest start', () => {
		const items = [
			{ id: 'long', start: '2022', end: '2026' },
			{ id: 'short', start: '2025', end: '2026' }
		];
		expect(newestFirst(items).map((i) => i.id)).toEqual(['short', 'long']);
	});
	it('does not mutate its input', () => {
		const items = [{ end: '2024' }, { end: '2026' }];
		newestFirst(items);
		expect(items.map((i) => i.end)).toEqual(['2024', '2026']);
	});
});

describe('hackathonsNewestFirst', () => {
	it('sorts by date, newest first, ignoring the medal', () => {
		const list: Hackathon[] = [
			{ medal: 1, event: 'A', date: '2024-03' },
			{ medal: 3, event: 'B', date: '2025-11' },
			{ medal: 2, event: 'C', date: '2024-11' }
		];
		expect(hackathonsNewestFirst(list).map((h) => h.event)).toEqual(['B', 'C', 'A']);
	});
});

describe('projectResults', () => {
	const list: Hackathon[] = [
		{ medal: 2, event: 'A', date: '2024-11', projectId: 'x' },
		{ medal: 1, event: 'B', date: '2024-03', projectId: 'x' },
		{ medal: 1, event: 'C', date: '2024-04', projectId: 'x' },
		{ medal: 1, event: 'D', date: '2025-01', projectId: 'y' },
		{ medal: 3, event: 'E', date: '2025-02' }
	];
	it("keeps only the project's results, best medal first, then newest", () => {
		expect(projectResults('x', list).map((h) => h.event)).toEqual(['C', 'B', 'A']);
	});
	it('is empty for a project without results', () => {
		expect(projectResults('z', list)).toEqual([]);
	});
});

describe('placements', () => {
	const h = (medal: 1 | 2 | 3, event: string): Hackathon => ({ medal, event, date: '2024-01' });
	it('groups the results by medal, best first, keeping their order', () => {
		const got = placements([h(1, 'A'), h(1, 'B'), h(2, 'C')]);
		expect(got.map((p) => [p.medal, p.results.map((r) => r.event)])).toEqual([
			[1, ['A', 'B']],
			[2, ['C']]
		]);
	});
	it('leaves out medals the project never got', () => {
		expect(placements([h(3, 'A')]).map((p) => p.medal)).toEqual([3]);
		expect(placements([])).toEqual([]);
	});
});

describe('durationMonths', () => {
	it('counts the months between start and end, like a contract (Oct → Apr is 6)', () => {
		expect(durationMonths('2025-07', '2026-01')).toBe(6);
		expect(durationMonths('2024-10', '2025-04')).toBe(6);
	});
	it('is 1 for a single month', () => {
		expect(durationMonths('2024-03', '2024-03')).toBe(1);
	});
});

describe('durationLabel', () => {
	const forms = { one: '{n} month', other: '{n} months' };
	it('uses the singular for 1 and the plural otherwise', () => {
		expect(durationLabel(1, forms)).toBe('1 month');
		expect(durationLabel(7, forms)).toBe('7 months');
	});
});
