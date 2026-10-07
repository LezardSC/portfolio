import { describe, expect, it } from 'vitest';
import { icoFromPng } from './ico.ts';

describe('icoFromPng', () => {
	const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
	const ico = icoFromPng(png, 32);

	it('writes a one-image ICO header', () => {
		expect(ico.readUInt16LE(0)).toBe(0); // reserved
		expect(ico.readUInt16LE(2)).toBe(1); // type: icon
		expect(ico.readUInt16LE(4)).toBe(1); // one image
	});
	it('describes the image and points at the PNG bytes', () => {
		expect(ico.readUInt8(6)).toBe(32);
		expect(ico.readUInt8(7)).toBe(32);
		expect(ico.readUInt32LE(14)).toBe(png.length);
		expect(ico.readUInt32LE(18)).toBe(22);
		expect(ico.subarray(22)).toEqual(png);
	});
});
