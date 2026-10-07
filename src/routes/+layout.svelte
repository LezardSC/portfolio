<script lang="ts">
	import '@fontsource-variable/schibsted-grotesk';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	// The package's exports map only exposes CSS, so the woff2 is imported by path to preload it
	// (Vite emits one file: the same asset the @font-face rule points to).
	import fontLatin from '../../node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2?url';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preload" href={fontLatin} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
