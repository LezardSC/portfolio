<script lang="ts">
	import type { Dict } from '$lib/i18n';
	import Section from '../Section.svelte';

	let { t }: { t: Dict } = $props();
</script>

<Section id="about" title={t.sections.about}>
	<p class="placeholder">{t.placeholder}</p>
</Section>

<style>
	.placeholder {
		color: var(--muted);
	}
</style>
