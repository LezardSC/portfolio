<script lang="ts">
	import { tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { SKILL_GROUPS } from '$lib/data/skills';
	import type { Dict, Lang } from '$lib/i18n';
	import { ICONS } from '$lib/data/icons';
	import { hydrated } from '$lib/hydrated.svelte';
	import { DESKTOP_QUERY } from '$lib/breakpoints';
	import { logoColor } from '$lib/color';
	import { localize } from '$lib/i18n/lang';
	import { nextTab, panelHidden } from '$lib/skills';
	import { THEME_BG } from '$lib/theme';
	import Section from '../Section.svelte';
	import Icon from '../Icon.svelte';

	let { lang, title, t }: { lang: Lang; title: string; t: Dict['skills'] } = $props();

	/** False in the prerendered HTML: without JS every group shows, stacked, and there are no tabs. */
	const enhanced = hydrated();
	let selected = $state(0);
	/** Phone accordion: the open group (Backend first), -1 when all are closed. */
	let open = $state(0);
	/** False on the server; before hydration nothing is hidden anyway. */
	const desktop = new MediaQuery(DESKTOP_QUERY, false);
	const tabs: HTMLButtonElement[] = [];

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
	<div class="skills" class:enhanced={enhanced.current}>
		{#if enhanced.current}
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
						<span class="ic"><Icon path={group.icon} size={22} /></span>
						<span>{group.title[lang]}</span>
						<span class="count" aria-hidden="true">{group.skills.length}</span>
					</button>
				{/each}
			</div>
		{/if}
		<div class="panels">
			{#each SKILL_GROUPS as group, i (group.id)}
				{@const hidden = panelHidden(
					{ enhanced: enhanced.current, desktop: desktop.current, selected, open },
					i
				)}
				{#if enhanced.current}
					<!-- Phone only (CSS): the tab list is hidden there, these buttons on desktop. -->
					<button
						type="button"
						class="acc"
						id="skills-acc-{group.id}"
						aria-expanded={open === i}
						aria-controls="skills-panel-{group.id}"
						onclick={() => (open = open === i ? -1 : i)}
					>
						<span class="ic"><Icon path={group.icon} size={22} /></span>
						<span>{group.title[lang]}</span>
						<span class="count" aria-hidden="true">{group.skills.length}</span>
						<Icon path={open === i ? ICONS.chevronUp : ICONS.chevronDown} size={18} stroke={2.2} />
					</button>
				{/if}
				<div
					class="panel"
					id="skills-panel-{group.id}"
					role={enhanced.current && desktop.current ? 'tabpanel' : undefined}
					aria-labelledby={!enhanced.current
						? undefined
						: desktop.current
							? `skills-tab-${group.id}`
							: `skills-acc-${group.id}`}
					hidden={hidden ? 'until-found' : undefined}
					onbeforematch={() => {
						selected = i;
						open = i;
					}}
				>
					<h3 id="skills-{group.id}">{group.title[lang]}</h3>
					<p class="desc">{group.description[lang]}</p>
					<ul role="list" class="tiles">
						{#each group.skills as skill (localize(skill.name, 'en'))}
							<li
								style:--logo-dark={logoColor(skill.icon.hex, THEME_BG.dark)}
								style:--logo-light={logoColor(skill.icon.hex, THEME_BG.light)}
							>
								<svg
									class="logo"
									viewBox="0 0 24 24"
									width="30"
									height="30"
									fill="currentColor"
									aria-hidden="true"
								>
									<path d={skill.icon.path} />
								</svg>
								{localize(skill.name, lang)}
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
		align-items: stretch;
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
	.acc {
		display: none;
	}
	.panel {
		padding: 2rem 2.125rem;
		background: var(--surface);
		border: 2px solid var(--border);
		border-radius: var(--radius);
	}
	/* The open panel is at least as tall as the tab list beside it (stretched row), and 30rem. */
	.enhanced .panels {
		display: flex;
		flex-direction: column;
	}
	.enhanced .panel {
		flex: 1;
		min-height: 30rem;
	}
	/* A closed panel is hidden="until-found": its content is skipped but its box stays, so it has no
	   size of its own (and no gap), or the six panels would stack as empty frames. */
	.enhanced .panels {
		gap: 0;
	}
	.panel[hidden] {
		flex: none;
		min-height: 0;
		padding: 0;
		border: 0;
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
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 12.5rem), 1fr));
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
	.tiles svg {
		flex-shrink: 0;
	}
	/* Too narrow for tabs beside the panel (300px + a 200px tile + padding): tabs above it. */
	@media (width < 60rem) {
		.skills.enhanced {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	/* Printed, every area shows (hidden panels and the tab list are screen-only). */
	@media print {
		.tablist,
		.acc {
			display: none;
		}
		.panel[hidden] {
			display: block;
			content-visibility: visible;
		}
	}
	/* Phone: an accordion (one group open at a time) instead of the tabs. */
	@media (width < 48rem) {
		.tablist {
			display: none;
		}
		.acc {
			display: flex;
			align-items: center;
			gap: 0.875rem;
			width: 100%;
			min-height: 4rem;
			margin-top: 0.625rem;
			padding: 0.625rem 0.875rem 0.625rem 0.625rem;
			border: 2px solid var(--border);
			border-radius: var(--radius);
			background: transparent;
			color: var(--text);
			font: inherit;
			font-size: 1.0625rem;
			font-weight: 700;
			text-align: left;
			cursor: pointer;
		}
		.acc:first-child {
			margin-top: 0;
		}
		.acc[aria-expanded='true'] {
			background: var(--surface);
			border-color: var(--text);
			box-shadow: 5px 5px 0 var(--accent);
		}
		.acc .ic {
			width: 2.5rem;
			height: 2.5rem;
		}
		.acc > :global(svg) {
			flex: none;
		}
		.panel {
			padding: 1.25rem;
		}
		.enhanced .panel {
			min-height: 0;
			padding: 1.125rem 0.125rem 0.5rem;
			background: none;
			border: 0;
		}
		.enhanced .panel[hidden] {
			padding: 0;
		}
		/* The accordion button names the group; the heading stays for screen readers. */
		.enhanced h3 {
			position: absolute;
			width: 1px;
			height: 1px;
			margin: -1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
		.desc {
			margin: 0 0 0.875rem;
			font-size: 1rem;
		}
		.tiles {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.5rem;
		}
		.tiles li {
			gap: 0.625rem;
			padding: 0.75rem;
			background: var(--surface);
			border: 1px solid var(--border);
			font-size: 0.9375rem;
			line-height: 1.25;
		}
		.tiles svg {
			width: 24px;
			height: 24px;
		}
	}
</style>
