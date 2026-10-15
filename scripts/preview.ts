import { execSync, spawn, type ChildProcess } from 'node:child_process';
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

/** Builds the site, serves build/ on `port` and returns the function that stops the server. */
export async function startPreview(port: number): Promise<() => void> {
	execSync('npm run build', { stdio: 'inherit' });
	const server = spawn(
		'./node_modules/.bin/vite',
		['preview', '--port', String(port), '--strictPort'],
		{ stdio: ['ignore', 'pipe', 'pipe'] }
	);
	try {
		await waitForPreview(server, port);
	} catch (e) {
		server.kill();
		throw e;
	}
	return () => server.kill();
}

/** Phone (360px) collapsibles: open each kind once, so what they reveal is checked too. */
export async function openCollapsibles(page: Page): Promise<void> {
	await page.click('#about .read-more');
	await page.click('#projects .show-more');
	await page.locator('#skills .acc').nth(1).click();
	await page.locator('#experience .rec').first().click();
}
