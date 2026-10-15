import type { Lang, Localized } from '$lib/i18n/lang';

/** 'YYYY-MM' */
export type Month = string;
/** 'YYYY' */
export type Year = string;

export type Quote = {
	text: Localized;
	author: string;
	role: Localized;
	/** Language the quote was written in; the other page marks its text as a translation. */
	original: Lang;
};

export type Job = {
	company: string;
	role: Localized;
	/** Shorter role for the hero's "Latest role" (defaults to `role`). */
	roleShort?: Localized;
	/** Shorter company name for the hero's "Latest role" (defaults to `company`). */
	companyShort?: string;
	start: Month;
	/** No end = ongoing, shown as "Present". */
	end?: Month;
	internship: boolean;
	points: Localized[];
	tech: string[];
	quote?: Quote;
};

export type Education = {
	school: string;
	title: Localized;
	start?: Year;
	end: Year;
	points: Localized[];
	/** Certificate URL; makes the title a link. */
	link?: string;
};

export const MEDALS = [1, 2, 3] as const;
export type Medal = (typeof MEDALS)[number];

export type Hackathon = {
	medal: Medal;
	/** Short name shown on the pill (an acronym when the full name is long). */
	event: string;
	/** Full name when `event` is an acronym; shown as its tooltip. */
	fullName?: string;
	date: Month;
	/** Project name, or a description when it has no name. */
	project?: string | Localized;
	/** `id` of the project in src/lib/data/projects.ts: its card then shows this result. */
	projectId?: string;
};

/** 'YYYY' stays as is; 'YYYY-MM' becomes "Jul 2025" / "juil. 2025". UTC, so the month never shifts. */
function formatPoint(point: string, lang: Lang): string {
	if (/^\d{4}$/.test(point)) return point;
	const [year, month] = point.split('-').map(Number);
	return new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
		new Date(Date.UTC(year, month - 1))
	);
}

/** One end of a period: display text, plus a `<time datetime>` value unless it is "present". */
export type PeriodPoint = { text: string; datetime?: string };

/** The one or two ends of a period, in order; a missing end reads as `present`. */
export function periodPoints(
	start: string | undefined,
	end: string | undefined,
	lang: Lang,
	present: string
): PeriodPoint[] {
	const to: PeriodPoint =
		end === undefined ? { text: present } : { text: formatPoint(end, lang), datetime: end };
	if (start === undefined || start === end) return [to];
	return [{ text: formatPoint(start, lang), datetime: start }, to];
}

/** Newest first: by end (no end = ongoing = newest), then by start. For 'YYYY' or 'YYYY-MM' dates. */
export function newestFirst<T extends { start?: string; end?: string }>(items: readonly T[]): T[] {
	const end = (x: T) => x.end ?? '9999';
	return [...items].sort(
		(a, b) => end(b).localeCompare(end(a)) || (b.start ?? '').localeCompare(a.start ?? '')
	);
}

export function hackathonsNewestFirst(list: readonly Hackathon[]): Hackathon[] {
	return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

/** A project's hackathon results, best first: by medal, then newest. */
export function projectResults(id: string, list: readonly Hackathon[]): Hackathon[] {
	return list
		.filter((h) => h.projectId === id)
		.sort((a, b) => a.medal - b.medal || b.date.localeCompare(a.date));
}

/** One chip per placement, best first: its medal and the results that got it (newest first). */
export function placements(
	results: readonly Hackathon[]
): { medal: Medal; results: Hackathon[] }[] {
	return MEDALS.map((medal) => ({
		medal,
		results: results.filter((h) => h.medal === medal)
	})).filter((p) => p.results.length > 0);
}

export function yearOf(date: string): string {
	return date.slice(0, 4);
}

/**
 * Months from start to end, counted like a contract: 2024-10 → 2025-04 is 6 (mid-October to
 * mid-April). A period within a single month still counts as 1.
 */
export function durationMonths(start: Month, end: Month): number {
	const [y1, m1] = start.split('-').map(Number);
	const [y2, m2] = end.split('-').map(Number);
	return Math.max(1, (y2 - y1) * 12 + (m2 - m1));
}
