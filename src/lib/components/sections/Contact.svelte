<script lang="ts">
	import { onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import { contactLinks } from '$lib/contact';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import ContactIcon from '../contact/ContactIcon.svelte';
	import Section from '../Section.svelte';

	let {
		lang,
		title,
		t,
		newTab
	}: { lang: Lang; title: string; t: Dict['contact']; newTab: string } = $props();

	const links = $derived(contactLinks(lang, base, t.cv));
	const [local, domain] = PROFILE.email.split('@');

	let copied = $state(false);
	/** Copy failed: show the keyboard hint next to the selected address. */
	let failed = $state(false);
	/** Text of the polite live region. */
	let announcement = $state('');
	let address: HTMLElement | undefined = $state();
	let timer: ReturnType<typeof setTimeout> | undefined;

	onDestroy(() => clearTimeout(timer));

	/** Clearing first, then setting on the next frame, makes screen readers repeat an identical message. */
	function announce(text: string) {
		announcement = '';
		requestAnimationFrame(() => (announcement = text));
	}

	/** Copy the address; if the clipboard is unavailable (plain http, denied), select it and show a hint. */
	async function copy() {
		try {
			await navigator.clipboard.writeText(PROFILE.email);
			failed = false;
			copied = true;
			announce(t.copied);
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 2000);
		} catch {
			failed = true;
			announce(t.copyHint);
			if (!address) return;
			const range = document.createRange();
			range.selectNodeContents(address);
			const selection = getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);
		}
	}
</script>

<Section id="contact" {title}>
	<p class="intro">{t.intro}</p>
	<div class="blocks">
		<div class="block mail">
			<p class="label">{t.byEmail}</p>
			<!-- <wbr> lets a narrow screen break the address after the @, not mid-word. -->
			<a class="address" href="mailto:{PROFILE.email}" bind:this={address}
				>{local}@<wbr />{domain}</a
			>
			<button type="button" class="btn btn-primary" onclick={copy}>
				<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
					<g
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="9" y="9" width="12" height="12" rx="2" />
						<path d="M5 15V3h12" />
					</g>
				</svg>
				{copied ? t.copied : t.copy}
			</button>
			{#if failed}<p class="hint">{t.copyHint}</p>{/if}
		</div>
		<div class="block malt">
			<div class="malt-head">
				<span class="malt-ic"><ContactIcon id="malt" size={30} /></span>
				<span class="label">{t.maltLabel}</span>
			</div>
			<p class="malt-title">{t.maltTitle}</p>
			<p class="malt-text">{t.maltText}</p>
			<a class="btn" href={PROFILE.malt} target="_blank" rel="noopener noreferrer">
				{t.maltCta} <span aria-hidden="true">↗</span>
				<span class="sr-only">{newTab}</span>
			</a>
		</div>
	</div>
	<ul class="tiles" role="list">
		{#each links as link (link.id)}
			<li>
				<a class="tile" href={link.href} target="_blank" rel="noopener noreferrer">
					<span class="tile-label"><ContactIcon id={link.id} size={22} />{link.label}</span>
					<span aria-hidden="true">{link.id === 'cv' ? '↓' : '↗'}</span>
					<span class="sr-only">{newTab}</span>
				</a>
			</li>
		{/each}
	</ul>
	<p class="sr-only" aria-live="polite">{announcement}</p>
</Section>

<style>
	.intro {
		margin: 0 0 1.75rem;
		max-width: 40ch;
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.4;
	}
	.blocks {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 23.75rem), 1fr));
		gap: 1.25rem;
	}
	.block {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 1.75rem 2rem;
		background: var(--surface);
		border: 2px solid var(--text);
		border-radius: var(--radius);
	}
	.mail {
		justify-content: space-between;
		gap: 1.125rem;
	}
	.malt {
		gap: 0.875rem;
	}
	.label {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--muted);
	}
	.address {
		max-width: 100%;
		font-size: 1.875rem;
		font-weight: 800;
		line-height: 1.15;
		letter-spacing: -0.02em;
		color: var(--text);
		text-decoration: none;
		overflow-wrap: anywhere;
	}
	.address:hover {
		color: var(--accent);
	}
	.hint {
		margin: 0;
		font-size: 0.875rem;
		color: var(--muted);
	}
	.malt-head {
		display: flex;
		align-items: center;
		gap: 0.875rem;
	}
	.malt-ic {
		display: inline-grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		border-radius: var(--radius-sm);
		background: var(--malt-tile);
	}
	.malt-title {
		margin: 0;
		font-size: 1.625rem;
		font-weight: 800;
		line-height: 1.2;
		letter-spacing: -0.015em;
	}
	.malt-text {
		margin: 0;
		font-size: 1.0625rem;
		color: var(--body);
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 12.5rem), 1fr));
		gap: 1rem;
		margin: 1.25rem 0 0;
		padding: 0;
		list-style: none;
	}
	.tile {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		min-height: 4rem;
		padding: 0 1.25rem;
		background: var(--surface);
		border: 2px solid var(--text);
		border-radius: var(--radius);
		color: var(--text);
		font-size: 1.125rem;
		font-weight: 700;
		text-decoration: none;
	}
	.tile-label {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
	}
	@media (hover: hover) and (pointer: fine) {
		.tile {
			transition:
				background-color 0.2s,
				color 0.2s,
				transform 0.2s,
				box-shadow 0.2s;
		}
		.tile:hover,
		.tile:focus-visible {
			background: var(--text);
			color: var(--on-text);
			transform: translateY(-4px);
			box-shadow: 6px 6px 0 var(--accent);
		}
		/* Logos take the tile's text colour on the filled tile (a dark logo would vanish). !important
		   because ContactIcon's per-theme brand colour rule is more specific. */
		.tile:hover :global(svg),
		.tile:focus-visible :global(svg) {
			color: var(--on-text) !important;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tile:hover,
		.tile:focus-visible {
			transform: none;
		}
	}
	@media (width < 48rem) {
		.intro {
			font-size: 1.125rem;
		}
		.block {
			padding: 1.25rem;
		}
		.address {
			font-size: 1.375rem;
		}
	}
</style>
