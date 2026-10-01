import { describe, expect, it } from 'vitest';
import {
	formatPeriod,
	hackathonsNewestFirst,
	localize,
	newestFirst,
	periodPoints,
	quoted,
	yearOf,
	type Hackathon
} from './experience';

describe('localize', () => {
	it('returns a plain string as is', () => {
		expect(localize('KAYP', 'fr')).toBe('KAYP');
	});
	it('picks the language of a localized string', () => {
		expect(localize({ en: 'Internship', fr: 'Stage' }, 'fr')).toBe('Stage');
		expect(localize({ en: 'Internship', fr: 'Stage' }, 'en')).toBe('Internship');
	});
});

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

describe('yearOf', () => {
	it('returns the year of a month or a year', () => {
		expect(yearOf('2025-11')).toBe('2025');
		expect(yearOf('2024')).toBe('2024');
	});
});

describe('quoted', () => {
	it('uses curly quotes in English', () => {
		expect(quoted('Serious and committed.', 'en')).toBe('“Serious and committed.”');
	});
	it('uses guillemets with narrow no-break spaces in French', () => {
		expect(quoted('Sérieux et impliqué.', 'fr')).toBe('«\u202fSérieux et impliqué.\u202f»');
	});
});
