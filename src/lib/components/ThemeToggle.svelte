<script lang="ts">
	import { onMount } from 'svelte';
	import type { Dict } from '$lib/i18n';
	import { nextTheme, THEME_KEY, type Theme } from '$lib/theme';

	let { t }: { t: Dict['theme'] } = $props();

	let theme = $state<Theme>('dark');

	onMount(() => {
		theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
	});

	function toggle() {
		theme = nextTheme(theme);
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem(THEME_KEY, theme);
		} catch {
			// storage blocked (private mode): theme still applies for this page view
		}
	}
</script>

<button
	type="button"
	class="icon-btn"
	onclick={toggle}
	aria-label={theme === 'dark' ? t.toLight : t.toDark}
	title={theme === 'dark' ? t.toLight : t.toDark}
>
	<svg class="icon-sun" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
		<circle cx="12" cy="12" r="4" fill="currentColor" />
		<path
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
		/>
	</svg>
	<svg class="icon-moon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
		<path fill="currentColor" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
	</svg>
</button>

<style>
	.icon-btn {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border: 1px solid var(--border);
		border-radius: 50%;
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
	}
	.icon-btn:hover {
		border-color: var(--accent);
	}
	/* Correct icon from first paint: keyed on the html[data-theme] the inline
	   no-flash script sets, with a prefers-color-scheme fallback for no-JS. */
	.icon-moon {
		display: none;
	}
	:global(:root[data-theme='light']) .icon-sun {
		display: none;
	}
	:global(:root[data-theme='light']) .icon-moon {
		display: block;
	}
	@media (prefers-color-scheme: light) {
		:global(:root:not([data-theme])) .icon-sun {
			display: none;
		}
		:global(:root:not([data-theme])) .icon-moon {
			display: block;
		}
	}
</style>
