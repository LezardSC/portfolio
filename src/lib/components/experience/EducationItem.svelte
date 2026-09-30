<script lang="ts">
	import type { Dict, Lang } from '$lib/i18n';
	import { formatPeriod, type Education } from '$lib/experience';

	let { item, lang, t }: { item: Education; lang: Lang; t: Dict['experience'] } = $props();
</script>

<article>
	<p class="period">{formatPeriod(item.start, item.end, lang, t.present)}</p>
	<h4>
		{#if item.link}
			<a href={item.link} target="_blank" rel="noopener noreferrer"
				>{item.title[lang]} <span class="sr-only">{t.newTab}</span></a
			>
		{:else}
			{item.title[lang]}
		{/if}
	</h4>
	<p class="org">{item.school}</p>
	{#if item.points.length > 0}
		<ul class="points">
			{#each item.points as point, i (i)}
				<li>{point[lang]}</li>
			{/each}
		</ul>
	{/if}
</article>

<style>
	.period {
		margin: 0;
		font-size: 0.85rem;
		color: var(--muted);
	}
	h4 {
		margin: 0.15rem 0 0;
		font-size: 1.1rem;
	}
	.org {
		margin: 0 0 0.5rem;
		font-weight: 500;
	}
	.points {
		margin: 0;
		padding-left: 1.1rem;
	}
</style>
