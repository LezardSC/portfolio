/** One page state to capture. */
export type Capture = {
	name: string;
	lang: 'en' | 'fr';
	theme: 'dark' | 'light';
	width: number;
	/** Open every phone collapsible first (About, projects, skills, recommendation). */
	open?: true;
	/** Block the app bundles: the prerendered markup before hydration. */
	noJs?: true;
};

export const WIDTHS = [360, 390, 768, 1280, 1440] as const;

/** Every capture, in a stable order. */
export function captures(): Capture[] {
	const list: Capture[] = [];
	for (const lang of ['en', 'fr'] as const)
		for (const theme of ['dark', 'light'] as const) {
			for (const width of WIDTHS)
				list.push({ name: `${lang}-${theme}-${width}`, lang, theme, width });
			list.push({ name: `${lang}-${theme}-360-open`, lang, theme, width: 360, open: true });
		}
	list.push({ name: 'en-light-360-nojs', lang: 'en', theme: 'light', width: 360, noJs: true });
	return list;
}

export type Result = { name: string; same: boolean; detail: string };

/** Differences first, then a one-line verdict. */
export function formatResults(results: readonly Result[]): string {
	const diffs = results.filter((r) => !r.same);
	const width = Math.max(...results.map((r) => r.name.length));
	const lines = [...diffs, ...results.filter((r) => r.same)].map(
		(r) => `${r.same ? 'SAME' : 'DIFF'}  ${r.name.padEnd(width)}  ${r.detail}`
	);
	lines.push(
		diffs.length === 0
			? `\nall ${results.length} captures identical`
			: `\n${diffs.length} of ${results.length} captures differ (diff images in reports/screens-diff/)`
	);
	return lines.join('\n');
}
