<script lang="ts">
	import { base } from '$app/paths';
	import { en } from '$lib/i18n/en';
	import { fr } from '$lib/i18n/fr';
	import { LANGS, localeHref } from '$lib/i18n/lang';

	// The URL tells no language, so both are shown. <html lang> is `en` (hooks.server.ts);
	// the French text says so itself.
	const dicts = { en, fr };
</script>

<svelte:head>
	<title>{en.notFound.title} · {fr.notFound.title}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="not-found">
	<p class="code" aria-hidden="true">404</p>
	<h1>
		{en.notFound.title}
		<span class="alt" lang="fr">{fr.notFound.title}</span>
	</h1>
	{#each LANGS as lang (lang)}
		<p {lang}>
			{dicts[lang].notFound.text}
			<a href={localeHref(base, lang)} hreflang={lang}>{dicts[lang].notFound.home}</a>
		</p>
	{/each}
</main>

<style>
	.not-found {
		box-sizing: border-box;
		min-height: 100vh;
		max-width: 40rem;
		margin: 0 auto;
		padding: var(--gutter);
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 1rem;
		color: var(--body);
	}
	.code {
		margin: 0;
		font-size: 4rem;
		font-weight: 800;
		line-height: 1;
		color: var(--accent);
	}
	h1 {
		margin: 0;
		color: var(--text);
		font-size: 1.75rem;
		line-height: 1.2;
	}
	.alt {
		display: block;
		color: var(--body);
	}
	p {
		margin: 0;
		line-height: 1.5;
	}
	a {
		color: var(--text);
		font-weight: 600;
	}
</style>
