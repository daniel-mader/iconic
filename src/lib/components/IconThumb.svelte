<script lang="ts">
	import { iconCandidates, type DashboardIcon } from '#lib/dashboard-icons/dashboard-icons.ts';

	let { icon }: { icon: DashboardIcon } = $props();

	const candidates = $derived(iconCandidates(icon));
	/** The metadata is occasionally wrong about which files exist, so try the next candidate. */
	let attempt = $state(0);
	const src = $derived(candidates[attempt]?.href);
</script>

{#if src}
	<img
		{src}
		alt=""
		width="40"
		height="40"
		loading="lazy"
		referrerpolicy="no-referrer"
		onerror={() => attempt++}
		class="size-10 object-contain"
	/>
{:else}
	<span aria-hidden="true" class="size-10 rounded-md border border-dashed border-rule"></span>
{/if}
