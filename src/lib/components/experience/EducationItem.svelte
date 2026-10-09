<script lang="ts">
	import type { Dict, Lang } from '$lib/i18n';
	import { periodPoints, type Education } from '$lib/experience';
	import Period from './Period.svelte';

	let {
		item,
		lang,
		t,
		newTab
	}: { item: Education; lang: Lang; t: Dict['experience']; newTab: string } = $props();
</script>

<article class="edu">
	<p class="when"><Period points={periodPoints(item.start, item.end, lang, t.present)} /></p>
	<div class="name">
		<h4>{item.school}</h4>
		<p class="title">{item.title[lang]}</p>
	</div>
	{#if item.points.length > 0}
		<ul class="points" role="list">
			{#each item.points as point, i (i)}
				<li>{point[lang]}</li>
			{/each}
		</ul>
	{/if}
	{#if item.link}
		<a class="cert" href={item.link} target="_blank" rel="noopener noreferrer"
			>{t.certificate} <span aria-hidden="true">↗</span> <span class="sr-only">{newTab}</span></a
		>
	{/if}
</article>

<style>
	.edu {
		padding: 1.125rem 0;
		border-bottom: 1px solid var(--rule);
	}
	.when {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--muted);
	}
	h4 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 800;
	}
	.title {
		margin: 0;
		font-weight: 600;
	}
	.points {
		margin: 0.25rem 0 0;
		padding: 0;
		list-style: none;
		font-size: 1rem;
		color: var(--body);
	}
	.cert {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		min-height: 2.25rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text);
	}
	.cert:hover {
		color: var(--accent);
	}
	/* Phone: school and diploma on one line, then one detail per line and the certificate link. */
	@media (width < 48rem) {
		.edu {
			padding: 0.75rem 0;
		}
		.when {
			font-size: 0.8125rem;
		}
		.name {
			line-height: 1.35;
		}
		h4,
		.title {
			display: inline;
		}
		h4 {
			font-size: 1.125rem;
		}
		.title {
			font-size: 0.9375rem;
			font-weight: 600;
			color: var(--body);
		}
		.title::before {
			content: ' · ';
		}
		.points {
			margin-top: 0.125rem;
			font-size: 0.875rem;
			line-height: 1.45;
			color: var(--muted);
		}
		.points li + li {
			margin-top: 0.125rem;
		}
		.cert {
			min-height: 2.75rem;
			font-size: 0.875rem;
		}
	}
</style>
