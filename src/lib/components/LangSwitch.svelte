<script lang="ts">
	import { base } from '$app/paths';
	import { localeHref, otherLang, type Dict, type Lang } from '$lib/i18n';

	let { lang, t }: { lang: Lang; t: Dict['langSwitch'] } = $props();

	const target = $derived(otherLang(lang));
	const href = $derived(localeHref(base, target));

	function onclick(e: MouseEvent) {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
		e.preventDefault();
		location.assign(`${href}${location.hash}`);
	}
</script>

<a
	class="lang"
	{href}
	hreflang={target}
	lang={target}
	aria-label={t.label}
	title={t.label}
	data-sveltekit-reload
	{onclick}
>
	{t.short}
</a>

<style>
	.lang {
		display: grid;
		place-items: center;
		height: 2.25rem;
		padding: 0 0.75rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text);
		font-weight: 600;
		font-size: 0.85rem;
		text-decoration: none;
	}
	.lang:hover {
		border-color: var(--accent);
	}
</style>
