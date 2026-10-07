<script lang="ts">
	import '@fontsource-variable/schibsted-grotesk';
	import '../app.css';
	import { base } from '$app/paths';
	import { assetHref } from '$lib/paths';
	// The package's exports map only exposes CSS, so the woff2 is imported by path to preload it
	// (Vite emits one file: the same asset the @font-face rule points to).
	import fontLatin from '../../node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2?url';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preload" href={fontLatin} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="icon" href={assetHref(base, 'favicon.svg')} type="image/svg+xml" />
	<link rel="icon" href={assetHref(base, 'favicon.ico')} sizes="32x32" />
	<link rel="apple-touch-icon" href={assetHref(base, 'apple-touch-icon.png')} />
</svelte:head>

{@render children()}
