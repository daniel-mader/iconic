<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import { ACCEPTED_IMAGE_TYPES } from '#lib/source/image-source.ts';

	interface Props {
		onfile: (file: File) => void;
		/** Called with a link when an image is dragged in from another web page. */
		onurl: (url: string) => void;
		/** Receives a function that opens the file picker. */
		children: Snippet<[browse: () => void]>;
		class?: ClassValue;
	}

	let { onfile, onurl, children, class: className }: Props = $props();

	let input: HTMLInputElement;
	/** Counts nested dragenter/dragleave pairs so child elements don't reset the highlight. */
	let depth = $state(0);
	const active = $derived(depth > 0);

	const browse = () => input.click();

	function ondragenter(event: DragEvent) {
		event.preventDefault();
		depth++;
	}

	function ondragover(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
	}

	function ondragleave() {
		depth = Math.max(0, depth - 1);
	}

	function ondrop(event: DragEvent) {
		event.preventDefault();
		depth = 0;
		const data = event.dataTransfer;
		const file = data?.files[0];
		if (file) return onfile(file);

		const url = data
			?.getData('text/uri-list')
			.split(/\r?\n/)
			.find((line) => line && !line.startsWith('#'));
		if (url) onurl(url);
	}

	function onchange() {
		const file = input.files?.[0];
		if (file) onfile(file);
		input.value = '';
	}
</script>

<div
	role="region"
	aria-label="Image drop zone"
	{ondragenter}
	{ondragover}
	{ondragleave}
	{ondrop}
	data-active={active || undefined}
	class={['group/drop relative', className]}
>
	{@render children(browse)}
	<input
		bind:this={input}
		type="file"
		accept={ACCEPTED_IMAGE_TYPES.join(',')}
		class="sr-only"
		tabindex="-1"
		aria-hidden="true"
		{onchange}
	/>
</div>
