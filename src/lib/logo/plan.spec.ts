import { describe, expect, it } from 'vitest';
import { planLogo } from './plan.ts';
import { DEFAULT_OPTIONS, type LogoOptions } from './options.ts';

const options = (overrides: Partial<LogoOptions>): LogoOptions => ({
	...DEFAULT_OPTIONS,
	...overrides
});

const landscape = { x: 0, y: 0, width: 400, height: 200 };

describe('planLogo', () => {
	it('scales the longest edge of a landscape logo to the target size', () => {
		const plan = planLogo(landscape, options({ size: 100, padding: 0, square: false }));

		expect(plan).toEqual({
			width: 100,
			height: 50,
			source: landscape,
			target: { x: 0, y: 0, width: 100, height: 50 }
		});
	});

	it('scales the longest edge of a portrait logo to the target size', () => {
		const portrait = { x: 0, y: 0, width: 30, height: 60 };
		const plan = planLogo(portrait, options({ size: 120, padding: 0, square: false }));

		expect(plan.width).toBe(60);
		expect(plan.height).toBe(120);
	});

	it('keeps the output within the target size when padding is added', () => {
		const plan = planLogo(landscape, options({ size: 100, padding: 10, square: false }));

		expect(plan.width).toBe(100);
		expect(plan.height).toBe(60);
		expect(plan.target).toEqual({ x: 10, y: 10, width: 80, height: 40 });
	});

	it('centers the whole logo on a square canvas when squared', () => {
		const plan = planLogo(landscape, options({ size: 100, padding: 0, square: true }));

		expect(plan.width).toBe(100);
		expect(plan.height).toBe(100);
		expect(plan.target).toEqual({ x: 0, y: 25, width: 100, height: 50 });
	});

	it('combines square and padding', () => {
		const plan = planLogo(landscape, options({ size: 100, padding: 10, square: true }));

		expect(plan.width).toBe(100);
		expect(plan.height).toBe(100);
		expect(plan.target).toEqual({ x: 10, y: 30, width: 80, height: 40 });
	});

	it('draws only the trimmed content region of the source', () => {
		const trimmed = { x: 50, y: 20, width: 100, height: 100 };
		const plan = planLogo(trimmed, options({ size: 64, padding: 0, square: false }));

		expect(plan.source).toEqual(trimmed);
		expect(plan.target).toEqual({ x: 0, y: 0, width: 64, height: 64 });
	});

	it('never shrinks very thin logos below one pixel', () => {
		const line = { x: 0, y: 0, width: 1000, height: 1 };
		const plan = planLogo(line, options({ size: 100, padding: 0, square: false }));

		expect(plan.target.height).toBe(1);
		expect(plan.height).toBe(1);
	});

	it('limits padding so at least one pixel of logo remains', () => {
		const plan = planLogo(landscape, options({ size: 20, padding: 50, square: true }));

		expect(plan.width).toBe(20);
		expect(plan.target).toEqual({ x: 9, y: 9, width: 2, height: 1 });
	});

	it('limits padding without squaring, too', () => {
		const plan = planLogo(landscape, options({ size: 20, padding: 50, square: false }));

		expect(plan).toMatchObject({
			width: 20,
			height: 19,
			target: { x: 9, y: 9, width: 2, height: 1 }
		});
	});

	it('rounds an odd centering remainder down', () => {
		const plan = planLogo(
			{ x: 0, y: 0, width: 100, height: 49 },
			options({ size: 100, padding: 0, square: true })
		);

		expect(plan.target).toEqual({ x: 0, y: 25, width: 100, height: 49 });
	});

	it('falls back to the default size and no padding for non-numeric input', () => {
		const plan = planLogo(landscape, options({ size: NaN, padding: NaN, square: true }));

		expect(plan.width).toBe(512);
		expect(plan.target.x).toBe(0);
	});

	it('clamps the target size to the supported range', () => {
		expect(planLogo(landscape, options({ size: 100_000, padding: 0 })).width).toBe(4096);
		expect(planLogo(landscape, options({ size: 1, padding: 0, square: true })).width).toBe(16);
	});
});
