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
	<ul class="tiles" role="list">
		{#each links as link (link.id)}
			<li>
				{#if link.id === 'email'}
					{@const [local, domain] = link.label.split('@')}
					<div class="tile">
						<a class="mail" href={link.href} aria-label={t.emailLabel}>
							<ContactIcon id="email" />
						</a>
						<!-- <wbr> lets a narrow screen break the address after the @, not mid-word. -->
						<span class="label" bind:this={address}>{local}@<wbr />{domain}</span>
						<button type="button" class="copy" onclick={copy}>
							{copied ? t.copied : t.copy}
						</button>
					</div>
					{#if failed}<p class="hint">{t.copyHint}</p>{/if}
				{:else}
					<a
						class="tile"
						href={link.href}
						target={link.external ? '_blank' : undefined}
						rel={link.external ? 'noopener noreferrer' : undefined}
					>
						<ContactIcon id={link.id} />
						<span class="label">{link.label}</span>
						{#if link.external}<span class="sr-only">{newTab}</span>{/if}
					</a>
				{/if}
			</li>
		{/each}
	</ul>
	<p class="sr-only" aria-live="polite">{announcement}</p>
</Section>

<style>
	.hint {
		margin: 0.4rem 0 0;
		font-size: 0.85rem;
		color: var(--muted);
		text-align: center;
	}
	.intro {
		margin: -0.5rem 0 2rem;
		text-align: center;
		color: var(--muted);
	}
	.tiles {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
	}
	.tile {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		height: 100%;
		padding: 0.75rem 1.1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		color: var(--text);
		font-weight: 500;
		text-decoration: none;
		transition:
			border-color 0.15s,
			transform 0.15s;
	}
	.tile:hover,
	a.tile:focus-visible,
	.tile:has(:focus-visible) {
		border-color: var(--accent);
		transform: translateY(-2px);
	}
	.mail {
		display: flex;
		min-width: var(--tap);
		min-height: var(--tap);
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
	}
	.label {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.copy {
		flex-shrink: 0;
		min-height: var(--tap);
		min-width: 4.5rem;
		margin-left: auto;
		padding: 0.2rem 0.7rem;
		font: inherit;
		font-size: 0.85rem;
		color: var(--muted);
		background: none;
		border: 1px solid var(--border);
		border-radius: var(--pill);
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.copy:hover {
		color: var(--accent);
		border-color: var(--accent);
	}
	@media (prefers-reduced-motion: reduce) {
		.tile {
			transition: border-color 0.15s;
		}
		.tile:hover,
		a.tile:focus-visible,
		.tile:has(:focus-visible) {
			transform: none;
		}
	}
	@media (max-width: 40rem) {
		.tiles {
			flex-direction: column;
		}
	}
</style>
