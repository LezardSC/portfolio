<script lang="ts">
	import type { Dict, Lang } from '$lib/i18n';
	import { SECTIONS } from '$lib/sections';
	import LangSwitch from './LangSwitch.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { lang, t }: { lang: Lang; t: Dict } = $props();
</script>

<header class="nav">
	<a class="brand" href="#hero">{t.hero.name}</a>
	<nav aria-label="Main">
		<ul>
			{#each SECTIONS as id (id)}
				<li><a href="#{id}">{t.nav[id]}</a></li>
			{/each}
		</ul>
	</nav>
	<div class="actions">
		<LangSwitch {lang} t={t.langSwitch} />
		<ThemeToggle t={t.theme} />
	</div>
</header>

<style>
	.nav {
		position: fixed;
		inset: 0 0 auto 0;
		z-index: 10;
		height: var(--nav-h);
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 1rem;
		background: color-mix(in srgb, var(--bg) 85%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--border);
	}
	.brand {
		font-weight: 700;
		color: var(--text);
		text-decoration: none;
	}
	nav {
		flex: 1;
		min-width: 0;
		overflow-x: auto;
	}
	ul {
		display: flex;
		gap: 1.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
		white-space: nowrap;
	}
	nav a {
		color: var(--muted);
		text-decoration: none;
	}
	nav a:hover {
		color: var(--text);
	}
	.actions {
		display: flex;
		gap: 0.5rem;
	}
</style>
