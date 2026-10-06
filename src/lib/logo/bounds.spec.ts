import { describe, expect, it } from 'vitest';
import { findContentBounds, scaleBounds, type Pixels } from './bounds.ts';

type Rgba = [number, number, number, number];

const CLEAR: Rgba = [0, 0, 0, 0];
const WHITE: Rgba = [255, 255, 255, 255];
const RED: Rgba = [255, 0, 0, 255];

/** Builds a `width`×`height` image filled with `fill`, painting `paint` over the given rect. */
function image(
	width: number,
	height: number,
	fill: Rgba,
	paint?: { x: number; y: number; width: number; height: number; color: Rgba }
): Pixels {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const inside =
				paint &&
				x >= paint.x &&
				x < paint.x + paint.width &&
				y >= paint.y &&
				y < paint.y + paint.height;
			data.set(inside ? paint.color : fill, (y * width + x) * 4);
		}
	}
	return { width, height, data };
}

describe('findContentBounds', () => {
	it('finds a logo on a transparent background', () => {
		const pixels = image(10, 8, CLEAR, { x: 2, y: 3, width: 4, height: 2, color: RED });

		expect(findContentBounds(pixels)).toEqual({ x: 2, y: 3, width: 4, height: 2 });
	});

	it('finds a logo on a uniform opaque background', () => {
		const pixels = image(10, 10, WHITE, { x: 1, y: 0, width: 3, height: 9, color: RED });

		expect(findContentBounds(pixels)).toEqual({ x: 1, y: 0, width: 3, height: 9 });
	});

	it('ignores near-invisible noise in transparent margins', () => {
		const pixels = image(6, 6, [0, 0, 0, 3], { x: 2, y: 2, width: 2, height: 2, color: RED });

		expect(findContentBounds(pixels)).toEqual({ x: 2, y: 2, width: 2, height: 2 });
	});

	it('ignores compression noise in an opaque background', () => {
		const pixels = image(6, 6, [250, 252, 255, 255], {
			x: 1,
			y: 1,
			width: 3,
			height: 3,
			color: RED
		});
		pixels.data.set([255, 255, 249, 255], 0);

		expect(findContentBounds(pixels)).toEqual({ x: 1, y: 1, width: 3, height: 3 });
	});

	it('returns the full image when there is no margin to trim', () => {
		const pixels = image(4, 4, RED, { x: 0, y: 0, width: 1, height: 1, color: WHITE });

		expect(findContentBounds(pixels)).toEqual({ x: 0, y: 0, width: 4, height: 4 });
	});

	it('returns null for an image that is entirely background', () => {
		expect(findContentBounds(image(5, 5, CLEAR))).toBeNull();
		expect(findContentBounds(image(5, 5, WHITE))).toBeNull();
	});

	it('returns null for an empty image', () => {
		expect(findContentBounds({ width: 0, height: 0, data: new Uint8ClampedArray() })).toBeNull();
	});
});

describe('findContentBounds tolerance', () => {
	it('treats alpha up to 16 as empty and 17 as content on a transparent background', () => {
		const faint = image(3, 3, CLEAR, { x: 1, y: 1, width: 1, height: 1, color: [0, 0, 0, 16] });
		const visible = image(3, 3, CLEAR, { x: 1, y: 1, width: 1, height: 1, color: [0, 0, 0, 17] });

		expect(findContentBounds(faint)).toBeNull();
		expect(findContentBounds(visible)).toEqual({ x: 1, y: 1, width: 1, height: 1 });
	});

	it('treats a color difference up to 16 as background and 17 as content', () => {
		const close = image(3, 3, WHITE, {
			x: 1,
			y: 1,
			width: 1,
			height: 1,
			color: [239, 255, 255, 255]
		});
		const distinct = image(3, 3, WHITE, {
			x: 1,
			y: 1,
			width: 1,
			height: 1,
			color: [238, 255, 255, 255]
		});

		expect(findContentBounds(close)).toBeNull();
		expect(findContentBounds(distinct)).toEqual({ x: 1, y: 1, width: 1, height: 1 });
	});

	it('does not trim when only the top-left corner is transparent', () => {
		const pixels = image(4, 4, WHITE, { x: 0, y: 0, width: 1, height: 1, color: CLEAR });

		expect(findContentBounds(pixels)).toEqual({ x: 0, y: 0, width: 4, height: 4 });
	});
});

describe('scaleBounds', () => {
	it('returns bounds unchanged when the scan was not downsampled', () => {
		const bounds = { x: 3, y: 4, width: 5, height: 6 };

		expect(scaleBounds(bounds, { width: 20, height: 20 }, { width: 20, height: 20 })).toEqual(
			bounds
		);
	});

	it('maps each axis with its own factor and never cuts into the logo', () => {
		// The scan of a 3000×101 image is 1024×34: the axes are scaled by different factors.
		const full = { width: 3000, height: 101 };
		const scan = { width: 1024, height: 34 };

		for (let top = 0; top < full.height; top++) {
			for (let bottom = top; bottom < full.height; bottom++) {
				// The scan rows a downsampled copy of content rows top..bottom can touch.
				const scanTop = Math.floor((top * scan.height) / full.height);
				const scanBottom = Math.ceil(((bottom + 1) * scan.height) / full.height) - 1;
				const mapped = scaleBounds(
					{ x: 0, y: scanTop, width: scan.width, height: scanBottom - scanTop + 1 },
					scan,
					full
				);

				expect(mapped.y).toBeLessThanOrEqual(top);
				expect(mapped.y + mapped.height).toBeGreaterThanOrEqual(bottom + 1);
			}
		}
	});

	it('adds only a few pixels of slack and stays within the image', () => {
		const mapped = scaleBounds(
			{ x: 0, y: 10, width: 512, height: 12 },
			{ width: 512, height: 32 },
			{ width: 2048, height: 128 }
		);

		expect(mapped).toEqual({ x: 0, y: 36, width: 2048, height: 56 });
	});
});
