<script lang="ts">
	import type { Dict, Lang } from '$lib/i18n';
	import { periodPoints, quoted, type Job } from '$lib/experience';
	import TechTags from '../projects/TechTags.svelte';
	import Period from './Period.svelte';

	let { job, lang, t }: { job: Job; lang: Lang; t: Dict['experience'] } = $props();
</script>

<article>
	<p class="period">
		<Period
			points={periodPoints(job.start, job.end, lang, t.present)}
		/>{#if job.internship}{' · '}{t.internship}{/if}
	</p>
	<h4>{job.role[lang]}</h4>
	<p class="org">{job.company}</p>
	<ul class="points">
		{#each job.points as point, i (i)}
			<li>{point[lang]}</li>
		{/each}
	</ul>
	<TechTags tech={job.tech} />
	{#if job.quote}
		<blockquote>
			<p>{quoted(job.quote.text[lang], lang)}</p>
			<footer>
				— {job.quote.author}, {job.quote.role[lang]}
				{#if job.quote.original !== lang}<span class="note">{t.translated}</span>{/if}
			</footer>
		</blockquote>
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
		margin: 0 0 0.75rem;
		padding-left: 1.1rem;
	}
	.points li + li {
		margin-top: 0.25rem;
	}
	blockquote {
		margin: 1rem 0 0;
		padding: 0.25rem 0 0.25rem 1rem;
		border-left: 3px solid var(--accent);
	}
	blockquote p {
		margin: 0;
		font-style: italic;
	}
	footer {
		margin-top: 0.4rem;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.note {
		display: block;
	}
</style>
