<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import type { Dict, Lang } from '$lib/i18n';
	import { ONE_COLUMN_QUERY, periodPoints, quoted, quoteView, type Job } from '$lib/experience';
	import TechTags from '../projects/TechTags.svelte';
	import Period from './Period.svelte';

	let { job, lang, t }: { job: Job; lang: Lang; t: Dict['experience'] } = $props();

	const uid = $props.id();
	const quoteId = `${uid}-quote`;
	const narrow = new MediaQuery(ONE_COLUMN_QUERY, false);
	/** False in the prerendered HTML: without JS the whole quote shows and there is no button. */
	let ready = $state(false);
	let expanded = $state(false);
	let overflows = $state(false);
	let quoteEl = $state<HTMLElement>();

	const view = $derived(quoteView({ narrow: narrow.current, overflows, expanded }));
	const clamp = $derived(ready && view.clamp);

	$effect(() => {
		ready = true;
	});

	// Measure while clamped (on first clamp and on every resize): does the quote need the button?
	$effect(() => {
		const el = quoteEl;
		if (!el || !clamp) return;
		const measure = () => (overflows = el.scrollHeight > el.clientHeight + 1);
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	});
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
			<p id={quoteId} class:clamp bind:this={quoteEl}>{quoted(job.quote.text[lang], lang)}</p>
			<footer>
				— {job.quote.author}, {job.quote.role[lang]}
				{#if job.quote.original !== lang}<span class="note">{t.translated}</span>{/if}
			</footer>
		</blockquote>
		{#if ready && view.button}
			<button
				type="button"
				class="more"
				aria-expanded={expanded}
				aria-controls={quoteId}
				onclick={() => (expanded = !expanded)}
			>
				{expanded ? t.showLess : t.readMore}
			</button>
		{/if}
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
	.clamp {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}
	.more {
		min-height: var(--tap);
		margin-left: calc(1rem + 3px);
		padding: 0;
		border: none;
		background: none;
		color: var(--accent);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}
	.more:hover {
		text-decoration: underline;
	}
</style>
