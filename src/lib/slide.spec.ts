import { describe, expect, it } from 'vitest';
import { slideKeyframes } from './slide';

const full = { height: 200, paddingTop: 20, paddingBottom: 10 };

describe('slideKeyframes', () => {
	it('opens from nothing to the full box', () => {
		expect(slideKeyframes(full, 0, true)).toEqual([
			{ height: '0px', paddingTop: '0px', paddingBottom: '0px' },
			{ height: '200px', paddingTop: '20px', paddingBottom: '10px' }
		]);
	});
	it('closes from the full box to nothing, padding included (border-box)', () => {
		expect(slideKeyframes(full, 200, false)).toEqual([
			{ height: '200px', paddingTop: '20px', paddingBottom: '10px' },
			{ height: '0px', paddingTop: '0px', paddingBottom: '0px' }
		]);
	});
	it('starts from where an interrupted slide stopped, padding in proportion', () => {
		expect(slideKeyframes(full, 100, true)[0]).toEqual({
			height: '100px',
			paddingTop: '10px',
			paddingBottom: '5px'
		});
		expect(slideKeyframes(full, 50, false)[0]).toEqual({
			height: '50px',
			paddingTop: '5px',
			paddingBottom: '2.5px'
		});
	});
	it('never goes past the full box, and survives an empty one', () => {
		expect(slideKeyframes(full, 300, true)[0].height).toBe('200px');
		expect(slideKeyframes({ height: 0, paddingTop: 0, paddingBottom: 0 }, 0, true)).toEqual([
			{ height: '0px', paddingTop: '0px', paddingBottom: '0px' },
			{ height: '0px', paddingTop: '0px', paddingBottom: '0px' }
		]);
	});
});
