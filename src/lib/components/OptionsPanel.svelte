<script lang="ts">
	import type { Editor } from '#lib/editor.svelte.ts';
	import {
		MAX_SIZE,
		MIN_SIZE,
		SIZE_PRESETS,
		clampPadding,
		maxPadding,
		type Background
	} from '#lib/logo/options.ts';

	let { editor }: { editor: Editor } = $props();

	const paddingLimit = $derived(maxPadding(editor.options.size));

	const presets = Object.entries(SIZE_PRESETS).map(([name, size]) => ({
		label: name[0].toUpperCase() + name.slice(1),
		size
	}));

	const backgrounds: { value: Background; label: string }[] = [
		{ value: 'none', label: 'None' },
		{ value: 'white', label: 'White' },
		{ value: 'black', label: 'Black' }
	];

	/** Applies a typed size once committed (Enter or blur), not on every keystroke. */
	function commitSize(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		if (Number.isFinite(input.valueAsNumber)) editor.setSize(input.valueAsNumber);
		input.value = String(editor.options.size);
	}

	/** Number inputs report `null` while empty; keep the last valid value until committed. */
	const numberSetter = (apply: (value: number) => void) => (value: number | null) => {
		if (value !== null && Number.isFinite(value)) apply(value);
	};

	const field = 'flex flex-col gap-2 border-t border-rule pt-4 first:border-t-0 first:pt-0';
	const legend = 'mb-2 text-sm font-semibold';
	const segment =
		'flex-1 cursor-pointer rounded-md px-2 py-1.5 text-center text-sm transition-colors has-checked:bg-ink has-checked:text-surface has-focus-visible:outline-2 has-focus-visible:outline-mark';
	const numberInput =
		'w-24 rounded-lg border border-rule bg-surface px-3 py-1.5 text-right tabular-nums';
</script>

<div class="flex flex-col gap-4">
	<div class={field}>
		<fieldset class="flex flex-col gap-2">
			<legend class={legend}>Size</legend>
			<div class="flex rounded-lg border border-rule p-0.5">
				{#each presets as preset (preset.size)}
					<label class={segment}>
						<input
							type="radio"
							name="size"
							class="sr-only"
							value={preset.size}
							checked={editor.options.size === preset.size}
							onchange={() => editor.setSize(preset.size)}
						/>
						{preset.label}
						<span class="block text-xs tabular-nums opacity-70">{preset.size}</span>
					</label>
				{/each}
			</div>
			<label class="flex items-center justify-between gap-3 text-sm">
				<span>
					Custom size
					<span class="block text-xs text-muted">{MIN_SIZE}–{MAX_SIZE} px</span>
				</span>
				<input
					type="number"
					min={MIN_SIZE}
					max={MAX_SIZE}
					step="1"
					class={numberInput}
					value={editor.options.size}
					onchange={commitSize}
				/>
			</label>
		</fieldset>
	</div>

	<div class={field}>
		<div class="flex items-center justify-between gap-3 text-sm">
			<label for="padding" class="font-semibold">Padding</label>
			<input
				type="number"
				min="0"
				max={paddingLimit}
				step="1"
				aria-label="Padding in pixels"
				class={numberInput}
				bind:value={() => editor.options.padding, numberSetter((v) => (editor.options.padding = v))}
				onchange={() =>
					(editor.options.padding = clampPadding(editor.options.padding, editor.options.size))}
			/>
		</div>
		<input
			id="padding"
			type="range"
			min="0"
			max={paddingLimit}
			step="1"
			class="accent-mark"
			bind:value={editor.options.padding}
		/>
	</div>

	<div class={field}>
		<fieldset class="flex flex-col gap-2">
			<legend class={legend}>Background</legend>
			<div class="flex rounded-lg border border-rule p-0.5">
				{#each backgrounds as background (background.value)}
					<label class={segment}>
						<input
							type="radio"
							name="background"
							class="sr-only"
							value={background.value}
							bind:group={editor.options.background}
						/>
						{background.label}
					</label>
				{/each}
			</div>
			{#if editor.options.background === 'none' && editor.format === 'jpeg'}
				<p class="text-sm text-muted">JPEG can't be transparent, so it gets a white background.</p>
			{/if}
		</fieldset>
	</div>

	<div class={field}>
		<label class="flex items-start gap-3 text-sm">
			<input
				type="checkbox"
				class="mt-0.5 size-4 accent-mark"
				bind:checked={editor.options.square}
			/>
			<span>
				<span class="font-semibold">Square</span>
				<span class="block text-muted">Fits the whole logo inside a square.</span>
			</span>
		</label>
		<label class="flex items-start gap-3 text-sm">
			<input type="checkbox" class="mt-0.5 size-4 accent-mark" bind:checked={editor.options.trim} />
			<span>
				<span class="font-semibold">Trim empty margins</span>
				<span class="block text-muted">Crops blank space around the source image.</span>
			</span>
		</label>
	</div>
</div>
