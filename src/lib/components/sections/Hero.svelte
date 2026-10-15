<script lang="ts">
	import { base } from '$app/paths';
	import { ICONS } from '$lib/data/icons';
	import { HACKATHONS, JOBS } from '$lib/data/experience';
	import { PROFILE } from '$lib/data/profile';
	import { glanceRows } from '$lib/glance';
	import type { Dict, Lang } from '$lib/i18n';
	import { assetHref } from '$lib/paths';
	import ContactIcon from '../contact/ContactIcon.svelte';
	import Icon from '../Icon.svelte';

	let { lang, t, newTab }: { lang: Lang; t: Dict['hero']; newTab: string } = $props();

	const glance = $derived(
		glanceRows(PROFILE.glance, { jobs: JOBS, hackathons: HACKATHONS }, lang, t.glanceText)
	);
	/** First name and the rest: two lines on phones, one on desktop. */
	const [first, ...others] = PROFILE.name.split(' ');
	const last = others.join(' ');
</script>

<section id="hero" class="hero">
	{#if PROFILE.available}
		<p class="available"><span class="dot" aria-hidden="true"></span>{t.available}</p>
	{/if}
	<h1>
		<span class="line">{first}</span>
		<span class="line">{last}<span class="stop" aria-hidden="true">.</span></span>
	</h1>
	<div class="grid">
		<div class="intro">
			<p class="role">{PROFILE.role[lang]}</p>
			<p class="pitch">
				{PROFILE.pitch[lang]}<span class="pitch-more">{' '}{PROFILE.pitchMore[lang]}</span>
			</p>
			<div class="ctas">
				<a class="btn btn-primary see" href="#projects">
					{t.projects}
					<Icon path={ICONS.arrowDown} size={16} stroke={2.2} />
				</a>
				<a
					class="btn cv"
					href={assetHref(base, PROFILE.cv[lang])}
					target="_blank"
					rel="noopener noreferrer"
				>
					<Icon path={ICONS.document} size={16} stroke={2.2} />
					{t.cv} <span class="sr-only">{newTab}</span>
				</a>
				<a class="btn malt" href={PROFILE.malt} target="_blank" rel="noopener noreferrer">
					<ContactIcon id="malt" size={18} />
					<span class="long">{t.malt}</span><span class="short">{t.maltShort}</span>
					<span aria-hidden="true">↗</span>
					<span class="sr-only">{newTab}</span>
				</a>
			</div>
		</div>
		<div class="glance">
			<p class="glance-title">{t.glance}</p>
			<dl>
				{#each glance as row, i (i)}
					<div class="row" class:wide={row.wide}>
						<dt>{row.label}</dt>
						<dd>
							{#if row.short}<span class="full">{row.value}</span><span class="short"
									>{row.short}</span
								>{:else}{row.value}{/if}
						</dd>
					</div>
				{/each}
			</dl>
		</div>
	</div>
</section>

<style>
	.hero {
		max-width: var(--page-max);
		margin: 0 auto;
		padding: calc(var(--nav-h) + 4rem) var(--gutter) 6rem;
	}
	/* Desktop: the hero fills the first screen, so About doesn't peek in above the fold. */
	@media (width >= 48rem) {
		.hero {
			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			justify-content: center;
			min-height: 100svh;
		}
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
	.short {
		display: none;
	}
	/* Phone: name on two lines, then role, first pitch sentence, glance tiles, buttons. */
	@media (width < 48rem) {
		.hero {
			padding: calc(var(--nav-h) + 1.75rem) var(--gutter) 2.5rem;
		}
		.available {
			margin-bottom: 0.875rem;
		}
		h1 {
			/* 58px from 390px wide, smaller below so "Renault." always fits. */
			font-size: min(3.625rem, 14.9vw);
			line-height: 0.88;
			white-space: normal;
		}
		.line {
			display: block;
		}
		.grid {
			display: flex;
			flex-direction: column;
			align-items: stretch;
			gap: 0;
			margin-top: 0;
			padding-top: 0;
			border-top: 0;
		}
		.intro {
			display: contents;
		}
		.role {
			order: 1;
			margin: 1.25rem 0 0.5rem;
			font-size: 1.25rem;
		}
		.pitch {
			order: 2;
			margin: 0 0 1.25rem;
			font-size: 1rem;
			line-height: 1.55;
		}
		.pitch-more,
		.glance-title,
		.full,
		.long,
		.cv :global(svg) {
			display: none;
		}
		.short {
			display: inline;
		}
		.glance {
			order: 3;
			margin-bottom: 1.25rem;
			padding: 0;
			background: none;
			border: 0;
		}
		dl {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.5rem;
		}
		.row,
		.row:last-child {
			display: block;
			min-width: 0;
			padding: 0.75rem 0.875rem;
			background: var(--surface);
			border: 2px solid var(--border);
			border-radius: var(--radius);
		}
		.row.wide {
			grid-column: 1 / -1;
			order: 1;
		}
		dt {
			padding: 0;
			font-size: 0.75rem;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		dd {
			margin-top: 0.125rem;
			font-size: 0.9375rem;
			font-weight: 700;
			line-height: 1.35;
		}
		.ctas {
			order: 4;
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.5rem;
		}
		.ctas .btn {
			justify-content: center;
			padding: 0 1rem;
		}
		.see {
			grid-column: 1 / -1;
		}
	}
</style>
