/** Path → SHA-256 of the file's content. */
export type Manifest = Record<string, string>;

/** Written on the server after each deploy: what is there, so the next deploy sends only changes. */
export const MANIFEST = '.deploy-manifest.json';

/** Remote files the deploy never deletes: OVH's hosting config and the manifest. */
export const KEEP: readonly string[] = ['.ovhconfig', MANIFEST];

/** Assets first, then .htaccess, then HTML: a page never points at a file not uploaded yet. */
const rank = (path: string) => (path.endsWith('.html') ? 2 : path.endsWith('.htaccess') ? 1 : 0);

export function planDeploy(
	local: Manifest,
	remote: Manifest,
	remoteFiles: readonly string[]
): { uploads: string[]; deletes: string[] } {
	const onServer = new Set(remoteFiles);
	const uploads = Object.keys(local)
		.filter((path) => local[path] !== remote[path] || !onServer.has(path))
		.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
	const deletes = remoteFiles.filter((path) => !(path in local) && !KEEP.includes(path)).sort();
	return { uploads, deletes };
}
