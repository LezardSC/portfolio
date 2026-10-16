import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LANGS, pickLang } from './i18n/lang';

const htaccess = readFileSync(new URL('../../static/.htaccess', import.meta.url), 'utf8');

/** The Accept-Language pattern of the `/` → /fr/ rule, as Apache (PCRE, [NC]) would apply it. */
function frenchRule(): RegExp {
	const line = htaccess.split('\n').find((l) => l.includes('RewriteCond %{HTTP:Accept-Language}'));
	if (!line) throw new Error('no Accept-Language rule in static/.htaccess');
	return new RegExp(line.trim().split(/\s+/)[2], 'i');
}

const headerPrefs = (h: string) =>
	h
		.split(',')
		.map((part) => part.split(';')[0].trim())
		.filter(Boolean);

describe('static/.htaccess', () => {
	it('redirects exactly the locales of lang.ts (update the rules when one is added)', () => {
		expect(LANGS).toEqual(['en', 'fr']);
		expect(htaccess).toContain('RewriteRule ^$ https://%{HTTP_HOST}/fr/ [R=302');
		expect(htaccess).toContain('RewriteRule ^$ https://%{HTTP_HOST}/en/ [R=302');
	});

	it.each([
		'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
		'en-US,en;q=0.9,fr;q=0.8',
		'de-DE,de;q=0.9,fr;q=0.8',
		'de-DE,es;q=0.9',
		'FR',
		'fr-CA',
		'fry,fr;q=0.5',
		'fry',
		'*',
		'',
		'en-GB, fr',
		// Malformed headers (issue #39): both sides read the leading letters of each item and skip
		// whatever is not en or fr, however odd. q-values are ignored on both sides.
		'en_US,fr',
		'fr_FR',
		'de_DE,fr',
		'de,,fr',
		' , fr',
		'de;level=1,fr',
		'de;q=0.5;level=1,fr',
		'abcdefghi,fr',
		'de-abcdefghi,fr',
		'1fr,fr',
		'en;q=0,fr'
	])('chooses what pickLang chooses for "%s"', (header) => {
		const htaccessLang = frenchRule().test(header) ? 'fr' : 'en';
		expect(htaccessLang).toBe(pickLang(headerPrefs(header)));
	});

	it('reads a long malformed header in linear time (no catastrophic backtracking)', () => {
		const header = `${'  de  ;  q=0.5  ,'.repeat(2000)}en`;
		const start = performance.now();
		expect(frenchRule().test(header)).toBe(false);
		expect(performance.now() - start).toBeLessThan(100);
	});

	it('revalidates pages and the CVs on every visit (an updated CV must not be served stale)', () => {
		const rule = htaccess.match(/<FilesMatch "([^"]+)">\s*Header set Cache-Control "no-cache"/);
		const noCache = new RegExp(rule?.[1] ?? '^$');
		for (const file of ['index.html', 'sitemap.xml', 'robots.txt', 'cv-en.pdf', 'cv-fr.pdf'])
			expect(noCache.test(file), file).toBe(true);
		expect(noCache.test('photo.jpg')).toBe(false);
	});

	it('adds the slash to a directory itself, so mod_dir never sends https://host:443/en/', () => {
		expect(htaccess).toMatch(
			/RewriteCond %\{REQUEST_FILENAME\} -d\s+RewriteCond %\{REQUEST_URI\} !\/\$\s+RewriteRule \^ https:\/\/%\{HTTP_HOST\}%\{REQUEST_URI\}\/ \[R=301,L\]/
		);
	});

	it('sets HSTS for at most the current rollout step, without includeSubDomains or preload', () => {
		const hsts = htaccess.match(/Header always set Strict-Transport-Security "([^"]+)"/)?.[1];
		// Step 1 of issue #34. Raise it in a later PR (docs/deploy.md, "HSTS") and update this.
		expect(hsts).toBe('max-age=86400');
	});

	it('turns off browser features the site never uses', () => {
		const policy = htaccess.match(/Header always set Permissions-Policy "([^"]+)"/)?.[1] ?? '';
		for (const feature of ['camera', 'microphone', 'geolocation'])
			expect(policy).toContain(`${feature}=()`);
	});

	it('serves the 404 page and hides the deploy manifest', () => {
		expect(htaccess).toContain('ErrorDocument 404 /404.html');
		expect(htaccess).toContain('.deploy-manifest.json');
	});
});
