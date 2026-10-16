import { execSync, spawn, type ChildProcess } from 'node:child_process';
import { createServer, type AddressInfo } from 'node:net';
import type { Page } from 'playwright';

/** True once vite's output shows its URL on `port`. Colour codes (on when CI is set) are ignored. */
export function previewReady(output: string, port: number): boolean {
	return new RegExp(`:${port}/`).test(output.replace(/\x1b\[[0-9;]*m/g, ''));
}

/**
 * Resolves once `vite preview` itself prints its URL. Polling the port instead could get an
 * answer from another server already on it (vite then exits on --strictPort), and test that.
 */
function waitForPreview(server: ChildProcess, port: number, timeoutMs = 30_000): Promise<void> {
	return new Promise((resolve, reject) => {
		let output = '';
		const timer = setTimeout(
			() => reject(new Error('vite preview did not start in time')),
			timeoutMs
		);
		const onData = (chunk: Buffer) => {
			output += chunk.toString();
			if (previewReady(output, port)) {
				clearTimeout(timer);
				resolve();
			}
		};
		server.stdout?.on('data', onData);
		server.stderr?.on('data', onData);
		server.on('exit', (code) => {
			clearTimeout(timer);
			reject(
				new Error(`vite preview exited (code ${code}); is port ${port} already in use?\n${output}`)
			);
		});
	});
}

/**
 * A port nothing listens on right now, chosen by the OS. Another process could still take it
 * before vite does: startPreview() then tries again.
 */
export function freePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = createServer();
		server.once('error', reject);
		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address() as AddressInfo;
			server.close(() => resolve(port));
		});
	});
}

export type Preview = { origin: string; stop: () => void };

/**
 * Builds the site (unless `build` is false), serves it with `vite preview` on a free port and
 * returns its origin and the function that stops the server. Several worktrees can run this at
 * the same time. Serves the current directory's build: run it from the checkout to capture.
 */
export async function startPreview({ build = true }: { build?: boolean } = {}): Promise<Preview> {
	if (build) execSync('npm run build', { stdio: 'inherit' });
	for (let attempt = 1; ; attempt++) {
		const port = await freePort();
		const server = spawn(
			'./node_modules/.bin/vite',
			['preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
			{ stdio: ['ignore', 'pipe', 'pipe'] }
		);
		try {
			await waitForPreview(server, port);
			return { origin: `http://127.0.0.1:${port}`, stop: () => server.kill() };
		} catch (e) {
			server.kill();
			if (attempt === 3) throw e;
		}
	}
}

/** Phone (360px) collapsibles: open each kind once, so what they reveal is checked too. */
export async function openCollapsibles(page: Page): Promise<void> {
	await page.click('#about .read-more');
	await page.click('#projects .show-more');
	await page.locator('#skills .acc').nth(1).click();
	await page.locator('#experience .rec').first().click();
}
