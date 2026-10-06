<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-dvh flex-col">
	<header
		class="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6"
	>
		<a href="/" class="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight">
			<svg viewBox="0 0 24 24" class="size-6 text-mark" fill="none" aria-hidden="true">
				<circle cx="12" cy="12" r="6.5" stroke="currentColor" stroke-width="1.75" />
				<path d="M12 1.5v21M1.5 12h21" stroke="currentColor" stroke-width="1.75" />
			</svg>
			Iconic
		</a>
		<ThemeToggle />
	</header>

	<main class="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-10 sm:px-6">
		{@render children()}
	</main>

	<footer class="mx-auto w-full max-w-7xl px-4 py-6 text-sm text-muted sm:px-6">
		Images are processed in your browser and never uploaded.
	</footer>
</div>
