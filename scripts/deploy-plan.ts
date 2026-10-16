import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

/** Path → SHA-256 of the file's content. */
export type Manifest = Record<string, string>;

/** Written on the server after each deploy: what is there, so the next deploy sends only changes. */
export const MANIFEST = '.deploy-manifest.json';

/** Remote files the deploy never deletes: OVH's hosting config and the manifest. */
export const KEEP: readonly string[] = ['.ovhconfig', MANIFEST];

/**
 * The SFTP server's host keys (ED25519 and RSA), as `ssh-keygen -l` prints them. The deploy only
 * sends the password to a server holding one of them. If OVH changes its keys, the deploy stops:
 * check the new ones (docs/deploy.md) and update this list.
 */
export const OVH_HOST_KEYS: readonly string[] = [
	'SHA256:xhieLplnoEvvl7+a8sq8wLCh/bvOQvQFIVewi+fK2og',
	'SHA256:itDZ6cuojUbG3+jrh5F/igkXa2xjzejbYJkNAlw8/VM'
];

/** A raw public key's fingerprint, in OpenSSH's format. */
export function fingerprint(key: Buffer): string {
	return `SHA256:${createHash('sha256').update(key).digest('base64').replace(/=+$/, '')}`;
}

export function hostKeyTrusted(key: Buffer, trusted: readonly string[]): boolean {
	return trusted.includes(fingerprint(key));
}

/**
 * Files under `dir` that git ignores, sorted. The build copies all of static/, ignored files
 * included (a Windows `*:Zone.Identifier` download marker, a `.DS_Store`), so a deploy from a
 * local checkout would upload them. CI deploys from a clean checkout, where this is empty.
 */
export function ignoredFiles(dir: string, cwd = '.'): string[] {
	const out = execFileSync(
		'git',
		['ls-files', '--others', '--ignored', '--exclude-standard', '-z', '--', dir],
		{ cwd, encoding: 'utf8' }
	);
	return out.split('\0').filter(Boolean).sort();
}

/**
 * The build's hashed files (JS, CSS). A page loaded before a deploy still asks for the chunks of
 * its own build, so these stay on the server for one more deploy.
 */
const IMMUTABLE = '_app/immutable/';

/** Assets first, then .htaccess, then HTML: a page never points at a file not uploaded yet. */
const rank = (path: string) => (path.endsWith('.html') ? 2 : path.endsWith('.htaccess') ? 1 : 0);

/** File sizes by path, in bytes: build/ and the server. */
export type Sizes = { local: Record<string, number>; remote: Record<string, number> };

/**
 * What to send and delete. A file is sent when it is new, changed since the manifest, missing on
 * the server, or of another size there (a truncated upload, or a deploy cut off before it wrote
 * its manifest: the old manifest then no longer describes the server).
 * A file no longer in build/ is deleted, except the previous build's hashed files: those listed in
 * the remote manifest are kept, and since the new manifest lists only this build, the next deploy
 * deletes them.
 */
export function planDeploy(
	local: Manifest,
	remote: Manifest,
	remoteFiles: readonly string[],
	sizes: Sizes = { local: {}, remote: {} }
): { uploads: string[]; deletes: string[] } {
	const onServer = new Set(remoteFiles);
	const sizeDiffers = (path: string) =>
		path in sizes.local && path in sizes.remote && sizes.local[path] !== sizes.remote[path];
	const uploads = Object.keys(local)
		.filter((path) => local[path] !== remote[path] || !onServer.has(path) || sizeDiffers(path))
		.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
	const previousBuild = (path: string) => path.startsWith(IMMUTABLE) && path in remote;
	const deletes = remoteFiles
		.filter((path) => !(path in local) && !KEEP.includes(path) && !previousBuild(path))
		.sort();
	return { uploads, deletes };
}
