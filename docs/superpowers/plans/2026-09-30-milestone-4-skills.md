# Milestone 4 - Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Skills placeholder with a static showcase: six skill groups (Backend, Systems & Low-level, DevOps & Tools, AI & ML, Blockchain, Frontend), each shown as a card with an accent top bar, a group line icon and chips made of a monochrome logo and a name, in EN and FR.

**Architecture:** Types and the pure `skillName(skill, lang)` helper live in `src/lib/skills.ts` (same split as `src/lib/projects.ts`). Content lives in `src/lib/data/skills.ts`. Brand logos are single SVG paths imported one by one from `simple-icons`, and the four glyphs with no brand logo are hand-drawn paths in `src/lib/data/skill-icons.ts`. `Skills.svelte` only renders, with props narrowed to `{ lang, title }`.

**Tech Stack:** SvelteKit + Svelte 5 runes, adapter-static, TypeScript, Vitest, Prettier, `simple-icons` (new devDependency, CC0). `sharp` is used once, from the scratchpad, to render an icon contact sheet for a visual check. It is **not** a project dependency.

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-design.md`, section "Skills".

## Global Constraints

- Runes only (`$props`, `$state`, `$derived`); no `export let`, no `$:`, no legacy stores.
- No `svelte.config.js`; SvelteKit config lives in `vite.config.ts`.
- UI text only in `src/lib/i18n/en.ts` and `fr.ts`. Content, including group titles and translatable skill names, lives in `src/lib/data/` with `{ en, fr }` fields. Components only render it.
- `src/lib/i18n/lang.ts` must not import the dictionaries.
- Put logic in pure functions with unit tests (`*.spec.ts` next to the file).
- Icons are monochrome (`fill="currentColor"`), never brand colours. Logos are `aria-hidden="true"`, because the skill name is always there as text.
- Each skill appears in exactly one group. Group order: `backend`, `systems`, `devops`, `ai`, `blockchain`, `frontend`.
- Nothing in the Skills section is clickable, and there is no hover effect.
- The skill cards must not look like project cards: transparent background, no side or bottom borders, a 3px `--accent` top border.
- Grid: 3 columns by default, 2 at `max-width: 64rem`, 1 at `max-width: 40rem`.
- Run commands from the worktree root: `/home/lezard/portfolio/.claude/worktrees/milestone-4-skills`.

## Review Focus

1. **The whole icon set shipped to users.** `simple-icons` holds ~3,400 icons; only the ~24 imported ones may end up in `build/`. Pinned by the build grep in Task 3 (an unused icon's title must be absent).
2. **Logos invisible in one theme.** They must follow the theme through `currentColor`. There's no automated test, so it's a manual check in both themes in the review guide (Task 4), and the `fill="currentColor"` attribute is pinned by the build grep in Task 3.
3. **Hand-drawn icons rendering as solid blobs.** The hard hat's diamond, the chip's centre and the chat bubble's dots are holes made by opposite path winding, and a winding mistake fills them in. Pinned by the rendered contact sheet in Task 2.
4. **The wrong language on translated chips.** `/fr/` must show "Vision par ordinateur", "Agents LLM" and "Ingénierie de prompts", and `/en/` their English names. Pinned by the build grep in Task 3.
5. **Narrow phones (360px).** Long FR chips ("Ingénierie de prompts", "Systèmes & bas niveau") wrap instead of overflowing. Manual check in the review guide (Task 4).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/skills.ts` (create) | `SkillIcon`, `Skill`, `SkillGroupId`, `SkillGroup` types; pure `skillName()` |
| `src/lib/skills.spec.ts` (create) | Unit tests for `skillName` |
| `src/lib/data/skill-icons.ts` (create) | Hand-drawn icon paths: `HARDHAT`, `CPU`, `DATABASE`, `CHAT` |
| `src/lib/data/skills.ts` (create) | `SKILL_GROUPS` content |
| `src/lib/data/skills.spec.ts` (create) | Data integrity tests |
| `package.json`, `package-lock.json` (modify) | Add `simple-icons` devDependency |
| `src/lib/components/skills/SkillGroupIcon.svelte` (create) | Line icon per group id (reuses `DomainIcon` for 4 of them) |
| `src/lib/components/sections/Skills.svelte` (rewrite) | Skills rendering |
| `src/routes/[lang=lang]/+page.svelte` (modify) | Pass `{ lang, title }` to Skills |
| `docs/reviews/milestone-4-review-guide.md` (create) | Review guide for the PR |

