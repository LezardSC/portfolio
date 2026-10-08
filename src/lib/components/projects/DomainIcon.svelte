<script lang="ts">
	import { ICONS } from '$lib/data/icons';
	import type { Domain } from '$lib/projects';
	import Icon from '../Icon.svelte';

	let { domain, size = 32 }: { domain: Domain; size?: number } = $props();

	const PATH: Record<Domain, string> = {
		web: ICONS.code,
		blockchain: ICONS.cube,
		ai: ICONS.sparkles,
		'low-level': ICONS.chip,
		games: ICONS.gamepad
	};
</script>

<Icon path={PATH[domain]} {size} />
