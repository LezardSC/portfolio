<script lang="ts">
	import type { Dict } from '$lib/i18n';
	import type { Project } from '$lib/projects';

	let {
		project,
		t,
		compact = false
	}: { project: Project; t: Dict['projects']; compact?: boolean } = $props();
</script>

<div class="links">
	{#if project.links.repo}
		<a
			href={project.links.repo}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="{t.repo}: {project.title}"
			>{#if compact}{t.code}{:else}<span class="long">{t.sourceCode}</span><span class="short"
					>{t.code}</span
				>{/if} <span aria-hidden="true">↗</span></a
		>
	{/if}
	{#if project.links.demo}
		<a
			href={project.links.demo}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="{t.demo}: {project.title}">{t.demoLink} <span aria-hidden="true">↗</span></a
		>
	{/if}
	{#if !project.links.repo && !project.links.demo}
		<span class="private">{compact ? t.private : t.privateCode}</span>
	{/if}
</div>

<style>
	.links {
		display: flex;
		flex: none;
		align-items: center;
		gap: 1rem;
	}
	a {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		min-height: 2.75rem;
		color: var(--text);
		font-size: 0.9375rem;
		font-weight: 600;
	}
	a:hover {
		color: var(--accent);
	}
	.private {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		font-size: 0.875rem;
		color: var(--muted);
	}
	.short {
		display: none;
	}
	@media (width < 48rem) {
		.long {
			display: none;
		}
		.short {
			display: inline;
		}
	}
</style>
