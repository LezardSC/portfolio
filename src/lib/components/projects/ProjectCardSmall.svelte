<script lang="ts">
	import type { Dict, Lang } from '$lib/i18n';
	import { primaryLink, type Project } from '$lib/projects';
	import DomainIcon from './DomainIcon.svelte';
	import ProjectLinks from './ProjectLinks.svelte';
	import TechTags from './TechTags.svelte';

	let { project, lang, t }: { project: Project; lang: Lang; t: Dict['projects'] } = $props();

	const href = $derived(primaryLink(project));
</script>

<article class="card">
	<div class="top">
		<span class="icon"><DomainIcon domain={project.domains[0]} /></span>
		<ProjectLinks {project} {t} />
	</div>
	<h3>
		{#if href}
			<a {href} target="_blank" rel="noopener noreferrer">{project.title}</a>
		{:else}
			{project.title}
		{/if}
	</h3>
	<p class="meta">
		{project.date.slice(0, 4)} · {t.contexts[project.context]}
		{#if project.award}
			<!-- Phone only (the award line is hidden there); display: none elsewhere, so it is never read twice. -->
			<span class="trophy"
				><span aria-hidden="true">🏆</span><span class="sr-only">{project.award[lang]}</span></span
			>
		{/if}
	</p>
	{#if project.award}
		<p class="award"><span aria-hidden="true">🏆</span> {project.award[lang]}</p>
	{/if}
	<p class="desc">{project.description[lang]}</p>
	<TechTags tech={project.tech} />
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: 100%;
		padding: 1.5rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}
	.icon {
		color: var(--accent);
	}
	h3 {
		margin: 0;
		font-size: 1.15rem;
	}
	h3 a {
		color: inherit;
		text-decoration: none;
	}
	h3 a:hover {
		color: var(--accent);
	}
	.meta,
	.award {
		margin: 0;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.trophy {
		display: none;
	}
	.desc {
		flex: 1;
		margin: 0;
		color: var(--muted);
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
	}

	/* Phone: one compact row — icon | title over year · context | links, then two lines of text. */
	@media (width < 48rem) {
		.card {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr) auto;
			grid-template-areas:
				'icon title links'
				'icon meta links'
				'desc desc desc';
			align-items: center;
			gap: 0 0.75rem;
			height: auto;
			padding: 0.9rem 1rem;
		}
		.top {
			display: contents;
		}
		.icon {
			grid-area: icon;
			align-self: start;
		}
		.card :global(.links) {
			grid-area: links;
		}
		h3 {
			grid-area: title;
			font-size: 1.05rem;
		}
		.meta {
			grid-area: meta;
		}
		.trophy {
			display: inline;
		}
		.award,
		.card > :global(ul) {
			display: none;
		}
		.desc {
			grid-area: desc;
			margin-top: 0.5rem;
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}
	}

	@media (hover: hover) and (pointer: fine) {
		.card {
			transition:
				transform 0.2s,
				border-color 0.2s;
		}
		.card:hover,
		.card:focus-within {
			transform: translateY(-2px);
			border-color: var(--accent);
		}
	}
	@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: reduce) {
		.card:hover,
		.card:focus-within {
			transform: none;
		}
	}
</style>
