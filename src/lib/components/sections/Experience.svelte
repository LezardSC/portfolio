<script lang="ts">
	import { EDUCATION, HACKATHONS, JOBS } from '$lib/data/experience';
	import {
		hackathonsNewestFirst,
		localize,
		MEDAL_EMOJI,
		newestFirst,
		yearOf
	} from '$lib/experience';
	import type { Dict, Lang } from '$lib/i18n';
	import EducationItem from '../experience/EducationItem.svelte';
	import JobItem from '../experience/JobItem.svelte';
	import Section from '../Section.svelte';

	let { lang, title, t }: { lang: Lang; title: string; t: Dict['experience'] } = $props();

	const jobs = newestFirst(JOBS);
	const education = newestFirst(EDUCATION);
	const hackathons = hackathonsNewestFirst(HACKATHONS);
</script>

<Section id="experience" {title}>
	<div class="columns">
		<div>
			<h3 id="experience-work">{t.work}</h3>
			<ol class="timeline" aria-labelledby="experience-work">
				{#each jobs as job (job.company + job.start)}
					<li><JobItem {job} {lang} {t} /></li>
				{/each}
			</ol>
		</div>
		<div>
			<h3 id="experience-education">{t.education}</h3>
			<ol class="timeline" aria-labelledby="experience-education">
				{#each education as item (item.school + item.end)}
					<li><EducationItem {item} {lang} {t} /></li>
				{/each}
			</ol>
			<h3 id="experience-hackathons" class="later">{t.hackathons}</h3>
			<ul class="hackathons" aria-labelledby="experience-hackathons">
				{#each hackathons as h (h.event + h.date)}
					<li>
						<span aria-hidden="true">{MEDAL_EMOJI[h.medal]}</span>
						<span class="sr-only">{t.places[h.medal]}:</span>
						{#if h.fullName}<abbr title={h.fullName}>{h.event}</abbr>{:else}{h.event}{/if}
						{yearOf(h.date)}{#if h.project}<span class="project"
								>{` · ${localize(h.project, lang)}`}</span
							>{/if}
					</li>
				{/each}
			</ul>
		</div>
	</div>
</Section>

<style>
	.columns {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 2.5rem;
	}
	@media (min-width: 56.25rem) {
		.columns {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 3rem;
		}
	}
	h3 {
		margin: 0 0 1.25rem;
		font-size: 1.3rem;
	}
	h3.later {
		margin-top: 2.5rem;
	}
	.timeline {
		margin: 0;
		padding: 0;
		list-style: none;
		border-left: 2px solid var(--border);
	}
	.timeline > li {
		position: relative;
		padding: 0 0 2rem 1.5rem;
	}
	.timeline > li:last-child {
		padding-bottom: 0;
	}
	/* Dot centred on the 2px line: 12px dot, shifted left by half its width plus half the line. */
	.timeline > li::before {
		content: '';
		position: absolute;
		left: -7px;
		top: 0.35rem;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 3px var(--bg);
	}
	.hackathons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.hackathons li {
		max-width: 100%;
		padding: 0.45rem 0.9rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		font-weight: 500;
	}
	.project {
		color: var(--muted);
		font-weight: 400;
	}
</style>
