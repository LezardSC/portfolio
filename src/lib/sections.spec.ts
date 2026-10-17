import { describe, expect, it } from 'vitest';
import { isAtBottom, savePendingSection, sectionInView, takePendingSection } from './sections';

describe('pending section hand-off', () => {
	const memory = () => {
		const data = new Map<string, string>();
		return {
			getItem: (k: string) => data.get(k) ?? null,
			setItem: (k: string, v: string) => void data.set(k, v),
			removeItem: (k: string) => void data.delete(k)
		};
	};
	const fail = () => {
		throw new Error('blocked');
	};
	const broken = { getItem: fail, setItem: fail, removeItem: fail };

	it('returns the saved section once, then nothing', () => {
		const s = memory();
		savePendingSection(() => s, 'projects');
		expect(takePendingSection(() => s)).toBe('projects');
		expect(takePendingSection(() => s)).toBeNull();
	});

	it('saves nothing for the hero (null)', () => {
		const s = memory();
		savePendingSection(() => s, 'projects');
		savePendingSection(() => s, null);
		expect(takePendingSection(() => s)).toBeNull();
	});

	it('ignores a value that is not a section id', () => {
		const s = memory();
		s.setItem('pending-section', 'nope');
		expect(takePendingSection(() => s)).toBeNull();
	});

	it('never throws when storage is blocked', () => {
		expect(() => savePendingSection(() => broken, 'about')).not.toThrow();
		expect(takePendingSection(() => broken)).toBeNull();
	});

	it('never throws when merely accessing storage throws', () => {
		expect(() => savePendingSection(fail, 'about')).not.toThrow();
		expect(takePendingSection(fail)).toBeNull();
	});
});

// Viewport-relative tops of each section, as getBoundingClientRect().top reports them.
const tops = (about: number) => ({
	about,
	projects: about + 800,
	experience: about + 3000,
	skills: about + 3600,
	contact: about + 4200
});

describe('sectionInView', () => {
	it('is null on the hero, before About reaches the nav', () => {
		expect(sectionInView(tops(300), 56)).toBeNull();
	});
	it('is the last section whose top reached the nav, sub-pixel offsets included', () => {
		expect(sectionInView(tops(56.5), 56)).toBe('about');
		expect(sectionInView(tops(-1000), 56)).toBe('projects');
	});
	it('is the last section at the bottom of the page, where a short Contact never reaches the nav', () => {
		expect(sectionInView(tops(-3700), 56, true)).toBe('contact');
		expect(sectionInView(tops(-3700), 56, false)).toBe('skills');
	});
});

describe('isAtBottom', () => {
	it('is true at the end of the page, within rounding, false higher up', () => {
		expect(isAtBottom(4100, 900, 5000)).toBe(true);
		expect(isAtBottom(4098.5, 900, 5000)).toBe(true);
		expect(isAtBottom(3900, 900, 5000)).toBe(false);
	});
});
