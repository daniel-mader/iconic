import type { Background } from '#lib/logo/options.ts';

export const EXPORT_FORMATS = {
	png: { label: 'PNG', mimeType: 'image/png', extension: 'png', quality: undefined },
	jpeg: { label: 'JPEG', mimeType: 'image/jpeg', extension: 'jpg', quality: 0.92 }
} as const;

export type ExportFormat = keyof typeof EXPORT_FORMATS;

/** JPEG has no alpha channel, so a transparent background becomes white instead of black. */
export function resolveBackground(background: Background, format: ExportFormat): Background {
	return format === 'jpeg' && background === 'none' ? 'white' : background;
}

const MAX_SLUG_LENGTH = 64;

/** A safe file name such as `home-assistant-512x512.png`. */
export function downloadFileName(
	sourceName: string,
	{ width, height }: { width: number; height: number },
	format: ExportFormat
): string {
	const slug =
		sourceName
			.toLowerCase()
			.replace(/[^a-z\d]+/g, '-')
			.replace(/^-+/, '')
			.slice(0, MAX_SLUG_LENGTH)
			.replace(/-+$/, '') || 'logo';
	return `${slug}-${width}x${height}.${EXPORT_FORMATS[format].extension}`;
}

const UNITS = ['KB', 'MB', 'GB'] as const;

/** Formats a byte count for display, e.g. `21.4 KB`. */
export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;

	let value = bytes / 1024;
	let unit = 0;
	while (value >= 1024 && unit < UNITS.length - 1) {
		value /= 1024;
		unit++;
	}
	return `${value.toFixed(1)} ${UNITS[unit]}`;
}
