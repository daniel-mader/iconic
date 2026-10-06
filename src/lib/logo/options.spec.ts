import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS, withSize } from './options.ts';

describe('withSize', () => {
	it('shrinks padding that no longer fits the new size', () => {
		const options = withSize({ ...DEFAULT_OPTIONS, size: 512, padding: 200 }, 256);

		expect(options).toMatchObject({ size: 256, padding: 127 });
	});

	it('keeps padding that still fits', () => {
		expect(withSize({ ...DEFAULT_OPTIONS, size: 512, padding: 50 }, 1024)).toMatchObject({
			size: 1024,
			padding: 50
		});
	});

	it('clamps the size to the supported range', () => {
		expect(withSize(DEFAULT_OPTIONS, 1).size).toBe(16);
		expect(withSize(DEFAULT_OPTIONS, 9000).size).toBe(4096);
	});

	it('leaves the other options untouched', () => {
		const options = { ...DEFAULT_OPTIONS, background: 'black' as const, square: true };

		expect(withSize(options, 256)).toMatchObject({ background: 'black', square: true, trim: true });
	});
});
