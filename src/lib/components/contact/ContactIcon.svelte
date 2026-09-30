<script lang="ts">
	import type { ContactId } from '$lib/contact';
	import { CONTACT_BRANDS } from '$lib/data/contact-icons';
	import { logoColor, THEME_BG } from '$lib/skills';

	let { id, size = 28 }: { id: ContactId; size?: number } = $props();

	const brand = $derived(id === 'email' || id === 'cv' ? undefined : CONTACT_BRANDS[id]);
</script>

{#if brand}
	<svg
		class="brand"
		viewBox={brand.viewBox ?? '0 0 24 24'}
		width={size}
		height={size}
		fill="currentColor"
		aria-hidden="true"
		style:--logo-dark={logoColor(brand.hex, THEME_BG.dark)}
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
		{#if id === 'email'}
			<rect x="3" y="5" width="18" height="14" rx="2" />
			<path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
		{:else}
			<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
			<path d="M14 3v5h5M9 13h6M9 17h6" />
		{/if}
	</svg>
{/if}

<style>
	svg {
		flex-shrink: 0;
	}
	.line {
		color: var(--accent);
	}
	/* Brand colour per theme (computed by logoColor); same theme selectors as src/app.css. */
	.brand {
		color: var(--logo-dark);
	}
	:global(:root[data-theme='light']) .brand {
		color: var(--logo-light);
	}
	@media (prefers-color-scheme: light) {
		:global(:root:not([data-theme])) .brand {
			color: var(--logo-light);
		}
	}
</style>
