/**
 * CI only (preview.yml): posts the preview comment on the PR, or edits the one already there.
 * Env: GITHUB_TOKEN, GITHUB_API_URL, GITHUB_REPOSITORY (from Actions), PR, PREVIEW_URL, SHA,
 * RUN_URL, REVIEW_SUMMARY_FILE (empty, or a missing file: the review page is unavailable).
 */
import { existsSync, readFileSync } from 'node:fs';
import { findPreviewComment, previewComment, type IssueComment } from './preview-comment.ts';

function env(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
}

const issues = `${env('GITHUB_API_URL')}/repos/${env('GITHUB_REPOSITORY')}/issues`;
const headers = {
	Authorization: `Bearer ${env('GITHUB_TOKEN')}`,
	Accept: 'application/vnd.github+json',
	'Content-Type': 'application/json',
	'X-GitHub-Api-Version': '2022-11-28'
};

async function github(
	url: string,
	init: { method?: string; body?: string } = {}
): Promise<unknown> {
	const res = await fetch(url, { ...init, headers });
	if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${url}: ${res.status} ${await res.text()}`);
	return res.json();
}

async function allComments(pr: string): Promise<IssueComment[]> {
	const all: IssueComment[] = [];
	for (let page = 1; ; page++) {
		const batch = (await github(
			`${issues}/${pr}/comments?per_page=100&page=${page}`
		)) as IssueComment[];
		all.push(...batch);
		if (batch.length < 100) return all;
	}
}

const pr = env('PR');
const file = process.env.REVIEW_SUMMARY_FILE;
const summary = file && existsSync(file) ? readFileSync(file, 'utf8').trim() : '';
const body = previewComment({
	url: env('PREVIEW_URL'),
	sha: env('SHA'),
	review: summary || null,
	runUrl: env('RUN_URL')
});
const id = findPreviewComment(await allComments(pr));
if (id === undefined)
	await github(`${issues}/${pr}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
else await github(`${issues}/comments/${id}`, { method: 'PATCH', body: JSON.stringify({ body }) });
console.log(`${id === undefined ? 'Posted' : 'Updated'} the preview comment on #${pr}.`);
