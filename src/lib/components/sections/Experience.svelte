<script lang="ts">
	import { EDUCATION, HACKATHONS, JOBS } from '$lib/data/experience';
	import { ICONS } from '$lib/data/icons';
	import { hackathonsNewestFirst, newestFirst, yearOf } from '$lib/experience';
	import { localize } from '$lib/i18n/lang';
	import type { Dict, Lang } from '$lib/i18n';
	import { fill } from '$lib/i18n/format';
	import EducationItem from '../experience/EducationItem.svelte';
	import JobItem from '../experience/JobItem.svelte';
	import Icon from '../Icon.svelte';
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
	<h3 id="experience-work" class="sub">{t.work}</h3>
	<ol role="list" class="list" aria-labelledby="experience-work">
		{#each jobs as job (job.company + job.start)}
			<li><JobItem {job} {lang} {t} /></li>
		{/each}
	</ol>
	<div class="lower">
		<div>
			<h3 id="experience-education" class="sub">{t.education}</h3>
			<ol role="list" class="list" aria-labelledby="experience-education">
				{#each education as item (item.school + item.end)}
					<li><EducationItem {item} {lang} {t} {newTab} /></li>
				{/each}
			</ol>
		</div>
		<div>
			<h3 id="experience-hackathons" class="sub">
				{fill(t.hackathonsTitle, { n: hackathons.length })}
			</h3>
			<ol role="list" class="list" aria-labelledby="experience-hackathons">
				{#each hackathons as h (h.event + h.date)}
					<li class="hk">
						<span class="tile" class:win={h.medal === 1}>
							<Icon path={h.medal === 1 ? ICONS.trophy : ICONS.medal} size={20} stroke={2} />
						</span>
						<p class="event">
							<strong
								>{#if h.fullName}<abbr title={h.fullName}>{h.event}</abbr
									>{:else}{h.event}{/if}</strong
							>
							<span class="detail"
								>{#if h.project}{localize(h.project, lang)}{' · '}{/if}<time datetime={h.date}
									>{yearOf(h.date)}</time
								></span
							>
						</p>
						<span class="res" class:win={h.medal === 1}>{t.results[h.medal]}</span>
					</li>
				{/each}
			</ol>
		</div>
	</div>
</Section>

<style>
	.sub {
		margin: 0 0 0.25rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--accent);
	}
	.list {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.lower {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
		gap: 3rem;
		margin-top: 3.5rem;
	}
	.hk {
		display: grid;
		grid-template-columns: 2.75rem minmax(0, 1fr) auto;
		gap: 0.875rem;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--rule);
	}
	.tile {
		display: inline-grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-sm);
		background: var(--tag);
		color: var(--muted);
	}
	.tile.win {
		background: var(--tint);
		color: var(--accent);
	}
	.event {
		margin: 0;
		min-width: 0;
		line-height: 1.35;
	}
	.event strong,
	.detail {
		display: block;
	}
	.detail {
		font-size: 0.9375rem;
		color: var(--muted);
	}
	abbr {
		text-decoration: none;
	}
	.res {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--body);
		white-space: nowrap;
	}
	.res.win {
		font-weight: 800;
		color: var(--accent);
	}
	@media (width < 48rem) {
		.sub {
			margin: 2rem 0 0.25rem;
			font-size: 0.875rem;
		}
		.sub:first-child {
			margin-top: 0;
		}
		.lower {
			gap: 0;
			margin-top: 0;
		}
		.hk {
			grid-template-columns: 2.25rem minmax(0, 1fr) auto;
			gap: 0.75rem;
			padding: 0.625rem 0;
		}
		.tile {
			width: 2.25rem;
			height: 2.25rem;
		}
		.tile :global(svg) {
			width: 18px;
			height: 18px;
		}
		.event {
			font-size: 0.9375rem;
			line-height: 1.3;
		}
		.detail,
		.res {
			font-size: 0.8125rem;
		}
	}
</style>
