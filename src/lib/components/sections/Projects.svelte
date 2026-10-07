<script lang="ts">
	import { flip } from 'svelte/animate';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { PROJECTS } from '$lib/data/projects';
	import type { Dict, Lang } from '$lib/i18n';
	import { fill } from '$lib/i18n/format';
	import {
		filterProjects,
		LARGE_COUNT,
		NO_FILTERS,
		sortProjects,
		splitTiers,
		type Filters,
		type SortKey
	} from '$lib/projects';
	import ProjectCardLarge from '../projects/ProjectCardLarge.svelte';
	import ProjectCardSmall from '../projects/ProjectCardSmall.svelte';
	import ProjectFilters from '../projects/ProjectFilters.svelte';
	import Section from '../Section.svelte';

	let { lang, title, t }: { lang: Lang; title: string; t: Dict['projects'] } = $props();

	let filters = $state<Filters>({ ...NO_FILTERS });
	let sort = $state<SortKey>('featured');

	const tiers = $derived(splitTiers(sortProjects(filterProjects(PROJECTS, filters), sort)));
	const lead = $derived(
		fill(t.lead, { total: PROJECTS.length, featured: Math.min(LARGE_COUNT, PROJECTS.length) })
	);
	const ms = $derived(prefersReducedMotion.current ? 0 : 300);
</script>

<Section id="projects" {title} {lead}>
	<ProjectFilters projects={PROJECTS} bind:filters bind:sort {t} />

	{#if tiers.large.length === 0}
		<div class="empty">
			<p>{t.empty}</p>
			<button type="button" class="btn" onclick={() => (filters = { ...NO_FILTERS })}
				>{t.reset}</button
			>
		</div>
	{:else}
		<ul class="grid large" role="list">
			{#each tiers.large as project (project.id)}
				<li animate:flip={{ duration: ms }} in:fade={{ duration: ms }}>
					<ProjectCardLarge {project} {lang} {t} />
				</li>
			{/each}
		</ul>

		{#if tiers.small.length > 0}
			<h3 class="more">{t.more}</h3>
			<p class="more-lead">{t.moreLead}</p>
			<ul class="grid small" role="list">
				{#each tiers.small as project (project.id)}
					<li animate:flip={{ duration: ms }} in:fade={{ duration: ms }}>
						<ProjectCardSmall {project} {lang} {t} />
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</Section>

<style>
	.grid {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.large {
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 23.75rem), 1fr));
		gap: 3.5rem 2rem;
	}
	.small {
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 16.875rem), 1fr));
		gap: 1rem;
	}
	.more {
		margin: 5rem 0 0.375rem;
		font-size: 1.625rem;
		font-weight: 800;
	}
	.more-lead {
		margin: 0 0 1.5rem;
		font-size: 1rem;
		color: var(--muted);
	}
	@media (width < 48rem) {
		.large,
		.small {
			grid-template-columns: minmax(0, 1fr);
			gap: 1.5rem;
		}
		.more {
			margin-top: 2.5rem;
		}
	}
	.empty {
		display: grid;
		justify-items: center;
		gap: 1rem;
		padding: 3rem 1rem;
		border: 1px dashed var(--border);
		border-radius: var(--radius);
		color: var(--muted);
	}
	.empty p {
		margin: 0;
	}
</style>
