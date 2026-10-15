import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BREAKPOINTS_REM, DESKTOP_QUERY } from './breakpoints';

const SRC = fileURLToPath(new URL('..', import.meta.url));
const styleFiles = (readdirSync(SRC, { recursive: true }) as string[])
	.filter((f) => f.endsWith('.svelte') || f.endsWith('.css'))
	.map((f) => join(SRC, f));

describe('breakpoints', () => {
	it('uses the desktop breakpoint in DESKTOP_QUERY', () => {
		expect(DESKTOP_QUERY).toBe(`(min-width: ${BREAKPOINTS_REM.desktop}rem)`);
	});

	it('only uses known widths in @media rules (CSS and JS agree)', () => {
		const known = new Set(Object.values(BREAKPOINTS_REM).map(String));
		const unknown = styleFiles.flatMap((file) =>
			[...readFileSync(file, 'utf8').matchAll(/@media[^{]*/g)].flatMap((m) =>
				[...m[0].matchAll(/width\s*(?:[<>]=?|:)\s*([\d.]+)(\w+)/g)]
					.filter(([, n, unit]) => unit !== 'rem' || !known.has(n))
					.map(([w]) => `${file.slice(SRC.length)}: ${w}`)
			)
		);
		expect(unknown).toEqual([]);
	});
});
