/** One capture that differs between the PR's merge base (before) and the PR (after). */
export type ReviewEntry = { name: string; detail: string; sizeChanged: boolean };

/** One line: the review page's heading and the PR comment's link text. */
export function reviewSummary(changed: number, total: number): string {
	return changed === 0 ? 'No visual change' : `${changed} of ${total} screens changed`;
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** No media query: the grid goes from one column on a phone to three on a computer. */
const CSS = `
:root { color-scheme: light dark; font: 16px/1.5 system-ui, sans-serif; }
body { margin: 0 auto; padding: 16px; max-width: 1600px; }
h1 { font-size: 1.4rem; }
h2 { font-size: 1.1rem; margin: 2rem 0 0; font-family: ui-monospace, monospace; }
section > p { margin: 0 0 0.5rem; opacity: 0.8; }
.images { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr)); align-items: start; }
figure { margin: 0; }
figcaption { font-weight: 600; }
img { display: block; width: 100%; height: auto; border: 1px solid #8888; }
`;

function figure(file: string, label: string): string {
	return `<figure><figcaption>${label}</figcaption><a href="${file}"><img src="${file}" alt="${label}" loading="lazy"></a></figure>`;
}

/** The page CI publishes at /_review/ in each PR preview: the changed captures only. */
export function reviewPage(entries: readonly ReviewEntry[], total: number): string {
	const sections = entries.map((e) => {
		const file = escape(encodeURIComponent(e.name));
		const images = [figure(`${file}-before.jpg`, 'Before'), figure(`${file}-after.jpg`, 'After')];
		if (!e.sizeChanged) images.push(figure(`${file}-diff.jpg`, 'Diff (changes in red)'));
		return `<section><h2>${escape(e.name)}</h2><p>${escape(e.detail)}</p><div class="images">${images.join('')}</div></section>`;
	});
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Visual review</title>
<style>${CSS}</style>
</head>
<body>
<h1>${reviewSummary(entries.length, total)}</h1>
<p>Before: where this PR branched from master. After: this PR. Names are language, theme and width; "open" has the phone sections expanded, "nojs" is the page before JavaScript. A page that got taller or shorter has no diff image. Tap an image for full size.</p>
${sections.join('\n')}
</body>
</html>
`;
}
