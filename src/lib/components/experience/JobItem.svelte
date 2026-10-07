<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import type { Dict, Lang } from '$lib/i18n';
	import {
		durationLabel,
		durationMonths,
		ONE_COLUMN_QUERY,
		periodPoints,
		quoteView,
		type Job
	} from '$lib/experience';
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
	const months = $derived(
		job.end ? durationLabel(durationMonths(job.start, job.end), t.months) : ''
	);

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

<article class="job">
	<p class="when">
		<Period points={periodPoints(job.start, job.end, lang, t.present)} />
		{#if job.internship || months}
			<br />{[job.internship ? t.internship : '', months].filter(Boolean).join(' · ')}
		{/if}
	</p>
	<div class="what">
		<h4>{job.role[lang]}</h4>
		<p class="org">{job.company}</p>
		<ul class="points">
			{#each job.points as point, i (i)}
				<li>{point[lang]}</li>
			{/each}
		</ul>
		<TechTags tech={job.tech} />
		{#if job.quote}
			<figure class="quote">
				<span class="mark" aria-hidden="true">“</span>
				<blockquote>
					<p id={quoteId} class:clamp bind:this={quoteEl}>{job.quote.text[lang]}</p>
				</blockquote>
				<figcaption>
					<strong>{job.quote.author}</strong> — {job.quote.role[lang]}
					{#if job.quote.original !== lang}<span class="note">{t.translated}</span>{/if}
				</figcaption>
			</figure>
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
	</div>
</article>

<style>
	.job {
		display: grid;
		grid-template-columns: 11.875rem minmax(0, 1fr);
		gap: 0.5rem 2rem;
		padding: 1.75rem 0;
		border-bottom: 1px solid var(--rule);
	}
	.when {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--muted);
	}
	.what {
		min-width: 0;
	}
	h4 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 800;
		line-height: 1.25;
	}
	.org {
		margin: 0.125rem 0 0.75rem;
		font-weight: 700;
		color: var(--accent);
	}
	.points {
		margin: 0 0 0.875rem;
		padding-left: 1.25rem;
		color: var(--body);
	}
	.points li + li {
		margin-top: 0.25rem;
	}
	.quote {
		display: grid;
		grid-template-columns: 2.25rem minmax(0, 1fr);
		gap: 0.5rem;
		margin: 1.25rem 0 0;
		padding: 1.25rem 1.5rem 1.25rem 1rem;
		background: var(--surface);
		border: 2px solid var(--border);
		border-radius: var(--radius);
	}
	.mark {
		grid-row: span 2;
		font-size: 3.25rem;
		line-height: 0.8;
		font-weight: 800;
		color: var(--accent);
	}
	blockquote,
	figcaption {
		grid-column: 2;
		min-width: 0;
	}
	blockquote {
		margin: 0;
	}
	blockquote p {
		margin: 0;
		font-size: 1.0625rem;
		line-height: 1.55;
	}
	figcaption {
		margin-top: 0.125rem;
		font-size: 0.9375rem;
		color: var(--muted);
	}
	figcaption strong {
		color: var(--text);
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
		padding: 0;
		border: none;
		background: none;
		color: var(--accent);
		font: inherit;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
	}
	.more:hover {
		text-decoration: underline;
	}
	@media (width < 48rem) {
		.job {
			grid-template-columns: minmax(0, 1fr);
		}
		.quote {
			padding: 1rem;
		}
	}
</style>
