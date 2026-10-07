import { PROFILE } from '$lib/data/profile';
import type { Lang } from '$lib/i18n/lang';
import { assetHref } from '$lib/paths';

export type ContactId = 'email' | 'linkedin' | 'github' | 'malt' | 'cv';

/** Contacts drawn with a brand logo (the others use line icons). */
export type BrandContactId = Exclude<ContactId, 'email' | 'cv'>;

export type ContactLink = { id: ContactId; label: string; href: string; external: boolean };

/** Tiles under the email and Malt blocks, in display order. `cvLabel` comes from the dictionary. */
export function contactLinks(lang: Lang, base: string, cvLabel: string): ContactLink[] {
	return [
		{ id: 'linkedin', label: 'LinkedIn', href: PROFILE.linkedin, external: true },
		{ id: 'github', label: 'GitHub', href: PROFILE.github, external: true },
		{ id: 'cv', label: cvLabel, href: assetHref(base, PROFILE.cv[lang]), external: true }
	];
}
