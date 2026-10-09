import type { SkillIcon } from '$lib/skills';

/** Hard hat with an Ethereum diamond cut out (Hardhat). Dome and brim clockwise, diamond counter-clockwise. */
export const HARDHAT: SkillIcon = {
	path: 'M4 16a8 8 0 0 1 16 0zM2 16h20v3H2zM12 9.5l-2.2 3 2.2 2.5 2.2-2.5z',
	hex: 'FFF100'
};

/** CPU chip with a hollow ring, a solid core and 3 pins per side (x86-64 Assembly). */
export const CPU: SkillIcon = {
	path:
		'M6 6h12v12H6zM9 9v6h6V9zM10.5 10.5h3v3h-3z' +
		'M8.25 2h1.5v4h-1.5zM11.25 2h1.5v4h-1.5zM14.25 2h1.5v4h-1.5z' +
		'M8.25 18h1.5v4h-1.5zM11.25 18h1.5v4h-1.5zM14.25 18h1.5v4h-1.5z' +
		'M2 8.25h4v1.5H2zM2 11.25h4v1.5H2zM2 14.25h4v1.5H2z' +
		'M18 8.25h4v1.5h-4zM18 11.25h4v1.5h-4zM18 14.25h4v1.5h-4z',
	hex: '0071C5'
};

/** Hexagon with C# cut out (C#): hexagon clockwise; the C ring and the 8 non-overlapping bars of
 *  the # counter-clockwise (overlapping holes would fill back in). */
export const CSHARP: SkillIcon = {
	path:
		'M12 1.5l9.1 5.25v10.5L12 22.5l-9.1-5.25V6.75z' +
		'M11.68 8.82A4.5 4.5 0 1 0 11.68 15.18L10.27 13.77A2.5 2.5 0 1 1 10.27 10.23z' +
		'M15.25 9.5v5h1v-5zM17.75 9.5v5h1v-5z' +
		'M14 10.75v1h1.25v-1zM16.25 10.75v1h1.5v-1zM18.75 10.75v1h1.25v-1z' +
		'M14 12.25v1h1.25v-1zM16.25 12.25v1h1.5v-1zM18.75 12.25v1h1.25v-1z',
	hex: '9B4F96'
};

/** Contract page with </> cut out (SmartPy). Page clockwise, brackets counter-clockwise. */
export const SMART_CONTRACT: SkillIcon = {
	path: 'M5 2h10l4 4v16H5z' + 'M10.5 10l-3 3 3 3 1-1-2-2 2-2z' + 'M12.5 11l2 2-2 2 1 1 3-3-3-3z',
	hex: '2C7DF7'
};

/** Database cylinder: a top cap and two bands (SQL). */
export const DATABASE: SkillIcon = {
	path:
		'M4 5a8 3 0 1 0 16 0a8 3 0 1 0-16 0z' +
		'M4 6.5V11c0 1.66 3.58 3 8 3s8-1.34 8-3V6.5c0 1.66-3.58 3-8 3s-8-1.34-8-3z' +
		'M4 12.5V17c0 1.66 3.58 3 8 3s8-1.34 8-3v-4.5c0 1.66-3.58 3-8 3s-8-1.34-8-3z',
	hex: '336791'
};

/** Filled circle, counter-clockwise (same winding as `link`, so overlaps merge instead of cutting holes). */
const node = (x: number, y: number, r: number) =>
	`M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;

/** Straight bar of width `w` from (x1, y1) to (x2, y2), counter-clockwise. */
const link = (x1: number, y1: number, x2: number, y2: number, w: number) => {
	const len = Math.hypot(x2 - x1, y2 - y1);
	const [nx, ny] = [(-(y2 - y1) / len) * (w / 2), ((x2 - x1) / len) * (w / 2)];
	const pt = (x: number, y: number) => `${+x.toFixed(2)} ${+y.toFixed(2)}`;
	return `M${pt(x1 + nx, y1 + ny)}L${pt(x2 + nx, y2 + ny)}L${pt(x2 - nx, y2 - ny)}L${pt(x1 - nx, y1 - ny)}z`;
};

const NET_LAYERS = [
	[
		[3.5, 7],
		[3.5, 17]
	],
	[
		[12, 4],
		[12, 12],
		[12, 20]
	],
	[[20.5, 12]]
] as const;

/** Small neural network: 2 → 3 → 1 nodes, fully connected (Deep Learning). */
export const NEURAL_NET: SkillIcon = {
	path:
		NET_LAYERS.slice(1)
			.flatMap((layer, i) =>
				layer.flatMap(([x2, y2]) => NET_LAYERS[i].map(([x1, y1]) => link(x1, y1, x2, y2, 1.3)))
			)
			.join('') +
		NET_LAYERS.flat()
			.map(([x, y]) => node(x, y, 2.4))
			.join(''),
	hex: 'FF6F00'
};

/** Chat bubble with three dots cut out (Prompt engineering). */
export const CHAT: SkillIcon = {
	path:
		'M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z' +
		'M6.75 10a1.25 1.25 0 1 0 2.5 0a1.25 1.25 0 1 0-2.5 0z' +
		'M10.75 10a1.25 1.25 0 1 0 2.5 0a1.25 1.25 0 1 0-2.5 0z' +
		'M14.75 10a1.25 1.25 0 1 0 2.5 0a1.25 1.25 0 1 0-2.5 0z',
	hex: 'D97757'
};
