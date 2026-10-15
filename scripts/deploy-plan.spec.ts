import { describe, expect, it } from 'vitest';
import { MANIFEST, planDeploy } from './deploy-plan';

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
