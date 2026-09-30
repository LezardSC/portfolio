import { describe, expect, it } from 'vitest';
import { localeHref, pickLang } from './lang';
import { redirectScript } from './redirect';

/** Runs the inline script with a fake browser and returns the URL it redirected to. */
function run(base: string, languages: string[] | undefined, language: string): string {
	let target = '';
	const navigator = { languages, language };
	const location = { replace: (url: string) => (target = url) };
	new Function('navigator', 'location', redirectScript(base))(navigator, location);
	return target;
}

const cases: [string[] | undefined, string][] = [
	[['fr-FR', 'en-US'], 'fr-FR'],
	[['en-GB', 'fr'], 'en-GB'],
	[['de-DE', 'fr-CA'], 'de-DE'],
	[['de-DE', 'es'], 'de-DE'],
	[['FR'], 'FR'],
	[[], 'fr-BE'],
	[undefined, 'fr']
];

describe('redirectScript', () => {
	it.each(cases)('agrees with pickLang for languages %j (language %s)', (languages, language) => {
		const prefs = languages?.length ? languages : [language];
		expect(run('', languages, language)).toBe(localeHref('', pickLang(prefs)));
	});

	it('keeps a sub-path base', () => {
		expect(run('/portfolio', ['fr-FR'], 'fr-FR')).toBe('/portfolio/fr/');
	});

	it('keeps a relative base (prerendered pages use relative paths)', () => {
		expect(run('.', ['en'], 'en')).toBe('./en/');
	});

	it('cannot break out of the script tag or the string', () => {
		expect(redirectScript('</script><x>"\'')).not.toContain('</script>');
	});
});
