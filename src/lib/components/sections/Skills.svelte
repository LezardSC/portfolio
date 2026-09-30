<script lang="ts">
	import { SKILL_GROUPS } from '$lib/data/skills';
	import type { Lang } from '$lib/i18n';
	import { skillName } from '$lib/skills';
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
				<ul>
					{#each group.skills as skill (skillName(skill, 'en'))}
						<li>
							<svg
								viewBox="0 0 24 24"
								width="16"
								height="16"
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
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		max-width: 100%;
		padding: 0.3rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		font-size: 0.9rem;
		color: var(--text);
	}
	li svg {
		flex-shrink: 0;
		color: var(--muted);
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
</style>
