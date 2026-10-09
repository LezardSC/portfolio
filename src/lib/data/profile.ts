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
			en: 'I got into programming for the money. I stayed because I found out I love understanding how things work underneath: memory, processes, the network, the machine itself.',
			fr: 'Je me suis mis à la programmation pour l’argent. J’y suis resté parce que j’ai découvert que j’adore comprendre comment les choses fonctionnent en dessous\u00a0: la mémoire, les processus, le réseau, la machine elle-même.'
		},
		{
			en: 'I trained at 42 Lyon (RNCP 7 - Expert in computer architecture), then worked as a full-stack developer at Y247 Group and as a machine-learning developer at Sogeti (Capgemini), and won several hackathons along the way.',
			fr: 'Je me suis formé à 42 Lyon (RNCP 7 - Expert en architecture informatique), puis j’ai travaillé comme développeur full stack chez Y247 Group et comme développeur machine learning chez Sogeti (Capgemini), en remportant plusieurs hackathons au passage.'
		},
		{
			en: 'Today I focus on backend and systems work - APIs, services, Rust, infrastructure - while staying at home with Web3 and AI when a project needs them.',
			fr: 'Aujourd’hui je me concentre sur le backend et les systèmes - APIs, services, Rust, infrastructure - tout en restant à l’aise avec le Web3 et l’IA quand un projet en a besoin.'
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
