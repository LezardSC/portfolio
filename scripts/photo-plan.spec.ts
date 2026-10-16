import { describe, expect, it } from 'vitest';
import { cropBox, planPhoto, PHOTO_WIDTHS } from './photo-plan';

describe('cropBox', () => {
	it('crops a square to 4:5 portrait, centred', () => {
		expect(cropBox(480, 480)).toEqual({ left: 48, top: 0, width: 384, height: 480 });
	});
	it('crops a wide image to the centre columns', () => {
		expect(cropBox(2000, 1000)).toEqual({ left: 600, top: 0, width: 800, height: 1000 });
	});
	it('crops a tall image to the centre rows', () => {
		expect(cropBox(800, 2000)).toEqual({ left: 0, top: 500, width: 800, height: 1000 });
	});
});

describe('planPhoto', () => {
	it('lists every size and format for a big source', () => {
		const plan = planPhoto(3000, 4000);
		expect(plan.skipped).toEqual([]);
		expect(plan.outputs).toHaveLength(PHOTO_WIDTHS.length * 3);
		expect(plan.outputs).toContainEqual({
			file: 'photo-720.avif',
			width: 720,
			height: 900,
			format: 'avif'
		});
		expect(plan.outputs).toContainEqual({
			file: 'photo-720.jpg',
			width: 720,
			height: 900,
			format: 'jpeg'
		});
	});
	it('never upscales: sizes wider than the crop are skipped', () => {
		const plan = planPhoto(480, 480);
		expect(plan.outputs.every((o) => o.width <= 384)).toBe(true);
		expect(plan.skipped).toContain(720);
		expect(plan.reachesRetina).toBe(false);
	});
	it('reports whether 720px (3x) is reached', () => {
		expect(planPhoto(900, 900).reachesRetina).toBe(true);
		expect(planPhoto(900, 900).skipped).toEqual([]);
	});
});
