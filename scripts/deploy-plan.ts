/** Path → SHA-256 of the file's content. */
export type Manifest = Record<string, string>;

/** Written on the server after each deploy: what is there, so the next deploy sends only changes. */
export const MANIFEST = '.deploy-manifest.json';

/** Remote files the deploy never deletes: OVH's hosting config and the manifest. */
export const KEEP: readonly string[] = ['.ovhconfig', MANIFEST];

/** Assets first, then .htaccess, then HTML: a page never points at a file not uploaded yet. */
const rank = (path: string) => (path.endsWith('.html') ? 2 : path.endsWith('.htaccess') ? 1 : 0);

/** File sizes by path, in bytes: build/ and the server. */
export type Sizes = { local: Record<string, number>; remote: Record<string, number> };

/**
 * What to send and delete. A file is sent when it is new, changed since the manifest, missing on
 * the server, or of another size there (a truncated upload, or a deploy cut off before it wrote
 * its manifest: the old manifest then no longer describes the server).
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
	const deletes = remoteFiles.filter((path) => !(path in local) && !KEEP.includes(path)).sort();
	return { uploads, deletes };
}
