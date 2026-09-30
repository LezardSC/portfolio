<script lang="ts">
	let { tech }: { tech: string[] } = $props();
</script>

<ul role="list">
	{#each tech as tag (tag)}
		<li>{tag}</li>
	{/each}
</ul>

<style>
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.9rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--accent);
	}
</style>
