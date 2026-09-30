import type { SectionId } from '$lib/sections';
import type { Context, Domain, SortKey } from '$lib/projects';

export const en = {
	meta: {
		title: 'Jocelyn Renault — Software Engineer',
		description:
			'Portfolio of Jocelyn Renault, software engineer from 42 School: backend, systems, web, blockchain and AI projects.'
	},
	hero: {
		available: 'Available for work',
		projects: 'See projects',
		cv: 'Download CV',
		github: 'GitHub',
		newTab: '(opens in a new tab)'
	},
	about: {
		photoAlt: 'Photo of Jocelyn Renault'
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
	projects: {
		contextLabel: 'Context',
		domainLabel: 'Domain',
		all: 'All',
		contexts: {
			professional: 'Professional',
			personal: 'Personal',
			school: 'School',
			hackathon: 'Hackathon'
		} satisfies Record<Context, string>,
		domains: {
			web: 'Web',
			blockchain: 'Blockchain',
			ai: 'AI',
			'low-level': 'Low-level',
			games: 'Games'
		} satisfies Record<Domain, string>,
		sortLabel: 'Sort by',
		sort: { featured: 'Highlights', newest: 'Newest' } satisfies Record<SortKey, string>,
		empty: 'No project matches these filters.',
		reset: 'Reset filters',
		more: 'More projects',
		private: 'Private',
		repo: 'Source code on GitHub',
		demo: 'Live demo'
	},
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
