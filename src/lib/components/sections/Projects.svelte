<script lang="ts">
	import { flip } from 'svelte/animate';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { PRIORITY, PROJECTS } from '$lib/data/projects';
	import { hydrated } from '$lib/hydrated.svelte';
	import type { Dict, Lang } from '$lib/i18n';
	import { plural } from '$lib/i18n/format';
	import {
		filterProjects,
		NO_FILTERS,
		sortProjects,
		splitProjects,
		type Filters,
		type SortKey
	} from '$lib/projects';
	import ProjectCardLarge from '../projects/ProjectCardLarge.svelte';
	import ProjectCardSmall from '../projects/ProjectCardSmall.svelte';
	import ProjectFilters from '../projects/ProjectFilters.svelte';
	import Section from '../Section.svelte';

	let { lang, title, t }: { lang: Lang; title: string; t: Dict['projects'] } = $props();

	let filters = $state<Filters>({ ...NO_FILTERS });
	let sort = $state<SortKey>('priority');

	const sorted = $derived(sortProjects(filterProjects(PROJECTS, filters), sort, PRIORITY));
	const layout = $derived(splitProjects(sorted));
	const ms = $derived(prefersReducedMotion.current ? 0 : 300);

	/** False in the prerendered HTML: without JS every project shows and there is no button. */
	const ready = hydrated();
	/** Which list is unfolded: any filter or sort change gives a new key, so the other projects fold back. */
	const listKey = $derived(JSON.stringify([filters.context, filters.domain, sort]));
	let unfoldedKey = $state<string | null>(null);
	const showAll = $derived(unfoldedKey === listKey);
</script>

<Section id="projects" {title}>
	<ProjectFilters projects={PROJECTS} bind:filters bind:sort {lang} {t} />

	{#if layout.large.length === 0}
		<div class="empty">
			<p>{t.empty}</p>
			<button type="button" class="btn" onclick={() => (filters = { ...NO_FILTERS })}
				>{t.reset}</button
			>
		</div>
	{:else}
		<ul class="grid large" role="list">
			{#each layout.large as project (project.id)}
				<li animate:flip={{ duration: ms }} in:fade={{ duration: ms }}>
					<ProjectCardLarge {project} {lang} {t} />
				</li>
			{/each}
		</ul>

		{#if layout.others.length > 0}
			<!-- Before the list, not after: the projects unfold below the button instead of pushing it out of view. -->
			{#if ready.current}
				<button
					type="button"
					class="btn show-more"
					aria-expanded={showAll}
					aria-controls="more-projects"
					onclick={() => (unfoldedKey = showAll ? null : listKey)}
				>
					{showAll ? t.showFewer : plural(layout.others.length, t.showMore, lang)}
				</button>
			{/if}
			<div id="more-projects" hidden={ready.current && !showAll}>
				<h3 class="more">{t.more}</h3>
				<ul class="grid small" role="list">
					{#each layout.others as project (project.id)}
						<li animate:flip={{ duration: ms }} in:fade={{ duration: ms }}>
							<ProjectCardSmall {project} {lang} {t} />
						</li>
					{/each}
				</ul>
			</div>
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
		/* 20rem rather than the canvas's 23.75rem: same 2 columns at 1440px, and still 2 at 1024px. */
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
		/* Every row as tall as the tallest card, so all featured cards have the same size; each
		   card pins its footer (techs + link) to the bottom, so footers line up too. */
		grid-auto-rows: 1fr;
		gap: 3.5rem 2rem;
	}
	.small {
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 16.875rem), 1fr));
		gap: 1rem;
	}
	.more {
		margin: 4rem 0 1.5rem;
		font-size: 1.625rem;
		font-weight: 800;
	}
	.show-more {
		display: flex;
		justify-content: center;
		width: min(100%, 22rem);
		margin: 3rem auto 0;
	}
	@media (width < 48rem) {
		.large {
			grid-template-columns: minmax(0, 1fr);
			grid-auto-rows: auto;
			gap: 0.875rem;
		}
		.small {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.625rem;
		}
		.more {
			margin: 2rem 0 1.375rem;
			font-size: 1.3125rem;
		}
		.show-more {
			width: 100%;
			margin-top: 1.5rem;
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
