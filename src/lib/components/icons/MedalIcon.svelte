<script lang="ts">
	let { size = 20 }: { size?: number } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<circle cx="12" cy="9" r="6" />
	<path d="M8.5 14 7 22l5-3 5 3-1.5-8" />
</svg>
