import { describe, expect, it } from 'vitest';
import { shouldReveal } from './reveal';

const ok = { supported: true, reducedMotion: false, inViewAtStart: false };

describe('shouldReveal', () => {
	it('animates a supported, below-the-fold section', () => {
		expect(shouldReveal(ok)).toBe(true);
	});
	it('never hides anything without IntersectionObserver', () => {
		expect(shouldReveal({ ...ok, supported: false })).toBe(false);
	});
	it('respects reduced motion', () => {
		expect(shouldReveal({ ...ok, reducedMotion: true })).toBe(false);
	});
	it('leaves a section already on screen alone (no flash)', () => {
		expect(shouldReveal({ ...ok, inViewAtStart: true })).toBe(false);
	});
});
