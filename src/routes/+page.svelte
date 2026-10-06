<script lang="ts">
	import DropZone from '#lib/components/DropZone.svelte';
	import ExportPanel from '#lib/components/ExportPanel.svelte';
	import IconPicker from '#lib/components/IconPicker.svelte';
	import OptionsPanel from '#lib/components/OptionsPanel.svelte';
	import Proof from '#lib/components/Proof.svelte';
	import UrlForm from '#lib/components/UrlForm.svelte';
	import { Editor } from '#lib/editor.svelte.ts';

	const editor = new Editor();

	const onfile = (file: File) => editor.loadFile(file);
	const onurl = (url: string) => editor.loadUrl(url);

	const isTextField = (target: EventTarget | null) =>
		target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

	/**
	 * Pasting an image or an https link anywhere loads it; pasting into a text field types as
	 * usual. Other text is ignored so that pasted secrets are never sent anywhere.
	 */
	function onpaste(event: ClipboardEvent) {
		const file = event.clipboardData?.files[0];
		if (file) {
			event.preventDefault();
			editor.loadFile(file);
			return;
		}
		if (isTextField(event.target)) return;
		const text = event.clipboardData?.getData('text/plain').trim();
		if (text && /^https:\/\/\S+$/i.test(text)) editor.loadUrl(text);
	}

	/** Keep files dropped outside the drop zone from replacing the app. */
	const preventDrop = (event: DragEvent) => event.preventDefault();
</script>

<svelte:head>
	<title>Iconic: turn any image into a logo</title>
</svelte:head>

<svelte:window {onpaste} ondragover={preventDrop} ondrop={preventDrop} />

{#if editor.error}
	<div
		role="alert"
		class="mb-4 flex items-start justify-between gap-4 rounded-lg border border-mark/40 bg-surface px-4 py-3 text-sm"
	>
		<p>{editor.error}</p>
		<button
			type="button"
			onclick={() => editor.dismissError()}
			class="shrink-0 font-medium text-muted hover:text-ink"
		>
			Dismiss
		</button>
	</div>
{/if}

{#if editor.source && editor.plan}
	{@const source = editor.source}
	{@const plan = editor.plan}
	<div class="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
		<DropZone
			{onfile}
			{onurl}
			class="flex flex-col rounded-2xl border border-rule bg-surface/60 data-active:border-mark"
		>
			{#snippet children(browse)}
				<div class="flex flex-1 items-center justify-center">
					<Proof {source} {plan} background={editor.background} />
				</div>
				<div
					class="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-3 text-sm"
				>
					<p class="min-w-0 truncate text-muted">
						<span class="font-medium text-ink">{source.name}</span>
						<span class="tabular-nums">
							{source.vector ? 'SVG' : `${source.width} × ${source.height} px`}
						</span>
					</p>
					<div class="flex gap-2">
						<button
							type="button"
							onclick={browse}
							class="rounded-lg border border-rule px-3 py-1.5 hover:border-ink"
						>
							Replace image
						</button>
						<button
							type="button"
							onclick={() => editor.clear()}
							class="rounded-lg px-3 py-1.5 text-muted hover:text-ink"
						>
							Start over
						</button>
					</div>
				</div>
			{/snippet}
		</DropZone>

		<aside class="flex flex-col gap-6 rounded-2xl border border-rule bg-surface p-5 lg:self-start">
			<OptionsPanel {editor} />
			<div class="border-t border-rule pt-5">
				<ExportPanel {editor} />
			</div>
		</aside>
	</div>
{:else}
	<div class="flex flex-1 flex-col gap-10">
		<DropZone {onfile} {onurl} class="flex">
			{#snippet children(browse)}
				<div
					class="relative flex min-h-[55vh] flex-1 flex-col items-start justify-end gap-6 overflow-hidden rounded-3xl border-2 border-dashed border-rule bg-surface/60 p-6 transition-colors group-data-active/drop:border-mark group-data-active/drop:bg-mark/5 sm:p-10"
				>
					<h1
						class="max-w-3xl font-display text-5xl leading-[0.95] font-bold tracking-tight text-balance sm:text-7xl"
					>
						Drop an image to make it a logo.
					</h1>
					<p class="max-w-xl text-lg text-muted">
						Add padding, a white or black background, square it, and download it as PNG or JPEG at
						the exact size you need.
					</p>
					<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
						<button
							type="button"
							onclick={browse}
							disabled={editor.loading}
							class="rounded-lg bg-ink px-5 py-3 font-semibold text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
						>
							Choose image
						</button>
						<p class="text-sm text-muted" aria-live="polite">
							{editor.loading ? 'Loading image…' : 'or paste one from your clipboard'}
						</p>
					</div>
				</div>
			{/snippet}
		</DropZone>

		<div class="grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
			<UrlForm onsubmit={onurl} disabled={editor.loading} />
			<IconPicker onselect={(icon) => editor.loadIcon(icon)} disabled={editor.loading} />
		</div>
	</div>
{/if}
