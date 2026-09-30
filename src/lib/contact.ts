import { PROFILE } from '$lib/data/profile';
import type { Lang } from '$lib/i18n/lang';
import { assetHref } from '$lib/paths';

export type ContactId = 'email' | 'linkedin' | 'github' | 'malt' | 'cv';

/** Contacts drawn with a brand logo (the others use line icons). */
export type BrandContactId = Exclude<ContactId, 'email' | 'cv'>;

export type ContactLink = { id: ContactId; label: string; href: string; external: boolean };

/** Last path segment of a profile URL, e.g. '…/in/jocelyn-renault/' → 'jocelyn-renault'. */
export function profileHandle(url: string): string {
	return new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? '';
}

/** Contact tiles in display order. `cvLabel` comes from the dictionary. */
export function contactLinks(lang: Lang, base: string, cvLabel: string): ContactLink[] {
	return [
		{ id: 'email', label: PROFILE.email, href: `mailto:${PROFILE.email}`, external: false },
		{
			id: 'linkedin',
			label: profileHandle(PROFILE.linkedin),
			href: PROFILE.linkedin,
			external: true
		},
		{ id: 'github', label: profileHandle(PROFILE.github), href: PROFILE.github, external: true },
		{ id: 'malt', label: 'Malt', href: PROFILE.malt, external: true },
		{ id: 'cv', label: cvLabel, href: assetHref(base, PROFILE.cv[lang]), external: true }
	];
}
