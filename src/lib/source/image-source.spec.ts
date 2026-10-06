import { describe, expect, it, vi } from 'vitest';
import {
	MAX_IMAGE_BYTES,
	MAX_IMAGE_PIXELS,
	fetchImage,
	validateImageDimensions,
	nameFromUrl,
	parseImageUrl,
	validateImageFile
} from './image-source.ts';

describe('validateImageFile', () => {
	it.each(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'])(
		'accepts %s',
		(type) => {
			expect(validateImageFile({ type, size: 1024 })).toEqual({ ok: true, value: undefined });
		}
	);

	it.each(['', 'text/html', 'application/pdf', 'image/x-icon'])('rejects type "%s"', (type) => {
		expect(validateImageFile({ type, size: 1024 })).toMatchObject({ ok: false });
	});

	it('rejects empty files', () => {
		expect(validateImageFile({ type: 'image/png', size: 0 })).toMatchObject({ ok: false });
	});

	it('rejects files above the size limit', () => {
		expect(validateImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 })).toMatchObject({
			ok: false,
			error: expect.stringContaining('20 MB')
		});
	});
});

describe('validateImageDimensions', () => {
	it('accepts images up to the pixel limit', () => {
		expect(validateImageDimensions(8192, 8192)).toEqual({ ok: true, value: undefined });
		expect(MAX_IMAGE_PIXELS).toBe(8192 * 8192);
	});

	it('rejects images above the pixel limit, which could exhaust memory when decoded', () => {
		expect(validateImageDimensions(30_000, 30_000)).toMatchObject({ ok: false });
		expect(validateImageDimensions(8193, 8192)).toMatchObject({ ok: false });
	});

	it('rejects images without a size', () => {
		expect(validateImageDimensions(0, 100)).toMatchObject({ ok: false });
		expect(validateImageDimensions(100, 0)).toMatchObject({ ok: false });
	});
});

describe('parseImageUrl', () => {
	it('accepts https links', () => {
		const result = parseImageUrl('  https://example.com/logo.png  ');

		expect(result).toMatchObject({ ok: true });
		expect(result.ok && result.value.href).toBe('https://example.com/logo.png');
	});

	it('assumes https for links without a scheme', () => {
		const result = parseImageUrl('example.com/logo.svg');

		expect(result.ok && result.value.href).toBe('https://example.com/logo.svg');
	});

	it('rejects empty input', () => {
		expect(parseImageUrl('   ')).toMatchObject({ ok: false });
	});

	it.each([
		'http://example.com/logo.png',
		'javascript:alert(1)',
		'data:image/png;base64,AAAA',
		'file:///etc/passwd',
		'blob:https://example.com/123'
	])('rejects non-https link %s', (input) => {
		expect(parseImageUrl(input)).toMatchObject({
			ok: false,
			error: expect.stringContaining('https')
		});
	});

	it('rejects links with embedded credentials', () => {
		expect(parseImageUrl('https://user:secret@example.com/logo.png')).toMatchObject({
			ok: false
		});
	});

	it('rejects malformed links', () => {
		expect(parseImageUrl('https://exa mple.com/')).toMatchObject({ ok: false });
	});
});

describe('nameFromUrl', () => {
	it('uses the last path segment without its extension', () => {
		expect(nameFromUrl(new URL('https://cdn.example.com/icons/home%20assistant.svg?v=2'))).toBe(
			'home assistant'
		);
	});

	it('falls back to the host name', () => {
		expect(nameFromUrl(new URL('https://example.com/'))).toBe('example.com');
	});
});

describe('fetchImage', () => {
	const url = new URL('https://example.com/logo.png');
	const png = new Uint8Array([137, 80, 78, 71]);

	const respondWith = (response: Response | Error) =>
		vi.fn<typeof fetch>(() =>
			response instanceof Error ? Promise.reject(response) : Promise.resolve(response)
		);

	it('returns the image as a blob of the served type', async () => {
		const fetch = respondWith(new Response(png, { headers: { 'content-type': 'image/png' } }));

		const result = await fetchImage(url, { fetch });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.type).toBe('image/png');
		expect(new Uint8Array(await result.value.arrayBuffer())).toEqual(png);
	});

	it('requests the image anonymously', async () => {
		const fetch = respondWith(new Response(png, { headers: { 'content-type': 'image/png' } }));

		await fetchImage(url, { fetch });

		expect(fetch).toHaveBeenCalledWith(
			url,
			expect.objectContaining({ mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' })
		);
	});

	it('accepts content types with parameters', async () => {
		const fetch = respondWith(
			new Response('<svg/>', { headers: { 'content-type': 'image/svg+xml; charset=utf-8' } })
		);

		const result = await fetchImage(url, { fetch });

		expect(result.ok && result.value.type).toBe('image/svg+xml');
	});

	it('reports HTTP errors', async () => {
		const fetch = respondWith(new Response('nope', { status: 404 }));

		expect(await fetchImage(url, { fetch })).toMatchObject({
			ok: false,
			error: expect.stringContaining('404')
		});
	});

	it('rejects responses that are not images', async () => {
		const fetch = respondWith(
			new Response('<html></html>', { headers: { 'content-type': 'text/html' } })
		);

		expect(await fetchImage(url, { fetch })).toMatchObject({
			ok: false,
			error: expect.stringContaining('text/html')
		});
	});

	it('rejects images that declare a size above the limit', async () => {
		const fetch = respondWith(
			new Response(png, { headers: { 'content-type': 'image/png', 'content-length': '5000' } })
		);

		expect(await fetchImage(url, { fetch, maxBytes: 100 })).toMatchObject({ ok: false });
	});

	it('stops reading images that exceed the limit without declaring their size', async () => {
		let cancelled = false;
		const endless = new ReadableStream<Uint8Array>({
			pull: (controller) => controller.enqueue(new Uint8Array(60)),
			cancel: () => {
				cancelled = true;
			}
		});
		const fetch = respondWith(new Response(endless, { headers: { 'content-type': 'image/png' } }));

		expect(await fetchImage(url, { fetch, maxBytes: 100 })).toMatchObject({ ok: false });
		expect(cancelled).toBe(true);
	});

	it('lets aborts during download propagate', async () => {
		const controller = new AbortController();
		const body = new ReadableStream<Uint8Array>({
			start(stream) {
				stream.enqueue(new Uint8Array(10));
				controller.signal.addEventListener('abort', () =>
					stream.error(new DOMException('aborted', 'AbortError'))
				);
			}
		});
		const fetch = respondWith(new Response(body, { headers: { 'content-type': 'image/png' } }));

		const result = fetchImage(url, { fetch, signal: controller.signal });
		controller.abort();

		await expect(result).rejects.toThrow('aborted');
	});

	it('explains network and CORS failures', async () => {
		const fetch = respondWith(new TypeError('Failed to fetch'));

		expect(await fetchImage(url, { fetch })).toMatchObject({
			ok: false,
			error: expect.stringContaining('download')
		});
	});

	it('lets aborts propagate', async () => {
		const fetch = respondWith(new DOMException('aborted', 'AbortError'));

		await expect(fetchImage(url, { fetch })).rejects.toThrow('aborted');
	});
});
