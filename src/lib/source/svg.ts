export interface SvgSizeAttributes {
	width: string | null;
	height: string | null;
	viewBox: string | null;
}

export interface SvgRenderSize {
	width: number;
	height: number;
	/** The viewBox to set so the drawing scales with the size, or `null` to leave it unset. */
	viewBox: string | null;
}

/** Parses a length in user units or px; relative units (%, em, …) cannot be resolved here. */
function parseLength(value: string | null): number | null {
	const match = value?.trim().match(/^(\d*\.?\d+)(px)?$/);
	const length = match ? Number(match[1]) : NaN;
	return length > 0 ? length : null;
}

function parseViewBox(value: string | null): number[] | null {
	const parts = value
		?.trim()
		.split(/[\s,]+/)
		.map(Number);
	if (parts?.length !== 4 || !parts.every(Number.isFinite)) return null;
	return parts[2] > 0 && parts[3] > 0 ? parts : null;
}

/**
 * SVGs without explicit dimensions have no reliable intrinsic size in browsers. Computes
 * explicit dimensions whose long edge is `longEdge`, keeping the drawing's aspect ratio, so
 * the SVG can be rasterized crisply at any output size.
 */
export function svgRenderSize(attributes: SvgSizeAttributes, longEdge: number): SvgRenderSize {
	const viewBox = parseViewBox(attributes.viewBox);
	const width = parseLength(attributes.width);
	const height = parseLength(attributes.height);

	const [aspectWidth, aspectHeight, box] = viewBox
		? [viewBox[2], viewBox[3], viewBox.join(' ')]
		: width && height
			? [width, height, `0 0 ${width} ${height}`]
			: [1, 1, null];

	const scale = longEdge / Math.max(aspectWidth, aspectHeight);
	return {
		width: Math.max(1, Math.round(aspectWidth * scale)),
		height: Math.max(1, Math.round(aspectHeight * scale)),
		viewBox: box
	};
}
