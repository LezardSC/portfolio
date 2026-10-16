/**
 * npm run deploy [-- --dry-run]
 * Uploads build/ to the hosting over SFTP: only new and changed files (hashes compared with the
 * manifest left by the previous deploy), assets before .htaccess before HTML, then the manifest,
 * then deletes the files no longer in build/. The password is only sent to a server holding one
 * of the pinned host keys (OVH_HOST_KEYS). It refuses to start while static/ holds files git
 * ignores, since the build copied them into build/.
 * Needs FTP_HOST, FTP_USER, FTP_PASSWORD (GitHub secrets, or .env.deploy locally); FTP_DIR
 * defaults to www. Run `npm run build` first. --dry-run prints the plan and changes nothing.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import SftpClient from 'ssh2-sftp-client';
import { checkBudget, formatBudget, listFiles } from './budget.ts';
import {
	hostKeyTrusted,
	ignoredFiles,
	MANIFEST,
	OVH_HOST_KEYS,
	planDeploy,
	type Manifest
} from './deploy-plan.ts';

const BUILD = 'build';
const dryRun = process.argv.includes('--dry-run');
/** Readable by the web server, writable only by this account (the server's default is 666). */
const MODE = 0o644;

function env(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set (a GitHub secret, or a line in .env.deploy)`);
	return value;
}

function localManifest(): Manifest {
	return Object.fromEntries(
		listFiles(BUILD).map(({ path }) => [
			path,
			createHash('sha256')
				.update(readFileSync(`${BUILD}/${path}`))
				.digest('hex')
		])
	);
}

async function remoteManifest(client: SftpClient, root: string): Promise<Manifest> {
	try {
		const data = (await client.get(`${root}/${MANIFEST}`)) as Buffer;
		return JSON.parse(data.toString('utf8')) as Manifest;
	} catch {
		return {}; // first deploy, or an unreadable manifest: everything is sent again
	}
}

/** Every file on the server under root, with its size; symbolic links are also added to `links`. */
async function remoteFiles(
	client: SftpClient,
	links: Set<string>,
	root: string,
	sub = ''
): Promise<Record<string, number>> {
	const files: Record<string, number> = {};
	for (const entry of await client.list(sub ? `${root}/${sub}` : root)) {
		if (entry.name === '.' || entry.name === '..') continue;
		const path = sub ? `${sub}/${entry.name}` : entry.name;
		if (entry.type === 'd') Object.assign(files, await remoteFiles(client, links, root, path));
		else {
			files[path] = entry.size;
			if (entry.type === 'l') links.add(path);
		}
	}
	return files;
}

async function main(): Promise<void> {
	const ignored = ignoredFiles('static');
	if (ignored.length > 0)
		throw new Error(
			`static/ holds files git ignores, which the build copies: delete them, rebuild, deploy again. Nothing uploaded.\n  ${ignored.join('\n  ')}`
		);
	const budget = checkBudget(listFiles(BUILD));
	console.log(formatBudget(budget));
	if (!budget.ok) throw new Error('build/ is over budget: nothing uploaded');
	const local = localManifest();

	// SFTP_HOST_KEY (comma-separated fingerprints) replaces the pinned keys, for a test server.
	const trusted = process.env.SFTP_HOST_KEY?.split(',') ?? OVH_HOST_KEYS;
	const client = new SftpClient();
	try {
		await client.connect({
			host: env('FTP_HOST'),
			port: Number(process.env.FTP_PORT) || 22,
			username: env('FTP_USER'),
			password: env('FTP_PASSWORD'),
			readyTimeout: 60_000,
			hostVerifier: (key: Buffer) => hostKeyTrusted(key, trusted)
		});
		const root = await client.realPath(process.env.FTP_DIR || 'www');
		const links = new Set<string>();
		const onServer = await remoteFiles(client, links, root);
		const localSizes = Object.fromEntries(listFiles(BUILD).map((f) => [f.path, f.size]));
		const plan = planDeploy(local, await remoteManifest(client, root), Object.keys(onServer), {
			local: localSizes,
			remote: onServer
		});
		console.log(`\n${plan.uploads.length} to upload, ${plan.deletes.length} to delete (${root})`);
		for (const path of plan.deletes) console.log(`  delete ${path}`);
		if (dryRun) {
			for (const path of plan.uploads) console.log(`  upload ${path}`);
			return;
		}
		// The old manifest goes first: if this deploy is cut off, the next one finds none and
		// sends everything, instead of trusting a manifest that no longer describes the server.
		if (MANIFEST in onServer && plan.uploads.length + plan.deletes.length > 0)
			await client.delete(`${root}/${MANIFEST}`);
		const made = new Set<string>();
		for (const path of plan.uploads) {
			const dir = posix.dirname(path);
			if (dir !== '.' && !made.has(dir)) {
				await client.mkdir(`${root}/${dir}`, true);
				made.add(dir);
			}
			// OVH's placeholder index.html is a link to a file outside this account: writing
			// through it fails ("No such file"), so the link goes and a real file takes its place.
			if (links.has(path)) await client.delete(`${root}/${path}`);
			await client.put(`${BUILD}/${path}`, `${root}/${path}`);
			await client.chmod(`${root}/${path}`, MODE);
			console.log(`  sent ${path}`);
		}
		await client.put(Buffer.from(JSON.stringify(local)), `${root}/${MANIFEST}`);
		await client.chmod(`${root}/${MANIFEST}`, MODE);
		for (const path of plan.deletes) await client.delete(`${root}/${path}`);
		console.log('Deploy done.');
	} finally {
		await client.end().catch(() => {});
	}
}

await main();
