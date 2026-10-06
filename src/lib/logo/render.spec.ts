import { describe, expect, it } from 'vitest';
import { drawLogo, type LogoContext } from './render.ts';
import type { LogoPlan } from './plan.ts';

/** Records drawing operations, capturing the state they were issued with. */
function recordingContext() {
	const calls: unknown[][] = [];
	const ctx: LogoContext = {
		fillStyle: '',
		imageSmoothingEnabled: false,
		imageSmoothingQuality: 'low',
		clearRect: (...args) => {
			calls.push(['clearRect', ...args]);
		},
		fillRect: (...args) => {
			calls.push(['fillRect', ctx.fillStyle, ...args]);
		},
		drawImage: (...args: unknown[]) => {
			calls.push(['drawImage', ctx.imageSmoothingEnabled, ctx.imageSmoothingQuality, ...args]);
		}
	};
	return { ctx, calls };
}

const image = { id: 'source image' } as unknown as CanvasImageSource;

const plan: LogoPlan = {
	width: 100,
	height: 60,
	source: { x: 5, y: 6, width: 40, height: 20 },
	target: { x: 10, y: 10, width: 80, height: 40 }
};

describe('drawLogo', () => {
	it('keeps a transparent background when no background is set', () => {
		const { ctx, calls } = recordingContext();

		drawLogo(ctx, image, plan, 'none');

		expect(calls).toEqual([
			['clearRect', 0, 0, 100, 60],
			['drawImage', true, 'high', image, 5, 6, 40, 20, 10, 10, 80, 40]
		]);
	});

	it.each([
		['white', '#ffffff'],
		['black', '#000000']
	] as const)('fills a %s background behind the logo', (background, color) => {
		const { ctx, calls } = recordingContext();

		drawLogo(ctx, image, plan, background);

		expect(calls).toEqual([
			['clearRect', 0, 0, 100, 60],
			['fillRect', color, 0, 0, 100, 60],
			['drawImage', true, 'high', image, 5, 6, 40, 20, 10, 10, 80, 40]
		]);
	});
});
