import { describe, expect, it } from 'vitest';
import { previewReady } from './preview.ts';

describe('previewReady', () => {
	it('finds the port in plain output', () => {
		expect(previewReady('  ➜  Local:   http://localhost:4180/\n', 4180)).toBe(true);
	});

	it('finds the port when vite colours its output (it does when CI is set)', () => {
		const coloured =
			'  \x1b[1mLocal\x1b[22m:   \x1b[36mhttp://localhost:\x1b[1m4180\x1b[22m/\x1b[39m';
		expect(previewReady(coloured, 4180)).toBe(true);
	});

	it('ignores another port and output without a URL yet', () => {
		expect(previewReady('http://localhost:41800/', 4180)).toBe(false);
		expect(previewReady('vite v7 building…', 4180)).toBe(false);
	});
});
