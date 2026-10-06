import { fail, ok, type Result } from '#lib/result.ts';

export const ACCEPTED_IMAGE_TYPES = [
	'image/png',
	'image/jpeg',
	'image/webp',
	'image/gif',
	'image/svg+xml',
	'image/avif'
] as const;

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/** Decoded images take 4 bytes per pixel; 8192 × 8192 is 256 MB. */
export const MAX_IMAGE_PIXELS = 8192 * 8192;

const TOO_LARGE = `Images can be at most ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`;

const isAcceptedType = (type: string) => (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);

/** Checks a user-provided file before it is decoded. */
export function validateImageFile(file: Pick<File, 'type' | 'size'>): Result<void> {
	if (!isAcceptedType(file.type)) {
		return fail('Unsupported file type. Use PNG, JPEG, WebP, GIF, SVG or AVIF.');
	}
	if (file.size === 0) return fail('That file is empty.');
	if (file.size > MAX_IMAGE_BYTES) return fail(TOO_LARGE);
	return ok(undefined);
}

/** Checks an image's dimensions before it is fully decoded, since small files can declare huge sizes. */
export function validateImageDimensions(width: number, height: number): Result<void> {
	if (width === 0 || height === 0) return fail('That image has no size.');
	if (width * height > MAX_IMAGE_PIXELS) {
		return fail('That image is too large. Use one with at most 8192 × 8192 pixels.');
	}
	return ok(undefined);
}

/** Parses user input into a link that is safe to fetch: https only, no embedded credentials. */
export function parseImageUrl(input: string): Result<URL> {
	const trimmed = input.trim();
	if (!trimmed) return fail('Enter a link to an image.');

	const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
	const url = URL.parse(hasScheme ? trimmed : `https://${trimmed}`);

	if (!url) return fail('That does not look like a valid link.');
	if (url.protocol !== 'https:') return fail('Only secure https:// links are supported.');
	if (url.username || url.password)
		return fail('Links with embedded credentials are not supported.');
	return ok(url);
}

/** A human-readable name for an image link, e.g. `logo` for `https://example.com/logo.png`. */
export function nameFromUrl(url: URL): string {
	const segment = url.pathname.split('/').findLast(Boolean);
	if (!segment) return url.hostname;

	let decoded = segment;
	try {
		decoded = decodeURIComponent(segment);
	} catch {
		// Keep the raw segment if it is not valid percent-encoding.
	}
	return decoded.replace(/\.[a-z\d]+$/i, '') || url.hostname;
}

export interface FetchImageOptions {
	fetch: typeof globalThis.fetch;
	signal?: AbortSignal;
	maxBytes?: number;
}

/**
 * Downloads an image from another origin without credentials or referrer, enforcing the
 * accepted image types and a size limit. Aborts are rethrown; every other failure becomes a
 * user-facing error.
 */
export async function fetchImage(
	url: URL,
	{ fetch, signal, maxBytes = MAX_IMAGE_BYTES }: FetchImageOptions
): Promise<Result<Blob>> {
	let response: Response;
	try {
		response = await fetch(url, {
			mode: 'cors',
			credentials: 'omit',
			referrerPolicy: 'no-referrer',
			signal
		});
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') throw error;
		return fail(
			'Could not load that link. The server may not allow other sites to use its images. ' +
				'Try to download the image and drop it here instead.'
		);
	}

	if (!response.ok) return fail(`The server responded with ${response.status}.`);

	const type = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
	if (!isAcceptedType(type)) {
		return fail(`That link does not point to a supported image (got ${type || 'unknown type'}).`);
	}

	const declaredLength = Number(response.headers.get('content-length'));
	if (declaredLength > maxBytes) return fail(TOO_LARGE);

	const bytes = await readLimited(response, maxBytes);
	if (!bytes) return fail(TOO_LARGE);
	if (bytes.length === 0) return fail('That image is empty.');
	return ok(new Blob(bytes, { type }));
}

/** Reads a response body, giving up once it exceeds `maxBytes`. */
async function readLimited(
	response: Response,
	maxBytes: number
): Promise<Uint8Array<ArrayBuffer>[] | null> {
	if (!response.body) return [];

	const reader = response.body.getReader();
	const chunks: Uint8Array<ArrayBuffer>[] = [];
	let total = 0;

	for (;;) {
		const { done, value } = await reader.read();
		if (done) return chunks;
		total += value.byteLength;
		if (total > maxBytes) {
			await reader.cancel();
			return null;
		}
		chunks.push(value);
	}
}
