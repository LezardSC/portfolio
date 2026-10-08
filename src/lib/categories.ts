import type { Localized } from '$lib/i18n/lang';

/** A project domain: everything about it lives in its entry in `$lib/data/categories`. */
export type DomainDef = {
	label: Localized;
	/** '#rrggbb'. Tints phone tiles and featured cards; must pass the contrast tests in both themes. */
	color: string;
	/** Stroke icon path, usually one of `ICONS` in `$lib/data/icons`. */
	icon: string;
};

/** A project context (professional, school…). */
export type ContextDef = { label: Localized };

/** The categories of `order` that occur in `used`, in `order`'s order (filters skip empty ones). */
export function usedCategories<K extends string>(order: readonly K[], used: Iterable<K>): K[] {
	const set = new Set(used);
	return order.filter((k) => set.has(k));
}
