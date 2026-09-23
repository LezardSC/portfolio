<script lang="ts">
	import { onMount } from 'svelte';
	import { pickLang } from '$lib/i18n/lang';

	onMount(() => {
		const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
		location.replace(`/${pickLang(prefs)}/`);
	});
</script>

<noscript>
	<p><a href="/en/" hreflang="en">English</a> · <a href="/fr/" hreflang="fr">Français</a></p>
</noscript>
