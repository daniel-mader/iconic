export type Background = 'none' | 'white' | 'black';

export interface LogoOptions {
	/** Longest edge of the output image in px (both edges when `square`). */
	size: number;
	/** Empty space between the logo and the output's edges in px. */
	padding: number;
	background: Background;
	/** Output a square image, fitting the whole logo inside it. */
	square: boolean;
	/** Crop empty margins around the source before applying the other options. */
	trim: boolean;
}

export const MIN_SIZE = 16;
export const MAX_SIZE = 4096;

export const SIZE_PRESETS = {
	small: 256,
	medium: 512,
	large: 1024
} as const;

export type SizePreset = keyof typeof SIZE_PRESETS;

export const DEFAULT_OPTIONS: LogoOptions = {
	size: SIZE_PRESETS.medium,
	padding: 0,
	background: 'none',
	square: false,
	trim: true
};

/** Rounds and clamps any number to a supported output size. */
export function clampSize(size: number): number {
	if (!Number.isFinite(size)) return DEFAULT_OPTIONS.size;
	return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(size)));
}

/** The largest padding that still leaves at least one pixel for the logo. */
export function maxPadding(size: number): number {
	return Math.floor((clampSize(size) - 1) / 2);
}

/** Rounds and clamps padding to what fits into the given output size. */
export function clampPadding(padding: number, size: number): number {
	if (!Number.isFinite(padding)) return 0;
	return Math.min(maxPadding(size), Math.max(0, Math.round(padding)));
}

/** Changes the size, shrinking the padding if it no longer fits. */
export function withSize(options: LogoOptions, size: number): LogoOptions {
	const clamped = clampSize(size);
	return { ...options, size: clamped, padding: clampPadding(options.padding, clamped) };
}
