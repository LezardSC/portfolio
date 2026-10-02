<script lang="ts">
	import type { Dict, Lang } from '$lib/i18n';
	import type { Project } from '$lib/projects';
	import ProjectLinks from './ProjectLinks.svelte';
	import ProjectMedia from './ProjectMedia.svelte';
	import TechTags from './TechTags.svelte';

	let { project, lang, t }: { project: Project; lang: Lang; t: Dict['projects'] } = $props();
</script>

<article class="card">
	<ProjectMedia {project} />
	<div class="body">
		<p class="meta">{project.date.slice(0, 4)} · {t.contexts[project.context]}</p>
		<h3>{project.title}</h3>
		{#if project.award}
			<p class="award"><span aria-hidden="true">🏆</span> {project.award[lang]}</p>
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
		height: 100%;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.body {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.5rem;
		padding: 1.25rem 1.5rem 1.5rem;
	}
	.meta {
		margin: 0;
		font-size: 0.85rem;
		color: var(--accent);
	}
	h3 {
		margin: 0;
		font-size: 1.4rem;
	}
	.award {
		align-self: flex-start;
		margin: 0;
		padding: 0.15rem 0.7rem;
		border-radius: var(--pill);
		font-size: 0.8rem;
		font-weight: 600;
		background: color-mix(in srgb, #e3b341 18%, transparent);
		color: var(--text);
	}
	.desc {
		flex: 1;
		margin: 0;
		color: var(--muted);
	}
	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.5rem;
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
	}

	@media (hover: hover) and (pointer: fine) {
		.card {
			transition:
				transform 0.2s,
				box-shadow 0.2s,
				border-color 0.2s;
		}
		.card:hover,
		.card:focus-within {
			transform: translateY(-4px);
			border-color: var(--accent);
			box-shadow: 0 12px 28px rgb(0 0 0 / 0.25);
		}
		.card:hover :global(.frame),
		.card:focus-within :global(.frame) {
			transform: scale(1.03);
		}
	}
	@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: reduce) {
		.card:hover,
		.card:focus-within {
			transform: none;
		}
		.card:hover :global(.frame),
		.card:focus-within :global(.frame) {
			transform: none;
		}
	}
</style>
