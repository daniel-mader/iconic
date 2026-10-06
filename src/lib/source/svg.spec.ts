import { describe, expect, it } from 'vitest';
import { svgRenderSize } from './svg.ts';

const attrs = (width: string | null, height: string | null, viewBox: string | null) => ({
	width,
	height,
	viewBox
});

describe('svgRenderSize', () => {
	it('sizes an SVG with only a viewBox to the long edge, keeping its aspect ratio', () => {
		expect(svgRenderSize(attrs(null, null, '0 0 24 12'), 1000)).toEqual({
			width: 1000,
			height: 500,
			viewBox: '0 0 24 12'
		});
	});

	it('accepts commas and extra whitespace in the viewBox', () => {
		expect(svgRenderSize(attrs(null, null, ' -5,0  10 , 20 '), 1000)).toEqual({
			width: 500,
			height: 1000,
			viewBox: '-5 0 10 20'
		});
	});

	it('derives a viewBox from width and height so the drawing scales', () => {
		expect(svgRenderSize(attrs('100px', '50', null), 1000)).toEqual({
			width: 1000,
			height: 500,
			viewBox: '0 0 100 50'
		});
	});

	it('prefers the viewBox aspect ratio over width and height', () => {
		expect(svgRenderSize(attrs('100', '100', '0 0 20 10'), 1000)).toMatchObject({
			width: 1000,
			height: 500
		});
	});

	it('falls back to a square without a usable size', () => {
		expect(svgRenderSize(attrs('100%', '2em', '0 0 0 10'), 1000)).toEqual({
			width: 1000,
			height: 1000,
			viewBox: null
		});
	});

	it('keeps both edges at least one pixel for extreme aspect ratios', () => {
		expect(svgRenderSize(attrs(null, null, '0 0 10000 1'), 4096)).toEqual({
			width: 4096,
			height: 1,
			viewBox: '0 0 10000 1'
		});
	});
});
