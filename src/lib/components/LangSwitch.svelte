<script lang="ts">
	import { base } from '$app/paths';
	import { localeHref, otherLang, type Dict, type Lang } from '$lib/i18n';
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import {
		isAtBottom,
		savePendingSection,
		sectionInView,
		SECTIONS,
		takePendingSection,
		type SectionId
	} from '$lib/sections';

	let { lang, t }: { lang: Lang; t: Dict['langSwitch'] } = $props();

	const target = $derived(otherLang(lang));
	const href = $derived(localeHref(base, target));

	// After a language switch the new page opens at the top, then glides to the section the
	// reader was on, so they can see where they are. A short pause lets the top register first.
	onMount(() => {
		const id = takePendingSection(() => sessionStorage);
		if (!id) return;
		const timer = setTimeout(() => {
			document
				.getElementById(id)
				?.scrollIntoView({ behavior: prefersReducedMotion.current ? 'instant' : 'smooth' });
		}, 250);
		return () => clearTimeout(timer);
	});

	// Remember the section on screen (not the stale #hash left by the last nav click).
	function onclick(e: MouseEvent) {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
		e.preventDefault();
		const tops = Object.fromEntries(
			SECTIONS.map((id) => [
				id,
				document.getElementById(id)?.getBoundingClientRect().top ?? Infinity
			])
		) as Record<SectionId, number>;
		const navHeight = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
		const atBottom = isAtBottom(scrollY, innerHeight, document.documentElement.scrollHeight);
		savePendingSection(() => sessionStorage, sectionInView(tops, navHeight, atBottom));
		location.assign(href);
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
