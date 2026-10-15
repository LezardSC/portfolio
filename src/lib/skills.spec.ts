import { describe, expect, it } from 'vitest';
import { nextTab, panelHidden, logoId, logoSprite, shownGroups, spriteVersion } from './skills';

describe('nextTab', () => {
	it('moves down and up, wrapping at both ends', () => {
		expect(nextTab(0, 'ArrowDown', 6)).toBe(1);
		expect(nextTab(5, 'ArrowDown', 6)).toBe(0);
		expect(nextTab(0, 'ArrowUp', 6)).toBe(5);
		expect(nextTab(3, 'ArrowUp', 6)).toBe(2);
	});
	it('jumps to the first and last tab', () => {
		expect(nextTab(3, 'Home', 6)).toBe(0);
		expect(nextTab(3, 'End', 6)).toBe(5);
	});
	it('ignores other keys', () => {
		for (const key of ['ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'a'])
			expect(nextTab(2, key, 6)).toBeNull();
	});
});

describe('panelHidden', () => {
	const base = { enhanced: true, desktop: true, selected: 2, open: 0 };
	it('hides nothing before hydration', () => {
		for (const i of [0, 1, 2]) expect(panelHidden({ ...base, enhanced: false }, i)).toBe(false);
	});
	it('shows only the selected tab on desktop, whatever the accordion state', () => {
		expect(panelHidden(base, 2)).toBe(false);
		expect(panelHidden(base, 0)).toBe(true);
		expect(panelHidden({ ...base, open: -1 }, 2)).toBe(false);
	});
	it('shows only the open group on phones, none when all are closed', () => {
		const phone = { ...base, desktop: false };
		expect(panelHidden(phone, 0)).toBe(false);
		expect(panelHidden(phone, 2)).toBe(true);
		for (const i of [0, 1, 2]) expect(panelHidden({ ...phone, open: -1 }, i)).toBe(true);
	});
});

describe('skill logos sprite', () => {
	const rust = { path: 'M1 1h2v2H1z', hex: '000000' };
	const c = { path: 'M2 2h4v4H2z', hex: 'A8B9CC' };
	const groups = [
		{
			id: 'a',
			icon: '',
			title: { en: 'A', fr: 'A' },
			description: { en: '', fr: '' },
			skills: [
				{ name: 'Rust', icon: rust },
				{ name: 'C', icon: c }
			]
		},
		{
			id: 'b',
			icon: '',
			title: { en: 'B', fr: 'B' },
			description: { en: '', fr: '' },
			skills: [{ name: 'Rust', icon: rust }]
		}
	];

	it('gives one id per drawing, usable as an XML id', () => {
		expect(logoId(rust)).toBe(logoId({ ...rust }));
		expect(logoId(rust)).not.toBe(logoId(c));
		expect(logoId(rust)).toMatch(/^l[0-9a-z]+$/);
	});

	it('draws each distinct logo once, under its id', () => {
		const svg = logoSprite(groups);
		expect(svg.match(/<symbol /g)).toHaveLength(2);
		expect(svg).toContain(
			`<symbol id="${logoId(rust)}" viewBox="0 0 24 24"><path d="${rust.path}"/></symbol>`
		);
	});

	it('sends the page ids and colours, never the drawings', () => {
		const shown = shownGroups(groups);
		expect(shown[0].skills[0]).toEqual({ name: 'Rust', logo: { id: logoId(rust), hex: '000000' } });
		expect(JSON.stringify(shown)).not.toContain(rust.path);
	});

	it('versions the sprite URL by its content, so a changed logo is not served from cache', () => {
		expect(spriteVersion(groups)).toBe(spriteVersion(groups));
		expect(spriteVersion(groups)).not.toBe(spriteVersion([groups[1]]));
	});
});
