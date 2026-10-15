/**
 * Every width a `@media` rule may use, in rem (breakpoints.spec.ts rejects any other). CSS
 * writes them as `(width < 48rem)`; JS uses the queries below.
 */
export const BREAKPOINTS_REM = {
	/** Phone below, desktop at and above: cards, nav, every phone layout. */
	desktop: 48,
	/** Skills tabs beside the panel at and above, above it below. */
	skillsTabs: 60,
	/** Narrow phones (360px): tighter header and selects. */
	narrow: 24.375
} as const;

/** At and above this width cards keep media on top and videos may play; below it is "phone". */
export const DESKTOP_QUERY = `(min-width: ${BREAKPOINTS_REM.desktop}rem)`;

/** Phone screens, for `<source media>`: exactly the screens DESKTOP_QUERY doesn't match. */
export const PHONE_QUERY = `not all and ${DESKTOP_QUERY}`;
