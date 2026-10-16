import { describe, expect, it } from 'vitest';
import { findPreviewComment, previewComment, PREVIEW_MARKER } from './preview-comment.ts';

const input = {
	url: 'https://pr-52.jocelynrenault-previews.pages.dev/',
	sha: '0123456789abcdef',
	review: '4 of 25 screens changed',
	runUrl: 'https://github.com/LezardSC/portfolio/actions/runs/1'
};

describe('previewComment', () => {
	it('starts with the marker and names the short commit', () => {
		const body = previewComment(input);
		expect(body.startsWith(`${PREVIEW_MARKER}\n`)).toBe(true);
		expect(body).toContain('`0123456`');
	});
	it('links both languages and the review page, without double slashes', () => {
		const body = previewComment(input);
		expect(body).toContain('[English](https://pr-52.jocelynrenault-previews.pages.dev/en/)');
		expect(body).toContain('[Français](https://pr-52.jocelynrenault-previews.pages.dev/fr/)');
		expect(body).toContain(
			'[4 of 25 screens changed](https://pr-52.jocelynrenault-previews.pages.dev/_review/)'
		);
	});
	it('points to the workflow log when the review page could not be made', () => {
		const body = previewComment({ ...input, review: null });
		expect(body).not.toContain('/_review/');
		expect(body).toContain('[workflow log](https://github.com/LezardSC/portfolio/actions/runs/1)');
	});
	it('says what the preview does not test', () => {
		expect(previewComment(input)).toContain('.htaccess');
	});
});

describe('findPreviewComment', () => {
	const bot = { login: 'github-actions[bot]' };
	it("finds the bot's comment that starts with the marker", () => {
		expect(
			findPreviewComment([
				{ id: 1, body: 'LGTM', user: { login: 'LezardSC' } },
				{ id: 2, body: `${PREVIEW_MARKER}\n### Preview`, user: bot }
			])
		).toBe(2);
	});
	it("ignores someone else's comment quoting it, and the bot's other comments", () => {
		expect(
			findPreviewComment([
				{ id: 1, body: `${PREVIEW_MARKER}\nquoted`, user: { login: 'LezardSC' } },
				{ id: 2, body: `> ${PREVIEW_MARKER}`, user: bot },
				{ id: 3, body: undefined, user: null }
			])
		).toBeUndefined();
	});
});
