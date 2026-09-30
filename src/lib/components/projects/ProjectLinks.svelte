<script lang="ts">
	import type { Dict } from '$lib/i18n';
	import type { Project } from '$lib/projects';

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
			<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
				<path
					fill="currentColor"
					d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
				/>
			</svg>
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
		border-radius: 999px;
		padding: 0.1rem 0.6rem;
	}
</style>
