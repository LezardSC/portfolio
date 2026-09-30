/** What can happen to the mobile nav menu. */
export type MenuEvent = 'toggle' | 'escape' | 'link' | 'outside' | 'wide';

/** `focusButton`: move focus back to the menu button (after Escape closed the menu). */
export type MenuState = { open: boolean; focusButton: boolean };

/** At and above this width the links show inline and the menu button is hidden. Keep in sync with Nav.svelte's CSS. */
export const MENU_BREAKPOINT = '(min-width: 47.5rem)';

/**
 * Next menu state. Everything but the button closes the menu; Escape also returns focus to
 * the button, but only when it actually closed the menu.
 */
export function nextMenu(open: boolean, event: MenuEvent): MenuState {
	if (event === 'toggle') return { open: !open, focusButton: false };
	return { open: false, focusButton: event === 'escape' && open };
}
