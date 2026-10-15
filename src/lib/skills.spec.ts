import { describe, expect, it } from 'vitest';
import { nextTab, panelHidden } from './skills';

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
