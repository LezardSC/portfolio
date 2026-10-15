import type { Dict } from './en';

export const fr: Dict = {
	meta: {
		locale: 'fr_FR',
		altLocale: 'en_US',
		title: 'Jocelyn Renault - Ingénieur logiciel',
		description:
			'Portfolio de Jocelyn Renault, ingénieur logiciel issu de 42\u00a0: projets backend, systèmes, web, blockchain et IA.'
	},
	hero: {
		available: 'Disponible',
		projects: 'Voir les projets',
		cv: 'Voir le CV',
		malt: 'Profil Malt',
		maltShort: 'Malt',
		glance: 'En bref',
		glanceText: {
			tally: '{wins}, {podiums}',
			wins: { one: '{n} victoire', other: '{n} victoires' },
			podiums: { one: '{n} podium', other: '{n} podiums' }
		}
	},
	about: {
		photoAlt: 'Photo de Jocelyn Renault'
	},
	common: {
		readMore: 'Lire la suite',
		showLess: 'Réduire'
	},
	navCv: 'CV',
	navLabel: 'Principale',
	skipToContent: 'Aller au contenu',
	newTab: '(s’ouvre dans un nouvel onglet)',
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
	projects: {
		contextLabel: 'Contexte',
		domainLabel: 'Domaine',
		all: 'Tous',
		sortLabel: 'Trier par',
		sort: { priority: 'Pertinence', newest: 'Plus récents' },
		empty: 'Aucun projet ne correspond à ces filtres.',
		reset: 'Réinitialiser les filtres',
		more: 'Autres projets',
		private: 'Privé',
		repo: 'Code source sur GitHub',
		demo: 'Démo en ligne',
		showMore: { one: 'Voir {n} autre projet', other: 'Voir les {n} autres projets' },
		showFewer: 'Réduire la liste',
		sourceCode: 'Code source',
		code: 'Code',
		privateCode: 'Code privé',
		demoLink: 'Démo',
		demoShort: 'Démo',
		/** Hackathon chips on the cards, one per placement ("×n" when it happened more than once). */
		placement: 'Hackathon\u00a0: {place}',
		places: { 1: '1re place', 2: '2e place', 3: '3e place' },
		/** Tooltip: the events behind a chip. */
		resultItem: '{event} {year}'
	},
	skills: {
		lead: 'Mon cœur de métier\u00a0: backend, systèmes et outillage.',
		tabsLabel: 'Domaines de compétences'
	},
	experience: {
		work: 'Expérience',
		education: 'Formation',
		hackathonsTitle: 'Hackathons - {n}\u00a0podiums',
		present: 'Aujourd’hui',
		internship: 'Stage',
		translated: '(traduit de l’anglais)',
		recommendation: 'Recommandation - {name}',
		results: { 1: 'Vainqueur', 2: '2e place', 3: '3e place' },
		months: { one: '{n}\u00a0mois', other: '{n}\u00a0mois' },
		certificate: 'Voir le certificat'
	},
	contact: {
		intro: 'Ouvert aux opportunités. Le plus rapide pour me joindre, c’est l’e-mail.',
		cv: 'CV (PDF)',
		byEmail: 'Par e-mail',
		copy: 'Copier l’adresse',
		copied: 'Copié\u00a0!',
		copyHint: 'Appuyez sur Ctrl+C (⌘C sur Mac) pour copier.',
		maltLabel: 'Freelance',
		maltTitle: 'Vous passez par Malt\u00a0?',
		maltText:
			'Mon profil, mes recommandations et la prise de contact pour une mission sont aussi sur Malt.',
		maltShort: 'Profil, recommandations et contact pour une mission.',
		maltCta: 'Voir mon profil Malt'
	},
	footer: {
		backToTop: 'Retour en haut'
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
