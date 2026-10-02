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
export const MEDAL_EMOJI: Record<Medal, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export type Hackathon = {
	medal: Medal;
	/** Short name shown on the pill (an acronym when the full name is long). */
	event: string;
	/** Full name when `event` is an acronym; shown as its tooltip. */
	fullName?: string;
	date: Month;
	/** Project name, or a description when it has no name. */
	project?: string | Localized;
};

export function localize(value: string | Localized, lang: Lang): string {
	return typeof value === 'string' ? value : value[lang];
}

/** Wraps a quotation in the language's quotation marks: “…” in English, « … » in French. */
export function quoted(text: string, lang: Lang): string {
	return lang === 'fr' ? `« ${text} »` : `“${text}”`;
}

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

/** "Jul 2025 – Jan 2026", "2022 – 2026", "2024"; a missing end reads as `present`. */
export function formatPeriod(
	start: string | undefined,
	end: string | undefined,
	lang: Lang,
	present: string
): string {
	return periodPoints(start, end, lang, present)
		.map((p) => p.text)
		.join(' – ');
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

export function yearOf(date: string): string {
	return date.slice(0, 4);
}

/** Below this width Experience is one column, and long quotes get clamped. */
export const ONE_COLUMN_QUERY = '(width < 56.25rem)';

/**
 * Whether a recommendation quote is clamped to 2 lines and whether its Read more / Show less
 * button shows. `overflows` = the clamped quote is longer than 2 lines (measured in the browser).
 */
export function quoteView(s: { narrow: boolean; overflows: boolean; expanded: boolean }): {
	clamp: boolean;
	button: boolean;
} {
	return {
		clamp: s.narrow && !s.expanded,
		button: s.narrow && (s.expanded || s.overflows)
	};
}
