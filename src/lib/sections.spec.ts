import { describe, expect, it } from 'vitest';
import { sectionInView } from './sections';

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
});
