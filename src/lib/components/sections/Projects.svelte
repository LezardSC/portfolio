<script lang="ts">
	import { flip } from 'svelte/animate';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { PROJECTS } from '$lib/data/projects';
	import type { Dict, Lang } from '$lib/i18n';
	import {
		filterProjects,
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
	const ms = $derived(prefersReducedMotion.current ? 0 : 300);
</script>

<Section id="projects" {title}>
	<ProjectFilters projects={PROJECTS} bind:filters bind:sort {t} />

	{#if tiers.large.length === 0}
		<div class="empty">
			<p>{t.empty}</p>
			<button type="button" onclick={() => (filters = { ...NO_FILTERS })}>{t.reset}</button>
		</div>
	{:else}
		<ul class="grid large">
			{#each tiers.large as project (project.id)}
				<li animate:flip={{ duration: ms }} in:fade={{ duration: ms }}>
					<ProjectCardLarge {project} {lang} {t} />
				</li>
			{/each}
		</ul>

		{#if tiers.small.length > 0}
			<p class="divider">{t.more}</p>
			<ul class="grid small">
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
		gap: 1.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.large {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.small {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
	@media (max-width: 64rem) {
		.small {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 48rem) {
		.large,
		.small {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	.divider {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 3rem 0 1.5rem;
		color: var(--muted);
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		border-top: 1px solid var(--border);
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
	.empty button {
		padding: 0.4rem 1rem;
		border: 1px solid var(--accent);
		border-radius: 999px;
		background: transparent;
		color: var(--accent);
		font: inherit;
		cursor: pointer;
	}
</style>
