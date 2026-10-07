<script lang="ts">
	import type { Dict, Lang } from '$lib/i18n';
	import type { Project } from '$lib/projects';
	import TrophyIcon from '../icons/TrophyIcon.svelte';
	import DomainIcon from './DomainIcon.svelte';
	import ProjectLinks from './ProjectLinks.svelte';
	import ProjectMedia from './ProjectMedia.svelte';
	import TechTags from './TechTags.svelte';

	let { project, lang, t }: { project: Project; lang: Lang; t: Dict['projects'] } = $props();
</script>

<article class="card">
	<ProjectMedia {project} />
	<div class="body">
		<p class="meta">
			<span class="dom"
				><DomainIcon domain={project.domains[0]} size={18} />{t.domains[project.domains[0]]}</span
			>
			<span>{project.date.slice(0, 4)} · {t.contexts[project.context]}</span>
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

	/* Phone: the media fills the card and the text sits on a dark gradient over it. */
	@media (width < 48rem) {
		.card {
			position: relative;
			justify-content: flex-end;
			height: auto;
			/* At least 4:3; grows with its text (needs overflow visible). */
			aspect-ratio: 4 / 3;
			overflow: visible;
		}
		.card > :global(.media) {
			position: absolute;
			inset: 0;
			aspect-ratio: auto;
			border-radius: calc(var(--radius) - 1px);
		}
		/* The card title is already on the card; the big placeholder title would be repeated. */
		.card :global(.placeholder span) {
			display: none;
		}
		.body {
			/* Light-on-dark in both themes: the gradient is dark whatever the theme. Values mirror OVERLAY in src/lib/overlay.ts (tested for contrast). */
			--text: #ffffff;
			--muted: #d0d7de;
			--accent: #79c0ff;
			--border: rgb(255 255 255 / 0.35);
			position: relative;
			flex: none;
			gap: 0.35rem;
			padding: 2.5rem 1rem 1rem;
			border-radius: 0 0 calc(var(--radius) - 1px) calc(var(--radius) - 1px);
			background: linear-gradient(
				to bottom,
				transparent,
				rgb(0 0 0 / 0.75) 2.5rem,
				rgb(0 0 0 / 0.85)
			);
			color: var(--text);
			/* Keeps text crisp where a bright image shows through the translucent gradient. */
			text-shadow: 0 1px 2px rgb(0 0 0 / 0.6);
		}
		h3 {
			font-size: 1.2rem;
		}
		.desc {
			flex: none;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			overflow: hidden;
		}
		.footer {
			margin-top: 0.25rem;
		}
		/* M9: restore the M8 phone card look the desktop base no longer gives. */
		.card {
			gap: 0;
			border: 1px solid var(--border);
			border-radius: var(--radius);
			background: var(--surface);
		}
		.dom {
			display: none;
		}
		.desc {
			font-size: inherit;
			color: var(--muted);
		}
		.footer {
			align-items: center;
			min-height: 0;
			padding-top: 0;
			border-top: 0;
		}
		.footer > :global(ul) {
			padding-top: 0;
		}
		.title {
			background: none;
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
