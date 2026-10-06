<script lang="ts">
	interface Props {
		/** Loads the link; resolves to whether it succeeded. */
		onsubmit: (url: string) => Promise<boolean>;
		disabled?: boolean;
	}

	let { onsubmit, disabled = false }: Props = $props();

	let url = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (await onsubmit(url)) url = '';
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-2">
	<label for="image-url" class="font-display text-lg font-semibold">Load from a link</label>
	<p class="text-sm text-muted">The site has to allow other sites to use its images.</p>
	<div class="mt-1 flex gap-2">
		<input
			id="image-url"
			bind:value={url}
			type="text"
			inputmode="url"
			autocomplete="off"
			spellcheck="false"
			placeholder="https://example.com/logo.svg"
			class="min-w-0 flex-1 rounded-lg border border-rule bg-surface px-3 py-2 placeholder:text-muted/70"
		/>
		<button
			type="submit"
			disabled={disabled || !url.trim()}
			class="rounded-lg bg-ink px-4 py-2 font-medium text-surface transition-opacity disabled:opacity-40"
		>
			Load
		</button>
	</div>
</form>
