<script lang="ts">
	import { base } from '$app/paths';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import { assetHref } from '$lib/paths';
	import Section from '../Section.svelte';

	let { lang, title, t }: { lang: Lang; title: string; t: Dict['about'] } = $props();
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
			{#each PROFILE.bio as paragraph, i (i)}
				<p>{paragraph[lang]}</p>
			{/each}
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
	@media (max-width: 40rem) {
		.about {
			grid-template-columns: minmax(0, 1fr);
			justify-items: center;
			gap: 1.5rem;
		}
		.photo {
			width: 12rem;
		}
		.text {
			font-size: 1.0625rem;
		}
	}
</style>