---

### Task 1: Skill types and `skillName`

**Files:**
- Create: `src/lib/skills.ts`
- Test: `src/lib/skills.spec.ts`

**Interfaces:**
- Consumes: `Lang`, `Localized` from `$lib/i18n/lang` (`Localized = Record<Lang, string>`).
- Produces:
  ```ts
  export type SkillIcon = { path: string };
  export type Skill = { name: string | Localized; icon: SkillIcon };
  export type SkillGroupId = 'backend' | 'systems' | 'devops' | 'ai' | 'blockchain' | 'frontend';
  export type SkillGroup = { id: SkillGroupId; title: Localized; skills: Skill[] };
  export function skillName(skill: Skill, lang: Lang): string;
  ```

- [ ] **Step 1: Write the failing test**

`src/lib/skills.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { skillName, type Skill } from './skills';

const icon = { path: 'M0 0h24v24H0z' };

describe('skillName', () => {
	it('returns a plain string name as-is in every language', () => {
		const skill: Skill = { name: 'Rust', icon };
		expect(skillName(skill, 'en')).toBe('Rust');
		expect(skillName(skill, 'fr')).toBe('Rust');
	});

	it('picks the requested language of a localized name', () => {
		const skill: Skill = {
			name: { en: 'Computer Vision', fr: 'Vision par ordinateur' },
			icon
		};
		expect(skillName(skill, 'en')).toBe('Computer Vision');
		expect(skillName(skill, 'fr')).toBe('Vision par ordinateur');
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/skills.spec.ts`
Expected: FAIL, because `./skills` cannot be resolved.

- [ ] **Step 3: Write the implementation**

`src/lib/skills.ts`:
```ts
import type { Lang, Localized } from '$lib/i18n/lang';

/** One 24×24 SVG path, drawn with fill="currentColor". */
export type SkillIcon = { path: string };

export type Skill = {
	/** A plain string for proper nouns (Rust, Docker), `{ en, fr }` when it translates. */
	name: string | Localized;
	icon: SkillIcon;
};

export type SkillGroupId = 'backend' | 'systems' | 'devops' | 'ai' | 'blockchain' | 'frontend';

export type SkillGroup = { id: SkillGroupId; title: Localized; skills: Skill[] };

export function skillName(skill: Skill, lang: Lang): string {
	return typeof skill.name === 'string' ? skill.name : skill.name[lang];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/skills.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/skills.ts src/lib/skills.spec.ts
git commit -m "feat: add skill types and skillName helper"
```

---

### Task 2: Skill icons and content

**Files:**
- Modify: `package.json`, `package-lock.json` (via `npm i -D`)
- Create: `src/lib/data/skill-icons.ts`
- Create: `src/lib/data/skills.ts`
- Test: `src/lib/data/skills.spec.ts`

**Interfaces:**
- Consumes: `SkillIcon`, `SkillGroup`, `skillName` from `$lib/skills` (Task 1). `LANGS` from `$lib/i18n/lang`.
- Produces:
  ```ts
  // src/lib/data/skill-icons.ts
  export const HARDHAT: SkillIcon; export const CPU: SkillIcon;
  export const DATABASE: SkillIcon; export const CHAT: SkillIcon;
  // src/lib/data/skills.ts
  export const SKILL_GROUPS: SkillGroup[];
  ```

- [ ] **Step 1: Install simple-icons**

Run: `npm i -D simple-icons@^16.33.0`
Expected: `package.json` gains `"simple-icons": "^16.33.0"` under `devDependencies`. It's a devDependency because the site is fully prerendered, so nothing is installed at runtime.

- [ ] **Step 2: Write the failing data test**

