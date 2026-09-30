import type { Dict } from './en';

export const fr: Dict = {
	meta: {
		title: 'Jocelyn — Ingénieur logiciel',
		description:
			'Portfolio de Jocelyn, ingénieur logiciel issu de 42 : projets systèmes, web, blockchain et IA.'
	},
	hero: {
		name: 'Jocelyn',
		tagline: 'Ingénieur logiciel — systèmes, web, blockchain & IA.'
	},
	navLabel: 'Principale',
	nav: {
		about: 'À propos',
		projects: 'Projets',
		skills: 'Compétences',
		experience: 'Parcours',
		contact: 'Contact'
	},
	sections: {
		about: 'À propos de moi',
		projects: 'Projets',
		skills: 'Compétences',
		experience: 'Expérience & Formation',
		contact: 'Contact'
	},
	placeholder: 'Bientôt disponible.',
	projects: {
		contextLabel: 'Contexte',
		domainLabel: 'Domaine',
		all: 'Tous',
		contexts: {
			professional: 'Professionnel',
			personal: 'Personnel',
			school: 'École',
			hackathon: 'Hackathon'
		},
		domains: {
			web: 'Web',
			blockchain: 'Blockchain',
			ai: 'IA',
			'low-level': 'Bas niveau',
			games: 'Jeux'
		},
		sortLabel: 'Trier par',
		sort: { featured: 'À la une', newest: 'Plus récents' },
		empty: 'Aucun projet ne correspond à ces filtres.',
		reset: 'Réinitialiser les filtres',
		more: 'Autres projets',
		private: 'Privé',
		repo: 'Code source sur GitHub',
		demo: 'Démo en ligne'
	},
	theme: {
		toLight: 'Passer au thème clair',
		toDark: 'Passer au thème sombre'
	},
	langSwitch: {
		label: 'English version',
		short: 'EN'
	}
};
