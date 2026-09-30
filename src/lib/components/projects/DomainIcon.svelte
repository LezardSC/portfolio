<script lang="ts">
	import type { Domain } from '$lib/projects';

	let { domain, size = 32 }: { domain: Domain; size?: number } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if domain === 'web'}
		<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
	{:else if domain === 'blockchain'}
		<path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" />
		<path d="M12 22V12M20.66 7L12 12 3.34 7" />
	{:else if domain === 'ai'}
		<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
		<path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
	{:else if domain === 'low-level'}
		<rect x="6" y="6" width="12" height="12" rx="1.5" />
		<path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
	{:else}
		<rect x="2" y="7" width="20" height="11" rx="4" />
		<path d="M7 10.5v4M5 12.5h4" />
		<circle cx="16" cy="11.5" r="0.8" />
		<circle cx="18" cy="13.5" r="0.8" />
	{/if}
</svg>
