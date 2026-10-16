/**
 * Stroke icons: SVG path data on a 24×24 grid, drawn by `Icon.svelte` with no fill and round
 * caps and joins. Category icons (project domains, skill groups) use the default 1.5 stroke;
 * interface icons (briefcase, medals, chevrons, buttons) get a thicker one from the caller
 * (2 or 2.2). That is the Lucide style: a Lucide icon's `d` attributes, joined into one
 * string, fit as they are (`<rect>` and `<circle>` elements must be converted to path data
 * first).
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
	/** Game controller (Games, the Games skill group). */
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
	/** A stack of disks: a cylinder with a middle ring (Databases). */
	database: 'M3 5a9 3 0 1 0 18 0a9 3 0 1 0-18 0zM3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0',
	/** Smartphone with a home dot (Mobile). */
	phone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 18h.01',
	/** Two arrows in a circle (DevOps). */
	cycle: 'M20 12a8 8 0 0 1-13.66 5.66M4 12a8 8 0 0 1 13.66-5.66M18 3v4h-4M6 21v-4h4',
	/** Briefcase (company of a professional project). */
	briefcase:
		'M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18',
	/** Medal on a ribbon (hackathon podium). */
	medal: 'M6 9a6 6 0 1 0 12 0a6 6 0 1 0-12 0zM8.5 14 7 22l5-3 5 3-1.5-8',
	/** Trophy cup (hackathon win). */
	trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3',
	/** Chevrons of the phone disclosures (closed, open). */
	chevronDown: 'M6 9l6 6 6-6',
	chevronUp: 'M6 15l6-6 6 6',
	/** Arrow pointing down ("See projects"). */
	arrowDown: 'M12 5v14M5 12l7 7 7-7',
	/** Page with a folded corner and two lines (CV). */
	document: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6',
	/** Envelope (e-mail). */
	mail: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3.5 6.5l8.5 6.5 8.5-6.5',
	/** Two overlapping sheets (copy). */
	copy: 'M11 9h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM5 15V3h12'
} as const;

/** Whether `path` looks like SVG path data: starts with a move, only path commands and numbers. */
export function isIconPath(path: string): boolean {
	return /^[Mm][MmLlHhVvCcSsQqTtAaZz0-9.,\s-]*$/.test(path);
}
