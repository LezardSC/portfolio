<script lang="ts">
	import type { Snippet } from 'svelte';
	import { reveal } from '$lib/reveal-dom';
	import { longestWordLength, sectionNumber, type SectionId } from '$lib/sections';

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
		font-size: 4.5rem;
		line-height: 0.82;
		font-weight: 900;
		letter-spacing: -0.05em;
		/* Outline only: a 3px stroke painted under a background-coloured fill leaves a 1.5px outer
		   line and hides the variable font's overlapping contours (visible in a bare stroke). */
		color: var(--bg);
		-webkit-text-stroke: 3px var(--accent);
		paint-order: stroke fill;
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
	/* Phone: outlined number and title on one line, lead below. */
	@media (width < 48rem) {
		section {
			padding: 0 1.25rem;
		}
		.inner {
			display: block;
			padding: 3rem 0;
		}
		.head {
			display: flex;
			flex-wrap: wrap;
			align-items: flex-end;
			column-gap: 0.875rem;
			margin-bottom: 1.25rem;
		}
		.num {
			font-size: 2.875rem;
			line-height: 0.8;
			/* Half of it shows outside the fill: a 1.5px outline. */
			-webkit-text-stroke-width: 3px;
		}
		/* A long title wraps beside the number rather than dropping below it. */
		h2 {
			flex: 1 1 0;
			min-width: 0;
			margin: 0;
			font-size: 1.8125rem;
			line-height: 1.05;
			letter-spacing: -0.03em;
		}
		.lead {
			flex-basis: 100%;
			margin-top: 0.625rem;
			font-size: 0.9375rem;
		}
	}
</style>
