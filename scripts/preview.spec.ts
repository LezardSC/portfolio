import { describe, expect, it } from 'vitest';
import { createServer } from 'node:net';
import { freePort, previewReady } from './preview.ts';

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

function listen(port: number): Promise<() => void> {
	return new Promise((resolve, reject) => {
		const server = createServer();
		server.once('error', reject);
		server.listen(port, '127.0.0.1', () => resolve(() => server.close()));
	});
}

describe('freePort', () => {
	it('returns a port that can then be listened on', async () => {
		const port = await freePort();
		expect(port).toBeGreaterThan(0);
		const close = await listen(port);
		close();
	});

	it('gives different ports to calls made at the same time', async () => {
		const ports = await Promise.all([freePort(), freePort(), freePort()]);
		const closers = await Promise.all(ports.map(listen));
		closers.forEach((close) => close());
		expect(new Set(ports).size).toBe(3);
	});
});
