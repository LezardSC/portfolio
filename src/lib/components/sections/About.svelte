<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import { assetHref } from '$lib/paths';
	import Section from '../Section.svelte';

	let {
		lang,
		title,
		t,
		common
	}: { lang: Lang; title: string; t: Dict['about']; common: Dict['common'] } = $props();

	const [first, ...rest] = PROFILE.bio;
	/** False in the prerendered HTML: without JS every paragraph shows and there is no button. */
	let ready = $state(false);
	let open = $state(false);

	onMount(() => {
		ready = true;
	});
</script>

<Section id="about" {title}>
	<div class="about">
		<img
			class="photo"
			src={assetHref(base, PROFILE.photo)}
			alt={t.photoAlt}
			width="240"
			height="300"
			loading="lazy"
			decoding="async"
		/>
		<div class="text">
			<p>{first[lang]}</p>
			<!-- Folded on phones only (CSS), and only once hydrated. -->
			<div id="about-more" class="rest" class:folded={ready && !open}>
				{#each rest as paragraph, i (i)}
					<p>{paragraph[lang]}</p>
				{/each}
			</div>
			{#if ready && rest.length > 0}
				<button
					type="button"
					class="read-more"
					aria-expanded={open}
					aria-controls="about-more"
					onclick={() => (open = !open)}>{open ? common.showLess : common.readMore}</button
				>
			{/if}
		</div>
	</div>
</Section>

<style>
	.about {
		display: grid;
		grid-template-columns: 15rem minmax(0, 1fr);
		gap: 3rem;
		align-items: start;
	}
	.photo {
		width: 15rem;
		height: auto;
		aspect-ratio: 4 / 5;
		object-fit: cover;
		border-radius: var(--radius);
	}
	.text {
		max-width: 62ch;
		font-size: 1.1875rem;
		line-height: 1.65;
	}
	p {
		margin: 0 0 1.125rem;
	}
	p:last-child {
		margin-bottom: 0;
	}
	.rest p:last-child {
		margin-bottom: 0;
	}
	.read-more {
		display: none;
	}
	/* Phone: small photo beside the first paragraph; the rest behind "Read more". */
	@media (width < 48rem) {
		.about {
			grid-template-columns: 5.5rem minmax(0, 1fr);
			gap: 0.875rem 1rem;
		}
		.photo {
			width: 5.5rem;
		}
		.text {
			display: contents;
			font-size: 1rem;
			line-height: 1.55;
		}
		.text > p {
			grid-column: 2;
			margin: 0;
		}
		.rest {
			grid-column: 1 / -1;
			line-height: 1.6;
		}
		.rest p {
			margin: 0 0 0.875rem;
		}
		.rest.folded {
			display: none;
		}
		.read-more {
			grid-column: 1 / -1;
			justify-self: start;
			display: inline-flex;
			align-items: center;
			min-height: 3rem;
			padding: 0 0.875rem;
			background: var(--surface);
			border: 1.5px solid var(--text);
			border-radius: var(--radius);
			color: var(--text);
			font: inherit;
			font-size: 0.9375rem;
			font-weight: 600;
			cursor: pointer;
		}
		.read-more:hover {
			border-color: var(--accent);
			color: var(--accent);
		}
	}
</style>
