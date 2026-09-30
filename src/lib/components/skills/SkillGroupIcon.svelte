<script lang="ts">
	import type { Domain } from '$lib/projects';
	import type { SkillGroupId } from '$lib/skills';
	import DomainIcon from '../projects/DomainIcon.svelte';

	let { id, size = 24 }: { id: SkillGroupId; size?: number } = $props();

	const DOMAIN_ICON: Partial<Record<SkillGroupId, Domain>> = {
		systems: 'low-level',
		ai: 'ai',
		blockchain: 'blockchain',
		frontend: 'web'
	};
	const domain = $derived(DOMAIN_ICON[id]);
</script>

{#if domain}
	<DomainIcon {domain} {size} />
{:else}
	<svg
		viewBox="0 0 24 24"
		width={size}
		height={size}
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		{#if id === 'backend'}
			<rect x="3" y="4" width="18" height="7" rx="1.5" />
			<rect x="3" y="13" width="18" height="7" rx="1.5" />
			<path d="M7 7.5h.01M7 16.5h.01" />
		{:else}
			<path d="M20 12a8 8 0 0 1-13.66 5.66M4 12a8 8 0 0 1 13.66-5.66" />
			<path d="M18 3v4h-4M6 21v-4h4" />
		{/if}
	</svg>
{/if}
