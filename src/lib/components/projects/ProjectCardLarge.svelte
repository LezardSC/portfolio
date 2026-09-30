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
		border-radius: 999px;
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
</style>
