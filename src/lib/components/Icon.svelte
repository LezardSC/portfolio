<script lang="ts">
	/** A stroke icon from `$lib/data/icons` (or any 24×24 stroke path), decorative. */
	let {
		path,
		size = 24,
		stroke = 1.5
	}: { path: string; size?: number; stroke?: number } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path d={path} />
</svg>
