import { describe, expect, it } from 'vitest';
import { mixHex } from './color';

describe('mixHex', () => {
	it('returns a at weight 1 and b at weight 0', () => {
		expect(mixHex('#c2391b', '#ffffff', 1)).toBe('#c2391b');
		expect(mixHex('#c2391b', '#ffffff', 0)).toBe('#ffffff');
	});
	it('mixes channel by channel, like color-mix(in srgb)', () => {
		expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
		expect(mixHex('#10100e', '#0b6e6e', 0.35)).toBe('#0d4d4c');
	});
	it('accepts colours without #', () => {
		expect(mixHex('000000', 'ffffff', 0.25)).toBe('#bfbfbf');
	});
});
