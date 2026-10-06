<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { renderLogo } from '#lib/browser/canvas.ts';
	import type { SourceImage } from '#lib/browser/image.ts';
	import type { Background } from '#lib/logo/options.ts';
	import type { LogoPlan } from '#lib/logo/plan.ts';

	interface Props {
		source: SourceImage;
		plan: LogoPlan;
		background: Background;
	}

	let { source, plan, background }: Props = $props();

	/** Tiny outputs are shown enlarged (with crisp pixels) so they stay inspectable. */
	const MIN_DISPLAY_SIZE = 160;
	const displayScale = $derived(Math.max(1, MIN_DISPLAY_SIZE / Math.max(plan.width, plan.height)));

	const draw: Attachment<HTMLCanvasElement> = (canvas) => {
		renderLogo(canvas, source.element, plan, background);
	};

	/** Crop marks sit just outside each corner of the proof, like on a print proof. */
	const corners = [
		['-top-5 left-0 h-3 w-px', 'top-0 -left-5 h-px w-3'],
		['-top-5 right-0 h-3 w-px', 'top-0 -right-5 h-px w-3'],
		['-bottom-5 left-0 h-3 w-px', 'bottom-0 -left-5 h-px w-3'],
		['-bottom-5 right-0 h-3 w-px', 'bottom-0 -right-5 h-px w-3']
	];
</script>

<figure class="flex w-full flex-col items-center px-10 pt-12 pb-8">
	<div
		class="relative"
		style:width="min(100%, {plan.width * displayScale}px, calc(60vh * {plan.width} / {plan.height}))"
		style:aspect-ratio="{plan.width} / {plan.height}"
	>
		{#each corners as marks, i (i)}
			{#each marks as mark (mark)}
				<span aria-hidden="true" class="absolute bg-mark {mark}"></span>
			{/each}
		{/each}

		<div
			aria-hidden="true"
			class="absolute inset-x-0 -top-10 flex items-center gap-2 text-xs text-muted tabular-nums"
		>
			<span class="h-2 w-px bg-muted"></span>
			<span class="h-px flex-1 bg-rule"></span>
			{plan.width} px
			<span class="h-px flex-1 bg-rule"></span>
			<span class="h-2 w-px bg-muted"></span>
		</div>

		<div
			aria-hidden="true"
			class="absolute inset-y-0 -right-10 flex flex-col items-center gap-2 text-xs text-muted tabular-nums"
		>
			<span class="h-px w-2 bg-muted"></span>
			<span class="w-px flex-1 bg-rule"></span>
			<span class="[writing-mode:vertical-rl]">{plan.height} px</span>
			<span class="w-px flex-1 bg-rule"></span>
			<span class="h-px w-2 bg-muted"></span>
		</div>

		<canvas
			{@attach draw}
			class={[
				'block size-full checkerboard shadow-sm',
				displayScale > 1 && '[image-rendering:pixelated]'
			]}
		></canvas>
	</div>
	<figcaption class="sr-only">
		Preview of the logo, {plan.width} by {plan.height} pixels
	</figcaption>
</figure>
