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

	let {
		lang,
		title,
		t,
		newTab
	}: { lang: Lang; title: string; t: Dict['experience']; newTab: string } = $props();

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
					<li><EducationItem {item} {lang} {t} {newTab} /></li>
				{/each}
			</ol>
			<h3 id="experience-hackathons" class="later">{t.hackathons}</h3>
			<ol class="timeline compact" aria-labelledby="experience-hackathons">
				{#each hackathons as h (h.event + h.date)}
					<li>
						<span class="medal" aria-hidden="true">{MEDAL_EMOJI[h.medal]}</span>
						<p class="event">
							<span class="sr-only">{t.places[h.medal]}:</span>
							{#if h.fullName}<abbr title={h.fullName}>{h.event}</abbr>{:else}{h.event}{/if}
							{yearOf(h.date)}
						</p>
						{#if h.project}<p class="project">{localize(h.project, lang)}</p>{/if}
					</li>
				{/each}
			</ol>
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
	/* Hackathons: tighter entries, and the medal replaces the dot, centred on the line. */
	.compact > li {
		padding-bottom: 1rem;
	}
	.compact > li::before {
		content: none;
	}
	.medal {
		position: absolute;
		left: calc(-0.8rem - 1px);
		top: 0;
		width: 1.6rem;
		text-align: center;
		line-height: 1.6;
		background: var(--bg);
	}
	.event,
	.project {
		margin: 0;
	}
	.event {
		font-weight: 600;
	}
	.project {
		font-size: 0.9rem;
		color: var(--muted);
	}
</style>
