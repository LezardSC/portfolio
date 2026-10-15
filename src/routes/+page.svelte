<script lang="ts">
	import { base } from '$app/paths';
	import { en } from '$lib/i18n/en';
	import { localeHref } from '$lib/i18n/lang';
	import { redirectScript } from '$lib/i18n/redirect';
	import { alternates } from '$lib/seo';

	const redirectTag = `<script>${redirectScript(base)}<\/script>`;
</script>

<svelte:head>
	<title>{en.meta.title}</title>
	{#each alternates(base) as alt (alt.hreflang)}
		<link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
	{/each}
	<!-- Inline so the redirect runs before first paint, not after hydration. -->
	{@html redirectTag}
</svelte:head>

<noscript>
	<p>
		<a href={localeHref(base, 'en')} hreflang="en">English</a> ·
		<a href={localeHref(base, 'fr')} hreflang="fr">Français</a>
	</p>
</noscript>
