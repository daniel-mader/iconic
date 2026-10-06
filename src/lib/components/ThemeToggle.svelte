<script lang="ts">
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import {
		readThemePreference,
		resolveTheme,
		writeThemePreference,
		type ThemePreference
	} from '#lib/theme/theme.ts';

	/** Accessing `localStorage` itself throws when site data is blocked. */
	function storage(): Storage | undefined {
		try {
			return localStorage;
		} catch {
			return undefined;
		}
	}

	const options: { value: ThemePreference; label: string }[] = [
		{ value: 'system', label: 'Match device' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
	];

	// Prerendered HTML can't know the stored preference, and hydration doesn't patch attributes
	// such as `aria-pressed`, so the stored value is read once mounted. This runs before the
	// effect below, so the theme set by static/theme-init.js is never overwritten in between.
	let preference = $state<ThemePreference>('system');
	onMount(() => {
		preference = readThemePreference(storage());
	});

	const prefersDark = new MediaQuery('(prefers-color-scheme: dark)', false);
	const theme = $derived(resolveTheme(preference, prefersDark.current));

	$effect(() => {
		document.documentElement.dataset.theme = theme;
	});

	function choose(value: ThemePreference) {
		preference = value;
		writeThemePreference(storage(), value);
	}
</script>

<div
	role="group"
	aria-label="Color theme"
	class="flex rounded-full border border-rule bg-surface p-0.5"
>
	{#each options as option (option.value)}
		<button
			type="button"
			title={option.label}
			aria-pressed={preference === option.value}
			onclick={() => choose(option.value)}
			class={[
				'grid size-8 place-items-center rounded-full transition-colors',
				preference === option.value ? 'bg-ink text-surface' : 'text-muted hover:text-ink'
			]}
		>
			<span class="sr-only">{option.label}</span>
			<svg
				viewBox="0 0 24 24"
				class="size-4"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				{#if option.value === 'system'}
					<rect x="3" y="4" width="18" height="12" rx="2" />
					<path d="M8 20h8M12 16v4" />
				{:else if option.value === 'light'}
					<circle cx="12" cy="12" r="4" />
					<path
						d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
					/>
				{:else}
					<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
				{/if}
			</svg>
		</button>
	{/each}
</div>
