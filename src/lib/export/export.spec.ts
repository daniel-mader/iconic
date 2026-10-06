import { describe, expect, it } from 'vitest';
import { EXPORT_FORMATS, downloadFileName, formatBytes, resolveBackground } from './export.ts';

describe('EXPORT_FORMATS', () => {
	it('maps formats to MIME types and file extensions', () => {
		expect(EXPORT_FORMATS.png).toMatchObject({ mimeType: 'image/png', extension: 'png' });
		expect(EXPORT_FORMATS.jpeg).toMatchObject({ mimeType: 'image/jpeg', extension: 'jpg' });
	});
});

describe('resolveBackground', () => {
	it('keeps transparency for PNG', () => {
		expect(resolveBackground('none', 'png')).toBe('none');
	});

	it('falls back to white for JPEG, which cannot be transparent', () => {
		expect(resolveBackground('none', 'jpeg')).toBe('white');
	});

	it('keeps an explicit background for every format', () => {
		expect(resolveBackground('black', 'jpeg')).toBe('black');
		expect(resolveBackground('white', 'png')).toBe('white');
	});
});

describe('downloadFileName', () => {
	it('combines a slug of the source name with the output dimensions', () => {
		expect(downloadFileName('Home Assistant', { width: 512, height: 512 }, 'png')).toBe(
			'home-assistant-512x512.png'
		);
	});

	it('uses the JPEG file extension', () => {
		expect(downloadFileName('logo', { width: 256, height: 128 }, 'jpeg')).toBe('logo-256x128.jpg');
	});

	it('strips characters that are unsafe in file names', () => {
		expect(downloadFileName('../../etc/pässwd<script>', { width: 1, height: 1 }, 'png')).toBe(
			'etc-p-sswd-script-1x1.png'
		);
	});

	it('falls back to "logo" when nothing usable is left', () => {
		expect(downloadFileName('???', { width: 64, height: 64 }, 'png')).toBe('logo-64x64.png');
	});

	it('shortens very long names', () => {
		const name = downloadFileName('a'.repeat(200), { width: 64, height: 64 }, 'png');

		expect(name).toBe(`${'a'.repeat(64)}-64x64.png`);
	});
});

describe('formatBytes', () => {
	it.each([
		[0, '0 B'],
		[1023, '1023 B'],
		[1024, '1.0 KB'],
		[21_914, '21.4 KB'],
		[1_572_864, '1.5 MB']
	])('formats %i bytes as %s', (bytes, expected) => {
		expect(formatBytes(bytes)).toBe(expected);
	});
});
