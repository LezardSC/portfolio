<script lang="ts">
	import { base } from '$app/paths';
	import { localeHref } from '$lib/i18n/lang';
	import { assetHref } from '$lib/paths';
	import { THEME_BG } from '$lib/skills';
	import Footer from '$lib/components/Footer.svelte';
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
	<meta property="og:type" content="website" />
	<meta property="og:title" content={t.meta.title} />
	<meta property="og:description" content={t.meta.description} />
	<!-- Relative until M11: link previews need an absolute URL, which needs the domain. -->
	<meta property="og:image" content={assetHref(base, `og-${data.lang}.png`)} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={t.meta.title} />
	<meta property="og:locale" content={t.meta.locale} />
	<meta property="og:locale:alternate" content={t.meta.altLocale} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" media="(prefers-color-scheme: light)" content={THEME_BG.light} />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content={THEME_BG.dark} />
</svelte:head>

<a class="skip-link" href="#main">{t.skipToContent}</a>
<Nav lang={data.lang} {t} />

<main id="main" tabindex="-1">
	<Hero lang={data.lang} t={t.hero} newTab={t.newTab} />
	<About lang={data.lang} title={t.sections.about} t={t.about} common={t.common} />
	<Projects lang={data.lang} title={t.sections.projects} t={t.projects} />
	<Skills lang={data.lang} title={t.sections.skills} t={t.skills} />
	<Experience lang={data.lang} title={t.sections.experience} t={t.experience} newTab={t.newTab} />
	<Contact lang={data.lang} title={t.sections.contact} t={t.contact} newTab={t.newTab} />
</main>

<Footer t={t.footer} />
