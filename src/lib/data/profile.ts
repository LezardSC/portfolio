import type { GlanceEntry } from '$lib/glance';
import type { Lang, Localized } from '$lib/i18n/lang';
import { typeset } from '$lib/i18n/typography';

// French text may use plain spaces and straight apostrophes: typeset() adds the no-break spaces and ’
// (docs/content-guide.md). Always give typeset its type, typeset<X[]>(…): it keeps TypeScript's check
// of misspelled field names.

export type Profile = {
	name: string;
	role: Localized;
	pitch: Localized;
	/** Rest of the pitch: desktop only (phones show the first sentence). */
	pitchMore: Localized;
	/** About paragraphs, in order. */
	bio: Localized[];
	/** Hero "At a glance" rows, in order: hand-written, or { auto } computed from the data. */
	glance: GlanceEntry[];
	email: string;
	linkedin: string;
	github: string;
	malt: string;
	/** Paths relative to static/, resolved with assetHref. */
	cv: Record<Lang, string>;
	photo: string;
	/** Shows the "Available for work" pill in the Hero. */
	available: boolean;
};

export const PROFILE = typeset<Profile>({
	name: 'Jocelyn Renault',
	role: {
		en: 'Software Engineer · Backend & Systems',
		fr: 'Ingénieur logiciel · Backend & Systèmes'
	},
	pitch: {
		en: 'I build APIs, services and automation tools, from the first line of code to production.',
		fr: 'Je construis des API, des services et des outils d’automatisation, de la première ligne jusqu’à la mise en production.'
	},
	pitchMore: {
		en: 'What I care about is code that lasts: easy to maintain, fast, and steady in production.',
		fr: 'Ce qui m’intéresse, c’est le code qui tient dans la durée\u00a0: simple à maintenir, rapide, et qui ne casse pas en production.'
	},
	bio: [
		{
			en: 'I got into programming for the money. Unfortunately, I ended up enjoying it.',
			fr: "Je me suis mis au code pour l'argent. Problème : j'ai fini par aimer ça."
		},
		{
			en: 'And it shows in my work. When a bug won’t go away, I track down its cause instead of working around it. When I’m handed a project, I own it end to end, from the database to the interface. And when the field is new to me, I get up to speed fast: that’s the part I enjoy most.',
			fr: "Et ça se voit dans mon travail. Quand un bug résiste, je cherche sa cause au lieu de le contourner. Quand on me confie un sujet, je le prends en main de bout en bout, de la base de données jusqu'à l'interface. Et quand le domaine m'est inconnu, je me mets vite à niveau : c'est la partie que je préfère."
		},
		{
			en: 'Over the last few years, that has meant a web application built from scratch for a client, a computer-vision model improved at Sogeti, an award-winning blockchain platform at Paris Blockchain Week and a Game Boy emulator in Rust.',
			fr: 'Ces dernières années, ça a donné une application web construite de zéro pour un client, un modèle de vision par ordinateur amélioré chez Sogeti, une plateforme blockchain primée à la Paris Blockchain Week et un émulateur Game Boy en Rust.'
		},
		{
			en: 'Next project on the list: maybe yours.',
			fr: 'Le prochain projet sur la liste : peut-être le vôtre.'
		}
	],
	glance: [
		{
			label: { en: 'Education', fr: 'Formation' },
			value: {
				en: '42 Lyon | RNCP 7, expert in computer architecture',
				fr: '42 Lyon | RNCP 7, expert en architecture informatique'
			},
			short: { en: '42 Lyon · RNCP 7', fr: '42 Lyon · RNCP 7' }
		},
		{ label: { en: 'Latest role', fr: 'Dernier poste' }, auto: 'latestRole' },
		{
			label: { en: 'Main Stack', fr: 'Stack principale' },
			value: { en: 'Rust, Python, Node.js, C, Docker', fr: 'Rust, Python, Node.js, C, Docker' },
			wide: true
		},
		{ label: { en: 'Hackathons', fr: 'Hackathons' }, auto: 'hackathons' },
		{
			label: { en: 'Languages', fr: 'Langues' },
			value: { en: 'French, English', fr: 'Français, Anglais' }
		}
	],
	email: 'jocelynrenaultpro@gmail.com',
	linkedin: 'https://www.linkedin.com/in/jocelyn-renault/',
	github: 'https://github.com/LezardSC',
	malt: 'https://www.malt.fr/profile/jocelynrenault',
	cv: { en: 'cv-en.pdf', fr: 'cv-fr.pdf' },
	photo: 'photo.jpg',
	available: true
});
