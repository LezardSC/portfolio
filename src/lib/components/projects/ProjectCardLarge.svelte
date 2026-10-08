<script lang="ts">
	import { CONTEXTS, DOMAINS } from '$lib/data/categories';
	import type { Dict, Lang } from '$lib/i18n';
	import { mainDomain, type Project } from '$lib/projects';
	import Icon from '../Icon.svelte';
	import TrophyIcon from '../icons/TrophyIcon.svelte';
	import ProjectLinks from './ProjectLinks.svelte';
	import ProjectMedia from './ProjectMedia.svelte';
	import TechTags from './TechTags.svelte';

	let { project, lang, t }: { project: Project; lang: Lang; t: Dict['projects'] } = $props();

	const domain = $derived(DOMAINS[mainDomain(project)]);
</script>

<article class="card" class:has-media={!!project.media} style:--dc={domain.color}>
	<ProjectMedia {project} />
	{#if !project.media}
		<span class="wm"><Icon path={domain.icon} size={160} /></span>
	{/if}
	<div class="body">
		<p class="meta">
			<span class="dom"><Icon path={domain.icon} size={18} />{domain.label[lang]}</span>
			<span>{project.date.slice(0, 4)} · {CONTEXTS[project.context].label[lang]}</span>
		</p>
		<h3><span class="title">{project.title}</span></h3>
		{#if project.award}
			<p class="award"><TrophyIcon /> {project.award[lang]}</p>
		{/if}
		<p class="desc">{project.description[lang]}</p>
		<div class="footer">
			<TechTags tech={project.tech} />
			<ProjectLinks {project} {t} />
		</div>
	</div>
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 1.125rem;
		height: 100%;
	}
	.card > :global(.media) {
		border-radius: var(--radius);
	}
	.wm {
		display: none;
	}
	.body {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.75rem;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.875rem;
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--muted);
	}
	.dom {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--accent);
	}
	h3 {
		margin: 0;
		font-size: 2rem;
		line-height: 1.15;
		font-weight: 800;
		letter-spacing: -0.025em;
	}
	.title {
		background-image: linear-gradient(var(--accent), var(--accent));
		background-size: 0 3px;
		background-repeat: no-repeat;
		background-position: 0 100%;
		transition: background-size 0.3s;
	}
	.award {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		color: var(--accent);
	}
	.desc {
		margin: 0;
		font-size: 1.0625rem;
		color: var(--body);
	}
	/* Same height in every card (room for two rows of tags), with the link on the first row, so
	   the separator lines up across a row whatever the number of tags. */
	.footer {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		/* padding 10 + tag offset 8 + two 28px tag rows + 6px gap. */
		min-height: 5rem;
		margin-top: auto;
		padding-top: 0.625rem;
		border-top: 1px solid var(--rule);
	}
	.footer > :global(ul) {
		flex: 1;
		min-width: 0;
		padding-top: 0.5rem;
	}

	/* Phone: the photo (or the domain colour) fills the card under a dark veil; text at the bottom.
	   Light text in both themes; colours mirror OVERLAY in src/lib/overlay.ts (tested). */
	@media (width < 48rem) {
		.card {
			--veil: 0.35;
			position: relative;
			isolation: isolate;
			overflow: hidden;
			justify-content: flex-end;
			gap: 0;
			height: auto;
			min-height: 18.75rem;
			padding: 1.125rem 1.125rem 0.5rem;
			border: 2px solid var(--text);
			border-radius: var(--radius);
			background: var(--dc);
			color: #f3f0e8;
		}
		.card.has-media {
			--veil: 0.62;
		}
		.card::before {
			content: '';
			position: absolute;
			inset: 0;
			z-index: -1;
			background: #10100e;
			opacity: var(--veil);
		}
		/* Bigger than the card so the blur has no soft edge. */
		.card > :global(.media) {
			position: absolute;
			inset: -1rem;
			z-index: -2;
			aspect-ratio: auto;
			border-radius: 0;
			filter: blur(var(--blur, 6px));
		}
		/* No photo: the domain colour is the ground (the empty media box would cover it). */
		.card:not(.has-media) > :global(.media) {
			display: none;
		}
		.wm {
			display: block;
			position: absolute;
			top: -1.75rem;
			right: -1.75rem;
			z-index: -1;
			color: #ffffff;
			opacity: 0.15;
			pointer-events: none;
		}
		.body {
			--text: #ffffff;
			--muted: #d6d1c6;
			flex: none;
			gap: 0.5rem;
		}
		.meta {
			gap: 0.25rem 0.625rem;
			font-size: 0.8125rem;
			color: #d6d1c6;
		}
		.dom {
			font-weight: 600;
			color: #ffa58c;
		}
		.dom :global(svg) {
			width: 1rem;
			height: 1rem;
		}
		h3 {
			font-size: 1.4375rem;
			letter-spacing: -0.02em;
			color: #ffffff;
		}
		.title {
			background: none;
		}
		.award {
			align-items: flex-start;
			font-size: 0.875rem;
			line-height: 1.35;
			color: #ffb59f;
		}
		.award :global(svg) {
			flex: none;
		}
		.desc {
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 3;
			line-clamp: 3;
			overflow: hidden;
			font-size: 0.9375rem;
			line-height: 1.5;
			color: #ece8df;
		}
		.footer {
			flex-wrap: wrap;
			align-items: center;
			gap: 0.375rem;
			min-height: 0;
			margin-top: 0.125rem;
			padding-top: 0.375rem;
			border-top: 1px solid rgb(255 255 255 / 0.2);
		}
		.footer > :global(ul) {
			padding-top: 0;
		}
		.footer :global(li) {
			background: rgb(255 255 255 / 0.16);
			color: #f3f0e8;
		}
		.footer :global(a) {
			font-weight: 700;
			color: #ffffff;
		}
		.footer :global(.private) {
			font-size: 0.8125rem;
			color: #d6d1c6;
		}
	}

	@media (hover: hover) and (pointer: fine) {
		.card:hover .title,
		.card:focus-within .title {
			background-size: 100% 3px;
		}
		.card:hover :global(.frame),
		.card:focus-within :global(.frame) {
			transform: scale(1.05);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.title {
			transition: none;
		}
		.card:hover :global(.frame),
		.card:focus-within :global(.frame) {
			transform: none;
		}
	}
</style>
