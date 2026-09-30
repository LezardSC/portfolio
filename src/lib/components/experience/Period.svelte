<script lang="ts">
	import type { PeriodPoint } from '$lib/experience';

	let { points }: { points: PeriodPoint[] } = $props();
</script>

{#each points as point, i (i)}{#if i > 0}{' – '}{/if}{#if point.datetime}<time
			datetime={point.datetime}>{point.text}</time
		>{:else}{point.text}{/if}{/each}
