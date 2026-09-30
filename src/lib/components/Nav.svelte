<script lang="ts">
	import { onMount } from 'svelte';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import { MENU_BREAKPOINT, nextMenu, type MenuEvent } from '$lib/nav-menu';
	import { SECTIONS } from '$lib/sections';
	import LangSwitch from './LangSwitch.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { lang, t }: { lang: Lang; t: Dict } = $props();

	let open = $state(false);
	/** False until hydration: without JS the button stays hidden and the links stay a scrollable row. */
	let enhanced = $state(false);
	let header: HTMLElement | undefined = $state();
	let button: HTMLButtonElement | undefined = $state();

	function send(event: MenuEvent) {
		const next = nextMenu(open, event);
		open = next.open;
		if (next.focusButton) button?.focus();
	}

	onMount(() => {
		enhanced = true;
		const wide = matchMedia(MENU_BREAKPOINT);
		const onWide = () => {
			if (wide.matches) send('wide');
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') send('escape');
		};
		const onPointer = (e: PointerEvent) => {
			if (open && !header?.contains(e.target as Node)) send('outside');
		};
		wide.addEventListener('change', onWide);
		document.addEventListener('keydown', onKey);
		document.addEventListener('pointerdown', onPointer);
		return () => {
			wide.removeEventListener('change', onWide);
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('pointerdown', onPointer);
		};
	});
</script>

<header class="nav" class:enhanced bind:this={header}>
	<a class="brand" href="#hero">{PROFILE.name}</a>
	<nav aria-label={t.navLabel}>
		<button
			bind:this={button}
			type="button"
			class="menu-btn"
			aria-expanded={open}
			aria-controls="nav-links"
			aria-label={t.menu}
			onclick={() => send('toggle')}
		>
			<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
				<path
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					d={open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'}
				/>
			</svg>
		</button>
		<ul id="nav-links" role="list" class:open>
			{#each SECTIONS as id (id)}
				<li><a href="#{id}" onclick={() => send('link')}>{t.nav[id]}</a></li>
			{/each}
		</ul>
	</nav>
	<div class="actions">
		<LangSwitch {lang} t={t.langSwitch} />
		<ThemeToggle t={t.theme} />
	</div>
</header>

<style>
	.nav {
		position: fixed;
		inset: 0 0 auto 0;
		z-index: 10;
		height: var(--nav-h);
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 1rem;
		background: color-mix(in srgb, var(--bg) 85%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--border);
	}
	.brand {
		font-weight: 700;
		color: var(--text);
		text-decoration: none;
		white-space: nowrap;
	}
	nav {
		flex: 1;
		min-width: 0;
		overflow-x: auto;
	}
	ul {
		display: flex;
		gap: 1.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
		white-space: nowrap;
	}
	nav a {
		color: var(--muted);
		text-decoration: none;
	}
	nav a:hover {
		color: var(--text);
	}
	.actions {
		display: flex;
		gap: 0.5rem;
	}
	.menu-btn {
		display: none;
		place-items: center;
		width: var(--tap);
		height: var(--tap);
		border: 1px solid var(--border);
		border-radius: 50%;
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
	}
	.menu-btn:hover {
		border-color: var(--accent);
	}
	/* Below 47.5rem (MENU_BREAKPOINT), once hydrated: links collapse into a panel under the bar. */
	@media (max-width: 47.49rem) {
		.enhanced nav {
			display: flex;
			justify-content: flex-end;
			overflow: visible;
		}
		.enhanced .menu-btn {
			display: grid;
		}
		.enhanced ul {
			display: none;
			position: absolute;
			top: var(--nav-h);
			left: 0;
			right: 0;
			flex-direction: column;
			gap: 0;
			padding: 0.5rem 1rem 1rem;
			background: var(--bg);
			border-bottom: 1px solid var(--border);
		}
		.enhanced ul.open {
			display: flex;
		}
		.enhanced ul a {
			display: flex;
			align-items: center;
			min-height: 2.75rem;
		}
	}
</style>
