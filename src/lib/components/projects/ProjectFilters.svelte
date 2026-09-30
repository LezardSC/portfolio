<script lang="ts">
	import type { Dict } from '$lib/i18n';
	import {
		CONTEXTS,
		DOMAINS,
		SORTS,
		countFor,
		type Filters,
		type Project,
		type SortKey
	} from '$lib/projects';

	let {
		projects,
		filters = $bindable(),
		sort = $bindable(),
		t
	}: {
		projects: readonly Project[];
		filters: Filters;
		sort: SortKey;
		t: Dict['projects'];
	} = $props();

	const contextOptions = ['all', ...CONTEXTS] as const;
	const domainOptions = ['all', ...DOMAINS] as const;
</script>

<div class="filters">
	<div class="group" role="group" aria-labelledby="filter-context-label">
		<span id="filter-context-label" class="label">{t.contextLabel}</span>
		{#each contextOptions as value (value)}
			{@const count = countFor(projects, filters, 'context', value)}
			{@const active = filters.context === value}
			<button
				type="button"
				class="chip"
				aria-pressed={active}
				disabled={count === 0 && !active}
				onclick={() => (filters = { ...filters, context: value })}
			>
				{value === 'all' ? t.all : t.contexts[value]}
				<span class="count">{count}</span>
			</button>
		{/each}
	</div>

	<div class="group" role="group" aria-labelledby="filter-domain-label">
		<span id="filter-domain-label" class="label">{t.domainLabel}</span>
		{#each domainOptions as value (value)}
			{@const count = countFor(projects, filters, 'domain', value)}
			{@const active = filters.domain === value}
			<button
				type="button"
				class="chip"
				aria-pressed={active}
				disabled={count === 0 && !active}
				onclick={() => (filters = { ...filters, domain: value })}
			>
				{value === 'all' ? t.all : t.domains[value]}
				<span class="count">{count}</span>
			</button>
		{/each}
	</div>

	<label class="sort">
		<span class="label">{t.sortLabel}</span>
		<select bind:value={sort}>
			{#each SORTS as s (s)}
				<option value={s}>{t.sort[s]}</option>
			{/each}
		</select>
	</label>
</div>

<style>
	.filters {
		display: grid;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}
	.group {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	.label {
		min-width: 5.5rem;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		transition:
			border-color 0.15s,
			background-color 0.15s;
	}
	.chip:hover:not(:disabled) {
		border-color: var(--accent);
	}
	.chip[aria-pressed='true'] {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 18%, var(--surface));
	}
	.chip:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.count {
		font-size: 0.75rem;
		color: var(--muted);
	}
	.sort {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	select {
		padding: 0.3rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.9rem;
	}
</style>
