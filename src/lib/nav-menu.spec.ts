import { describe, expect, it } from 'vitest';
import { nextMenu } from './nav-menu';

describe('nextMenu', () => {
	it('toggle opens a closed menu and closes an open one, without moving focus', () => {
		expect(nextMenu(false, 'toggle')).toEqual({ open: true, focusButton: false });
		expect(nextMenu(true, 'toggle')).toEqual({ open: false, focusButton: false });
	});

	it('escape closes an open menu and sends focus back to the button', () => {
		expect(nextMenu(true, 'escape')).toEqual({ open: false, focusButton: true });
	});

	it('escape on a closed menu does nothing, so it never steals focus', () => {
		expect(nextMenu(false, 'escape')).toEqual({ open: false, focusButton: false });
	});

	it.each(['link', 'outside', 'wide'] as const)('%s closes the menu without moving focus', (e) => {
		expect(nextMenu(true, e)).toEqual({ open: false, focusButton: false });
		expect(nextMenu(false, e)).toEqual({ open: false, focusButton: false });
	});
});
