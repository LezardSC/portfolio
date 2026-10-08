<script lang="ts">
	import { CONTEXTS, DOMAINS } from '$lib/data/categories';
	import type { Dict, Lang } from '$lib/i18n';
	import { mainDomain, primaryLink, type Project } from '$lib/projects';
	import Icon from '../Icon.svelte';
	import ProjectLinks from './ProjectLinks.svelte';
	import TechTags from './TechTags.svelte';

	let { project, lang, t }: { project: Project; lang: Lang; t: Dict['projects'] } = $props();

	const href = $derived(primaryLink(project));
	const domain = $derived(DOMAINS[mainDomain(project)]);
	const year = $derived(project.date.slice(0, 4));
</script>

<article class="card" style:--dc={domain.color}>
	<div class="top">
		<span class="icon"><Icon path={domain.icon} size={22} /></span>
		<ProjectLinks {project} {t} compact />
	</div>
	<!-- Phone only: label, summary and context (CSS shows one set of texts per width). -->
	<p class="label">{domain.label[lang]} · {year}</p>
	<h4>
		{#if href}
			<a {href} target="_blank" rel="noopener noreferrer">{project.title}</a>
		{:else}
			{project.title}
		{/if}
	</h4>
	<p class="meta">{year} · {CONTEXTS[project.context].label[lang]} · {domain.label[lang]}</p>
	{#if project.award}
		<p class="award"><span aria-hidden="true">🏆</span> {project.award[lang]}</p>
	{/if}
	<p class="desc">{project.description[lang]}</p>
	<p class="summary">{project.summary[lang]}</p>
	<TechTags tech={project.tech} small />
	<p class="ctx">{CONTEXTS[project.context].label[lang]}</p>
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
	.label,
	.summary,
	.ctx {
		display: none;
	}
	.card > :global(ul) {
		margin-top: auto;
		padding-top: 0.375rem;
	}

	/* Phone: tile tinted by the main domain, big domain icon as a watermark, one-sentence summary,
	   context and link at the bottom. Colours from the --tile-* tokens (DOMAIN_TILE, tested). */
	@media (width < 48rem) {
		.card {
			--dfg: color-mix(in srgb, var(--dc) var(--tile-fg), #ffffff);
			position: relative;
			overflow: hidden;
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-rows: auto auto auto 1fr;
			grid-template-areas:
				'label label'
				'title title'
				'summary summary'
				'ctx links';
			gap: 0.375rem 0;
			min-height: 12.5rem;
			padding: 0.875rem 0.75rem 0.25rem;
			border: 0;
			background: color-mix(in srgb, var(--dc) var(--tile-pct), var(--tile-base));
		}
		.top {
			display: contents;
		}
		.icon {
			position: absolute;
			top: -1.625rem;
			right: -1.625rem;
			width: auto;
			height: auto;
			background: none;
			color: var(--dfg);
			opacity: 0.2;
			pointer-events: none;
		}
		.icon :global(svg) {
			width: 6.875rem;
			height: 6.875rem;
			stroke-width: 1.2;
		}
		/* Positioned so they paint above the (positioned) watermark. */
		.label,
		h4,
		.summary,
		.ctx,
		.card :global(.links) {
			position: relative;
		}
		.label {
			grid-area: label;
			display: block;
			margin: 0;
			font-size: 0.6875rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.07em;
			color: var(--dfg);
		}
		h4 {
			grid-area: title;
			margin: 0.25rem 0 0;
			font-size: 1.0625rem;
			line-height: 1.15;
			letter-spacing: -0.01em;
			overflow-wrap: anywhere;
		}
		.summary {
			grid-area: summary;
			display: block;
			margin: 0;
			font-size: 0.8125rem;
			line-height: 1.4;
			color: var(--body);
		}
		.meta,
		.award,
		.desc,
		.card > :global(ul) {
			display: none;
		}
		.ctx,
		.card :global(.links) {
			align-self: end;
			border-top: 1.5px solid color-mix(in srgb, var(--dfg) 35%, transparent);
		}
		.ctx {
			grid-area: ctx;
			display: flex;
			align-items: center;
			min-height: 2.75rem;
			margin: 0;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--muted);
		}
		.card :global(.links) {
			grid-area: links;
			padding-left: 0.375rem;
		}
		.card :global(.links a) {
			font-size: 0.8125rem;
			font-weight: 700;
		}
		.card :global(.private) {
			font-size: 0.75rem;
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
