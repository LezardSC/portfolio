<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import { MENU_BREAKPOINT, nextMenu, type MenuEvent } from '$lib/nav-menu';
	import { assetHref } from '$lib/paths';
	import { SECTIONS, sectionNumber, type SectionId } from '$lib/sections';
	import { currentSection } from '$lib/sections-dom';
	import LangSwitch from './LangSwitch.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { lang, t }: { lang: Lang; t: Dict } = $props();

	let open = $state(false);
	/** False until hydration: without JS the button stays hidden and the links stay a scrollable row. */
	let enhanced = $state(false);
	let header: HTMLElement | undefined = $state();
	let button: HTMLButtonElement | undefined = $state();
	/** Section on screen; null on the hero. */
	let active = $state<SectionId | null>(null);

	function send(event: MenuEvent) {
		const next = nextMenu(open, event);
		open = next.open;
		if (next.focusButton) button?.focus();
	}

	onMount(() => {
		enhanced = true;
		// Recompute at most once per frame while scrolling or resizing.
		let frame = 0;
		const track = () => {
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				active = currentSection();
			});
		};
		active = currentSection();
		addEventListener('scroll', track, { passive: true });
		addEventListener('resize', track);
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
		// Keyboard focus moving past the last control (into the page) closes the panel, so it
		// never covers the element that now has focus.
		const onFocusOut = (e: FocusEvent) => {
			if (open && !header?.contains(e.relatedTarget as Node | null)) send('outside');
		};
		header?.addEventListener('focusout', onFocusOut);
		wide.addEventListener('change', onWide);
		document.addEventListener('keydown', onKey);
		document.addEventListener('pointerdown', onPointer);
		return () => {
			header?.removeEventListener('focusout', onFocusOut);
			wide.removeEventListener('change', onWide);
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('pointerdown', onPointer);
			removeEventListener('scroll', track);
			removeEventListener('resize', track);
			cancelAnimationFrame(frame);
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
				<li>
					<a
						href="#{id}"
						aria-current={active === id ? 'true' : undefined}
						onclick={() => send('link')}
						><span class="n" aria-hidden="true">{sectionNumber(id)}</span>{t.nav[id]}</a
					>
				</li>
			{/each}
		</ul>
	</nav>
	<div class="actions">
		<ThemeToggle t={t.theme} />
		<LangSwitch {lang} t={t.langSwitch} />
		<a
			class="btn btn-primary cv"
			href={assetHref(base, PROFILE.cv[lang])}
			target="_blank"
			rel="noopener noreferrer">{t.navCv} <span class="sr-only">{t.newTab}</span></a
		>
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
		padding: 0 max(2.5rem, calc((100% - 77.5rem) / 2 + 2.5rem));
		background: color-mix(in srgb, var(--bg) 86%, transparent);
		backdrop-filter: blur(14px);
		border-bottom: 1px solid var(--rule);
	}
	.brand {
		font-size: 1.1875rem;
		font-weight: 800;
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
		gap: 1.5rem;
		/* Centred by auto margins, not justify-content: when the links overflow, the margins drop to
		   0 and the row overflows to the right, where it can still be scrolled. */
		width: max-content;
		margin: 0 auto;
		padding: 0;
		list-style: none;
		white-space: nowrap;
	}
	nav a {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		min-height: 2.5rem;
		color: var(--text);
		font-size: 1rem;
		font-weight: 500;
		text-decoration: none;
	}
	nav a:hover {
		color: var(--accent);
	}
	nav a[aria-current] {
		text-decoration: underline 2px var(--accent);
		text-underline-offset: 0.4em;
	}
	.n {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--accent);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.cv {
		min-height: 2.75rem;
		padding: 0 1.125rem;
		font-size: 0.9375rem;
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
		.nav {
			padding: 0 1rem;
		}
		.cv {
			display: none;
		}
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
