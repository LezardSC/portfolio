import type { Lang, Localized } from '$lib/i18n/lang';

export type Fact = { icon: string; text: Localized };

export type Profile = {
	name: string;
	role: Localized;
	pitch: Localized;
	/** About paragraphs, in order. */
	bio: Localized[];
	facts: Fact[];
	github: string;
	/** Paths relative to static/, resolved with assetHref. */
	cv: Record<Lang, string>;
	photo: string;
	/** Shows the "Available for work" pill in the Hero. */
	available: boolean;
};

export const PROFILE: Profile = {
	name: 'Jocelyn Renault',
	role: {
		en: 'Software Engineer · Backend & Systems',
		fr: 'Ingénieur logiciel · Backend & Systèmes'
	},
	pitch: {
		en: 'I build the invisible part of products: APIs, services, data processing, automation and deployment. My field is backend and low-level — reliability and performance over UI.',
		fr: "Je conçois la partie invisible des produits : APIs, services, traitement de données, automatisation et mise en production. Mon terrain, c'est le backend et le bas niveau — la fiabilité et la performance plutôt que l'interface."
	},
	bio: [
		{
			en: 'I got into programming for the money. I stayed because I found out I love understanding how things work underneath: memory, processes, the network, the machine itself.',
			fr: "Je me suis mis à la programmation pour l'argent. J'y suis resté parce que j'ai découvert que j'adore comprendre comment les choses fonctionnent en dessous : la mémoire, les processus, le réseau, la machine elle-même."
		},
		{
			en: 'I trained at 42 Lyon (RNCP 7 — Expert in computer architecture), then worked as a full-stack developer at Y247 Group and as a machine-learning developer at Sogeti (Capgemini), and won several hackathons along the way.',
			fr: "Je me suis formé à 42 Lyon (RNCP 7 — Expert en architecture informatique), puis j'ai travaillé comme développeur full stack chez Y247 Group et comme développeur machine learning chez Sogeti (Capgemini), en remportant plusieurs hackathons au passage."
		},
		{
			en: 'Today I focus on backend and systems work — APIs, services, Rust, infrastructure — while staying at home with Web3 and AI when a project needs them.',
			fr: "Aujourd'hui je me concentre sur le backend et les systèmes — APIs, services, Rust, infrastructure — tout en restant à l'aise avec le Web3 et l'IA quand un projet en a besoin."
		}
	],
	facts: [
		{ icon: '🎓', text: { en: '42 Lyon (RNCP 7)', fr: '42 Lyon (RNCP 7)' } },
		{ icon: '🗣', text: { en: 'French / English', fr: 'Français / Anglais' } }
	],
	github: 'https://github.com/LezardSC',
	cv: { en: 'cv-en.pdf', fr: 'cv-fr.pdf' },
	photo: 'photo.jpg',
	available: false
};
