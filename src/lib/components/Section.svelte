<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { SectionId } from '$lib/sections';

	let { id, title, children }: { id: SectionId; title: string; children?: Snippet } = $props();
</script>

<section {id} aria-labelledby="{id}-title">
	<h2 id="{id}-title">{title}</h2>
	{@render children?.()}
</section>

<style>
	section {
		max-width: 72rem;
		margin: 0 auto;
		padding: 4rem 1rem;
	}
	h2 {
		font-size: 2rem;
		margin: 0 0 1.5rem;
	}
	@media (width < 48rem) {
		section {
			padding: 2.5rem 1rem;
		}
		h2 {
			font-size: 1.6rem;
			margin-bottom: 1.25rem;
		}
	}
</style>
