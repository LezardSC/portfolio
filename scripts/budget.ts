/**
 * npm run budget
 * Fails when build/ is over the hosting budget (the OVH free hosting has 100 MB; 80 leaves room
 * for the files OVH keeps there), and lists the largest files so you know what to shrink.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BUDGET_BYTES = 80 * 1024 * 1024;

export type FileSize = { path: string; size: number };

/** Every file under `dir`, as POSIX paths relative to it, sorted. */
export function listFiles(dir: string): FileSize[] {
	return readdirSync(dir, { recursive: true, withFileTypes: true })
		.filter((e) => e.isFile())
		.map((e) => {
			const full = join(e.parentPath, e.name);
			return { path: relative(dir, full).split(sep).join('/'), size: statSync(full).size };
		})
		.sort((a, b) => a.path.localeCompare(b.path));
}

export function checkBudget(files: readonly FileSize[], limit = BUDGET_BYTES) {
	const total = files.reduce((sum, f) => sum + f.size, 0);
	const largest = [...files].sort((a, b) => b.size - a.size).slice(0, 10);
	return { ok: total <= limit, total, largest };
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function formatBudget(r: ReturnType<typeof checkBudget>, limit = BUDGET_BYTES): string {
	const head = `${r.ok ? 'PASS' : 'FAIL'}  build/ is ${mb(r.total)} (budget ${mb(limit)})`;
	const rows = r.largest.map((f) => `  ${mb(f.size).padStart(8)}  ${f.path}`);
	return [head, 'Largest files:', ...rows].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const result = checkBudget(listFiles('build'));
	console.log(formatBudget(result));
	process.exitCode = result.ok ? 0 : 1;
}
