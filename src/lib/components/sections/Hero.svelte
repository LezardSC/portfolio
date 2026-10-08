<script lang="ts">
	import { base } from '$app/paths';
	import { CONTACT_BRANDS } from '$lib/data/contact-icons';
	import { PROFILE } from '$lib/data/profile';
	import type { Dict, Lang } from '$lib/i18n';
	import { assetHref } from '$lib/paths';

	let { lang, t, newTab }: { lang: Lang; t: Dict['hero']; newTab: string } = $props();

	const malt = CONTACT_BRANDS.malt;
</script>

<section id="hero" class="hero">
	{#if PROFILE.available}
		<p class="available"><span class="dot" aria-hidden="true"></span>{t.available}</p>
	{/if}
	<h1>{PROFILE.name}<span class="stop" aria-hidden="true">.</span></h1>
	<div class="grid">
		<div>
			<p class="role">{PROFILE.role[lang]}</p>
			<p class="pitch">
				{PROFILE.pitch[lang]}<span class="pitch-more"> {PROFILE.pitchMore[lang]}</span>
			</p>
			<div class="ctas">
				<a class="btn btn-primary" href="#projects">
					{t.projects}
					<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
						<path
							d="M12 5v14M5 12l7 7 7-7"
							fill="none"
							stroke="currentColor"
							stroke-width="2.2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</a>
				<a
					class="btn"
					href={assetHref(base, PROFILE.cv[lang])}
					target="_blank"
					rel="noopener noreferrer"
				>
					<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
						<path
							d="M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h6"
							fill="none"
							stroke="currentColor"
							stroke-width="2.2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					{t.cv} <span class="sr-only">{newTab}</span>
				</a>
				<a class="btn" href={PROFILE.malt} target="_blank" rel="noopener noreferrer">
					<svg viewBox={malt.viewBox} width="18" height="18" fill="#{malt.hex}" aria-hidden="true">
						<path d={malt.path} />
					</svg>
					{t.malt} <span aria-hidden="true">↗</span>
					<span class="sr-only">{newTab}</span>
				</a>
			</div>
		</div>
		<div class="glance">
			<p class="glance-title">{t.glance}</p>
			<dl>
				{#each PROFILE.glance as row, i (i)}
					<div class="row">
						<dt>{row.label[lang]}</dt>
						<dd>{row.value[lang]}</dd>
					</div>
				{/each}
			</dl>
		</div>
	</div>
</section>

<style>
	.hero {
		max-width: 77.5rem;
		margin: 0 auto;
		padding: calc(var(--nav-h) + 4rem) 2.5rem 6rem;
	}
	.available {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
		margin: 0 0 1.125rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--ok);
	}
	.dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 50%;
		background: var(--ok-dot);
		box-shadow: 0 0 0 4px var(--ok-ring);
	}
	h1 {
		margin: 0;
		/* 122px from 1271px wide; scales down on narrower desktops so it never overflows. */
		font-size: min(7.625rem, 9.6vw);
		line-height: 0.9;
		font-weight: 900;
		letter-spacing: -0.055em;
		white-space: nowrap;
	}
	.stop {
		color: var(--accent);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 28.75rem), 1fr));
		gap: 3rem 5rem;
		align-items: start;
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 2px solid var(--text);
	}
	.role {
		margin: 0 0 0.875rem;
		font-size: 1.75rem;
		font-weight: 800;
		line-height: 1.25;
		letter-spacing: -0.01em;
		color: var(--accent);
	}
	.pitch {
		margin: 0 0 1.875rem;
		max-width: 52ch;
		font-size: 1.1875rem;
		line-height: 1.6;
		color: var(--body);
	}
	.ctas {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	/* Slightly narrower than the shared 22px padding so the three French labels fit on one row. */
	.ctas .btn {
		padding: 0 1.125rem;
	}
	.glance {
		padding: 0.625rem 1.75rem;
		background: var(--surface);
		border: 2px solid var(--text);
		border-radius: var(--radius);
	}
	.glance-title {
		margin: 0.875rem 0 0.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--accent);
	}
	dl {
		margin: 0;
	}
	.row {
		display: grid;
		grid-template-columns: 8.75rem minmax(0, 1fr);
		gap: 1rem;
		padding: 0.8125rem 0;
		border-bottom: 1px solid var(--rule);
	}
	.row:last-child {
		border-bottom: 0;
	}
	dt {
		padding-top: 2px;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--muted);
	}
	dd {
		margin: 0;
		font-weight: 600;
	}
	/* Phone (M10 will design it): the name wraps and shrinks. */
	@media (width < 48rem) {
		.hero {
			padding: calc(var(--nav-h) + 2rem) 1rem 2.5rem;
		}
		h1 {
			font-size: clamp(2.75rem, 13vw, 4rem);
			white-space: normal;
		}
		.row {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.125rem;
		}
	}
</style>
