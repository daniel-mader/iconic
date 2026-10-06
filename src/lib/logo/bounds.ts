import type { Rect, Size } from './plan.ts';

/** RGBA pixel data in the layout of `ImageData`. */
export interface Pixels {
	width: number;
	height: number;
	data: Uint8ClampedArray;
}

/** Pixels at most this transparent count as empty on a transparent background. */
const ALPHA_TOLERANCE = 16;
/** Channel differences up to this count as background (absorbs JPEG/antialiasing noise). */
const COLOR_TOLERANCE = 16;

/**
 * Finds the bounding box of the logo inside `pixels` by stripping margins that match the
 * background. The background is the color shared by all four corners; if the corners disagree,
 * there is no margin to trim and the full image is returned. Returns `null` when the image is
 * empty or consists only of background.
 */
export function findContentBounds({ width, height, data }: Pixels): Rect | null {
	if (width === 0 || height === 0) return null;

	const offset = (x: number, y: number) => (y * width + x) * 4;
	const background = offset(0, 0);
	const corners = [offset(width - 1, 0), offset(0, height - 1), offset(width - 1, height - 1)];

	const isBackground =
		data[background + 3] <= ALPHA_TOLERANCE
			? (i: number) => data[i + 3] <= ALPHA_TOLERANCE
			: (i: number) =>
					Math.abs(data[i] - data[background]) <= COLOR_TOLERANCE &&
					Math.abs(data[i + 1] - data[background + 1]) <= COLOR_TOLERANCE &&
					Math.abs(data[i + 2] - data[background + 2]) <= COLOR_TOLERANCE &&
					Math.abs(data[i + 3] - data[background + 3]) <= COLOR_TOLERANCE;

	if (!corners.every(isBackground)) return { x: 0, y: 0, width, height };

	let minX = width;
	let minY = height;
	let maxX = -1;
	let maxY = -1;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (isBackground(offset(x, y))) continue;
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
	}

	if (maxX < 0) return null;
	return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * Maps bounds found on a downsampled copy (`scan`) back to the full-size image. Each axis uses
 * its own factor, since rounding the scan size changes the aspect ratio slightly, and the box
 * grows by one scan pixel per side because downsampling blends edge pixels into neighbors.
 */
export function scaleBounds(bounds: Rect, scan: Size, full: Size): Rect {
	if (scan.width === full.width && scan.height === full.height) return bounds;

	const fx = full.width / scan.width;
	const fy = full.height / scan.height;
	const x = Math.max(0, Math.floor((bounds.x - 1) * fx));
	const y = Math.max(0, Math.floor((bounds.y - 1) * fy));
	const right = Math.min(full.width, Math.ceil((bounds.x + bounds.width + 1) * fx));
	const bottom = Math.min(full.height, Math.ceil((bounds.y + bounds.height + 1) * fy));
	return { x, y, width: right - x, height: bottom - y };
}
