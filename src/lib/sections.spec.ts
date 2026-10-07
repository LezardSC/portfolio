import { describe, expect, it } from 'vitest';
import {
	isAtBottom,
	longestWordLength,
	savePendingSection,
	sectionInView,
	sectionNumber,
	takePendingSection
} from './sections';

// Viewport-relative tops of each section, as getBoundingClientRect().top would report them.
const tops = (about: number) => ({
	about,
	projects: about + 800,
	skills: about + 3000,
	experience: about + 3600,
	contact: about + 4200
});

describe('sectionInView', () => {
	it('returns null at the top of the page, where only the hero is visible', () => {
		expect(sectionInView(tops(900), 56)).toBeNull();
	});

	it('returns null when About is visible but has not reached the nav yet', () => {
		expect(sectionInView(tops(300), 56)).toBeNull();
	});

	it('returns the section whose top has reached the nav', () => {
		expect(sectionInView(tops(56), 56)).toBe('about');
	});

	it('returns the last section that has scrolled under the nav', () => {
		expect(sectionInView(tops(-1000), 56)).toBe('projects');
	});

	it('tolerates sub-pixel offsets after an anchor jump', () => {
		expect(sectionInView(tops(56.5), 56)).toBe('about');
	});

	// Contact is shorter than the viewport, so its top never reaches the nav:
	// scrolled to the very bottom, Experience's top is still the last one past the nav.
	it('returns the last section when scrolled to the bottom of the page', () => {
		expect(sectionInView(tops(-3700), 56, true)).toBe('contact');
	});

	it('ignores the bottom flag while not at the bottom', () => {
		expect(sectionInView(tops(-3700), 56, false)).toBe('experience');
	});
});

describe('isAtBottom', () => {
	it('is true when the viewport reaches the end of the page', () => {
		expect(isAtBottom(4100, 900, 5000)).toBe(true);
	});

	it('tolerates a sub-pixel or zoom rounding shortfall', () => {
		expect(isAtBottom(4098.5, 900, 5000)).toBe(true);
	});

	it('is false higher up the page', () => {
		expect(isAtBottom(3900, 900, 5000)).toBe(false);
	});
});

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

describe('sectionNumber', () => {
	it('numbers sections from 01 in nav order', () => {
		expect(sectionNumber('about')).toBe('01');
		expect(sectionNumber('projects')).toBe('02');
		expect(sectionNumber('contact')).toBe('05');
	});
});

describe('longestWordLength', () => {
	it('counts the characters of the longest word', () => {
		expect(longestWordLength('Compétences')).toBe(11);
		expect(longestWordLength('Expérience & Formation')).toBe(10);
		expect(longestWordLength('À propos de moi')).toBe(6);
	});
});
