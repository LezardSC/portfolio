<script lang="ts">
	import { base } from '$app/paths';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import { assetHref } from '$lib/paths';
	import GitHubIcon from '../icons/GitHubIcon.svelte';

	let { lang, t, newTab }: { lang: Lang; t: Dict['hero']; newTab: string } = $props();
</script>

<section id="hero" class="hero">
	{#if PROFILE.available}
		<p class="available"><span class="dot" aria-hidden="true"></span>{t.available}</p>
	{/if}
	<h1>{PROFILE.name}</h1>
	<p class="role">{PROFILE.role[lang]}</p>
	<p class="pitch">{PROFILE.pitch[lang]}</p>
	<div class="ctas">
		<a class="btn primary" href="#projects">{t.projects}</a>
		<a
			class="btn"
			href={assetHref(base, PROFILE.cv[lang])}
			target="_blank"
			rel="noopener noreferrer"
		>
			{t.cv} <span class="sr-only">{newTab}</span>
		</a>
		<a class="btn" href={PROFILE.github} target="_blank" rel="noopener noreferrer">
			<GitHubIcon size={18} />
			{t.github} <span class="sr-only">{newTab}</span>
		</a>
	</div>
</section>

<style>
	.hero {
		min-height: 100svh;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 0.75rem;
		text-align: center;
		padding: calc(var(--nav-h) + 2rem) 1rem 2rem;
	}
	h1 {
		font-size: clamp(2.25rem, 8vw, 4.5rem);
		line-height: 1.1;
		margin: 0;
		overflow-wrap: anywhere;
	}
	.role {
		margin: 0;
		font-size: clamp(1.1rem, 3vw, 1.4rem);
		font-weight: 600;
		color: var(--accent);
	}
	.pitch {
		margin: 0.5rem 0 1rem;
		max-width: 60ch;
		color: var(--muted);
		font-size: 1.05rem;
	}
	.available {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		padding: 0.2rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: var(--pill);
		font-size: 0.85rem;
		color: var(--muted);
	}
	.dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--ok);
	}
	.ctas {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		color: var(--text);
		font-weight: 600;
		text-decoration: none;
		transition:
			border-color 0.15s,
			background-color 0.15s;
	}
	.btn:hover {
		border-color: var(--accent);
	}
	.primary {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--bg);
	}
	.primary:hover {
		background: color-mix(in srgb, var(--accent) 85%, var(--text));
	}
</style>
