<script lang="ts">
	import type { ContactId } from '$lib/contact';
	import { CONTACT_BRANDS } from '$lib/data/contact-icons';
	import { ICONS } from '$lib/data/icons';
	import { logoColor } from '$lib/color';
	import { THEME_BG } from '$lib/theme';

	let { id, size = 28 }: { id: ContactId; size?: number } = $props();

	const brand = $derived(id === 'email' || id === 'cv' ? undefined : CONTACT_BRANDS[id]);
</script>

{#if brand}
	<svg
		class="logo"
		viewBox={brand.viewBox ?? '0 0 24 24'}
		width={size}
		height={size}
		fill="currentColor"
		aria-hidden="true"
		style:--logo-dark={brand.dark ? `#${brand.dark}` : logoColor(brand.hex, THEME_BG.dark)}
		style:--logo-light={logoColor(brand.hex, THEME_BG.light)}
	>
		<path d={brand.path} />
	</svg>
{:else}
	<svg
		class="line"
		viewBox="0 0 24 24"
		width={size}
		height={size}
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d={id === 'email' ? ICONS.mail : ICONS.document} />
	</svg>
{/if}

<style>
	svg {
		flex-shrink: 0;
	}
	.line {
		color: var(--accent);
	}
</style>
