<script lang="ts">
	let { data } = $props();
	const t = $derived(data.t);
</script>

<svelte:head>
	<title>{t.meta.title}</title>
	<meta name="description" content={t.meta.description} />
	<link rel="alternate" hreflang="en" href="/en/" />
	<link rel="alternate" hreflang="fr" href="/fr/" />
</svelte:head>

<h1>{t.hero.name}</h1>
<p>{t.hero.tagline}</p>
