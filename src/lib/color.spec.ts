import { describe, expect, it } from 'vitest';
import { contrastRatio, logoColor } from './color';
import { THEME_BG } from './theme';

describe('contrastRatio', () => {
	it('is 21 for black on white and 1 for a colour on itself, in any order, # optional', () => {
		expect(contrastRatio('000000', '#ffffff')).toBeCloseTo(21, 5);
		expect(contrastRatio('3776AB', '3776AB')).toBeCloseTo(1, 5);
		expect(contrastRatio('#0d1117', 'F7DF1E')).toBeCloseTo(contrastRatio('F7DF1E', '#0d1117'), 5);
	});
});

describe('logoColor', () => {
	it('keeps a brand colour that stands out, else falls back to the text colour', () => {
		expect(logoColor('F7DF1E', THEME_BG.dark)).toBe('#F7DF1E'); // JavaScript yellow on dark
		expect(logoColor('000000', THEME_BG.dark)).toBe('var(--text)'); // Rust black on dark
		expect(logoColor('F7DF1E', THEME_BG.light)).toBe('var(--text)'); // yellow on light
	});
});
