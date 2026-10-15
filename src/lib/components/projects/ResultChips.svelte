<script lang="ts">
	import { ICONS } from '$lib/data/icons';
	import { placements, yearOf, type Hackathon } from '$lib/experience';
	import type { Dict } from '$lib/i18n';
	import { fill } from '$lib/i18n/format';
	import Icon from '../Icon.svelte';

	/** Big desktop cards only. The project's hackathon results (projectResults); nothing when empty. */
	let { results, t }: { results: Hackathon[]; t: Dict['projects'] } = $props();

	const chips = $derived(placements(results));
	const [prefix, suffix] = $derived(t.placement.split('{place}'));
</script>

{#if chips.length}
	<ul class="results" role="list">
		{#each chips as chip (chip.medal)}
			<li
				class="chip"
				class:win={chip.medal === 1}
				title={chip.results
					.map((h) => fill(t.resultItem, { event: h.event, year: yearOf(h.date) }))
					.join(', ')}
			>
				<Icon path={chip.medal === 1 ? ICONS.trophy : ICONS.medal} size={14} stroke={2} />
				<span
					>{prefix}<strong
						>{t.places[chip.medal]}{#if chip.results.length > 1}<span class="times"
								>×{chip.results.length}</span
							>{/if}</strong
					>{suffix}</span
				>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.results {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3125rem;
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		background: var(--tag);
		color: var(--body);
		font-size: 0.8125rem;
		font-weight: 500;
		line-height: 1.2;
		white-space: nowrap;
	}
	.chip.win {
		background: var(--tint);
		color: var(--accent);
	}
	.chip :global(svg) {
		flex: none;
	}
	strong {
		font-weight: 700;
	}
	/* A space at the start of the span would be trimmed. */
	.times {
		margin-left: 0.25em;
	}
</style>
