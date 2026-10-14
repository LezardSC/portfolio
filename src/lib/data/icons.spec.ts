import { describe, expect, it } from 'vitest';
import { ICONS, isIconPath } from './icons';

describe('isIconPath', () => {
	it('accepts SVG path data', () => {
		expect(isIconPath('M8 7l-5 5 5 5M14 4l-4 16')).toBe(true);
		expect(isIconPath('M7.5 6h9a1.5 1.5 0 0 1 1.5 1.5z')).toBe(true);
	});
	it('rejects markup, empty strings and paths that do not start with a move', () => {
		for (const bad of ['', '<path d="M0 0"/>', 'L1 1', 'M0 0 url(x)'])
			expect(isIconPath(bad), bad).toBe(false);
	});
});

describe('icon library', () => {
	it.each(Object.entries(ICONS))('%s is well-formed path data', (_, path) => {
		expect(isIconPath(path)).toBe(true);
	});
});
