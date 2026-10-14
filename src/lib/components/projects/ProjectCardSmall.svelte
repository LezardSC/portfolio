<script lang="ts">
	import { CONTEXTS, DOMAINS } from '$lib/data/categories';
	import { HACKATHONS } from '$lib/data/experience';
	import { projectResults } from '$lib/experience';
	import type { Dict, Lang } from '$lib/i18n';
	import { mainDomain, primaryLink, type Project } from '$lib/projects';
	import Icon from '../Icon.svelte';
	import ProjectLinks from './ProjectLinks.svelte';
	import ResultMedals from './ResultMedals.svelte';
	import TechTags from './TechTags.svelte';

	let { project, lang, t }: { project: Project; lang: Lang; t: Dict['projects'] } = $props();

	const href = $derived(primaryLink(project));
	const domain = $derived(DOMAINS[mainDomain(project)]);
	const year = $derived(project.date.slice(0, 4));
	const results = $derived(projectResults(project.id, HACKATHONS));
</script>

<article class="card" style:--dc={domain.color}>
	<div class="top">
		<span class="icon"><Icon path={domain.icon} size={22} /></span>
		<ProjectLinks {project} {t} compact />
	</div>
	<!-- Phone only: label and context (CSS shows one set of texts per width). -->
	<p class="label">{domain.label[lang]} · {year}</p>
	<div class="head">
		<h4>
			{#if href}
				<a {href} target="_blank" rel="noopener noreferrer">{project.title}</a>
			{:else}
				{project.title}
			{/if}
		</h4>
		<ResultMedals {results} {t} />
	</div>
	<p class="meta">{year} · {CONTEXTS[project.context].label[lang]} · {domain.label[lang]}</p>
	{#if project.company}
		<p class="award"><span aria-hidden="true">💼</span> {project.company}</p>
	{/if}
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
	/* Title, then the hackathon medals on the same line. */
	.head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}
	h4 {
		min-width: 0;
		margin: 0;
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
	.summary {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--body);
	}
	.label,
	.ctx {
		display: none;
	}
	.card > :global(ul) {
		margin-top: auto;
		padding-top: 0.375rem;
	}

	/* Phone: tile tinted by the main domain, big domain icon as a watermark, one-sentence summary,
	   context and link at the bottom. Colours from the --tile-* tokens. */
	@media (width < 48rem) {
		.card {
			--dfg: color-mix(in srgb, var(--dc) var(--tile-fg), #ffffff);
			position: relative;
			overflow: hidden;
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-rows: auto auto auto 1fr auto;
			grid-template-areas:
				'label label'
				'title title'
				'summary summary'
				'. .'
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
		/* Positioned so they paint above the (positioned) watermark. The links box itself stays
		   static so the demo link can be placed against the card. */
		.label,
		.head,
		.summary,
		.ctx,
		.card :global(.links a),
		.card :global(.private) {
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
		.head {
			grid-area: title;
			gap: 0.375rem;
		}
		.head :global(svg) {
			width: 1rem;
			height: 1rem;
		}
		h4 {
			font-size: 0.94rem;
			line-height: 1.15;
			letter-spacing: -0.01em;
			overflow-wrap: anywhere;
		}
		.summary {
			grid-area: summary;
			font-size: 0.8125rem;
			line-height: 1.4;
		}
		.meta,
		.award,
		.card > :global(ul) {
			display: none;
		}
		.ctx,
		.card :global(.links) {
			/* Same height, so the separator is one level line. */
			align-self: stretch;
			border-top: 1.5px solid color-mix(in srgb, var(--dfg) 35%, transparent);
		}
		.ctx {
			grid-area: ctx;
			display: flex;
			align-items: center;
			min-height: 2.25rem;
			margin: 0;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--muted);
		}
		.card :global(.links) {
			grid-area: links;
			padding-left: 0.375rem;
		}
		.card :global(.links a),
		.card :global(.private) {
			min-height: 2.25rem;
		}
		/* No room for two links at the bottom: with code too, the demo goes top right, level with
		   the label (which leaves it room). */
		.card :global(.links:has(.repo) .demo) {
			position: absolute;
			top: 0.375rem;
			right: 0.75rem;
		}
		.card:has(:global(.repo)):has(:global(.demo)) .label {
			padding-right: 3.75rem;
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
