<script lang="ts">
	import { downloadBlob, encodeLogo } from '#lib/browser/canvas.ts';
	import type { Editor } from '#lib/editor.svelte.ts';
	import {
		EXPORT_FORMATS,
		downloadFileName,
		formatBytes,
		type ExportFormat
	} from '#lib/export/export.ts';

	let { editor }: { editor: Editor } = $props();

	/** Wait for settings to settle before encoding, which can take a while for large outputs. */
	const ESTIMATE_DELAY_MS = 250;

	let estimate = $state<number | null>(null);
	let downloading = $state(false);
	let failed = $state(false);

	const formats = Object.entries(EXPORT_FORMATS) as [
		ExportFormat,
		(typeof EXPORT_FORMATS)[ExportFormat]
	][];

	// Encodes the current logo in the background to show its real file size.
	$effect(() => {
		const { source, plan, background, format } = editor;
		estimate = null;
		if (!source || !plan) return;

		let cancelled = false;
		const timer = setTimeout(async () => {
			try {
				const blob = await encodeLogo(source.element, plan, background, format);
				if (!cancelled) estimate = blob.size;
			} catch {
				if (!cancelled) estimate = null;
			}
		}, ESTIMATE_DELAY_MS);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	});

	async function download() {
		const { source, plan, background, format } = editor;
		if (!source || !plan) return;

		downloading = true;
		failed = false;
		try {
			const blob = await encodeLogo(source.element, plan, background, format);
			downloadBlob(blob, downloadFileName(source.name, plan, format));
		} catch (error) {
			console.error(error);
			failed = true;
		} finally {
			downloading = false;
		}
	}

	const segment =
		'flex-1 cursor-pointer rounded-md px-2 py-1.5 text-center text-sm transition-colors has-checked:bg-ink has-checked:text-surface has-focus-visible:outline-2 has-focus-visible:outline-mark';
</script>

<div class="flex flex-col gap-3">
	<fieldset>
		<legend class="mb-2 text-sm font-semibold">Format</legend>
		<div class="flex rounded-lg border border-rule p-0.5">
			{#each formats as [value, format] (value)}
				<label class={segment}>
					<input type="radio" name="format" class="sr-only" {value} bind:group={editor.format} />
					{format.label}
				</label>
			{/each}
		</div>
	</fieldset>

	<button
		type="button"
		onclick={download}
		disabled={downloading || !editor.plan}
		class="flex items-center justify-between gap-3 rounded-lg bg-mark px-4 py-3 font-semibold text-mark-ink transition-opacity hover:opacity-90 disabled:opacity-50"
	>
		<span>Download {EXPORT_FORMATS[editor.format].label}</span>
		<span class="text-sm font-normal tabular-nums opacity-80" aria-live="polite">
			{estimate === null ? '' : `≈ ${formatBytes(estimate)}`}
		</span>
	</button>
	{#if failed}
		<p role="alert" class="text-sm text-mark">
			The image could not be encoded. Try a smaller size.
		</p>
	{/if}
</div>
