<script lang="ts">
	import type { Snippet } from 'svelte';
	import { longestWordLength, sectionNumber, type SectionId } from '$lib/sections';

	let {
		id,
		title,
		lead,
		children
	}: { id: SectionId; title: string; lead?: string; children?: Snippet } = $props();
</script>

<section {id} aria-labelledby="{id}-title">
	<div class="inner">
		<div class="head" style:--chars={longestWordLength(title)}>
			<p class="num" aria-hidden="true">{sectionNumber(id)}</p>
			<h2 id="{id}-title">{title}</h2>
			{#if lead}<p class="lead">{lead}</p>{/if}
		</div>
		<div class="body">
			{@render children?.()}
		</div>
	</div>
</section>

<style>
	section {
		max-width: 77.5rem;
		margin: 0 auto;
		padding: 0 2.5rem;
	}
	.inner {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		column-gap: 2rem;
		row-gap: 1.75rem;
		padding: 7rem 0;
		border-top: 2px solid var(--text);
	}
	.head {
		grid-column: span 3;
		container-type: inline-size;
	}
	.body {
		grid-column: span 9;
		min-width: 0;
	}
	.num {
		margin: 0;
		font-size: 7rem;
		line-height: 0.82;
		font-weight: 900;
		letter-spacing: -0.05em;
		color: transparent;
		-webkit-text-stroke: 2px var(--accent);
	}
	h2 {
		margin: 0.875rem 0 0;
		/* 46px, or less when the longest word wouldn't fit the column (~0.6em per character). */
		font-size: min(2.875rem, calc(100cqi / (var(--chars) * 0.6)));
		line-height: 1.08;
		font-weight: 800;
		letter-spacing: -0.035em;
	}
	.lead {
		margin: 0.875rem 0 0;
		font-size: 1.0625rem;
		line-height: 1.5;
		color: var(--muted);
	}
	/* Phone (M10 will design it): heading block above the content, M8 sizes. */
	@media (width < 48rem) {
		section {
			padding: 0 1rem;
		}
		.inner {
			display: block;
			padding: 2.5rem 0;
		}
		.num {
			font-size: 3.5rem;
		}
		h2 {
			margin: 0.5rem 0 0;
			font-size: 1.6rem;
		}
		.lead {
			margin-top: 0.5rem;
		}
		.head {
			margin-bottom: 1.25rem;
		}
	}
</style>
