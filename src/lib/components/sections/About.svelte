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
			width="200"
			height="200"
			loading="lazy"
			decoding="async"
		/>
		<div class="text">
			{#each PROFILE.bio as paragraph, i (i)}
				<p>{paragraph[lang]}</p>
			{/each}
			<ul class="facts" role="list">
				{#each PROFILE.facts as fact (fact.icon)}
					<li><span aria-hidden="true">{fact.icon}</span> {fact.text[lang]}</li>
				{/each}
			</ul>
		</div>
	</div>
</Section>

<style>
	.about {
		display: grid;
		grid-template-columns: 200px minmax(0, 1fr);
		gap: 2.5rem;
		align-items: start;
	}
	.photo {
		width: 200px;
		height: 200px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--border);
	}
	.text {
		max-width: 65ch;
	}
	p {
		margin: 0 0 1rem;
	}
	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 1.5rem 0 0;
		padding: 0;
		list-style: none;
	}
	.facts li {
		padding: 0.2rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		font-size: 0.9rem;
		color: var(--muted);
	}
	@media (max-width: 40rem) {
		.about {
			grid-template-columns: minmax(0, 1fr);
			justify-items: center;
			gap: 1.5rem;
		}
	}
</style>
