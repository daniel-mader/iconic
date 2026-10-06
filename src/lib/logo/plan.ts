import { clampPadding, clampSize, type LogoOptions } from './options.ts';

export interface Size {
	width: number;
	height: number;
}

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Where a logo's content is copied from and drawn to, and how big the output is. */
export interface LogoPlan {
	width: number;
	height: number;
	/** Region of the source image to draw (the full image, or its trimmed bounds). */
	source: Rect;
	/** Region of the output to draw the source region into. */
	target: Rect;
}

/**
 * Lays out a logo: scales `content` so its longest edge fills the target size minus padding,
 * then either wraps it in padding or centers it on a square canvas.
 */
export function planLogo(content: Rect, options: LogoOptions): LogoPlan {
	const size = clampSize(options.size);
	const padding = clampPadding(options.padding, size);
	const inner = size - 2 * padding;

	const scale = inner / Math.max(content.width, content.height);
	const width = Math.max(1, Math.round(content.width * scale));
	const height = Math.max(1, Math.round(content.height * scale));

	if (options.square) {
		return {
			width: size,
			height: size,
			source: content,
			target: {
				x: padding + Math.floor((inner - width) / 2),
				y: padding + Math.floor((inner - height) / 2),
				width,
				height
			}
		};
	}

	return {
		width: width + 2 * padding,
		height: height + 2 * padding,
		source: content,
		target: { x: padding, y: padding, width, height }
	};
}
