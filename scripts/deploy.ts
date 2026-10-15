/**
 * npm run deploy [-- --dry-run]
 * Uploads build/ to the hosting over FTPS (FTP_SECURE=false for plain FTP): only new and changed
 * files (hashes compared with the manifest left by the previous deploy), assets before .htaccess
 * before HTML, then the manifest, then deletes the files no longer in build/.
 * Needs FTP_HOST, FTP_USER, FTP_PASSWORD (GitHub secrets, or .env.deploy locally); FTP_DIR
 * defaults to www. Run `npm run build` first. --dry-run prints the plan and changes nothing.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { Client } from 'basic-ftp';
import { checkBudget, formatBudget, listFiles } from './budget.ts';
import { MANIFEST, planDeploy, type Manifest } from './deploy-plan.ts';

const BUILD = 'build';
const dryRun = process.argv.includes('--dry-run');

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

async function remoteManifest(client: Client, root: string): Promise<Manifest> {
	const chunks: Buffer[] = [];
	const sink = new Writable({
		write(chunk, _encoding, done) {
			chunks.push(chunk);
			done();
		}
	});
	try {
		await client.downloadTo(sink, `${root}/${MANIFEST}`);
		return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Manifest;
	} catch {
		return {}; // first deploy, or an unreadable manifest: everything is sent again
	}
}

async function remoteFiles(client: Client, root: string, sub = ''): Promise<string[]> {
	const files: string[] = [];
	for (const entry of await client.list(sub ? `${root}/${sub}` : root)) {
		if (entry.name === '.' || entry.name === '..') continue;
		const path = sub ? `${sub}/${entry.name}` : entry.name;
		if (entry.isDirectory) files.push(...(await remoteFiles(client, root, path)));
		else files.push(path);
	}
	return files;
}

async function main(): Promise<void> {
	const budget = checkBudget(listFiles(BUILD));
	console.log(formatBudget(budget));
	if (!budget.ok) throw new Error('build/ is over budget: nothing uploaded');
	const local = localManifest();

	const client = new Client(60_000);
	try {
		await client.access({
			host: env('FTP_HOST'),
			port: Number(process.env.FTP_PORT) || 21,
			user: env('FTP_USER'),
			password: env('FTP_PASSWORD'),
			secure: process.env.FTP_SECURE !== 'false'
		});
		await client.cd(process.env.FTP_DIR || 'www');
		const root = await client.pwd();
		const plan = planDeploy(
			local,
			await remoteManifest(client, root),
			await remoteFiles(client, root)
		);
		console.log(`\n${plan.uploads.length} to upload, ${plan.deletes.length} to delete (${root})`);
		for (const path of plan.deletes) console.log(`  delete ${path}`);
		if (dryRun) {
			for (const path of plan.uploads) console.log(`  upload ${path}`);
			return;
		}
		// ensureDir() changes the working directory; every path here is absolute from root.
		const made = new Set<string>();
		for (const path of plan.uploads) {
			const dir = posix.dirname(path);
			if (dir !== '.' && !made.has(dir)) {
				await client.ensureDir(`${root}/${dir}`);
				made.add(dir);
			}
			await client.uploadFrom(`${BUILD}/${path}`, `${root}/${path}`);
			console.log(`  sent ${path}`);
		}
		await client.uploadFrom(Readable.from([JSON.stringify(local)]), `${root}/${MANIFEST}`);
		for (const path of plan.deletes) await client.remove(`${root}/${path}`);
		console.log('Deploy done.');
	} finally {
		client.close();
	}
}

await main();
