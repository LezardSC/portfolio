<script lang="ts">
	import { SKILL_GROUPS } from '$lib/data/skills';
	import type { Lang } from '$lib/i18n';
	import { logoColor, skillName, THEME_BG } from '$lib/skills';
	import Section from '../Section.svelte';
	import SkillGroupIcon from '../skills/SkillGroupIcon.svelte';

	let { lang, title }: { lang: Lang; title: string } = $props();
</script>

<Section id="skills" {title}>
	<div class="groups">
		{#each SKILL_GROUPS as group (group.id)}
			<article aria-labelledby="skills-{group.id}">
				<h3 id="skills-{group.id}">
					<span class="group-icon"><SkillGroupIcon id={group.id} /></span>
					{group.title[lang]}
				</h3>
				<ul role="list">
					{#each group.skills as skill (skillName(skill, 'en'))}
						<li
							style:--logo-dark={logoColor(skill.icon.hex, THEME_BG.dark)}
							style:--logo-light={logoColor(skill.icon.hex, THEME_BG.light)}
						>
							<svg
								viewBox="0 0 24 24"
								width="22"
								height="22"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d={skill.icon.path} />
							</svg>
							{skillName(skill, lang)}
						</li>
					{/each}
				</ul>
			</article>
		{/each}
	</div>
</Section>

<style>
	.groups {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 2.5rem 2rem;
	}
	article {
		padding-top: 1rem;
		border-top: 3px solid var(--accent);
	}
	h3 {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin: 0 0 1rem;
		font-size: 1.15rem;
	}
	.group-icon {
		display: flex;
		color: var(--accent);
	}
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		max-width: 100%;
		padding: 0.45rem 0.9rem;
		border: 1px solid var(--border);
		border-radius: var(--pill);
		font-weight: 500;
		color: var(--text);
	}
	/* Brand colour per theme (computed by logoColor); same theme selectors as src/app.css. */
	li svg {
		flex-shrink: 0;
		color: var(--logo-dark);
	}
	:global(:root[data-theme='light']) li svg {
		color: var(--logo-light);
	}
	@media (prefers-color-scheme: light) {
		:global(:root:not([data-theme])) li svg {
			color: var(--logo-light);
		}
	}
	@media (max-width: 64rem) {
		.groups {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 40rem) {
		.groups {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	@media (width < 48rem) {
		.groups {
			gap: 1.75rem;
		}
		h3 {
			margin-bottom: 0.75rem;
		}
		ul {
			gap: 0.4rem;
		}
		li {
			gap: 0.4rem;
			padding: 0.3rem 0.65rem;
			font-size: 0.9rem;
		}
		li svg {
			width: 18px;
			height: 18px;
		}
	}
</style>
