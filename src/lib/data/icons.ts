/**
 * Stroke icons for categories (project domains, skill groups): SVG path data on a 24×24 grid,
 * drawn by `Icon.svelte` with no fill, a 1.5 stroke and round caps and joins. That is the
 * Lucide style: a Lucide icon's `d` attributes, joined into one string, fit as they are
 * (`<rect>` and `<circle>` elements must be converted to path data first).
 */
export const ICONS = {
	/** </> brackets (Web). */
	code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
	/** Isometric cube (Blockchain). */
	cube: 'M12 2l8.66 5v10L12 22l-8.66-5V7zM12 22V12M20.66 7L12 12 3.34 7',
	/** A big and a small four-pointed star (AI). */
	sparkles:
		'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
	/** Chip with two pins per side (Low-level, Systems). */
	chip:
		'M7.5 6h9a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 16.5v-9A1.5 1.5 0 0 1 7.5 6z' +
		'M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4',
	/** Game controller (Games). */
	gamepad:
		'M6 7h12a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-3a4 4 0 0 1 4-4z' +
		'M7 10.5v4M5 12.5h4' +
		'M15.2 11.5a.8.8 0 1 0 1.6 0a.8.8 0 1 0-1.6 0z' +
		'M17.2 13.5a.8.8 0 1 0 1.6 0a.8.8 0 1 0-1.6 0z',
	/** Two stacked server units (Backend). */
	server:
		'M4.5 4h15A1.5 1.5 0 0 1 21 5.5v4a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 9.5v-4A1.5 1.5 0 0 1 4.5 4z' +
		'M4.5 13h15a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-4A1.5 1.5 0 0 1 4.5 13z' +
		'M7 7.5h.01M7 16.5h.01',
	/** Two arrows in a circle (DevOps). */
	cycle: 'M20 12a8 8 0 0 1-13.66 5.66M4 12a8 8 0 0 1 13.66-5.66M18 3v4h-4M6 21v-4h4'
} as const;

/** Whether `path` looks like SVG path data: starts with a move, only path commands and numbers. */
export function isIconPath(path: string): boolean {
	return /^[Mm][MmLlHhVvCcSsQqTtAaZz0-9.,\s-]*$/.test(path);
}
