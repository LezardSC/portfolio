<script lang="ts">
	import { onMount } from 'svelte';
	import type { Dict, Lang } from '$lib/i18n';
	import { fill } from '$lib/i18n/format';
	import { durationLabel, durationMonths, periodPoints, type Job } from '$lib/experience';
	import { ICONS } from '$lib/data/icons';
	import Icon from '../Icon.svelte';
	import TechTags from '../projects/TechTags.svelte';
	import Period from './Period.svelte';

	let { job, lang, t }: { job: Job; lang: Lang; t: Dict['experience'] } = $props();

	const uid = $props.id();
	const quoteId = `${uid}-quote`;
	/** False in the prerendered HTML: without JS the quote shows and there is no button. */
	let ready = $state(false);
	let open = $state(false);
	const months = $derived(
		job.end ? durationLabel(durationMonths(job.start, job.end), t.months) : ''
	);

	onMount(() => {
		ready = true;
	});
</script>

<article class="job">
	<p class="when">
		<Period points={periodPoints(job.start, job.end, lang, t.present)} />
		{#if job.internship || months}
			<br /><span class="dur"
				>{[job.internship ? t.internship : '', months].filter(Boolean).join(' · ')}</span
			>
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
			{#if ready}
				<!-- Phone only (CSS): on desktop the quote is always shown. -->
				<button
					type="button"
					class="rec"
					aria-expanded={open}
					aria-controls={quoteId}
					onclick={() => (open = !open)}
				>
					<span class="rec-mark" aria-hidden="true">“</span>
					<span class="rec-label">{fill(t.recommendation, { name: job.quote.author })}</span>
					<Icon path={open ? ICONS.chevronUp : ICONS.chevronDown} size={16} stroke={2.2} />
				</button>
			{/if}
			<figure id={quoteId} class="quote" class:folded={ready && !open}>
				<span class="mark" aria-hidden="true">“</span>
				<blockquote>
					<p>{job.quote.text[lang]}</p>
				</blockquote>
				<figcaption>
					<strong>{job.quote.author}</strong> - {job.quote.role[lang]}
					{#if job.quote.original !== lang}<span class="note">{t.translated}</span>{/if}
				</figcaption>
			</figure>
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
	.rec {
		display: none;
	}
	/* Phone: dates on one line; the recommendation folded behind a button. */
	@media (width < 48rem) {
		.job {
			grid-template-columns: minmax(0, 1fr);
			gap: 0;
			padding: 1.25rem 0;
		}
		.when {
			font-size: 0.8125rem;
		}
		.when br {
			display: none;
		}
		.dur::before {
			content: ' · ';
		}
		h4 {
			margin-top: 0.25rem;
			font-size: 1.25rem;
		}
		.org {
			margin: 0 0 0.625rem;
			font-size: 1rem;
		}
		.points {
			margin: 0 0 0.75rem;
			padding-left: 1.125rem;
			font-size: 0.9375rem;
			line-height: 1.55;
		}
		.rec {
			display: flex;
			align-items: center;
			gap: 0.625rem;
			width: 100%;
			min-height: 3rem;
			margin-top: 0.75rem;
			padding: 0 0.875rem;
			background: var(--surface);
			border: 1.5px solid var(--border);
			border-radius: var(--radius);
			color: var(--text);
			font: inherit;
			font-size: 0.9375rem;
			font-weight: 600;
			text-align: left;
			cursor: pointer;
		}
		.rec:hover {
			border-color: var(--text);
		}
		.rec-mark {
			height: 1.25rem;
			font-size: 1.875rem;
			line-height: 1;
			font-weight: 800;
			color: var(--accent);
		}
		.rec-label {
			flex: 1;
		}
		.quote {
			display: block;
			margin: 0.5rem 0 0;
			padding: 1rem;
			border-width: 1.5px;
		}
		.quote.folded,
		.mark {
			display: none;
		}
		blockquote p {
			font-size: 0.9375rem;
		}
		figcaption {
			margin-top: 0.5rem;
			font-size: 0.8125rem;
		}
	}
</style>
