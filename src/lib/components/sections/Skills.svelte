<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { SKILL_GROUPS } from '$lib/data/skills';
	import type { Dict, Lang } from '$lib/i18n';
	import { logoColor, nextTab, skillName, THEME_BG } from '$lib/skills';
	import Section from '../Section.svelte';
	import SkillGroupIcon from '../skills/SkillGroupIcon.svelte';

	let { lang, title, t }: { lang: Lang; title: string; t: Dict['skills'] } = $props();

	/** False in the prerendered HTML: without JS every group shows, stacked, and there are no tabs. */
	let enhanced = $state(false);
	let selected = $state(0);
	const tabs: HTMLButtonElement[] = [];

	onMount(() => {
		enhanced = true;
	});

	async function onKeydown(event: KeyboardEvent, index: number) {
		const next = nextTab(index, event.key, SKILL_GROUPS.length);
		if (next === null) return;
		event.preventDefault();
		selected = next;
		await tick();
		tabs[next]?.focus();
	}
</script>

<Section id="skills" {title} lead={t.lead}>
	<div class="skills" class:enhanced>
		{#if enhanced}
			<div class="tablist" role="tablist" aria-orientation="vertical" aria-label={t.tabsLabel}>
				{#each SKILL_GROUPS as group, i (group.id)}
					<button
						bind:this={tabs[i]}
						type="button"
						role="tab"
						id="skills-tab-{group.id}"
						class="tab"
						aria-selected={selected === i}
						aria-controls="skills-panel-{group.id}"
						tabindex={selected === i ? 0 : -1}
						onclick={() => (selected = i)}
						onkeydown={(e) => onKeydown(e, i)}
					>
						<span class="ic"><SkillGroupIcon id={group.id} size={22} /></span>
						<span>{group.title[lang]}</span>
						<span class="count" aria-hidden="true">{group.skills.length}</span>
					</button>
				{/each}
			</div>
		{/if}
		<div class="panels">
			{#each SKILL_GROUPS as group, i (group.id)}
				<div
					class="panel"
					id="skills-panel-{group.id}"
					role={enhanced ? 'tabpanel' : undefined}
					aria-labelledby={enhanced ? `skills-tab-${group.id}` : undefined}
					hidden={enhanced && selected !== i}
				>
					<h3 id="skills-{group.id}">{group.title[lang]}</h3>
					<p class="desc">{group.description[lang]}</p>
					<ul role="list" class="tiles">
						{#each group.skills as skill (skillName(skill, 'en'))}
							<li
								style:--logo-dark={logoColor(skill.icon.hex, THEME_BG.dark)}
								style:--logo-light={logoColor(skill.icon.hex, THEME_BG.light)}
							>
								<svg
									viewBox="0 0 24 24"
									width="30"
									height="30"
									fill="currentColor"
									aria-hidden="true"
								>
									<path d={skill.icon.path} />
								</svg>
								{skillName(skill, lang)}
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
</Section>

<style>
	.skills.enhanced {
		display: grid;
		grid-template-columns: 18.75rem minmax(0, 1fr);
		gap: 1.75rem;
		align-items: start;
	}
	.panels {
		display: grid;
		gap: 1.25rem;
	}
	.tablist {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.tab {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		width: 100%;
		min-height: 4rem;
		padding: 0.625rem 1rem 0.625rem 0.625rem;
		border: 2px solid transparent;
		border-radius: var(--radius);
		background: transparent;
		color: var(--text);
		font: inherit;
		font-size: 1.125rem;
		font-weight: 700;
		text-align: left;
		cursor: pointer;
		transition:
			background-color 0.2s,
			border-color 0.2s;
	}
	.tab:hover {
		background: var(--surface);
		border-color: var(--border);
	}
	.tab[aria-selected='true'] {
		background: var(--surface);
		border-color: var(--text);
		box-shadow: 5px 5px 0 var(--accent);
	}
	.ic {
		display: inline-grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		flex: none;
		border-radius: var(--radius-sm);
		background: var(--tint);
		color: var(--accent);
	}
	.count {
		margin-left: auto;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--muted);
	}
	.panel {
		padding: 2rem 2.125rem;
		background: var(--surface);
		border: 2px solid var(--border);
		border-radius: var(--radius);
	}
	.enhanced .panel {
		min-height: 30rem;
	}
	h3 {
		margin: 0;
		font-size: 2rem;
		line-height: 1.15;
		font-weight: 800;
		letter-spacing: -0.02em;
	}
	.desc {
		margin: 0.5rem 0 1.5rem;
		font-size: 1.125rem;
		color: var(--body);
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
		gap: 0.625rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.tiles li {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 1rem 1.125rem;
		border-radius: var(--radius);
		background: var(--bg);
		font-size: 1.125rem;
		font-weight: 600;
	}
	/* Brand colour per theme (computed by logoColor); same theme selectors as src/app.css. */
	.tiles svg {
		flex-shrink: 0;
		color: var(--logo-dark);
	}
	:global(:root[data-theme='light']) .tiles svg {
		color: var(--logo-light);
	}
	@media (prefers-color-scheme: light) {
		:global(:root:not([data-theme])) .tiles svg {
			color: var(--logo-light);
		}
	}
	/* Phone (M10 will design it): tabs above the panel, smaller tiles. */
	@media (width < 48rem) {
		.skills.enhanced {
			grid-template-columns: minmax(0, 1fr);
		}
		.enhanced .panel {
			min-height: 0;
		}
		.panel {
			padding: 1.25rem;
		}
		.tiles {
			grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
			gap: 0.5rem;
		}
		.tiles li {
			gap: 0.5rem;
			padding: 0.625rem 0.75rem;
			font-size: 1rem;
		}
		.tiles svg {
			width: 22px;
			height: 22px;
		}
	}
</style>
