import { findContentBounds, scaleBounds } from '#lib/logo/bounds.ts';
import { MAX_SIZE } from '#lib/logo/options.ts';
import type { Rect } from '#lib/logo/plan.ts';
import { fail, ok, type Result } from '#lib/result.ts';
import { validateImageDimensions } from '#lib/source/image-source.ts';
import { svgRenderSize } from '#lib/source/svg.ts';

/** A decoded source image, ready to be drawn. */
export interface SourceImage {
	element: HTMLImageElement;
	width: number;
	height: number;
	name: string;
	/** SVGs are rasterized at the maximum output size, so their pixel size is not meaningful. */
	vector: boolean;
	/** The logo's bounding box without empty margins, or `null` if the image is blank. */
	contentBounds: Rect | null;
	/** Releases the object URL backing `element`. */
	dispose(): void;
}

/** Longest edge to downsample to when scanning for content bounds. */
const BOUNDS_SCAN_SIZE = 1024;

/**
 * Decodes an image blob in the browser. The blob is untrusted: SVGs are only ever rendered
 * through an `<img>`, which never runs their scripts or loads external resources.
 */
export async function decodeImage(blob: Blob, name: string): Promise<Result<SourceImage>> {
	const vector = blob.type === 'image/svg+xml';
	const prepared = vector ? await sizeSvg(blob) : ok(blob);
	if (!prepared.ok) return prepared;

	const url = URL.createObjectURL(prepared.value);
	const element = new Image();
	const loaded = new Promise<boolean>((resolve) => {
		element.onload = () => resolve(true);
		element.onerror = () => resolve(false);
	});
	element.src = url;

	const unreadable = fail<SourceImage>('That file could not be read as an image.');
	if (!(await loaded)) {
		URL.revokeObjectURL(url);
		return unreadable;
	}

	// Check the declared size before forcing a full decode, which could exhaust memory.
	const { naturalWidth: width, naturalHeight: height } = element;
	const dimensions = validateImageDimensions(width, height);
	if (!dimensions.ok) {
		URL.revokeObjectURL(url);
		return dimensions;
	}

	try {
		await element.decode();
	} catch {
		URL.revokeObjectURL(url);
		return unreadable;
	}

	return ok({
		element,
		width,
		height,
		name,
		vector,
		contentBounds: scanContentBounds(element, width, height),
		dispose: () => URL.revokeObjectURL(url)
	});
}

/** Gives an SVG explicit dimensions at the maximum output size so it rasterizes crisply. */
async function sizeSvg(blob: Blob): Promise<Result<Blob>> {
	const doc = new DOMParser().parseFromString(await blob.text(), 'image/svg+xml');
	const root = doc.documentElement;
	if (root.localName !== 'svg' || doc.querySelector('parsererror')) {
		return fail('That SVG file is invalid.');
	}

	const size = svgRenderSize(
		{
			width: root.getAttribute('width'),
			height: root.getAttribute('height'),
			viewBox: root.getAttribute('viewBox')
		},
		MAX_SIZE
	);
	root.setAttribute('width', String(size.width));
	root.setAttribute('height', String(size.height));
	if (size.viewBox) root.setAttribute('viewBox', size.viewBox);

	return ok(new Blob([new XMLSerializer().serializeToString(doc)], { type: 'image/svg+xml' }));
}

/** Finds content bounds on a downsampled copy, then maps them back to full resolution. */
function scanContentBounds(image: HTMLImageElement, width: number, height: number): Rect | null {
	const scale = Math.min(1, BOUNDS_SCAN_SIZE / Math.max(width, height));
	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, Math.round(width * scale));
	canvas.height = Math.max(1, Math.round(height * scale));

	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return { x: 0, y: 0, width, height };
	// High-quality (area-averaging) downsampling keeps thin edges visible in the scan.
	ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

	let bounds: Rect | null;
	try {
		bounds = findContentBounds(ctx.getImageData(0, 0, canvas.width, canvas.height));
	} catch {
		return { x: 0, y: 0, width, height };
	}
	return bounds && scaleBounds(bounds, canvas, { width, height });
}
