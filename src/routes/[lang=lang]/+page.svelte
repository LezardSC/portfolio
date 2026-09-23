<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import About from '$lib/components/sections/About.svelte';
	import Contact from '$lib/components/sections/Contact.svelte';
	import Experience from '$lib/components/sections/Experience.svelte';
	import Hero from '$lib/components/sections/Hero.svelte';
	import Projects from '$lib/components/sections/Projects.svelte';
	import Skills from '$lib/components/sections/Skills.svelte';

	let { data } = $props();
	const t = $derived(data.t);
</script>

<svelte:head>
	<title>{t.meta.title}</title>
	<meta name="description" content={t.meta.description} />
	<link rel="alternate" hreflang="en" href="/en/" />
	<link rel="alternate" hreflang="fr" href="/fr/" />
</svelte:head>

<Nav lang={data.lang} {t} />

<main>
	<Hero {t} />
	<About {t} />
	<Projects {t} />
	<Skills {t} />
	<Experience {t} />
	<Contact {t} />
</main>
