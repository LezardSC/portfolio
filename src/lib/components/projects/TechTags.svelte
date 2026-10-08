<script lang="ts">
	let { tech, small = false }: { tech: string[]; small?: boolean } = $props();
</script>

<ul role="list" class:small>
	{#each tech as tag (tag)}
		<li>{tag}</li>
	{/each}
</ul>

<style>
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		padding: 0.4375rem 0.625rem;
		border-radius: var(--radius-sm);
		background: var(--tag);
		color: var(--body);
		font-size: 0.875rem;
		font-weight: 500;
		line-height: 1;
	}
	.small li {
		padding: 0.3125rem 0.5rem;
		font-size: 0.8125rem;
	}
	@media (width < 48rem) {
		li,
		.small li {
			padding: 0.3125rem 0.5rem;
			font-size: 0.75rem;
		}
	}
</style>
