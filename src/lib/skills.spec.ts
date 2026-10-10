import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio, logoColor, nextTab, panelHidden, THEME_BG } from './skills';

describe('contrastRatio', () => {
	it('is 21 for black on white and 1 for a colour on itself', () => {
		expect(contrastRatio('000000', 'ffffff')).toBeCloseTo(21, 5);
		expect(contrastRatio('3776AB', '3776AB')).toBeCloseTo(1, 5);
	});

	it('does not depend on argument order and accepts a leading #', () => {
		expect(contrastRatio('#0d1117', 'F7DF1E')).toBeCloseTo(contrastRatio('F7DF1E', '#0d1117'), 5);
	});
});

describe('logoColor', () => {
	it('uses the brand colour when it stands out from the background', () => {
		expect(logoColor('3776AB', THEME_BG.light)).toBe('#3776AB'); // Python blue on white
		expect(logoColor('F7DF1E', THEME_BG.dark)).toBe('#F7DF1E'); // JavaScript yellow on dark
	});

	it('falls back to the text colour when the brand colour would vanish', () => {
		expect(logoColor('000000', THEME_BG.dark)).toBe('var(--text)'); // Rust black on dark
		expect(logoColor('F7DF1E', THEME_BG.light)).toBe('var(--text)'); // JavaScript yellow on white
	});
});

describe('THEME_BG', () => {
	it('matches the --bg tokens of src/app.css', () => {
		const css = readFileSync(resolve('src/app.css'), 'utf8');
		const bgOf = (selector: string) =>
			css
				.slice(css.indexOf(selector))
				.match(/--bg:\s*(#[0-9a-f]{6})/i)?.[1]
				.toLowerCase();
		expect(bgOf(':root {')).toBe(THEME_BG.dark);
		expect(bgOf(":root[data-theme='light']")).toBe(THEME_BG.light);
	});
});

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
	it('shows only the open group on phones', () => {
		const phone = { ...base, desktop: false };
		expect(panelHidden(phone, 0)).toBe(false);
		expect(panelHidden(phone, 2)).toBe(true);
	});
	it('hides every group on phones when all are closed', () => {
		const closed = { ...base, desktop: false, open: -1 };
		for (const i of [0, 1, 2]) expect(panelHidden(closed, i)).toBe(true);
	});
});
