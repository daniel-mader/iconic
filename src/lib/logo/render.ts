import type { Background } from './options.ts';
import type { LogoPlan } from './plan.ts';

/** The subset of `CanvasRenderingContext2D` needed to draw a logo. */
export type LogoContext = Pick<
	CanvasRenderingContext2D,
	| 'fillStyle'
	| 'imageSmoothingEnabled'
	| 'imageSmoothingQuality'
	| 'clearRect'
	| 'fillRect'
	| 'drawImage'
>;

const BACKGROUND_COLORS: Record<Exclude<Background, 'none'>, string> = {
	white: '#ffffff',
	black: '#000000'
};

/** Draws a planned logo onto a context whose canvas is already sized to the plan. */
export function drawLogo(
	ctx: LogoContext,
	image: CanvasImageSource,
	plan: LogoPlan,
	background: Background
): void {
	ctx.clearRect(0, 0, plan.width, plan.height);

	if (background !== 'none') {
		ctx.fillStyle = BACKGROUND_COLORS[background];
		ctx.fillRect(0, 0, plan.width, plan.height);
	}

	const { source, target } = plan;
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(
		image,
		source.x,
		source.y,
		source.width,
		source.height,
		target.x,
		target.y,
		target.width,
		target.height
	);
}
