<script lang="ts">
	import type { Snippet } from 'svelte';
	import { reveal } from '$lib/reveal-dom';
	import { longestWordLength, type SectionId } from '$lib/sections';

	let {
		id,
		title,
		lead,
		children
	}: { id: SectionId; title: string; lead?: string; children?: Snippet } = $props();
</script>

<section {id} aria-labelledby="{id}-title" use:reveal>
	<div class="inner">
		<div class="head" style:--chars={longestWordLength(title)}>
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
		max-width: var(--page-max);
		margin: 0 auto;
		padding: 0 var(--gutter);
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
	h2 {
		margin: 0;
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
	/* Phone: title and lead above the body. */
	@media (width < 48rem) {
		.inner {
			display: block;
			padding: 3rem 0;
		}
		.head {
			margin-bottom: 1.25rem;
		}
		h2 {
			font-size: 1.8125rem;
			line-height: 1.05;
			letter-spacing: -0.03em;
		}
		.lead {
			margin-top: 0.625rem;
			font-size: 0.9375rem;
		}
	}
</style>
