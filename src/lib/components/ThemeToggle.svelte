<script lang="ts">
	import { onMount } from 'svelte';
	import type { Dict } from '$lib/i18n';
	import { nextTheme, THEME_KEY, themeOnSystemChange, type Theme } from '$lib/theme';

	let { t }: { t: Dict['theme'] } = $props();

	let theme = $state<Theme>('dark');
	let mounted = $state(false);

	function apply(next: Theme) {
		theme = next;
		document.documentElement.dataset.theme = next;
	}

	function stored(): string | null {
		try {
			return localStorage.getItem(THEME_KEY);
		} catch {
			return null; // storage blocked: behave as if nothing was chosen
		}
	}

	onMount(() => {
		theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
		mounted = true;
		const dark = matchMedia('(prefers-color-scheme: dark)');
		const onSystemChange = () => {
			const next = themeOnSystemChange(stored(), dark.matches);
			if (next) apply(next);
		};
		dark.addEventListener('change', onSystemChange);
		return () => dark.removeEventListener('change', onSystemChange);
	});

	function toggle() {
		apply(nextTheme(theme));
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
	title={mounted ? (theme === 'dark' ? t.toLight : t.toDark) : undefined}
>
	<span class="sr-only to-light">{t.toLight}</span>
	<span class="sr-only to-dark">{t.toDark}</span>
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
		width: 2.75rem;
		height: 2.75rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text);
		cursor: pointer;
	}
	.icon-btn:hover {
		border-color: var(--accent);
	}
	/* Correct icon and label from first paint: keyed on the html[data-theme] the inline
	   no-flash script sets, with a prefers-color-scheme fallback for no-JS.
	   Dark theme (default): sun icon, "switch to light" label. */
	.icon-moon,
	.to-dark {
		display: none;
	}
	:global(:root[data-theme='light']) .icon-sun,
	:global(:root[data-theme='light']) .to-light {
		display: none;
	}
	:global(:root[data-theme='light']) .icon-moon {
		display: block;
	}
	:global(:root[data-theme='light']) .to-dark {
		display: inline;
	}
	@media (prefers-color-scheme: light) {
		:global(:root:not([data-theme])) .icon-sun,
		:global(:root:not([data-theme])) .to-light {
			display: none;
		}
		:global(:root:not([data-theme])) .icon-moon {
			display: block;
		}
		:global(:root:not([data-theme])) .to-dark {
			display: inline;
		}
	}
</style>
