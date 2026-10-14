<script lang="ts">
	import { yearOf, type Hackathon } from '$lib/experience';
	import type { Dict } from '$lib/i18n';
	import { fill } from '$lib/i18n/format';

	/** The project's hackathon results, best first (projectResults); renders nothing when empty. */
	let { results, t }: { results: Hackathon[]; t: Dict['projects'] } = $props();

	const label = (h: Hackathon) =>
		`${fill(t.placement, { place: t.places[h.medal] })} - ${fill(t.resultItem, { event: h.event, year: yearOf(h.date) })}`;
</script>

<!-- One icon per result, next to the title: gold trophy, silver or bronze medal. Dark outline for
     light themes, light fill for dark ones, so each icon stands out on both. -->
{#if results.length}
	<ul class="medals" role="list">
		{#each results as h (h.event + h.date)}
			<li class="m{h.medal}" title={label(h)}>
				<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
					{#if h.medal === 1}
						<path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 15v3" fill="none" />
						<path d="M7 4h10v5a5 5 0 0 1-10 0z" />
						<path d="M8 18h8v3H8z" />
					{:else}
						<path d="M8.5 13 7 22l5-3 5 3-1.5-9" />
						<circle cx="12" cy="9" r="6" />
					{/if}
				</svg>
				<span class="sr-only">{label(h)}</span>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.medals {
		display: flex;
		flex: none;
		gap: 0.125rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: flex;
	}
	svg {
		fill: var(--fill);
		stroke: var(--line);
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.m1 {
		--fill: #f5c542;
		--line: #8a6100;
	}
	.m2 {
		--fill: #d5d9de;
		--line: #5c6470;
	}
	.m3 {
		--fill: #e2a06a;
		--line: #85461a;
	}
</style>
