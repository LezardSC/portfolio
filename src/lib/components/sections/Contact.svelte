<script lang="ts">
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
	let address: HTMLElement | undefined = $state();
	let timer: ReturnType<typeof setTimeout> | undefined;

	/** Copy the address; if the clipboard is unavailable (plain http, denied), select it instead. */
	async function copy() {
		try {
			await navigator.clipboard.writeText(PROFILE.email);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 2000);
		} catch {
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
	<ul class="tiles">
		{#each links as link (link.id)}
			<li>
				{#if link.id === 'email'}
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
	<p class="sr-only" aria-live="polite">{copied ? t.copied : ''}</p>
</Section>

<style>
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
		border-radius: 0.25rem;
	}
	.label {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.copy {
		flex-shrink: 0;
		min-width: 4.5rem;
		margin-left: auto;
		padding: 0.2rem 0.7rem;
		font: inherit;
		font-size: 0.85rem;
		color: var(--muted);
		background: none;
		border: 1px solid var(--border);
		border-radius: 999px;
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
