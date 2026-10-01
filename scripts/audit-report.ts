/** One line of the audit result. */
export type Check = { name: string; ok: boolean; detail: string };

/** Lighthouse category targets, as scores from 0 to 1. */
export const CATEGORY_TARGETS = {
	performance: 0.95,
	accessibility: 1,
	'best-practices': 1,
	seo: 1
} as const;
export type Category = keyof typeof CATEGORY_TARGETS;
export const CATEGORIES = Object.keys(CATEGORY_TARGETS) as Category[];

/** SEO audits that need absolute URLs, so a real domain (M9); they don't fail the audit before that. */
export const DOMAIN_PENDING_AUDITS: readonly string[] = ['hreflang', 'canonical'];

export type LighthouseSummary = {
	scores: Record<Category, number | null>;
	/** Ids of the weighted SEO audits that did not fully pass. */
	failedSeoAudits: string[];
};

const pct = (score: number) => String(Math.round(score * 100));

export function lighthouseChecks(label: string, summary: LighthouseSummary): Check[] {
	return CATEGORIES.map((category) => {
		const name = `Lighthouse ${label} ${category}`;
		const score = summary.scores[category];
		const target = CATEGORY_TARGETS[category];
		if (score === null) return { name, ok: false, detail: 'no score' };
		if (score >= target) return { name, ok: true, detail: pct(score) };
		const failed = category === 'seo' ? summary.failedSeoAudits : [];
		if (failed.length > 0 && failed.every((id) => DOMAIN_PENDING_AUDITS.includes(id)))
			return { name, ok: true, detail: `${pct(score)} (pending domain: ${failed.join(', ')})` };
		const suffix = failed.length > 0 ? ` (failed: ${failed.join(', ')})` : '';
		return { name, ok: false, detail: `${pct(score)} < ${pct(target)}${suffix}` };
	});
}

export function axeCheck(
	label: string,
	violations: readonly { id: string; nodes: readonly unknown[] }[]
): Check {
	return {
		name: `axe ${label}`,
		ok: violations.length === 0,
		detail:
			violations.length === 0
				? '0 violations'
				: violations.map((v) => `${v.id} (${v.nodes.length})`).join(', ')
	};
}

export function overflowCheck(label: string, overflowPx: number): Check {
	return {
		name: `no horizontal scroll ${label}`,
		ok: overflowPx <= 0,
		detail: overflowPx <= 0 ? 'fits' : `${overflowPx}px wider than the viewport`
	};
}

export function formatTable(checks: readonly Check[]): string {
	const width = Math.max(...checks.map((c) => c.name.length));
	return checks
		.map((c) => `${c.ok ? 'PASS' : 'FAIL'}  ${c.name.padEnd(width)}  ${c.detail}`)
		.join('\n');
}

/** False for an empty list: an audit that checked nothing did not pass. */
export function allPassed(checks: readonly Check[]): boolean {
	return checks.length > 0 && checks.every((c) => c.ok);
}
