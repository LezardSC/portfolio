<script lang="ts">
	import { base } from '$app/paths';
	import { localeHref } from '$lib/i18n/lang';
	import { alternates } from '$lib/seo';
	import { absoluteUrl } from '$lib/site';
	import { THEME_BG } from '$lib/theme';
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
	const canonical = $derived(absoluteUrl(base, localeHref('', data.lang)));
</script>

<svelte:head>
	<title>{t.meta.title}</title>
	<meta name="description" content={t.meta.description} />
	<link rel="canonical" href={canonical} />
	{#each alternates(base) as alt (alt.hreflang)}
		<link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
	{/each}
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:title" content={t.meta.title} />
	<meta property="og:description" content={t.meta.description} />
	<meta property="og:image" content={absoluteUrl(base, `og-${data.lang}.png`)} />
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
