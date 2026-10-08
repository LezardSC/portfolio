const channels = (hex: string) => {
	const h = hex.replace('#', '');
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

/** `a` mixed with `b`, `weight` (0–1) being the share of `a`: CSS `color-mix(in srgb, a w, b)`. */
export function mixHex(a: string, b: string, weight: number): string {
	const [x, y] = [channels(a), channels(b)];
	return (
		'#' +
		x
			.map((v, i) =>
				Math.round(v * weight + y[i] * (1 - weight))
					.toString(16)
					.padStart(2, '0')
			)
			.join('')
	);
}
