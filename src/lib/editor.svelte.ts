import { decodeImage, type SourceImage } from '#lib/browser/image.ts';
import { fetchDashboardIcon, type DashboardIcon } from '#lib/dashboard-icons/dashboard-icons.ts';
import { resolveBackground, type ExportFormat } from '#lib/export/export.ts';
import { DEFAULT_OPTIONS, withSize, type LogoOptions } from '#lib/logo/options.ts';
import { planLogo } from '#lib/logo/plan.ts';
import { ok, type Result } from '#lib/result.ts';
import {
	fetchImage,
	nameFromUrl,
	parseImageUrl,
	validateImageFile
} from '#lib/source/image-source.ts';

/** `fetch` must be called with `window` as `this`, so it cannot be passed around unbound. */
const boundFetch: typeof fetch = (input, init) => fetch(input, init);

/** State of the logo being edited: its source image, options and export format. */
export class Editor {
	source = $state.raw<SourceImage | null>(null);
	options = $state<LogoOptions>({ ...DEFAULT_OPTIONS });
	format = $state<ExportFormat>('png');
	loading = $state(false);
	error = $state<string | null>(null);

	/** The region of the source that makes up the logo. */
	content = $derived.by(() => {
		if (!this.source) return null;
		const { width, height, contentBounds } = this.source;
		const full = { x: 0, y: 0, width, height };
		return this.options.trim ? (contentBounds ?? full) : full;
	});

	plan = $derived(this.content ? planLogo(this.content, this.options) : null);

	background = $derived(resolveBackground(this.options.background, this.format));

	#pending: AbortController | null = null;

	loadFile(file: File): Promise<boolean> {
		const valid = validateImageFile(file);
		if (!valid.ok) return Promise.resolve(this.#reject(valid.error));
		return this.#load(file.name.replace(/\.[^.]+$/, ''), async () => ok(file));
	}

	loadUrl(input: string): Promise<boolean> {
		const url = parseImageUrl(input);
		if (!url.ok) return Promise.resolve(this.#reject(url.error));
		return this.#load(nameFromUrl(url.value), (signal) =>
			fetchImage(url.value, { fetch: boundFetch, signal })
		);
	}

	loadIcon(icon: DashboardIcon): Promise<boolean> {
		return this.#load(icon.name, (signal) =>
			fetchDashboardIcon(icon, { fetch: boundFetch, signal })
		);
	}

	/** Changes the output size, shrinking the padding if it no longer fits. */
	setSize(size: number): void {
		this.options = withSize(this.options, size);
	}

	/** Discards the current image and any load in progress. */
	clear(): void {
		this.#cancelPending();
		this.error = null;
		this.#replaceSource(null);
	}

	dismissError(): void {
		this.error = null;
	}

	/** Loads a new source, superseding any load still in progress. Resolves to success. */
	async #load(
		name: string,
		getBlob: (signal: AbortSignal) => Promise<Result<Blob>>
	): Promise<boolean> {
		this.#cancelPending();
		const controller = new AbortController();
		this.#pending = controller;
		this.loading = true;
		this.error = null;

		try {
			const blob = await getBlob(controller.signal);
			if (controller.signal.aborted) return false;
			if (!blob.ok) return this.#fail(blob.error);

			const image = await decodeImage(blob.value, name);
			if (controller.signal.aborted) {
				if (image.ok) image.value.dispose();
				return false;
			}
			if (!image.ok) return this.#fail(image.error);

			this.#replaceSource(image.value);
			return true;
		} catch (error) {
			if (controller.signal.aborted) return false;
			console.error(error);
			return this.#fail('Something went wrong while loading that image.');
		} finally {
			if (this.#pending === controller) {
				this.#pending = null;
				this.loading = false;
			}
		}
	}

	#replaceSource(source: SourceImage | null): void {
		this.source?.dispose();
		this.source = source;
	}

	#fail(message: string): false {
		this.error = message;
		return false;
	}

	/** Fails before loading starts. The user's latest action wins, so a pending load is dropped. */
	#reject(message: string): false {
		this.#cancelPending();
		return this.#fail(message);
	}

	#cancelPending(): void {
		this.#pending?.abort();
		this.#pending = null;
		this.loading = false;
	}
}
