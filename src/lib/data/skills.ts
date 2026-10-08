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
import { ICONS } from './icons';
import { CHAT, CPU, DATABASE, HARDHAT, NEURAL_NET } from './skill-icons';
import { typeset } from '$lib/i18n/typography';

// French text may use plain spaces and straight apostrophes: typeset() adds the no-break spaces and ’ (docs/content-guide.md).

/** Group and chip order is display order. Each skill belongs to exactly one group. */
export const SKILL_GROUPS: SkillGroup[] = typeset([
	{
		id: 'backend',
		icon: ICONS.server,
		title: { en: 'Backend', fr: 'Backend' },
		description: {
			en: 'APIs, databases, authentication and services.',
			fr: 'APIs, bases de données, authentification et services.'
		},
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
		icon: ICONS.chip,
		title: { en: 'Systems & Low-level', fr: 'Systèmes & bas niveau' },
		description: {
			en: 'Code close to the machine: memory, processes, performance.',
			fr: 'Du code proche de la machine\u00a0: mémoire, processus, performance.'
		},
		skills: [
			{ name: 'Rust', icon: siRust },
			{ name: 'C', icon: siC },
			{ name: 'x86-64 Assembly', icon: CPU },
			{ name: 'Linux', icon: siLinux }
		]
	},
	{
		id: 'devops',
		icon: ICONS.cycle,
		title: { en: 'DevOps & Tools', fr: 'DevOps & outils' },
		description: {
			en: 'Containers, deployment and continuous integration.',
			fr: 'Conteneurs, déploiement et intégration continue.'
		},
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
		icon: ICONS.sparkles,
		title: { en: 'AI & ML', fr: 'IA & ML' },
		description: {
			en: 'Vision models, training and LLM agents.',
			fr: 'Modèles de vision, entraînement et agents LLM.'
		},
		skills: [
			{ name: 'PyTorch', icon: siPytorch },
			{ name: 'scikit-learn', icon: siScikitlearn },
			{ name: 'Deep Learning', icon: NEURAL_NET },
			{ name: 'Computer Vision', icon: siOpencv },
			{ name: { en: 'LLM agents', fr: 'Agents LLM' }, icon: siOllama },
			{ name: 'Prompt engineering', icon: CHAT }
		]
	},
	{
		id: 'blockchain',
		icon: ICONS.cube,
		title: { en: 'Blockchain', fr: 'Blockchain' },
		description: {
			en: 'Smart contracts, tokens and data anchored on-chain.',
			fr: 'Smart contracts, tokens et données ancrées on-chain.'
		},
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
		icon: ICONS.code,
		title: { en: 'Frontend', fr: 'Frontend' },
		description: {
			en: 'Web interfaces when a project calls for them.',
			fr: 'Des interfaces web quand le projet le demande.'
		},
		skills: [
			{ name: 'TypeScript', icon: siTypescript },
			{ name: 'JavaScript', icon: siJavascript },
			{ name: 'SvelteKit', icon: siSvelte },
			{ name: 'React', icon: siReact },
			{ name: 'Tailwind CSS', icon: siTailwindcss }
		]
	}
]);
