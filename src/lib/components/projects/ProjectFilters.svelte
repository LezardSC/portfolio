<script lang="ts">
	import { usedCategories } from '$lib/categories';
	import { CONTEXT_IDS, CONTEXTS, DOMAIN_IDS, DOMAINS } from '$lib/data/categories';
	import type { Dict, Lang } from '$lib/i18n';
	import { SORTS, countFor, type Filters, type Project, type SortKey } from '$lib/projects';

	let {
		projects,
		filters = $bindable(),
		sort = $bindable(),
		lang,
		t
	}: {
		projects: readonly Project[];
		filters: Filters;
		sort: SortKey;
		lang: Lang;
		t: Dict['projects'];
	} = $props();

	/** Only categories that at least one project uses, in category order. */
	const contextOptions = $derived([
		'all' as const,
		...usedCategories(
			CONTEXT_IDS,
			projects.map((p) => p.context)
		)
	]);
	const domainOptions = $derived([
		'all' as const,
		...usedCategories(
			DOMAIN_IDS,
			projects.flatMap((p) => p.domains)
		)
	]);
</script>

<div class="filters">
	<div class="group" role="group" aria-labelledby="filter-context-label">
		<span id="filter-context-label" class="label">{t.contextLabel}</span>
		<div class="seg">
			{#each contextOptions as value (value)}
				{@const count = countFor(projects, filters, 'context', value)}
				{@const active = filters.context === value}
				<button
					type="button"
					class="opt"
					aria-pressed={active}
					disabled={count === 0 && !active}
					onclick={() => (filters = { ...filters, context: value })}
				>
					{value === 'all' ? t.all : CONTEXTS[value].label[lang]}
					<span class="count">{count}</span>
				</button>
			{/each}
		</div>
	</div>

	<div class="group" role="group" aria-labelledby="filter-domain-label">
		<span id="filter-domain-label" class="label">{t.domainLabel}</span>
		<div class="seg">
			{#each domainOptions as value (value)}
				{@const count = countFor(projects, filters, 'domain', value)}
				{@const active = filters.domain === value}
				<button
					type="button"
					class="opt"
					aria-pressed={active}
					disabled={count === 0 && !active}
					onclick={() => (filters = { ...filters, domain: value })}
				>
					{value === 'all' ? t.all : DOMAINS[value].label[lang]}
					<span class="count">{count}</span>
				</button>
			{/each}
		</div>
	</div>

	<div class="group" role="group" aria-labelledby="filter-sort-label">
		<span id="filter-sort-label" class="label">{t.sortLabel}</span>
		<div class="seg">
			{#each SORTS as s (s)}
				<button type="button" class="opt" aria-pressed={sort === s} onclick={() => (sort = s)}>
					{t.sort[s]}
				</button>
			{/each}
		</div>
	</div>

	<!-- Phones: the same filters as dropdowns (CSS shows one set or the other, never both). -->
	<label class="pick phone">
		<span class="label">{t.contextLabel}</span>
		<select
			name="context"
			value={filters.context}
			onchange={(e) =>
				(filters = { ...filters, context: e.currentTarget.value as Filters['context'] })}
		>
			{#each contextOptions as value (value)}
				{@const count = countFor(projects, filters, 'context', value)}
				<option {value} disabled={count === 0 && filters.context !== value}>
					{value === 'all' ? t.all : CONTEXTS[value].label[lang]}
				</option>
			{/each}
		</select>
	</label>

	<label class="pick phone">
		<span class="label">{t.domainLabel}</span>
		<select
			name="domain"
			value={filters.domain}
			onchange={(e) =>
				(filters = { ...filters, domain: e.currentTarget.value as Filters['domain'] })}
		>
			{#each domainOptions as value (value)}
				{@const count = countFor(projects, filters, 'domain', value)}
				<option {value} disabled={count === 0 && filters.domain !== value}>
					{value === 'all' ? t.all : DOMAINS[value].label[lang]}
				</option>
			{/each}
		</select>
	</label>

	<label class="pick phone sort">
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
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 1.25rem 1.75rem;
		margin-bottom: 2.5rem;
	}
	.group {
		display: flex;
		flex-direction: column;
		min-width: 0;
		max-width: 100%;
	}
	.label {
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--muted);
	}
	.seg {
		display: flex;
		flex-wrap: wrap;
		max-width: 100%;
		overflow: hidden;
		background: var(--surface);
		border: 2px solid var(--text);
		border-radius: var(--radius);
	}
	.opt {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 2.625rem;
		padding: 0 0.9375rem;
		border: 0;
		border-right: 1px solid var(--rule);
		background: transparent;
		color: var(--text);
		font: inherit;
		font-size: 0.9375rem;
		cursor: pointer;
	}
	.opt:last-child {
		border-right: 0;
	}
	.opt:hover:not(:disabled):not([aria-pressed='true']) {
		color: var(--accent);
	}
	.opt:focus-visible {
		outline-offset: -4px;
	}
	.opt[aria-pressed='true'] {
		background: var(--text);
		color: var(--on-text);
	}
	/* The accent ring is too faint on the --text fill in dark mode (2.2:1). */
	.opt[aria-pressed='true']:focus-visible {
		outline-color: var(--on-text);
	}
	.opt:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.count {
		font-size: 0.75rem;
		color: var(--muted);
	}
	.opt[aria-pressed='true'] .count {
		color: var(--on-text);
		opacity: 0.75;
	}
	.pick {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	select {
		min-height: var(--tap);
		padding: 0.3rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.9rem;
	}
	.phone {
		display: none;
	}
	/* Phone: Context and Domain side by side, Sort by below; labels above the selects. */
	@media (width < 48rem) {
		.filters {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.75rem;
			margin: 0 0 1.5rem;
		}
		.group {
			display: none;
		}
		.phone {
			display: flex;
		}
		.pick {
			flex-direction: column;
			align-items: stretch;
			gap: 0.375rem;
			min-width: 0;
		}
		.sort {
			grid-column: 1 / -1;
		}
		.pick .label {
			margin: 0;
			font-size: 0.8125rem;
		}
		/* 16px text: smaller makes iOS zoom in on focus. */
		select {
			width: 100%;
			min-height: 3rem;
			padding: 0 2.5rem 0 0.875rem;
			border: 2px solid var(--text);
			border-radius: var(--radius);
			font-size: 1rem;
			font-weight: 600;
			appearance: none;
			background-image:
				linear-gradient(45deg, transparent 50%, currentColor 50%),
				linear-gradient(135deg, currentColor 50%, transparent 50%);
			background-position:
				calc(100% - 20px) 21px,
				calc(100% - 14px) 21px;
			background-size: 6px 6px;
			background-repeat: no-repeat;
		}
	}
	/* Narrow phones: "Professionnel" needs the room; the padding gives, never the font. */
	@media (width < 24.375rem) {
		select {
			padding: 0 2rem 0 0.625rem;
			background-position:
				calc(100% - 16px) 21px,
				calc(100% - 10px) 21px;
		}
	}
</style>
