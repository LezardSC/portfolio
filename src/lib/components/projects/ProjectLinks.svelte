<script lang="ts">
	import type { Dict } from '$lib/i18n';
	import type { Project } from '$lib/projects';
	import GitHubIcon from '../icons/GitHubIcon.svelte';

	let { project, t }: { project: Project; t: Dict['projects'] } = $props();
</script>

<div class="links">
	{#if project.links.repo}
		<a
			href={project.links.repo}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="{t.repo}: {project.title}"
			title={t.repo}
		>
			<GitHubIcon />
		</a>
	{/if}
	{#if project.links.demo}
		<a
			href={project.links.demo}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="{t.demo}: {project.title}"
			title={t.demo}
		>
			<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
				<path
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linejoin="round"
					d="M7 4v16l13-8z"
				/>
			</svg>
		</a>
	{/if}
	{#if !project.links.repo && !project.links.demo}
		<span class="private">
			<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
				<g fill="none" stroke="currentColor" stroke-width="2">
					<rect x="5" y="11" width="14" height="10" rx="2" />
					<path d="M8 11V7a4 4 0 0 1 8 0v4" />
				</g>
			</svg>
			{t.private}
		</span>
	{/if}
</div>

<style>
	.links {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	a {
		min-width: var(--tap);
		min-height: var(--tap);
		display: grid;
		place-items: center;
		color: var(--muted);
		transition: color 0.15s;
	}
	a:hover {
		color: var(--accent);
	}
	.private {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.8rem;
		color: var(--muted);
		border: 1px solid var(--border);
		border-radius: var(--pill);
		padding: 0.1rem 0.6rem;
	}
</style>
