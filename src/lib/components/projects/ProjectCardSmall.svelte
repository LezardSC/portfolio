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
		<span class="icon"><DomainIcon domain={project.domains[0]} size={22} /></span>
		<ProjectLinks {project} {t} compact />
	</div>
	<h4>
		{#if href}
			<a {href} target="_blank" rel="noopener noreferrer">{project.title}</a>
		{:else}
			{project.title}
		{/if}
	</h4>
	<p class="meta">
		{project.date.slice(0, 4)} · {t.contexts[project.context]}<span class="dom-name"
			>{' · '}{t.domains[project.domains[0]]}</span
		>
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
	<TechTags tech={project.tech} small />
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: 100%;
		padding: 1.375rem;
		border: 2px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.icon {
		display: inline-grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		flex: none;
		border-radius: var(--radius-sm);
		background: var(--tint);
		color: var(--accent);
	}
	h4 {
		margin: 0.25rem 0 0;
		font-size: 1.1875rem;
		font-weight: 800;
		line-height: 1.25;
	}
	h4 a {
		color: inherit;
		text-decoration: none;
	}
	h4 a:hover {
		color: var(--accent);
	}
	.meta,
	.award {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--muted);
	}
	.trophy {
		display: none;
	}
	.desc {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--body);
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
	}
	.card > :global(ul) {
		margin-top: auto;
		padding-top: 0.375rem;
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
		h4 {
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
		.card {
			border-width: 1px;
		}
		.dom-name {
			display: none;
		}
		.icon {
			width: auto;
			height: auto;
			background: none;
		}
	}

	@media (hover: hover) and (pointer: fine) {
		.card {
			transition:
				transform 0.2s,
				border-color 0.2s,
				box-shadow 0.2s;
		}
		.card:hover,
		.card:focus-within {
			transform: translateY(-4px);
			border-color: var(--text);
			box-shadow: 6px 6px 0 var(--accent);
		}
	}
	@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: reduce) {
		.card:hover,
		.card:focus-within {
			transform: none;
		}
	}
</style>
