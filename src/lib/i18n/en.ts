import type { SectionId } from '$lib/sections';

export const en = {
	meta: {
		title: 'Jocelyn — Software Engineer',
		description:
			'Portfolio of Jocelyn, software engineer from 42 School: systems, web, blockchain and AI projects.'
	},
	hero: {
		name: 'Jocelyn',
		tagline: 'Software engineer — systems, web, blockchain & AI.'
	},
	navLabel: 'Main',
	nav: {
		about: 'About',
		projects: 'Projects',
		skills: 'Skills',
		experience: 'Experience',
		contact: 'Contact'
	} satisfies Record<SectionId, string>,
	sections: {
		about: 'About me',
		projects: 'Projects',
		skills: 'Skills',
		experience: 'Experience & Education',
		contact: 'Contact'
	} satisfies Record<SectionId, string>,
	placeholder: 'Coming soon.',
	theme: {
		toLight: 'Switch to light theme',
		toDark: 'Switch to dark theme'
	},
	langSwitch: {
		label: 'Version française',
		short: 'FR'
	}
};

export type Dict = typeof en;
