<script lang="ts">
	import { base } from '$app/paths';
	import { localeHref } from '$lib/i18n/lang';
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
	<link rel="alternate" hreflang="en" href={localeHref(base, 'en')} />
	<link rel="alternate" hreflang="fr" href={localeHref(base, 'fr')} />
</svelte:head>

<Nav lang={data.lang} {t} />

<main>
	<Hero {t} />
	<About {t} />
	<Projects lang={data.lang} title={t.sections.projects} t={t.projects} />
	<Skills {t} />
	<Experience {t} />
	<Contact {t} />
</main>
