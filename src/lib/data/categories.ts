import type { ContextDef, DomainDef } from '$lib/categories';
import { typeset } from '$lib/i18n/typography';
import { ICONS } from './icons';

/**
 * Project domains. Key order is filter order. A project's first domain is its main one (icon,
 * label and colour of its card). Add a line here and filters, cards and tiles follow.
 */
export const DOMAINS = typeset({
	web: { label: { en: 'Web', fr: 'Web' }, color: '#5b3fa0', icon: ICONS.code },
	mobile: { label: { en: 'Mobile', fr: 'Mobile' }, color: '#2e6b34', icon: ICONS.phone },
	blockchain: { label: { en: 'Blockchain', fr: 'Blockchain' }, color: '#24408e', icon: ICONS.cube },
	ai: { label: { en: 'AI', fr: 'IA' }, color: '#0b6e6e', icon: ICONS.sparkles },
	'low-level': { label: { en: 'Low-level', fr: 'Bas niveau' }, color: '#c2391b', icon: ICONS.chip },
	games: { label: { en: 'Games', fr: 'Jeux' }, color: '#7a2e5e', icon: ICONS.gamepad }
} satisfies Record<string, DomainDef>);
export type Domain = keyof typeof DOMAINS;
export const DOMAIN_IDS = Object.keys(DOMAINS) as Domain[];

/** Project contexts. Key order is filter order. */
export const CONTEXTS = typeset({
	professional: { label: { en: 'Professional', fr: 'Professionnel' } },
	personal: { label: { en: 'Personal', fr: 'Personnel' } },
	school: { label: { en: 'School', fr: 'École' } },
	hackathon: { label: { en: 'Hackathon', fr: 'Hackathon' } }
} satisfies Record<string, ContextDef>);
export type Context = keyof typeof CONTEXTS;
export const CONTEXT_IDS = Object.keys(CONTEXTS) as Context[];