`src/lib/data/skills.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { LANGS } from '$lib/i18n/lang';
import { skillName } from '$lib/skills';
import { SKILL_GROUPS } from './skills';

const allSkills = SKILL_GROUPS.flatMap((g) => g.skills);

describe('skill data', () => {
	it('lists the groups in the positioning order', () => {
		expect(SKILL_GROUPS.map((g) => g.id)).toEqual([
			'backend',
			'systems',
			'devops',
			'ai',
			'blockchain',
			'frontend'
		]);
	});

	it('has at least one skill in every group', () => {
		const empty = SKILL_GROUPS.filter((g) => g.skills.length === 0).map((g) => g.id);
		expect(empty).toEqual([]);
	});

	it('puts each skill in exactly one group', () => {
		const names = allSkills.map((s) => skillName(s, 'en').toLowerCase());
		const dupes = names.filter((n, i) => names.indexOf(n) !== i);
		expect(dupes).toEqual([]);
	});

	it('has non-empty text in both languages', () => {
		for (const group of SKILL_GROUPS) {
			for (const lang of LANGS) {
				expect(group.title[lang].trim(), group.id).not.toBe('');
				for (const skill of group.skills)
					expect(skillName(skill, lang).trim(), JSON.stringify(skill.name)).not.toBe('');
			}
		}
	});

	it('gives every skill a well-formed SVG path', () => {
		const bad = allSkills
			.filter((s) => !/^[Mm][MmLlHhVvCcSsQqTtAaZz0-9.,\s-]*$/.test(s.icon.path))
			.map((s) => skillName(s, 'en'));
		expect(bad).toEqual([]);
	});
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/lib/data/skills.spec.ts`
Expected: FAIL, because `./skills` cannot be resolved.

- [ ] **Step 4: Write the hand-drawn icons**

`src/lib/data/skill-icons.ts`. These are filled 24×24 paths. Holes are subpaths wound the **opposite** way to their outline, so they stay empty under the default `nonzero` fill rule. Don't reorder the commands.
```ts
import type { SkillIcon } from '$lib/skills';

/** Hard hat with an Ethereum diamond cut out (Hardhat). Dome and brim clockwise, diamond counter-clockwise. */
export const HARDHAT: SkillIcon = {
	path: 'M4 16a8 8 0 0 1 16 0zM2 16h20v3H2zM12 9.5l-2.2 3 2.2 2.5 2.2-2.5z'
};

/** CPU chip with a hollow ring, a solid core and 3 pins per side (x86-64 Assembly). */
export const CPU: SkillIcon = {
	path:
		'M6 6h12v12H6zM9 9v6h6V9zM10.5 10.5h3v3h-3z' +
		'M8.25 2h1.5v4h-1.5zM11.25 2h1.5v4h-1.5zM14.25 2h1.5v4h-1.5z' +
		'M8.25 18h1.5v4h-1.5zM11.25 18h1.5v4h-1.5zM14.25 18h1.5v4h-1.5z' +
		'M2 8.25h4v1.5H2zM2 11.25h4v1.5H2zM2 14.25h4v1.5H2z' +
		'M18 8.25h4v1.5h-4zM18 11.25h4v1.5h-4zM18 14.25h4v1.5h-4z'
};

/** Database cylinder: a top cap and two bands (SQL). */
export const DATABASE: SkillIcon = {
	path:
		'M4 5a8 3 0 1 0 16 0a8 3 0 1 0-16 0z' +
		'M4 6.5V11c0 1.66 3.58 3 8 3s8-1.34 8-3V6.5c0 1.66-3.58 3-8 3s-8-1.34-8-3z' +
		'M4 12.5V17c0 1.66 3.58 3 8 3s8-1.34 8-3v-4.5c0 1.66-3.58 3-8 3s-8-1.34-8-3z'
};

/** Chat bubble with three dots cut out (Prompt engineering). */
export const CHAT: SkillIcon = {
	path:
		'M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z' +
		'M6.75 10a1.25 1.25 0 1 0 2.5 0a1.25 1.25 0 1 0-2.5 0z' +
		'M10.75 10a1.25 1.25 0 1 0 2.5 0a1.25 1.25 0 1 0-2.5 0z' +
		'M14.75 10a1.25 1.25 0 1 0 2.5 0a1.25 1.25 0 1 0-2.5 0z'
};
```

