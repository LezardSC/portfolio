import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
	fingerprint,
	hostKeyTrusted,
	ignoredFiles,
	MANIFEST,
	OVH_HOST_KEYS,
	planDeploy
} from './deploy-plan';

describe('planDeploy', () => {
	it('uploads new and changed files, skips unchanged ones', () => {
		const plan = planDeploy(
			{ 'a.js': '1', 'b.js': '2', 'c.js': '3' },
			{ 'a.js': '1', 'b.js': 'old' },
			['a.js', 'b.js']
		);
		expect(plan.uploads).toEqual(['b.js', 'c.js']);
	});

	it('uploads again a file the manifest lists but the server lacks (interrupted deploy)', () => {
		expect(planDeploy({ 'a.js': '1' }, { 'a.js': '1' }, []).uploads).toEqual(['a.js']);
	});

	it('uploads assets first, then .htaccess, then HTML pages', () => {
		const local = {
			'en/index.html': 'h',
			'.htaccess': 'x',
			'_app/x.js': 'j',
			'404.html': 'n',
			'cv.pdf': 'p'
		};
		expect(planDeploy(local, {}, []).uploads).toEqual([
			'_app/x.js',
			'cv.pdf',
			'.htaccess',
			'404.html',
			'en/index.html'
		]);
	});

	it('deletes stale files but never OVH config or the manifest', () => {
		const plan = planDeploy({ 'a.js': '1' }, {}, [
			'a.js',
			'old.js',
			'.ovhconfig',
			MANIFEST,
			'x/old.png'
		]);
		expect(plan.deletes).toEqual(['old.js', 'x/old.png']);
	});

	it('uploads a file whose size on the server differs, even when the manifest agrees', () => {
		const plan = planDeploy(
			{ 'en/index.html': 'h1' },
			{ 'en/index.html': 'h1' },
			['en/index.html'],
			{
				local: { 'en/index.html': 100 },
				remote: { 'en/index.html': 90 }
			}
		);
		expect(plan.uploads).toEqual(['en/index.html']);
	});
});

describe('host key check', () => {
	// The ED25519 key ftp.cluster129.hosting.ovh.net sent, as ssh-keyscan prints it.
	const ovhKey = Buffer.from(
		'AAAAC3NzaC1lZDI1NTE5AAAAIPHzGPnvg+XUpaMELjQ4AIj/6pkjvvHYCUxDVpcdaC8T',
		'base64'
	);

	it('computes the fingerprint ssh shows (SHA256, base64, no padding)', () => {
		expect(fingerprint(ovhKey)).toBe('SHA256:xhieLplnoEvvl7+a8sq8wLCh/bvOQvQFIVewi+fK2og');
	});

	it('trusts the pinned OVH keys', () => {
		expect(hostKeyTrusted(ovhKey, OVH_HOST_KEYS)).toBe(true);
	});

	it('refuses any other key (someone in between, or the server changed)', () => {
		expect(hostKeyTrusted(Buffer.from('another key'), OVH_HOST_KEYS)).toBe(false);
	});
});

describe('ignoredFiles', () => {
	let repo = '';
	afterEach(() => rmSync(repo, { recursive: true, force: true }));

	/** A throwaway repository with a .gitignore and the given (empty) files. */
	function makeRepo(files: string[]): string {
		repo = mkdtempSync(join(tmpdir(), 'ignored-'));
		execFileSync('git', ['init', '-q'], { cwd: repo });
		writeFileSync(join(repo, '.gitignore'), '*:Zone.Identifier\n.DS_Store\n');
		for (const file of files) {
			mkdirSync(dirname(join(repo, file)), { recursive: true });
			writeFileSync(join(repo, file), '');
		}
		return repo;
	}

	it('lists the files under the folder that are ignored (Windows download markers)', () => {
		const cwd = makeRepo(['static/cv.pdf', 'static/cv.pdf:Zone.Identifier', 'static/x/.DS_Store']);
		expect(ignoredFiles('static', cwd)).toEqual([
			'static/cv.pdf:Zone.Identifier',
			'static/x/.DS_Store'
		]);
	});

	it('is empty when nothing is ignored (a clean checkout, as in CI)', () => {
		expect(ignoredFiles('static', makeRepo(['static/cv.pdf', 'static/a.png']))).toEqual([]);
	});

	it('leaves out ignored files outside the folder', () => {
		expect(ignoredFiles('static', makeRepo(['static/a.png', 'other/.DS_Store']))).toEqual([]);
	});
});
