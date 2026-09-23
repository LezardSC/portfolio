/** Page sections after the hero, in display and nav order. */
export const SECTIONS = ['about', 'projects', 'skills', 'experience', 'contact'] as const;
export type SectionId = (typeof SECTIONS)[number];
