import { EXPORT_FORMATS, type ExportFormat } from '#lib/export/export.ts';
import type { Background } from '#lib/logo/options.ts';
import type { LogoPlan } from '#lib/logo/plan.ts';
import { drawLogo } from '#lib/logo/render.ts';

/** Resizes `canvas` to the plan and draws the logo onto it. */
export function renderLogo(
	canvas: HTMLCanvasElement,
	image: CanvasImageSource,
	plan: LogoPlan,
	background: Background
): void {
	canvas.width = plan.width;
	canvas.height = plan.height;
	const ctx = canvas.getContext('2d');
	if (ctx) drawLogo(ctx, image, plan, background);
}

/** Renders the logo off-screen and encodes it in the given format. */
export function encodeLogo(
	image: CanvasImageSource,
	plan: LogoPlan,
	background: Background,
	format: ExportFormat
): Promise<Blob> {
	const canvas = document.createElement('canvas');
	renderLogo(canvas, image, plan, background);
	const { mimeType, quality } = EXPORT_FORMATS[format];

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error(`Could not encode ${mimeType}.`))),
			mimeType,
			quality
		);
	});
}

/** Some browsers cancel a download whose object URL is revoked too early. */
const REVOKE_DELAY_MS = 60_000;

/** Saves a blob through the browser's download mechanism. */
export function downloadBlob(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}
