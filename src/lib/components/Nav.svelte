<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import { PHONE_QUERY } from '$lib/breakpoints';
	import { assetHref } from '$lib/paths';
	import { SECTIONS, sectionNumber, type SectionId } from '$lib/sections';
	import { currentSection } from '$lib/sections-dom';
	import LangSwitch from './LangSwitch.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { lang, t }: { lang: Lang; t: Dict } = $props();

	/** Section on screen; null on the hero. */
	let active = $state<SectionId | null>(null);

	let contact: HTMLElement;
	/** Focused element of the header, kept until focus leaves it while it is still visible. */
	let focused: Element | null = null;
	const focusin = (e: FocusEvent) => (focused = e.target as Element);
	const focusout = (e: FocusEvent) => {
		// Hidden by a resize (not left by the user): keep it, so the resize handler can see it.
		if ((e.target as Element).checkVisibility()) focused = null;
	};

	onMount(() => {
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
		// Narrowing to the phone layout hides the section links and CV button: if focus was on
		// one, move it to the Contact button instead of dropping it on <body>.
		const phone = matchMedia(PHONE_QUERY);
		const onPhone = () => {
			if (phone.matches && focused && !focused.checkVisibility()) contact.focus();
			focused = null;
		};
		phone.addEventListener('change', onPhone);
		addEventListener('scroll', track, { passive: true });
		addEventListener('resize', track);
		return () => {
			phone.removeEventListener('change', onPhone);
			removeEventListener('scroll', track);
			removeEventListener('resize', track);
			cancelAnimationFrame(frame);
		};
	});
</script>

<header class="nav" onfocusin={focusin} onfocusout={focusout}>
	<a class="brand" href="#hero">{PROFILE.name}</a>
	<nav aria-label={t.navLabel}>
		<ul role="list">
			{#each SECTIONS as id (id)}
				<li>
					<a href="#{id}" aria-current={active === id ? 'true' : undefined}
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
		<a class="btn btn-primary contact" bind:this={contact} href="#contact">{t.nav.contact}</a>
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
		padding: 0 max(var(--gutter), calc((100% - var(--page-max)) / 2 + var(--gutter)));
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
	.contact {
		display: none;
		min-height: 2.75rem;
		padding: 0 0.875rem;
		font-size: 0.9375rem;
	}
	/* Phone: name, theme, language and a Contact button; no section links (no menu). */
	@media (width < 48rem) {
		.nav {
			justify-content: space-between;
			gap: 0.5rem;
			padding: 0 var(--gutter);
			background: color-mix(in srgb, var(--bg) 92%, transparent);
		}
		.brand {
			font-size: 1.125rem;
		}
		nav,
		.cv {
			display: none;
		}
		.actions {
			gap: 0.375rem;
		}
		.contact {
			display: inline-flex;
		}
	}
	/* Narrow phones (360px): the four items need ~14px more than the board's 390px layout. */
	@media (width < 24.375rem) {
		.brand {
			font-size: 1rem;
		}
		.contact {
			padding: 0 0.75rem;
		}
	}
</style>