- [ ] **Step 5: Write the content**

`src/lib/data/skills.ts`:
```ts
import {
	siC,
	siDjango,
	siDocker,
	siExpress,
	siGit,
	siGithubactions,
	siIpfs,
	siJavascript,
	siKubernetes,
	siLinux,
	siNginx,
	siNodedotjs,
	siOllama,
	siOpencv,
	siOpenjdk,
	siPandas,
	siPostgresql,
	siPython,
	siPytorch,
	siReact,
	siRust,
	siScikitlearn,
	siSolana,
	siSolidity,
	siSvelte,
	siTailwindcss,
	siTypescript,
	siXrp
} from 'simple-icons';
import type { SkillGroup } from '$lib/skills';
import { CHAT, CPU, DATABASE, HARDHAT } from './skill-icons';

/** Group and chip order is display order. Each skill belongs to exactly one group. */
export const SKILL_GROUPS: SkillGroup[] = [
	{
		id: 'backend',
		title: { en: 'Backend', fr: 'Backend' },
		skills: [
			{ name: 'Python', icon: siPython },
			{ name: 'Node.js', icon: siNodedotjs },
			{ name: 'Express', icon: siExpress },
			{ name: 'Django', icon: siDjango },
			{ name: 'Java', icon: siOpenjdk },
			{ name: 'SQL', icon: DATABASE },
			{ name: 'PostgreSQL', icon: siPostgresql }
		]
	},
	{
		id: 'systems',
		title: { en: 'Systems & Low-level', fr: 'Systèmes & bas niveau' },
		skills: [
			{ name: 'Rust', icon: siRust },
			{ name: 'C', icon: siC },
			{ name: 'x86-64 Assembly', icon: CPU },
			{ name: 'Linux', icon: siLinux }
		]
	},
	{
		id: 'devops',
		title: { en: 'DevOps & Tools', fr: 'DevOps & outils' },
		skills: [
			{ name: 'Docker', icon: siDocker },
			{ name: 'Kubernetes', icon: siKubernetes },
			{ name: 'Nginx', icon: siNginx },
			{ name: 'GitHub Actions (CI/CD)', icon: siGithubactions },
			{ name: 'Git', icon: siGit }
		]
	},
	{
		id: 'ai',
		title: { en: 'AI & ML', fr: 'IA & ML' },
		skills: [
			{ name: 'PyTorch', icon: siPytorch },
			{ name: 'scikit-learn', icon: siScikitlearn },
			{ name: 'pandas', icon: siPandas },
			{ name: { en: 'Computer Vision', fr: 'Vision par ordinateur' }, icon: siOpencv },
			{ name: { en: 'LLM agents', fr: 'Agents LLM' }, icon: siOllama },
			{ name: { en: 'Prompt engineering', fr: 'Ingénierie de prompts' }, icon: CHAT }
		]
	},
	{
		id: 'blockchain',
		title: { en: 'Blockchain', fr: 'Blockchain' },
		skills: [
			{ name: 'Solidity', icon: siSolidity },
			{ name: 'Hardhat', icon: HARDHAT },
			{ name: 'Solana', icon: siSolana },
			{ name: 'XRPL', icon: siXrp },
			{ name: 'IPFS', icon: siIpfs }
		]
	},
	{
		id: 'frontend',
		title: { en: 'Frontend', fr: 'Frontend' },
		skills: [
			{ name: 'TypeScript', icon: siTypescript },
			{ name: 'JavaScript', icon: siJavascript },
			{ name: 'SvelteKit', icon: siSvelte },
			{ name: 'React', icon: siReact },
			{ name: 'Tailwind CSS', icon: siTailwindcss }
		]
	}
];
```
(`SimpleIcon` objects have a `path: string` field, so they satisfy `SkillIcon` structurally.)

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/lib/data/skills.spec.ts src/lib/skills.spec.ts`
Expected: PASS (5 + 2 tests).

- [ ] **Step 7: Visual check of the hand-drawn icons (Review Focus 3)**

Render the four hand-drawn icons to a PNG contact sheet in the scratchpad and look at it with the Read tool. `$SCRATCH` is the session scratchpad directory from the system prompt.

```bash
mkdir -p "$SCRATCH/icons" && npm i --prefix "$SCRATCH/icons" sharp --silent
cat > "$SCRATCH/icons/sheet.mjs" <<'EOF'
import sharp from 'sharp';
import * as icons from '/home/lezard/portfolio/.claude/worktrees/milestone-4-skills/src/lib/data/skill-icons.ts';
const names = Object.keys(icons);
const cells = names.map((n, i) =>
	`<g transform="translate(${i * 140 + 10} 10) scale(5)"><path d="${icons[n].path}" fill="#111"/></g>` +
	`<text x="${i * 140 + 70}" y="150" font-size="14" text-anchor="middle">${n}</text>`);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${names.length * 140}" height="165"><rect width="100%" height="100%" fill="#fff"/>${cells.join('')}</svg>`;
