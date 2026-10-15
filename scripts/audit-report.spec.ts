import { describe, expect, it } from 'vitest';
import {
	allPassed,
	axeCheck,
	formatTable,
	lighthouseChecks,
	overflowCheck,
	type LighthouseSummary
} from './audit-report';

const perfect = { performance: 1, accessibility: 1, 'best-practices': 1, seo: 1 };
const summary = (scores: Partial<LighthouseSummary['scores']>, failedSeoAudits: string[] = []) => ({
	scores: { ...perfect, ...scores },
	failedSeoAudits
});
const byCategory = (label: string, s: LighthouseSummary) =>
	Object.fromEntries(lighthouseChecks(label, s).map((c) => [c.name.split(' ').at(-1), c]));

describe('lighthouseChecks', () => {
	it('passes every category at its target', () => {
		const checks = lighthouseChecks('mobile', summary({ performance: 0.95 }));
		expect(checks).toHaveLength(4);
		expect(checks.every((c) => c.ok)).toBe(true);
		expect(checks[0].name).toBe('Lighthouse mobile performance');
	});

	it('fails a category under its target and says by how much', () => {
		const c = byCategory('mobile', summary({ performance: 0.94, accessibility: 0.98 }));
		expect(c.performance).toMatchObject({ ok: false, detail: '94 < 95' });
		expect(c.accessibility).toMatchObject({ ok: false, detail: '98 < 100' });
	});

	it('passes a report-only category under its target, showing the score', () => {
		const checks = lighthouseChecks('mobile', summary({ performance: 0.9 }), ['performance']);
		expect(checks[0]).toMatchObject({ ok: true, detail: '90 (report only, target 95)' });
		expect(lighthouseChecks('mobile', summary({ seo: 0.9 }), ['performance'])[3].ok).toBe(false);
	});

	it('fails a missing score', () => {
		expect(byCategory('desktop', summary({ seo: null })).seo.ok).toBe(false);
	});

	it('fails SEO when an audit fails, and names it', () => {
		const c = byCategory('mobile', summary({ seo: 0.92 }, ['hreflang']));
		expect(c.seo.ok).toBe(false);
		expect(c.seo.detail).toBe('92 < 100 (failed: hreflang)');
	});
});

describe('axeCheck', () => {
	it('passes with no violations', () => {
		expect(axeCheck('/en/ dark 360px', [])).toEqual({
			name: 'axe /en/ dark 360px',
			ok: true,
			detail: '0 violations'
		});
	});
	it('lists each rule with its node count', () => {
		const c = axeCheck('x', [
			{ id: 'color-contrast', nodes: [1, 2] },
			{ id: 'list', nodes: [1] }
		]);
		expect(c).toMatchObject({ ok: false, detail: 'color-contrast (2), list (1)' });
	});
});

describe('overflowCheck', () => {
	it('passes when the page is not wider than the viewport', () => {
		expect(overflowCheck('/fr/ 360px', 0).ok).toBe(true);
	});
	it('fails and reports the overflow in px', () => {
		expect(overflowCheck('/fr/ 360px', 23)).toEqual({
			name: 'no horizontal scroll /fr/ 360px',
			ok: false,
			detail: '23px wider than the viewport'
		});
	});
});

describe('formatTable / allPassed', () => {
	const checks = [
		{ name: 'a', ok: true, detail: 'fine' },
		{ name: 'longer name', ok: false, detail: 'broken' }
	];
	it('prints one aligned PASS/FAIL line per check', () => {
		expect(formatTable(checks).split('\n')).toEqual([
			'PASS  a            fine',
			'FAIL  longer name  broken'
		]);
	});
	it('is true only when every check passed', () => {
		expect(allPassed(checks)).toBe(false);
		expect(allPassed(checks.slice(0, 1))).toBe(true);
		expect(allPassed([])).toBe(false);
	});
});
