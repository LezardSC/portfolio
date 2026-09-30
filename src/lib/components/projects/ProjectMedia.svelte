<script lang="ts">
	import { base } from '$app/paths';
	import { prefersReducedMotion } from 'svelte/motion';
	import { primaryLink, type Domain, type Project } from '$lib/projects';

	let { project }: { project: Project } = $props();

	/** Placeholder gradient hue per (first) domain. */
	const HUE: Record<Domain, number> = {
		web: 210,
		blockchain: 265,
		ai: 150,
		'low-level': 25,
		games: 330
	};

	const href = $derived(primaryLink(project));
	const media = $derived(project.media);
	let video = $state<HTMLVideoElement>();

	$effect(() => {
		const v = video;
		if (!v || prefersReducedMotion.current) return;
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) v.play().catch(() => {});
				else v.pause();
			},
			{ threshold: 0.25 }
		);
		io.observe(v);
		return () => {
			io.disconnect();
			v.pause();
		};
	});
</script>

{#snippet content()}
	{#if media?.kind === 'image'}
		<img src="{base}/{media.src}" alt="" loading="lazy" decoding="async" />
	{:else if media?.kind === 'video'}
		<video
			bind:this={video}
			src="{base}/{media.src}"
			poster={media.poster ? `${base}/${media.poster}` : undefined}
			muted
			loop
			playsinline
			preload="metadata"
		></video>
	{:else}
		<div class="placeholder" style:--hue={HUE[project.domains[0]]}>
			<span>{project.title}</span>
		</div>
	{/if}
{/snippet}

{#if href}
	<a
		class="media"
		{href}
		target="_blank"
		rel="noopener noreferrer"
		tabindex="-1"
		aria-hidden="true"
		aria-label={project.title}
	>
		{@render content()}
	</a>
{:else}
	<div class="media">{@render content()}</div>
{/if}

<style>
	.media {
		display: block;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--border);
	}
	img,
	video {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s;
	}
	a.media:hover img,
	a.media:hover video,
	a.media:hover .placeholder {
		transform: scale(1.03);
	}
	.placeholder {
		display: grid;
		place-items: center;
		height: 100%;
		padding: 1rem;
		background: linear-gradient(
			135deg,
			hsl(var(--hue) 65% 45%),
			hsl(calc(var(--hue) + 40) 65% 28%)
		);
		transition: transform 0.3s;
	}
	.placeholder span {
		color: #fff;
		font-size: clamp(1.25rem, 3vw, 2rem);
		font-weight: 700;
		text-align: center;
		text-shadow: 0 2px 12px rgb(0 0 0 / 0.35);
	}
	@media (prefers-reduced-motion: reduce) {
		img,
		video,
		.placeholder {
			transition: none;
		}
		a.media:hover img,
		a.media:hover video,
		a.media:hover .placeholder {
			transform: none;
		}
	}
</style>
