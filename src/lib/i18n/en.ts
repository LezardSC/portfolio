import type { SectionId } from '$lib/sections';
import type { Context, Domain, SortKey } from '$lib/projects';
import type { Medal } from '$lib/experience';

export const en = {
	meta: {
		locale: 'en_US',
		altLocale: 'fr_FR',
		title: 'Jocelyn Renault — Software Engineer',
		description:
			'Portfolio of Jocelyn Renault, software engineer from 42 School: backend, systems, web, blockchain and AI projects.'
	},
	hero: {
		available: 'Available for work',
		projects: 'See projects',
		cv: 'View CV',
		malt: 'Malt profile',
		maltShort: 'Malt',
		glance: 'At a glance'
	},
	about: {
		photoAlt: 'Photo of Jocelyn Renault'
	},
	/** Shared toggle labels for folded text. */
	common: {
		readMore: 'Read more',
		showLess: 'Show less'
	},
	navCv: 'CV',
	navLabel: 'Main',
	skipToContent: 'Skip to content',
	/** Screen-reader suffix for links that open in a new tab. */
	newTab: '(opens in a new tab)',
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
		demo: 'Live demo',
		lead: '{total} projects, {featured} worth a look first.',
		showMore: 'See the {n} other projects',
		showMoreOne: 'See 1 other project',
		showFewer: 'Show fewer',
		moreLead: 'Shorter school and game-jam projects.',
		sourceCode: 'Source code',
		code: 'Code',
		privateCode: 'Private code',
		demoLink: 'Live demo'
	},
	skills: {
		lead: 'My core: backend, systems and tooling.',
		tabsLabel: 'Skill areas'
	},
	experience: {
		work: 'Experience',
		education: 'Education',
		hackathonsTitle: 'Hackathons — {n} podiums',
		present: 'Present',
		internship: 'Internship',
		translated: '(translated from French)',
		recommendation: 'Recommendation — {name}',
		results: { 1: 'Winner', 2: '2nd place', 3: '3rd place' } satisfies Record<Medal, string>,
		months: { one: '{n} month', other: '{n} months' },
		certificate: 'View certificate'
	},
	contact: {
		intro: 'Open to opportunities. Email is the fastest way to reach me.',
		cv: 'CV (PDF)',
		byEmail: 'By email',
		copy: 'Copy address',
		copied: 'Copied!',
		copyHint: 'Press Ctrl+C (⌘C on Mac) to copy.',
		maltLabel: 'Freelance',
		maltTitle: 'Working through Malt?',
		maltText: 'My profile, recommendations and mission requests are on Malt too.',
		maltCta: 'See my Malt profile'
	},
	footer: {
		backToTop: 'Back to top'
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
