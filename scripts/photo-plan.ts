/** Pure planning for `npm run photo`: which files to write from a source photo, never upscaling. */

/** Output widths (4:5 portrait): 240 = 1x, 480 = 2x, 720 = 3x of the 240×300 slot. */
export const PHOTO_WIDTHS = [240, 480, 720] as const;
export const PHOTO_RATIO = { w: 4, h: 5 } as const;
export const PHOTO_FORMATS = [
	{ format: 'avif', ext: 'avif' },
	{ format: 'webp', ext: 'webp' },
	{ format: 'jpeg', ext: 'jpg' }
] as const;

export type PhotoOutput = {
	file: string;
	width: number;
	height: number;
	format: (typeof PHOTO_FORMATS)[number]['format'];
};

/** The largest centred 4:5 rectangle of the source. */
export function cropBox(srcW: number, srcH: number) {
	let width = srcW;
	let height = Math.round((srcW * PHOTO_RATIO.h) / PHOTO_RATIO.w);
	if (height > srcH) {
		height = srcH;
		width = Math.round((srcH * PHOTO_RATIO.w) / PHOTO_RATIO.h);
	}
	return {
		left: Math.floor((srcW - width) / 2),
		top: Math.floor((srcH - height) / 2),
		width,
		height
	};
}

export function planPhoto(srcW: number, srcH: number) {
	const crop = cropBox(srcW, srcH);
	const outputs: PhotoOutput[] = [];
	const skipped: number[] = [];
	for (const width of PHOTO_WIDTHS) {
		if (width > crop.width) {
			skipped.push(width);
			continue;
		}
		const height = Math.round((width * PHOTO_RATIO.h) / PHOTO_RATIO.w);
		for (const { format, ext } of PHOTO_FORMATS) {
			outputs.push({ file: `photo-${width}.${ext}`, width, height, format });
		}
	}
	return { crop, outputs, skipped, reachesRetina: skipped.length === 0 };
}
