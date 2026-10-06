<script lang="ts">
	import {
		DASHBOARD_ICONS_LICENSE_URL,
		fetchIconIndex,
		searchIcons,
		type DashboardIcon
	} from '#lib/dashboard-icons/dashboard-icons.ts';
	import IconThumb from './IconThumb.svelte';

	interface Props {
		onselect: (icon: DashboardIcon) => void;
		disabled?: boolean;
	}

	let { onselect, disabled = false }: Props = $props();

	let query = $state('');
	let icons = $state.raw<DashboardIcon[] | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const results = $derived(icons ? searchIcons(icons, query) : []);

	const link = 'underline decoration-rule underline-offset-2 hover:decoration-mark';

	/** Fetches the icon index on first use rather than on page load. */
	async function loadIndex() {
		if (icons || loading) return;
		loading = true;
		error = null;
		const result = await fetchIconIndex({ fetch: (input, init) => fetch(input, init) });
		loading = false;
		if (result.ok) icons = result.value;
		else error = result.error;
	}
</script>

<section class="flex flex-col gap-2" aria-labelledby="icon-search-label">
	<label id="icon-search-label" for="icon-search" class="font-display text-lg font-semibold">
		Find a Dashboard Icon
	</label>
	<p class="text-sm text-muted">
		Search app and service logos from
		<a href="https://dashboardicons.com" target="_blank" rel="noopener noreferrer" class={link}>
			dashboardicons.com</a
		>, available under the
		<a href={DASHBOARD_ICONS_LICENSE_URL} target="_blank" rel="noopener noreferrer" class={link}>
			Apache 2.0 license</a
		>. Logos are trademarks of their respective owners.
	</p>
	<input
		id="icon-search"
		type="search"
		bind:value={query}
		onfocus={loadIndex}
		autocomplete="off"
		spellcheck="false"
		placeholder="e.g. Home Assistant"
		class="mt-1 rounded-lg border border-rule bg-surface px-3 py-2 placeholder:text-muted/70"
	/>

	<div aria-live="polite" class="text-sm text-muted">
		{#if loading}
			<p>Loading icons…</p>
		{:else if error}
			<p>
				{error}
				<button type="button" onclick={loadIndex} class="font-medium text-ink underline">
					Try again
				</button>
			</p>
		{:else if icons && query.trim() && results.length === 0}
			<p>No icons match “{query.trim()}”.</p>
		{/if}
	</div>

	{#if results.length > 0}
		<ul class="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
			{#each results as icon (icon.name)}
				<li>
					<button
						type="button"
						{disabled}
						onclick={() => onselect(icon)}
						title={icon.name}
						class="flex w-full flex-col items-center gap-1.5 rounded-lg border border-transparent p-2 text-xs text-muted transition-colors hover:border-rule hover:bg-surface hover:text-ink disabled:opacity-40"
					>
						<IconThumb {icon} />
						<span class="w-full truncate">{icon.name}</span>
						<span class="sr-only">Use this icon</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>
