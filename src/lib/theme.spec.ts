import { describe, expect, it } from 'vitest';
import { nextTheme, resolveTheme } from './theme';

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

describe('nextTheme', () => {
	it('toggles', () => {
		expect(nextTheme('dark')).toBe('light');
		expect(nextTheme('light')).toBe('dark');
	});
});
