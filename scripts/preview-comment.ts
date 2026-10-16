/** First line of the preview comment: how the workflow finds it again to edit it. */
export const PREVIEW_MARKER = '<!-- preview -->';

/** The PR comment linking the preview. `review` is the review page's summary, null if it failed. */
export function previewComment(input: {
	url: string;
	sha: string;
	review: string | null;
	runUrl: string;
}): string {
	const site = input.url.replace(/\/+$/, '');
	const review = input.review
		? `- Visual review: [${input.review}](${site}/_review/)`
		: `- Visual review unavailable (see the [workflow log](${input.runUrl}))`;
	return [
		PREVIEW_MARKER,
		`### Preview of \`${input.sha.slice(0, 7)}\``,
		'',
		`- Site: [English](${site}/en/) · [Français](${site}/fr/)`,
		review,
		'',
		"<sub>Cloudflare Pages preview, not indexed, updated on every push: the address can take a minute or two to show it (reload if the review page disagrees with this comment). Not tested here: `.htaccess` (so `/` does not pick a language) and OVH's caching and headers.</sub>",
		''
	].join('\n');
}

export type IssueComment = { id: number; body?: string; user?: { login: string } | null };

/** The workflow's own preview comment on the PR, if there is one. */
export function findPreviewComment(comments: readonly IssueComment[]): number | undefined {
	return comments.find(
		(c) => c.user?.login === 'github-actions[bot]' && c.body?.startsWith(PREVIEW_MARKER)
	)?.id;
}