await sharp(Buffer.from(svg)).png().toFile(new URL('./sheet.png', import.meta.url).pathname);
EOF
node "$SCRATCH/icons/sheet.mjs"
```
Node 24 strips the `import type` from the `.ts` file on its own. Then Read `$SCRATCH/icons/sheet.png` and check:
- HARDHAT is a dome on a brim, with a visible **empty** diamond in the dome.
- CPU is a square ring with a solid core and 3 pins on each side.
- DATABASE is an ellipse cap over two curved bands, with gaps between them.
- CHAT is a rounded bubble with a tail at the bottom-left and three **empty** dots.

If a hole shows as filled, reverse that hole's subpath direction and re-render. Nothing from this step is committed.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/lib/data/skill-icons.ts src/lib/data/skills.ts src/lib/data/skills.spec.ts
git commit -m "feat: add skill groups content with brand and hand-drawn icons"
```

---

### Task 3: Skills section

**Files:**
- Create: `src/lib/components/skills/SkillGroupIcon.svelte`
- Rewrite: `src/lib/components/sections/Skills.svelte`
- Modify: `src/routes/[lang=lang]/+page.svelte` (the `<Skills {t} />` line)

**Interfaces:**
- Consumes: `SKILL_GROUPS` (Task 2); `skillName`, `SkillGroupId` (Task 1); `DomainIcon` (`src/lib/components/projects/DomainIcon.svelte`, props `{ domain: Domain; size?: number }`, where `Domain = 'web' | 'blockchain' | 'ai' | 'low-level' | 'games'` from `$lib/projects`); `Section` (props `{ id: SectionId; title: string; children }`); `Lang` from `$lib/i18n`.
- Produces: `SkillGroupIcon` with props `{ id: SkillGroupId; size?: number }`; `Skills` with props `{ lang: Lang; title: string }`.

- [ ] **Step 1: Write `SkillGroupIcon.svelte`**

Four groups reuse the matching `DomainIcon` shape, so the icons stay consistent with the project cards. Backend (a server stack) and DevOps (a cycle of two arrows) are new, drawn in the same stroke style.

`src/lib/components/skills/SkillGroupIcon.svelte`:
```svelte
<script lang="ts">
	import type { Domain } from '$lib/projects';
	import type { SkillGroupId } from '$lib/skills';
	import DomainIcon from '../projects/DomainIcon.svelte';

	let { id, size = 24 }: { id: SkillGroupId; size?: number } = $props();

	const DOMAIN_ICON: Partial<Record<SkillGroupId, Domain>> = {
		systems: 'low-level',
		ai: 'ai',
		blockchain: 'blockchain',
		frontend: 'web'
	};
	const domain = $derived(DOMAIN_ICON[id]);
</script>

{#if domain}
	<DomainIcon {domain} {size} />
{:else}
	<svg
		viewBox="0 0 24 24"
		width={size}
		height={size}
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		{#if id === 'backend'}
			<rect x="3" y="4" width="18" height="7" rx="1.5" />
			<rect x="3" y="13" width="18" height="7" rx="1.5" />
			<path d="M7 7.5h.01M7 16.5h.01" />
		{:else}
			<path d="M20 12a8 8 0 0 1-13.66 5.66M4 12a8 8 0 0 1 13.66-5.66" />
			<path d="M18 3v4h-4M6 21v-4h4" />
		{/if}
	</svg>
{/if}
```

