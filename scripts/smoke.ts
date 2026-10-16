/**
 * npm run smoke
 * Checks the live site after a deploy: both locales with their canonical, the language redirect
 * on /, the https, www and trailing-slash redirects, long caching on hashed files, the 404 page
 * at depth, the HSTS and Permissions-Policy headers.
 * Exits 1 on any failure.
 */
import { SITE_ORIGIN } from '../src/lib/site.ts';

type Check = { name: string; ok: boolean; detail: string };
/** Returns a problem, or null when the response is as expected. */
type Expectation = (r: Response, body: string) => string | null;

const host = new URL(SITE_ORIGIN).host;

function get(url: string): Promise<Response> {
	return fetch(url, { redirect: 'manual', headers: { 'Accept-Language': 'fr-FR,fr;q=0.9' } });
}

async function check(name: string, url: string, status: number, extra?: Expectation) {
	try {
		const r = await get(url);
		const body = await r.text();
		if (r.status !== status) return { name, ok: false, detail: `${r.status}, expected ${status}` };
		const problem = extra?.(r, body) ?? null;
		return { name, ok: problem === null, detail: problem ?? String(r.status) };
	} catch (e) {
		return { name, ok: false, detail: String(e) };
	}
}

const location =
	(expected: RegExp): Expectation =>
	(r) =>
		expected.test(r.headers.get('location') ?? '') ? null : `location ${r.headers.get('location')}`;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

const securityHeaders: Expectation = (r) => {
	const hsts = r.headers.get('strict-transport-security') ?? '';
	if (!/^max-age=\d+(;|$)/.test(hsts)) return `strict-transport-security "${hsts}"`;
	return r.headers.get('permissions-policy')?.includes('camera=()')
		? null
		: 'no permissions-policy';
};

async function main(): Promise<void> {
	const checks: Check[] = [];
	for (const lang of ['en', 'fr'])
		checks.push(
			await check(`/${lang}/ with its canonical`, `${SITE_ORIGIN}/${lang}/`, 200, (_r, body) =>
				body.includes(`<link rel="canonical" href="${SITE_ORIGIN}/${lang}/"`)
					? null
					: 'canonical missing'
			)
		);
	const en = new RegExp(`^${escape(SITE_ORIGIN)}/en/$`);
	checks.push(
		await check('/ redirects to the language', `${SITE_ORIGIN}/`, 302, location(/\/fr\/$/)),
		await check('http → https', `http://${host}/en/`, 301, location(en)),
		await check('www → bare domain', `https://www.${host}/en/`, 301, location(en)),
		await check('/en → /en/ (no port)', `${SITE_ORIGIN}/en`, 301, location(en)),
		await check('HSTS and Permissions-Policy', `${SITE_ORIGIN}/en/`, 200, securityHeaders),
		await check('HSTS on the 404', `${SITE_ORIGIN}/no/such/page/`, 404, securityHeaders),
		await check('sitemap', `${SITE_ORIGIN}/sitemap.xml`, 200),
		await check('skill logos sprite', `${SITE_ORIGIN}/skill-logos.svg`, 200),
		await check('404 page at depth', `${SITE_ORIGIN}/no/such/page/`, 404, (_r, body) =>
			body.includes('noindex') && body.includes('/_app/immutable/') ? null : 'not the custom 404'
		)
	);
	const page = await (await get(`${SITE_ORIGIN}/en/`)).text().catch(() => '');
	const asset = page.match(/\/_app\/immutable\/[^"']+\.js/)?.[0];
	checks.push(
		asset
			? await check('hashed asset cached one year', `${SITE_ORIGIN}${asset}`, 200, (r) =>
					(r.headers.get('cache-control') ?? '').includes('immutable')
						? null
						: `cache-control ${r.headers.get('cache-control')}`
				)
			: { name: 'hashed asset cached one year', ok: false, detail: 'no /_app/immutable/ URL' }
	);
	for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}  ${c.detail}`);
	process.exitCode = checks.every((c) => c.ok) ? 0 : 1;
}

await main();
