import { LANGS } from './lang';

/** JSON for a JS literal inside an HTML <script>: `<` escaped so the text can't close the tag. */
const literal = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

/**
 * Body of the inline script on `/`: sends the visitor to their language before first paint.
 * Duplicates pickLang() on purpose, because it runs before any bundle loads; redirect.spec.ts
 * runs it against pickLang so the two stay in sync.
 */
export function redirectScript(base: string): string {
	return (
		`(function(){var L=${literal(LANGS)},n=navigator,` +
		`p=n.languages&&n.languages.length?n.languages:[n.language],l='en';` +
		`for(var i=0;i<p.length;i++){var b=String(p[i]).toLowerCase().split('-')[0];` +
		`if(L.indexOf(b)>=0){l=b;break}}` +
		`location.replace(${literal(base)}+'/'+l+'/')})()`
	);
}
