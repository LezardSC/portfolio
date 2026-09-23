<script lang="ts">
	import type { Dict } from '$lib/i18n';
	import Section from '../Section.svelte';

	let { t }: { t: Dict } = $props();
</script>

<Section id="skills" title={t.sections.skills}>
	<p class="placeholder">{t.placeholder}</p>
</Section>

<style>
	.placeholder {
		color: var(--muted);
	}
</style>
