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

/** `sizeChanged`: the page got taller or shorter, so there is no pixel diff. */
export type Result = { name: string; same: boolean; detail: string; sizeChanged?: true };

/** Differences first, then a one-line verdict. */
export function formatResults(results: readonly Result[], where = 'reports/screens-diff/'): string {
	const diffs = results.filter((r) => !r.same);
	const width = Math.max(...results.map((r) => r.name.length));
	const lines = [...diffs, ...results.filter((r) => r.same)].map(
		(r) => `${r.same ? 'SAME' : 'DIFF'}  ${r.name.padEnd(width)}  ${r.detail}`
	);
	lines.push(
		diffs.length === 0
			? `\nall ${results.length} captures identical`
			: `\n${diffs.length} of ${results.length} captures differ (images in ${where})`
	);
	return lines.join('\n');
}

const BASELINE = 'reports/screens-baseline';

/** What `npm run screens` was asked to do. */
export type ScreensArgs =
	| { mode: 'capture'; out: string; build: boolean; force: boolean }
	| { mode: 'compare'; build: boolean }
	| { mode: 'review'; before: string; after: string; review: string };

/** Refuses to replace an existing capture folder (the baseline) unless --force was given. */
export function checkOverwrite(out: string, exists: boolean, force: boolean): void {
	if (exists && !force)
		throw new Error(`${out}/ already exists: --force replaces it (the old captures are lost).`);
}

const PATH_OPTIONS = ['--out', '--before', '--after', '--review'];

/**
 * (none) or --out <dir>: capture (default reports/screens-baseline). --compare: capture again and
 * compare with the baseline. --force: replace an existing capture folder. --no-build: serve the existing build. --before <dir> --after <dir>
 * --review <dir>: compare two capture folders and write the review page (CI, preview.yml).
 */
export function parseScreensArgs(argv: readonly string[]): ScreensArgs {
	const paths: Record<string, string> = {};
	let compare = false;
	let force = false;
	let build = true;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--compare') compare = true;
		else if (arg === '--no-build') build = false;
		else if (arg === '--force') force = true;
		else if (PATH_OPTIONS.includes(arg)) {
			const value = argv[++i];
			if (!value || value.startsWith('--')) throw new Error(`${arg} needs a path`);
			paths[arg] = value;
		} else throw new Error(`Unknown option: ${arg}`);
	}
	const before = paths['--before'];
	const after = paths['--after'];
	const review = paths['--review'];
	if (before || after || review) {
		if (!before || !after || !review) throw new Error('--before, --after and --review go together');
		if (compare || !build || force || paths['--out'])
			throw new Error('--before/--after/--review compare existing captures: no other option');
		return { mode: 'review', before, after, review };
	}
	if (compare) {
		if (force) throw new Error('--force only applies when saving a baseline');
		if (paths['--out']) throw new Error('--compare always captures into reports/screens-current/');
		return { mode: 'compare', build };
	}
	return { mode: 'capture', out: paths['--out'] ?? BASELINE, build, force };
}
