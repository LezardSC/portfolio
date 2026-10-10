import { describe, expect, it } from 'vitest';
import { resolveTheme, themeOnSystemChange } from './theme';

describe('resolveTheme', () => {
	it('uses a valid stored choice over the system preference', () => {
		expect(resolveTheme('light', true)).toBe('light');
		expect(resolveTheme('dark', false)).toBe('dark');
	});
	it('falls back to the system preference when nothing valid is stored', () => {
		expect(resolveTheme(null, true)).toBe('dark');
		expect(resolveTheme(null, false)).toBe('light');
		expect(resolveTheme('blue', true)).toBe('dark');
		expect(resolveTheme('', false)).toBe('light');
	});
});

describe('themeOnSystemChange', () => {
	it('follows the OS when the visitor never picked a theme', () => {
		expect(themeOnSystemChange(null, true)).toBe('dark');
		expect(themeOnSystemChange(null, false)).toBe('light');
	});
	it('treats an invalid stored value as no choice', () => {
		expect(themeOnSystemChange('blue', false)).toBe('light');
	});
	it("keeps the visitor's own choice (returns null: nothing to change)", () => {
		expect(themeOnSystemChange('dark', false)).toBeNull();
		expect(themeOnSystemChange('light', true)).toBeNull();
	});
});