- [ ] **Step 2: Rewrite `Skills.svelte`**

`src/lib/components/sections/Skills.svelte`:
```svelte
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
```

- [ ] **Step 3: Pass narrowed props from the page**

In `src/routes/[lang=lang]/+page.svelte`, replace:
```svelte
	<Skills {t} />
```
with:
```svelte
	<Skills lang={data.lang} title={t.sections.skills} />
```

- [ ] **Step 4: Type-check, test, lint**

Run: `npm run check && npm test && npm run lint`
Expected: svelte-check reports 0 errors and 0 warnings, and all tests pass. If Prettier complains, run `npm run format`, then re-run `npm run lint`.

- [ ] **Step 5: Build and verify the output (Review Focus 1, 2, 4)**

```bash
npm run build
grep -c 'Vision par ordinateur' build/fr/index.html   # expect ≥1
grep -c 'Ingénierie de prompts' build/fr/index.html   # expect ≥1
grep -c 'Computer Vision' build/en/index.html         # expect ≥1
grep -c 'Vision par ordinateur' build/en/index.html   # expect 0
grep -c 'Systèmes &amp; bas niveau' build/fr/index.html  # expect ≥1
grep -o 'fill="currentColor"' build/en/index.html | wc -l  # expect ≥ 30 (one per chip, 32 chips)
grep -rl '1Password' build/ | wc -l                   # expect 0: the unused icons are tree-shaken away
```
If the `1Password` grep finds files, the whole `simple-icons` index was bundled. Stop and report it instead of shipping. Also check with `du -sh build/_app` that the JS stays small; compare it with `master` if in doubt.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/skills/SkillGroupIcon.svelte src/lib/components/sections/Skills.svelte "src/routes/[lang=lang]/+page.svelte"
git commit -m "feat: render skills section with grouped logo chips"
```

---

### Task 4: Review guide and PR

**Files:**
- Create: `docs/reviews/milestone-4-review-guide.md`

**Interfaces:**
- Consumes: everything above.
- Produces: a pushed branch `milestone-4-skills` and an open PR to `master`.

- [ ] **Step 1: Write the review guide**

Follow the structure of `docs/reviews/milestone-3-review-guide.md`: what changed, how to run it, then a checklist. The checklist must include:
- `npm run dev`, open `/en/#skills` and `/fr/#skills`: six groups in order Backend, Systems & Low-level, DevOps & Tools, AI & ML, Blockchain, Frontend, with French titles and the three translated chips on `/fr/`.
- Toggle the theme: every logo is visible (muted grey) in **both** dark and light, and the accent top bars follow the theme accent.
- The cards look clearly different from the project cards: no background, no side borders, just an accent line on top.
- Hand-drawn icons: Hardhat (hard hat with diamond), x86-64 Assembly (chip), SQL (database), Prompt engineering (chat bubble) look right at chip size.
- Resize: 3 columns on desktop, 2 below ~1024px, 1 below 640px. At 360px nothing overflows horizontally and the long FR chips wrap.
- Nothing in the section reacts to hover or click.
- The content is yours to edit in `src/lib/data/skills.ts`: add, remove or reorder chips there.

- [ ] **Step 2: Commit, push, open the PR**

```bash
git add docs/reviews/milestone-4-review-guide.md
git commit -m "docs: add Milestone 4 review guide"
git push -u origin worktree-milestone-4-skills:milestone-4-skills
gh pr create --base master --head milestone-4-skills --title "Milestone 4: Skills" --body "<summary of the four tasks, link to docs/reviews/milestone-4-review-guide.md, test/check/build results>"
```
Then stop: the user reviews the PR before anything is merged.
