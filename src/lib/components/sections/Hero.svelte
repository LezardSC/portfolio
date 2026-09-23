<script lang="ts">
	import type { Dict } from '$lib/i18n';

	let { t }: { t: Dict } = $props();
</script>

<section id="hero" class="hero">
	<h1>{t.hero.name}</h1>
	<p>{t.hero.tagline}</p>
</section>

<style>
	.hero {
		min-height: 100vh;
		display: grid;
		place-content: center;
		text-align: center;
		padding: var(--nav-h) 1rem 0;
	}
	h1 {
		font-size: clamp(2.5rem, 8vw, 5rem);
		margin: 0;
	}
	p {
		color: var(--muted);
		font-size: 1.25rem;
	}
</style>
