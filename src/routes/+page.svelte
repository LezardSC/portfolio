<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { localeHref, pickLang } from '$lib/i18n/lang';

	onMount(() => {
		const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
		location.replace(localeHref(base, pickLang(prefs)));
	});
</script>

<noscript>
	<p>
		<a href={localeHref(base, 'en')} hreflang="en">English</a> ·
		<a href={localeHref(base, 'fr')} hreflang="fr">Français</a>
	</p>
</noscript>
