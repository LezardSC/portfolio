<script lang="ts">
	import { base } from '$app/paths';
	import { prefersReducedMotion } from 'svelte/motion';
	import { MediaQuery } from 'svelte/reactivity';
	import { DOMAINS } from '$lib/data/categories';
	import {
		DESKTOP_QUERY,
		mainDomain,
		primaryLink,
		shouldPlayVideo,
		type Project
	} from '$lib/projects';

	let { project }: { project: Project } = $props();

	const href = $derived(primaryLink(project));
	const media = $derived(project.media);
	/** False on the server, so the prerendered HTML never contains a video. */
	const desktop = new MediaQuery(DESKTOP_QUERY, false);

	let frame = $state<HTMLElement>();
	let video = $state<HTMLVideoElement>();
	let inView = $state(false);
	/** Set the first time the video should play; it then stays (paused off-screen) so scrolling back doesn't reload it. */
	let started = $state(false);
	/** The video failed to load: keep showing the poster. */
	let failed = $state(false);

	const play = $derived(
		shouldPlayVideo({
			desktop: desktop.current,
			reducedMotion: prefersReducedMotion.current,
			inView
		})
	);

	$effect(() => {
		if (play) started = true;
	});

	$effect(() => {
		const el = frame;
		if (!el || media?.kind !== 'video') return;
		const io = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting), {
			threshold: 0.25
		});
		io.observe(el);
		return () => io.disconnect();
	});

	$effect(() => {
		const v = video;
		if (!v) return;
		if (play) v.play().catch(() => {});
		else v.pause();
	});
</script>

{#snippet content()}
	<div class="frame" bind:this={frame}>
		{#if media}
			<img
				src="{base}/{media.kind === 'video' ? media.poster : media.src}"
				alt=""
				loading="lazy"
				decoding="async"
			/>
			{#if media.kind === 'video' && started && !failed}
				<video
					bind:this={video}
					src="{base}/{media.src}"
					poster="{base}/{media.poster}"
					muted
					loop
					playsinline
					preload="auto"
					onerror={() => (failed = true)}
				></video>
			{/if}
		{:else}
			<div class="placeholder" style:--dc={DOMAINS[mainDomain(project)].color}>
				<span>{project.title}</span>
			</div>
		{/if}
	</div>
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
		/* The placeholder title inside the link must not be underlined. */
		text-decoration: none;
	}
	/* Cards scale this on hover (see ProjectCardLarge). */
	.frame {
		position: relative;
		height: 100%;
		transition: transform 0.3s;
	}
	img,
	video {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.placeholder {
		display: grid;
		place-items: center;
		height: 100%;
		padding: 1rem;
		/* From the main domain colour (the one intended visual change of M11). */
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--dc) 80%, #ffffff),
			color-mix(in srgb, var(--dc) 60%, #000000)
		);
	}
	.placeholder span {
		color: #fff;
		font-size: clamp(1.25rem, 3vw, 2rem);
		font-weight: 700;
		text-align: center;
		text-shadow: 0 2px 12px rgb(0 0 0 / 0.35);
	}
	@media (prefers-reduced-motion: reduce) {
		.frame {
			transition: none;
		}
	}
</style>
