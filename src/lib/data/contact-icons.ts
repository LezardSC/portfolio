import { siGithub } from 'simple-icons';
import type { BrandContactId } from '$lib/contact';
import type { SkillIcon } from '$lib/skills';

/** A brand logo; `viewBox` crops it when only part of the 24×24 icon is shown (default `0 0 24 24`). */
export type BrandIcon = SkillIcon & { viewBox?: string };

/** Brand logos for the contact tiles. Only `{ path, hex }` is kept from simple-icons. */
export const CONTACT_BRANDS: Record<BrandContactId, BrandIcon> = {
	/** Not in simple-icons (removed at LinkedIn's request), so the "in" square logo is inlined. */
	linkedin: {
		path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
		hex: '0A66C2'
	},
	github: { path: siGithub.path, hex: siGithub.hex },
	/**
	 * The simple-icons Malt icon is its wordmark, unreadable at 28px: this is only its symbol
	 * (the icon's last subpaths, copied from simple-icons 16.33), cropped by the viewBox.
	 * Inlined so a simple-icons update can't reorder the subpaths under us.
	 */
	malt: {
		path: 'M3.499 13.563l-.21.21.619.618c.304.304.79.598 1.244.144.339-.34.26-.695.073-.98-.06.004-1.726.008-1.726.008zm-.963-2.325.21-.21-.608-.607c-.304-.303-.765-.621-1.243-.143-.351.35-.273.692-.087.97Zm2.86.416c-.037.043-1.511 1.524-1.511 1.524h1.154c.43 0 .981-.101.981-.777 0-.496-.296-.683-.624-.747zm-3.244-.031H.981c-.43 0-.981.135-.981.778 0 .479.307.676.641.745.04-.046 1.511-1.523 1.511-1.523zm1.484 3.04-.618-.618-.608.607a2.613 2.613 0 0 1-.137.128c.07.333.266.639.745.639s.676-.307.745-.641c-.043-.037-.085-.073-.127-.115zM2.41 10.15l.608.607.618-.618a2.25 2.25 0 0 1 .128-.118c-.065-.327-.251-.623-.747-.623s-.682.297-.746.625c.046.04.092.08.14.127zm2.742.117c-.455-.454-.94-.16-1.244.144l-2.87 2.87c-.303.303-.621.765-.143 1.243.478.478.94.16 1.243-.143l2.87-2.87c.304-.304.598-.79.144-1.244Z',
		hex: 'FC5757',
		viewBox: '-0.3 9.1 6.62 6.62'
	}
};
