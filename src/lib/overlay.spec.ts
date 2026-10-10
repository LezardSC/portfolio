import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mixHex } from './color';
import { OVERLAY } from './overlay';
import { DOMAIN_IDS, DOMAINS } from './data/categories';
import { contrastRatio } from './skills';

const TEXTS = ['text', 'meta', 'domain', 'award', 'desc'] as const;

describe('phone featured cards without media', () => {
	it.each(DOMAIN_IDS)('%s: every text colour reaches 4.5:1 on the veiled domain colour', (d) => {
		const ground = mixHex(OVERLAY.veil, DOMAINS[d].color, OVERLAY.veilPlain);
		for (const key of TEXTS)
			expect(contrastRatio(OVERLAY[key], ground), key).toBeGreaterThanOrEqual(4.5);
		const tagGround = mixHex('#ffffff', ground, OVERLAY.tagBg);
		expect(contrastRatio(OVERLAY.tag, tagGround), 'tag').toBeGreaterThanOrEqual(4.5);
	});
});

describe('OVERLAY', () => {
	it('matches the CSS of ProjectCardLarge.svelte', () => {
		const css = readFileSync(
			resolve('src/lib/components/projects/ProjectCardLarge.svelte'),
			'utf8'
		);
		expect(css).toContain(`--veil: ${OVERLAY.veilPlain};`);
		expect(css).toContain(`background: ${OVERLAY.veil};`);
		expect(css).toContain(`rgb(255 255 255 / ${OVERLAY.tagBg})`);
		for (const key of [...TEXTS, 'tag'] as const) expect(css, key).toContain(OVERLAY[key]);
	});
});
